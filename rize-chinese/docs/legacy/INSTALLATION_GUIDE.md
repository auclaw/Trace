# BetterMe 本地安装部署指南

## 简介

**BetterMe** 是一个极简的本地效率管理工具，帮助你追踪时间、分析效率、优化时间管理。所有数据完全存储在本地，保护隐私。

## 系统要求

- **操作系统**：Windows、macOS 或 Linux
- **Node.js**：v18.0 或更高版本
- **npm** 或 **pnpm**：包管理器
- **MySQL** 或 **TiDB**：数据库（可选，支持 SQLite 本地数据库）

## 快速开始

### 1. 下载项目

从 GitHub 克隆项目：

```bash
git clone https://github.com/aujingx/betterme.git
cd betterme
```

### 2. 安装依赖

使用 pnpm 安装依赖（推荐）：

```bash
pnpm install
```

或使用 npm：

```bash
npm install
```

### 3. 配置环境变量

创建 `.env.local` 文件在项目根目录：

```bash
# 数据库配置
DATABASE_URL=mysql://user:password@localhost:3306/betterme

# 或使用 SQLite（本地数据库）
# DATABASE_URL=file:./betterme.db

# JWT 密钥
JWT_SECRET=your-secret-key-here

# OAuth 配置（可选）
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# LLM API 配置（Qwen）
DASHSCOPE_API_KEY=your-dashscope-api-key

# 其他配置
OWNER_NAME=Your Name
OWNER_OPEN_ID=your-open-id
```

### 4. 初始化数据库

推送数据库 schema：

```bash
pnpm db:push
```

### 5. 启动开发服务器

```bash
pnpm dev
```

应用将在 `http://localhost:3000` 启动。

### 6. 构建生产版本

```bash
pnpm build
```

启动生产服务器：

```bash
pnpm start
```

## 功能说明

### 核心功能

1. **仪表盘** - 查看今日统计、效率评分、高效活动、需要改进的活动
2. **24 小时时间线** - 可视化显示一整天的时间分配，支持拖拽调整
3. **日计划** - 创建每日计划，设定任务和时间分配
4. **时间块补全** - 手动补全未记录的时间，编辑活动详情
5. **日历视图** - 按月份查看时间统计和效率分布
6. **周视图** - 查看一周的时间分配和趋势
7. **月视图** - 月度统计和效率热力图
8. **年度总结** - 年度数据回顾和长期模式识别

### 高级功能

1. **AI 自动排时间** - 使用自然语言描述任务，AI 自动生成日程
2. **自然语言排时间** - 支持"新增"模式，动态插入任务并自动调整时间
3. **AI 分析洞察** - 基于 Qwen LLM 的个性化效率分析和建议
4. **低效活动提醒** - 检测到低效活动超过 1 分钟时弹窗提醒
5. **时间块碰撞检测** - 拖拽时自动检测冲突并推移其他任务
6. **智能休息提醒** - 基于专注时长和能量水平的个性化休息建议
7. **通知和提醒系统** - 定时提醒和每日总结推送
8. **数据导出** - 支持 CSV 和 JSON 格式导出

### 用户习惯配置

- **起床/睡眠时间** - 设定每日作息时间
- **休息周期** - 自定义专注和休息的时间比例
- **培养模式** - 逐步改善作息习惯
- **能量水平** - 记录和追踪能量状态

## 本地监控脚本

### 安装监控脚本

BetterMe 包含一个 Python 监控脚本，可以自动追踪你的活动：

```bash
# 安装 Python 依赖
pip install -r scripts/requirements.txt

# 运行监控脚本
python scripts/activity_monitor.py
```

### 配置监控脚本

编辑 `scripts/activity_monitor.py` 中的配置：

```python
# 监控间隔（秒）
MONITOR_INTERVAL = 5

# 数据库连接
DATABASE_URL = "mysql://user:password@localhost:3306/betterme"

# 低效活动关键词
INEFFICIENCY_KEYWORDS = ["youtube", "social", "games", "shopping"]
```

## 数据备份

### 手动备份

