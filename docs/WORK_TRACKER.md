# Merize 开发任务跟踪 / Development Work Tracker

> **Branch**: `main` (已从 redesign/v2 合并)
> **Last Updated**: 2026-04-09
> **Purpose**: 让任何 AI 或开发者可以接手继续工作 / Enable any AI or developer to continue work

---

## 项目概述 / Project Context

Merize 是一个集 Rize.io（自动时间追踪）、滴答清单（任务管理）、Forest（专注）、多邻国（互动激励）、Monday（项目管理）优势于一体的中文 AI 效率工具。

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
│   ├── FocusMode.tsx          # 专注模式 + 心流屏蔽 (已合并)
│   ├── Habits.tsx             # 习惯追踪 (支持多次打卡, 提醒, 多邻国式鼓励)
│   ├── Statistics.tsx         # 统计 (3个tab: 概览/深度工作/AI洞察, 已合并)
│   ├── VirtualPet.tsx         # 虚拟宠物 (CSS 像素风, 可取名, 成长系统)
│   ├── Settings.tsx           # 设置 (隐私级别/追踪规则/主题/模块/通知/语言)
│   ├── Team.tsx               # 团队模块 (4个子标签: 仪表盘/专注/周报/管理)
│   ├── Calendar.tsx           # (旧版，已合并到 Planner 日历视图)
│   ├── AiSummary.tsx          # (旧版，已合并到 Statistics AI tab)
│   ├── DeepWorkStats.tsx      # (旧版，已合并到 Statistics 深度工作 tab)
│   ├── FlowBlocks.tsx         # (旧版，已合并到 FocusMode 专注屏蔽 tab)
│   └── TeamDashboard.tsx, TeamFocus.tsx, WeeklyApproval.tsx, OrgAdmin.tsx  # 团队相关 (仅骨架)
```

### 设计原则 / Design Principles

- **暖色设计系统**: 使用 CSS 变量 `var(--color-*)`, 暖色调阴影 `rgba(44,24,16,x)`, 渐变卡片
- **主题**: 5种颜色主题 (活力橙/海洋蓝/森林绿/优雅紫/樱花粉) + 3种背景皮肤 (gradient/solid/glass)
- **所有颜色通过 CSS 变量**: 不要硬编码 `isDark ? 'text-gray-X' : 'text-gray-Y'`
- **交互完整性**: 每个按钮必须有真实响应，不允许空壳

---

## 已完成的工作 / Completed Work

### ✅ 架构与基础设施
- [x] Zustand 全局状态管理 (useAppStore.ts, 480行, 完整持久化)
- [x] localStorage 数据服务 (dataService.ts, 736行, 完整 CRUD + 14天 demo 数据)
- [x] Web demo 模式: 无需登录，自动检测环境 (Tauri vs 浏览器)
- [x] 可复用 UI 组件库: Button, Modal, Card, Toast, Input, Badge, Progress, EmptyState (8个组件)
- [x] 5 个颜色主题 + 3 种背景皮肤
- [x] 暖色设计系统 (CSS 变量驱动, warm-tinted shadows, gradient cards)
- [x] TypeScript 零错误, build 通过
- [x] 依赖安全漏洞修复: vite→6.x, lodash→4.17.24+, picomatch→2.3.2+ (npm 全部 0 漏洞)

### ✅ TASK-01: AI 自动追踪核心系统 — 已完成 ✅
- [x] trackingService.ts (692行): 25+ 模拟应用, 30秒生成活动, 基于规则的自动分类
- [x] 分类管道: 用户覆盖 → 规则匹配 → 时段推断 → 默认
- [x] 3级隐私: 基础(应用名) / 标准(+标题) / 详细(+URL+摘要)
- [x] 10条默认追踪规则 + 用户自定义规则
- [x] 用户覆盖学习 (分类修改自动记录)
- [x] 连续同类活动合并 (<2分钟间隔)
- [x] 批量分类和删除
- [x] 全部通过 localStorage 持久化

### ✅ TASK-02: 计划 vs 实际时间对比 — 已完成 ✅
- [x] Dashboard 中显示计划 vs 实际对比 (估计 vs 实际分钟数)
- [x] DailySummary 弹窗中有详细对比 (进度环 + 百分比)
- [x] 专注质量分 (Focus Quality Score) 基于计划完成率

### ✅ TASK-03: 当日总结弹窗 — 已完成 ✅
- [x] DailySummary.tsx (620行): Rize 风格每日总结弹窗
- [x] CSS conic-gradient 环形图 (类别分布)
- [x] SVG 进度环 (目标完成率)
- [x] 工作/专注/休息时间指标卡
- [x] AI 生成一句话总结 (规则模拟)
- [x] 明日建议
- [x] 导出 JSON / 复制分享
- [x] 宠物状态显示

### ✅ TASK-04: 多邻国式互动对话系统 — 已完成 ✅
- [x] PetDialogue.tsx (290行): 统一对话组件
- [x] 6种触发场景: 习惯完成/专注结束/登录连续/计划偏离/目标完成/习惯断链
- [x] 情绪 emoji 映射
- [x] 气泡动画 + 自动消失
- [x] usePetDialogue hook API

### ✅ TASK-05: 宠物迷你挂件全局显示 — 已完成 ✅
- [x] PetMiniWidget.tsx (354行): 右下角浮动挂件
- [x] 30-60秒随机对话气泡
- [x] 等级徽章 + 宠物 emoji
- [x] 点击跳转宠物页面
- [x] 专注模式自动隐藏
- [x] 已集成到 App.tsx (宠物页面自动隐藏)

### ✅ TASK-06: Settings 页面完善 — 已完成 ✅
- [x] 隐私级别设置 (基础/标准/详细) + 说明
- [x] 追踪规则管理 (app/website → category 映射)
- [x] 用户覆盖管理
- [x] 模块可见性开关
- [x] 专注设置 (工作/休息/长休息时长)
- [x] 每日目标设定
- [x] 主题和背景皮肤选择
- [x] 重置选项

### ✅ TASK-07: Dashboard 增强 — 已完成 ✅
- [x] "正在追踪" 实时 banner (当前活动 + 持续时间)
- [x] 专注质量分 (Focus Quality Score SVG 环 + 光晕)
- [x] 快捷操作 (开始专注, 添加任务)
- [x] "生成今日总结" 按钮
- [x] 每日时间线可视化 (按类别颜色编码)
- [x] 活动编辑弹窗 (类别选择器下拉)

### ✅ TASK-08: Rize 深度功能对齐 — 部分完成 ⚠️
- [x] 会议回顾 (Session 回顾)
- [x] 活动分类修正 (点击编辑 + 下拉选择)
- [x] AI 效率教练建议 (规则模拟)
- [x] 工作时间设置 (Timeline 显示工作时间指示)
- [ ] 上下文切换统计 — 未实现
- [ ] 活动粒度滑块 (Rize 风格) — Timeline 有粒度模式但非滑块
- [ ] 休息提醒 (专注模式中无自动提醒) — 未实现

### ✅ TASK-11: 视觉细节打磨 — 部分完成 ⚠️
- [x] 暖色调阴影全局应用
- [x] 渐变卡片背景
- [x] 渐变 metric 文字
- [x] 交错淡入动画
- [ ] 100% CSS 变量覆盖 (仍有部分 Tailwind 硬编码颜色) — 未完成
- [ ] 空状态插图 — 未实现
- [ ] 骨架屏加载 — 未实现
- [ ] 页面切换过渡动画 — 未实现
- [ ] 响应式适配 — 未充分测试

### ✅ 页面结构与导航
- [x] 导航重构: 8项 (Dashboard/Timeline/Planner/Focus/Habits/Statistics/Pet/Settings)
- [x] Statistics 合并 AI 总结 + 深度工作 (3个 tab)
- [x] FocusMode 合并心流屏蔽
- [x] Planner 4种视图 (列表/看板/日历/时间线)
- [x] 新建 Timeline 页面 (Rize 风格)
- [x] Habits 多次打卡 + 提醒 + 鼓励
- [x] VirtualPet CSS 像素风 + 可取名 + 成长系统
- [x] Onboarding 7步向导

### ✅ 文档
- [x] docs/PRODUCT_DESIGN.md — 完整产品设计文档
- [x] docs/VISUAL_DESIGN_RESEARCH.md — 视觉设计研究 (竞品分析)
- [x] docs/WORK_TRACKER.md — 任务跟踪文档 (本文件)

---

## 待完成任务 / Remaining Tasks

### 🔴 P0 — 必须完成

#### TASK-08b: Rize 深度功能 (剩余项)
**状态**: ✅ 已完成 (2026-04-09)
**文件**: `src/pages/Statistics.tsx`, `src/pages/FocusMode.tsx`, `src/pages/Timeline.tsx`
**描述**:
1. ✅ **上下文切换统计**: 统计每天切换了多少次应用，在 Statistics 页面展示
2. ✅ **活动粒度滑块**: Timeline 页面添加 Rize 风格的滑块控制活动分组细粒度
3. ✅ **休息提醒**: FocusMode 中长时间专注后自动弹出休息提醒 (含两级提醒 + 宠物消息)

#### TASK-09: 团队/商业功能
**状态**: ✅ 已完成 (2026-04-09)
**文件**: `src/pages/Team.tsx` (统一重写，替代原4个骨架文件)
**描述**:
1. ✅ 统一 Team.tsx 页面，4个子标签：仪表盘/同步专注/周报/管理
2. ✅ 团队仪表盘: 6个模拟成员、关键统计卡片、效率排行榜
3. ✅ 管理员面板: 成员增删、权限管理、团队设置
4. ✅ 周报审批: 提交表单、历史记录、管理员审批操作
5. ✅ 团队宠物: 团队宠物进度条
6. ✅ 接入路由 /team，侧边栏新增"团队"导航
7. ✅ 全部使用 localStorage 模拟数据，CSS 变量驱动样式

#### TASK-10: i18n 国际化基础
**状态**: ✅ 已完成 (2026-04-09)
**文件**: `src/i18n/index.ts`, `src/i18n/zh-CN.json`, `src/i18n/en-US.json`
**描述**:
1. ✅ 安装 react-i18next + i18next
2. ✅ 创建 zh-CN.json 和 en-US.json 完整语言包 (覆盖所有页面)
3. ✅ Sidebar 导航标签已接入 useTranslation
4. ✅ Settings 新增语言切换区 (中文/英文一键切换)
5. ✅ 语言偏好持久化到 localStorage，支持浏览器语言自动检测
**后续**: 逐页将硬编码中文替换为 t() 调用 (语言包已准备好)

#### TASK-12: 全面功能测试与修复
**状态**: ✅ 已完成 (2026-04-09)
**描述**:
1. ✅ `npx tsc --noEmit` 零错误
2. ✅ `npm run build` 成功
3. ✅ 9个主路由全部可交互 (新增 Team 路由)
4. ✅ Onboarding 流程完整
5. ✅ 主题切换全局生效
6. ✅ PetMiniWidget 正常显示和隐藏

### 🟡 P1 — 重要优化

#### TASK-11b: 视觉细节打磨 (剩余项)
**状态**: ✅ 已完成 (2026-04-09)
**描述**:
1. ✅ 全局扫描并替换 `isDark ?` 硬编码颜色 → CSS 变量 (StatsCard, Timeline, TimeBlockPlanner, Login, PrivacySettings)
2. ✅ 骨架屏组件 (Skeleton/SkeletonCard/SkeletonList) 已创建并导出
3. ✅ 页面切换过渡动画 (pageFadeIn CSS keyframes, location.pathname key 触发)
4. EmptyState 组件已有，需逐页接入 (部分已接入)
5. 响应式适配 — 需更多测试

#### TASK-13: 宠物商店系统
**状态**: ✅ 已完成 (2026-04-09)
**文件**: `src/components/PetShop.tsx`
**描述**:
1. ✅ 宠物商店弹窗，三个标签：食物/装饰品/新宠物
2. ✅ 食物：5种食物 (5-50 金币)，不同效果
3. ✅ 装饰品：6种 (15-50 金币)，购买/装备/卸下，localStorage 持久化
4. ✅ 新宠物：5种 (猫/鸟/鸭/兔/熊猫)，解锁/切换，localStorage 持久化
5. ✅ Pet 接口扩展 (type: string, decoration: string)
6. ✅ Store 新增 setPetType/setPetDecoration/updatePetStats
7. ✅ VirtualPet 页面集成商店按钮 + 装饰品显示

#### 新增: 全局专注状态指示器 + 弹窗系统
**状态**: ✅ 已完成 (2026-04-09)
**文件**: `src/components/FocusStatusIndicator.tsx`, `src/components/FocusStartedModal.tsx`, `src/components/FocusCompletedModal.tsx`, `src/components/DailyGoalAchievedModal.tsx`, `src/components/ConfirmDialog.tsx`
**描述**:
1. ✅ 右上角 FocusStatusIndicator：专注/休息时显示实时计时，点击跳转专注页
2. ✅ FocusStartedModal：Rize 风格专注开始弹窗 (目标输入 + 标签)
3. ✅ FocusCompletedModal：专注完成庆祝弹窗 (时长/XP/金币)
4. ✅ DailyGoalAchievedModal：每日目标达成弹窗
5. ✅ ConfirmDialog：通用确认对话框 (danger/warning/info)
### 🟢 P2 — 锦上添花

#### TASK-14: Rust glib 安全漏洞
**状态**: 无法单独修复 — glib 0.18.5 是 Tauri 2 通过 GTK 的间接依赖
**影响**: 仅 Linux 桌面编译环境，web demo 不受影响
**描述**: 需要等 Tauri 上游升级 GTK 绑定到 glib >= 0.20.0。
**临时方案**: 关注 Tauri 仓库的依赖更新 (https://github.com/tauri-apps/tauri)

---

## 参考资源 / Reference Resources

### Rize.io 研究
- **官网**: https://rize.io
- **文档**: https://docs.rize.io
- **Changelog**: https://rize.io/changelog/batch-actions-time-entry-grouping
- **YouTube**: https://www.youtube.com/@RizeIO
- **Loom 教学**: https://www.loom.com/share/3588d39c5062481d90e68514b392492a
- **GraphQL API**: https://docs.rize.io/category/rize-graphql-api
- **截图文件夹**: `merize uiux 截图/rize screenshots/` (92张产品截图)

### Rize 核心功能摘要 (供参考)
- 后台自动追踪窗口元数据 (app名, 窗口标题, URL)
- AI 自动分类活动到 client/project/task
- 时间条目建议 + 审批工作流
- 专注检测 + 智能干扰拦截
- Focus Quality Score (20+ 行为属性综合评分)
- AI Productivity Coach (个性化建议)
- 实时盈利性仪表盘
- 员工审核后再共享数据 (隐私保护)
- 活动聚类: activity-change detection
- 批量操作: 多选 + 批量标记/删除/重建时间条目
- 时间粒度滑块: 控制活动分组的细粒度

### 多邻国参考
- 宠物/吉祥物全程陪伴
- 鼓励性对话 (甜宠为主，偶尔guilt-trip)
- 连续打卡奖励
- 失去streak时的情感化提醒

### 设计文档
- `docs/PRODUCT_DESIGN.md` — 完整产品设计文档
- `docs/VISUAL_DESIGN_RESEARCH.md` — 视觉设计研究 (竞品分析)
- `docs/PET_SYSTEM_DESIGN.md` — 宠物系统详细设计

---

## 商业模式注意事项 / Business Model Notes

- ⚠️ **用户不能使用自己的 API key** — 所有 AI 功能必须走 Merize 管理的后端
- 后端 AI 调用使用火山引擎模型 (配置在 `backend/` 目录)
- Web demo 模式: 客户端模拟 AI 功能 (不需要真实 API)
- 桌面版: 通过 Merize 后端 API 调用 AI

---

## 提交规范 / Commit Convention

```
feat: 新功能描述
fix: 修复问题描述
refactor: 重构描述
docs: 文档更新
style: 样式/UI调整
```

每完成一个 TASK，commit 并 push:
```bash
git add .
git commit -m "feat: TASK-XX description"
git push origin main
```
