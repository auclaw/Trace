"""
Trace 时迹 - AI 自动时间追踪工具后端 API
支持：手机号验证码登录、微信登录、活动记录存储、AI分类统计
Refactored according to Aurum Tech architecture specification 2026
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
import random
import re
import json
import secrets
from datetime import datetime, timedelta
from typing import Optional, Tuple

from config.settings import SECRET_KEY
from utils.database import get_db_connection, init_database
from utils.logger import setup_logger
from services.ai_client import AIClient
from services.wechat_auth import WechatAuth
from services.sms import SMSFactory
from services.wechat_pay import WechatPay, SubscriptionPlans

logger = setup_logger()
app = Flask(__name__)
CORS(app)

# Initialize SQLAlchemy for ORM
from config.settings import DATABASE_PATH
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DATABASE_PATH}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# ========== Rate limiting for SMS ==========
# In-memory rate limit store for single process deployment
# For production with multiple workers, use Redis instead
from functools import wraps
import time
_sms_rate_limit: dict[str, list[float]] = {}  # phone -> list of timestamps (within last hour)
_login_rate_limit: dict[str, list[float]] = {}  # phone -> list of timestamps (within last minute)

def rate_limit_sms(f):
    """Rate limit SMS sending: max 5 requests per phone per hour"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        data = request.get_json()
        phone = data.get('phone') if data else None
        if not phone:
            return f(*args, **kwargs)  # let the route handle validation

        now = time.time()
        # Keep only timestamps within the last hour
        if phone in _sms_rate_limit:
            _sms_rate_limit[phone] = [t for t in _sms_rate_limit[phone] if now - t < 3600]
        else:
            _sms_rate_limit[phone] = []

        if len(_sms_rate_limit[phone]) >= 5:
            logger.warning(f"Rate limit exceeded for SMS: {phone} ({len(_sms_rate_limit[phone])} requests in last hour)")
            return jsonify({'code': 429, 'msg': '发送过于频繁，请1小时后再试'}), 429

        _sms_rate_limit[phone].append(now)
        return f(*args, **kwargs)
    return wrapper

def rate_limit_login(f):
    """Rate limit login verification: max 5 requests per phone per minute"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        data = request.get_json()
        phone = data.get('phone') if data else None
        if not phone:
            return f(*args, **kwargs)  # let the route handle validation

        now = time.time()
        # Keep only timestamps within the last minute
        if phone in _login_rate_limit:
            _login_rate_limit[phone] = [t for t in _login_rate_limit[phone] if now - t < 60]
        else:
            _login_rate_limit[phone] = []

        if len(_login_rate_limit[phone]) >= 5:
            logger.warning(f"Login rate limit exceeded: {phone} ({len(_login_rate_limit[phone])} attempts in last minute)")
            return jsonify({'code': 429, 'msg': '尝试次数过多，请1分钟后再试'}), 429

        _login_rate_limit[phone].append(now)
        return f(*args, **kwargs)
    return wrapper


def internal_server_error(message: str, exc: Exception, code: int = 500):
    logger.error(f"{message}: {str(exc)}")
    return jsonify({'code': code, 'msg': '内部错误，请稍后再试'}), code

from utils.database import db
db.init_app(app)


# ========== JWT工具函数 ==========
# Access token: short-lived (2 hours)
# Refresh token: longer-lived (14 days)
ACCESS_TOKEN_EXPIRE = timedelta(hours=2)
REFRESH_TOKEN_EXPIRE = timedelta(days=14)

def generate_access_token(user_id: int) -> str:
    """Generate short-lived access token"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + ACCESS_TOKEN_EXPIRE,
        'type': 'access'
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def generate_refresh_token(user_id: int) -> str:
    """Generate longer-lived refresh token"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + REFRESH_TOKEN_EXPIRE,
        'type': 'refresh'
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

# Keep backward compatibility for existing code
def generate_token(user_id: int) -> str:
    """Legacy: backward compatibility - returns access token"""
    return generate_access_token(user_id)


def verify_token(token: str) -> Optional[int]:
    """Verify JWT token, return user_id or None"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['user_id']
    except Exception:
        return None


def check_subscription_valid(user_id: int) -> Tuple[bool, Optional[str]]:
    """
    Check if user has an active valid subscription
    :return: (is_valid, error_message if invalid else None)
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            'SELECT is_vip, expire_at FROM users WHERE id = ?',
            (user_id,)
        )
        row = cursor.fetchone()
        if not row:
            return False, '用户不存在'

        is_vip, expire_at = row

        # If no expiration and not VIP, subscription inactive
        if not expire_at:
            return False, '订阅已过期，请续费后继续使用'

        # Parse expiration date
        if isinstance(expire_at, str):
            expire_dt = datetime.fromisoformat(expire_at)
        else:
            expire_dt = expire_at

        if datetime.now() > expire_dt:
            # Subscription expired, update is_vip flag
            cursor.execute(
                'UPDATE users SET is_vip = 0 WHERE id = ?',
                (user_id,)
            )
            conn.commit()
            # Record expiration event
            cursor.execute(
                '''INSERT INTO subscription_history
                   (user_id, event_type, order_id, previous_expire_at, new_expire_at, notes)
                   VALUES (?, ?, ?, ?, ?, ?)''',
                (user_id, 'subscription_expire', None, expire_at, expire_at, 'Subscription automatically expired')
            )
            conn.commit()
            return False, '订阅已过期，请续费后继续使用'

        return True, None


def require_subscription(f):
    """
    Decorator to require active subscription for API endpoints
    Usage:
        @app.route('/api/protected')
        @require_subscription
        def protected_route():
            ...
    """
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'code': 401, 'msg': '未登录'})

        token = auth_header.replace('Bearer ', '')
        user_id = verify_token(token)
        if not user_id:
            return jsonify({'code': 401, 'msg': 'Token无效'})

        valid, error = check_subscription_valid(user_id)
        if not valid:
            return jsonify({'code': 403, 'msg': error, 'error_type': 'SUBSCRIPTION_EXPIRED'}), 403

        # Add user_id to request for later use
        request.user_id = user_id
        return f(*args, **kwargs)
    return decorated


# ========== 验证码存储（SQLite）==========
import hashlib

def _hash_verification_code(code: str, phone: str) -> str:
    """Hash verification code before storing (salted with phone prefix for uniqueness)"""
    salt = phone.encode() if phone else b'trace-default-salt'
    return hashlib.pbkdf2_hmac('sha256', code.encode(), salt, 100_000).hex()


def save_verification_code(phone: str, code: str, expire_minutes: int = 10):
    """Save verification code (hashed) to database with expiration"""
    expire_at = datetime.now() + timedelta(minutes=expire_minutes)
    hashed_code = _hash_verification_code(code, phone)
    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Remove old expired codes
        cursor.execute(
            'DELETE FROM verification_codes WHERE phone = ? OR expire_at < CURRENT_TIMESTAMP',
            (phone,)
        )
        # Insert new code (stored hashed)
        cursor.execute(
            'INSERT INTO verification_codes (phone, code, expire_at) VALUES (?, ?, ?)',
            (phone, hashed_code, expire_at)
        )
        conn.commit()


def get_verification_code(phone: str) -> Optional[dict]:
    """Get valid verification code from database (returns stored hash)"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            'SELECT code, expire_at FROM verification_codes WHERE phone = ? ORDER BY created_at DESC LIMIT 1',
            (phone,)
        )
        row = cursor.fetchone()
        if not row:
            return None
        return {'code_hash': row[0], 'expire_at': datetime.fromisoformat(row[1])}


def send_sms_code(phone: str, code: str) -> bool:
    """
    Send SMS verification code via configured provider
    """
    return SMSFactory.send_verification_code(phone, code)


def _normalize_invite_contact(data: dict) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """Normalize invitee contact payload to (contact_type, contact_value, error_msg)."""
    email = (data.get('email') or '').strip().lower()
    phone = (data.get('phone') or '').strip()
    contact = (data.get('contact') or '').strip()

    if not phone and not email and contact:
        if re.match(r'^1[3-9]\d{9}$', contact):
            phone = contact
        elif re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', contact):
            email = contact.lower()

    if phone:
        if not re.match(r'^1[3-9]\d{9}$', phone):
            return None, None, '手机号格式错误'
        return 'phone', phone, None
    if email:
        if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
            return None, None, '邮箱格式错误'
        return 'email', email, None
    return None, None, '请提供手机号或邮箱'


def _create_notification_event(
    cursor,
    user_id: Optional[int],
    channel: str,
    template: str,
    target: Optional[str],
    title: str,
    content: str,
    status: str,
    error_message: Optional[str] = None
):
    sent_at = datetime.now() if status == 'sent' else None
    cursor.execute(
        '''
        INSERT INTO notification_events
        (user_id, channel, template, target, title, content, status, error_message, sent_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''',
        (user_id, channel, template, target, title, content, status, error_message, sent_at)
    )


def _send_org_invitation_notification(
    cursor,
    org_name: str,
    inviter_id: int,
    invitee_user_id: Optional[int],
    contact_type: str,
    contact_value: str,
    invite_code: str
) -> Tuple[str, str]:
    """Send or queue invite notifications and persist audit records."""
    inviter_name = f'用户{inviter_id}'
    message = f'{inviter_name} 邀请你加入组织「{org_name}」，邀请码：{invite_code}'

    if invitee_user_id:
        _create_notification_event(
            cursor,
            invitee_user_id,
            'in_app',
            'org_invite',
            contact_value,
            '组织邀请',
            message,
            'sent'
        )
        return 'in_app', 'sent'

    if contact_type == 'phone':
        sms_service = SMSFactory.get_instance()
        delivered = bool(
            hasattr(sms_service, 'send_invitation_notice') and
            sms_service.send_invitation_notice(contact_value, org_name, inviter_name, invite_code)
        )
        status = 'sent' if delivered else 'manual_required'
        _create_notification_event(
            cursor,
            None,
            'sms',
            'org_invite',
            contact_value,
            '组织邀请',
            message,
            status,
            None if delivered else 'SMS invite template not configured or provider unavailable'
        )
        return 'sms', status

    _create_notification_event(
        cursor,
        None,
        'email',
        'org_invite',
        contact_value,
        '组织邀请',
        message,
        'manual_required',
        'Email delivery service not configured'
    )
    return 'email', 'manual_required'


