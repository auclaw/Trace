# Merize 开发任务跟踪 / Development Work Tracker

> **Branch**: `main`
> **Last Updated**: 2026-04-09 (深度代码审计后重新整理)
> **Purpose**: 让任何 AI 或开发者可以接手继续工作 / Enable any AI or developer to continue work
> **Audit Report**: `docs/AUDIT_REPORT_2026-04-09.html` (含完整竞品分析)

---

## 项目概述 / Project Context

Merize 是一个集 Rize.io（自动时间追踪）、滴答清单（任务管理）、Forest（专注游戏化）、多邻国（互动激励）、Monday（项目管理）优势于一体的中文 AI 效率工具。

**核心差异化**: 市场上没有任何单一产品同时提供 "自动时间追踪 + 任务管理 + 习惯追踪 + 游戏化宠物 + 团队功能"。这是 Merize 的独有定位。

**技术栈**: React 18 + TypeScript + Tailwind CSS + Zustand + Tauri 2 (desktop) + localStorage (web demo)
**仓库**: https://github.com/auclaw/merize.git
**分支**: main

---

## 如何开始工作 / How to Start Working

```bash
# 1. Clone
git clone https://github.com/auclaw/merize.git
cd merize

# 2. Install dependencies
npm install

# 3. Run dev server (web demo mode)
npm run dev
# App runs at http://localhost:5173

# 4. Type check
npx tsc --noEmit

# 5. Build
npm run build
```

### 关键文件结构 / Key File Structure

```
src/
├── App.tsx                    # 主应用入口，路由定义
├── main.tsx                   # React 挂载点
├── config/themes.ts           # 设计令牌，5个主题，模块定义
├── hooks/useTheme.ts          # 主题 hook
├── store/useAppStore.ts       # Zustand 全局状态管理 (480行)
├── services/
│   ├── dataService.ts         # localStorage 数据层 + demo 数据生成 (736行)
│   └── trackingService.ts     # AI 自动追踪模拟服务 (692行)
├── i18n/
│   ├── index.ts               # i18n 初始化 (react-i18next)
│   ├── zh-CN.json             # 简体中文语言包
│   └── en-US.json             # English 语言包
├── components/
│   ├── Sidebar.tsx            # 侧边栏导航 (可收缩, 模块过滤)
│   ├── Onboarding.tsx         # 7步新手引导向导
│   ├── ThemeSelector.tsx      # 主题选择器
│   ├── DailySummary.tsx       # Rize 风格每日总结弹窗 (620行)
│   ├── PetDialogue.tsx        # 多邻国式宠物对话系统 (290行)
│   ├── PetMiniWidget.tsx      # 宠物迷你浮动挂件 (354行)
│   ├── PetShop.tsx            # 宠物商店弹窗 (食物/装饰品/新宠物)
│   ├── FocusStatusIndicator.tsx # 右上角全局专注状态指示器
│   ├── FocusStartedModal.tsx  # Rize 风格专注开始弹窗
│   ├── FocusCompletedModal.tsx # 专注完成庆祝弹窗
│   ├── DailyGoalAchievedModal.tsx # 每日目标达成弹窗
│   ├── ConfirmDialog.tsx      # 通用确认对话框
│   └── ui/                    # 通用 UI 组件库 (Button, Modal, Card, Toast, Input, Badge, Progress, EmptyState, Skeleton)
├── pages/
│   ├── Dashboard.tsx          # 仪表盘 (追踪banner, 专注分数, 快捷操作, 计划对比)
│   ├── Timeline.tsx           # Rize 风格实时活动时间线 (批量操作, 隐私级别, 粒度控制)
│   ├── Planner.tsx            # 计划/任务管理 (4种视图: 列表/看板/日历/时间线)
│   ├── FocusMode.tsx          # 专注模式 + 心流屏蔽
│   ├── Habits.tsx             # 习惯追踪 (支持多次打卡, 提醒, 多邻国式鼓励)
│   ├── Statistics.tsx         # 统计 (3个tab: 概览/深度工作/AI洞察) ⚠️ 961行需拆分
│   ├── VirtualPet.tsx         # 虚拟宠物 (CSS 像素风, 可取名, 成长系统)
│   ├── Settings.tsx           # 设置 (隐私级别/追踪规则/主题/模块/通知/语言)
│   └── Team.tsx               # 团队模块 (4个子标签: 仪表盘/专注/周报/管理)
```

### 设计原则 / Design Principles

