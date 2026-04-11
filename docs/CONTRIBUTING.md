# 贡献指南 - Trace 时迹

感谢你对 Trace 项目感兴趣！我们欢迎各种形式的贡献。

## 开发环境准备

### 前置要求

- Node.js 18+
- Rust 1.70+
- Python 3.9+
- Tauri CLI
- Cargo

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/auclaw/Trace.git
cd Trace

# 安装前端依赖
npm install

# 安装后端依赖
cd backend
pip install -r requirements.txt

# 安装 Rust 依赖
cd ../src-tauri
cargo build
```

### 启动开发服务器

```bash
# 前端开发服务 (vite)
npm run dev

# 后端开发服务 (Flask)
cd backend
FLASK_ENV=development python app.py

# Tauri 开发模式
npm run tauri:dev
```

## 代码规范

### 前端 (React/TypeScript)

- 使用 TypeScript，所有变量/函数必须有类型
- 使用 ESLint + Preettier 格式化代码
- 遵循现有的目录结构和分层架构
- 组件使用函数式编程风格

### 后端 (Python Flask)

- 遵循 PEP 8 规范
- 使用 flake8 检查代码
- 保持单一职责原则
- 路由处理函数保持简洁，业务逻辑放在 services/

### Rust (Tauri)

- 遵循 Rust 官方规范
- 使用 cargo clippy 检查代码
- 使用 cargo fmt 格式化代码

### 提交前检查

项目配置了 pre-commit hook，提交前会自动检查：

```bash
# 手动运行检查
npm run lint       # ESLint 检查
npm run format     # Prettier 格式化
```

## 分支策略

- `main` - 主分支，保持可发布版本
- `develop` - 开发分支，所有 PR 合入
- `feature/*` - 新功能分支
- `fix/*` - Bug 修复分支

## 提交流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的改动 (`git commit -m 'Add some amazing feature'`)
   - 遵循 约定式提交 格式：
     - `feat: 新增功能`
     - `fix: 修复 Bug`
     - `docs: 更新文档`
     - `refactor: 重构代码`
     - `style: 格式调整`
     - `test: 添加测试`
4. 推送到你的分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### Pull Request 指南

- PR 标题清晰描述改动内容
- 描述中说明解决的问题
- 确保所有 CI 检查通过
- 至少有一个 Approve 才能合并
- 保持 PR 专注，一个 PR 解决一个问题

## 架构约定

### 新增功能

1. **前端 IPC 分层：新功能必须放在 `src/services/ipc/` 对应文件
2. 所有和云端 API 通信使用 `src/utils/apiClient.ts`
3. 状态放入 `useAppStore`
4. 未完成功能使用 feature flag 隐藏，不加入 `DEFAULT_MODULES`

### 安全要求

- 不提交敏感信息（.env 文件不会进仓库
- 用户密码/验证码必须哈希存储
- 外部输入必须验证，防止 SQL 注入
- CSP 配置保持严格

## 报告 Bug

### 报告 Bug 请提供

1. **问题描述** - 清晰描述遇到的问题
2. **复现步骤** - 如何复现这个 Bug
3. **预期行为** - 你期望发生什么
4. **实际行为** - 实际发生了什么
5. **环境信息** - 操作系统、Node.js 版本、Python 版本
6. **截图** - 如果可能，添加截图帮助定位

## 功能请求

我们欢迎功能请求，但是请考虑：

- 这个功能是否符合项目定位？Trace 是面向个人用户的时间追踪工具
- 是否和现有功能重复？
- 描述清楚你想要的功能和使用场景

## 代码审核

所有代码都会经过代码审核，审核关注：

- 功能正确性
- 代码风格是否符合规范
- 是否存在安全问题
- 是否符合项目架构

## 许可证

By contributing, you agree that your contributions will be licensed under the MIT License.

## 联系方式

- 提交 Issue: [GitHub Issues](https://github.com/auclaw/Trace/issues)
- 开发者邮件: contact@auclaw.com
