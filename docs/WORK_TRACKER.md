# Merize 开发任务跟踪 / Development Work Tracker

> **Branch**: `redesign/v2`
> **Last Updated**: 2026-04-09
> **Purpose**: 让任何 AI 或开发者可以接手继续工作 / Enable any AI or developer to continue work

---

## 项目概述 / Project Context

Merize 是一个集 Rize.io（自动时间追踪）、滴答清单（任务管理）、Forest（专注）、多邻国（互动激励）、Monday（项目管理）优势于一体的中文 AI 效率工具。

**技术栈**: React 18 + TypeScript + Tailwind CSS + Zustand + Tauri 2 (desktop) + localStorage (web demo)
**仓库**: https://github.com/auclaw/merize.git
**分支**: redesign/v2

---

## 如何开始工作 / How to Start Working

```bash
# 1. Clone and checkout
git clone https://github.com/auclaw/merize.git
cd merize
git checkout redesign/v2

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
├── store/useAppStore.ts       # Zustand 全局状态管理
├── services/dataService.ts    # localStorage 数据层 + demo 数据生成
├── components/
│   ├── Sidebar.tsx            # 侧边栏导航
│   ├── Onboarding.tsx         # 7步新手引导向导
│   ├── OnboardingTour.tsx     # (旧版，可能需要删除)
│   ├── ThemeSelector.tsx      # (已被 Onboarding 替代)
│   └── ui/                    # 通用 UI 组件 (Button, Modal, Card, Toast, etc.)
├── pages/
│   ├── Dashboard.tsx          # 仪表盘
│   ├── Timeline.tsx           # [NEW] Rize 风格实时时间线
│   ├── Planner.tsx            # 计划/任务管理 (4种视图: 列表/看板/日历/时间线)
│   ├── FocusMode.tsx          # 专注模式 + 心流屏蔽 (已合并)
│   ├── Habits.tsx             # 习惯追踪 (支持多次打卡)
│   ├── Statistics.tsx         # 统计 (3个tab: 概览/深度工作/AI洞察，已合并)
│   ├── VirtualPet.tsx         # 虚拟宠物 (CSS 像素风)
│   ├── Settings.tsx           # 设置
│   ├── Calendar.tsx           # (旧版，已合并到 Planner 日历视图)
│   ├── AiSummary.tsx          # (旧版，已合并到 Statistics AI tab)
│   ├── DeepWorkStats.tsx      # (旧版，已合并到 Statistics 深度工作 tab)
│   ├── FlowBlocks.tsx         # (旧版，已合并到 FocusMode 专注屏蔽 tab)
│   └── Login.tsx, OrgAdmin.tsx, TeamDashboard.tsx, etc.  # 团队/登录相关
```

### 设计原则 / Design Principles

- **暖色设计系统**: 使用 CSS 变量 `var(--color-*)`, 暖色调阴影 `rgba(44,24,16,x)`, 渐变卡片
- **主题**: 5种颜色主题 (活力橙/海洋蓝/森林绿/优雅紫/樱花粉) + 明暗模式
- **所有颜色通过 CSS 变量**: 不要硬编码 `isDark ? 'text-gray-X' : 'text-gray-Y'`
- **交互完整性**: 每个按钮必须有真实响应，不允许空壳

---

## 已完成的工作 / Completed Work

### ✅ Session 1 (PR #1)
- [x] 架构重构: Zustand 状态管理 + localStorage 数据服务
- [x] Web demo 模式: 无需登录，14天真实 demo 数据
- [x] 所有 11 个页面重写，功能完整
- [x] 可复用组件库 (Button, Modal, Card, Toast, Input, Badge, Progress, EmptyState)
- [x] 首次启动主题选择器
- [x] 暖色设计系统 (基于竞品研究)
- [x] 所有 11 个页面视觉升级

### ✅ Session 2 (当前)
- [x] 导航重构: 8项新导航 (Dashboard/Timeline/Planner/Focus/Habits/Statistics/Pet/Settings)
- [x] 新建 Timeline 页面: Rize 风格实时活动时间线 (~340行, 完整功能)
- [x] Statistics 合并: 3个 tab (概览/深度工作/AI洞察) 合并为一页
- [x] Planner 升级: 4种视图 (列表/看板/日历/时间线)
- [x] FocusMode + FlowBlocks 合并: 专注计时器 + 专注屏蔽在同一页
- [x] Habits 升级: 多次打卡(targetCount)、提醒、多邻国风格鼓励
- [x] VirtualPet 重写: CSS 像素风猫咪、可取名、对话气泡、5种动画
- [x] Onboarding 7步向导: 宠物选择→目标设定→主题→模块→隐私级别
- [x] 产品设计文档: docs/PRODUCT_DESIGN.md (1000+ 行)
- [x] dataService 更新: 习惯支持 targetCount/reminders/category
- [x] TypeScript 零错误