- **暖色设计系统**: 使用 CSS 变量 `var(--color-*)`, 暖色调阴影, 渐变卡片
- **主题**: 5种颜色主题 (活力橙/海洋蓝/森林绿/优雅紫/樱花粉) + 3种背景皮肤
- **所有颜色通过 CSS 变量**: 不硬编码 Tailwind 颜色类
- **交互完整性**: 每个按钮必须有真实响应，不允许空壳

---

## 当前项目健康状况 / Current Health (2026-04-09 审计)

| 指标 | 状态 |
|------|------|
| TypeScript 编译 | ✅ 零错误 |
| Vite Build | ✅ 通过 (6.96s) |
| npm 安全漏洞 | ✅ 0 个 |
| CSS Warnings | ⚠️ 1 个 (themes.ts 模板语法) |
| 路由完整性 | ✅ 9 个主路由全部正常 |
| **综合健康分** | **72/100** |

---

## 已完成的工作 / Completed Work (经审计确认)

### ✅ 真实完成

| Task | 描述 | 状态 | 审计确认 |
|------|------|------|----------|
| TASK-01 | AI 自动追踪核心系统 | ✅ | trackingService.ts 692行, 25+ 模拟应用, 分类管道完整 |
| TASK-02 | 计划 vs 实际时间对比 | ✅ | Dashboard 进度环 + DailySummary 对比 |
| TASK-03 | 当日总结弹窗 | ✅ | DailySummary.tsx 620行, 环形图+导出 |
| TASK-04 | 多邻国式互动对话 | ✅ | PetDialogue.tsx 290行, 6种触发场景 |
| TASK-05 | 宠物迷你挂件 | ✅ | PetMiniWidget.tsx 354行, 浮动+自动隐藏 |
| TASK-06 | Settings 页面 | ✅ | 隐私/追踪规则/模块/专注/目标/主题 齐全 |
| TASK-07 | Dashboard 增强 | ✅ | 追踪 banner + 专注分数 + 快捷操作 + 时间线 |
| TASK-09 | 团队功能 | ✅ | Team.tsx 统一重写, localStorage, 4个子标签 |
| TASK-12 | 功能测试 | ✅ | tsc 零错误, build 通过 |
| TASK-13 | 宠物商店 | ✅ | PetShop.tsx 食物/装饰品/新宠物 |
| EXTRA | 全局专注指示器+弹窗 | ✅ | FocusStatusIndicator + 3个弹窗 |
| 基础设施 | Zustand + localStorage + UI组件库 + 主题 | ✅ | 架构扎实 |

### ⚠️ 部分完成 (需修复)

| Task | 描述 | 声称状态 | 实际状态 | 具体问题 |
|------|------|----------|----------|----------|
| TASK-08 | Rize 深度功能 | ✅ 已完成 | ⚠️ 部分 | 批量操作按钮为空 placeholder (Timeline.tsx:735,746); 活动粒度是模式切换而非Rize滑块 |
| TASK-10 | i18n 国际化 | ✅ 已完成 | ❌ 严重不足 | 仅 Sidebar 用 useTranslation(), 其余所有页面硬编码中文 |
| TASK-11 | 视觉打磨 | ✅ 已完成 | ⚠️ 部分 | Skeleton 已创建未接入, EmptyState 部分接入, 响应式未测试 |

---

## 待完成任务 / Remaining Tasks (优先级排序)

---

### 🔴 P0 — 立即修复 (阻塞发布)

#### TASK-P0-1: 实现 Timeline 批量操作真实逻辑
**文件**: `src/pages/Timeline.tsx`
**当前问题**: 第 735 行 "批量分类" 和第 746 行 "批量删除" 按钮的 onClick 是空 placeholder
**需要做的事**:
1. 批量分类: 弹出类别选择下拉/Modal, 选择后将 `selectedIds` 中所有活动更新为目标类别
2. 批量删除: 弹出 ConfirmDialog 确认, 确认后从 store 中删除选中活动
3. 操作完成后清空 `selectedIds`, 显示 Toast 反馈
**验证标准**:
- [ ] 选中多个活动后点击 "批量分类" 弹出类别选择器
- [ ] 选择类别后所有选中活动的类别更新, Toast 显示 "已更新 N 条活动"
- [ ] 点击 "批量删除" 弹出确认对话框
- [ ] 确认后活动从时间线消失, Toast 显示 "已删除 N 条活动"
- [ ] 操作后选择状态清空
**参考**: 使用已有的 `ConfirmDialog` 组件 (`src/components/ConfirmDialog.tsx`)

