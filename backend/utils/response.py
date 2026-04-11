"""
Standardized API response format
统一 API 响应格式

All API responses should follow this structure:
{
  "code": int,          // 200 = success, other = error
  "msg": string,        // human-readable message
  "data": object|null  // response data
}
"""

from flask import jsonify
from typing import Any, Optional


def success(data: Optional[Any] = None, msg: str = "ok"):
    """Success response"""
    return jsonify({
        "code": 200,
        "msg": msg,
        "data": data
    })


def error(msg: str = "error", code: int = 400):
    """Error response"""
    return jsonify({
        "code": code,
        "msg": msg,
        "data": None
    }), code
