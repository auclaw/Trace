# Merize 后端配置
# 复制这个文件为 config.py 填入你的信息

# JWT密钥，改成随机字符串
SECRET_KEY = 'change-this-to-your-secret-key'

# 大模型API密钥，至少填一个
ERNIE_API_KEY = ''  # 百度文心一言
DOUBAN_API_KEY = ''  # 字节豆包
QWEN_API_KEY = ''  # 阿里云通义千问
DEEPSEEK_API_KEY = ''  # DeepSeek
MINIMAX_API_KEY = ''  # MiniMax
KIMI_API_KEY = ''  # Moonshot Kimi
VOLCENGINE_API_KEY = ''  # 火山引擎方舟

# Ollama 本地模型 - 不需要token，本地运行
# OLLAMA_API_KEY 通常填 'ollama' 即可
OLLAMA_API_KEY = 'ollama'
OLLAMA_BASE_URL = 'http://localhost:11434/v1'
OLLAMA_DEFAULT_MODEL = 'qwen2.5:7b'  # 可改成你本地拉取的模型名称

# 微信开放平台配置，微信登录需要
WECHAT_APP_ID = ''
WECHAT_APP_SECRET = ''

# 微信支付配置
WECHAT_PAY_MCH_ID = ''  # 微信支付商户号
WECHAT_PAY_API_KEY = ''  # 微信支付API密钥
WECHAT_PAY_NOTIFY_URL = ''  # 支付回调通知URL

# 短信配置（阿里云）
SMS_PROVIDER = 'alicloud'  # alicloud or tencent
SMS_ACCESS_KEY_ID = ''  # 阿里云AccessKey ID
SMS_ACCESS_KEY_SECRET = ''  # 阿里云AccessKey Secret
SMS_SIGN_NAME = ''  # 短信签名名称
SMS_TEMPLATE_CODE = ''  # 短信模板CODE
