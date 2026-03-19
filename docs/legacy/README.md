# BetterMe - 极简效率工具

**追踪你的时间，优化你的效率。**

BetterMe 是一个强大的时间管理和效率追踪应用，帮助您深入了解时间使用情况，通过 AI 驱动的活动识别、实时活动监控和 macOS Screen Time 集成，自动分析您的真实活动。

## ✨ 核心功能

### 📊 时间追踪与可视化
- **24 小时时间线** - 实时查看每小时的活动分布
- **日历视图** - 按日期查看时间使用情况
- **周/月/年视图** - 多维度时间数据分析
- **时间块管理** - 灵活规划和追踪工作时间段

### 🤖 AI 驱动的活动识别
- **智能活动推断** - 通过窗口标题、应用名称、文件名自动识别真实活动
- **置信度评分** - 显示 AI 推断的准确度
- **用户反馈学习** - 通过您的修正不断改进识别准确度
- **活动缓存** - 提高识别性能

### 📱 实时活动监控
- **后台监控** - 自动监控当前活动窗口
- **应用切换记录** - 自动记录应用切换事件
- **活动历史** - 完整的活动历史记录
- **活动统计** - 应用使用时间统计和分析

### 🍎 macOS Screen Time 集成
- **应用使用时间** - 读取今日应用使用时间
- **网站访问统计** - 跟踪网站访问时间
- **设备使用时间** - 设备总使用时间统计
- **应用分类** - 自动分类为生产力/娱乐/其他

### 📊 数据分析与洞察
- **效率评分** - 基于活动类型的效率评估
- **高效活动识别** - 自动识别最高效的时间段
- **AI 洞察** - 智能分析您的时间使用模式
- **趋势分析** - 追踪效率变化趋势

### 🛠️ 生产力工具
- **自然语言排时** - 用自然语言规划时间表
- **数据导出** - 导出时间追踪数据
- **通知提醒** - 自定义提醒和通知
- **设置管理** - 灵活的应用配置

## 📥 快速开始

### 系统要求
- **macOS** 10.15 或更高版本
- **Node.js** 18+ 和 pnpm（仅本地开发需要）

### 下载预构建版本

最简单的方式是直接下载预构建的 DMG 文件：

**[👉 点击下载最新版本 DMG](https://github.com/aujingx/betterme/releases/download/v1.0.0/BetterMe-1.0.0.dmg)**

或者访问 [所有版本](https://github.com/aujingx/betterme/releases)

#### 安装步骤
1. 下载 DMG 文件
2. 打开 DMG 文件
3. 拖拽 **BetterMe** 到 **Applications** 文件夹
4. 打开 **Applications**，找到 **BetterMe**，双击启动
5. 按照权限提示授予必要的系统权限

#### 首次启动权限设置

首次运行 BetterMe 时，您需要授予以下权限：

**1. 辅助功能权限（用于活动监控）**
- 打开 **系统设置** → **隐私与安全性** → **辅助功能**
- 点击 **+** 按钮，选择 **BetterMe**
- 这允许应用监控您的活动窗口

**2. Screen Time 权限（可选）**
- 打开 **系统设置** → **隐私与安全性** → **屏幕使用时间**
- 点击 **+** 按钮，选择 **BetterMe**
- 这允许应用读取您的 Screen Time 数据

**3. 通知权限（可选）**
- 打开 **系统设置** → **通知**
- 找到 **BetterMe**，启用通知
- 这允许应用发送提醒和通知

## 🚀 本地开发

### 克隆仓库
```bash
git clone https://github.com/aujingx/betterme.git
cd betterme
```

### 安装依赖
```bash
pnpm install
```

### 配置环境变量
创建 `.env.local` 文件，配置以下变量：
```bash
# 数据库
DATABASE_URL=your_database_url

# OAuth
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=your_oauth_server
VITE_OAUTH_PORTAL_URL=your_oauth_portal

# LLM API（用于 AI 活动识别）
BUILT_IN_FORGE_API_URL=your_llm_api_url
BUILT_IN_FORGE_API_KEY=your_llm_api_key

# 其他配置
JWT_SECRET=your_jwt_secret
```

### 启动开发服务器
```bash
pnpm dev
```

访问 `http://localhost:5173` 查看应用。

### 构建 macOS 应用

#### 1. 构建 Web 应用
```bash
pnpm build
```

#### 2. 构建 Electron 应用
```bash
pnpm electron-build-mac
```

生成的 DMG 文件在 `dist_electron/` 目录中。

## 📊 技术栈

- **前端**: React 19 + Tailwind CSS 4 + TypeScript
- **后端**: Express 4 + tRPC 11 + Node.js
- **数据库**: MySQL/TiDB + Drizzle ORM
- **桌面应用**: Electron + macOS 原生 API
- **AI**: Qwen LLM（用于活动识别）
- **认证**: Manus OAuth

## 📁 项目结构

```
betterme/
├── client/                 # React 前端应用
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # 可复用组件
│   │   ├── hooks/         # 自定义 Hooks
│   │   └── lib/           # 工具库
│   └── public/            # 静态资源
├── server/                # Express 后端服务
│   ├── routers/           # tRPC 路由
│   ├── db.ts              # 数据库查询
│   └── _core/             # 核心模块
├── electron/              # Electron 桌面应用
│   ├── main.ts            # 主进程
│   ├── preload.ts         # 预加载脚本
│   └── activityMonitor.ts # 活动监控
├── drizzle/               # 数据库 Schema
└── native/                # 原生模块（可选）
```

## 🔧 开发指南

### 添加新功能

1. **更新数据库 Schema**
   ```bash
   # 编辑 drizzle/schema.ts
   pnpm db:push
   ```

2. **创建数据库查询**
   - 在 `server/db.ts` 中添加查询函数

3. **创建 tRPC 路由**
   - 在 `server/routers/` 中创建新路由

4. **构建前端 UI**
   - 在 `client/src/pages/` 或 `client/src/components/` 中创建组件

5. **编写测试**
   ```bash
   pnpm test
   ```

### 运行测试
```bash
pnpm test
```

### 代码检查
```bash
pnpm lint
```

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题或建议，请通过 GitHub Issues 与我们联系。

---

**BetterMe** - 让时间管理变得简单而有效。
