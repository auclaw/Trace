"""
法律AI小工具 MVP 后端服务
功能：
1. AI法律咨询
2. 合同文本审查
3. 法律文书生成
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import time
import hashlib
import hmac
import os
import datetime

from config import Config
from db import db

app = Flask(__name__)
CORS(app)

# 配置
config = Config()

# ========== 工具函数 ==========

def call_ai_api(prompt):
    """调用大模型API，默认使用百度文心一言，可改为豆包"""
    if config.AI_PROVIDER == "ernie":
        # 百度文心一言 API 调用
        url = f"https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id={config.ERNIE_API_KEY}&client_secret={config.ERNIE_SECRET_KEY}"
        response = requests.get(url)
        access_token = response.json().get("access_token")
        
        ai_url = f"https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token={access_token}"
        payload = json.dumps({
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7
        })
        headers = {'Content-Type': 'application/json'}
        response = requests.post(ai_url, headers=headers, data=payload)
        result = response.json()
        return result.get("result", "抱歉，AI服务暂时不可用，请稍后再试。")
    
    elif config.AI_PROVIDER == "doubao":
        # 字节跳动豆包 API 调用
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {config.DOUBAO_API_KEY}"
        }
        payload = json.dumps({
            "model": "doubao-lite-128k",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        })
        response = requests.post("https://aquasearch.ai.bytedance.com/api/v1/chat/completions", headers=headers, data=payload)
        result = response.json()
        if "choices" in result and len(result["choices"]) > 0:
            return result["choices"][0]["message"]["content"]
        return "抱歉，AI服务暂时不可用，请稍后再试。"
    
    else:
        return "未配置AI提供商，请在config.py中设置AI_PROVIDER"

# ========== API接口 ==========

@app.route('/api/consult', methods=['POST'])
def legal_consult():
    """AI法律咨询"""
    data = request.get_json()
    question = data.get('question', '').strip()
    open_id = data.get('user_id', '').strip()
    
    if not question:
        return jsonify({"code": 400, "msg": "问题不能为空", "data": None})
    
    # 获取用户
    user = db.get_user_by_openid(open_id)
    if not user:
        # 新用户自动注册
        user_id = db.create_user(open_id)
        user = db.get_user_by_id(user_id)
    else:
        user_id = user['id']
    
    # 检查剩余次数
    remaining = db.get_remaining_today(user_id)
    if remaining <= 0:
        return jsonify({
            "code": 403, 
            "msg": "今日免费次数已用完，请开通VIP继续使用", 
            "data": {"remaining": 0}
        })
    
    system_prompt = """你是一个专业的中国法律顾问，擅长用通俗易懂的语言解答普通人的法律问题。

请注意：
1. 只提供法律知识参考和建议，不构成正式法律意见
2. 如果问题涉及复杂诉讼，建议用户咨询专业律师
3. 语言要简单明白，避免太多专业术语
4. 符合中国法律法规
5. 如果不确定答案，请明确告诉用户你不确定，建议咨询专业律师

用户问题：""" + question
    
    try:
        answer = call_ai_api(system_prompt)
        # 记录使用
        db.add_usage(user_id, 'consult')
        
        return jsonify({
            "code": 200,
            "msg": "success",
            "data": {
                "answer": answer,
                "remaining": db.get_remaining_today(user_id),
                "is_vip": user['is_vip']
            }
        })
    except Exception as e:
        return jsonify({"code": 500, "msg": str(e), "data": None})

@app.route('/api/review-contract', methods=['POST'])
def review_contract():
    """合同文本审查"""
    data = request.get_json()
    contract_text = data.get('text', '').strip()
    open_id = data.get('user_id', '').strip()
    
    if not contract_text:
        return jsonify({"code": 400, "msg": "合同内容不能为空", "data": None})
    
    # 获取用户
    user = db.get_user_by_openid(open_id)
    if not user:
        user_id = db.create_user(open_id)
        user = db.get_user_by_id(user_id)
    else:
        user_id = user['id']
    
    # 检查剩余次数
    remaining = db.get_remaining_today(user_id)
    if remaining <= 0:
        return jsonify({
            "code": 403, 
            "msg": "今日免费次数已用完，请开通VIP继续使用", 
            "data": {"remaining": 0}
        })
    
    prompt = """请帮我审查这份合同文本，指出：
1. 对我方不利的潜在风险条款
2. 模糊不清可能引发争议的条款
3. 建议修改完善的地方
4. 总体风险评估

请用分点列出，语言通俗易懂。合同内容如下：

