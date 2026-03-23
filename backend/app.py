"""
Merize - AI 自动时间追踪工具后端 API
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
    data = request.get_json()
    org_id = data.get('org_id')
    team_id = data.get('team_id')
    role = data.get('role', 'member')

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

        # TODO: Get user_id by phone/email, send invitation
        # For now, create pending invitation record
        # Actual user lookup and notification will be implemented later

    # Placeholder - actual implementation needs user search and notification
    return jsonify({'code': 200, 'msg': '邀请已发送'})


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
            '''SELECT om.id, om.team_id, om.user_id, om.role, om.status, om.invited_at
               FROM org_members om
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


if __name__ == '__main__':
    # Initialize database on startup
    init_database()
    logger.info("Database initialized")
    app.run(host='0.0.0.0', port=5000, debug=True)
