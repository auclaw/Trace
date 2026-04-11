# API 文档 - Trace 时迹

本文档描述 Trace 云端后端 REST API 接口规范。

## 基础信息

- **Base URL**: `http://your-domain:port/api`
- **认证方式**: JWT Bearer Token
- **请求格式**: `application/json`
- **响应格式**: `application/json`

## 统一响应格式

所有响应遵循以下格式：

```json
{
  "code": 200,
  "msg": "ok",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | number | 状态码，200 表示成功，非 200 表示错误 |
| `msg` | string | 响应消息 |
| `data` | any | 响应数据，错误时为 `null` |

## 认证接口

### 发送登录验证码

```
POST /api/auth/send-code
```

**请求体：**
```json
{
  "phone": "13800000000"
}
```

**响应：**
```json
{
  "code": 200,
  "msg": "验证码已发送",
  "data": {
    "expires_in": 900
  }
}
```

**错误：**
- `400` - 手机号格式错误
- `429` - 请求过于频繁，请稍后再试

**频率限制：** 每个手机号每小时最多 5 次请求

---

### 验证码登录/注册

```
POST /api/auth/login
```

**请求体：**
```json
{
  "phone": "13800000000",
  "code": "123456"
}
```

**响应：**
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 7200,
    "user": {
      "id": 1,
      "phone": "13800000000",
      "created_at": "2026-01-01T00:00:00Z"
    }
  }
}
```

**错误：**
- `400` - 验证码错误或已过期

---

### 刷新 Access Token

```
POST /api/auth/refresh
```

**请求头：**
```
Authorization: Bearer {refresh_token}
```

**响应：**
```json
{
  "code": 200,
  "msg": "刷新成功",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 7200
  }
}
```

**错误：**
- `401` - Refresh Token 无效或已过期

## 用户接口

### 获取当前用户信息

```
GET /api/user/me
```

**需要认证：** 是

**响应：**
```json
{
  "code": 200,
  "msg": "ok",
  "data": {
    "id": 1,
    "phone": "13800000000",
    "created_at": "2026-01-01T00:00:00Z",
    "settings": {}
  }
}
```

## 同步接口

### 拉取活动数据增量

```
GET /api/sync/pull
```

**需要认证：** 是

**查询参数：**
- `last_sync_at` - 上次同步时间戳（ISO 格式）

**响应：**
```json
{
  "code": 200,
  "msg": "ok",
  "data": {
    "activities": [...],
    "tasks": [...],
    "habits": [...],
    "server_version": "2026-04-01T12:00:00Z"
  }
}
```

---

### 推送活动数据增量

```
POST /api/sync/push
```

**需要认证：** 是

**请求体：**
```json
{
  "activities": [...],
  "tasks": [...],
  "habits": [...],
  "client_version": "2026-04-01T12:00:00Z"
}
```

**响应：**
```json
{
  "code": 200,
  "msg": "同步成功",
  "data": {
    "conflicts": 0,
    "server_version": "2026-04-01T12:00:00Z"
  }
}
```

## AI 分类接口

### 分类活动

```
POST /api/ai/classify
```

**需要认证：** 是

**请求体：**
```json
{
  "activities": [
    {
      "app_name": "Google Chrome",
      "window_title": "Claude Code - GitHub",
      "duration": 1800
    }
  ]
}
```

**响应：**
```json
{
  "code": 200,
  "msg": "ok",
  "data": {
    "results": [
      {
        "category": "工作",
        "confidence": 0.95,
        "keywords": ["开发", "编程", "GitHub"]
      }
    ]
  }
}
```

## 分类规则接口

### 获取用户自定义分类规则

```
GET /api/classification/rules
```

**需要认证：** 是

**响应：**
```json
{
  "code": 200,
  "msg": "ok",
  "data": {
    "rules": [
      {
        "id": 1,
        "pattern": ".*GitHub.*",
        "category": "工作",
        "created_at": "2026-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### 创建分类规则

```
POST /api/classification/rules
```

**需要认证：** 是

**请求体：**
```json
{
  "pattern": ".*GitHub.*",
  "category": "工作"
}
```

**响应：**
```json
{
  "code": 200,
  "msg": "创建成功",
  "data": {
    "id": 1,
    "pattern": ".*GitHub.*",
    "category": "工作",
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

---

### 更新分类规则

```
PUT /api/classification/rules/{id}
```

**需要认证：** 是

**请求体：** 同创建

---

### 删除分类规则

```
DELETE /api/classification/rules/{id}
```

**需要认证：** 是

**响应：**
```json
{
  "code": 200,
  "msg": "删除成功",
  "data": null
}
```

## 番茄工作法

### 获取今日番茄统计

```
GET /api/focus/today
```

**需要认证：** 是

**响应：**
```json
{
  "code": 200,
  "msg": "ok",
  "data": {
    "sessions": [...],
    "total_pomodoros": 4,
    "total_focus_minutes": 100
  }
}
```

---

### 创建专注会话

```
POST /api/focus/start
```

**需要认证：** 是

**请求体：**
```json
{
  "start_time": "2026-04-01T10:00:00Z",
  "work_minutes": 25,
  "type": "pomodoro",
  "task_id": "..."
}
```

**响应：**
```json
{
  "code": 200,
  "msg": "已开始",
  "data": {
    "id": 123,
    "...": "..."
  }
}
```

---

### 结束专注会话

```
POST /api/focus/end/{id}
```

**需要认证：** 是

**请求体：**
```json
{
  "end_time": "2026-04-01T10:25:00Z"
}
```

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权，需要登录 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 429 | 请求频率超限 |
| 500 | 服务器内部错误 |

## 版本历史

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-04-11 | 1.0 | 初始文档，涵盖基础接口 |
