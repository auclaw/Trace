# 生产环境部署指南 / Production Deployment Guide

本文档说明如何在服务器上部署 Trace 后端 API。

## 前置要求

- Docker 和 Docker Compose 已安装
- 域名已解析到服务器（用于 HTTPS）
- 推荐：反向代理使用 Nginx + Let's Encrypt

## 快速开始

### 1. 克隆代码

```bash
git clone https://github.com/auclaw/Trace.git
cd Trace
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env`，填入你的配置：

```env
# 数据库密码
DB_PASSWORD=your-secure-db-password

# JWT 密钥 - 请用随机字符串
SECRET_KEY=your-random-secret-key-change-in-production

# Flask 环境 - production 禁用开发功能
FLASK_ENV=production

# 阿里云短信配置（验证码登录）
SMS_ACCESS_KEY_ID=your-access-key
SMS_ACCESS_KEY_SECRET=your-secret-key
SMS_SIGN_NAME=你的签名
SMS_TEMPLATE_CODE=你的模板CODE
SMS_INVITE_TEMPLATE_CODE=你的组织邀请模板CODE

# 微信登录配置（可选）
WECHAT_APP_ID=your-app-id
WECHAT_APP_SECRET=your-app-secret

# 微信支付配置
WECHAT_PAY_MCH_ID=your-mch-id
WECHAT_PAY_API_KEY=your-pay-api-key
WECHAT_PAY_NOTIFY_URL=https://api.your-domain.com/api/subscription/wechat-notify

# AI API 配置
ERNIE_API_KEY=your-ernie-api-key
VOLC_API_KEY=your-volc-api-key
VOLC_API_SECRET=your-volc-secret

# Tauri 自动更新公钥（仅发布机/CI 注入）
TRACE_UPDATER_PUBKEY=your-tauri-updater-public-key
```

### 3. 启动服务

```bash
docker-compose up -d
```

这会启动两个容器：
- `api` - Flask + Gunicorn 后端 API，监听 `0.0.0.0:5000`
- `db` - PostgreSQL 数据库，数据持久化在 `postgres_data` 卷

### 4. 初始化数据库

首次运行需要初始化数据库表结构：

```bash
docker-compose exec api python -c "from utils.database import init_database; init_database()"
```

### 5. 配置 Nginx 反向代理

示例 Nginx 配置：

```nginx
server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 架构说明

| 组件 | 技术 | 说明 |
|------|------|------|
| Web Server | Gunicorn | 生产级 Python WSGI HTTP 服务器 |
| Application | Flask | 轻量级 Web 框架 |
| Database | PostgreSQL | 生产级关系型数据库，支持并发访问 |
| Container | Docker + Compose | 一键部署，环境一致 |

## 开发部署对比

| 部署方式 | 适用场景 | 数据库 | WSGI Server |
|---------|---------|--------|-------------|
| 本地开发 | 开发调试 | SQLite | Flask 内置 |
| 生产部署 | 线上服务 | PostgreSQL | Gunicorn |

## 日常维护

### 查看日志

```bash
docker-compose logs -f api
docker-compose logs -f db
```

### 重启服务

```bash
docker-compose restart api
```

### 备份数据库

```bash
docker-compose exec db pg_dump -U trace trace > backup-$(date +%Y%m%d).sql
```

### 更新版本

```bash
git pull
docker-compose build --no-cache api
docker-compose up -d
```

## 安全建议

1. **更改默认密码** - `.env` 中务必设置强密码
2. **启用 HTTPS** - 必须使用 Let's Encrypt 等证书
3. **限制端口** - 只开放 80/443，5000 不直接对外
4. **定期备份** - 定时备份数据库
5. **更新依赖** - 定期 `docker pull` 和重建获取安全更新
6. **密钥不入仓库** - `SECRET_KEY`、支付密钥、短信密钥、AI Key、`TRACE_UPDATER_PUBKEY` 全部来自 Secret Manager / CI Secret
7. **发布前演练** - 运行 `npm run test:release`，正式打包前使用 `RUN_TAURI_BUILD=1 npm run test:release`

## 故障排查

**问题**: 数据库连接失败
**排查**: 检查 `.env` 中的 `DATABASE_URL` 配置，确认 PostgreSQL 容器正常启动

**问题**: 短信发送失败
**排查**: 检查阿里云短信 AK/SK 是否正确，签名和模板码是否正确

**问题**: 前端无法连接
**排查**: 检查 Nginx 反向代理配置，确认 CORS 设置正确
