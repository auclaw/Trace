# BetterMe 桌面应用 - 安装和使用指南

## 概述

BetterMe 现已支持作为独立的桌面应用运行，无需打开终端或网页浏览器。你可以一键启动，应用将在后台运行，一键关闭即可。

## 系统要求

- **Windows**: Windows 7 或更高版本
- **macOS**: macOS 10.13 或更高版本
- **Linux**: Ubuntu 16.04 或更高版本

## 安装步骤

### 1. 克隆或下载项目

```bash
git clone https://github.com/aujingx/betterme.git
cd betterme
```

### 2. 安装依赖

```bash
npm install
# 或使用 pnpm
pnpm install
```

### 3. 构建应用

#### 方式一：开发模式（推荐用于测试）

```bash
npm run electron-dev
```

这将启动开发服务器和 Electron 应用。

#### 方式二：打包可执行文件

**Windows:**
```bash
npm run electron-build-win
```

**macOS:**
```bash
npm run electron-build-mac
```

**Linux:**
```bash
npm run electron-build-linux
```

**所有平台:**
```bash
npm run electron-build
```

打包完成后，可执行文件将在 `dist_electron` 文件夹中。

## 快速启动

### Windows

1. **方式一：使用启动脚本**
   - 双击 `scripts/launch-betterme.bat`
   - 应用将自动启动

2. **方式二：手动启动**
   - 打开命令提示符（CMD）
   - 进入项目目录：`cd path/to/betterme`
   - 运行：`npm run electron-dev`

### macOS

1. **方式一：使用启动脚本**
   ```bash
   chmod +x scripts/launch-betterme.sh
   ./scripts/launch-betterme.sh
   ```

2. **方式二：手动启动**
   ```bash
   npm run electron-dev
   ```

### Linux

1. **方式一：使用启动脚本**
   ```bash
   chmod +x scripts/launch-betterme.sh
   ./scripts/launch-betterme.sh
   ```

2. **方式二：手动启动**
   ```bash
   npm run electron-dev
   ```

## 使用应用

启动后，BetterMe 桌面应用窗口将自动打开。你可以：

- **创建计划**：在"计划"页面创建今日任务
- **记录活动**：使用"时间块"页面手动记录时间
- **查看分析**：在"分析"页面查看效率数据
- **获得建议**：在"AI 洞察"页面获得个性化建议
- **配置设置**：在"设置"页面配置 LLM API 和用户习惯

## 关闭应用

- **Windows/macOS/Linux**: 点击窗口的关闭按钮（X）或使用菜单 File → Exit

## 打包为独立安装程序

### Windows (.exe)

```bash
npm run electron-build-win
```

生成的 `.exe` 文件可以直接分发给其他用户安装。

### macOS (.dmg)

```bash
npm run electron-build-mac
```

生成的 `.dmg` 文件可以拖拽安装到 Applications 文件夹。

### Linux (.AppImage)

```bash
npm run electron-build-linux
```

生成的 `.AppImage` 文件可以直接运行，无需安装。

## 故障排除

### 问题 1：应用无法启动

**解决方案**：
1. 确保 Node.js 已安装：`node --version`
2. 确保所有依赖已安装：`npm install` 或 `pnpm install`
3. 检查是否有端口冲突（默认使用 5173 端口）

### 问题 2：找不到数据库

**解决方案**：
1. 确保 SQLite 数据库文件存在于 `~/.betterme/` 目录
2. 运行 `npm run db:push` 初始化数据库

### 问题 3：Qwen API 无法连接

**解决方案**：
1. 在"设置"页面配置 `DASHSCOPE_API_KEY`
2. 确保网络连接正常
3. 检查 API 密钥是否正确

## 开发指南

### 修改源代码

1. 编辑 `client/src` 中的前端代码
2. 编辑 `server` 中的后端代码
3. 运行 `npm run electron-dev` 查看实时更改

### 调试

- 开发模式下，开发者工具会自动打开
- 使用 Chrome DevTools 调试前端代码
- 使用 `console.log()` 输出调试信息

## 常见问题

**Q: 如何在系统启动时自动启动 BetterMe？**
A: 
- Windows: 将启动脚本放在 `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`
- macOS: 添加到系统偏好设置 → 通用 → 登录项
- Linux: 创建 `.desktop` 文件放在 `~/.config/autostart/`

**Q: 如何卸载 BetterMe？**
A:
- Windows: 使用控制面板 → 程序和功能 → 卸载
- macOS: 从 Applications 文件夹拖拽到垃圾桶
- Linux: 运行 `sudo apt remove betterme` 或删除 `.AppImage` 文件

**Q: 数据存储在哪里？**
A: 所有数据存储在本地 SQLite 数据库，位置为 `~/.betterme/betterme.db`

## 支持

如有问题，请在 GitHub 提交 Issue：https://github.com/aujingx/betterme/issues