---

## 待完成任务 / Remaining Tasks

### 🔴 P0 — 核心功能 (Core Features)

#### TASK-01: AI 自动追踪核心系统
**状态**: 未开始
**文件**: `src/services/trackingService.ts` (新建), `src/pages/Timeline.tsx` (增强)
**描述**:
这是产品最重要的功能。在 web demo 模式中，需要模拟 AI 自动追踪:
1. 创建 `trackingService.ts`:
   - 模拟后台追踪: 每30秒生成一条新活动 (随机或基于时间段的合理活动)
   - 活动分类: 基于规则的自动分类 (如 9-12点更可能是"工作"，晚上更可能是"娱乐")
   - 用户可修改分类，系统"学习"偏好 (存 localStorage)
2. Timeline 页面增强:
   - 显示"正在追踪"实时指示器（带动画脉冲点）
   - 活动自动出现在时间线上
   - 点击活动可修改分类/名称
   - 支持合并/拆分活动
   - 批量操作 (Rize 的 batch actions)
3. 隐私级别切换:
   - 基础: 只显示应用名
   - 标准: 显示应用名+窗口标题
   - 详细: 显示应用名+标题+URL+内容摘要
4. 追踪规则管理 (在 Settings 中):
   - 用户可定义: "Chrome + YouTube = 娱乐" 之类的规则
   - AI 置信度阈值设置

**参考**: Rize 的 tracking rules, auto-tagging, batch actions, activity clustering

#### TASK-02: 计划 vs 实际时间对比
**状态**: 未开始
**文件**: `src/pages/Dashboard.tsx` (增强), `src/pages/Timeline.tsx` (增强)
**描述**:
在 Dashboard 和 Timeline 中显示"计划做什么 vs 实际做了什么"的对比:
1. Dashboard 增加"今日计划 vs 实际"对比卡片:
   - 左侧: 计划的时间块 (来自 Planner)
   - 右侧: 实际活动 (来自 tracking)
   - 差异高亮 (计划了1小时写代码但实际只做了30分钟)
2. Timeline 中显示计划标记:
   - 在时间线旁边显示灰色的"计划"条
   - 与实际活动条并排对比
3. AI 优化建议:
   - 分析偏差模式 (如"你经常在下午2-3点偏离计划")
   - 给出建议 (如"建议把创造性工作安排在上午")

#### TASK-03: 当日总结弹窗
**状态**: 未开始
**文件**: `src/components/DailySummary.tsx` (新建)
**描述**:
每天结束时（或用户点击"生成总结"按钮时）显示当日总结弹窗:
1. 总工作时间 + 专注时间 + 休息时间
2. 完成的任务列表
3. 习惯完成进度
4. 时间分布饼图 (按类别)
5. 宠物状态变化
6. AI 生成的一句话总结 ("今天效率不错！深度工作占比60%，比昨天提高了5%")
7. 明日建议
8. 分享/导出按钮

### 🟡 P1 — 重要优化 (Important Enhancements)

#### TASK-04: 多邻国式互动对话系统
**状态**: 部分完成 (宠物页面已有基础对话)
**文件**: `src/components/PetDialogue.tsx` (新建), 多个页面
**描述**:
在产品各处增加宠物对话互动:
1. 创建统一的 PetDialogue 组件:
   - 小宠物头像 + 对话气泡
   - 气泡出现/消失动画
   - 可关闭
2. 触发时机:
   - 完成习惯打卡: "太棒了！🎉"
   - 专注结束: "辛苦了！休息一下吧～"
   - 连续登录: "又见面啦！今天也要加油哦！"
   - 长时间未操作: "你去哪了？我好想你..."
   - 偏离计划: "计划有变？没关系，调整一下继续！"
   - 完成日目标: "今天的目标完成啦！🎊 你真厉害！"
   - 习惯断链: "昨天忘了打卡...没关系，今天重新开始！💪"
3. 语气: 甜宠为主，偶尔轻微guilt-trip但不过分

#### TASK-05: 宠物迷你挂件全局显示
**状态**: 组件已导出 (PetMiniWidget)，未集成
**文件**: `src/App.tsx`, `src/pages/VirtualPet.tsx`
**描述**:
将 PetMiniWidget 在非宠物页面的右下角显示:
1. 小尺寸像素宠物 + 名字 + 等级
2. 偶尔弹出对话气泡
3. 点击跳转到宠物页面
4. 可在设置中关闭
5. 在专注模式中隐藏