#### TASK-P0-2: 清理遗留 API 页面
**文件**: `src/pages/OrgAdmin.tsx`, `src/pages/PrivacySettings.tsx`, `src/pages/WeeklyApproval.tsx`, `src/pages/TeamDashboard.tsx`, `src/pages/TeamFocus.tsx`
**当前问题**: 这 5 个页面直接调用 REST API (apiRequest), 在 web demo 模式下会 fetch 失败
**需要做的事**:
1. 确认这些页面是否在 App.tsx 路由中被使用 (当前未挂载)
2. 如果不使用: 直接删除这 5 个文件, 清理相关 import
3. 如果需要保留: 改写为 localStorage 模式, 参考 Team.tsx 的实现方式
**验证标准**:
- [ ] 删除后 `npx tsc --noEmit` 零错误
- [ ] `npm run build` 通过
- [ ] 不影响现有 9 个主路由功能

#### TASK-P0-3: 修复 CSS 语法 Warning
**文件**: `src/config/themes.ts`
**当前问题**: `--tw-ring-color: ${s.accent}` 在 CSS 中产生语法 warning
**需要做的事**:
1. 检查 themes.ts 中所有模板字符串的 CSS 变量赋值
2. 确保 CSS 变量值格式正确
**验证标准**:
- [ ] `npm run build` 输出中无 CSS syntax warning

#### TASK-P0-4: 清理 placeholder 注释
**文件**: `src/components/DailySummary.tsx` (第 34-37 行)
**当前问题**: 4 个 `/* placeholder: ... */` 注释遗留
**需要做的事**: 删除这 4 行注释
**验证标准**:
- [ ] `grep -r "placeholder:" src/components/DailySummary.tsx` 不返回开发性 placeholder

---

### 🟠 P1 — 短期优化 (产品完整性)

#### TASK-P1-1: i18n 全页面接入
**影响范围**: Dashboard / FocusMode / Habits / Statistics / Planner / VirtualPet / Team / Settings / Onboarding 等
**当前问题**: 只有 Sidebar.tsx 使用了 `useTranslation()`, 其余页面全部硬编码中文
**需要做的事**:
1. 逐页添加 `const { t } = useTranslation()` import
2. 将所有硬编码中文字符串替换为 `t('key')` 调用
3. 同步更新 `src/i18n/zh-CN.json` 和 `src/i18n/en-US.json`
4. 重点关注: greeting 函数 (Dashboard.tsx:34-39), MOTIVATIONAL_MSGS (FocusMode.tsx), ENCOURAGEMENTS (Habits.tsx), FILTER_LABELS/VIEW_LABELS (Planner.tsx)
**验证标准**:
- [ ] 在 Settings 中切换语言为英文后, 所有页面显示英文
- [ ] 切回中文后所有页面显示中文
- [ ] 没有混合语言的情况出现
- [ ] `npx tsc --noEmit` 零错误

#### TASK-P1-2: 拆分 Statistics.tsx
**文件**: `src/pages/Statistics.tsx` (961 行, gzip 119KB)
**当前问题**: 单文件过大, 影响代码可维护性和首屏加载
**需要做的事**:
1. 拆分为 3 个子组件: `OverviewTab.tsx`, `DeepWorkTab.tsx`, `AIInsightsTab.tsx`
2. Statistics.tsx 只保留 Tab 切换逻辑和公共状态
3. 每个子组件应独立处理自己的数据和渲染
**验证标准**:
- [ ] Statistics.tsx 主文件 < 200 行
- [ ] 3 个子组件各自 < 300 行
- [ ] Statistics 页面功能和外观不变
- [ ] 3 个 Tab 切换正常
- [ ] build 后 Statistics chunk 从 119KB 下降

#### TASK-P1-3: 接入 Skeleton 骨架屏和 EmptyState
**文件**: `src/components/ui/Skeleton.tsx` (已创建), 各页面
**当前问题**: Skeleton 组件已存在但未在任何页面使用
**需要做的事**:
1. 在 Dashboard / Timeline / Statistics / Planner 的数据加载阶段显示 Skeleton
2. 在 Timeline / Planner / Habits 的无数据状态显示 EmptyState
**验证标准**:
- [ ] 首次加载 Dashboard 时短暂显示骨架屏
- [ ] Planner 无任务时显示 EmptyState 引导
- [ ] Habits 无习惯时显示 EmptyState 引导

#### TASK-P1-4: 删除废弃页面
**文件**: `src/pages/Calendar.tsx`, `src/pages/AiSummary.tsx`, `src/pages/DeepWorkStats.tsx`, `src/pages/FlowBlocks.tsx`
**当前问题**: 这些是旧版页面, 功能已合并到其他页面, 仅做重定向或完全未使用
**需要做的事**:
1. 确认这些页面在 App.tsx 中无路由引用
2. 删除文件
3. 清理 import
**验证标准**:
- [ ] 删除后 build 通过
- [ ] 所有现有功能不受影响

