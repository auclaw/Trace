# Trace 时迹 - AI 自动时间追踪工具（中文本地化版）

[原 Rize](https://rize.io/) 是AI驱动的自动时间追踪效率工具，原生支持 macOS/Windows。**Trace 时迹** 是中文本地化二次开发版本，针对中国用户深度优化：

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
| **Trace 时迹** | ✅ | ✅ | **¥29/月 或 ¥199/年** | **1. 针对中国用户优化：开机自启 + 系统托盘 + 全中文界面**<br>**2. 原生支持 AI Agent 调用**，未来入口已经占位<br>**3. 集成任务管理 + 番茄工作法**，一站式解决时间管理 |

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
| 日历热力图 | ✅ Done | 长期活动热力图，历史趋势一眼可见 |
| 今日计划任务 | ✅ Done | 支持优先级 + AI 智能重排延误任务 |
| 活动关联计划 | ✅ Done | 自动统计任务实际用时 |
| 番茄工作法 | ✅ Done | 后端驱动专注番茄钟，自动暂停检测 |
| 系统托盘菜单 | ✅ Done | 显示追踪状态，快速控制 |
| 开机自启 | ✅ Done | 官方插件支持 |
| 全局键盘快捷键 | ✅ Done | 快速操作专注模式 |
| 新手交互式导览 | ✅ Done | 新用户一步一步上手 |
| 忽略应用列表 | ✅ Done | 用户配置不追踪哪些app |
| 手机号登录 | ✅ Done | 符合国内用户习惯 |
| 微信一键登录 | ✅ Done | OAuth 流程已打通 |
| 云端数据同步 | ✅ Done | 多设备数据一致 |
| PDF 数据导出 | ✅ Done | 美观报表导出 |

## Agent 原生支持 - Skill 就是 Agent 时代的 App

在 Agent 时代，入口从「用户打开 App」转向「Agent 帮用户完成任务」。MyTime 从设计之初就支持 AI Agent 调用，所有核心能力都通过标准化 API 开放：

```typescript
// Agent 可调用能力列表
- get_time_summary(days: number) → 获取N天时间使用统计
- create_task(title: string, scheduledTime?) → 创建任务
- list_tasks(status?) → 列出任务
- get_insights() → 获取时间使用洞察建议
- update_activity_category(id, newCategory) → 修改活动分类
```

**架构预留**：当前使用 REST API + TypeScript 接口定义，未来生态成熟后可一键适配 MCP (Model Context Protocol) 协议，让任何 Agent 都能自动发现并调用我们的能力。

### UI/UX 设计系统

我们采用 **Aether 通透现代设计系统**，灵感来自顶尖 Figma 仪表盘设计和国内桌面端产品实践：

**设计特点**:
- 浅灰通透背景 `#f0f0f0` + 干净白色卡片，呼吸感强
- **超大圆角**: 容器 28px / 卡片 16px / 按钮 10px，现代风格
- **极柔和阴影分层**，无边框设计，仅用阴影区分层级，符合最新设计趋势
- **五种可选主题配色**:
  - 清爽天蓝 `#5aa9e6` (默认) - 干净清爽，适合长时间工作
  - 自然翠绿 `#34c759` - 清新自然，缓解视觉疲劳
  - 优雅紫调 `#af52de` - 优雅知性，适合创意工作
  - 活力橙黄 `#ff9500` - 充满活力，提升专注力
  - 柔粉樱花 `#ff2d55` - 柔美清新

**设计原则**:
- 借鉴 Rize 的 Z-pattern 布局：左上角目标 → 中央计时器 → 底部洞察，自然阅读顺序
- Minimal Cognitive Load：专注模式自动淡化非核心 UI，减少认知负荷
- 呼吸动画：专注计时器平缓呼吸动画，提供潜意识节奏反馈
- 用户可自定义：明暗模式 + 五种配色自由切换

## 设计系统更新记录

**v1.1.0 (2026-04-07)**:
- 完成全面 UI/UX 重构，采用 Aether 通透现代设计系统
- 添加**用户可自定义主题配色**，五种彩色主题可选
- 所有页面适配新设计语言，超大圆角 + 柔和阴影
- 参考国内桌面端产品（飞书、滴答清单）设计交互习惯

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

✅ **核心功能 100% 完成，UI/UX 重构 v1.1.0 完成，即将正式发布**

**当前版本**: v1.1.0 (Aether 设计系统更新)

更新亮点：
- 全新 Aether 通透现代设计系统，参考顶尖 Figma 设计
- 用户可自定义主题配色（五种彩色主题）
- 超大圆角 + 柔和阴影分层，无边框设计更现代
- 全面对齐国内桌面端产品交互习惯

## 安装指南

### 环境要求

- **Node.js**: 18.x 或以上
- **Rust**: 1.70 或以上（Tauri 编译需要）
- **Python**: 3.8 或以上（后端 API）
- **macOS** / **Windows**: 支持 Intel/Apple Silicon

### 步骤 1：克隆项目

```bash
git clone https://github.com/auclaw/merize.git
cd merize
```

### 步骤 2：配置后端

```bash
cd backend
cp config.example.py config.py
# 编辑 config.py 填入你的 API 密钥
```

**配置项说明**:
| 配置项 | 说明 | 是否必填 |
|--------|------|----------|
| `SECRET_KEY` | JWT 加密密钥 | ✅ 必填 |
| `ERNIE_API_KEY` | 百度文心一言 API 密钥 | 二选一 |
| `DOUBAN_API_KEY` | 字节跳动豆包 API 密钥 | 二选一 |
| `WECHAT_APP_ID` | 微信开放平台 App ID | 可选（微信登录） |
| `WECHAT_APP_SECRET` | 微信开放平台 App Secret | 可选（微信登录） |

### 步骤 3：安装后端依赖并启动

```bash
cd backend
pip install -r requirements.txt
python app.py
```
后端将在 `http://localhost:5000` 启动

### 步骤 4：安装前端依赖并启动开发模式

打开**新的终端窗口**:

```bash
cd merize  # 项目根目录
npm install
npm run tauri dev
```

### 步骤 5：编译打包生产应用

```bash
# 编译打包生成 .app/.exe 安装包
npm run tauri build
```

编译完成后，安装包位于 `src-tauri/target/release/bundle/` 目录

## 开发启动

完整开发启动流程：

**终端 1 - 后端 API**:
```bash
cd backend
python app.py
```

**终端 2 - 前端桌面应用**:
```bash
npm run tauri dev
```

## 配置说明

后端 `backend/config.py`:
1. `SECRET_KEY` - JWT 密钥
2. `ERNIE_API_KEY` / `DOUBAN_API_KEY` - 大模型 API 密钥（二选一）
3. `WECHAT_APP_ID` / `WECHAT_APP_SECRET` - 微信开放平台

## 使用说明

### 登录方式

#### 方式一：生产环境 - 手机号验证码登录
需要配置阿里云短信服务在 `backend/config.py`:
```python
SMS_PROVIDER = 'alicloud'
SMS_ACCESS_KEY_ID = '你的阿里云AccessKey'
SMS_ACCESS_KEY_SECRET = '你的阿里云AccessKeySecret'
SMS_SIGN_NAME = '你的短信签名'
SMS_TEMPLATE_CODE = '你的短信模板CODE'
```
启动后，用户输入手机号 → 获取验证码 → 输入验证码 → 登录。

#### 方式二：生产环境 - 微信一键登录
需要配置微信开放平台在 `backend/config.py`:
```python
WECHAT_APP_ID = '你的微信AppID'
WECHAT_APP_SECRET = '你的微信AppSecret'
```
启动后，点击"微信一键登录" → 扫描二维码 → 确认登录。

#### 方式三：开发模式 - 免验证码直接登录（推荐本地开发使用）
当短信配置为空时，**自动启用开发模式**。在登录页面会显示"⚙️ 直接登录（无需验证码）"按钮：
1. 输入手机号（任意11位格式正确即可）
2. 点击"直接登录"
3. 自动创建用户并登录，默认赠送14天免费试用

如果短信配置了真实服务，该按钮会自动隐藏。

### 完整启动命令

```bash
# 终端 1: 启动后端 API
cd /path/to/merize/backend
pip install -r requirements.txt
python app.py

# 终端 2: 启动桌面应用
cd /path/to/merize
npm install
npm run tauri dev
```

### 查看验证码（测试短信配置时）
当短信配置了但想查看验证码，可以在后端终端日志中看到：
```
[DEV MODE] Verification code for 13800138000 is: 123456
```

## 技术栈

- 后端API：Python Flask
- 桌面端：Rust + Tauri 2（跨端，比Electron更轻量）
- 前端：React + TypeScript + Tailwind CSS
- AI分类：调用文心一言/豆包/通义千问 API，可切换
- 自动追踪：Tauri native 系统进程监控
