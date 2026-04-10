"""
Example configuration file
Copy this to config.py and fill in your actual API keys and settings
"""

# JWT Secret Key - change this to a strong random secret
SECRET_KEY = 'your-secret-key-here'

# AI API Keys - add at least one provider
ERNIE_API_KEY = ''
DOUBAN_API_KEY = ''
QWEN_API_KEY = ''
DEEPSEEK_API_KEY = ''
MINIMAX_API_KEY = ''
KIMI_API_KEY = ''

# Volcano Engine AI configuration
VOLC_API_KEY = ''
VOLC_API_SECRET = ''
VOLC_ENDPOINT = 'https://aquasearch.volcengineapi.com'

# Model configuration for different tasks
MODEL_CONFIG = {
    'classification': 'doubao-1.5-lite-32k',
    'analysis': 'doubao-1.5-pro-32k',
    'complex': 'doubao-1.5-pro-128k',
}

# Ollama local model - for local inference without API tokens
# OLLAMA_API_KEY can be empty for local use
OLLAMA_API_KEY = 'ollama'
OLLAMA_BASE_URL = 'http://localhost:11434/v1'
OLLAMA_DEFAULT_MODEL = 'qwen2.5:7b'

# WeChat Open Platform configuration
WECHAT_APP_ID = ''
WECHAT_APP_SECRET = ''

# WeChat Pay configuration
WECHAT_PAY_MCH_ID = ''
WECHAT_PAY_API_KEY = ''
WECHAT_PAY_NOTIFY_URL = ''

# SMS Configuration (AliCloud)
SMS_PROVIDER = 'alicloud'  # alicloud or tencent
SMS_ACCESS_KEY_ID = ''
SMS_ACCESS_KEY_SECRET = ''
SMS_SIGN_NAME = ''
SMS_TEMPLATE_CODE = ''