""" + contract_text
    
    try:
        result = call_ai_api(prompt)
        # 记录使用
        db.add_usage(user_id, 'review')
        
        return jsonify({
            "code": 200,
            "msg": "success",
            "data": {
                "review": result,
                "remaining": db.get_remaining_today(user_id),
                "is_vip": user['is_vip']
            }
        })
    except Exception as e:
        return jsonify({"code": 500, "msg": str(e), "data": None})

@app.route('/api/generate-document', methods=['POST'])
def generate_document():
    """法律文书生成"""
    data = request.get_json()
    doc_type = data.get('type', '').strip()  # 借条/租房合同/离职证明等
    user_info = data.get('info', '').strip()
    open_id = data.get('user_id', '').strip()
    
    if not doc_type or not user_info:
        return jsonify({"code": 400, "msg": "文书类型和信息不能为空", "data": None})
    
    # 获取用户
    user = db.get_user_by_openid(open_id)
    if not user:
        user_id = db.create_user(open_id)
        user = db.get_user_by_id(user_id)
    else:
        user_id = user['id']
    
    # 检查剩余次数
    remaining = db.get_remaining_today(user_id)
    if remaining <= 0:
        return jsonify({
            "code": 403, 
            "msg": "今日免费次数已用完，请开通VIP继续使用", 
            "data": {"remaining": 0}
        })
    
    prompt = f"""请帮我生成一份符合中国法律规定的{doc_type}，根据用户提供的信息生成完整文本。
用户提供的信息：
{user_info}

请直接生成完整可使用的文书内容，格式清晰。"""
    
    try:
        result = call_ai_api(prompt)
        # 记录使用
        db.add_usage(user_id, 'generate')
        
        return jsonify({
            "code": 200,
            "msg": "success",
            "data": {
                "document": result,
                "remaining": db.get_remaining_today(user_id),
                "is_vip": user['is_vip']
            }
        })
    except Exception as e:
        return jsonify({"code": 500, "msg": str(e), "data": None})

@app.route('/api/user/check-quota', methods=['POST'])
def check_quota():
    """检查用户剩余使用次数"""
    data = request.get_json()
    open_id = data.get('user_id', '').strip()
    
    if not open_id or open_id == 'test':
        # 测试模式
        return jsonify({
            "code": 200,
            "msg": "success",
            "data": {
                "remaining": 1,
                "is_vip": False
            }
        })
    
    user = db.get_user_by_openid(open_id)
    if not user:
        return jsonify({
            "code": 200,
            "msg": "success",
            "data": {
                "remaining": 1,
                "is_vip": False
            }
        })
    
    remaining = db.get_remaining_today(user['id'])
    
    return jsonify({
        "code": 200,
        "msg": "success",
        "data": {
            "remaining": remaining,
            "is_vip": bool(user['is_vip'])
        }
    })

@app.route('/api/pay/create-order', methods=['POST'])
def create_order():
    """创建支付订单"""
    data = request.get_json()
    product_type = data.get('product_type', 'month')  # month / year
    open_id = data.get('user_id', '').strip()
    
    price_map = {
        'month': 29.9,
        'year': 199.0
    }
    
    expire_map = {
        'month': 1,  # +1个月
        'year': 12   # +12个月
    }
    
    if product_type not in price_map:
        return jsonify({"code": 400, "msg": "产品类型错误", "data": None})
    
    amount = price_map[product_type]
    
    # 获取用户
    user = db.get_user_by_openid(open_id)
    if not user:
        user_id = db.create_user(open_id)
        user = db.get_user_by_id(user_id)
    else:
        user_id = user['id']
    
    # 生成订单号
    order_no = datetime.datetime.now().strftime('%Y%m%d%H%M%S') + str(user_id)
    
    db.create_order(order_no, user_id, product_type, amount)
    
    # 这里调用微信支付统一下单API，返回prepay_id给小程序
    # 微信支付SDK配置略，你填入配置就能用
    return jsonify({
        "code": 200,
        "msg": "success",
        "data": {
            "order_no": order_no,
            "amount": amount
            # prepay_id 在这里返回
        }
    })

@app.route('/api/pay/notify', methods=['POST'])
def pay_notify():
    """支付回调通知（微信支付）"""
    # 微信支付回调处理
    # 验证签名，更新订单状态，给用户开通VIP
    
    data = request.get_data()
    # TODO: 验证微信签名，验证通过后处理
    
    # 示例处理：
    # order_no = ... 从回调数据获取订单号
    # order = db.get_order(order_no)
    # if order and order['status'] == 0:
    #     db.update_order_paid(order_no)
    #     user = db.get_user_by_id(order['user_id'])
    #     计算过期时间
    #     if order['product_type'] == 'month':
    #         expire = datetime.datetime.now() + datetime.timedelta(days=30)
    #     else:
    #         expire = datetime.datetime.now() + datetime.timedelta(days=365)
    #     db.update_user_vip(user['id'], 1, expire.strftime('%Y-%m-%d %H:%M:%S'))
    
    return jsonify({"code": 200, "msg": "success"})

@app.route('/', methods=['GET'])
def index():
    """健康检查"""
    return jsonify({
        "code": 200,
        "msg": "法律AI小工具 API服务正常运行",
        "version": "1.0.0-MVP"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=config.PORT, debug=config.DEBUG)
