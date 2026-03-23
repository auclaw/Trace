"""
WeChat Pay integration
Complete payment flow: create order -> prepay -> callback notification -> update subscription
"""
import hashlib
import xml.etree.ElementTree as ET
import random
import string
from datetime import datetime, timedelta
from typing import Optional, Dict, Tuple
import requests

from config.settings import (
    WECHAT_APP_ID,
    WECHAT_PAY_MCH_ID,
    WECHAT_PAY_API_KEY,
    WECHAT_PAY_NOTIFY_URL
)
from utils.logger import setup_logger

logger = setup_logger()


class WechatPay:
    """WeChat Pay V3/V2 API integration (using V2 for compatibility with native apps)"""

    def __init__(self, app_id: str = None, mch_id: str = None, api_key: str = None):
        self.app_id = app_id or WECHAT_APP_ID
        self.mch_id = mch_id or WECHAT_PAY_MCH_ID
        self.api_key = api_key or WECHAT_PAY_API_KEY
        self.notify_url = WECHAT_PAY_NOTIFY_URL
        self.gateway_url = "https://api.mch.weixin.qq.com/pay/unifiedorder"

    def is_configured(self) -> bool:
        """Check if WeChat pay is properly configured"""
        return all([self.app_id, self.mch_id, self.api_key])

    def _generate_nonce(self, length: int = 32) -> str:
        """Generate random nonce string"""
        chars = string.ascii_letters + string.digits
        return ''.join(random.choice(chars) for _ in range(length))

    def _generate_signature(self, params: Dict) -> str:
        """Generate MD5 signature according to WeChat Pay spec"""
        # Sort parameters by key
        sorted_keys = sorted(params.keys())
        sign_str = ''
        for key in sorted_keys:
            if key != 'sign' and params[key] != '':
                sign_str += f"{key}={params[key]}&"
        sign_str += f"key={self.api_key}"
        # Generate MD5 hash
        return hashlib.md5(sign_str.encode('utf-8')).hexdigest().upper()

    def _check_signature(self, params: Dict) -> bool:
        """Verify callback signature"""
        if 'sign' not in params:
            return False
        received_sign = params['sign']
        calculated_sign = self._generate_signature(params)
        return received_sign == calculated_sign

    @staticmethod
    def _dict_to_xml(data: Dict, root_name: str = 'xml') -> str:
        """Convert dict to XML for WeChat Pay"""
        xml = f'<{root_name}>'
        for key, value in data.items():
            xml += f'<{key}>{value}</{key}>'
        xml += f'</{root_name}>'
        return xml

    @staticmethod
    def _xml_to_dict(xml_str: str) -> Dict:
        """Parse XML response to dict"""
        root = ET.fromstring(xml_str)
        result = {}
        for child in root:
            result[child.tag] = child.text.strip() if child.text else ''
        return result

    def create_order(self, order_no: str, user_id: int, total_fee: int,
                     body: str, notify_url: str = None) -> Tuple[bool, Dict]:
        """
        Create unified order and get prepay info
        :param order_no: Internal order number
        :param user_id: User ID
        :param total_fee: Total fee in cents (e.g., 2900 = 29.00 CNY)
        :param body: Product description
        :param notify_url: Notification callback URL
        :return: (success, prepay_data or error)
        """
        if not self.is_configured():
            return False, {'errmsg': 'WeChat Pay not configured'}

        notify_url = notify_url or self.notify_url
        if not notify_url:
            return False, {'errmsg': 'Notify URL not configured'}

        # Build request parameters
        params = {
            'appid': self.app_id,
            'mch_id': self.mch_id,
            'nonce_str': self._generate_nonce(),
            'body': body,
            'out_trade_no': order_no,
            'total_fee': str(total_fee),
            'spbill_create_ip': '127.0.0.1',  # Will be overridden by actual client IP in production
            'notify_url': notify_url,
            'trade_type': 'NATIVE',  # Native payment (QR code)
        }

        # Generate signature
        params['sign'] = self._generate_signature(params)

        # Convert to XML and send request
        xml_data = self._dict_to_xml(params)
        try:
            response = requests.post(self.gateway_url, data=xml_data.encode('utf-8'), timeout=30)
            result = self._xml_to_dict(response.text)

            if result.get('return_code') == 'SUCCESS' and result.get('result_code') == 'SUCCESS':
                # Success, return prepay data
                prepay_data = {
                    'appid': self.app_id,
                    'mchid': self.mch_id,
                    'prepay_id': result['prepay_id'],
                    'code_url': result['code_url'],  # QR code URL
                    'order_no': order_no,
                }
                # Generate sign for prepay
                prepay_data['sign'] = self._generate_signature(prepay_data)
                logger.info(f"WeChat order created: {order_no} for user {user_id}, amount {total_fee/100:.2f} CNY")
                return True, prepay_data
            else:
                errmsg = result.get('errmsg', result.get('return_msg', 'Unknown error'))
                logger.error(f"WeChat order creation failed: {errmsg}")
                return False, {'errmsg': errmsg}
        except Exception as e:
            logger.error(f"WeChat Pay API request error: {str(e)}")
            return False, {'errmsg': str(e)}

    def process_notification(self, xml_data: str) -> Tuple[bool, Dict, str]:
        """
        Process payment callback notification from WeChat
        :param xml_data: Raw XML notification from WeChat
        :return: (success, result_dict, response_xml_to_return)
        """
        try:
            data = self._xml_to_dict(xml_data)
            logger.info(f"Received WeChat payment notification: {data.get('out_trade_no')}")

            # Check signature
            if not self._check_signature(data):
                logger.error("Invalid signature in WeChat payment notification")
                return False, data, self._generate_response_xml(False, 'invalid signature')

            # Check return code
            if data.get('return_code') != 'SUCCESS':
                errmsg = data.get('return_msg', 'Unknown error')
                logger.error(f"WeChat notification error: {errmsg}")
                return False, data, self._generate_response_xml(False, errmsg)

            # Check payment result
            if data.get('result_code') != 'SUCCESS':
                errmsg = data.get('errmsg', 'Unknown error')
                logger.error(f"WeChat payment failed: {errmsg}")
                return False, data, self._generate_response_xml(False, errmsg)

            # Success payment
            order_no = data.get('out_trade_no', '')
            transaction_id = data.get('transaction_id', '')
            openid = data.get('openid', '')
            total_fee = int(data.get('total_fee', 0))

            logger.info(f"Payment successful: order={order_no}, transaction={transaction_id}, fee={total_fee/100:.2f}")
            return True, data, self._generate_response_xml(True, 'OK')
        except Exception as e:
            logger.error(f"Error processing WeChat notification: {str(e)}")
            return False, {}, self._generate_response_xml(False, 'internal error')

    def generate_jsapi_params(self, prepay_id: str) -> Dict:
        """Generate JSAPI parameters for frontend"""
        params = {
            'appId': self.app_id,
            'timeStamp': str(int(datetime.now().timestamp())),
            'nonceStr': self._generate_nonce(),
            'package': f'prepay_id={prepay_id}',
            'signType': 'MD5',
        }
        params['paySign'] = self._generate_signature(params)
        return params

    def _generate_response_xml(self, success: bool, msg: str) -> str:
        """Generate response XML for WeChat callback"""
        code = 'SUCCESS' if success else 'FAIL'
        return self._dict_to_xml({'return_code': code, 'return_msg': msg})


class SubscriptionPlans:
    """Subscription plan definitions"""

    PLANS = {
        'monthly': {
            'name': '月度订阅',
            'days': 30,
            'amount_cents': 2900,  # 29.00 CNY
            'amount_yuan': 29.00,
        },
        'yearly': {
            'name': '年度订阅',
            'days': 365,
            'amount_cents': 19900,  # 199.00 CNY
            'amount_yuan': 199.00,
        }
    }

    @classmethod
    def get_plan(cls, plan_type: str) -> Optional[Dict]:
        """Get plan by type"""
        return cls.PLANS.get(plan_type)

    @classmethod
    def list_plans(cls) -> Dict:
        """List all available plans"""
        return cls.PLANS
