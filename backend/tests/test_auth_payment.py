import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

import app as app_module
from app import (
    _hash_verification_code,
    app,
    generate_access_token,
    get_verification_code,
    save_verification_code,
)
from config import settings
from services.sms import SMSFactory
from services.wechat_auth import WechatAuth
from services.wechat_pay import SubscriptionPlans, WechatPay
from utils import database


class AuthPaymentTests(unittest.TestCase):
    def setUp(self):
        self.temp_db = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
        self.addCleanup(lambda: os.unlink(self.temp_db.name) if os.path.exists(self.temp_db.name) else None)

        database.DATABASE_PATH = self.temp_db.name
        settings.DATABASE_PATH = self.temp_db.name
        app_module._sms_rate_limit.clear()
        app_module._login_rate_limit.clear()
        SMSFactory._instance = None
        database.init_database()

        self.client = app.test_client()

    def _insert_user(self, phone=None, email=None, openid=None, is_vip=1, expire_days=30):
        expire_at = datetime.now() + timedelta(days=expire_days)
        with database.get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                '''
                INSERT INTO users (phone, email, openid, created_at, is_vip, expire_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ''',
                (phone, email, openid, datetime.now(), is_vip, expire_at)
            )
            conn.commit()
            return cursor.lastrowid, expire_at

    def _create_auth_header(self, user_id: int):
        return {'Authorization': f'Bearer {generate_access_token(user_id)}'}

    def test_verification_code_hashing_uses_phone_salt(self):
        hash_a = _hash_verification_code('123456', '13800138000')
        hash_b = _hash_verification_code('123456', '13900139000')
        self.assertNotEqual(hash_a, hash_b)
        self.assertEqual(hash_a, _hash_verification_code('123456', '13800138000'))

    def test_save_and_get_verification_code(self):
        save_verification_code('13800138000', '123456')
        record = get_verification_code('13800138000')
        self.assertIsNotNone(record)
        self.assertEqual(record['code_hash'], _hash_verification_code('123456', '13800138000'))

    def test_subscription_plans_available(self):
        plans = SubscriptionPlans.list_plans()
        self.assertIsInstance(plans, dict)
        self.assertIn('monthly', plans)
        self.assertIn('yearly', plans)
        self.assertIn('name', plans['monthly'])
        self.assertIn('amount_cents', plans['yearly'])

    def test_wechat_token_cache_is_persisted(self):
        auth = WechatAuth(app_id='app-id', app_secret='secret')
        auth._cache_tokens('openid-1', 'access-token', 3600, 'refresh-token')
        cached = auth.get_cached_tokens('openid-1')

        self.assertIsNotNone(cached)
        self.assertEqual(cached['access_token'], 'access-token')
        self.assertEqual(cached['refresh_token'], 'refresh-token')
        self.assertEqual(cached['raw_payload']['expires_in'], 3600)

    def test_invite_member_creates_pending_membership_and_notification(self):
        inviter_id, _ = self._insert_user(phone='13800138000')
        invitee_id, _ = self._insert_user(phone='13900139000')

        with database.get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                '''
                INSERT INTO organizations (name, admin_user_id, domain, seat_count, billing_cycle, amount)
                VALUES (?, ?, ?, ?, ?, ?)
                ''',
                ('Trace Team', inviter_id, 'trace.local', 10, 'monthly', 199.0)
            )
            org_id = cursor.lastrowid
            cursor.execute(
                '''
                INSERT INTO org_members (org_id, user_id, role, status)
                VALUES (?, ?, 'admin', 'active')
                ''',
                (org_id, inviter_id)
            )
            conn.commit()

        response = self.client.post(
            '/api/org/invite',
            json={
                'org_id': org_id,
                'phone': '13900139000',
                'role': 'member',
                'message': '欢迎加入团队',
            },
            headers=self._create_auth_header(inviter_id)
        )
        payload = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload['code'], 200)
        self.assertEqual(payload['data']['notify_channel'], 'in_app')
        self.assertEqual(payload['data']['notify_status'], 'sent')

        with database.get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                '''
                SELECT invitee_user_id, contact_type, contact_value, status, notify_channel, notify_status
                FROM org_invitations
                WHERE org_id = ?
                ''',
                (org_id,)
            )
            invitation = cursor.fetchone()
            cursor.execute(
                '''
                SELECT role, status FROM org_members
                WHERE org_id = ? AND user_id = ?
                ''',
                (org_id, invitee_id)
            )
            membership = cursor.fetchone()
            cursor.execute(
                '''
                SELECT channel, status, target FROM notification_events
                WHERE user_id = ?
                ORDER BY id DESC LIMIT 1
                ''',
                (invitee_id,)
            )
            notification = cursor.fetchone()

        self.assertEqual(invitation[0], invitee_id)
        self.assertEqual(invitation[1], 'phone')
        self.assertEqual(invitation[2], '13900139000')
        self.assertEqual(invitation[3], 'pending')
        self.assertEqual(invitation[4], 'in_app')
        self.assertEqual(invitation[5], 'sent')
        self.assertEqual(membership[0], 'member')
        self.assertEqual(membership[1], 'pending')
        self.assertEqual(notification[0], 'in_app')
        self.assertEqual(notification[1], 'sent')
        self.assertEqual(notification[2], '13900139000')

    def test_wechat_payment_notification_marks_order_paid_and_extends_subscription(self):
        user_id, _ = self._insert_user(phone='13800138000', is_vip=0, expire_days=-1)
        plan = SubscriptionPlans.get_plan('monthly')
        order_no = 'MZTEST10001'

        with database.get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                '''
                INSERT INTO subscription_orders
                (order_no, user_id, plan_type, amount, status, days)
                VALUES (?, ?, ?, ?, ?, ?)
                ''',
                (order_no, user_id, 'monthly', plan['amount_yuan'], 'pending', plan['days'])
            )
            conn.commit()

        wechat_pay = WechatPay(app_id='wx-app', mch_id='mch-1', api_key='secret-key')
        payload = {
            'appid': 'wx-app',
            'mch_id': 'mch-1',
            'nonce_str': 'nonce123',
            'result_code': 'SUCCESS',
            'return_code': 'SUCCESS',
            'out_trade_no': order_no,
            'transaction_id': 'wx-txn-1',
            'total_fee': str(plan['amount_cents']),
            'openid': 'openid-1',
        }
        payload['sign'] = wechat_pay._generate_signature(payload)
        xml_data = wechat_pay._dict_to_xml(payload)

        original_wechat_pay = app_module.WechatPay
        app_module.WechatPay = lambda: wechat_pay
        self.addCleanup(lambda: setattr(app_module, 'WechatPay', original_wechat_pay))

        response = self.client.post(
            '/api/subscription/wechat-notify',
            data=xml_data,
            content_type='application/xml'
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('SUCCESS', response.get_data(as_text=True))

        with database.get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                '''
                SELECT status, transaction_id, expired_at
                FROM subscription_orders
                WHERE order_no = ?
                ''',
                (order_no,)
            )
            order = cursor.fetchone()
            cursor.execute('SELECT is_vip, expire_at FROM users WHERE id = ?', (user_id,))
            user = cursor.fetchone()
            cursor.execute(
                '''
                SELECT event_type, order_id FROM subscription_history
                WHERE user_id = ?
                ORDER BY id DESC LIMIT 1
                ''',
                (user_id,)
            )
            history = cursor.fetchone()

        self.assertEqual(order[0], 'paid')
        self.assertEqual(order[1], 'wx-txn-1')
        self.assertTrue(order[2])
        self.assertEqual(user[0], 1)
        self.assertTrue(user[1])
        self.assertEqual(history[0], 'subscription_start')


if __name__ == '__main__':
    unittest.main()