def _apply_paid_subscription(cursor, order_id: int, user_id: int, plan_type: str, days: int,
                             transaction_id: str, notify_payload: str):
    cursor.execute('SELECT expire_at FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    current_expire = user[0] if user else None

    now = datetime.now()
    if current_expire:
        current_expire_dt = datetime.fromisoformat(current_expire) if isinstance(current_expire, str) else current_expire
        is_renewal = current_expire_dt > now
        new_expire = current_expire_dt + timedelta(days=days) if is_renewal else now + timedelta(days=days)
    else:
        is_renewal = False
        new_expire = now + timedelta(days=days)

    cursor.execute(
        '''
        UPDATE subscription_orders
        SET status = 'paid', paid_at = ?, transaction_id = ?, notify_data = ?, expired_at = ?
        WHERE id = ?
        ''',
        (now, transaction_id, notify_payload, new_expire, order_id)
    )
    cursor.execute(
        '''UPDATE users SET is_vip = 1, expire_at = ? WHERE id = ?''',
        (new_expire, user_id)
    )
    cursor.execute(
        '''
        INSERT INTO subscription_history
        (user_id, event_type, order_id, previous_expire_at, new_expire_at, notes)
        VALUES (?, ?, ?, ?, ?, ?)
        ''',
        (
            user_id,
            'subscription_renew' if is_renewal else 'subscription_start',
            order_id,
            current_expire,
            new_expire,
            f'Payment completed, {plan_type} plan'
        )
    )
    return new_expire


# ========== API路由 ==========

@app.route('/api/auth/check', methods=['GET'])
def check_auth():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'code': 401, 'msg': '未登录'})

    token = auth_header.replace('Bearer ', '')
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'code': 401, 'msg': 'Token无效'})

    return jsonify({'code': 200, 'data': {'authenticated': True}})


@app.route('/api/auth/send-code', methods=['POST'])
@rate_limit_sms
def send_code():
    data = request.get_json()
    phone = data.get('phone')

    if not phone or not re.match(r'^1[3-9]\d{9}$', phone):
        return jsonify({'code': 400, 'msg': '手机号格式错误'})

    # Generate 6-digit code
    code = ''.join(random.choices('0123456789', k=6))

    # Save to SQLite (fixed from global memory)
    save_verification_code(phone, code)

    if send_sms_code(phone, code):
        # In development mode where SMS is not configured,
        # log the code for testing
        if not SMSFactory.get_instance().access_key_id:
            logger.warning(f"[DEV MODE] Verification code for {phone} is: {code}")
        logger.info(f"Verification code sent to {phone}")
        return jsonify({'code': 200, 'msg': '验证码已发送'})
    else:
        return jsonify({'code': 500, 'msg': '发送失败'})


@app.route('/api/auth/login-phone', methods=['POST'])
@rate_limit_login
def login_phone():
    data = request.get_json()
    phone = data.get('phone')
    code = data.get('code')

    # Verify code
    stored = get_verification_code(phone)
    if not stored:
        return jsonify({'code': 400, 'msg': '验证码错误'})

    # Compare hashed code
    input_hash = _hash_verification_code(code, phone)
    if input_hash != stored['code_hash']:
        return jsonify({'code': 400, 'msg': '验证码错误'})

    if datetime.now() > stored['expire_at']:
        return jsonify({'code': 400, 'msg': '验证码已过期'})

    # Query or create user
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, is_vip, expire_at FROM users WHERE phone = ?', (phone,))
        row = cursor.fetchone()

        if not row:
            # Create new user - automatically activate 14-day free trial
            from datetime import timedelta
            expire_at = datetime.now() + timedelta(days=14)
            cursor.execute(
                'INSERT INTO users (phone, created_at, is_vip, expire_at) VALUES (?, ?, ?, ?)',
                (phone, datetime.now(), 1, expire_at)
            )
            conn.commit()
            user_id = cursor.lastrowid
            # Record trial start in history
            cursor.execute(
                '''INSERT INTO subscription_history
                   (user_id, event_type, order_id, previous_expire_at, new_expire_at, notes)
                   VALUES (?, ?, ?, ?, ?, ?)''',
                (user_id, 'trial_start', None, None, expire_at, 'New user 14-day free trial')
            )
            conn.commit()
            logger.info(f"New phone user created: {user_id}, free trial until {expire_at}")
        else:
            user_id = row[0]

    access_token = generate_access_token(user_id)
    refresh_token = generate_refresh_token(user_id)
    logger.info(f"User {user_id} logged in via phone {phone}")
    return jsonify({
        'code': 200,
        'data': {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user_id': user_id
        }
    })


import os
# Dev-mode login only registered in development environment
# Production environment will not have this route at all
if os.environ.get('FLASK_ENV', 'development') == 'development':
    @app.route('/api/auth/dev-login', methods=['POST'])
    def dev_login():
        """Development mode: direct login without verification code
        Only available when FLASK_ENV=development
        """
        # Double protection: require development environment AND SMS not configured
        if os.environ.get('FLASK_ENV', 'development') != 'development':
            return jsonify({'code': 403, 'msg': '此接口仅在开发模式下可用'}), 403
        from config.settings import SMS_ACCESS_KEY_ID
        if SMS_ACCESS_KEY_ID and len(SMS_ACCESS_KEY_ID.strip()) > 0:
            return jsonify({'code': 403, 'msg': '此接口仅在开发模式下可用'}), 403

        data = request.get_json()
        phone = data.get('phone')

        if not phone or not re.match(r'^1[3-9]\d{9}$', phone):
            return jsonify({'code': 400, 'msg': '手机号格式错误'})

        # Query or create user
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT id, is_vip, expire_at FROM users WHERE phone = ?', (phone,))
            row = cursor.fetchone()

            if not row:
                # Create new user - automatically activate 14-day free trial
                from datetime import timedelta
                expire_at = datetime.now() + timedelta(days=14)
                cursor.execute(
                    'INSERT INTO users (phone, created_at, is_vip, expire_at) VALUES (?, ?, ?, ?)',
                    (phone, datetime.now(), 1, expire_at)
                )
                conn.commit()
                user_id = cursor.lastrowid
                # Record trial start in history
                cursor.execute(
                    '''INSERT INTO subscription_history
                       (user_id, event_type, order_id, previous_expire_at, new_expire_at, notes)
                       VALUES (?, ?, ?, ?, ?, ?)''',
                    (user_id, 'trial_start', None, None, expire_at, 'Dev mode auto-create')
                )
                conn.commit()
                logger.info(f"[DEV MODE] New user created: {user_id}, phone {phone}")
            else:
                user_id = row[0]

        access_token = generate_access_token(user_id)
        refresh_token = generate_refresh_token(user_id)
        logger.info(f"[DEV MODE] User {user_id} logged in via dev-login ({phone})")
        return jsonify({
            'code': 200,
            'data': {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user_id': user_id
            }
        })


@app.route('/api/auth/refresh', methods=['POST'])
def refresh_token():
    """Refresh access token using refresh token"""
    data = request.get_json()
    refresh_token = data.get('refresh_token')

    if not refresh_token:
        return jsonify({'code': 400, 'msg': '缺少 refresh token'}), 400

    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=['HS256'])
        if payload.get('type') != 'refresh':
            return jsonify({'code': 401, 'msg': '无效的 refresh token'}), 401
        user_id = payload['user_id']
        # Generate new access token
        new_access_token = generate_access_token(user_id)
        return jsonify({
            'code': 200,
            'data': {
                'access_token': new_access_token
            }
        })
    except jwt.ExpiredSignatureError:
        return jsonify({'code': 401, 'msg': 'refresh token 已过期，请重新登录'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'code': 401, 'msg': '无效的 refresh token'}), 401


@app.route('/api/auth/wechat', methods=['GET'])
def wechat_login():
    wechat_auth = WechatAuth()
    code = request.args.get('code')
    state = request.args.get('state')

    if not code:
        # Return QR code connect URL for frontend to display
        redirect_url = request.base_url
        # Generate random state for CSRF protection
        import random
        state = ''.join(random.choices('0123456789abcdef', k=32))
        qr_url = wechat_auth.get_qrconnect_url(redirect_url, state)
        return jsonify({
            'code': 200,
            'data': {
                'qr_url': qr_url,
                'state': state
            }
        })

    # Exchange code for openid
    success, openid = wechat_auth.code_to_openid(code)
    if not success:
        return jsonify({'code': 400, 'msg': f"微信登录失败: {openid}"})

    # Query or create user
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, is_vip, expire_at FROM users WHERE openid = ?', (openid,))
        row = cursor.fetchone()

        if not row:
            # Create new user - automatically activate 14-day free trial
            from datetime import timedelta
            expire_at = datetime.now() + timedelta(days=14)
            cursor.execute(
                'INSERT INTO users (openid, created_at, is_vip, expire_at) VALUES (?, ?, ?, ?)',
                (openid, datetime.now(), 1, expire_at)
            )
            conn.commit()
            user_id = cursor.lastrowid
            logger.info(f"New WeChat user created: {user_id}, free trial until {expire_at}")
        else:
            user_id = row[0]

    token = generate_token(user_id)
    logger.info(f"User {user_id} logged in via WeChat")
    return jsonify({
        'code': 200,
        'data': {
            'token': token,
            'user_id': user_id
        }
    })


@app.route('/api/auth/wechat/check-config', methods=['GET'])
def wechat_check_config():
    """Check if WeChat authentication is configured"""
    wechat_auth = WechatAuth()
    configured = wechat_auth.is_configured()
    return jsonify({
        'code': 200,
        'data': {'configured': configured}
    })


# Get today's statistics
@app.route('/api/activities/today', methods=['GET'])
@require_subscription
def get_today():
    user_id = request.user_id

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT category, SUM(strftime('%s', end_time) - strftime('%s', start_time)) as total_seconds
            FROM activities
            WHERE user_id = ? AND date(start_time) = date('now')
            GROUP BY category
        ''', (user_id,))

        rows = cursor.fetchall()
        result = []
        for row in rows:
            result.append({
                'category': row[0],
                'seconds': row[1]
            })

    return jsonify({'code': 200, 'data': result})


# Save activities
@app.route('/api/activities/save', methods=['POST'])
@require_subscription
def save_activity():
    user_id = request.user_id

    data = request.get_json()
    activities = data.get('activities', [])

    with get_db_connection() as conn:
        cursor = conn.cursor()
        for act in activities:
            cursor.execute('''
                INSERT INTO activities (user_id, window_title, application, url, start_time, end_time, category, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                user_id,
                act.get('window_title'),
                act.get('application'),
                act.get('url'),
                act.get('start_time'),
                act.get('end_time'),
                act.get('category'),
                datetime.now()
            ))
        conn.commit()

    logger.info(f"Saved {len(activities)} activities for user {user_id}")
    return jsonify({'code': 200, 'msg': '保存成功'})