#### TASK-06: Settings 页面完善
**状态**: 部分完成
**文件**: `src/pages/Settings.tsx`
**描述**:
Settings 需要增加以下设置项:
1. **隐私级别设置**: 3个级别 (基础/标准/详细)，带说明
2. **追踪规则管理**: 定义 app/website → category 映射规则
3. **AI 分类置信度**: 滑块调整自动分类的灵敏度
4. **通知设置**: 习惯提醒、休息提醒、专注提醒的开关和时间
5. **数据导出**: 保持现有 JSON/CSV，增加 PDF 日报/周报导出
6. **关于页面**: 版本信息、使用说明链接
7. **语言切换**: 中文/English (i18n 基础架构)

#### TASK-07: Dashboard 增强
**状态**: 需要增强
**文件**: `src/pages/Dashboard.tsx`
**描述**:
Dashboard 作为首页需要更丰富的信息:
1. "正在追踪" 实时显示 (当前活动 + 持续时间)
2. 计划 vs 实际对比卡片 (见 TASK-02)
3. 专注分数 (类似 Rize 的 Focus Quality Score)
4. 宠物状态迷你卡
5. 今日习惯快速打卡
6. 快捷操作: 开始专注、添加任务
7. "生成今日总结" 按钮 (触发 TASK-03)

### 🟢 P2 — 锦上添花 (Polish)

#### TASK-08: Rize 深度功能对齐
**状态**: 未开始
**文件**: 多个
**描述**:
基于 Rize 研究，补充以下功能:
1. **会议检测**: 与日历集成，自动识别会议时间 (web demo 中模拟)
2. **休息提醒**: 长时间专注后自动提醒休息
3. **专注音乐**: 白噪音/雨声/咖啡厅 选项 (web demo 用标签代替)
4. **上下文切换统计**: 统计每天切换了多少次应用
5. **工作时间设置**: 定义工作时间 (如 9:00-18:00)，非工作时间活动默认标记为"个人"
6. **桌面小组件**: Tauri 系统托盘集成 (仅桌面版)
7. **时间条目分组控制**: 类似 Rize 的滑块控制活动粒度

#### TASK-09: 团队/商业功能
**状态**: 基础页面存在但需增强
**文件**: `src/pages/TeamDashboard.tsx`, `src/pages/OrgAdmin.tsx`, `src/pages/WeeklyApproval.tsx`
**描述**:
1. 团队仪表盘: 团队成员效率总览
2. 管理员面板: 添加成员、设置权限、查看报告
3. 周报审批: 员工提交周报，管理者审批
4. 团队宠物: 全团队养一个大宠物 (游戏化)
5. 利润分析: 客户/项目的时间成本计算 (模拟数据)
6. 员工隐私: 员工审核后再向管理者显示数据

#### TASK-10: i18n 国际化基础
**状态**: 未开始
**文件**: `src/i18n/` (新建目录)
**描述**:
1. 安装 react-i18next
2. 创建 zh-CN.json 和 en-US.json 语言包
3. 提取所有硬编码中文字符串到语言包
4. Settings 中增加语言切换
5. 优先做核心页面 (Dashboard, Timeline, Settings)

#### TASK-11: 视觉细节打磨
**状态**: 持续优化
**文件**: 全局
**描述**:
1. 所有页面确保 100% 使用 CSS 变量颜色 (搜索并替换 isDark 三元表达式)
2. 空状态插图 (不是空白页面)
3. 骨架屏加载 (不是转圈)
4. 页面切换过渡动画
5. 微交互: 按钮 hover 上浮、卡片 hover 阴影加深
6. 响应式适配 (不同屏幕尺寸)

#### TASK-12: 全面功能测试与修复
**状态**: 每完成一个任务都需要做
**文件**: 全局
**描述**:
1. `npx tsc --noEmit` 零错误
2. `npm run build` 成功
3. 每个页面手动测试:
   - Dashboard: 数据显示正确，所有卡片可点击
   - Timeline: 活动显示，可修改分类，实时指示器
   - Planner: 4种视图都能切换，CRUD 操作正常
   - FocusMode: 计时器工作，专注屏蔽列表可操作
   - Habits: 多次打卡正常，鼓励消息显示
   - Statistics: 3个tab数据正确，导出功能正常
   - VirtualPet: 像素宠物显示，动画正常，对话气泡
   - Settings: 所有设置项可保存
4. Onboarding 流程完整走通
5. 主题切换全局生效

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
- 活动聚类: 从 K-Means 升级到 activity-change detection
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
git push origin redesign/v2
```
