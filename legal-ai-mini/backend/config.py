"""
配置文件
请根据你的实际情况修改这些配置
"""

# 服务端口
PORT = 5000

# 调试模式
DEBUG = True

# ========== AI配置 ==========
# AI提供商: "ernie" (百度文心一言) 或 "doubao" (字节豆包)
AI_PROVIDER = "ernie"

# 百度文心一言 API 信息
# 在这里申请: https://console.bce.baidu.com/
ERNIE_API_KEY = "your_ernie_api_key_here"
ERNIE_SECRET_KEY = "your_ernie_secret_key_here"

# 字节跳动豆包 API 信息
# 在这里申请: https://www.doubao.com/
DOUBAO_API_KEY = "your_doubao_api_key_here"

# ========== 数据库配置 ==========
# 云数据库地址，用云服务商的MySQL即可
# 比如阿里云RDS、腾讯云数据库都可以，最低配一年几百块
DB_HOST = "localhost"
DB_PORT = 3306
DB_USER = "root"
DB_PASS = "your_db_password"
DB_NAME = "legal_ai"

# ========== 微信支付配置 ==========
# 在这里申请: https://pay.weixin.qq.com/
WECHAT_APPID = "your_appid_here"
WECHAT_MCHID = "your_mchid_here"
WECHAT_API_KEY = "your_api_key_here"
WECHAT_NOTIFY_URL = "https://your-domain.com/api/pay/notify"

# ========== 微信小程序配置 ==========
APPID = "your_mini_program_appid"
APPSECRET = "your_mini_program_appsecret"