# AI classification
@app.route('/api/ai/classify', methods=['POST'])
@require_subscription
def ai_classify():
    user_id = request.user_id

    data = request.get_json()
    windows = data.get('windows', [])  # [(title, app_name), ...]
    provider = data.get('provider', 'ernie')  # ernie / doubao

    # Build prompt - optimized for Chinese application names
    prompt = """你是一个时间追踪分类AI。我正在使用电脑，给你当前窗口标题和应用名称，请你帮我分类到以下类别之一：

可选分类：工作、学习、开发、社交、娱乐、视频、音乐、新闻、购物、其他

分类规则：
- "开发" ：写代码、IDE、终端、git都属于开发
- "工作"：办公软件、会议、工作沟通都属于工作
- "学习"：上网课、学习教程、背单词都属于学习
- "社交"：微信、QQ、微博都是社交
- "娱乐"：游戏、休闲都属于娱乐
- "视频"：YouTube、B站、抖音都是视频
- "音乐"：网易云音乐、QQ音乐都是音乐
- "新闻"：看新闻、资讯都是新闻
- "购物"：淘宝、京东都是购物

请直接输出分类结果，不要输出多余解释，只给我分类名称。

当前信息：
"""
    for w in windows:
        prompt += f"- 窗口标题: {w[0]}, 应用名称: {w[1]}\n"

    prompt += "\n分类结果："

    try:
        # Get singleton AI client (fixed from creating new client every time)
        client = AIClient.get_instance(provider)
        response_text = client.chat_completion(prompt)
        category = response_text
        # Simplify, take first word
        category = category.split()[0] if ' ' in category else category

        return jsonify({'code': 200, 'data': {'category': category}})
    except Exception as e:
        return internal_server_error('AI classification failed', e)


# AI dynamic rescheduling
@app.route('/api/ai/reschedule', methods=['POST'])
def ai_reschedule():
    data = request.get_json()
    tasks = data.get('tasks', [])
    current_hour = data.get('current_hour', datetime.now().hour + datetime.now().minute / 60)

    # Build prompt
    prompt = f"""你是一个智能日程助理。当前时间是 {current_hour:.1f} 点（24小时制）。假设你必须在 23:00 前完成所有任务，用户要睡觉了。

下面是今天的任务列表（优先级 1=最高，5=最低）：

"""
    for task in tasks:
        completed = "✓ 已完成" if task.get('completed') else f"实际已用 {task.get('actualMinutes', 0):.0f} 分钟 / 预估 {task.get('estimatedMinutes'):.0f} 分钟"
        prompt += f"- 优先级 {task['priority']}: {task['title']} → {completed}\n"

    prompt += """
请帮我重新安排顺序：
1. 如果当前某个高优先级任务已经延误（实际用时超过预估），需要把低优先级的任务推迟到明天
2. 保持高优先级任务在前面，低优先级在后面
3. 只返回重新排序后的完整任务列表，保持原来的所有字段，只改变优先级顺序
4. 用严格JSON格式返回：[{"id": "id", "title": "title", "priority": new_priority, ...}, ...]
5. 优先级必须是 1~N 连续，1 最先做，N 最后做
6. 已经完成的任务保持原位置不变（它们已经做完了）

只返回JSON，不要其他文字。
"""

    try:
        # Get default AI client
        client = AIClient.get_default_client()
        response_text = client.chat_completion(prompt)
        content = response_text.strip()

        # Extract JSON
        json_match = re.search(r'(\[.*\])', content, re.DOTALL)
        if json_match:
            content = json_match.group(1)
        reordered = json.loads(content)

        return jsonify({'code': 200, 'data': reordered})
    except Exception as e:
        return internal_server_error('AI reschedule failed', e)


# ========== Subscription & Payment API ==========

@app.route('/api/subscription/plans', methods=['GET'])
def get_plans():
    """Get available subscription plans"""
    return jsonify({
        'code': 200,
        'data': SubscriptionPlans.list_plans()
    })


@app.route('/api/subscription/status', methods=['GET'])
def get_subscription_status():
    """Get current user subscription status"""
    auth_header = request.headers.get('Authorization')
    token = auth_header.replace('Bearer ', '')
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'code': 401, 'msg': '未登录'})

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            'SELECT is_vip, expire_at FROM users WHERE id = ?',
            (user_id,)
        )
        row = cursor.fetchone()
        if not row:
            return jsonify({'code': 404, 'msg': '用户不存在'})

        is_vip, expire_at = row
        is_active = False
        days_remaining = 0
        if expire_at:
            # Parse expire_at
            if isinstance(expire_at, str):
                expire_dt = datetime.fromisoformat(expire_at)
            else:
                expire_dt = expire_at
            now = datetime.now()
            is_active = expire_dt > now
            if is_active:
                delta = expire_dt - now
                days_remaining = delta.days

    return jsonify({
        'code': 200,
        'data': {
            'is_vip': bool(is_vip),
            'is_active': is_active,
            'expire_at': expire_at,
            'days_remaining': days_remaining
        }
    })


@app.route('/api/subscription/create-order', methods=['POST'])
def create_subscription_order():
    """Create a new subscription order"""
    auth_header = request.headers.get('Authorization')
    token = auth_header.replace('Bearer ', '')
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'code': 401, 'msg': '未登录'})

    data = request.get_json()
    plan_type = data.get('plan_type')

    plan = SubscriptionPlans.get_plan(plan_type)
    if not plan:
        return jsonify({'code': 400, 'msg': '无效的套餐类型'})

    # Generate order number
    timestamp = int(datetime.now().timestamp() * 1000)
    random_suffix = random.randint(1000, 9999)
    order_no = f"MZ{timestamp}{random_suffix}"

    # Save order to database
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''INSERT INTO subscription_orders
               (order_no, user_id, plan_type, amount, status, days)
               VALUES (?, ?, ?, ?, ?, ?)''',
            (order_no, user_id, plan_type, plan['amount_yuan'], 'pending', plan['days'])
        )
        conn.commit()

    # Create order in WeChat Pay
    wechat_pay = WechatPay()
    if not wechat_pay.is_configured():
        # Return mock data for development
        logger.warning(f"WeChat Pay not configured, mock order created {order_no}")
        return jsonify({
            'code': 200,
            'data': {
                'order_no': order_no,
                'code_url': None,
                'amount': plan['amount_yuan'],
                'mock': True
            }
        })

    success, result = wechat_pay.create_order(
        order_no=order_no,
        user_id=user_id,
        total_fee=plan['amount_cents'],
        body=f"时迹 看见 {plan['name']}"
    )

    if not success:
        return jsonify({'code': 500, 'msg': result.get('errmsg', '创建订单失败')})

    return jsonify({
        'code': 200,
        'data': {
            'order_no': order_no,
            'code_url': result['code_url'],
            'prepay_id': result.get('prepay_id'),
            'amount': plan['amount_yuan'],
            'sign': result.get('sign')
        }
    })


@app.route('/api/subscription/wechat-notify', methods=['POST'])
def wechat_pay_notify():
    """Handle WeChat payment callback notification"""
    wechat_pay = WechatPay()
    # Get raw XML body
    xml_data = request.get_data().decode('utf-8')
    success, data, response_xml = wechat_pay.process_notification(xml_data)

    if success:
        order_no = data.get('out_trade_no')
        transaction_id = data.get('transaction_id')
        total_fee_cents = int(data.get('total_fee', 0))

        # Update order status and user subscription
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Find order
            cursor.execute(
                '''SELECT id, user_id, plan_type, days, amount, status, transaction_id FROM subscription_orders
                   WHERE order_no = ?''',
                (order_no,)
            )
            order = cursor.fetchone()

            if not order:
                logger.warning(f"Order not found: {order_no}")
                return response_xml, 200, {'Content-Type': 'application/xml'}

            order_id, user_id, plan_type, days, amount, status, existing_transaction_id = order
            expected_total_fee_cents = int(round(float(amount) * 100))

            if status == 'paid':
                logger.info(f"Duplicate payment notification ignored: {order_no}/{existing_transaction_id}")
                return response_xml, 200, {'Content-Type': 'application/xml'}

            if expected_total_fee_cents != total_fee_cents:
                logger.error(
                    f"Payment amount mismatch for {order_no}: expected {expected_total_fee_cents}, got {total_fee_cents}"
                )
                return wechat_pay._generate_response_xml(False, 'amount mismatch'), 200, {'Content-Type': 'application/xml'}

            new_expire = _apply_paid_subscription(
                cursor,
                order_id=order_id,
                user_id=user_id,
                plan_type=plan_type,
                days=days,
                transaction_id=transaction_id,
                notify_payload=xml_data
            )

            conn.commit()
            logger.info(f"Payment completed for order {order_no}, user {user_id} "
                       f"subscribed until {new_expire}")

    return response_xml, 200, {'Content-Type': 'application/xml'}


@app.route('/api/subscription/orders', methods=['GET'])
def list_user_orders():
    """List all orders for current user"""
    auth_header = request.headers.get('Authorization')
    token = auth_header.replace('Bearer ', '')
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'code': 401, 'msg': '未登录'})

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''SELECT order_no, plan_type, amount, status, created_at, paid_at, expired_at
               FROM subscription_orders
               WHERE user_id = ?
               ORDER BY created_at DESC''',
            (user_id,)
        )
        rows = cursor.fetchall()
        orders = []
        for row in rows:
            orders.append({
                'order_no': row[0],
                'plan_type': row[1],
                'amount': float(row[2]),
                'status': row[3],
                'created_at': row[4],
                'paid_at': row[5],
                'expired_at': row[6]
            })

    return jsonify({
        'code': 200,
        'data': {'orders': orders}
    })


# ========== Team/Enterprise Organization API ==========

@app.route('/api/org/create', methods=['POST'])
@require_subscription
def create_organization():
    """Create a new organization (admin only)"""
    user_id = request.user_id
    data = request.get_json()
    name = data.get('name')
    domain = data.get('domain')
    seat_count = data.get('seat_count', 5)
    billing_cycle = data.get('billing_cycle', 'monthly')
    amount = data.get('amount', 0)

    if not name:
        return jsonify({'code': 400, 'msg': '组织名称不能为空'})

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''INSERT INTO organizations (name, admin_user_id, domain, seat_count, billing_cycle, amount)
               VALUES (?, ?, ?, ?, ?, ?)''',
            (name, user_id, domain, seat_count, billing_cycle, amount)
        )
        org_id = cursor.lastrowid
        # Add creator as admin member
        cursor.execute(
            '''INSERT INTO org_members (org_id, user_id, role, status)
               VALUES (?, ?, 'admin', 'active')''',
            (org_id, user_id)
        )
        conn.commit()
        logger.info(f"Organization created: {org_id} by user {user_id}")

    return jsonify({'code': 200, 'data': {'org_id': org_id}})


@app.route('/api/org/list', methods=['GET'])
@require_subscription
def list_user_organizations():
    """List all organizations the user is a member of"""
    user_id = request.user_id

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''SELECT o.id, o.name, o.domain, om.role, om.status
               FROM organizations o
               JOIN org_members om ON o.id = om.org_id
               WHERE om.user_id = ? AND om.status = 'active'
               ORDER BY o.created_at DESC''',
            (user_id,)
        )
        rows = cursor.fetchall()
        orgs = []
        for row in rows:
            orgs.append({
                'id': row[0],
                'name': row[1],
                'domain': row[2],
                'role': row[3],
                'status': row[4],
            })

    return jsonify({'code': 200, 'data': {'organizations': orgs}})