#### TASK-P1-5: 生产代码清理
**涉及文件**: 多个
**需要做的事**:
1. 替换所有 `console.error()` / `console.log()` 为条件日志: `if (import.meta.env.DEV) console.error(...)`
2. 修复循环依赖: Login.tsx 等从 App.tsx 导入 Theme 类型 → 改为从 `config/themes.ts` 导入
3. 清理未使用的 import
**验证标准**:
- [ ] `grep -rn "console\." src/ --include="*.tsx" --include="*.ts"` 只返回条件日志
- [ ] 无循环 import 警告
- [ ] build 通过, 无 warning

#### TASK-P1-6: 响应式适配
**涉及文件**: 所有页面
**需要做的事**:
1. 在 768px / 1024px / 1440px 三个断点测试所有页面
2. 修复溢出、重叠、文字截断问题
3. 确保 Sidebar 在移动端可收缩/hamburger
**验证标准**:
- [ ] 所有页面在 768px 宽度下无水平滚动条
- [ ] 卡片不重叠, 文字可读
- [ ] 移动端 Sidebar 可折叠

---

### 🟡 P2 — 中期规划 (补齐产品差距)

> 这些任务是参考竞品分析后确定的功能差距, 对标 Rize / 滴答清单 / Monday.com

#### TASK-P2-1: 客户/项目分类维度
**描述**: 当前活动仅按 "类别" (开发/设计/会议等) 分类。Rize 支持 客户→项目→任务 三级分类。
**需要做的事**:
1. 数据模型: 在 Activity 类型中添加 `client?: string`, `project?: string` 字段
2. UI: Timeline 活动编辑弹窗增加 客户/项目 选择器
3. 设置: Settings 中添加 客户/项目 管理 (增删改)
4. 报告: Statistics 中按 客户/项目 维度统计时间
5. dataService.ts 中增加 客户/项目 CRUD
**验证标准**:
- [ ] 可在设置中创建客户和项目
- [ ] Timeline 编辑活动时可选择客户/项目
- [ ] Statistics 可按客户/项目筛选和查看时间分布
- [ ] 数据持久化到 localStorage

#### TASK-P2-2: 真实 AI 分类接入
**描述**: 当前 trackingService.ts 使用规则模拟 AI 分类。需接入真实 AI API。
**需要做的事**:
1. Web demo 模式: 保持现有规则模拟 (不需要 API)
2. 桌面模式: 通过后端 API 调用火山引擎/百度大模型
3. 后端 `backend/ai/classification.py`: 实现真实分类 prompt
4. 前端: 根据环境自动切换 (Tauri vs browser)
5. 添加 AI 置信度评分显示 (参考 Rize)
**验证标准**:
- [ ] Web demo 模式下规则分类正常工作 (不调用 API)
- [ ] 后端 API `/api/ai/classify` 接收活动数据, 返回分类+置信度
- [ ] 高置信度 (>90%) 自动标记, 低置信度标记为 "待确认"

#### TASK-P2-3: PDF/CSV 报告导出
**描述**: 当前只支持 JSON 导出。滴答清单和 Rize 都支持更多格式。
**需要做的事**:
1. 日报/周报 PDF 生成 (使用 html2pdf.js 或类似库)
2. CSV 导出 (时间数据、任务数据)
3. DailySummary 弹窗中添加 "导出 PDF" 按钮
4. Statistics 页面添加 "导出报告" 功能
**验证标准**:
- [ ] 点击导出 PDF 生成包含图表的美观报告
- [ ] CSV 导出包含所有活动数据, 可在 Excel 打开
- [ ] 导出文件名包含日期

#### TASK-P2-4: 计费时间追踪
**描述**: Rize 的核心付费功能, 自由职业者和机构的刚需。
**需要做的事**:
1. 数据模型: Activity 添加 `billable: boolean`, `hourlyRate?: number`
2. Settings: 添加默认计费费率设置, 按项目设置费率
3. Timeline: 活动可标记为 billable/non-billable
4. Dashboard: 添加 "今日计费时间" 和 "本周计费金额" 卡片
5. Statistics: 添加计费统计 Tab
**验证标准**:
- [ ] 可在设置中设定默认费率和项目费率
- [ ] 活动可标记 billable/non-billable
- [ ] Dashboard 显示计费时间和预估金额
- [ ] Statistics 有计费相关图表

---

### 🟢 P3 — 长期规划 (竞争力建设)

