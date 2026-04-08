# Configuration Core Service
# 配置管理核心服务

import os
from typing import Any
from config.settings import *


def get_config(key: str, default: Any = None) -> Any:
    """获取配置"""
    return globals().get(key, os.environ.get(key, default))


def is_dev_mode() -> bool:
    """是否开发模式"""
    return get_config('DEBUG', False)