@app.route('/api/org/invite', methods=['POST'])
@require_subscription
def invite_member():
    """Invite a member to organization"""
    inviter_id = request.user_id
    data = request.get_json() or {}
    org_id = data.get('org_id')
    team_id = data.get('team_id')
    role = data.get('role', 'member')
    invite_message = (data.get('message') or '').strip()

    if not org_id:
        return jsonify({'code': 400, 'msg': '缺少组织ID'})
    if role not in ('admin', 'lead', 'member'):
        return jsonify({'code': 400, 'msg': '角色无效'})

    contact_type, contact_value, error_msg = _normalize_invite_contact(data)
    if error_msg:
        return jsonify({'code': 400, 'msg': error_msg})

    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Check inviter permissions
        cursor.execute(
            '''SELECT role FROM org_members WHERE org_id = ? AND user_id = ?''',
            (org_id, inviter_id)
        )
        row = cursor.fetchone()
        if not row or row[0] not in ('admin', 'lead'):
            return jsonify({'code': 403, 'msg': '无邀请权限'})

        cursor.execute('SELECT name FROM organizations WHERE id = ?', (org_id,))
        org_row = cursor.fetchone()
        if not org_row:
            return jsonify({'code': 404, 'msg': '组织不存在'})
        org_name = org_row[0]

        if team_id:
            cursor.execute('SELECT id FROM teams WHERE id = ? AND org_id = ?', (team_id, org_id))
            if not cursor.fetchone():
                return jsonify({'code': 400, 'msg': '团队不存在或不属于该组织'})

        invitee_user_id = None
        if contact_type == 'phone':
            cursor.execute('SELECT id FROM users WHERE phone = ?', (contact_value,))
            user_row = cursor.fetchone()
            invitee_user_id = user_row[0] if user_row else None
        elif contact_type == 'email':
            cursor.execute('SELECT id FROM users WHERE email = ?', (contact_value,))
            user_row = cursor.fetchone()
            invitee_user_id = user_row[0] if user_row else None

        member_row = None
        if invitee_user_id:
            cursor.execute(
                '''
                SELECT status FROM org_members
                WHERE org_id = ? AND user_id = ?
                ''',
                (org_id, invitee_user_id)
            )
            member_row = cursor.fetchone()
            if member_row and member_row[0] == 'active':
                return jsonify({'code': 409, 'msg': '该用户已在组织中'})
            if member_row and member_row[0] == 'pending':
                return jsonify({'code': 409, 'msg': '该用户已有待处理邀请'})

        cursor.execute(
            '''
            SELECT id FROM org_invitations
            WHERE org_id = ? AND contact_value = ? AND status = 'pending'
            ''',
            (org_id, contact_value)
        )
        if cursor.fetchone():
            return jsonify({'code': 409, 'msg': '该联系方式已有待处理邀请'})

        invite_code = secrets.token_urlsafe(16)
        expires_at = datetime.now() + timedelta(days=7)
        notify_channel, notify_status = _send_org_invitation_notification(
            cursor,
            org_name=org_name,
            inviter_id=inviter_id,
            invitee_user_id=invitee_user_id,
            contact_type=contact_type,
            contact_value=contact_value,
            invite_code=invite_code
        )

        cursor.execute(
            '''
            INSERT INTO org_invitations
            (org_id, team_id, inviter_user_id, invitee_user_id, contact_type, contact_value,
             role, invite_code, invite_message, status, notify_channel, notify_status, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
            ''',
            (
                org_id, team_id, inviter_id, invitee_user_id, contact_type, contact_value,
                role, invite_code, invite_message, notify_channel, notify_status, expires_at
            )
        )
        invitation_id = cursor.lastrowid

        if invitee_user_id and not member_row:
            cursor.execute(
                '''
                INSERT INTO org_members (org_id, team_id, user_id, role, status)
                VALUES (?, ?, ?, ?, 'pending')
                ''',
                (org_id, team_id, invitee_user_id, role)
            )

        conn.commit()

    return jsonify({
        'code': 200,
        'data': {
            'invitation_id': invitation_id,
            'invite_code': invite_code,
            'contact_type': contact_type,
            'contact_value': contact_value,
            'notify_channel': notify_channel,
            'notify_status': notify_status,
        }
    })


@app.route('/api/org/members', methods=['GET'])
@require_subscription
def list_org_members():
    """List all members in an organization"""
    user_id = request.user_id
    org_id = request.args.get('org_id')

    if not org_id:
        return jsonify({'code': 400, 'msg': '缺少组织ID'})

    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Permission check
        cursor.execute(
            '''SELECT id FROM org_members WHERE org_id = ? AND user_id = ?''',
            (org_id, user_id)
        )
        if not cursor.fetchone():
            return jsonify({'code': 403, 'msg': '无权限访问'})

        cursor.execute(
            '''SELECT om.id, om.team_id, om.user_id, om.role, om.status, om.invited_at, u.phone, u.email
               FROM org_members om
               LEFT JOIN users u ON u.id = om.user_id
               WHERE om.org_id = ?
               ORDER BY om.role DESC, om.created_at''',
            (org_id,)
        )
        rows = cursor.fetchall()
        members = []
        for row in rows:
            members.append({
                'id': row[0],
                'team_id': row[1],
                'user_id': row[2],
                'role': row[3],
                'status': row[4],
                'invited_at': row[5],
                'phone': row[6],
                'email': row[7],
                'source': 'member',
            })

        cursor.execute(
            '''
            SELECT id, team_id, invitee_user_id, role, status, created_at, contact_type, contact_value,
                   invite_code, notify_channel, notify_status
            FROM org_invitations
            WHERE org_id = ? AND status = 'pending'
            ORDER BY created_at DESC
            ''',
            (org_id,)
        )
        invite_rows = cursor.fetchall()
        for row in invite_rows:
            members.append({
                'id': row[0],
                'team_id': row[1],
                'user_id': row[2],
                'role': row[3],
                'status': row[4],
                'invited_at': row[5],
                'contact_type': row[6],
                'contact_value': row[7],
                'invite_code': row[8],
                'notify_channel': row[9],
                'notify_status': row[10],
                'source': 'invitation',
            })

    return jsonify({'code': 200, 'data': {'members': members}})


# ========== Team API ==========

@app.route('/api/team/create', methods=['POST'])
@require_subscription
def create_team():
    """Create a new team within an organization"""
    user_id = request.user_id
    data = request.get_json()
    org_id = data.get('org_id')
    name = data.get('name')

    if not org_id or not name:
        return jsonify({'code': 400, 'msg': '缺少必要参数'})

    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Permission check - only org admin can create teams
        cursor.execute(
            '''SELECT role FROM org_members WHERE org_id = ? AND user_id = ?''',
            (org_id, user_id)
        )
        row = cursor.fetchone()
        if not row or row[0] != 'admin':
            return jsonify({'code': 403, 'msg': '无创建团队权限'})

        cursor.execute(
            '''INSERT INTO teams (org_id, name, lead_user_id)
               VALUES (?, ?, ?)''',
            (org_id, name, user_id)
        )
        team_id = cursor.lastrowid
        conn.commit()
        logger.info(f"Team created: {team_id} in org {org_id}")

    return jsonify({'code': 200, 'data': {'team_id': team_id}})


# ========== Weekly Time Approval API ==========

@app.route('/api/approval/submit', methods=['POST'])
@require_subscription
def submit_weekly_approval():
    """Submit weekly time summary for approval"""
    user_id = request.user_id
    data = request.get_json()
    org_id = data.get('org_id')
    week_start = data.get('week_start')

    if not org_id or not week_start:
        return jsonify({'code': 400, 'msg': '缺少必要参数'})

    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Check if already submitted
        cursor.execute(
            '''SELECT id, status FROM time_approval
               WHERE user_id = ? AND org_id = ? AND week_start = ?''',
            (user_id, org_id, week_start)
        )
        existing = cursor.fetchone()
        if existing and existing[1] in ('submitted', 'approved'):
            return jsonify({'code': 400, 'msg': '本周已提交'})

        if existing:
            # Update existing draft
            cursor.execute(
                '''UPDATE time_approval SET status = 'submitted', submitted_at = ?
                   WHERE id = ?''',
                (datetime.now(), existing[0])
            )
        else:
            # Create new submission
            cursor.execute(
                '''INSERT INTO time_approval (user_id, org_id, week_start, status, submitted_at)
                   VALUES (?, ?, ?, 'submitted', ?)''',
                (user_id, org_id, week_start, datetime.now())
            )
        conn.commit()

    return jsonify({'code': 200, 'msg': '提交成功'})


@app.route('/api/approval/list', methods=['GET'])
@require_subscription
def list_pending_approvals():
    """List pending approvals for team lead"""
    user_id = request.user_id
    org_id = request.args.get('org_id')
    team_id = request.args.get('team_id')

    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Find all members in this team where status = 'submitted'
        cursor.execute(
            '''SELECT ta.id, ta.user_id, ta.week_start, ta.status, ta.submitted_at
               FROM time_approval ta
               JOIN org_members om ON ta.user_id = om.user_id
               WHERE ta.org_id = ? AND om.team_id = ? AND ta.status = 'submitted'
               ORDER BY ta.submitted_at DESC''',
            (org_id, team_id)
        )
        rows = cursor.fetchall()
        approvals = []
        for row in rows:
            approvals.append({
                'id': row[0],
                'user_id': row[1],
                'week_start': row[2],
                'status': row[3],
                'submitted_at': row[4],
            })

    return jsonify({'code': 200, 'data': {'approvals': approvals}})


