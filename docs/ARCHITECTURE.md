# 架构文档 - Trace 时迹

## 项目概览

**Trace 时迹** 是一款基于 Tauri 2.0 + React + Flask 的 AI 自动时间追踪桌面应用。项目采用分层架构设计，前端负责交互展示，Tauri Rust 后端负责系统活动监控和本地存储，Flask 云端后端负责数据同步和 AI 分类服务。

## 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| **桌面客户端** | Tauri 2.0 (Rust) | 原生窗口、系统监控、本地存储 |
| **前端** | React 18 + TypeScript + Tailwind CSS | 用户界面、交互逻辑 |
| **云端后端** | Python Flask | REST API、数据同步、AI 分类调用 |
| **数据库** | SQLite (开发) / PostgreSQL (生产) | 用户数据存储 |
| **AI 服务** | 百度文心一言 / 字节跳动豆包 API | 活动自动分类 |
| **认证** | JWT（Access + Refresh Token）| 用户认证 |

## 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    用户界面 (React 前端)                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │  Dashboard  │ │  Timeline   │ │  Settings   │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
       ┌──────▼──────┐  ┌──────▼──────┐  ┌───▼────┐
       │  Tauri     │  │   IPC       │  │  Fetch  │
       │  Rust      │  │  桥接层     │  │  API    │
       └────────────┘  └─────────────┘  └────────┘
              │               │               │
              │               │               ├────────┐
              │               │               │        │
┌────────────────────────┐    │    ┌──────────────────┐  │
│   本地活动监控         │    │    │   Flask 云端后端  │  │
│  - 窗口标题检测       │    │    │  - 用户认证       │  │
│  - 应用分类匹配       │    │    │  - 数据同步       │  │
│  - 本地 SQLite 存储   │    │    │  - AI 分类调用    │  │
└───────────────────────┘    │    └──────────────────┘  │
                              │                          │
                              │           ┌──────────────▼──────────────┐
                              │           │   PostgreSQL 数据库         │
                              │           │   - 用户数据存储           │
                              │           │   - 同步元数据             │
                              │           └────────────────────────────┘
                              │
                              ▼
                        第三方 AI API
                        (文心一言 / 豆包)
```

## 前端架构

### 目录结构

```
src/
├── components/          # 可复用 UI 组件
├── pages/              # 页面组件
├── store/              # Zustand 状态管理
├── services/           # 业务服务层
│   ├── ipc/           # Tauri IPC 桥接分层
│   │   ├── activityIpc.ts
│   │   ├── taskIpc.ts
│   │   ├── habitIpc.ts
│   │   ├── focusIpc.ts
│   │   ├── timeBlockIpc.ts
│   │   ├── settingsIpc.ts
│   │   └── petIpc.ts
│   └── dataService.ts  # 统一数据服务接口 (desktop/web 兼容)
├── utils/              # 工具函数
│   └── apiClient.ts    # 统一 API 客户端
├── config/             # 配置文件
│   └── themes.ts       # 主题配置
├── i18n/               # 国际化翻译文件
└── types/              # 全局 TypeScript 类型定义
```

### 分层设计

1. **IPC 桥接层** (`src/services/ipc/`)
   - 按业务领域拆分，每个实体一个文件
   - 仅负责 Tauri invoke 调用，不包含业务逻辑
   - 统一的 `isDesktop()` 检查，web 模式回退到 localStorage

2. **数据服务层** (`src/services/dataService.ts`)
   - 统一数据访问接口，对上层隐藏 desktop/web 差异
   - desktop 代理到 IPC 层，web demo 使用 localStorage 存储
   - 保持向后兼容，便于逐步重构

3. **统一 API 客户端** (`src/utils/apiClient.ts`)
   - 统一的 `apiRequest` 封装 `fetch`
   - 自动添加认证 token
   - 统一错误处理，自动弹出 toast 错误提示
   - 返回类型化数据 `T`

4. **状态管理** (`src/store/useAppStore.ts`)
   - 使用 Zustand 单 store 架构
   - 所有全局状态集中管理
   - 持久化到 localStorage

### 功能特性开关

项目支持通过模块配置显示/隐藏功能：
- 默认模块在 `src/config/themes.ts` 的 `DEFAULT_MODULES` 定义
- 用户可在设置页面自定义可见模块
- 未实现功能默认不加入 `DEFAULT_MODULES`，对用户隐藏

## Tauri Rust 后端架构

### 核心职责

1. **前台活动监控** - 定期获取当前窗口标题，检测用户活动
2. **空闲检测** - 根据键盘鼠标输入判断是否空闲，自动暂停
3. **本地数据存储** - 使用 SQLx + SQLite 存储活动数据
4. **IPC 桥接** - 向前端暴露命令接口

### 主要命令

| 命令 | 用途 |
|------|------|
| `get_activities` | 获取活动数据 |
| `start_tracking` | 开始监控 |
| `stop_tracking` | 停止监控 |
| `get_time_blocks` | 获取指定日期时间块 |
| `add_time_block` | 新增时间块 |
| `update_time_block` | 更新时间块 |
| `delete_time_block` | 删除时间块 |
| `get_pet` | 获取虚拟宠物数据 |
| `save_pet` | 保存虚拟宠物数据 |
| `get_settings` | 获取应用设置 |
| `update_settings` | 更新应用设置 |

## Flask 云端后端架构

### 目录结构

```
backend/
├── app.py              # 应用入口，路由定义
├── config.py           # 配置加载
├── models/             # 数据库模型
├── services/           # 业务逻辑服务
├── utils/              # 工具函数
│   └── response.py     # 统一响应格式
└── requirements.txt   # Python 依赖
```

### 统一响应格式

所有 API 响应遵循统一格式：

```python
# 成功响应
{
  "code": 200,
  "msg": "ok",
  "data": { ... }
}

