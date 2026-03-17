"""
Arno 中文简化版 - AI 雅思/托福写作批改后端
核心功能：写作批改，支持雅思/托福/多邻国
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
import sqlite3
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app)

# ========== 配置 ==========
# 请修改 config.py 覆盖这些配置
SECRET_KEY = os.environ.get('SECRET_KEY', 'change-this-to-your-secret-key')
ERNIE_API_KEY = os.environ.get('ERNIE_API_KEY', '')
DOUBAN_API_KEY = os.environ.get('DOUBAN_API_KEY', '')
WECHAT_APP_ID = os.environ.get('WECHAT_APP_ID', '')
WECHAT_APP_SECRET = os.environ.get('WECHAT_APP_SECRET', '')

# ========== 数据库 ==========
def get_db():
    conn = sqlite3.connect('arno.db')
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # 用户表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT UNIQUE,
            openid TEXT UNIQUE,
            created_at TIMESTAMP,
            remaining_counts INTEGER,
            is_vip INTEGER,
            expire_at TIMESTAMP
        )
    ''')
    
    # 批改记录表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS corrections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            exam_type TEXT,  # ielts / toefl / duolingo
            content TEXT,
            question TEXT,
            correction TEXT,
            score_estimate INTEGER,
            created_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

init_db()

# ========== 工具函数 ==========
def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=365)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['user_id']
    except:
        return None

# ========== API路由 ==========

# --- 认证 ---
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

# 微信登录
@app.route('/api/auth/wechat', methods=['GET'])
def wechat_login():
    code = request.args.get('code')
    if not code:
        redirect_url = f"https://open.weixin.qq.com/connect/oauth2/authorize?appid={WECHAT_APP_ID}&redirect_uri={request.base_url}api/auth/wechat&response_type=code&scope=snsapi_base"
        return jsonify({'code': 302, 'data': {'url': redirect_url}})
    
    # TODO: 完整微信OAuth流程
    # 获取access_token，获取openid，查询或创建用户
    return jsonify({'code': 200, 'data': {'token': '...'}})

# --- 批改 ---
@app.route('/api/correct/writing', methods=['POST'])
def correct_writing():
    auth_header = request.headers.get('Authorization')
    token = auth_header.replace('Bearer ', '')
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'code': 401, 'msg': '未登录'})
    
    data = request.get_json()
    exam_type = data.get('exam_type', 'ielts')  # ielts / toefl / duolingo
    question = data.get('question', '')  # 题目
    content = data.get('content', '')  # 用户写作内容
    
    if not content.strip():
        return jsonify({'code': 400, 'msg': '请输入写作内容'})
    
    # 检查配额
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT remaining_counts, is_vip FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    if not user:
        return jsonify({'code': 401, 'msg': '用户不存在'})
    
    remaining_counts, is_vip = user
    if remaining_counts <= 0 and not is_vip:
        return jsonify({'code': 403, 'msg': '次数用完了，请购买会员或单次'})
    
    # 构建AI prompt
    prompt = f"""你是一个专业的雅思/托福写作考官，请批改这篇{exam_type}写作。

题目要求：
{question}

考生作文：
{content}

请按照以下格式给我批改结果：

1. 整体评分（雅思满分9，托福满分30）
2. 优点：列出2-3个优点
3. 问题：列出主要语法/逻辑/词汇问题，每个问题给例子
4. 改进建议：给出改进方向
5. 参考范文（可选，如果差异很大给一个简短参考）

请用中文回复，方便中国考生看懂。
"""
    
    # 调用AI
    from openai import OpenAI
    try:
        # 默认使用文心一言，用户可以配置切换豆包
        client = OpenAI(
            api_key=ERNIE_API_KEY,
            base_url="https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions"
        )
        
        response = client.chat.completions.create(
            model="ERNIE-Bot-4",
            messages=[{"role": "user", "content": prompt}]
        )
        
        correction = response.choices[0].message.content.strip()
        
        # 扣减配额
        if not is_vip:
            cursor.execute('UPDATE users SET remaining_counts = remaining_counts - 1 WHERE id = ?', (user_id,))
            conn.commit()
        
        # 保存批改记录
        cursor.execute('''
            INSERT INTO corrections (user_id, exam_type, question, content, correction, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, exam_type, question, content, correction, datetime.now()))
        conn.commit()
        
        return jsonify({
            'code': 200,
            'data': {
                'correction': correction,
                'remaining': remaining_counts - (0 if is_vip else 1)
            }
        })
        
    except Exception as e:
        return jsonify({'code': 500, 'msg': str(e)})

# 获取用户历史批改记录
@app.route('/api/correct/history', methods=['GET'])
def get_history():
    auth_header = request.headers.get('Authorization')
    token = auth_header.replace('Bearer ', '')
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'code': 401, 'msg': '未登录'})
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, exam_type, question, content, created_at 
        FROM corrections 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    ''', (user_id,))
    
    rows = cursor.fetchall()
    result = []
    for row in rows:
        result.append({
            'id': row[0],
            'exam_type': row[1],
            'question': row[2],
            'content_preview': row[3][:100] + '...' if len(row[3]) > 100 else row[3],
            'created_at': row[4]
        })
    
    return jsonify({'code': 200, 'data': result})

# 获取用户信息（剩余次数、会员状态）
@app.route('/api/user/info', methods=['GET'])
def get_user_info():
    auth_header = request.headers.get('Authorization')
    token = auth_header.replace('Bearer ', '')
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'code': 401, 'msg': '未登录'})
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT remaining_counts, is_vip, expire_at FROM users WHERE id = ?', (user_id,))
    row = cursor.fetchone()
    
    return jsonify({
        'code': 200,
        'data': {
            'remaining_counts': row[0],
            'is_vip': bool(row[1]),
            'expire_at': row[2]
        }
    })

# 创建订单（购买单次/会员）
@app.route('/api/order/create', methods=['POST'])
def create_order():
    auth_header = request.headers.get('Authorization')
    token = auth_header.replace('Bearer ', '')
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'code': 401, 'msg': '未登录'})
    
    data = request.get_json()
    product_type = data.get('type')  # single / month / quarter
    
    # 价格对应
    price_map = {
        'single': 2.99,
        'month': 29.9,
        'quarter': 69.9
    }
    
    # 这里生成订单，对接微信支付
    # 简化：返回prepay_id，前端调微信支付
    # 支付成功后webhook更新用户配额
    
    return jsonify({
        'code': 200,
        'data': {
            'order_id': '...',
            'prepay_id': '...',
            'price': price_map.get(product_type, 2.99)
        }
    })

# 微信支付回调
@app.route('/api/pay/callback', methods=['POST'])
def pay_callback():
    # TODO: 处理微信支付回调，更新用户配额/会员
    # 支付成功后：
    # 如果是single -> remaining_counts += 1
    # 如果是month -> is_vip = 1, expire_at = now + 30 days
    return jsonify({'code': 200})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