@app.route('/api/approval/approve', methods=['POST'])
@require_subscription
def approve_weekly():
    """Approve or reject a weekly submission"""
    user_id = request.user_id
    data = request.get_json()
    approval_id = data.get('approval_id')
    action = data.get('action')  # 'approve' or 'reject'
    feedback = data.get('feedback', '')

    if action not in ('approved', 'rejected'):
        return jsonify({'code': 400, 'msg': '无效操作'})

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''UPDATE time_approval SET status = ?, approved_at = ?, feedback = ?
               WHERE id = ?''',
            (action, datetime.now(), feedback, approval_id)
        )
        conn.commit()

    return jsonify({'code': 200, 'msg': '操作成功'})


# ========== Habit Target API ==========

@app.route('/api/habits', methods=['GET'])
@require_subscription
def list_habits():
    """List all habit targets for current user"""
    user_id = request.user_id

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''SELECT id, name, target_hours FROM habit_targets
               WHERE user_id = ? ORDER BY created_at''',
            (user_id,)
        )
        rows = cursor.fetchall()
        habits = []
        for row in rows:
            habits.append({
                'id': row[0],
                'name': row[1],
                'target_hours': row[2],
            })

    return jsonify({'code': 200, 'data': {'habits': habits}})


@app.route('/api/habits/create', methods=['POST'])
@require_subscription
def create_habit():
    """Create a new habit target"""
    user_id = request.user_id
    data = request.get_json()
    name = data.get('name')
    target_hours = data.get('target_hours')

    if not name or not target_hours:
        return jsonify({'code': 400, 'msg': '缺少必要参数'})

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''INSERT INTO habit_targets (user_id, name, target_hours)
               VALUES (?, ?, ?)''',
            (user_id, name, target_hours)
        )
        habit_id = cursor.lastrowid
        conn.commit()

    return jsonify({'code': 200, 'data': {'id': habit_id}})


@app.route('/api/habits/checkin', methods=['POST'])
@require_subscription
def habit_checkin():
    """Record daily habit checkin"""
    user_id = request.user_id
    data = request.get_json()
    habit_id = data.get('habit_id')
    checkin_date = data.get('checkin_date')
    actual_hours = data.get('actual_hours')
    completed = data.get('completed', 1 if actual_hours >= data.get('target_hours', 0) else 0)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Check if already checked in today
        cursor.execute(
            '''SELECT id FROM habit_checkins
               WHERE habit_id = ? AND user_id = ? AND checkin_date = ?''',
            (habit_id, user_id, checkin_date)
        )
        existing = cursor.fetchone()

        if existing:
            cursor.execute(
                '''UPDATE habit_checkins SET actual_hours = ?, completed = ?
                   WHERE id = ?''',
                (actual_hours, completed, existing[0])
            )
        else:
            cursor.execute(
                '''INSERT INTO habit_checkins (habit_id, user_id, checkin_date, actual_hours, completed)
                   VALUES (?, ?, ?, ?, ?)''',
                (habit_id, user_id, checkin_date, actual_hours, completed)
            )
        conn.commit()

    return jsonify({'code': 200, 'msg': '打卡成功'})


# ========== Flow Block (Distraction Blocker) API ==========

@app.route('/api/flow-blocks', methods=['GET'])
@require_subscription
def list_flow_blocks():
    """List all blocked domains for current user"""
    user_id = request.user_id

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''SELECT id, domain, enabled FROM flow_blocks
               WHERE user_id = ? ORDER BY domain''',
            (user_id,)
        )
        rows = cursor.fetchall()
        blocks = []
        for row in rows:
            blocks.append({
                'id': row[0],
                'domain': row[1],
                'enabled': bool(row[2]),
            })

    return jsonify({'code': 200, 'data': {'blocks': blocks}})


@app.route('/api/flow-blocks/create', methods=['POST'])
@require_subscription
def create_flow_block():
    """Add a new blocked domain"""
    user_id = request.user_id
    data = request.get_json()
    domain = data.get('domain')

    if not domain:
        return jsonify({'code': 400, 'msg': '域名不能为空'})

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''INSERT INTO flow_blocks (user_id, domain) VALUES (?, ?)''',
            (user_id, domain)
        )
        block_id = cursor.lastrowid
        conn.commit()

    return jsonify({'code': 200, 'data': {'id': block_id}})


@app.route('/api/flow-blocks/toggle', methods=['POST'])
@require_subscription
def toggle_flow_block():
    """Toggle enabled state of a blocked domain"""
    user_id = request.user_id
    data = request.get_json()
    block_id = data.get('id')
    enabled = data.get('enabled')

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''UPDATE flow_blocks SET enabled = ? WHERE id = ? AND user_id = ?''',
            (1 if enabled else 0, block_id, user_id)
        )
        conn.commit()

    return jsonify({'code': 200, 'msg': '更新成功'})


@app.route('/api/flow-blocks/delete', methods=['POST'])
@require_subscription
def delete_flow_block():
    """Delete a blocked domain"""
    user_id = request.user_id
    data = request.get_json()
    block_id = data.get('id')

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''DELETE FROM flow_blocks WHERE id = ? AND user_id = ?''',
            (block_id, user_id)
        )
        conn.commit()

    return jsonify({'code': 200, 'msg': '删除成功'})


# ========== Interruption Tracking API ==========

@app.route('/api/interruptions', methods=['POST'])
@require_subscription
def record_interruption():
    """Record an interruption"""
    user_id = request.user_id
    data = request.get_json()
    source = data.get('source', 'other')
    recovery_minutes = data.get('recovery_minutes', 5)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''INSERT INTO interruptions (user_id, interrupt_time, source, recovery_minutes)
               VALUES (?, ?, ?, ?)''',
            (user_id, datetime.now(), source, recovery_minutes)
        )
        conn.commit()

    return jsonify({'code': 200, 'msg': '记录成功'})


# ========== Team Focus Session API ==========

@app.route('/api/team-focus/create', methods=['POST'])
@require_subscription
def create_team_focus():
    """Create a team focus session"""
    user_id = request.user_id
    data = request.get_json()
    team_id = data.get('team_id')
    start_time = data.get('start_time')
    end_time = data.get('end_time')

    if not team_id or not start_time or not end_time:
        return jsonify({'code': 400, 'msg': '缺少必要参数'})

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''INSERT INTO team_focus_sessions (team_id, creator_id, start_time, end_time, status)
               VALUES (?, ?, ?, ?, 'active')''',
            (team_id, user_id, start_time, end_time)
        )
        session_id = cursor.lastrowid
        # Add creator as first member
        cursor.execute(
            '''INSERT INTO team_focus_members (session_id, user_id, status)
               VALUES (?, ?, 'focusing')''',
            (session_id, user_id)
        )
        conn.commit()
        logger.info(f"Team focus session created: {session_id}")

    return jsonify({'code': 200, 'data': {'session_id': session_id}})


@app.route('/api/team-focus/join', methods=['POST'])
@require_subscription
def join_team_focus():
    """Join an existing team focus session"""
    user_id = request.user_id
    data = request.get_json()
    session_id = data.get('session_id')

    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Check if already joined
        cursor.execute(
            '''SELECT id FROM team_focus_members
               WHERE session_id = ? AND user_id = ?''',
            (session_id, user_id)
        )
        if not cursor.fetchone():
            cursor.execute(
                '''INSERT INTO team_focus_members (session_id, user_id, status)
                   VALUES (?, ?, 'focusing')''',
                (session_id, user_id)
            )
        conn.commit()

    return jsonify({'code': 200, 'msg': '已加入专注会议'})


@app.route('/api/team-focus/update-status', methods=['POST'])
@require_subscription
def update_focus_status():
    """Update your focus status in the session"""
    user_id = request.user_id
    data = request.get_json()
    session_id = data.get('session_id')
    status = data.get('status')  # 'focusing', 'break', 'finished'

    if status not in ('focusing', 'break', 'finished'):
        return jsonify({'code': 400, 'msg': '无效状态'})

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''UPDATE team_focus_members SET status = ? WHERE session_id = ? AND user_id = ?''',
            (status, session_id, user_id)
        )
        conn.commit()

    return jsonify({'code': 200, 'msg': '状态更新成功'})


@app.route('/api/team-focus/current', methods=['GET'])
@require_subscription
def get_current_team_focus():
    """Get current active focus session for a team"""
    user_id = request.user_id
    team_id = request.args.get('team_id')

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''SELECT s.id, s.creator_id, s.start_time, s.end_time, s.status,
                      m.user_id, m.status as member_status
               FROM team_focus_sessions s
               LEFT JOIN team_focus_members m ON s.id = m.session_id
               WHERE s.team_id = ? AND s.status = 'active'
               ORDER BY s.created_at DESC LIMIT 1''',
            (team_id,)
        )
        rows = cursor.fetchall()
        if not rows:
            return jsonify({'code': 200, 'data': None})

        session = {
            'id': rows[0][0],
            'creator_id': rows[0][1],
            'start_time': rows[0][2],
            'end_time': rows[0][3],
            'status': rows[0][4],
            'members': []
        }
        for row in rows:
            if row[5]:
                session['members'].append({
                    'user_id': row[5],
                    'status': row[6],
                })

    return jsonify({'code': 200, 'data': session})


# ========== New APIs for Team/AI/Deep Work ==========

@app.route('/api/user/roles', methods=['GET'])
@require_subscription
def get_user_roles():
    """Get user roles for dynamic menu display"""
    user_id = request.user_id
    has_org_admin = False
    has_team_lead = False
    has_any_team = False

    # Get user subscription plan
    # Mapping: is_vip=0 → free, 1 → personal, 2 → business
    plan = 'free'
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''SELECT is_vip FROM users WHERE id = ?''',
            (user_id,)
        )
        result = cursor.fetchone()
        if result:
            is_vip = result[0]
            if is_vip == 1:
                plan = 'personal'
            elif is_vip == 2:
                plan = 'business'

        cursor.execute(
            '''SELECT role FROM org_members WHERE user_id = ?''',
            (user_id,)
        )
        rows = cursor.fetchall()
        for row in rows:
            role = row[0]
            if role == 'admin':
                has_org_admin = True
                has_team_lead = True
                has_any_team = True
            elif role == 'lead':
                has_team_lead = True
                has_any_team = True
            elif role == 'member':
                has_any_team = True

    return jsonify({
        'code': 200,
        'data': {
            'hasOrgAdmin': has_org_admin,
            'hasTeamLead': has_team_lead,
            'hasAnyTeam': has_any_team,
            'plan': plan,
        }
    })