```bash
# 导出所有数据为 JSON
curl http://localhost:3000/api/trpc/data.export -o backup.json

# 导出为 CSV
curl http://localhost:3000/api/trpc/data.exportCsv -o backup.csv
```

### 自动备份

编辑 `scripts/backup.sh` 并设置定时任务：

```bash
# macOS/Linux - 每天凌晨 2 点备份
0 2 * * * /path/to/betterme/scripts/backup.sh

# Windows - 使用任务计划程序
# 创建任务：每天 02:00 运行 backup.bat
```

## 故障排除

### 问题 1：数据库连接失败

**症状**：启动时报错 "Failed to connect to database"

**解决方案**：
1. 检查 `DATABASE_URL` 是否正确
2. 确保 MySQL 服务正在运行
3. 验证数据库用户名和密码
4. 使用 SQLite 作为替代：`DATABASE_URL=file:./betterme.db`

### 问题 2：端口 3000 已被占用

**症状**：启动时报错 "Port 3000 already in use"

**解决方案**：
```bash
# 更改端口
PORT=3001 pnpm dev

# 或杀死占用端口的进程
# macOS/Linux
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 问题 3：LLM API 不工作

**症状**：AI 分析功能不可用

**解决方案**：
1. 检查 `DASHSCOPE_API_KEY` 是否设置
2. 验证 API 密钥是否有效
3. 检查网络连接
4. 查看服务器日志：`tail -f .manus-logs/devserver.log`

### 问题 4：监控脚本不运行

**症状**：活动没有被记录

**解决方案**：
1. 检查 Python 依赖是否安装
2. 验证数据库连接配置
3. 运行脚本并查看错误日志
4. 确保有足够的系统权限

## 开发指南

### 项目结构

```
betterme/
├── client/              # React 前端
│   ├── src/
│   │   ├── pages/       # 页面组件
│   │   ├── components/  # 可复用组件
│   │   ├── hooks/       # 自定义 hooks
│   │   └── lib/         # 工具函数
│   └── public/          # 静态资源
├── server/              # Express 后端
│   ├── routers.ts       # tRPC 路由
│   ├── db.ts            # 数据库查询
│   └── _core/           # 核心功能
├── drizzle/             # 数据库 schema
├── scripts/             # 工具脚本
│   ├── activity_monitor.py
│   └── backup.sh
└── DEPLOYMENT_GUIDE.md  # 部署指南
```

### 添加新功能

1. **更新数据库 schema**：编辑 `drizzle/schema.ts`
2. **推送数据库变更**：`pnpm db:push`
3. **添加后端 API**：编辑 `server/routers.ts`
4. **创建前端页面**：在 `client/src/pages/` 中创建新组件
5. **运行测试**：`pnpm test`
6. **保存检查点**：使用 Manus UI 中的 Publish 按钮

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm test collision-detection.test

# 监视模式
pnpm test --watch
```

## 常见问题

**Q：我的数据会被上传到云端吗？**
A：不会。BetterMe 的所有数据都存储在你的本地数据库中，永远不会被上传到任何云服务。

**Q：我可以在多台设备上使用吗？**
A：可以，但需要在每台设备上独立部署。数据不会自动同步。

**Q：如何导出我的数据？**
A：使用"数据导出"功能，支持 CSV 和 JSON 格式。

**Q：我可以修改源代码吗？**
A：可以。项目是开源的，你可以根据需要修改和定制。

**Q：如何获得技术支持？**
A：提交 Issue 到 GitHub 仓库：https://github.com/aujingx/betterme/issues

## 许可证

MIT License

## 更新日志

### v1.0.0 (2026-01-22)

- ✅ 完整的时间追踪和分析功能
- ✅ AI 自动排时间和智能建议
- ✅ 实时监控和低效活动提醒
- ✅ 月度和年度统计
- ✅ 本地数据存储和备份
- ✅ Memphis 设计风格
- ✅ 完整的中文界面

## 贡献指南

欢迎提交 Pull Request 和 Issue！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

**祝你使用愉快！** 🎉
