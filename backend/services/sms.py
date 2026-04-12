"""
SMS Service - AliCloud SMS integration
支持阿里云短信发送，支持环境变量配置
"""
import json
import hmac
import hashlib
import base64
import urllib.parse
from datetime import datetime
from typing import Optional, Union
import requests

from config.settings import (
    SMS_PROVIDER,
    SMS_ACCESS_KEY_ID,
    SMS_ACCESS_KEY_SECRET,
    SMS_SIGN_NAME,
    SMS_TEMPLATE_CODE,
    SMS_INVITE_TEMPLATE_CODE
)
from utils.logger import setup_logger

logger = setup_logger()


class AliCloudSMS:
    """AliCloud SMS service implementation"""

    def __init__(self, access_key_id: str = None, access_key_secret: str = None,
                 sign_name: str = None, template_code: str = None):
        self.access_key_id = access_key_id or SMS_ACCESS_KEY_ID
        self.access_key_secret = access_key_secret or SMS_ACCESS_KEY_SECRET
        self.sign_name = sign_name or SMS_SIGN_NAME
        self.template_code = template_code or SMS_TEMPLATE_CODE
        self.invite_template_code = SMS_INVITE_TEMPLATE_CODE
        self.endpoint = "dysmsapi.aliyuncs.com"

    def _percent_encode(self, s: str) -> str:
        """Special percent encoding for AliCloud API"""
        encoded = urllib.parse.quote(s, safe='')
        encoded = encoded.replace('+', '%20')
        encoded = encoded.replace('*', '%2A')
        encoded = encoded.replace('%7E', '~')
        return encoded

    def _calculate_signature(self, params: dict) -> str:
        """Calculate HMAC-SHA1 signature according to AliCloud spec"""
        # Sort parameters by key
        sorted_params = sorted(params.items())

        # Construct query string
        query_string = ''
        for key, value in sorted_params:
            query_string += f"{self._percent_encode(key)}={self._percent_encode(value)}&"
        query_string = query_string[:-1]

        # Construct string to sign
        string_to_sign = f"GET&{self._percent_encode('/')}&{self._percent_encode(query_string)}"

        # Calculate HMAC-SHA1
        key = (self.access_key_secret + '&').encode('utf-8')
        message = string_to_sign.encode('utf-8')
        signature = base64.b64encode(hmac.new(key, message, hashlib.sha1).digest())
        return signature.decode('utf-8')

    def send_verification_code(self, phone: str, code: str) -> bool:
        """
        Send verification code via SMS
        :param phone: Target phone number
        :param code: 6-digit verification code
        :return: True if success
        """
        if not self.access_key_id or not self.access_key_secret:
            logger.warning(f"SMS not configured, verification code for {phone}: {code}")
            return True

        if not self.sign_name or not self.template_code:
            logger.error("SMS sign name or template code not configured")
            return False

        # Build request parameters
        params = {
            'Action': 'SendSms',
            'Version': '2017-05-25',
            'AccessKeyId': self.access_key_id,
            'Timestamp': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
            'Format': 'JSON',
            'SignatureMethod': 'HMAC-SHA1',
            'SignatureVersion': '1.0',
            'SignatureNonce': str(int(datetime.now().timestamp() * 1000000)),
            'RegionId': 'cn-hangzhou',
            'PhoneNumbers': phone,
            'SignName': self.sign_name,
            'TemplateCode': self.template_code,
            'TemplateParam': json.dumps({'code': code})
        }

        # Calculate signature
        params['Signature'] = self._calculate_signature(params)

        # Build request URL
        url = f"https://{self.endpoint}/?{urllib.parse.urlencode(params)}"

        try:
            response = requests.get(url, timeout=10)
            result = response.json()

            if 'Code' in result and result['Code'] == 'OK':
                logger.info(f"SMS verification code sent to {phone} via AliCloud")
                return True
            else:
                error_msg = result.get('Message', 'Unknown error')
                logger.error(f"SMS send failed: {error_msg}")
                return False
        except Exception as e:
            logger.error(f"SMS API request error: {str(e)}")
            return False

    def send_invitation_notice(self, phone: str, org_name: str, inviter_name: str, invite_code: str) -> bool:
        """Send an organization invitation SMS when a dedicated template is configured."""
        if not self.access_key_id or not self.access_key_secret:
            logger.warning(f"SMS invite not configured, invitation for {phone}: org={org_name}, code={invite_code}")
            return False

        if not self.sign_name or not self.invite_template_code:
            logger.warning("SMS invite template not configured, invitation requires manual delivery")
            return False

        params = {
            'Action': 'SendSms',
            'Version': '2017-05-25',
            'AccessKeyId': self.access_key_id,
            'Timestamp': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
            'Format': 'JSON',
            'SignatureMethod': 'HMAC-SHA1',
            'SignatureVersion': '1.0',
            'SignatureNonce': str(int(datetime.now().timestamp() * 1000000)),
            'RegionId': 'cn-hangzhou',
            'PhoneNumbers': phone,
            'SignName': self.sign_name,
            'TemplateCode': self.invite_template_code,
            'TemplateParam': json.dumps({
                'org_name': org_name,
                'inviter_name': inviter_name,
                'invite_code': invite_code,
            })
        }
        params['Signature'] = self._calculate_signature(params)
        url = f"https://{self.endpoint}/?{urllib.parse.urlencode(params)}"

        try:
            response = requests.get(url, timeout=10)
            result = response.json()
            if result.get('Code') == 'OK':
                logger.info(f"Invitation SMS sent to {phone} for org {org_name}")
                return True
            logger.error(f"Invitation SMS failed: {result.get('Message', 'Unknown error')}")
            return False
        except Exception as e:
            logger.error(f"Invitation SMS request error: {str(e)}")
            return False


class TencentSMS:
    """Tencent Cloud SMS service implementation (placeholder for future support)"""

    def __init__(self):
        pass

    def send_verification_code(self, phone: str, code: str) -> bool:
        logger.error("TencentCloud SMS not implemented yet")
        return False


class SMSFactory:
    """SMS service factory"""

    _instance: Optional[Union[AliCloudSMS, TencentSMS]] = None

    @classmethod
    def get_instance(cls) -> Union[AliCloudSMS, TencentSMS]:
        """Get singleton instance"""
        if cls._instance is None:
            if SMS_PROVIDER == 'alicloud':
                cls._instance = AliCloudSMS()
            elif SMS_PROVIDER == 'tencent':
                cls._instance = TencentSMS()
            else:
                raise ValueError(f"Unknown SMS provider: {SMS_PROVIDER}")
        return cls._instance

    @classmethod
    def send_verification_code(cls, phone: str, code: str) -> bool:
        """Convenience method to send verification code"""
        return cls.get_instance().send_verification_code(phone, code)