@app.route('/api/habits', methods=['GET'])
@require_subscription
def get_habits():
    """Get all habits for current user with today's checkins"""
    user_id = request.user_id
    today = datetime.now().strftime('%Y-%m-%d')

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''SELECT id, name, target_hours FROM habit_targets WHERE user_id = ? ORDER BY created_at''',
            (user_id,)
        )
        habits = [
            {'id': row[0], 'name': row[1], 'target_hours': row[2]}
            for row in cursor.fetchall()
        ]

        cursor.execute(
            '''SELECT id, habit_id, user_id, checkin_date, actual_hours, completed
               FROM habit_checkins WHERE user_id = ? AND checkin_date = ?''',
            (user_id, today)
        )
        checkins = [
            {
                'id': row[0],
                'habit_id': row[1],
                'user_id': row[2],
                'checkin_date': row[3],
                'actual_hours': row[4],
                'completed': row[5],
            }
            for row in cursor.fetchall()
        ]

    return jsonify({
        'code': 200,
        'data': {
            'habits': habits,
            'checkins': checkins,
        }
    })


@app.route('/api/deep-work/stats', methods=['GET'])
@require_subscription
def get_deep_work_stats():
    """Get deep work statistics (flow blocks + interruptions)"""
    user_id = request.user_id
    period = request.args.get('period', 'week')

    if period == 'week':
        start_date = datetime.now() - timedelta(days=7)
    else:  # month
        start_date = datetime.now() - timedelta(days=30)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Flow block stats
        cursor.execute(
            '''SELECT SUM(duration_minutes), COUNT(id), AVG(duration_minutes), MAX(duration_minutes)
               FROM deep_flow_blocks WHERE user_id = ? AND created_at >= ?''',
            (user_id, start_date)
        )
        row = cursor.fetchone()
        total_flow = row[0] or 0
        count_blocks = row[1] or 0
        avg_flow = row[2] or 0
        max_flow = row[3] or 0

        # Flow by hour distribution
        cursor.execute(
            '''SELECT strftime('%H', start_time) as hour, SUM(duration_minutes)
               FROM deep_flow_blocks WHERE user_id = ? AND created_at >= ?
               GROUP BY hour ORDER BY hour''',
            (user_id, start_date)
        )
        flow_by_hour = [
            {'hour': int(r[0]), 'minutes': r[1]} for r in cursor.fetchall()
        ]
        # Fill in missing hours with 0
        full_flow_by_hour = []
        for hour in range(0, 24):
            found = next((x for x in flow_by_hour if x['hour'] == hour), None)
            full_flow_by_hour.append({'hour': hour, 'minutes': found['minutes'] if found else 0})

        # Interruption stats
        cursor.execute(
            '''SELECT COUNT(id), SUM(recovery_minutes), source, COUNT(*) as cnt
               FROM interruptions WHERE user_id = ? AND created_at >= ?
               GROUP BY source ORDER BY cnt DESC''',
            (user_id, start_date)
        )
        interruption_by_source = [
            {'source': r[2], 'count': r[3]} for r in cursor.fetchall()
        ]
        total_interruptions = sum(r['count'] for r in interruption_by_source)
        total_recovery = row[1] or 0
        cursor.execute(
            '''SELECT SUM(recovery_minutes) FROM interruptions WHERE user_id = ? AND created_at >= ?''',
            (user_id, start_date)
        )
        tr = cursor.fetchone()
        total_recovery = tr[0] or 0

    return jsonify({
        'code': 200,
        'data': {
            'total_flow_minutes': total_flow,
            'flow_block_count': count_blocks,
            'avg_flow_duration': avg_flow,
            'max_flow_duration': max_flow,
            'flow_by_hour': full_flow_by_hour,
            'interruption_count': total_interruptions,
            'interruption_by_source': interruption_by_source,
            'total_recovery_minutes': total_recovery,
        }
    })


@app.route('/api/team/stats', methods=['GET'])
@require_subscription
def get_team_stats():
    """Get team statistics for dashboard"""
    user_id = request.user_id
    org_id = request.args.get('org_id', type=int)
    team_id = request.args.get('team_id', type=int)

    # Check permission (must be lead or admin)
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''SELECT role FROM org_members
               WHERE org_id = ? AND team_id = ? AND user_id = ?''',
            (org_id, team_id, user_id)
        )
        row = cursor.fetchone()
        if not row or row[0] not in ('admin', 'lead'):
            return jsonify({'code': 403, 'msg': '无权限'})

        # Count members
        cursor.execute(
            '''SELECT COUNT(*) FROM org_members
               WHERE org_id = ? AND team_id = ? AND status = 'active''',
            (org_id, team_id)
        )
        total_members = cursor.fetchone()[0]

        # Count active members this week
        week_ago = (datetime.now() - timedelta(days=7)).isoformat()
        cursor.execute(
            '''SELECT COUNT(DISTINCT user_id) FROM activities
               WHERE org_id = ? AND team_id = ? AND created_at >= ?''',
            (org_id, team_id, week_ago)
        )
        active_members = cursor.fetchone()[0] or 0

        # Total hours this week
        cursor.execute(
            '''SELECT SUM(
               (julianday(end_time) - julianday(start_time)) * 24 * 60
               ) FROM activities WHERE org_id = ? AND team_id = ? AND created_at >= ?''',
            (org_id, team_id, week_ago)
        )
        total_hours = cursor.fetchone()[0] or 0
        total_hours = total_hours / 60  # convert minutes to hours

        # Project utilization (by category)
        cursor.execute(
            '''SELECT category, SUM(
               (julianday(end_time) - julianday(start_time)) * 24 * 60
               ) FROM activities
               WHERE org_id = ? AND team_id = ? AND category IS NOT NULL AND created_at >= ?
               GROUP BY category ORDER BY SUM(
               (julianday(end_time) - julianday(start_time)) * 24 * 60
               ) DESC''',
            (org_id, team_id, week_ago)
        )
        project_data = []
        max_hours = 1
        rows = cursor.fetchall()
        if rows:
            max_hours = max(row[1] for row in rows) / 60
            for row in rows:
                project_data.append({
                    'project': row[0],
                    'hours': (row[1] / 60),
                    'utilization': (row[1] / 60) / (max_hours if max_hours > 0 else 1) * 100
                })

        # Average utilization per member (assume 8h/day * 5days = 40h weekly target)
        if active_members > 0:
            avg_utilization = (total_hours / (active_members * 40)) * 100
        else:
            avg_utilization = 0

    return jsonify({
        'code': 200,
        'data': {
            'total_members': total_members,
            'active_members': active_members,
            'total_hours_this_week': total_hours,
            'avg_utilization': avg_utilization,
            'project_utilization': project_data,
        }
    })


@app.route('/api/privacy/save', methods=['POST'])
@require_subscription
def save_privacy_settings():
    """Save privacy settings"""
    user_id = request.user_id
    data = request.get_json()
    sync_mode = data.get('sync_mode', 'summary_only')
    cloud_encryption = data.get('cloud_encryption', True)
    retain_raw_local = data.get('retain_raw_local', True)
    auto_delete_days = data.get('auto_delete_days', 0)

    # We just save these settings to the backend - frontend keeps a copy too
    # For privacy, we don't store the encryption key here, only settings

    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Check if settings exist
        cursor.execute('''SELECT id FROM user_settings WHERE user_id = ? AND key LIKE 'privacy_%' ''', (user_id,))
        # Delete existing privacy settings
        cursor.execute('''DELETE FROM user_settings WHERE user_id = ? AND key LIKE 'privacy_%' ''', (user_id,))
        # Insert new settings
        settings = [
            ('privacy_sync_mode', sync_mode),
            ('privacy_cloud_encryption', str(cloud_encryption)),
            ('privacy_retain_raw_local', str(retain_raw_local)),
            ('privacy_auto_delete_days', str(auto_delete_days)),
        ]
        for key, value in settings:
            cursor.execute(
                '''INSERT INTO user_settings (user_id, key, value) VALUES (?, ?, ?)''',
                (user_id, key, value)
            )
        conn.commit()

    return jsonify({'code': 200, 'msg': '隐私设置保存成功'})


# ========== melegal 可颂法务 API ==========
# 可颂法务 - 让普通人打得起官司
# AI法律文书生成 + 律师复核服务

from services.ai_client import AIClient

ai_client = AIClient.get_default_client()

@app.route('/api/melegal/generate', methods=['POST'])
def melegal_generate_document():
    """
    Generate legal document using AI
    Body:
    - scene_id: str scene type
    - answers: dict user answers
    - package: str basic/pro/premium
    """
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({'code': 401, 'msg': '未授权'})
    token = auth_header.split(' ')[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'code': 401, 'msg': 'Token无效'})

    data = request.get_json()
    scene_id = data.get('scene_id')
    answers = data.get('answers', {})
    package = data.get('package', 'basic')

    # Generate document from template with user answers
    # For different scenes, we have different prompt templates
    prompt = ai_client.build_legal_document_prompt(scene_id, answers)
    document_content = ai_client.generate_document(prompt)

    # Auto law article check
    validation_result = ai_client.validate_law_articles(document_content)

    # If package is pro/premium, queue for lawyer review
    document_status = 'generating' if package == 'basic' else 'reviewing'

    # Save to database
    with get_db_connection() as conn:
        cursor = conn.cursor()
        prices = {'basic': 9.9, 'pro': 29.9, 'premium': 99}
        price = prices.get(package, 9.9)
        cursor.execute('''
            INSERT INTO melegal_documents
            (user_id, scene_id, answers, content, status, package_type, price)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, scene_id, json.dumps(answers), document_content, document_status, package, price))
        document_id = cursor.lastrowid
        conn.commit()

    response = {
        'code': 200,
        'data': {
            'document_id': document_id,
            'content': document_content,
            'status': document_status,
            'validation': validation_result,
        }
    }

    return jsonify(response)


@app.route('/api/melegal/list', methods=['GET'])
def melegal_list_documents():
    """List all user's documents"""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({'code': 401, 'msg': '未授权'})
    token = auth_header.split(' ')[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'code': 401, 'msg': 'Token无效'})

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, scene_id, status, package_type, price, created_at
            FROM melegal_documents
            WHERE user_id = ?
            ORDER BY created_at DESC
        ''', (user_id,))
        rows = cursor.fetchall()

        scene_names = {
            'civil-debt': '民事起诉状 - 欠钱不还',
            'labor-dispute': '劳动仲裁 - 工资/社保',
            'divorce-agreement': '离婚协议书',
            'consumer-rights': '消费维权起诉状',
            '答辩状': '民事答辩状',
            'loan-contract': '民间借贷借条',
            'custom': '自定义案件',
        }

        documents = []
        for row in rows:
            id, scene_id, status, package_type, price, created_at = row
            documents.append({
                'id': str(id),
                'sceneName': scene_names.get(scene_id, scene_id),
                'status': status,
                'packageType': package_type,
                'price': price,
                'createdAt': created_at.strftime('%Y-%m-%d') if created_at else '',
            })

    return jsonify({'code': 200, 'data': documents})


