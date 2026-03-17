"""
Rize 中文本地化 - 后端API
支持：手机号验证码登录、微信登录、活动记录存储、AI分类统计
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
import hashlib
import random
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
import json
import sqlite3
import os
import sys
import openai
from openai import OpenAI

app = Flask(__name__)
CORS(app)

# ========== 配置 ==========
# 请修改 config.py 覆盖这些配置
SECRET_KEY = os.environ.get('SECRET_KEY', 'change-this-to-your-secret-key')
ERNIE_API_KEY = os.environ.get('ERNIE_API_KEY', '')
DOUBAN_API_KEY = os.environ.get('DOUBAN_API_KEY', '')
WECHAT_APP_ID = os.environ.get('WECHAT_APP_ID', '')
WECHAT_APP_SECRET = os.environ.get('WECHAT_APP_SECRET', '')
SMS_API_KEY = os.environ.get('SMS_API_KEY', '')  # 短信验证码API密钥

# ========== 数据库 ==========
def get_db():
    conn = sqlite3.connect('rize.db')
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
            is_vip INTEGER,
            expire_at TIMESTAMP
        )
    ''')
    
    # 活动记录表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            window_title TEXT,
            application TEXT,
            url TEXT,
            start_time TIMESTAMP,
            end_time TIMESTAMP,
            category TEXT,
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

# 发送短信验证码（这里占位，需要对接实际短信服务商）
def send_sms_code(phone, code):
    # TODO: 对接阿里云/腾讯云短信
    print(f"验证码 {code} 发送到 {phone}")
    return True

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
    
    if not phone or not phone.match(r'^1[3-9]\d{9}$'):
        return jsonify({'code': 400, 'msg': '手机号格式错误'})
    
    # 生成6位验证码
    code = ''.join(random.choices('0123456789', k=6))
    
    # 保存验证码（这里简化，实际应该存在redis设置过期）
    # 这里简化存到内存
    global verification_codes
    verification_codes[phone] = {
        'code': code,
        'expire_at': datetime.now() + timedelta(minutes=10)
    }
    
    if send_sms_code(phone, code):
        return jsonify({'code': 200, 'msg': '验证码已发送'})
    else:
        return jsonify({'code': 500, 'msg': '发送失败'})

@app.route('/api/auth/login-phone', methods=['POST'])
def login_phone():
    data = request.get_json()
    phone = data.get('phone')
    code = data.get('code')
    
    # 验证验证码
    stored = verification_codes.get(phone)
    if not stored or stored['code'] != code:
        return jsonify({'code': 400, 'msg': '验证码错误'})
    
    if datetime.now() > stored['expire_at']:
        return jsonify({'code': 400, 'msg': '验证码已过期'})
    
    # 查询或创建用户
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, is_vip, expire_at FROM users WHERE phone = ?', (phone,))
    row = cursor.fetchone()
    
    if not row:
        # 创建新用户
        cursor.execute(
            'INSERT INTO users (phone, created_at, is_vip, expire_at) VALUES (?, ?, ?, ?)',
            (phone, datetime.now(), 0, None)
        )
        conn.commit()
        user_id = cursor.lastrowid
    else:
        user_id = row[0]
    
    token = generate_token(user_id)
    return jsonify({
        'code': 200,
        'data': {
            'token': token,
            'user_id': user_id
        }
    })

@app.route('/api/auth/wechat', methods=['GET'])
def wechat_login():
    # 微信OAuth登录流程
    code = request.args.get('code')
    if not code:
        # 重定向到微信授权
        redirect_url = f"https://open.weixin.qq.com/connect/qrconnect?appid={WECHAT_APP_ID}&redirect_uri={request.base_url}api/auth/wechat&response_type=code&scope=snsapi_login"
        return jsonify({'code': 302, 'data': {'url': redirect_url}})
    
    # 获取access_token
    # 获取openid
    # 查询或创建用户
    # 返回token
    # 这里简化流程，实际需要完整微信OAuth对接
    return jsonify({'code': 200, 'data': {'token': '...'}})

# 获取今日统计
@app.route('/api/activities/today', methods=['GET'])
def get_today():
    auth_header = request.headers.get('Authorization')
    token = auth_header.replace('Bearer ', '')
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'code': 401, 'msg': '未登录'})
    
    conn = get_db()
    cursor = conn.cursor()
    
    today = datetime.now().date()
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

# 保存活动
@app.route('/api/activities/save', methods=['POST'])
def save_activity():
    auth_header = request.headers.get('Authorization')
    token = auth_header.replace('Bearer ', '')
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'code': 401, 'msg': '未登录'})
    
    data = request.get_json()
    activities = data.get('activities', [])
    
    conn = get_db()
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
    return jsonify({'code': 200, 'msg': '保存成功'})

# AI分类
@app.route('/api/ai/classify', methods=['POST'])
def ai_classify():
    auth_header = request.headers.get('Authorization')
    token = auth_header.replace('Bearer ', '')
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'code': 401, 'msg': '未登录'})
    
    data = request.get_json()
    windows = data.get('windows', [])  # [(title, app_name), ...]
    provider = data.get('provider', 'ernie')  # ernie / doubao
    
    # 构建prompt - 针对中文软件名称优化
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
    
    # 调用AI
    try:
        if provider == 'ernie':
            # 调用文心一言
            client = OpenAI(
                api_key=ERNIE_API_KEY,
                base_url="https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions"
            )
        else:
            # 调用豆包
            client = OpenAI(
                api_key=DOUBAN_API_KEY,
                base_url="https://aip.volcengineapi.com/v1/chat/completions"
            )
        
        response = client.chat.completions.create(
            model="ERNIE-Bot-4" if provider == 'ernie' else "doubao-4k",
            messages=[{"role": "user", "content": prompt}]
        )
        
        category = response.choices[0].message.content.strip()
        # 简化，只取第一个词
        category = category.split()[0] if ' ' in category else category
        
        return jsonify({'code': 200, 'data': {'category': category}})
    except Exception as e:
        return jsonify({'code': 500, 'msg': str(e)})

if __name__ == '__main__':
    # 存储验证码
    verification_codes = {}
    app.run(host='0.0.0.0', port=5000, debug=True)