#### TASK-P3-1: 盈利性分析仪表盘
**描述**: 参考 Rize 的盈利性分析, 按客户/项目显示 ROI
**依赖**: TASK-P2-1 (客户/项目分类) + TASK-P2-4 (计费追踪)

#### TASK-P3-2: 第三方集成 (飞书/钉钉/企业微信)
**描述**: 国内生态集成, 比国际工具 (ClickUp/Linear) 更优先
**需要做的事**:
1. 飞书日历同步 (自动识别会议)
2. 钉钉任务同步
3. 企业微信通知推送

#### TASK-P3-3: 自定义仪表盘
**描述**: Rize 2026年3月刚推出, 可拖拽 Widget 组合看板
**需要做的事**: 基于 react-grid-layout 实现拖拽 Dashboard

#### TASK-P3-4: 开放 API & Webhooks
**描述**: 参考 Rize 的 GraphQL API, 为开发者提供扩展能力
**需要做的事**: REST API 文档 + Webhook 注册系统

#### TASK-P3-5: 活动粒度滑块
**描述**: Rize 风格连续滑块控制活动分组粒度, 替代当前的离散模式切换
**文件**: `src/pages/Timeline.tsx`

#### TASK-P3-6: 发票/账单生成
**描述**: 基于计费时间自动生成发票 PDF, 参考 Rize 即将推出的功能
**依赖**: TASK-P2-4 (计费追踪)

---

## 竞品定位矩阵 / Competitive Positioning

| 功能 | TickTick | Things 3 | Trello | Notion | Forest | Monday | Rize | **Merize** |
|------|----------|----------|--------|--------|--------|--------|------|-----------|
| 自动时间追踪 | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️手动 | ✅ | ✅ |
| 任务管理 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| 习惯追踪 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 游戏化/宠物 | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| 专注计时器 | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| 团队功能 | ⚠️ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| 中文优先 | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | **✅** |
| 价格 | $3/月 | $80一次 | $5-10/人 | $10-20/人 | $4一次 | $9-19/人 | $10-20/月 | **¥29/月** |

**Merize 的独有优势**: 没有任何单一竞品同时具备 自动追踪 + 任务管理 + 习惯 + 游戏化 + 团队 + 中文。

---

## 文档清单 / Documentation Index

| 文件 | 描述 | 状态 |
|------|------|------|
| `README.md` | 项目总览、安装、配置 | ✅ 保留 |
| `DESIGN.md` | 设计令牌、颜色、排版规范 | ✅ 保留 |
| `FEATURES.md` | 功能清单和完成状态 | ✅ 保留 |
| `docs/WORK_TRACKER.md` | 任务跟踪 (本文件) | ✅ 保留 |
| `docs/PRODUCT_DESIGN.md` | 产品设计文档 | ✅ 保留 |
| `docs/VISUAL_DESIGN_RESEARCH.md` | 竞品视觉研究 | ✅ 保留 |
| `docs/AUDIT_REPORT_2026-04-09.html` | 深度审计报告 (含竞品分析) | ✅ 新增 |
| `docs/legacy/` | 已删除 — 旧 BetterMe 文档, 不再适用 | 🗑️ 已清理 |

---

## 商业模式注意事项 / Business Model Notes

- ⚠️ **用户不能使用自己的 API key** — 所有 AI 功能必须走 Merize 管理的后端
- 后端 AI 调用使用火山引擎模型 (配置在 `backend/` 目录)
- Web demo 模式: 客户端模拟 AI 功能 (不需要真实 API)
- 桌面版: 通过 Merize 后端 API 调用 AI
- 定价: ¥29/月 或 ¥199/年

---

## 提交规范 / Commit Convention

```
feat: 新功能描述
fix: 修复问题描述
refactor: 重构描述
docs: 文档更新
style: 样式/UI调整
chore: 依赖/配置/清理
```

每完成一个 TASK, commit 并 push:
```bash
git add .
git commit -m "feat: TASK-XX description"
git push origin main
```

## 质量标准 / Quality Gates (每次提交前必须通过)

```bash
# 1. TypeScript 零错误
npx tsc --noEmit

# 2. Build 通过
npm run build

# 3. 无 placeholder/TODO 遗留
grep -rn "placeholder\|TODO\|FIXME\|HACK" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v "placeholder=" | grep -v "placeholder:" | grep -v "placeholder}" | grep -v "input placeholder"

# 4. 无硬编码中文新增 (i18n 完成后)
# grep -rn "[\u4e00-\u9fff]" src/pages/ --include="*.tsx" | grep -v "import" | grep -v "//"
```
