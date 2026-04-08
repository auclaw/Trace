# Authentication Core Service
# 核心认证服务

import jwt
from functools import wraps
from flask import request, jsonify, g
from config.settings import SECRET_KEY
from models.database_models import User


def create_token(user_id: int) -> str:
    """生成JWT token"""
    import datetime
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


def verify_token(token: str) -> int | None:
    """验证JWT token，返回user_id或None"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def require_auth(f):
    """装饰器：需要认证"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'code': 401, 'msg': '未登录'})

        token = auth_header.replace('Bearer ', '')
        user_id = verify_token(token)
        if user_id is None:
            return jsonify({'code': 401, 'msg': 'token无效或过期'})

        user = User.query.get(user_id)
        if not user:
            return jsonify({'code': 401, 'msg': '用户不存在'})

        g.current_user = user
        return f(*args, **kwargs)
    return decorated