@app.route('/api/melegal/download/<int:document_id>', methods=['GET'])
def melegal_download(document_id):
    """Get document content for download"""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({'code': 401, 'msg': '未授权'})
    token = auth_header.split(' ')[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'code': 401, 'msg': 'Token无效'})

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT content, status, package_type FROM melegal_documents
            WHERE id = ? AND user_id = ?
        ''', (document_id, user_id))
        row = cursor.fetchone()
        if not row:
            return jsonify({'code': 404, 'msg': '文档不存在'})

        content, status, package_type = row

    return jsonify({
        'code': 200,
        'data': {
            'content': content,
            'status': status,
            'packageType': package_type,
        }
    })


@app.route('/api/melegal/delete/<int:document_id>', methods=['DELETE'])
def melegal_delete(document_id):
    """Delete a document"""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({'code': 401, 'msg': '未授权'})
    token = auth_header.split(' ')[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'code': 401, 'msg': 'Token无效'})

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            DELETE FROM melegal_documents WHERE id = ? AND user_id = ?
        ''', (document_id, user_id))
        conn.commit()

    return jsonify({'code': 200, 'msg': '删除成功'})


@app.route('/api/melegal/validate', methods=['POST'])
def melegal_validate():
    """Validate law articles in document"""
    data = request.get_json()
    content = data.get('content', '')
    result = ai_client.validate_law_articles(content)
    return jsonify({'code': 200, 'data': result})


@app.route('/api/melegal/generate-custom', methods=['POST'])
def melegal_generate_custom():
    """Generate custom legal document from user description (chat mode)
    Body:
    - description: str user's full description
    """
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({'code': 401, 'msg': '未授权'})
    token = auth_header.split(' ')[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'code': 401, 'msg': 'Token无效'})

    data = request.get_json()
    description = data.get('description', '')

    # Build prompt for custom generation
    prompt = """你是一位经验丰富的中国律师，请根据用户描述的案情和需求，帮用户生成一份专业规范的法律文书。

要求：
1. 根据用户需求判断需要什么类型的法律文书，使用正确的格式
2. 诉讼请求/事实理由要清晰明确
3. 使用法言法语，但保持内容准确
4. 如果用户信息不足，你根据常识合理补充完整
5. 只输出最终文书内容，不要其他解释

用户描述：
%s
""" % description

    document_content = ai_client.generate_document(prompt)

    # Auto law article check
    validation_result = ai_client.validate_law_articles(document_content)

    # Always basic package for custom, user can upgrade later
    document_status = 'done'
    price = 9.9

    # Save to database
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO melegal_documents
            (user_id, scene_id, answers, content, status, package_type, price)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, 'custom', json.dumps({'description': description}), document_content, document_status, 'basic', price))
        document_id = cursor.lastrowid
        conn.commit()

    response = {
        'code': 200,
        'data': {
            'document_id': document_id,
            'content': document_content,
            'status': document_status,
            'validation': validation_result,
        }
    }

    return jsonify(response)


# ========== Browser development mode APIs - read activities from local data directory ==========

import os
import json
from datetime import datetime

def process_activities_data(raw_activities, date_str):
    """
    Process raw activities data from JSON file:
    1. Convert snake_case to camelCase for frontend
    2. Calculate missing startTimeMs if not present
    3. Merge consecutive activities with same app name
    """
    # Parse date start time (midnight)
    year, month, day = map(int, date_str.split('-'))
    from datetime import datetime
    day_start_dt = datetime(year, month, day, 0, 0, 0)
    day_start_ms = int(day_start_dt.timestamp() * 1000)

    # Step 1: Convert field names and calculate cumulative start times
    converted = []
    current_start_ms = day_start_ms

    for raw in raw_activities:
        # Convert snake_case to camelCase
        activity = {
            'id': raw.get('id', ''),
            'name': raw.get('name', ''),
            'windowTitle': raw.get('window_title', '') or raw.get('windowTitle', ''),
            'category': raw.get('category'),
            'taskId': raw.get('task_id'),
            'startTimeMs': raw.get('start_time_ms', current_start_ms) or current_start_ms,
            'durationMinutes': raw.get('duration_minutes', 0) or raw.get('durationMinutes', 0),
        }
        converted.append(activity)
        # Update next start time
        current_start_ms = activity['startTimeMs'] + int(activity['durationMinutes'] * 60 * 1000)

    # Step 2: Merge consecutive activities with same app name
    if not converted:
        return []

    merged = []
    current = None

    for activity in converted:
        if current is None:
            current = activity.copy()
            continue

        # If same app name (and same category), merge
        if current['name'] == activity['name'] and current['category'] == activity['category']:
            # Extend duration
            current['durationMinutes'] += activity['durationMinutes']
            # Keep the first start time
        else:
            # Push current and start new
            merged.append(current)
            current = activity.copy()

    # Push the last one
    if current is not None:
        merged.append(current)

    # Filter out activities with less than 0.5 minutes (30 seconds) - they are just flickers
    merged = [a for a in merged if a['durationMinutes'] >= 0.5]

    return merged


@app.route('/api/browser/get-today-activities', methods=['GET'])
def browser_get_today_activities():
    """Get today's activities from local data directory (for browser dev mode)"""
    today = datetime.now().date()
    date_str = today.strftime('%Y-%m-%d')

    # On macOS, data directory is ~/Library/Application Support/trace/
    home_dir = os.path.expanduser('~')
    data_dir = os.path.join(home_dir, 'Library', 'Application Support', 'trace')
    file_path = os.path.join(data_dir, f'activities_{date_str}.json')

    if not os.path.exists(file_path):
        return jsonify({'code': 200, 'data': []})

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            raw_activities = json.load(f)
        processed = process_activities_data(raw_activities, date_str)
        return jsonify({'code': 200, 'data': processed})
    except Exception as e:
        return internal_server_error('Failed to read activities file', e)


@app.route('/api/browser/get-activities-by-date', methods=['GET'])
def browser_get_activities_by_date():
    """Get activities by date from local data directory (for browser dev mode)"""
    date_str = request.args.get('date', '')
    if not date_str:
        return jsonify({'code': 400, 'msg': 'Missing date parameter'})

    # On macOS, data directory is ~/Library/Application Support/trace/
    home_dir = os.path.expanduser('~')
    data_dir = os.path.join(home_dir, 'Library', 'Application Support', 'trace')
    file_path = os.path.join(data_dir, f'activities_{date_str}.json')

    if not os.path.exists(file_path):
        return jsonify({'code': 200, 'data': []})

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            raw_activities = json.load(f)
        processed = process_activities_data(raw_activities, date_str)
        return jsonify({'code': 200, 'data': processed})
    except Exception as e:
        return internal_server_error('Failed to read activities file', e)


@app.route('/api/browser/get-today-stats', methods=['GET'])
def browser_get_today_stats():
    """Calculate today stats from activities (for browser dev mode)"""
    date_str = request.args.get('date', '')
    if not date_str:
        date_str = datetime.now().date().strftime('%Y-%m-%d')

    home_dir = os.path.expanduser('~')
    data_dir = os.path.join(home_dir, 'Library', 'Application Support', 'trace')
    file_path = os.path.join(data_dir, f'activities_{date_str}.json')

    if not os.path.exists(file_path):
        return jsonify({
            'code': 200,
            'data': {
                'total_focus_minutes': 0,
                'total_categories': 0,
                'top_category': ''
            }
        })

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            activities = json.load(f)

        category_counts = {}
        total_focus = 0.0
        for activity in activities:
            total_focus += activity.get('duration_minutes', 0)
            category = activity.get('category')
            if category:
                if category not in category_counts:
                    category_counts[category] = 0
                category_counts[category] += activity.get('duration_minutes', 0)

        top_category = ''
        max_duration = 0
        for cat, duration in category_counts.items():
            if duration > max_duration:
                max_duration = duration
                top_category = cat

        return jsonify({
            'code': 200,
            'data': {
                'total_focus_minutes': total_focus,
                'total_categories': len(category_counts),
                'top_category': top_category
            }
        })
    except Exception as e:
        return internal_server_error('Failed to calculate stats', e)


@app.route('/api/browser/get-monthly-stats', methods=['GET'])
def browser_get_monthly_stats():
    """Get monthly stats for heatmap (for browser dev mode)"""
    year = request.args.get('year', '')
    month = request.args.get('month', '')
    if not year or not month:
        return jsonify({'code': 400, 'msg': 'Missing year/month parameters'})

    year = int(year)
    month = int(month)

    home_dir = os.path.expanduser('~')
    data_dir = os.path.join(home_dir, 'Library', 'Application Support', 'trace')

    # Calculate number of days in this month
    if month == 12:
        next_month_start = datetime(year + 1, 1, 1)
    else:
        next_month_start = datetime(year, month + 1, 1)
    days_in_month = (next_month_start - datetime(year, month, 1)).days

    result = []

    for day in range(1, days_in_month + 1):
        date_str = f'{year:04d}-{month:02d}-{day:02d}'
        file_path = os.path.join(data_dir, f'activities_{date_str}.json')

        total_minutes = 0
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    activities = json.load(f)
                for activity in activities:
                    total_minutes += activity.get('duration_minutes', 0) or activity.get('durationMinutes', 0)
            except Exception:
                pass

        result.append({
            'day': day,
            'total_minutes': total_minutes
        })

    return jsonify({
        'code': 200,
        'data': result
    })


# ========== Tasks API ==========

@app.route('/api/tasks', methods=['GET'])
@require_subscription
def list_tasks():
    """Get all tasks for current user"""
    user_id = request.user_id
    status = request.args.get('status')
    from services.task_service import TaskService
    tasks = TaskService.list_tasks(user_id, status)
    return jsonify({'code': 200, 'data': tasks})


@app.route('/api/tasks/<int:task_id>', methods=['GET'])
@require_subscription
def get_task(task_id):
    """Get a specific task"""
    user_id = request.user_id
    from services.task_service import TaskService
    task = TaskService.get_task(task_id, user_id)
    if not task:
        return jsonify({'code': 404, 'msg': '任务不存在'})
    return jsonify({'code': 200, 'data': task})


@app.route('/api/tasks/create', methods=['POST'])
@require_subscription
def create_task():
    """Create a new task"""
    user_id = request.user_id
    data = request.get_json()
    from services.task_service import TaskService
    task = TaskService.create_task(user_id, data)
    return jsonify({'code': 200, 'data': {'id': task.id}})


@app.route('/api/tasks/<int:task_id>/update', methods=['POST'])
@require_subscription
def update_task(task_id):
    """Update an existing task"""
    user_id = request.user_id
    data = request.get_json()
    from services.task_service import TaskService
    task = TaskService.update_task(task_id, user_id, data)
    if not task:
        return jsonify({'code': 404, 'msg': '任务不存在'})
    return jsonify({'code': 200, 'msg': '更新成功'})


