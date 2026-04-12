"""
WeChat OAuth 2.0 Authentication
完整的微信二维码登录 OAuth 2.0 流程
"""
import json
from datetime import datetime, timedelta
import requests
from typing import Tuple, Optional, Dict
from config.settings import WECHAT_APP_ID, WECHAT_APP_SECRET
from utils.database import get_db_connection
from utils.logger import setup_logger

logger = setup_logger()


class WechatAuth:
    """WeChat OAuth authentication service for QR code login"""

    def __init__(self, app_id: str = None, app_secret: str = None):
        self.app_id = app_id or WECHAT_APP_ID
        self.app_secret = app_secret or WECHAT_APP_SECRET

    def get_qrconnect_url(self, redirect_uri: str, state: str = None) -> str:
        """
        Get QR code connect URL for web QR login
        :param redirect_uri: Callback URL after login
        :param state: Optional state parameter for CSRF protection
        :return: Authorization URL
        """
        url = (f"https://open.weixin.qq.com/connect/qrconnect"
                f"?appid={self.app_id}"
                f"&redirect_uri={redirect_uri}"
                f"&response_type=code"
                f"&scope=snsapi_login")
        if state:
            url += f"&state={state}"
        return url + '#wechat_redirect'

    def code_to_openid(self, code: str) -> Tuple[bool, str]:
        """
        Exchange code for openid and access token
        :param code: Code from callback
        :return: (success, openid or error message)
        """
        if not self.app_id or not self.app_secret:
            return False, "WeChat app not configured"

        url = (f"https://api.weixin.qq.com/sns/oauth2/access_token"
               f"?appid={self.app_id}"
               f"&secret={self.app_secret}"
               f"&code={code}"
               f"&grant_type=authorization_code")

        try:
            response = requests.get(url, timeout=10)
            data = response.json()

            if 'openid' in data and 'access_token' in data:
                openid = data['openid']
                access_token = data['access_token']
                expires_in = data.get('expires_in', 7200)
                refresh_token = data.get('refresh_token', '')
                logger.info(f"WeChat code exchanged for openid: {openid[:8]}...")
                # Cache the tokens (optional for future use)
                self._cache_tokens(openid, access_token, expires_in, refresh_token)
                return True, openid
            else:
                error_msg = data.get('errmsg', 'Unknown error')
                errcode = data.get('errcode', -1)
                logger.error(f"WeChat code exchange failed: {errcode} - {error_msg}")
                return False, error_msg
        except Exception as e:
            logger.error(f"WeChat API request failed: {str(e)}")
            return False, str(e)

    def get_user_info(self, access_token: str, openid: str) -> Tuple[bool, Dict]:
        """
        Get user info from WeChat (if needed in future)
        :param access_token: Access token from code exchange
        :param openid: User openid
        :return: (success, user_info dict)
        """
        url = (f"https://api.weixin.qq.com/sns/userinfo"
               f"?access_token={access_token}"
               f"&openid={openid}"
               f"&lang=zh_CN")
        try:
            response = requests.get(url, timeout=10)
            data = response.json()
            if 'errcode' not in data or data['errcode'] == 0:
                return True, data
            else:
                logger.error(f"Get user info failed: {data.get('errcode')} - {data.get('errmsg')}")
                return False, data
        except Exception as e:
            logger.error(f"Get user info request failed: {str(e)}")
            return False, {'errmsg': str(e)}

    def refresh_access_token(self, refresh_token: str) -> Dict:
        """Refresh expired access token"""
        url = (f"https://api.weixin.qq.com/sns/oauth2/refresh_token"
               f"?appid={self.app_id}"
               f"&grant_type=refresh_token"
               f"&refresh_token={refresh_token}")
        try:
            response = requests.get(url, timeout=10)
            return response.json()
        except Exception as e:
            logger.error(f"Refresh token failed: {str(e)}")
            return {'errcode': -1, 'errmsg': str(e)}

    def is_configured(self) -> bool:
        """Check if WeChat auth is properly configured"""
        return bool(self.app_id and self.app_secret)

    def _cache_tokens(self, openid: str, access_token: str, expires_in: int, refresh_token: str):
        """Persist WeChat OAuth tokens in SQLite for later refresh/user info calls."""
        expires_at = datetime.now() + timedelta(seconds=max(expires_in, 60))
        raw_payload = json.dumps({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'expires_in': expires_in,
        })
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                '''
                INSERT INTO wechat_token_cache (openid, access_token, refresh_token, expires_at, raw_payload, updated_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(openid) DO UPDATE SET
                    access_token = excluded.access_token,
                    refresh_token = excluded.refresh_token,
                    expires_at = excluded.expires_at,
                    raw_payload = excluded.raw_payload,
                    updated_at = CURRENT_TIMESTAMP
                ''',
                (openid, access_token, refresh_token, expires_at, raw_payload)
            )
            conn.commit()
        logger.debug(f"Persisted WeChat tokens for {openid[:8]}...")

    def get_cached_tokens(self, openid: str) -> Optional[Dict]:
        """Load cached WeChat token payload."""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                '''
                SELECT access_token, refresh_token, expires_at, raw_payload
                FROM wechat_token_cache
                WHERE openid = ?
                ''',
                (openid,)
            )
            row = cursor.fetchone()

        if not row:
            return None

        return {
            'access_token': row[0],
            'refresh_token': row[1],
            'expires_at': row[2],
            'raw_payload': json.loads(row[3]) if row[3] else {},
        }