# 错误响应
{
  "code": 400,
  "msg": "错误信息",
  "data": null
}
```

在代码中使用：

```python
from utils.response import success, error

return success(data=result)
return error("参数错误", 400)
```

### 安全措施

1. **JWT 认证**
   - Access Token 有效期：2 小时
   - Refresh Token 有效期：14 天
   - 使用 `@require_auth` 装饰器保护需要认证的端点

2. **短信验证码**
   - 验证码使用 SHA-256 哈希存储
   - 频率限制：每个手机号每小时最多 5 次请求
   - 15 分钟有效期，5 分钟重试限制

3. **开发端点保护**
   - `/dev/login` 端点仅在 `FLASK_ENV=development` 可用
   - 生产环境自动禁用

4. **内容安全策略 (CSP)**
   - Tauri 配置了合理的 CSP
   - 限制资源加载来源，防止 XSS 攻击

## 数据模型

### 核心实体

1. **TimeBlock** - 时间块
   - id: string
   - startTime: string (ISO)
   - endTime: string (ISO)
   - duration: number (分钟)
   - appName: string
   - windowTitle: string
   - categoryId: string
   - note: string

2. **Task** - 任务
   - id: string
   - title: string
   - completed: boolean
   - createdAt: string
   - completedAt: string?

3. **Habit** - 习惯
   - id: string
   - name: string
   - target: number
   - unit: string
   - records: Record<string, number>

4. **Pet** - 虚拟宠物
   - id: string
   - name: string
   - type: string
   - hunger: number
   - mood: number
   - coins: number
   - xp: number
   - level: number

5. **FocusSession** - 专注会话
   - id: string
   - startTime: string
   - endTime: string
   - duration: number
   - type: 'pomodoro' | 'custom'

## 开发约定

1. **IPC 层** - 仅做桥接，不包含业务逻辑
2. **错误处理** - 所有 API 错误统一由 `apiClient.ts` 处理
3. **功能开关** - 未完成功能默认隐藏，不加入 `DEFAULT_MODULES`
4. **TypeScript** - 所有代码必须有类型定义
5. **代码检查** - 提交前自动运行 ESLint + Prettier

## 相关文档

- [部署文档](./DEPLOYMENT.md) - 生产部署指南
- [API 文档](./API.md) - 云端 API 接口文档
- [贡献指南](./CONTRIBUTING.md) - 贡献代码指南
