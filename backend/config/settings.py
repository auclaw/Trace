"""
Configuration settings
Loads from environment variables or local config.py override
"""
import os

# JWT Secret Key
SECRET_KEY = os.environ.get('SECRET_KEY', 'change-this-to-your-secret-key')

# AI API Keys - at least one required
ERNIE_API_KEY = os.environ.get('ERNIE_API_KEY', '')
DOUBAN_API_KEY = os.environ.get('DOUBAN_API_KEY', '')
QWEN_API_KEY = os.environ.get('QWEN_API_KEY', '')
DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY', '')
MINIMAX_API_KEY = os.environ.get('MINIMAX_API_KEY', '')
KIMI_API_KEY = os.environ.get('KIMI_API_KEY', '')
VOLCENGINE_API_KEY = os.environ.get('VOLCENGINE_API_KEY', '')

# Ollama local model - for local inference without API tokens
# OLLAMA_API_KEY can be empty for local use
OLLAMA_API_KEY = os.environ.get('OLLAMA_API_KEY', 'ollama')
OLLAMA_BASE_URL = os.environ.get('OLLAMA_BASE_URL', 'http://localhost:11434/v1')
OLLAMA_DEFAULT_MODEL = os.environ.get('OLLAMA_DEFAULT_MODEL', 'qwen2.5:7b')

# WeChat Open Platform configuration
WECHAT_APP_ID = os.environ.get('WECHAT_APP_ID', '')
WECHAT_APP_SECRET = os.environ.get('WECHAT_APP_SECRET', '')

# WeChat Pay configuration
WECHAT_PAY_MCH_ID = os.environ.get('WECHAT_PAY_MCH_ID', '')
WECHAT_PAY_API_KEY = os.environ.get('WECHAT_PAY_API_KEY', '')
WECHAT_PAY_NOTIFY_URL = os.environ.get('WECHAT_PAY_NOTIFY_URL', '')

# SMS Configuration (AliCloud)
SMS_PROVIDER = os.environ.get('SMS_PROVIDER', 'alicloud')  # alicloud or tencent
SMS_ACCESS_KEY_ID = os.environ.get('SMS_ACCESS_KEY_ID', '')
SMS_ACCESS_KEY_SECRET = os.environ.get('SMS_ACCESS_KEY_SECRET', '')
SMS_SIGN_NAME = os.environ.get('SMS_SIGN_NAME', '')
SMS_TEMPLATE_CODE = os.environ.get('SMS_TEMPLATE_CODE', '')

# Database path
DATABASE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'rize.db')

# Try to load local config override
try:
    from config import *
except ImportError:
    pass
