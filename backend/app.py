"""
Rize 中文本地化 - 后端API
支持：手机号验证码登录、微信登录、活动记录存储、AI分类统计
Refactored according to Aurum Tech architecture specification 2026
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
import random
import re
import json
from datetime import datetime, timedelta

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


# ========== JWT工具函数 ==========
def generate_token(user_id: int) -> str:
    """Generate JWT token"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=365)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


def verify_token(token: str) -> int | None:
    """Verify JWT token, return user_id or None"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['user_id']
    except Exception:
        return None


def check_subscription_valid(user_id: int) -> tuple[bool, str | None]:
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
            return jsonify({'code': 403, 'msg': error, 'code': 'SUBSCRIPTION_EXPIRED'})

        # Add user_id to request for later use
        request.user_id = user_id
        return f(*args, **kwargs)
    return decorated


# ========== 验证码存储（SQLite）==========
def save_verification_code(phone: str, code: str, expire_minutes: int = 10):
    """Save verification code to database with expiration"""
    expire_at = datetime.now() + timedelta(minutes=expire_minutes)
    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Remove old expired codes
        cursor.execute(
            'DELETE FROM verification_codes WHERE phone = ? OR expire_at < CURRENT_TIMESTAMP',
            (phone,)
        )
        # Insert new code
        cursor.execute(
            'INSERT INTO verification_codes (phone, code, expire_at) VALUES (?, ?, ?)',
            (phone, code, expire_at)
        )
        conn.commit()


def get_verification_code(phone: str) -> dict | None:
    """Get valid verification code from database"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            'SELECT code, expire_at FROM verification_codes WHERE phone = ? ORDER BY created_at DESC LIMIT 1',
            (phone,)
        )
        row = cursor.fetchone()
        if not row:
            return None
        return {'code': row[0], 'expire_at': datetime.fromisoformat(row[1])}


def send_sms_code(phone: str, code: str) -> bool:
    """
    Send SMS verification code via configured provider
    """
    return SMSFactory.send_verification_code(phone, code)


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
        logger.info(f"Verification code sent to {phone}")
        return jsonify({'code': 200, 'msg': '验证码已发送'})
    else:
        return jsonify({'code': 500, 'msg': '发送失败'})


@app.route('/api/auth/login-phone', methods=['POST'])
def login_phone():
    data = request.get_json()
    phone = data.get('phone')
    code = data.get('code')

    # Verify code
    stored = get_verification_code(phone)
    if not stored or stored['code'] != code:
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

    token = generate_token(user_id)
    logger.info(f"User {user_id} logged in via phone {phone}")
    return jsonify({
        'code': 200,
        'data': {
            'token': token,
            'user_id': user_id
        }
    })


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
        logger.error(f"AI classification failed: {str(e)}")
        return jsonify({'code': 500, 'msg': str(e)})


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
        logger.error(f"AI reschedule failed: {str(e)}")
        return jsonify({'code': 500, 'msg': str(e)})


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
        body=f"Merize 看见 {plan['name']}"
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
        total_fee = int(data.get('total_fee', 0)) / 100  # Convert cents to yuan

        # Update order status and user subscription
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Find order
            cursor.execute(
                '''SELECT id, user_id, plan_type, days FROM subscription_orders
                   WHERE order_no = ? AND status = 'pending' ''',
                (order_no,)
            )
            order = cursor.fetchone()

            if not order:
                logger.warning(f"Order not found or already processed: {order_no}")
                return response_xml, 200, {'Content-Type': 'application/xml'}

            order_id, user_id, plan_type, days = order

            # Update order status
            cursor.execute(
                '''UPDATE subscription_orders
                   SET status = 'paid', paid_at = ?, transaction_id = ?, notify_data = ?
                   WHERE id = ?''',
                (datetime.now(), transaction_id, xml_data, order_id)
            )

            # Calculate new expiration date
            # Get current expiration
            cursor.execute('SELECT expire_at FROM users WHERE id = ?', (user_id,))
            user = cursor.fetchone()
            current_expire = user[0]

            now = datetime.now()
            if current_expire:
                if isinstance(current_expire, str):
                    current_expire_dt = datetime.fromisoformat(current_expire)
                else:
                    current_expire_dt = current_expire
                # If current subscription is still active, extend from current expiration
                if current_expire_dt > now:
                    new_expire = current_expire_dt + timedelta(days=days)
                else:
                    new_expire = now + timedelta(days=days)
            else:
                new_expire = now + timedelta(days=days)

            # Update user subscription
            cursor.execute(
                '''UPDATE users SET is_vip = 1, expire_at = ? WHERE id = ?''',
                (new_expire, user_id)
            )

            # Record subscription history
            cursor.execute(
                '''INSERT INTO subscription_history
                   (user_id, event_type, order_id, previous_expire_at, new_expire_at, notes)
                   VALUES (?, ?, ?, ?, ?, ?)''',
                (user_id, 'subscription_start', order_id, current_expire, new_expire,
                 f"Payment completed, {plan_type} plan")
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


if __name__ == '__main__':
    # Initialize database on startup
    init_database()
    logger.info("Database initialized")
    app.run(host='0.0.0.0', port=5000, debug=True)
