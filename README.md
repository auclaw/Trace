# Rize 中文本地化 - MVP 项目框架

Rize 是AI驱动的自动时间追踪效率工具，原生支持macOS/Windows。这个项目是中文本地化版本，针对中国用户优化，去掉不需要的国外集成功能，加上国内用户常用登录方式。

## 产品差异化 vs 竞品

| 产品 | AI自动分类 | 中文 | 价格 | 我们优势 |
|------|------------|------|------|----------|
| RescueTime | ❌ 需要手动 | ❌ | $12/月 | ✅ 我们AI自动分类 + 完整中文 + ¥29/月 |
| ManicTime | ❌ | ❌ | 免费 | 界面老旧，没有AI |
| Timing | ❌ | ✅ | $65一次性 | 贵，没有AI自动分类 |
| 原版 Rize | ✅ | ❌ | $12/月 | 国内访问慢，没中文，价格贵 |
| **Rize 中文** | ✅ | ✅ | **¥29/月 或 ¥199/年** | **针对中国用户优化：去掉国外集成，加微信/手机号登录** |

## 核心功能（MVP） - 中国用户定制

1. ✅ 自动追踪电脑进程和网站访问
2. ✅ AI自动分类活动（针对中文软件/网站专门优化prompt，准确率更高）
3. ✅ 手机号验证码登录，符合国内用户习惯
4. ✅ 微信一键登录，方便快捷
5. ✅ 每日/每周时间统计报表
6. ✅ 专注时间统计和效率分析
7. ✅ 全中文界面
8. ✅ 后端部署国内服务器，访问速度快
9. ❌ 去掉了所有国外软件集成功能，不需要

## 价格（对比原版）

- 原版：$12/月 ≈ ¥80+
- 中文本地化版：**¥29/月 或 ¥199/年**，价格只有原版1/3

## 项目结构

```
rize-chinese/
├── src/               # 前端 React + TypeScript
│   ├── pages/          # 仪表盘 / 统计 / 设置 / 登录
│   └── utils/          # api / auth
├── src-tauri/         # Rust 后端 Tauri
└── backend/          # API后端 （登录 / AI分类 / 数据存储）
    ├── app.py
    ├── requirements.txt
    └── config.example.py
```

## 开发路线图

- [x] MVP 框架搭建
- [x] 登录系统：手机号 + 微信登录
- [x] AI分类prompt针对中文优化
- [x] 基础页面：仪表盘 / 统计 / 设置
- [ ] 完善自动追踪逻辑
- [ ] 测试分类准确率
- [ ] 编译发布测试版本

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
