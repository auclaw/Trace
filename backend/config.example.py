# Merize 后端配置
# 复制这个文件为 config.py 填入你的信息

# JWT密钥，改成随机字符串
SECRET_KEY = 'change-this-to-your-secret-key'

# 大模型API密钥，至少填一个
ERNIE_API_KEY = ''  # 百度文心一言
DOUBAN_API_KEY = ''  # 字节豆包

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