@app.route('/api/tasks/<int:task_id>/delete', methods=['POST'])
@require_subscription
def delete_task(task_id):
    """Delete a task"""
    user_id = request.user_id
    from services.task_service import TaskService
    success = TaskService.delete_task(task_id, user_id)
    if not success:
        return jsonify({'code': 404, 'msg': '任务不存在'})
    return jsonify({'code': 200, 'msg': '删除成功'})


@app.route('/api/tasks/<int:task_id>/toggle', methods=['POST'])
@require_subscription
def toggle_task(task_id):
    """Toggle task completed status"""
    user_id = request.user_id
    from services.task_service import TaskService
    task = TaskService.toggle_completed(task_id, user_id)
    if not task:
        return jsonify({'code': 404, 'msg': '任务不存在'})
    return jsonify({'code': 200, 'data': {'status': task.status}})


# ========== Timeblocks API ==========

@app.route('/api/timeblocks', methods=['GET'])
@require_subscription
def get_timeblocks():
    """Get timeblocks for a specific date"""
    user_id = request.user_id
    date = request.args.get('date')
    from services.timeblock_service import TimeBlockService
    blocks = TimeBlockService.get_timeblocks_by_date(user_id, date)
    return jsonify({'code': 200, 'data': blocks})


@app.route('/api/timeblocks/create', methods=['POST'])
@require_subscription
def create_timeblock():
    """Create a new timeblock"""
    user_id = request.user_id
    data = request.get_json()
    from services.timeblock_service import TimeBlockService
    block = TimeBlockService.create_timeblock(user_id, data)
    if not block:
        return jsonify({'code': 400, 'msg': '创建失败'})
    return jsonify({'code': 200, 'data': {'id': block.id}})


@app.route('/api/timeblocks/<int:block_id>/update', methods=['POST'])
@require_subscription
def update_timeblock(block_id):
    """Update an existing timeblock"""
    user_id = request.user_id
    data = request.get_json()
    from services.timeblock_service import TimeBlockService
    block = TimeBlockService.update_timeblock(block_id, user_id, data)
    if not block:
        return jsonify({'code': 404, 'msg': '时间块不存在'})
    return jsonify({'code': 200, 'msg': '更新成功'})


@app.route('/api/timeblocks/<int:block_id>/delete', methods=['POST'])
@require_subscription
def delete_timeblock(block_id):
    """Delete a timeblock"""
    user_id = request.user_id
    from services.timeblock_service import TimeBlockService
    success = TimeBlockService.delete_timeblock(block_id, user_id)
    if not success:
        return jsonify({'code': 404, 'msg': '时间块不存在'})
    return jsonify({'code': 200, 'msg': '删除成功'})


@app.route('/api/timeblocks/<int:block_id>/toggle', methods=['POST'])
@require_subscription
def toggle_timeblock(block_id):
    """Toggle timeblock completed status"""
    user_id = request.user_id
    from services.timeblock_service import TimeBlockService
    block = TimeBlockService.toggle_completed(block_id, user_id)
    if not block:
        return jsonify({'code': 404, 'msg': '时间块不存在'})
    return jsonify({'code': 200, 'data': {'is_completed': block.is_completed}})


@app.route('/api/ai/suggest-schedule', methods=['POST'])
@require_subscription
def suggest_schedule():
    """AI suggests timeblock schedule based on tasks"""
    user_id = request.user_id
    data = request.get_json()
    tasks = data.get('tasks', [])
    total_hours = data.get('total_hours_available', 8.0)
    from ai.analysis import suggest_timeblock_schedule
    suggestions = suggest_timeblock_schedule(tasks, total_hours)
    return jsonify({'code': 200, 'data': suggestions})


# ========== Virtual Pet API ==========

@app.route('/api/pet', methods=['GET'])
@require_subscription
def get_pet():
    """Get user's pet info"""
    user_id = request.user_id
    from services.pet_service import PetService
    pet = PetService.get_or_create(user_id)
    return jsonify({'code': 200, 'data': PetService.to_dict(pet)})


@app.route('/api/pet/feed', methods=['POST'])
@require_subscription
def feed_pet():
    """Feed the pet"""
    user_id = request.user_id
    data = request.get_json()
    food_type = data.get('food_type', 'normal')
    from services.pet_service import PetService
    pet = PetService.get_or_create(user_id)
    result = PetService.feed(pet.id, user_id, food_type)
    if not result:
        return jsonify({'code': 400, 'msg': '喂食失败'})
    return jsonify({'code': 200, 'data': result})


@app.route('/api/pet/interact', methods=['POST'])
@require_subscription
def interact_pet():
    """Interact with the pet"""
    user_id = request.user_id
    data = request.get_json()
    pet_id = data.get('pet_id')
    from services.pet_service import PetService
    result = PetService.interact(pet_id, user_id)
    if not result:
        return jsonify({'code': 404, 'msg': '宠物不存在'})
    return jsonify({'code': 200, 'data': result})


@app.route('/api/pet/rename', methods=['POST'])
@require_subscription
def rename_pet():
    """Rename the pet"""
    user_id = request.user_id
    data = request.get_json()
    name = data.get('name', '')
    pet_type = data.get('pet_type')
    from services.pet_service import PetService
    pet = PetService.get_or_create(user_id)
    if name:
        pet.name = name
    if pet_type:
        pet.pet_type = pet_type
    from utils.database import db
    db.session.commit()
    return jsonify({'code': 200, 'data': PetService.to_dict(pet)})


@app.route('/api/pet/add-focus', methods=['POST'])
@require_subscription
def add_focus_to_pet():
    """Add experience based on focus minutes"""
    user_id = request.user_id
    data = request.get_json()
    minutes = data.get('minutes', 0)
    from services.pet_service import PetService
    result = PetService.add_experience(user_id, minutes)
    return jsonify({'code': 200, 'data': result})


@app.route('/api/pet/penalize-distraction', methods=['POST'])
@require_subscription
def penalize_distraction(user_id):
    """Penalize pet mood for distraction"""
    user_id = request.user_id
    data = request.get_json()
    minutes = data.get('minutes', 0)
    from services.pet_service import PetService
    pet = PetService.get_or_create(user_id)
    PetService.penalize_mood(pet, minutes)
    from utils.database import db
    db.session.commit()
    return jsonify({'code': 200, 'data': PetService.to_dict(pet)})


# ========== AI Analysis API ==========

@app.route('/api/ai/weekly-report', methods=['POST'])
@require_subscription
def generate_weekly_report():
    """Generate weekly efficiency report"""
    user_id = request.user_id
    data = request.get_json()
    from ai.analysis import generate_weekly_report
    report = generate_weekly_report(data)
    return jsonify({'code': 200, 'data': {'report': report}})


@app.route('/api/ai/personal-analysis', methods=['POST'])
@require_subscription
def personal_efficiency_analysis():
    """Generate personal efficiency profile analysis"""
    user_id = request.user_id
    data = request.get_json()
    from ai.analysis import analyze_personal_efficiency
    analysis = analyze_personal_efficiency(data)
    return jsonify({'code': 200, 'data': {'analysis': analysis}})


# ========== HR Gamification API ==========

@app.route('/api/team/ranking', methods=['GET'])
@require_subscription
def get_weekly_ranking():
    """Get weekly team ranking"""
    user_id = request.user_id
    team_id = request.args.get('team_id', type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    from services.hr_service import HRService
    ranking = HRService.get_weekly_ranking(team_id, start_date, end_date)
    return jsonify({'code': 200, 'data': ranking})


@app.route('/api/team/member-stat', methods=['GET'])
@require_subscription
def get_member_stat():
    """Get member stats"""
    user_id = request.user_id
    team_id = request.args.get('team_id', type=int)
    from services.hr_service import HRService
    stat = HRService.get_or_create_member_stat(team_id, user_id)
    return jsonify({'code': 200, 'data': HRService.to_dict(stat)})


@app.route('/api/team/add-experience', methods=['POST'])
@require_subscription
def add_team_experience():
    """Add experience/points to member from logged hours"""
    user_id = request.user_id
    data = request.get_json()
    team_id = data.get('team_id')
    hours = data.get('hours', 0)
    from services.hr_service import HRService
    result = HRService.add_experience(team_id, user_id, hours)
    return jsonify({'code': 200, 'data': result})


# ========== AI Classification (new - Volcano Engine) ==========

@app.route('/api/ai/classify-activity', methods=['POST'])
@require_subscription
def classify_activity():
    """Classify activity using AI"""
    user_id = request.user_id
    data = request.get_json()
    app_name = data.get('app_name', '')
    window_title = data.get('window_title', '')
    existing_categories = data.get('existing_categories', [])
    custom_rules = data.get('custom_rules', '')
    provider = data.get('provider', None)
    from ai.classification import classify_activity
    category = classify_activity(app_name, window_title, existing_categories, custom_rules, provider)
    return jsonify({'code': 200, 'data': {'category': category}})


@app.route('/api/ai/suggest-category', methods=['POST'])
@require_subscription
def suggest_category():
    """Suggest category for a task"""
    user_id = request.user_id
    data = request.get_json()
    title = data.get('title', '')
    description = data.get('description', '')
    provider = data.get('provider', None)
    from ai.classification import suggest_category
    category = suggest_category(title, description, provider)
    return jsonify({'code': 200, 'data': {'category': category}})


# ========== AI Productivity Coach ==========

@app.route('/api/ai/daily-insights', methods=['POST'])
@require_subscription
def daily_insights():
    """Generate daily productivity insights using AI"""
    user_id = request.user_id
    data = request.get_json()
    daily_data = data.get('daily_data', {})
    from ai.analysis import generate_daily_insights
    insights = generate_daily_insights(daily_data)
    return jsonify({'code': 200, 'data': {'insights': insights}})


@app.route('/api/ai/weekly-report', methods=['POST'])
@require_subscription
def weekly_report():
    """Generate weekly productivity report using AI"""
    user_id = request.user_id
    data = request.get_json()
    weekly_data = data.get('weekly_data', {})
    from ai.analysis import generate_weekly_report
    report = generate_weekly_report(weekly_data)
    return jsonify({'code': 200, 'data': {'report': report}})


@app.route('/api/ai/analyze-personal', methods=['POST'])
@require_subscription
def analyze_personal():
    """Generate personal efficiency profile analysis"""
    user_id = request.user_id
    data = request.get_json()
    profile = data.get('profile', {})
    from ai.analysis import analyze_personal_efficiency
    analysis = analyze_personal_efficiency(profile)
    return jsonify({'code': 200, 'data': {'analysis': analysis}})


if __name__ == '__main__':
    # Initialize database on startup
    init_database()
    logger.info("Database initialized")
    app.run(host='0.0.0.0', port=2345, debug=True)
