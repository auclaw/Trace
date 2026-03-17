# Rize 中文本地化 - MVP 项目框架

Rize 是AI驱动的自动时间追踪效率工具，原生支持macOS/Windows。这个项目是中文本地化版本，针对中国用户优化。

## 项目结构

```
rize-chinese/
├── src-tauri/          # Rust 后端 (tauri)
├── src/               # 前端 React + TypeScript
├── package.json
└── tauri.conf.json
```

## 核心功能（MVP）

1. ✅ 自动追踪电脑进程和网站访问
2. ✅ AI自动分类活动（针对中文软件/网站优化训练）
3. ✅ 每日/每周时间统计报表
4. ✅ 专注时间统计和效率分析
5. ✅ 全中文界面
6. ✅ 国内服务器，访问速度快

## 价格（对比原版）

- 原版：$12/月 ≈ ¥80+
- 中文本地化版：**¥29/月 或 ¥199/年**，价格只有原版1/3

## 启动开发

```bash
# 安装依赖
npm install

# 开发模式
npm run tauri dev

# 编译打包
npm run tauri build
```

## 你需要配置

1. 在 `src-tauri/.env` 填入大模型API密钥（文心一言/豆包）
2. 编译生成安装包
3. 发布测试

## 技术栈

- 后端：Rust + Tauri（跨端，比Electron更轻量）
- 前端：React + TypeScript + Tailwind CSS
- AI分类：调用文心一言/豆包API
- 自动追踪：用tauri-native对系统进程监控
