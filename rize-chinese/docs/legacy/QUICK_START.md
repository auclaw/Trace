# BetterMe 快速开始指南

## 5 分钟快速上手

### 第 1 步：克隆项目（1 分钟）

```bash
git clone https://github.com/aujingx/betterme.git
cd betterme
```

### 第 2 步：安装依赖（2 分钟）

```bash
pnpm install
# 或使用 npm install
```

### 第 3 步：启动应用（1 分钟）

```bash
# 开发模式
pnpm dev

# 或生产模式
pnpm build
pnpm start
```

应用将在 `http://localhost:3000` 启动。

### 第 4 步：开始使用（1 分钟）

1. 打开浏览器访问 `http://localhost:3000`
2. 使用 Manus OAuth 登录（或跳过）
3. 开始创建你的第一个计划！

## 主要功能速览

| 功能 | 位置 | 说明 |
|------|------|------|
| 仪表盘 | 首页 | 查看今日统计和效率评分 |
| 24 小时时间线 | 时间线 | 可视化显示全天时间分配 |
| 日计划 | 计划 | 创建和管理每日任务 |
| 时间块补全 | 时间块 | 手动补全未记录的时间 |
| 日历视图 | 日历 | 按月份查看统计数据 |
| AI 分析 | AI 洞察 | 获得个性化的效率建议 |
| 自然语言排时间 | 自然语言排时间 | 用自然语言描述任务，AI 自动排时间 |
| 数据导出 | 数据导出 | 导出 CSV 或 JSON 格式的数据 |

## 常见操作

### 创建每日计划

1. 点击导航菜单中的"计划"
2. 点击"创建计划"按钮
3. 输入任务名称、预计时间和优先级
4. 点击"保存"

### 添加时间块

1. 点击导航菜单中的"时间块"
2. 点击"新增时间块"按钮
3. 选择日期、时间和活动类型
4. 点击"保存"

### 查看效率分析

1. 点击导航菜单中的"分析"
2. 查看效率饼图、时间分配柱状图和趋势折线图
3. 点击"AI 洞察"查看 AI 生成的建议

### 配置 LLM API

1. 点击导航菜单中的"设置"
2. 在"LLM API 配置"部分输入 Qwen API Key
3. 点击"保存"

## 环境变量配置

创建 `.env.local` 文件：

```bash
# 必需
DATABASE_URL=file:./betterme.db

# 可选
DASHSCOPE_API_KEY=your-api-key
JWT_SECRET=your-secret
```

## 故障排除

| 问题 | 解决方案 |
|------|--------|
| 端口 3000 已被占用 | `PORT=3001 pnpm dev` |
| 数据库连接失败 | 检查 `DATABASE_URL` 配置 |
| LLM API 不工作 | 检查 `DASHSCOPE_API_KEY` 是否设置 |

## 下一步

- 📖 阅读[完整部署指南](./INSTALLATION_GUIDE.md)
- 🔧 查看[开发指南](./DEPLOYMENT_GUIDE.md)
- 🐛 报告问题：https://github.com/aujingx/betterme/issues
- 💬 讨论功能：https://github.com/aujingx/betterme/discussions

---

**准备好了吗？现在就开始吧！** 🚀
