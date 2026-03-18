# BetterMe 本地部署和使用指南

## 简介

BetterMe 是一个极简的本地效率管理工具，帮助你追踪时间使用、分析效率、制定计划和改进时间管理。所有数据都存储在本地，完全保护你的隐私。

## 系统要求

- **操作系统**：Windows、macOS 或 Linux
- **Node.js**：v18.0 或更高版本
- **Python**：v3.8 或更高版本（用于本地监控脚本）
- **数据库**：SQLite（已内置）
- **浏览器**：Chrome、Firefox、Safari 或 Edge（最新版本）

## 安装步骤

### 1. 克隆项目

```bash
git clone https://github.com/aujingx/betterme.git
cd betterme
```

### 2. 安装依赖

```bash
# 安装 Node.js 依赖
pnpm install

# 或使用 npm
npm install
```

### 3. 初始化数据库

```bash
# 推送数据库 schema
pnpm db:push
```

### 4. 启动开发服务器

```bash
# 启动开发环境
pnpm dev
```

服务器将在 `http://localhost:3000` 启动。

## 使用方式

### 首次使用

1. 打开浏览器，访问 `http://localhost:3000`
2. 使用 Manus OAuth 登录（或本地测试账户）
3. 进入仪表盘，开始使用

### 核心功能

#### 📊 仪表盘
- 查看今日时间统计
- 显示效率分数
- 快速访问所有功能

#### 📅 日历视图
- 按月份查看时间分布
- 点击日期查看详细活动

#### ⏰ 24 小时时间线
- 类似 Apple 日历的小时级别视图
- 直观显示整天的活动安排
- **拖拽时间块**重新安排任务（新功能！）
- 支持添加、编辑、删除时间块

#### 📈 数据分析
- 效率分布饼图
- 时间分配柱状图
- 趋势折线图
- 按类别分析

#### 📋 每日计划
- 创建今日计划
- 分配时间和优先级
- 跟踪计划完成情况

#### ⏱️ 时间块补全
- 手动补充未记录的时间
- 编辑活动类别和效率等级
- 添加备注和描述

#### 🤖 AI 洞察
- 获取个性化的效率建议
- 分析时间使用模式
- 获取改进策略

#### 💬 自然语言排时间
- 用自然语言描述任务（如"深度工作 2小时、邮件 30分钟"）
- AI 自动生成最优日程
- 考虑用户习惯和休息时间

#### 📊 周视图
- 查看整周的时间分布
- 对比每日效率
- 识别周度模式

#### 💾 数据导出
- 导出为 CSV 格式（Excel 兼容）
- 导出为 JSON 格式（完整数据结构）
- 支持自定义日期范围

#### ⚙️ 设置
- 配置 LLM API（Qwen、OpenAI 等）
- 设置作息时间（起床/睡眠）
- 配置休息周期
- 启用培养模式（逐步改善作息）

## 本地监控脚本

### 安装监控脚本

```bash
# 进入脚本目录
cd scripts

# 运行监控脚本
python activity_monitor.py
```

### 配置选项

```bash
# 指定自定义数据库路径
python activity_monitor.py --db-path ~/my-betterme/data.db

# 设置检查间隔（秒）
python activity_monitor.py --interval 30

# 同时设置多个选项
python activity_monitor.py --db-path ~/my-betterme/data.db --interval 60
```

### 监控脚本功能

- 自动监控活跃窗口标题
- 记录应用程序名称
- 追踪时间使用
- 支持 Windows、macOS 和 Linux
- 数据直接存储到本地 SQLite 数据库

## LLM API 配置

### 配置 Qwen API

1. 访问 [Qwen 官网](https://qwen.aliyun.com)
2. 获取 API Key
3. 在 BetterMe 设置中配置：
   - **LLM 提供商**：Qwen
   - **API Key**：你的 Qwen API Key
   - **API URL**：https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation

### 配置 OpenAI API

1. 访问 [OpenAI 官网](https://openai.com/api/)
2. 获取 API Key
3. 在 BetterMe 设置中配置：
   - **LLM 提供商**：OpenAI
   - **API Key**：你的 OpenAI API Key
   - **模型**：gpt-4 或 gpt-3.5-turbo

## 数据管理

### 数据存储位置

- **主数据库**：`~/.betterme/activity.db`（或自定义路径）
- **配置文件**：项目根目录 `.env` 文件

### 数据备份

```bash
# 手动备份数据库
cp ~/.betterme/activity.db ~/.betterme/activity.db.backup

# 或使用导出功能
# 在 BetterMe 中访问"数据导出"页面，导出为 CSV 或 JSON
```

### 数据恢复

```bash
# 从备份恢复
cp ~/.betterme/activity.db.backup ~/.betterme/activity.db
```

## 常见问题

### Q: 如何修改数据库位置？
A: 在启动监控脚本时使用 `--db-path` 参数指定新位置，或修改 `.env` 文件中的 `DATABASE_URL`。

### Q: 监控脚本无法获取窗口标题？
A: 
- **Linux**：确保安装了 `xdotool`（`sudo apt-get install xdotool`）
- **macOS**：确保授予终端"辅助功能"权限
- **Windows**：确保安装了 `pygetwindow`（`pip install pygetwindow`）

### Q: 如何停止监控脚本？
A: 按 `Ctrl+C` 停止脚本。最后一个活动会被自动记录。

### Q: 数据是否会上传到云端？
A: 不会。所有数据都存储在本地。只有在配置 LLM API 时，部分数据才会发送到 LLM 服务进行分析。

### Q: 如何导出我的数据？
A: 在 BetterMe 中访问"数据导出"页面，选择日期范围，然后导出为 CSV 或 JSON 格式。

## 生产部署

### 使用 Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

### 使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start "pnpm start" --name "betterme"

# 保存配置
pm2 save

# 开机自启
pm2 startup
```

## 性能优化

### 数据库优化

```bash
# 定期清理旧数据（可选）
sqlite3 ~/.betterme/activity.db "DELETE FROM activity_records WHERE created_at < datetime('now', '-90 days');"
```

### 监控脚本优化

- 增加检查间隔以降低 CPU 使用率：`--interval 120`
- 定期重启脚本以释放内存

## 故障排除

### 应用无法启动

```bash
# 清除缓存
rm -rf .vite node_modules/.vite

# 重新安装依赖
pnpm install

# 重启开发服务器
pnpm dev
```

### 数据库连接错误

```bash
# 检查数据库文件
ls -la ~/.betterme/activity.db

# 重新初始化数据库
pnpm db:push
```

### 监控脚本无法记录数据

```bash
# 检查数据库权限
chmod 644 ~/.betterme/activity.db

# 检查日志
tail -f activity_monitor.log
```

## 技术栈

- **前端**：React 19 + Tailwind CSS 4 + Recharts
- **后端**：Express 4 + tRPC 11
- **数据库**：SQLite + Drizzle ORM
- **认证**：Manus OAuth
- **监控**：Python + SQLite
- **设计**：Memphis 风格

## 许可证

MIT

## 支持

如有问题或建议，请在 GitHub 上提交 Issue 或 Pull Request。

---

**祝你使用愉快！让 BetterMe 帮助你成为更好的自己。** 🚀
