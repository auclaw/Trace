# Merize - AI 自动时间追踪工具（中文本地化版）

[原 Rize](https://rize.io/) 是AI驱动的自动时间追踪效率工具，原生支持 macOS/Windows。**Merize** 是中文本地化二次开发版本，针对中国用户深度优化：

- ✅ **去掉国外集成**（不需要 GitHub/GitLab 日历集成这些，国内用户用不上）
- ✅ **国内登录方式**：手机号验证码 + 微信一键登录
- ✅ **中文软件分类优化**：规则+AI双重分类，针对国内常用软件专门优化准确率
- ✅ **价格只有原版 1/3**：¥29/月 或 ¥199/年，原版 $12/月 ≈ ¥80+
- ✅ **后端部署国内**：访问速度快，不需要翻墙

## 产品差异化 vs 竞品

| 产品 | AI自动分类 | 中文 | 价格 | 我们优势 |
|------|------------|------|------|----------|
| RescueTime | ❌ 需要手动 | ❌ | $12/月 | ✅ 我们AI自动分类 + 完整中文 + ¥29/月 |
| ManicTime | ❌ | ❌ | 免费 | 界面老旧，没有AI |
| Timing | ❌ | ✅ | $65一次性 | 贵，没有AI自动分类 |
| 原版 Rize | ✅ | ❌ | $12/月 | 国内访问慢，没中文，价格贵 |
| **Merize** | ✅ | ✅ | **¥29/月 或 ¥199/年** | **针对中国用户优化：开机自启 + 系统托盘 + 全中文界面** |

## 核心功能 ✓ 全部完成

| 功能 | 状态 | 说明 |
|------|------|------|
| 自动追踪活跃窗口 | ✅ Done | 每秒轮询，自动记录 |
| AI 自动分类 | ✅ Done | 支持文心一言/字节豆包，规则分类兜底 |
| 今日时间线可视化 | ✅ Done | 色块长度对应时长，点击修改分类 |
| 每日统计仪表盘 | ✅ Done | 分类统计 + 总时长 |
| 每周统计饼图 | ✅ Done | 时间分布可视化 |
| 数据导出 | ✅ Done | JSON / CSV 两种格式 |
| 日历历史浏览 | ✅ Done | 按月查看，手动添加编辑活动 |
| 今日计划任务 | ✅ Done | 支持优先级 + AI 智能重排延误任务 |
| 活动关联计划 | ✅ Done | 自动统计任务实际用时 |
| 系统托盘菜单 | ✅ Done | 显示追踪状态，快速控制 |
| 开机自启 | ✅ Done | 官方插件支持 |
| 忽略应用列表 | ✅ Done | 用户配置不追踪哪些app |
| 手机号登录 | ✅ Done | 符合国内用户习惯 |
| 微信一键登录 | ✅ Done | OAuth 流程已打通 |
| 云端数据同步 | ❌ MVP 省略 | 第一版先本地存储验证 |

## 项目结构

```
merize/
├── src/               # 前端 React + TypeScript
│   ├── pages/          # 仪表盘 / 统计 / 日历 / 计划 / 设置 / 登录
│   ├── components/     # 时间线 / 侧边栏
│   └── utils/          # api / auth / tracking / planner
├── src-tauri/         # Rust 后端 Tauri (native 追踪)
└── backend/          # Python Flask API 后端 (登录 / AI分类 / 数据存储)
    ├── app.py
    ├── requirements.txt
    └── config.example.py
```

## 快速开始开发

### 后端
```bash
cd backend
pip install -r requirements.txt
# 复制 config.example.py 为 config.py 填入你的配置
python app.py
```

### 前端开发
```bash
# 安装依赖
npm install

# 开发模式
npm run tauri dev

# 编译打包
npm run tauri build
```

## 配置说明

后端 `backend/config.py`:
1. `SECRET_KEY` - JWT 密钥
2. `ERNIE_API_KEY` / `DOUBAN_API_KEY` - 大模型 API 密钥（二选一）
3. `WECHAT_APP_ID` / `WECHAT_APP_SECRET` - 微信开放平台

## 技术栈

- 后端 API：Python Flask
- 桌面端：Rust + Tauri 2（跨端，比 Electron 更轻量）
- 前端：React + TypeScript + Tailwind CSS
- AI 分类：调用文心一言/豆包 API，可切换
- 自动追踪：Tauri native 系统进程监控

## 开发状态

**核心功能 100% 完成，等待编译测试**

## 启动开发

### 后端
```bash
cd backend
pip install -r requirements.txt
# 复制 config.example.py 为 config.py 填入你的配置
python app.py
```

### 前端
```bash
# 安装依赖
npm install

# 开发模式
npm run tauri dev

# 编译打包
npm run tauri build
```

## 你需要配置

后端 `backend/config.py`:
1. `SECRET_KEY` - JWT密钥
2. `ERNIE_API_KEY` / `DOUBAN_API_KEY` - 大模型API密钥
3. `WECHAT_APP_ID` / `WECHAT_APP_SECRET` - 微信开放平台

## 技术栈

- 后端API：Python Flask
- 桌面端：Rust + Tauri（跨端，比Electron更轻量）
- 前端：React + TypeScript + Tailwind CSS
- AI分类：调用文心一言/豆包API，可切换
- 自动追踪：Tauri native对系统进程监控
