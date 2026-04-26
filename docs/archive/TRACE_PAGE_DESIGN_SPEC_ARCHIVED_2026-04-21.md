# Trace AI — Page-by-Page UI/UX Design Specification v1.1

> **Document Purpose**: This document is the pixel-perfect UI/UX design specification for every page of Trace. Any developer (including AI Agents) should be able to accurately recreate every page's layout, spacing, colors, typography, and interaction states after reading this document. This document is based on the Dual Layer Macaron Design System and Product Blueprint v3.0.
>
> **Last Updated**: 2026-04-21
>
> **Design System Version**: Dual Layer Macaron v3
>
> **Reference Documents**: `docs/DESIGN_SYSTEM.md`, `docs/EXECUTION_GUARDIAN_BLUEPRINT.md`

---

## ⚠️ Key Design Decision Updates (v1.1)

### Color System Update
| Original | Updated | Reason |
|----------|---------|--------|
| Coral Pink Primary | **Macaron Blue `#79BEEB` Primary** | Blue is more neutral for productivity focus |
| Logo: Coral | **Logo: Blue gradient** | Matches primary brand color |

### Layout Optimization (13-inch MacBook First)
| Original | Updated | Reason |
|----------|---------|--------|
| Sidebar: 256px | **Sidebar: 248px** | Smaller bezel for 13-inch screens |
| Top padding: 96px | **Top padding: 64px** | Better vertical space utilization on laptops |
| Responsive base: 1280px | **Fluid from 1024px to 1920px** | Support both 13-inch and 27-inch displays |

### Focus Mode Redesign
| Original | Updated | Reason |
|----------|---------|--------|
| Full-screen overlay | **Sidebar embedded card + modal** | Less disruptive, always accessible state |
| Separate page level | **Tool-level feature** | Focus mode is an action, not a content page |

### NowEngine Status
- **✅ NowEngine is the core centerpiece of Dashboard** — AI recommendation widget that tells users what to focus on now
- Blue semantic border, hover lift effect, "Now →" JetBrains Mono label

---

## 目录

1. [全局布局与框架 Global Layout](#1-全局布局与框架-global-layout)
2. [侧边栏 Sidebar](#2-侧边栏-sidebar)
3. [Page 1: Dashboard 仪表盘](#3-page-1-dashboard-仪表盘)
4. [Page 2: Timeline 时间线](#4-page-2-timeline-时间线)
5. [Page 3: Task 任务管理](#5-page-3-task-任务管理)
6. [Page 4: Analytics 数据分析](#6-page-4-analytics-数据分析)
7. [Page 5: Settings 设置](#7-page-5-settings-设置)
8. [Global Overlay: Focus Mode 专注模式](#8-global-overlay-focus-mode-专注模式)
9. [Global Overlay: Review 日终复盘](#9-global-overlay-review-日终复盘)
10. [Global Component: StatusBar 系统托盘](#10-global-component-statusbar-系统托盘)
11. [通用交互状态 Interaction States](#11-通用交互状态-interaction-states)
12. [响应式行为 Responsive Behavior](#12-响应式行为-responsive-behavior)

---

<!-- SECTION 1 -->
## 1. 全局布局与框架 Global Layout

### 1.1 应用窗口 App Window

| 属性 | 值 | CSS Token |
|------|-----|-----------|
| 总宽度 | `1280px` | — |
| 最小宽度 | `1024px` | — |
| 背景色 | `#FDFBF7` | `--color-bg-base` |
| 字体渲染 | `-webkit-font-smoothing: antialiased` | — |

### 1.2 主布局结构 Master Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ App Window: 1280px                                                   │
│ ┌────────────┬───────────────────────────────────────────────────┐   │
│ │            │                                                   │   │
│ │  Sidebar   │              Main Content Area                    │   │
│ │  248px     │              1024px+ (fluid)                    │   │
│ │            │   ┌───────────────────────────────────────────┐   │   │
│ │  bg:       │   │  padding-top: 64px                         │   │   │
│ │  #FFFFFF   │   │  padding-left: 32px                       │   │   │
│ │            │   │  padding-right: 32px                      │   │   │
│ │  border-   │   │  padding-bottom: 32px                     │   │   │
│ │  right:    │   │                                           │   │   │
│ │  2px solid │   │  max-content-width: 960px (1024-64)       │   │   │
│ │  #D6D3CD   │   │                                           │   │   │
│ │            │   └───────────────────────────────────────────┘   │   │
│ │            │                                                   │   │
│ └────────────┴───────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.3 布局 CSS 规范

```css
/* 根容器 */
.app-shell {
  display: flex;
  width: 100%;
  min-width: 1024px;
  height: 100vh;
  background: var(--color-bg-base);        /* #FDFBF7 */
  font-family: 'Plus Jakarta Sans', 'Noto Sans SC', sans-serif;
  color: var(--color-text-primary);        /* #3A3638 */
}

/* 侧边栏 */
.app-sidebar {
  width: 256px;
  min-width: 256px;
  height: 100vh;
  background: var(--color-bg-surface-1);   /* #FFFFFF */
  border-right: 2px solid var(--color-border-strong);  /* #D6D3CD */
  padding: 24px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  position: fixed;
  left: 0;
  top: 0;
}

/* 主内容区 */
.app-main {
  margin-left: 256px;
  width: calc(100% - 256px);
  min-height: 100vh;
  padding: 96px 32px 32px 32px;
  overflow-y: auto;
}
```

### 1.4 层叠层级 Z-Index Scale

| 层级 | z-index | 用途 |
|------|---------|------|
| Base | `0` | 主内容 |
| Sidebar | `10` | 侧边栏（fixed） |
| Dropdown | `100` | 下拉菜单 |
| Sticky | `200` | 粘性头部 |
| Modal Backdrop | `900` | 模态遮罩 |
| Modal | `1000` | 模态弹窗 / Review 覆盖层 |
| Focus Overlay | `1100` | Focus Mode 全屏覆盖 |
| Toast | `1200` | 全局通知 |
| StatusBar Popup | `1300` | 系统托盘弹出面板 |

### 1.5 全局字体加载

```css
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+SC:wght@300;400;500;700&display=swap');
```

| 角色 | 字体 | 权重 | 使用场景 |
|------|------|------|---------|
| 标题 Headings | Quicksand | 700 | 页面标题、卡片标题、品牌名 |
| 正文 Body | Plus Jakarta Sans | 400-700 | 段落、按钮文字、导航文字、标签 |
| 代码/标签 Code | JetBrains Mono | 400-500 | 标签、分类名、section header |
| 中文 Chinese | Noto Sans SC | 300-700 | 所有中文内容 fallback |

### 1.6 全局间距系统 Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | 最小间距、图标与文字 |
| `--space-2` | `8px` | 紧凑元素间距 |
| `--space-3` | `12px` | 按钮内边距 |
| `--space-4` | `16px` | 卡片内边距、列表项间距 |
| `--space-5` | `20px` | 区块间距 |
| `--space-6` | `24px` | 侧边栏内边距、section 间距 |
| `--space-8` | `32px` | 主内容侧边距、大区块间距 |
| `--space-10` | `40px` | 页面标题与内容间距 |
| `--space-12` | `48px` | Section 之间 |
| `--space-16` | `64px` | 大段落间距 |
| `--space-24` | `96px` | 主内容区顶部 padding |

---

<!-- SECTION 2 -->
## 2. 侧边栏 Sidebar

**文件路径**：`src/components/Sidebar.tsx`

### 2.1 整体结构 ASCII Wireframe

```
┌──────────────────────────┐
│  padding: 24px           │ ← 256px wide, 100vh tall
│                          │
│  ┌──┐  Trace             │ ← Logo row: 40x40 + brand name
│  │🟥│  时迹              │
│  └──┘                    │
│                          │ ← gap: 32px
│  NAVIGATION              │ ← Section header
│                          │
│  ┌────────────────────┐  │
│  │ 🏠  Dashboard      │  │ ← Active: coral bg + border
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ 📐  Timeline       │  │ ← Inactive: transparent bg
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ ✅  Task           │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ 📊  Analytics      │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ ⚙️  Settings       │  │
│  └────────────────────┘  │
│                          │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │ ← Divider (optional)
│                          │
│  CATEGORIES              │ ← Section header (Task page only)
│  ┌────────────────────┐  │
│  │ 💼 Work            │  │ ← Category buttons (60px height)
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ 📚 Study           │  │
│  └────────────────────┘  │
│                          │
│          ↕ flex grow     │ ← Spacer
│                          │
│  ┌────────────────────┐  │
│  │ 👤 User Profile    │  │ ← Bottom: user info
│  └────────────────────┘  │
└──────────────────────────┘
```

### 2.2 Logo 区域

```
┌────────────────────────────┐
│  ┌────────┐                │
│  │ 40x40  │  Trace 时迹    │
│  │ coral  │                │
│  │ bg     │                │
│  └────────┘                │
└────────────────────────────┘
```

| 元素 | 属性 | 值 |
|------|------|-----|
| Logo 容器 | width, height | `40px` x `40px` |
| Logo 容器 | background | `#FF8C82` (Macaron Coral) |
| Logo 容器 | border | `2px solid var(--color-border-strong)` (#D6D3CD) |
| Logo 容器 | border-radius | `12px` |
| Logo 容器 | display | `flex; align-items: center; justify-content: center` |
| Logo 图标 | color | `#FFFFFF` |
| Logo 图标 | size | `20px` |
| 品牌名 | font | Quicksand 700 |
| 品牌名 | size | `20px` |
| 品牌名 | color | `var(--color-text-primary)` (#3A3638) |
| Logo 行 | layout | `flex; align-items: center; gap: 12px` |
| Logo → Nav 间距 | margin-bottom | `32px` |

### 2.3 Section Header 分区标题

| 属性 | 值 |
|------|-----|
| font-family | JetBrains Mono |
| font-weight | 700 |
| font-size | `12px` |
| text-transform | `uppercase` |
| letter-spacing | `1.2px` |
| color | `#7B7577` |
| margin-bottom | `12px` |
| padding-left | `12px` |

### 2.4 导航项 Nav Items

#### 布局

| 属性 | 值 |
|------|-----|
| display | `flex; flex-direction: row; align-items: center` |
| padding | `12px` |
| gap (icon ↔ text) | `16px` |
| margin-bottom | `4px` |
| border-radius | `12px` |
| cursor | `pointer` |
| transition | `all 0.2s ease` |

#### 文字样式

| 属性 | 值 |
|------|-----|
| font-family | Plus Jakarta Sans |
| font-weight | 600 |
| font-size | `14px` |
| line-height | `1.4` |

#### 图标

| 属性 | 值 |
|------|-----|
| size | `20px` x `20px` |
| stroke-width | `2px` (Lucide icons) |

#### 状态样式

| 状态 | background | border | shadow | text color | icon color |
|------|-----------|--------|--------|------------|------------|
| **Default** | `transparent` | `none` | `none` | `var(--color-text-secondary)` #5C5658 | `#5C5658` |
| **Hover** | `var(--color-bg-surface-2)` #FAF7F2 | `none` | `none` | `var(--color-text-primary)` #3A3638 | `#3A3638` |
| **Active (selected)** | `rgba(121, 190, 235, 0.2)` (blue soft bg) | `none` | `none` | `var(--color-blue)` #79BEEB | `var(--color-blue)` #79BEEB |

### 2.5 Category Buttons (Task 页面时显示)

| 属性 | 值 |
|------|-----|
| border | `2px solid var(--color-text-primary)` #3A3638 |
| border-radius | `16px` |
| padding | `16px` |
| height | `60px` |
| display | `flex; align-items: center; gap: 12px` |
| font-family | Plus Jakarta Sans |
| font-weight | 600 |
| font-size | `14px` |
| background | `var(--color-bg-surface-1)` #FFFFFF |
| margin-bottom | `8px` |

| 状态 | 变化 |
|------|------|
| Hover | `background: var(--color-bg-surface-2)` #FAF7F2, `box-shadow: 4px 4px 0px var(--color-border-strong)`, `transform: translate(-2px, -2px)` |
| Selected | `background: var(--color-accent-soft)` rgba(121,190,235,0.12), `border-color: var(--color-accent)` #79BEEB |

### 2.6 导航配置数据

```typescript
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'House',       path: '/' },
  { id: 'timeline',  label: 'Timeline',  icon: 'Clock',       path: '/timeline' },
  { id: 'task',      label: 'Task',      icon: 'CheckSquare', path: '/task' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart3',   path: '/analytics' },
  { id: 'settings',  label: 'Settings',  icon: 'Settings',    path: '/settings' },
];
```

---

<!-- SECTION 3 -->
## 3. Page 1: Dashboard 仪表盘

**定位**：今天的指挥中心 — AI 告诉你现在该做什么
**文件路径**：`src/pages/Dashboard.tsx`, `src/components/Dashboard/`
**卡片风格**：NowEngine 用 A1 (蓝色语义边框), 常规卡片用 A2, 次要内容用 B2

### 3.1 页面整体布局 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Main Content Area (960px usable, padding 32px sides)           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Page Title: "Dashboard"                                  │   │
│  │ Quicksand 700, 28px, color: #3A3638                      │   │
│  │ Subtitle: "2026年4月21日 · 周二"                          │   │
│  │ Plus Jakarta Sans 400, 14px, color: #9E9899              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          gap: 32px              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  F. Unresolved Snapshot Card (conditional — only if has) │   │
│  │  Card style: A1 Lemon (#FFD3B6 border)                   │   │
│  │  height: auto (content-based)                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          gap: 24px              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │              A. NowEngine 此刻引擎                        │   │
│  │              Card style: A1 Blue                          │   │
│  │              min-height: 280px                            │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          gap: 24px              │
│  ┌───────────────────────┐  ┌───────────────────────────┐      │
│  │ C. Activity Tracking  │  │ D. Plan vs Actual         │      │
│  │ Card style: A2        │  │ Card style: A2            │      │
│  │ width: 50% - 12px     │  │ width: 50% - 12px        │      │
│  │ min-height: 200px     │  │ min-height: 200px        │      │
│  └───────────────────────┘  └───────────────────────────┘      │
│          gap: 24px between columns                              │
│                                          gap: 24px              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  E. Daily Review Entry Card                              │   │
│  │  Card style: A2                                          │   │
│  │  height: auto                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 页面标题区 Page Header

| 元素 | 属性 | 值 |
|------|------|-----|
| 标题 | font | Quicksand 700 |
| 标题 | size | `28px` |
| 标题 | color | `var(--color-text-primary)` #3A3638 |
| 标题 | line-height | `1.3` |
| 日期副标题 | font | Plus Jakarta Sans 400 |
| 日期副标题 | size | `14px` |
| 日期副标题 | color | `var(--color-text-muted)` #9E9899 |
| 日期副标题 | margin-top | `4px` |
| Header → Content gap | margin-bottom | `32px` |

### 3.3 组件 A: NowEngine 此刻引擎

**文件**：`src/components/NowEngineCard.tsx` (existing), `src/services/nowEngine.ts`
**卡片风格**：A1 Blue — 蓝色语义边框，中央 hero 区域

#### ASCII Wireframe

```
┌─── 2px solid #79BEEB ──────────────────────────────────────────┐
│  shadow: 4px 4px 0px rgba(121,190,235,0.4)                     │
│  radius: 24px, padding: 32px, bg: #FFFFFF                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Section label: "现在 →"                                 │   │
│  │  JetBrains Mono 500, 12px, uppercase, #79BEEB            │   │
│  │  letter-spacing: 1.2px                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                     gap: 16px                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Task icon (24px)  +  Task name                          │   │
│  │                       Quicksand 700, 24px, #3A3638       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                     gap: 12px                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Meta row: flex, gap: 16px                               │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌─────────────────┐    │   │
│  │  │ ⏱ 预估2h  │  │ 📅 已拖延3天  │  │ 😐 情绪: 中性   │    │   │
│  │  └──────────┘  └──────────────┘  └─────────────────┘    │   │
│  │  Plus Jakarta Sans 400, 13px, color: #5C5658             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                     gap: 16px                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  First step box:                                         │   │
│  │  bg: #FAF7F2, radius: 12px, padding: 12px 16px          │   │
│  │  border: 1px solid #EDE8E2                               │   │
│  │  "第一步: 打开文档从第三节开始"                             │   │
│  │  Plus Jakarta Sans 400, 14px, color: #5C5658             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                     gap: 24px                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Button row: flex, gap: 12px, justify: center            │   │
│  │                                                          │   │
│  │  ┌─────────────────┐    ┌───────────────────────┐        │   │
│  │  │   🚀 开始专注     │    │   🔄 换一个           │        │   │
│  │  │   btn-primary    │    │   btn-secondary       │        │   │
│  │  │   bg: #79BEEB    │    │   bg: #FFF            │        │   │
│  │  │   color: #FFF    │    │   border: 2px #D6D3CD │        │   │
│  │  │   px:24 py:14    │    │   px:24 py:14         │        │   │
│  │  │   radius: 12px   │    │   radius: 12px        │        │   │
│  │  │   shadow: 4px    │    │   shadow: 4px         │        │   │
│  │  └─────────────────┘    └───────────────────────┘        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 元素规范 Specs

| 元素 | Font | Size | Weight | Color | 其他 |
|------|------|------|--------|-------|------|
| "现在 →" 标签 | JetBrains Mono | 12px | 500 | `#79BEEB` | uppercase, letter-spacing: 1.2px |
| 任务名称 | Quicksand | 24px | 700 | `#3A3638` | max 2 lines, ellipsis overflow |
| Meta 标签 | Plus Jakarta Sans | 13px | 400 | `#5C5658` | flex row, gap 16px |
| 第一步框 | Plus Jakarta Sans | 14px | 400 | `#5C5658` | bg: #FAF7F2, radius: 12px |
| "开始专注" 按钮 | Plus Jakarta Sans | 16px | 600 | `#FFFFFF` | bg: #79BEEB, shadow: 4px 4px 0px #D6D3CD |
| "换一个" 按钮 | Plus Jakarta Sans | 16px | 600 | `#3A3638` | bg: #FFF, border: 2px solid #D6D3CD |

#### 卡片 CSS

```css
.now-engine-card {
  background: var(--color-bg-surface-1);       /* #FFFFFF */
  border: 2px solid #79BEEB;                   /* A1 Blue */
  border-radius: 24px;
  box-shadow: 4px 4px 0px rgba(121,190,235,0.4);
  padding: 32px;
  min-height: 280px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.now-engine-card:hover {
  box-shadow: 6px 6px 0px rgba(121,190,235,0.4);
  transform: translate(-2px, -2px);
}
```

#### 空状态 Empty State

当没有可推荐的任务时：

```
┌─── 2px solid #79BEEB ──────────────────────────────────┐
│                                                         │
│     illustration: empty task icon (64x64, #D4C4FB)     │
│                                                         │
│     "还没有任务"                                        │
│     Quicksand 700, 20px, #3A3638                       │
│                                                         │
│     "创建你的第一个任务，AI 会告诉你从哪开始"            │
│     Plus Jakarta Sans 400, 14px, #9E9899               │
│                                                         │
│     ┌──────────────────────┐                           │
│     │  + 创建任务 (primary) │                           │
│     └──────────────────────┘                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.4 组件 B: Morning Ritual 晨间启动仪式

**文件**：`src/components/MorningRitual.tsx`
**触发**：每日首次打开 App，modal 覆盖层
**卡片风格**：A1 Purple (AI/智能语义)

#### Modal 容器

| 属性 | 值 |
|------|-----|
| overlay bg | `rgba(58, 54, 56, 0.4)` |
| modal width | `560px` |
| modal bg | `#FFFFFF` |
| modal border | `2px solid #D4C4FB` |
| modal radius | `24px` |
| modal shadow | `4px 4px 0px rgba(212,196,251,0.4)` |
| modal padding | `32px` |
| z-index | `1000` |

#### 多步流程 Step Layout

```
Step 1/4: AI 问候
┌───────────────────────────────────────────┐
│  "早上好！今天是 4月21日 周二"              │
│  Quicksand 700, 22px, #3A3638             │
│                                           │
│  AI 问候文字, PJS 400, 15px, #5C5658      │
│                                           │
│  progress dots: ● ○ ○ ○                   │
│  ┌───────────────────────┐                │
│  │   继续 → (btn-primary) │                │
│  └───────────────────────┘                │
└───────────────────────────────────────────┘

Step 2/4: 今日计划概览
┌───────────────────────────────────────────┐
│  "今日计划"                               │
│  ┌─────────────────────────────────────┐  │
│  │ 09:00-10:00  写季度报告  (tag: 抗拒) │  │
│  │ 10:00-11:00  团队会议    (tag: 中性) │  │
│  │ ...                                 │  │
│  └─────────────────────────────────────┘  │
│  progress dots: ● ● ○ ○                   │
│  [← 上一步]  [继续 →]                     │
└───────────────────────────────────────────┘

Step 3/4: 昨日未完成 + 明日一件事回显
Step 4/4: 确认 → 开始第一个任务
```

#### Progress Dots

| 属性 | 值 |
|------|-----|
| dot size | `8px` diameter |
| active dot | `#D4C4FB` filled |
| inactive dot | `#EDE8E2` filled |
| gap between dots | `8px` |
| alignment | `center` |

### 3.5 组件 C: Real-time Activity Tracking 实时活动追踪

**文件**：`src/components/Dashboard/ActiveTrackingCard.tsx`
**卡片风格**：A2 (default)

```
┌─── 2px solid #D6D3CD ──────────────────────┐
│  shadow: 4px 4px 0px #D6D3CD               │
│  radius: 24px, padding: 24px               │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ "活动追踪"   ● RECORDING (pulse)   │    │
│  │ QS 700 18px   PJS 500 12px #A8E6CF │    │
│  └─────────────────────────────────────┘    │
│                          gap: 16px          │
│  Current app: "VS Code — report.tsx"       │
│  PJS 400 14px #5C5658                      │
│                          gap: 12px          │
│  Duration: "1h 23m"  Category: "Coding"    │
│  PJS 700 20px #3A3638   Badge: A2 style    │
│                          gap: 16px          │
│  Mini timeline preview (last 2h):          │
│  ┌─────────────────────────────────────┐    │
│  │ ████████░░░░██████░░████████████    │    │
│  │ blue    gray green  gray  blue      │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

#### Pulse Animation CSS

```css
.pulse-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #A8E6CF;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.3); }
}
```

### 3.6 组件 D: Plan vs Actual 计划对比

**文件**：`src/components/Dashboard/TodayStatsCards.tsx`
**卡片风格**：A2

```
┌─── 2px solid #D6D3CD ──────────────────────┐
│  radius: 24px, padding: 24px               │
│                                             │
│  "计划 vs 实际"                             │
│  QS 700 18px #3A3638                       │
│                          gap: 16px          │
│  Current timeblock row:                     │
│  ┌─────────────────────────────────────┐    │
│  │ 09:00-10:00                         │    │
│  │ Plan: 写季度报告                     │    │
│  │ Actual: VS Code (report.tsx) ✅ 匹配 │    │
│  └─────────────────────────────────────┘    │
│  OR if mismatched:                          │
│  ┌─────────────────────────────────────┐    │
│  │ 09:00-10:00                         │    │
│  │ Plan: 写季度报告                     │    │
│  │ Actual: Chrome (Twitter) ⚠️ 偏离     │    │
│  │ border-left: 3px solid #FFD3B6      │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Completion bar: ████████░░░ 73%           │
│  bar bg: #F5F1EA, bar fill: #A8E6CF       │
│  height: 8px, radius: 4px                  │
│                                             │
└─────────────────────────────────────────────┘
```

### 3.7 组件 E: Daily Review Entry 日终复盘入口

**卡片风格**：A2

```
┌─── 2px solid #D6D3CD ──────────────────────────────────────────┐
│  padding: 20px 24px, radius: 24px                               │
│                                                                 │
│  flex row: justify-between, align-center                        │
│                                                                 │
│  Left:                              Right:                      │
│  🌙 "今日复盘"                      [打开复盘 →] btn-secondary  │
│  QS 700 16px                        PJS 600 14px                │
│  "回顾今天，设定明天的一件事"         px:16 py:10               │
│  PJS 400 13px #9E9899                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.8 组件 F: Unresolved Snapshot Card 未恢复快照

**卡片风格**：A1 Lemon (warning 语义)
**条件显示**：仅当存在暂停的上下文快照时

```
┌─── 2px solid #FFD3B6 ──────────────────────────────────────────┐
│  shadow: 4px 4px 0px rgba(255,211,182,0.4)                      │
│  radius: 24px, padding: 20px 24px                               │
│                                                                 │
│  📸 "你有一个未完成的任务"         PJS 600 14px #3A3638         │
│                                                                 │
│  Task: "写季度报告"  ·  已投入 47min                            │
│  QS 700 16px #3A3638    PJS 400 13px #5C5658                   │
│                                                                 │
│  Note: "写到了第三节的数据分析部分"                              │
│  PJS 400 13px #9E9899, italic                                  │
│                                                                 │
│  暂停于 14:32                                                   │
│  PJS 400 12px #9E9899                                          │
│                                                                 │
│  Button row: flex, gap: 12px, justify: flex-end                 │
│  [继续] btn-primary(green #A8E6CF)    [稍后] btn-secondary      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.9 交互状态 Interaction States

| 交互 | 行为 |
|------|------|
| NowEngine "开始专注" click | 触发 Focus Mode overlay (Section 8) |
| NowEngine "换一个" click | 动画滑出当前任务，滑入下一推荐任务 (300ms ease) |
| Snapshot "继续" click | 恢复任务，进入 Focus Mode |
| Snapshot "稍后" click | 关闭快照卡片 (标记为 dismissed) |
| 复盘入口 click | 打开 Review overlay (Section 9) |
| 卡片 hover | A2 cards: shadow 4→6px, translate(-2px,-2px); A1 cards: same |

### 3.10 响应式行为

| 宽度 | 变化 |
|------|------|
| >= 1280px | 默认双列布局 (C + D 并排) |
| 1024-1279px | C, D 卡片各 50%，间距缩小到 16px |
| < 1024px | 所有卡片单列堆叠，sidebar 折叠为 hamburger |

---

<!-- SECTION 4 -->
## 4. Page 2: Timeline 时间线

**定位**：时间去哪了 — 逐小时活动回顾，让时间变得可见
**文件路径**：`src/pages/Timeline.tsx`
**卡片风格**：B1 (soft glow) 用于 timeline 容器；A1 用于打断标记详情

### 4.1 页面整体布局 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Main Content Area (960px usable)                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Page Header Row: flex, justify-between, align-center     │   │
│  │                                                          │   │
│  │ Left:                        Right:                      │   │
│  │ "Timeline"                   ┌────────────┐              │   │
│  │ QS 700 28px                  │ 🔒 Privacy │ toggle       │   │
│  │ "2026年4月21日"              └────────────┘              │   │
│  │ PJS 400 14px #9E9899         ┌────────────────────────┐  │   │
│  │                              │ ◀ 前一天 │ 今天 │ ▶    │  │   │
│  │                              └────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          gap: 24px              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Stats Bar: flex row, gap: 24px                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │   │
│  │  │Total Time│ │Deep Work │ │Switches  │ │Interrupts│    │   │
│  │  │ 6h 42m   │ │ 3h 15m   │ │ 47       │ │ 8        │    │   │
│  │  │ card-flat│ │ card-flat│ │ card-flat│ │card-flat │    │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          gap: 24px              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Timeline Container: B1 card-soft                        │   │
│  │  1px solid #F5F0EA, shadow glow, radius: 24px            │   │
│  │  padding: 24px                                           │   │
│  │                                                          │   │
│  │  ┌────────┬─────────────────────────────────────────┐    │   │
│  │  │ Time   │ Activity Blocks                         │    │   │
│  │  │ Axis   │                                         │    │   │
│  │  │ 72px   │ remaining width                         │    │   │
│  │  │        │                                         │    │   │
│  │  │ 06:00  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │    │   │
│  │  │        │                                         │    │   │
│  │  │ 07:00  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │    │   │
│  │  │        │                                         │    │   │
│  │  │ 08:00  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │    │   │
│  │  │        │                                         │    │   │
│  │  │ 09:00  │ ████████████████████ VS Code            │    │   │
│  │  │    🚩  │ ████████████████████ (coding)           │    │   │
│  │  │        │ ▓▓▓▓▓▓ Chrome ▓▓▓▓▓▓ (browsing)       │    │   │
│  │  │        │                                         │    │   │
│  │  │ 10:00  │ ████████████████████████████ Zoom       │    │   │
│  │  │        │ ████████████████████████████ (meeting)  │    │   │
│  │  │        │                                         │    │   │
│  │  │ ═══════│═══════════ NOW ════════════════════════ │    │   │
│  │  │        │                                         │    │   │
│  │  │ 11:00  │ ░░░░░░░░░░░░░░░░░░░ (future/empty)    │    │   │
│  │  │ ...    │ ...                                     │    │   │
│  │  └────────┴─────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Stats Bar 统计栏

**卡片风格**：B2 (card-flat)

| 元素 | 布局 |
|------|------|
| 容器 | `display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px` |
| 单个 stat card | `padding: 16px; radius: 16px; bg: var(--color-bg-surface-2)` #FAF7F2 |

| 元素 | Font | Size | Weight | Color |
|------|------|------|--------|-------|
| Stat label | PJS | 12px | 500 | `#9E9899` |
| Stat value | QS | 24px | 700 | `#3A3638` |
| Stat unit | PJS | 14px | 400 | `#5C5658` |

#### 语义色 Stat highlight

| Stat | Value color when notable |
|------|-------------------------|
| Deep Work > 4h | `#A8E6CF` (green) |
| Switches > 50 | `#FF8C82` (coral) |
| Interruptions > 10 | `#FF8C82` (coral) |

### 4.3 Time Axis 时间轴

| 属性 | 值 |
|------|-----|
| 轴宽度 | `72px` |
| 时间标签 font | JetBrains Mono 400 |
| 时间标签 size | `12px` |
| 时间标签 color | `#9E9899` |
| 每小时行高 | `80px` (1h = 80px) |
| 轴分割线 | `1px solid #F5F0EA`, 每小时 |
| Work hours (09-18) bg | `rgba(121,190,235,0.04)` — 极淡蓝色背景 |

### 4.4 Activity Blocks 活动块

| 属性 | 值 |
|------|-----|
| height | 按时长比例计算：`duration_minutes / 60 * 80px` |
| min-height | `16px` (活动 < 12min 也至少显示 16px) |
| border-radius | `8px` |
| padding | `8px 12px` |
| margin-bottom | `2px` |
| font (app name) | PJS 500, 13px |
| font (category) | JetBrains Mono 400, 11px, uppercase |

#### 类别色编码 Category Colors

| 类别 | Background | Text color |
|------|------------|------------|
| Coding/Dev | `rgba(121,190,235,0.15)` | `#79BEEB` |
| Meeting | `rgba(212,196,251,0.15)` | `#D4C4FB` |
| Communication | `rgba(255,211,182,0.15)` | `#FFD3B6` |
| Design | `rgba(255,181,212,0.15)` | `#FFB5D4` |
| Research | `rgba(168,230,207,0.15)` | `#A8E6CF` |
| Social/Distraction | `rgba(255,140,130,0.15)` | `#FF8C82` |
| Other/Uncategorized | `rgba(214,211,205,0.15)` | `#9E9899` |
| Idle/Away | `rgba(0,0,0,0.03)` | `#9E9899` |

### 4.5 NOW Marker 当前时间线

```css
.now-marker {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: #FF8C82;                    /* Macaron Coral */
  z-index: 5;
}
.now-marker::before {
  content: 'NOW';
  position: absolute;
  left: 8px;
  top: -10px;
  font-family: 'JetBrains Mono';
  font-size: 10px;
  font-weight: 500;
  color: #FF8C82;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.now-marker::after {
  content: '';
  position: absolute;
  left: 0;
  top: -4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #FF8C82;
}
```

### 4.6 Interruption Markers 打断标记

**卡片风格**：A1 Coral (hover 弹出详情)

```
Timeline axis:
│ 09:00  │ ████████████████████ VS Code ██████
│    🚩  │ ▓▓▓▓▓▓ Chrome (Twitter) ▓▓▓▓▓▓▓▓▓
│        │ ████████████████████ VS Code ██████
```

| 元素 | 属性 | 值 |
|------|------|-----|
| Flag icon | size | `16px` |
| Flag icon | color | `#FF8C82` |
| Flag position | placement | 时间轴左侧，对齐打断发生时间 |
| Tooltip on hover | bg | `#FFFFFF` |
| Tooltip | border | `2px solid #FF8C82` |
| Tooltip | shadow | `4px 4px 0px rgba(255,140,130,0.4)` |
| Tooltip | radius | `12px` |
| Tooltip | padding | `12px 16px` |
| Tooltip | max-width | `280px` |

Tooltip 内容:
```
┌─── 2px solid #FF8C82 ──────────┐
│ "打断 · 09:23"                  │
│ PJS 600 13px #3A3638            │
│                                 │
│ 来源: Chrome (Twitter)          │
│ 持续: 7 分钟                    │
│ 恢复时间: 3 分钟                │
│ PJS 400 12px #5C5658            │
└─────────────────────────────────┘
```

### 4.7 Privacy Toggle 隐私切换

| 属性 | 值 |
|------|-----|
| 位置 | 页面头部右上 |
| 组件 | Toggle switch (pill shape) |
| ON state | bg: `#A8E6CF`, knob: `#3A3638` |
| OFF state | bg: `#EDE8E2`, knob: `#9E9899` |
| border | `2px solid #3A3638` |
| size | `44px` x `24px`, knob `16px` diameter |
| label | "隐私模式", PJS 400 13px #5C5658 |

### 4.8 Date Navigator 日期切换

```
┌─────────────────────────────────┐
│  [ ◀ ]  2026年4月21日  [ ▶ ]    │
│  btn-ghost  QS700 16px  btn-ghost│
│                                  │
│  [今天] btn-secondary small      │
└─────────────────────────────────┘
```

| 元素 | 属性 |
|------|------|
| Arrow buttons | `32px x 32px`, border: `2px solid #D6D3CD`, radius: `8px`, bg: transparent |
| Arrow hover | `bg: #FAF7F2` |
| "今天" button | PJS 500, 12px, `padding: 4px 12px`, border: `2px solid #D6D3CD`, radius: `8px` |

### 4.9 Batch Re-categorization 批量重分类

| 触发 | 长按或 shift+click 多选活动块 |
|------|------|
| 弹出 bar | 底部浮动 bar, `position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%)` |
| bar bg | `#FFFFFF` |
| bar border | `2px solid #D6D3CD` |
| bar shadow | `4px 4px 0px #D6D3CD` |
| bar radius | `16px` |
| bar padding | `12px 24px` |
| 内容 | "已选 3 个活动  [重新分类 ▾] [取消]" |

### 4.10 交互状态

| 交互 | 行为 |
|------|------|
| Activity block hover | `opacity: 0.85 → 1.0`, 显示完整 app name + duration tooltip |
| Activity block click | 展开详情 panel (右侧 slide-in 或 inline expand) |
| Interruption flag hover | 显示 tooltip (Section 4.6) |
| NOW marker | 自动滚动至当前时间位置 (onMount) |
| 日期切换 | 300ms fade transition |

### 4.11 响应式行为

| 宽度 | 变化 |
|------|------|
| >= 1280px | 默认布局 |
| 1024-1279px | Stats bar 缩小为 2x2 grid |
| < 1024px | Stats bar 单列, timeline 占满宽度 |

---

<!-- SECTION 5 -->
## 5. Page 3: Task 任务管理

**定位**：所有任务的管理中心 — 创建、排序、规划时间块
**文件路径**：`src/pages/Task.tsx` (重命名自 `Planner.tsx`), `src/components/TimeBlockPlanner.tsx`
**卡片风格**：A2 (default) 用于任务卡片, A1 (colored) 用于强调

### 5.1 页面整体布局 Page Layout (Two-Panel)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Main Content Area (960px usable)                                   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Page Header: flex, justify-between, align-center             │   │
│  │                                                              │   │
│  │ "Task"               View switcher + [+ 新建任务] btn-primary│   │
│  │ QS 700 28px          [列表|看板|日历|时间线]                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                          gap: 24px                  │
│  ┌──────────────┬───────────────────────────────────────────────┐   │
│  │              │                                               │   │
│  │  Left Panel  │           Right Panel                         │   │
│  │  Category    │           Task List / View                    │   │
│  │  Sidebar     │                                               │   │
│  │  288px       │           remaining (672px)                   │   │
│  │              │                                               │   │
│  │  bg:         │                                               │   │
│  │  #FAF7F2     │                                               │   │
│  │  radius:     │                                               │   │
│  │  24px        │                                               │   │
│  │  padding:    │                                               │   │
│  │  20px        │                                               │   │
│  │              │                                               │   │
│  │  ┌────────┐  │                                               │   │
│  │  │All     │  │                                               │   │
│  │  │Tasks   │  │                                               │   │
│  │  └────────┘  │                                               │   │
│  │  ┌────────┐  │                                               │   │
│  │  │💼 Work │  │                                               │   │
│  │  └────────┘  │                                               │   │
│  │  ┌────────┐  │                                               │   │
│  │  │📚 Study│  │                                               │   │
│  │  └────────┘  │                                               │   │
│  │  ┌────────┐  │                                               │   │
│  │  │🏃 Life │  │                                               │   │
│  │  └────────┘  │                                               │   │
│  │              │                                               │   │
│  └──────────────┴───────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 View Switcher 视图切换

```
┌─────────────────────────────────────────┐
│  [ 列表 | 看板 | 日历 | 时间线 ]         │
│  Segmented control style                 │
└─────────────────────────────────────────┘
```

| 属性 | 值 |
|------|-----|
| container bg | `var(--color-bg-surface-2)` #FAF7F2 |
| container border | `2px solid var(--color-border-strong)` #D6D3CD |
| container radius | `12px` |
| container padding | `4px` |
| segment padding | `8px 16px` |
| segment font | PJS 600 13px |
| inactive segment | `bg: transparent; color: #5C5658` |
| active segment | `bg: #FFFFFF; color: #3A3638; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05)` |
| transition | `all 0.2s ease` |

### 5.3 Left Panel: Category Sidebar 分类侧栏

| 属性 | 值 |
|------|-----|
| width | `288px` |
| background | `var(--color-bg-surface-2)` #FAF7F2 |
| border-radius | `24px` |
| padding | `20px` |
| margin-right | `24px` |

#### Category Item

```
┌─── 2px solid #3A3638 ──────────────────┐
│  radius: 16px, height: 60px            │
│  padding: 16px                         │
│                                         │
│  💼  Work               (12)           │
│  icon  PJS 600 14px     PJS 400 13px   │
│        #3A3638           #9E9899       │
│                                         │
└─────────────────────────────────────────┘
```

| 状态 | 样式变化 |
|------|---------|
| Default | `bg: #FFFFFF; border: 2px solid #3A3638` |
| Hover | `shadow: 4px 4px 0px #D6D3CD; transform: translate(-2px,-2px)` |
| Selected | `bg: rgba(121,190,235,0.12); border-color: #79BEEB` |

### 5.4 Task Card 任务卡片 (列表视图)

**卡片风格**：A2 (default)

```
┌─── 2px solid #D6D3CD ──────────────────────────────────────────┐
│  shadow: 4px 4px 0px #D6D3CD                                   │
│  radius: 16px (smaller than hero cards), padding: 16px 20px    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Row 1: flex, justify-between, align-center              │   │
│  │                                                          │   │
│  │  ☐ checkbox    Task name                  Priority badge │   │
│  │  20x20px      PJS 600 15px #3A3638       [P1] tag       │   │
│  │  2px solid     max-width: 60%                            │   │
│  │  #3A3638                                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                     gap: 8px                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Row 2: Meta line                                        │   │
│  │  flex, gap: 12px                                         │   │
│  │                                                          │   │
│  │  📁 Work    ⏱ 2h    😐 中性    🔗 第一步: 打开文档...    │   │
│  │  PJS 400 12px #9E9899                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                     gap: 8px                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Row 3: Actions (visible on hover)                       │   │
│  │  flex, gap: 8px, justify: flex-end                       │   │
│  │                                                          │   │
│  │                   [▶ 开始] [✏ 编辑] [⋮ 更多]            │   │
│  │                   btn-sm    btn-sm    icon-btn            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Task Card Specs

| 元素 | Font | Size | Weight | Color |
|------|------|------|--------|-------|
| Task name | PJS | 15px | 600 | `#3A3638` |
| Task name (completed) | PJS | 15px | 400 | `#9E9899`, `text-decoration: line-through` |
| Meta labels | PJS | 12px | 400 | `#9E9899` |
| Priority badge | JetBrains Mono | 10px | 500 | varies (see below) |

#### Priority Badges 优先级标签

| Priority | Background | Border | Text |
|----------|-----------|--------|------|
| P1 (Urgent) | `rgba(255,140,130,0.12)` | `2px solid #3A3638` | `#FF8C82` |
| P2 (High) | `rgba(255,211,182,0.12)` | `2px solid #3A3638` | `#FFD3B6` |
| P3 (Medium) | `rgba(121,190,235,0.12)` | `2px solid #3A3638` | `#79BEEB` |
| P4 (Low) | `rgba(214,211,205,0.12)` | `2px solid #3A3638` | `#9E9899` |

Badge CSS:
```css
.priority-badge {
  font-family: 'JetBrains Mono';
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 8px;
  border: 2px solid #3A3638;
  border-radius: 6px;
}
```

#### Emotional Tag 情绪标签

| Tag | Icon | Color | Background |
|-----|------|-------|-----------|
| easy (轻松) | 😊 | `#A8E6CF` | `rgba(168,230,207,0.12)` |
| neutral (中性) | 😐 | `#79BEEB` | `rgba(121,190,235,0.12)` |
| resist (抗拒) | 😰 | `#FF8C82` | `rgba(255,140,130,0.12)` |

### 5.5 Checkbox 复选框

| 属性 | 值 |
|------|-----|
| size | `20px` x `20px` |
| border | `2px solid #3A3638` |
| border-radius | `4px` |
| unchecked bg | `transparent` |
| checked bg | `#A8E6CF` (green) |
| checkmark | `#3A3638`, stroke-width 2px |
| transition | `all 0.15s ease` |

### 5.6 "New Task" 新建任务按钮

| 属性 | 值 |
|------|-----|
| style | btn-primary |
| bg | `var(--color-accent)` #79BEEB |
| color | `#FFFFFF` |
| padding | `10px 20px` |
| radius | `12px` |
| shadow | `4px 4px 0px #D6D3CD` |
| icon | `+` (Plus icon, 16px) |
| font | PJS 600 14px |

### 5.7 New Task Form 新建任务表单

**触发**：点击 "+ 新建任务" 按钮
**展现**：右侧面板 inline expand 或 modal

```
┌─── 2px solid #D6D3CD ──────────────────────────────────────────┐
│  radius: 24px, padding: 24px, bg: #FFFFFF                       │
│  shadow: 4px 4px 0px #D6D3CD                                   │
│                                                                 │
│  "新建任务"  QS 700 20px #3A3638                                │
│                                          gap: 16px              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 任务名称 *                                               │   │
│  │ ┌────────────────────────────────────────────────────┐   │   │
│  │ │ input: bg #FDFBF7, 2px solid #3A3638, r:12px      │   │   │
│  │ │ padding: 13px 16px, PJS 400 15px                   │   │   │
│  │ └────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          gap: 12px              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 第一步 (optional)                                        │   │
│  │ ┌────────────────────────────────────────────────────┐   │   │
│  │ │ "第一个具体动作是什么？"  placeholder               │   │   │
│  │ │ input: same style as above                         │   │   │
│  │ └────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          gap: 12px              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Row: flex, gap: 16px                                     │   │
│  │                                                          │   │
│  │ Category ▾         Priority ▾        Emotional tag       │   │
│  │ select dropdown    select dropdown   [😊|😐|😰] 3-way   │   │
│  │ flex:1             flex:1            toggle              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          gap: 12px              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 预估时间                                                 │   │
│  │ ┌──────┐ 小时  ┌──────┐ 分钟                            │   │
│  │ │ 0-99 │       │ 0-59 │                                 │   │
│  │ └──────┘       └──────┘                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          gap: 24px              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Button row: flex, justify: flex-end, gap: 12px           │   │
│  │                                                          │   │
│  │                         [取消] btn-secondary              │   │
│  │                         [创建任务] btn-primary            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Input Field Specs

| 属性 | 值 |
|------|-----|
| background | `var(--color-bg-base)` #FDFBF7 |
| border | `2px solid var(--color-text-primary)` #3A3638 |
| border-radius | `12px` |
| padding | `13px 16px` |
| font | PJS 400 15px |
| color | `#3A3638` |
| placeholder color | `#9E9899` |
| focus border-color | `var(--color-accent)` #79BEEB |
| focus shadow | `0 0 0 3px rgba(121,190,235,0.15)` |
| transition | `border-color 0.2s, box-shadow 0.2s` |

#### Emotional Tag 3-Way Toggle

```
┌─────────────────────────────────┐
│ [😊 轻松] [😐 中性] [😰 抗拒]  │
│  each: padding 6px 12px         │
│  radius: 8px                    │
│  border: 2px solid #D6D3CD      │
│  selected: filled bg + dark brdr│
└─────────────────────────────────┘
```

| 状态 | bg | border | text color |
|------|-----|--------|-----------|
| Unselected | `transparent` | `2px solid #D6D3CD` | `#9E9899` |
| Selected: easy | `rgba(168,230,207,0.2)` | `2px solid #A8E6CF` | `#3A3638` |
| Selected: neutral | `rgba(121,190,235,0.2)` | `2px solid #79BEEB` | `#3A3638` |
| Selected: resist | `rgba(255,140,130,0.2)` | `2px solid #FF8C82` | `#3A3638` |

### 5.8 Kanban View 看板视图

```
┌─────────────────────────────────────────────────────────────┐
│  columns: flex row, gap: 16px, overflow-x: auto             │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │  To Do     │  │  In Progress│  │   Done     │             │
│  │  ─────     │  │  ─────     │  │  ─────     │             │
│  │  (8)       │  │  (3)       │  │  (5)       │             │
│  │            │  │            │  │            │             │
│  │  ┌──────┐  │  │  ┌──────┐  │  │  ┌──────┐  │             │
│  │  │task 1│  │  │  │task 4│  │  │  │task 7│  │             │
│  │  └──────┘  │  │  └──────┘  │  │  └──────┘  │             │
│  │  ┌──────┐  │  │  ┌──────┐  │  │  ┌──────┐  │             │
│  │  │task 2│  │  │  │task 5│  │  │  │task 8│  │             │
│  │  └──────┘  │  │  └──────┘  │  │  └──────┘  │             │
│  │  ...       │  │  ...       │  │  ...       │             │
│  │            │  │            │  │            │             │
│  └────────────┘  └────────────┘  └────────────┘             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

| 属性 | 值 |
|------|-----|
| Column width | `300px` min |
| Column bg | `var(--color-bg-surface-2)` #FAF7F2 |
| Column radius | `16px` |
| Column padding | `16px` |
| Column header font | PJS 700 14px #3A3638 |
| Column count | PJS 400 13px #9E9899 |
| Task card gap | `8px` |
| Drag placeholder | `border: 2px dashed #79BEEB; radius: 16px; bg: rgba(121,190,235,0.06)` |

### 5.9 TimeBlock System 时间块区域

在日历/时间线视图中显示：

```
┌──── Time Block ──────────────────┐
│ 09:00 — 10:00                    │
│ 📝 写季度报告                     │
│ buffer: 5min after               │
│                                   │
│ bg: rgba(121,190,235,0.08)       │
│ border-left: 3px solid #79BEEB   │
│ radius: 8px                      │
│ padding: 8px 12px                │
└───────────────────────────────────┘
┌──── Buffer ──────────────────────┐
│ 10:00 — 10:05  (缓冲)            │
│ bg: rgba(214,211,205,0.08)       │
│ border-left: 3px dashed #D6D3CD  │
│ height: proportional (5min)      │
└───────────────────────────────────┘
```

### 5.10 交互状态

| 交互 | 行为 |
|------|------|
| Task card hover | shadow 4→6px, translate(-2px,-2px), show action buttons |
| Task card drag | `opacity: 0.7; cursor: grabbing; shadow: 8px 8px 0px #D6D3CD` |
| Checkbox toggle | 300ms scale animation (1→1.2→1), fill green |
| "开始" on task | triggers Focus Mode overlay with this task |
| Category click | filter task list, 200ms fade transition |
| New task form submit | card slides in from top with 300ms ease-out |

### 5.11 响应式行为

| 宽度 | 变化 |
|------|------|
| >= 1280px | Two-panel layout: 288px + 672px |
| 1024-1279px | Category sidebar collapses to 64px icons-only |
| < 1024px | Category sidebar becomes horizontal scroll strip at top |

---

<!-- SECTION 6 -->
## 6. Page 4: Analytics 数据分析

**定位**：AI 帮你发现模式和成长 — 周/月级别数据洞察
**文件路径**：`src/pages/Analytics.tsx` (重命名自 `Statistics.tsx`), `src/components/statistics/`
**卡片风格**：图表卡片用 B1, 关键指标卡片用 A1 colored

### 6.1 页面整体布局 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Main Content Area (960px usable)                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ "Analytics"  QS 700 28px                                 │   │
│  │ "数据洞察 · 发现你的时间模式"  PJS 400 14px #9E9899      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          gap: 24px              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Tab Bar                                                 │   │
│  │  [ Overview | Execution | AI Insights | Growth(V3) ]     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          gap: 24px              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Time Range Selector                                     │   │
│  │  [ 本周 | 本月 | 自定义 ]    ◀ 2026/04/15-21 ▶          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          gap: 24px              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Tab Content Area (varies by tab)                        │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Tab Bar 标签栏

| 属性 | 值 |
|------|-----|
| style | 底部边框指示器 (underline tabs) |
| container | `border-bottom: 2px solid #EDE8E2` |
| tab padding | `12px 20px` |
| tab font | PJS 600 14px |
| inactive tab color | `#9E9899` |
| active tab color | `#3A3638` |
| active indicator | `border-bottom: 3px solid var(--color-accent)` #79BEEB |
| indicator transition | `left/width 0.3s ease` (sliding underline) |
| tab gap | `0px` (adjacent) |

### 6.3 Time Range Selector 时间范围选择

```
┌───────────────────────────────────────────────────┐
│  ┌────────────────────┐    ◀ 2026/04/15-21 ▶      │
│  │[本周|本月|自定义]   │    PJS 500 14px #3A3638   │
│  │ segmented control  │    arrow: 28x28 btn-ghost  │
│  └────────────────────┘                            │
└───────────────────────────────────────────────────┘
```

### 6.4 Tab 1: Overview 总览

**文件**：`src/components/statistics/StatisticsOverview.tsx`

#### Layout Grid

```
┌──────────────────────────────────────────────────────────────┐
│  Key Metrics Row: grid 4 columns, gap: 16px                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐│
│  │ Total Time │ │ Deep Work  │ │ Focus Score│ │ Tasks Done ││
│  │ A1 Blue    │ │ A1 Purple  │ │ A1 Green   │ │ A1 Pink    ││
│  │ 42h 30m    │ │ 18h 15m    │ │ 78/100     │ │ 23/30      ││
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘│
│                                          gap: 24px           │
│  ┌────────────────────────────┐ ┌────────────────────────┐   │
│  │ Category Pie Chart         │ │ Daily Bar Chart        │   │
│  │ B1 card-soft               │ │ B1 card-soft           │   │
│  │ width: 50% - 12px          │ │ width: 50% - 12px      │   │
│  │ min-height: 300px          │ │ min-height: 300px      │   │
│  └────────────────────────────┘ └────────────────────────┘   │
│                                          gap: 24px           │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Hourly Heatmap                                       │    │
│  │ B1 card-soft                                         │    │
│  │ full width, height: 200px                            │    │
│  │                                                      │    │
│  │  7 rows (Mon-Sun) x 24 cols (hours)                  │    │
│  │  cell: 32x32px, radius: 4px, gap: 2px               │    │
│  │  intensity: rgba of accent color, 4 levels           │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Key Metric Card (A1 Colored)

```
┌─── 2px solid [semantic-color] ─────┐
│  shadow: 4px 4px 0px rgba(...)     │
│  radius: 24px, padding: 20px       │
│                                     │
│  Label: PJS 400 12px #9E9899       │
│  Value: QS 700 28px #3A3638        │
│  Trend: PJS 500 12px [green/coral] │
│  "↑ 12% vs 上周"                   │
│                                     │
└─────────────────────────────────────┘
```

| Metric | Border color | Shadow |
|--------|-------------|--------|
| Total Time | `#79BEEB` | `4px 4px 0px rgba(121,190,235,0.4)` |
| Deep Work | `#D4C4FB` | `4px 4px 0px rgba(212,196,251,0.4)` |
| Focus Score | `#A8E6CF` | `4px 4px 0px rgba(168,230,207,0.4)` |
| Tasks Done | `#FFB5D4` | `4px 4px 0px rgba(255,181,212,0.4)` |

#### Trend Indicator

| Direction | Color | Icon |
|-----------|-------|------|
| Up (good) | `#A8E6CF` | `↑` |
| Down (bad) | `#FF8C82` | `↓` |
| Flat | `#9E9899` | `→` |

#### Chart Card (B1 Soft)

```css
.chart-card {
  background: var(--color-bg-surface-1);    /* #FFFFFF */
  border: 1px solid var(--color-border-subtle);  /* #F5F0EA */
  border-radius: 24px;
  box-shadow: 0 8px 30px rgba(121,190,235,0.08), 0 2px 8px rgba(0,0,0,0.02);
  padding: 24px;
}
```

| Chart element | 说明 |
|---------------|------|
| Chart title | QS 700 16px #3A3638 |
| Axis labels | JetBrains Mono 400 11px #9E9899 |
| Grid lines | `#F5F0EA` 1px |
| Pie chart colors | Use macaron palette in order: Blue, Purple, Green, Lemon, Coral, Pink |
| Bar chart fill | `var(--color-accent)` with 80% opacity |
| Tooltip | `bg: #FFFFFF; border: 2px solid #D6D3CD; shadow: 4px 4px 0px #D6D3CD; radius: 12px; padding: 8px 12px` |

#### Heatmap Cell Intensity

| Level | Background |
|-------|-----------|
| 0 (no data) | `#F5F1EA` |
| 1 (low) | `rgba(121,190,235,0.15)` |
| 2 (medium) | `rgba(121,190,235,0.35)` |
| 3 (high) | `rgba(121,190,235,0.55)` |
| 4 (peak) | `rgba(121,190,235,0.80)` |

### 6.5 Tab 2: Execution 执行守护统计

**文件**：`src/components/statistics/StatisticsDeepWork.tsx` (enhanced)

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  "打断分析"  QS 700 18px                              │    │
│  │  B1 card-soft, full width, min-height: 280px         │    │
│  │                                                      │    │
│  │  Line chart: daily interruptions over time range     │    │
│  │  X-axis: dates, Y-axis: count                        │    │
│  │  Line color: #FF8C82                                 │    │
│  │                                                      │    │
│  │  Right sidebar within card:                          │    │
│  │  "打断来源 Top 5"                                    │    │
│  │  1. Chrome (微信网页版) — 23次                       │    │
│  │  2. Slack — 18次                                     │    │
│  │  3. ...                                              │    │
│  │  Each: PJS 400 13px, bar graph behind text           │    │
│  └──────────────────────────────────────────────────────┘    │
│                                          gap: 24px           │
│  ┌────────────────────────────┐ ┌────────────────────────┐   │
│  │ "拖延模式"                 │ │ "能量曲线"              │   │
│  │ B1 card-soft               │ │ B1 card-soft           │   │
│  │ 50% width                  │ │ 50% width              │   │
│  │                            │ │                        │   │
│  │ Horizontal bar chart:      │ │ Area chart:            │   │
│  │ Most avoided task types    │ │ Hourly avg focus score │   │
│  │ Bar color: #FFD3B6         │ │ Fill: rgba(blue,0.1)   │   │
│  │                            │ │ Line: #79BEEB          │   │
│  │ Bottom: "avg procrastinat" │ │ Highlight: peak hours  │   │
│  │ PJS 400 12px #9E9899       │ │ Annotation: best time  │   │
│  └────────────────────────────┘ └────────────────────────┘   │
│                                          gap: 24px           │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ "打断恢复时间"  A1 Lemon border                       │    │
│  │ full width                                           │    │
│  │ Big number: "平均 4.2 分钟"  QS 700 32px             │    │
│  │ Sparkline below showing trend                        │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 6.6 Tab 3: AI Insights AI 洞察

**文件**：`src/components/statistics/StatisticsAiInsights.tsx`

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  AI Insight Card                                     │    │
│  │  A1 Purple border                                    │    │
│  │  radius: 24px, padding: 24px                         │    │
│  │                                                      │    │
│  │  🤖 "AI 洞察"  JM 500 12px #D4C4FB uppercase        │    │
│  │                                                      │    │
│  │  "你周三的效率总是最低，与每周三的 2 小时全体会议     │    │
│  │   高度相关。建议在会议后安排 15 分钟缓冲时间。"       │    │
│  │  PJS 400 15px #3A3638, line-height: 1.7              │    │
│  │                                                      │    │
│  │  数据依据: "基于过去 4 周的数据分析"                  │    │
│  │  PJS 400 12px #9E9899                                │    │
│  │                                                      │    │
│  │  ┌───────────────┐  ┌────────────┐                   │    │
│  │  │ 👍 有帮助      │  │ 👎 不准确   │                   │    │
│  │  │ btn-secondary  │  │ btn-ghost   │                   │    │
│  │  └───────────────┘  └────────────┘                   │    │
│  └──────────────────────────────────────────────────────┘    │
│                                          gap: 16px           │
│  (Repeat for each insight, typically 3-5 cards)              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  "生成新的洞察"  btn-primary (purple bg: #D4C4FB)     │    │
│  │  text color: #3A3638 (dark on light purple)          │    │
│  │  loading state: skeleton shimmer + "AI 分析中..."     │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 6.7 Tab 4: Growth 成长轨迹 (V3)

```
┌──────────────────────────────────────────────────────────────┐
│  3 growth dimension cards, vertical stack, gap: 24px         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  "时间感知准确度"  A1 Blue                            │    │
│  │  Current: 73%  Trend: ↑ 8% (sparkline)               │    │
│  │  "预估时间 vs 实际时间的偏差率"  PJS 400 13px #9E9899 │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  "打断恢复速度"  A1 Green                             │    │
│  │  Current: 3.2min  Trend: ↑ improved                   │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  "自主启动率"  A1 Pink                                │    │
│  │  Current: 62%  Trend: ↑ 15%                           │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  Placeholder for V3: dashed border card                      │
│  "更多成长维度将在后续版本中加入"                             │
│  border: 2px dashed #D6D3CD, color: #9E9899                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 6.8 交互状态

| 交互 | 行为 |
|------|------|
| Tab switch | Content fades 200ms, underline slides 300ms |
| Chart hover | Tooltip appears at cursor position |
| Metric card hover | A1 cards: shadow 4→6px, translate(-2px,-2px) |
| Time range change | Charts animate/transition data (300ms) |
| AI insight feedback | Button changes to checkmark, fades after 1s |
| "生成新洞察" click | Button shows loading spinner, card skeleton appears |

### 6.9 响应式行为

| 宽度 | 变化 |
|------|------|
| >= 1280px | Metric grid 4 cols, charts 2 cols |
| 1024-1279px | Metric grid 2x2, charts stack vertically |
| < 1024px | All single column |

---

<!-- SECTION 7 -->
## 7. Page 5: Settings 设置

**定位**：一切配置集中管理
**文件路径**：`src/pages/Settings.tsx`, `src/components/Settings/`
**卡片风格**：A2 用于所有 section 容器

### 7.1 页面整体布局 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Main Content Area (960px usable)                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ "Settings"  QS 700 28px                                  │   │
│  │ "所有配置集中管理"  PJS 400 14px #9E9899                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          gap: 32px              │
│  Single column scrollable layout                                │
│  max-width: 720px (centered within 960px)                       │
│  margin: 0 auto                                                │
│                                                                 │
│  ┌──────── Section: 外观 Appearance ────────────────────────┐   │
│  │  A2 card, full width                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          gap: 24px              │
│  ┌──────── Section: 追踪 Tracking ──────────────────────────┐   │
│  │  A2 card, full width                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          gap: 24px              │
│  ┌──────── Section: AI 配置 ────────────────────────────────┐   │
│  │  A2 card, full width                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          gap: 24px              │
│  ┌──────── Section: 执行守护 Execution Guardian ────────────┐   │
│  │  A2 card, full width                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          gap: 24px              │
│  ┌──────── Section: 专注模式 Focus ─────────────────────────┐   │
│  │  A2 card, full width                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          gap: 24px              │
│  ┌──────── Section: 通知 Notifications ─────────────────────┐   │
│  │  A2 card, full width                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          gap: 24px              │
│  ┌──────── Section: 数据 Data ──────────────────────────────┐   │
│  │  A2 card, full width                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                          gap: 24px              │
│  ┌──────── Section: 关于 About ─────────────────────────────┐   │
│  │  A2 card, full width                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Section Card 模板

**所有 section 使用统一的 A2 卡片模板：**

```
┌─── 2px solid #D6D3CD ──────────────────────────────────────────┐
│  shadow: 4px 4px 0px #D6D3CD                                   │
│  radius: 24px, padding: 24px                                   │
│  bg: #FFFFFF                                                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Section Header                                          │   │
│  │  "外观 APPEARANCE"                                       │   │
│  │  QS 700 18px #3A3638 + JM 500 12px #9E9899 uppercase    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                     gap: 20px                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Setting Row (repeating pattern)                         │   │
│  │  flex, justify-between, align-center                     │   │
│  │  padding: 16px 0                                         │   │
│  │  border-bottom: 1px solid #F5F0EA (except last)          │   │
│  │                                                          │   │
│  │  Left:                             Right:                │   │
│  │  Label: PJS 600 14px #3A3638       Control (varies)      │   │
│  │  Description: PJS 400 12px #9E9899                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Setting Row 设置行模板

```
┌────────────────────────────────────────────────────────────────┐
│  flex row, justify-between, align-center                       │
│  padding: 16px 0                                               │
│  border-bottom: 1px solid #F5F0EA                              │
│                                                                │
│  ┌──────────────────────────┐    ┌─────────────────────────┐   │
│  │  Label                   │    │  Control widget         │   │
│  │  PJS 600 14px #3A3638    │    │  (toggle / select /     │   │
│  │                          │    │   input / button)       │   │
│  │  Description             │    │                         │   │
│  │  PJS 400 12px #9E9899    │    │                         │   │
│  │  max-width: 400px        │    │                         │   │
│  └──────────────────────────┘    └─────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 7.4 控件样式 Control Widgets

#### Toggle Switch 开关

```css
.toggle {
  width: 44px;
  height: 24px;
  border: 2px solid #3A3638;
  border-radius: 9999px;       /* pill */
  background: #EDE8E2;         /* off state */
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
}
.toggle.active {
  background: #A8E6CF;         /* on: green */
}
.toggle .knob {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3A3638;
  position: absolute;
  top: 2px;
  left: 2px;                   /* off position */
  transition: left 0.2s ease;
}
.toggle.active .knob {
  left: 22px;                  /* on position */
}
```

#### Select Dropdown 下拉选择

| 属性 | 值 |
|------|-----|
| bg | `var(--color-bg-base)` #FDFBF7 |
| border | `2px solid var(--color-border-strong)` #D6D3CD |
| radius | `12px` |
| padding | `10px 16px` |
| font | PJS 400 14px |
| arrow | Chevron-down icon, 16px, `#9E9899` |
| min-width | `160px` |
| dropdown menu bg | `#FFFFFF` |
| dropdown menu border | `2px solid #D6D3CD` |
| dropdown menu shadow | `4px 4px 0px #D6D3CD` |
| dropdown menu radius | `12px` |
| option padding | `10px 16px` |
| option hover bg | `#FAF7F2` |
| option selected | `bg: rgba(121,190,235,0.12); font-weight: 600` |

#### Radio Group 单选组

| 属性 | 值 |
|------|-----|
| radio size | `20px` diameter |
| border | `2px solid #3A3638` |
| unselected | `bg: transparent` |
| selected fill | semantic color based on context, `12px` inner dot |
| label gap | `8px` from radio |
| label font | PJS 400 14px #3A3638 |
| group gap | `12px` between options |

#### Slider 滑块

| 属性 | 值 |
|------|-----|
| track height | `6px` |
| track bg (unfilled) | `#EDE8E2` |
| track bg (filled) | `var(--color-accent)` #79BEEB |
| track radius | `3px` |
| thumb size | `20px` |
| thumb bg | `#FFFFFF` |
| thumb border | `2px solid #3A3638` |
| thumb radius | `50%` |
| value label | PJS 500 12px, above thumb |

### 7.5 Section Details 各区域内容

#### 7.5.1 外观 Appearance

**文件**：`src/components/Settings/AppearanceSection.tsx`

| 设置项 | 控件类型 | 选项 |
|--------|---------|------|
| 主题 Theme | Toggle (Light/Dark) | `light` / `dark` |
| 强调色 Accent Color | Color picker (6 macaron swatches) | Blue, Purple, Green, Lemon, Coral, Pink |
| 背景皮肤 Skin | Select dropdown | `默认 / 暖白 / 米黄` |

**强调色选择器：**
```
┌─────────────────────────────────────┐
│  6 color swatches in a row:         │
│                                     │
│  ● ● ● ● ● ●                       │
│  24px circles, 2px border #3A3638   │
│  gap: 12px                          │
│  selected: 3px ring offset          │
│  ring: 2px solid [color]            │
│  ring gap: 3px (outline-offset)     │
└─────────────────────────────────────┘
```

#### 7.5.2 追踪 Tracking

| 设置项 | 控件类型 | 默认值 |
|--------|---------|--------|
| 自动追踪 Auto-track | Toggle | ON |
| 追踪规则管理 | Button → opens sub-panel | — |
| 忽略的应用 Ignored Apps | Button → opens list editor | — |
| 隐私级别 Privacy | Radio (标准/增强/最大) | 标准 |
| 空闲检测阈值 Idle Threshold | Slider (1-15 min) | 5 min |

#### 7.5.3 AI 配置 AI Config

| 设置项 | 控件类型 | 默认值 |
|--------|---------|--------|
| AI 提供商 Provider | Select | OpenAI |
| API Key | Password input | — |
| AI 分类规则 | Button → opens rule editor | — |
| AI 语气偏好 Tone | Radio (温和/中性/直接) | 温和 |

**API Key 输入框：**
| 属性 | 值 |
|------|-----|
| type | `password` |
| placeholder | `sk-...` |
| 显示/隐藏按钮 | eye icon toggle, 20px, right side |
| 样式 | Same as standard input (Section 5.7) |

#### 7.5.4 执行守护 Execution Guardian

**文件**：`src/components/Settings/ExecutionGuardianSection.tsx` (new)

| 设置项 | 控件类型 | 选项 | 默认值 |
|--------|---------|------|--------|
| 打断检测灵敏度 | Radio | 宽松(5min) / 标准(2min) / 严格(1min) | 标准 |
| 漫游检测阈值 | Radio | 宽松 / 标准 / 严格 | 标准 |
| 晨间仪式 | Toggle | ON/OFF | ON |
| 日终复盘时间 | Time picker | 自定义 / 关闭 | 21:00 |
| 缓冲时间 | Select | 5 / 10 / 15 分钟 | 5 |
| "只要N分钟" 门槛 | Select | 10 / 15 / 20 / 25 分钟 | 15 |

#### 7.5.5 专注模式 Focus

**文件**：`src/components/Settings/FocusSettingsSection.tsx`

| 设置项 | 控件类型 | 默认值 |
|--------|---------|--------|
| 工作时长 | Slider (15-60 min, step 5) | 25 min |
| 休息时长 | Slider (3-15 min, step 1) | 5 min |
| 长休息时长 | Slider (10-30 min, step 5) | 15 min |
| 长休息间隔 | Select (2-6) | 4 |
| 环境音偏好 | Select | 无 / 白噪音 / 雨声 / 咖啡厅 |
| 干扰屏蔽规则 | Button → opens rule editor | — |

#### 7.5.6 通知 Notifications

| 设置项 | 控件类型 | 默认值 |
|--------|---------|--------|
| 习惯提醒 | Toggle | ON |
| 休息提醒 | Toggle | ON |
| 专注结束提醒 | Toggle | ON |
| AI 主动推送 | Toggle | ON |

#### 7.5.7 数据 Data

| 设置项 | 控件类型 | 说明 |
|--------|---------|------|
| 导出数据 | Button (JSON / CSV) | 两个按钮并排, btn-secondary |
| 本地保留天数 | Slider (30-365, step 30) | 默认 90 天 |
| 云同步 (V2) | Toggle + 标注 "即将推出" | disabled state |

#### 7.5.8 关于 About

| 内容 | 显示 |
|------|------|
| 版本号 | PJS 400 14px, e.g. "v1.0.0" |
| 更新检查 | Button "检查更新", btn-secondary |
| 隐私政策 | Link → `src/pages/PrivacyPolicy.tsx` |

**"恢复默认" 按钮** (每个 section 底部)：
| 属性 | 值 |
|------|-----|
| style | btn-ghost |
| border | `2px dashed #D6D3CD` |
| color | `#9E9899` |
| font | PJS 400 12px |
| padding | `6px 12px` |
| radius | `8px` |

### 7.6 交互状态

| 交互 | 行为 |
|------|------|
| Toggle click | 0.2s slide animation, color transition |
| Setting change | Instant apply (no save button needed) |
| "恢复默认" click | Confirm dialog (Section 11) before resetting |
| Section card hover | No hover effect (static containers) |
| Slider drag | Real-time value label update above thumb |

### 7.7 响应式行为

| 宽度 | 变化 |
|------|------|
| >= 1280px | max-width: 720px centered |
| 1024-1279px | max-width: 100% with 32px padding |
| < 1024px | Full width, setting rows stack vertically (label above control) |

---

<!-- SECTION 8 -->
## 8. Global Overlay: Focus Mode 专注模式

**触发**：Dashboard "开始专注" / Task 任务卡片 "开始"
**文件路径**：`src/pages/FocusMode.tsx`, `src/components/FocusStartedModal.tsx`, `src/components/LaunchBoost.tsx` (new), `src/components/InterruptionAlert.tsx` (new), `src/components/ContextSnapshot.tsx` (new)
**层级**：全屏覆盖层，z-index: 1100
**卡片风格**：A1 Blue/Purple 用于主焦点卡片

### 8.1 Focus Mode 生命周期

```
Trigger "开始"
      │
      ↓
┌──────────────────┐
│  A. Launch Boost  │ ← Step 1: 启动助推 (first step selection)
│  (Modal overlay)  │
└────────┬─────────┘
         │ user clicks "开始 15/25 分钟" or "直接开始"
         ↓
┌──────────────────┐
│  D. Focus Timer   │ ← Step 2: 专注执行中 (pomodoro timer)
│  (Fullscreen)     │
│                   │←──── B. Interruption Alert (popup if off-task)
│                   │←──── C. Context Snapshot (on pause)
└────────┬─────────┘
         │ timer ends or user finishes
         ↓
┌──────────────────┐
│  Completion Modal │ ← Step 3: 完成反馈
│  (celebration)    │
└──────────────────┘
```

### 8.2 Fullscreen Overlay 全屏容器

```css
.focus-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--color-bg-base);     /* #FDFBF7 */
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### 8.3 组件 A: Launch Boost 启动助推

**卡片风格**：A1 Purple

```
┌─── 2px solid #D4C4FB ──────────────────────────────────────────┐
│  shadow: 4px 4px 0px rgba(212,196,251,0.4)                     │
│  radius: 24px, padding: 32px                                   │
│  max-width: 520px, centered                                    │
│  bg: #FFFFFF                                                    │
│                                                                 │
│  "准备开始"  JM 500 12px #D4C4FB uppercase, ls: 1.2px          │
│                                     gap: 8px                    │
│  Task name: "写季度报告"                                        │
│  QS 700 22px #3A3638                                           │
│                                     gap: 24px                   │
│  "你打算先做哪一小步？"                                         │
│  PJS 600 16px #3A3638                                          │
│                                     gap: 12px                   │
│  ┌─── 1px solid #F5F0EA ────────────────────────────────────┐   │
│  │  AI 建议 suggestions  (B1 card-soft)                     │   │
│  │  radius: 16px, padding: 16px                             │   │
│  │  bg: #FAF7F2                                             │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │ ○  打开文档从第三节开始                           │    │   │
│  │  │    PJS 400 14px #5C5658                          │    │   │
│  │  │    padding: 10px, hover: bg #FFFFFF              │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │ ○  先列一个三级小标题大纲                         │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │ ○  回顾上次写到哪里                               │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                     gap: 12px                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 自定义输入: "或者写下你的第一步..."                       │   │
│  │ input: bg #FDFBF7, 2px solid #D6D3CD, r:12px            │   │
│  │ padding: 13px 16px                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                     gap: 24px                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ⏱️ "只要 15 分钟就好"                                   │   │
│  │  PJS 400 14px #9E9899, text-align: center                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                     gap: 12px                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Button row: flex, gap: 12px, justify: center            │   │
│  │                                                          │   │
│  │  ┌─────────────────┐  ┌─────────────────┐               │   │
│  │  │  开始 15 分钟    │  │  开始 25 分钟    │               │   │
│  │  │  btn-primary     │  │  btn-secondary   │               │   │
│  │  │  bg: #79BEEB     │  │  border: #D6D3CD │               │   │
│  │  │  px:20 py:12     │  │  px:20 py:12     │               │   │
│  │  └─────────────────┘  └─────────────────┘               │   │
│  │                                                          │   │
│  │  "直接开始 ↗"  link style, PJS 400 13px #9E9899          │   │
│  │  text-decoration: underline on hover                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  "✕ 取消" link, top-right corner, PJS 400 13px #9E9899   │   │
│  │  position: absolute, top: 16px, right: 16px              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### AI Suggestion Radio Selection

| 状态 | 样式 |
|------|------|
| Unselected | `○` empty circle, 18px, border: 2px solid #D6D3CD |
| Hover | `bg: #FFFFFF`, text: #3A3638 |
| Selected | `●` filled circle, 18px, fill: #D4C4FB, border: 2px solid #3A3638 |

### 8.4 组件 D: Focus Timer 专注计时器

```
┌──────────────────────────────────────────────────────────────┐
│  Fullscreen, centered content                                │
│  bg: #FDFBF7                                                 │
│                                                              │
│  Top bar (fixed): flex row, justify-between                  │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Task: "写季度报告"      [暂停] [结束专注] [✕ 退出]  │    │
│  │  PJS 600 14px #5C5658    btn-ghost x3               │    │
│  │  padding: 16px 32px                                  │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  Center stage:                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │              Timer Circle                             │    │
│  │              240px diameter                           │    │
│  │                                                      │    │
│  │         ┌──────────────────────┐                     │    │
│  │         │                      │                     │    │
│  │         │      18:42           │                     │    │
│  │         │  QS 700 56px #3A3638 │                     │    │
│  │         │                      │                     │    │
│  │         │  "专注中"            │                     │    │
│  │         │  PJS 400 14px #9E9899│                     │    │
│  │         │                      │                     │    │
│  │         └──────────────────────┘                     │    │
│  │                                                      │    │
│  │  Circle progress ring:                                │    │
│  │  stroke: 4px                                         │    │
│  │  track: #EDE8E2                                      │    │
│  │  fill: var(--color-accent) #79BEEB                   │    │
│  │  animation: smooth counter-clockwise                  │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  Below timer (gap: 32px):                                    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  "第一步: 打开文档从第三节开始"                        │    │
│  │  PJS 400 14px #9E9899                                │    │
│  │  bg: #FAF7F2, radius: 12px, padding: 8px 16px        │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  Breathing animation (optional, below timer):                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Pulsing circle, 80px, rgba(121,190,235,0.1)         │    │
│  │  scale: 1 → 1.2 → 1, 4s infinite                     │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  Pomodoro progress (bottom):                                 │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  ● ● ○ ○  (2/4 pomodoros done)                       │    │
│  │  12px dots, filled: #79BEEB, empty: #EDE8E2          │    │
│  │  gap: 8px, centered                                  │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Timer Circle CSS

```css
.timer-circle {
  width: 240px;
  height: 240px;
  position: relative;
}
.timer-circle svg {
  transform: rotate(-90deg);
}
.timer-circle .track {
  stroke: #EDE8E2;
  stroke-width: 4px;
  fill: none;
}
.timer-circle .progress {
  stroke: var(--color-accent);   /* #79BEEB */
  stroke-width: 4px;
  fill: none;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear;
}
.timer-time {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
```

### 8.5 组件 B: Interruption Alert 打断拦截

**触发**：检测到用户切换到非计划应用超过阈值
**文件**：`src/components/InterruptionAlert.tsx`
**卡片风格**：A1 Lemon (warning)

```
┌─── 2px solid #FFD3B6 ──────────────────────────────────────────┐
│  shadow: 4px 4px 0px rgba(255,211,182,0.4)                     │
│  radius: 24px, padding: 24px                                   │
│  max-width: 420px, centered                                    │
│  bg: #FFFFFF                                                    │
│  z-index: 1150 (above focus overlay)                           │
│                                                                 │
│  backdrop: rgba(58,54,56,0.3)                                   │
│                                                                 │
│  "你已经离开一会儿了～"                                         │
│  QS 700 18px #3A3638                                           │
│                                     gap: 8px                    │
│  "你已经离开「写季度报告」7 分钟了"                              │
│  PJS 400 14px #5C5658                                          │
│                                     gap: 24px                   │
│  Button stack: flex-col, gap: 10px, full width                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  "回去继续"  btn-primary (green bg: #A8E6CF)             │   │
│  │  PJS 600 15px, color: #3A3638, full-width                │   │
│  │  shadow: 4px 4px 0px rgba(168,230,207,0.4)              │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  "只是看一眼 (3分钟)" btn-secondary                      │   │
│  │  PJS 600 14px, full-width                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  "有急事，暂停任务" btn-ghost (dashed border)             │   │
│  │  PJS 400 14px #9E9899, full-width                        │   │
│  │  border: 2px dashed #D6D3CD                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### "只是看一眼" 倒计时状态

选择 "只是看一眼" 后，Focus overlay 顶部显示倒计时条：

```
┌──────────────────────────────────────────────────────────┐
│  "看一眼模式 · 剩余 2:47"    [回去继续]                   │
│  bg: rgba(255,211,182,0.15)                              │
│  PJS 500 13px #FFD3B6         btn-sm                     │
│  height: 40px, full width                                │
│  progress bar shrinking from right to left                │
│  bar color: #FFD3B6                                      │
└──────────────────────────────────────────────────────────┘
```

### 8.6 组件 C: Context Snapshot 上下文快照

**触发**：用户选择 "暂停任务"
**文件**：`src/components/ContextSnapshot.tsx`
**卡片风格**：A1 Blue

```
┌─── 2px solid #79BEEB ──────────────────────────────────────────┐
│  shadow: 4px 4px 0px rgba(121,190,235,0.4)                     │
│  radius: 24px, padding: 24px                                   │
│  max-width: 420px                                              │
│                                                                 │
│  "保存进度"  QS 700 18px #3A3638                                │
│                                     gap: 8px                    │
│  "写季度报告 · 已投入 47 分钟"                                   │
│  PJS 400 14px #5C5658                                          │
│                                     gap: 16px                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ "做到哪了？留个备注方便下次恢复"                          │   │
│  │ textarea: bg #FDFBF7, 2px solid #3A3638, r:12px          │   │
│  │ padding: 13px 16px, min-height: 80px                     │   │
│  │ placeholder: "比如：写到了第三节的数据分析部分"           │   │
│  │ PJS 400 14px                                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                     gap: 20px                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ [保存并退出] btn-primary (blue)    [不保存] btn-ghost     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.7 Focus Completion Modal 专注完成弹窗

**文件**：`src/components/FocusCompletedModal.tsx`
**卡片风格**：A1 Green (success)

```
┌─── 2px solid #A8E6CF ──────────────────────────────────────────┐
│  shadow: 4px 4px 0px rgba(168,230,207,0.4)                     │
│  radius: 24px, padding: 32px                                   │
│  max-width: 420px, centered                                    │
│                                                                 │
│  🎉 celebration animation (confetti or checkmark)               │
│  64px centered icon                                            │
│                                     gap: 16px                   │
│  "做得好！"  QS 700 24px #3A3638                                │
│                                     gap: 8px                    │
│  "你专注了 25 分钟完成了这个番茄钟"                              │
│  PJS 400 15px #5C5658                                          │
│                                     gap: 16px                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Stats row: flex, gap: 24px, justify: center              │   │
│  │ ⏱ 25min   📝 写季度报告   🔥 +50 XP                     │   │
│  │ PJS 600 14px                                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                     gap: 24px                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ☐ 标记任务为已完成                                       │   │
│  │ checkbox + PJS 400 14px                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                     gap: 16px                   │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │  继续下一个      │  │  休息一下        │                      │
│  │  btn-primary     │  │  btn-secondary   │                      │
│  │  bg: #79BEEB     │  │                  │                      │
│  └─────────────────┘  └─────────────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.8 交互状态

| 交互 | 行为 |
|------|------|
| Focus overlay enter | 0.3s fadeIn |
| Focus overlay exit | 0.3s fadeOut |
| Timer tick | Smooth SVG stroke-dashoffset update, 1s linear |
| Interruption alert appear | 0.2s scale(0.95→1) + fadeIn, overlay darken |
| "回去继续" click | Alert dismisses, focus resumes, logged as "recovered" |
| "只是看一眼" click | Alert dismisses, 3min countdown bar appears |
| "暂停任务" click | Context Snapshot form appears |
| Completion confetti | 1s animation, auto-dismiss confetti after 2s |
| Break timer | bg changes to softer tone, green accent replaces blue |

---

<!-- SECTION 9 -->
## 9. Global Overlay: Review 日终复盘

**触发**：AI 在设定时间自动弹出（默认 21:00）/ Dashboard 手动点击
**文件路径**：`src/components/DailyReview.tsx` (existing), `src/components/Review.tsx` (new enhanced)
**层级**：z-index: 1000 (modal)
**卡片风格**：A1 Green (positive framing)

### 9.1 Modal Container 模态容器

| 属性 | 值 |
|------|-----|
| overlay bg | `rgba(58, 54, 56, 0.4)` |
| modal width | `600px` |
| modal max-height | `85vh` |
| modal bg | `#FFFFFF` |
| modal border | `2px solid #A8E6CF` |
| modal radius | `24px` |
| modal shadow | `4px 4px 0px rgba(168,230,207,0.4)` |
| modal padding | `32px` |
| overflow-y | `auto` (scrollable content) |
| enter animation | `scale(0.95→1) + fadeIn, 0.25s ease-out` |

### 9.2 Review Flow 复盘流程 (3 Steps)

```
Step indicator: top of modal
┌──────────────────────────────────────────────┐
│  ● ─── ○ ─── ○                               │
│  做了什么   对账   明天                        │
│  PJS 400 12px                                 │
│  active: #A8E6CF    inactive: #EDE8E2        │
│  connector line: 2px, 40px width              │
└──────────────────────────────────────────────┘
```

### 9.3 Step A: 正反馈优先 — 做了什么

```
┌─────────────────────────────────────────────────────────────┐
│  "今日回顾"  QS 700 22px #3A3638                            │
│  "先看看你今天完成了什么 ✨"  PJS 400 14px #9E9899          │
│                                     gap: 24px               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  "工作时间: 6h 42m"  QS 700 20px #3A3638             │   │
│  │  Progress bar: ████████████░░ 84%                    │   │
│  │  bar bg: #F5F1EA, fill: #A8E6CF, h: 8px, r: 4px     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                     gap: 16px               │
│  Completed tasks (green theme):                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ✅  写季度报告第三节                                 │   │
│  │  PJS 500 14px #3A3638                                │   │
│  │  bg: rgba(168,230,207,0.08), padding: 12px           │   │
│  │  radius: 12px, border-left: 3px solid #A8E6CF       │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ✅  团队会议                                         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ✅  代码审查                                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                     gap: 12px               │
│  In-progress tasks (blue theme):                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  🔵  准备周五演示  (进行中 · 已投入 45min)            │   │
│  │  bg: rgba(121,190,235,0.08)                          │   │
│  │  border-left: 3px solid #79BEEB                      │   │
│  │  progress: ████░░ 60%                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                     gap: 24px               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  "你完成了 3 个任务，还有 1 个有进展 👏"              │   │
│  │  PJS 600 15px #A8E6CF, text-align: center            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                     gap: 24px               │
│  ┌───────────────────┐                                      │
│  │  继续 →  btn-primary (green #A8E6CF, text #3A3638)    │   │
│  │  centered                                              │   │
│  └───────────────────┘                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.4 Step B: 结构化对账

```
┌─────────────────────────────────────────────────────────────┐
│  "计划 vs 实际"  QS 700 20px #3A3638                        │
│                                     gap: 20px               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Comparison table:                                   │   │
│  │  ┌───────────┬──────────────┬──────────────┬──────┐  │   │
│  │  │ 时段       │ 计划          │ 实际          │ 状态 │  │   │
│  │  ├───────────┼──────────────┼──────────────┼──────┤  │   │
│  │  │ 09-10     │ 写季度报告    │ VS Code ✅    │ 匹配 │  │   │
│  │  │ 10-11     │ 团队会议      │ Zoom ✅       │ 匹配 │  │   │
│  │  │ 11-12     │ 编码          │ Chrome ⚠️    │ 偏离 │  │   │
│  │  │ ...       │ ...          │ ...          │ ...  │  │   │
│  │  └───────────┴──────────────┴──────────────┴──────┘  │   │
│  │                                                      │   │
│  │  Table header: JM 500 11px #9E9899 uppercase         │   │
│  │  Table cell: PJS 400 13px #3A3638                    │   │
│  │  Row border: 1px solid #F5F0EA                       │   │
│  │  Matched row bg: transparent                         │   │
│  │  Deviated row bg: rgba(255,211,182,0.06)             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                     gap: 20px               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  "打断统计"  PJS 600 14px #3A3638                    │   │
│  │  "今日 8 次打断 · 平均恢复 4.2 分钟"                  │   │
│  │  PJS 400 13px #5C5658                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                     gap: 16px               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  "时间黑洞 Top 3"  PJS 600 14px #FF8C82              │   │
│  │                                                      │   │
│  │  1. 微信  95min (12 个片段)                          │   │
│  │  2. Twitter  42min (8 个片段)                        │   │
│  │  3. YouTube  28min (3 个片段)                        │   │
│  │                                                      │   │
│  │  Each: PJS 400 13px #5C5658                          │   │
│  │  Time: PJS 600 13px #FF8C82                          │   │
│  │  Bar graph behind each (proportional width)          │   │
│  │  bar: rgba(255,140,130,0.12), h: full row, r: 4px   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                     gap: 24px               │
│  [← 上一步]  btn-ghost      [继续 →]  btn-primary          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.5 Step C: 明日一件事

```
┌─────────────────────────────────────────────────────────────┐
│  "明天最重要的一件事"  QS 700 20px #3A3638                  │
│                                     gap: 8px                │
│  "写下明天必须完成的一件事，它会成为明早的第一个推荐任务"     │
│  PJS 400 14px #9E9899                                      │
│                                     gap: 24px               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  input: large, centered                              │   │
│  │  bg: #FDFBF7                                         │   │
│  │  border: 2px solid #3A3638                           │   │
│  │  radius: 16px                                        │   │
│  │  padding: 20px 24px                                  │   │
│  │  font: QS 700 18px #3A3638                           │   │
│  │  placeholder: "比如：完成季度报告终稿"                │   │
│  │  placeholder-color: #9E9899                          │   │
│  │  text-align: center                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                     gap: 32px               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [← 上一步]  btn-ghost                               │   │
│  │  [完成今日复盘 ✓]  btn-primary (green #A8E6CF)       │   │
│  │  text color: #3A3638                                 │   │
│  │  full-width, py: 14px                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  "跳过"  link, PJS 400 12px #9E9899, centered              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.6 交互状态

| 交互 | 行为 |
|------|------|
| Step transition | Content slides left (300ms), step indicator updates |
| "完成今日复盘" click | Success animation (checkmark scale), modal closes after 1s |
| Modal backdrop click | Confirm "确定要跳过复盘吗？" dialog |
| Auto-popup at 21:00 | Gentle slide-up from bottom (400ms), no jarring transition |
| "跳过" click | Modal closes, "明日一件事" not saved |

---

<!-- SECTION 10 -->
## 10. Global Component: StatusBar 系统托盘

**触发**：App 启动后始终显示在系统托盘/桌面悬浮窗
**文件路径**：`src/components/StatusBar/StatusBarWidget.tsx` (new)
**层级**：操作系统级（Tauri system tray），z-index: 1300 for popup panel

### 10.1 System Tray Icon 托盘图标

| 属性 | 值 |
|------|-----|
| icon size | `16x16px` (macOS tray standard) |
| icon design | Simplified Trace logo silhouette |
| icon states | Normal: `#3A3638`, Active tracking: `#79BEEB`, Paused: `#9E9899` |

### 10.2 Popup Panel 弹出面板

**触发**：点击托盘图标

```
┌─── 2px solid #D6D3CD ──────────────────────────┐
│  shadow: 4px 4px 0px #D6D3CD                    │
│  radius: 16px, padding: 16px                    │
│  width: 320px, bg: #FFFFFF                       │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │  Current Task:                           │    │
│  │  "写季度报告"  QS 700 16px #3A3638       │    │
│  │                                          │    │
│  │  Progress bar:                           │    │
│  │  ████████████░░░░░░░░  47min / 2h        │    │
│  │  h:6px, r:3px                            │    │
│  │  fill: #79BEEB, track: #EDE8E2           │    │
│  │  time: JM 400 11px #9E9899               │    │
│  └──────────────────────────────────────────┘    │
│                              gap: 12px           │
│  ┌──────────────────────────────────────────┐    │
│  │  Next: "团队会议 · 10:00"                │    │
│  │  PJS 400 12px #9E9899                    │    │
│  └──────────────────────────────────────────┘    │
│                              gap: 12px           │
│  ┌──────────────────────────────────────────┐    │
│  │  divider: 1px solid #F5F0EA              │    │
│  └──────────────────────────────────────────┘    │
│                              gap: 12px           │
│  ┌──────────────────────────────────────────┐    │
│  │  Quick actions: flex row, gap: 8px       │    │
│  │                                          │    │
│  │  [⏸ 暂停] [⏭ 切换] [📊 详情] [📂 打开]  │    │
│  │  each: 28x28, icon-btn, radius: 8px      │    │
│  │  border: 1px solid #EDE8E2               │    │
│  │  hover: bg #FAF7F2                       │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 10.3 Wandering Detection Nudge 漫游检测提醒

**触发**：5 分钟内切换窗口 > 15 次，每个停留 < 20 秒
**文件**：`src/services/wanderingDetector.ts` (new)

```
┌─── 2px solid #D4C4FB ──────────────────────────┐
│  shadow: 4px 4px 0px rgba(212,196,251,0.4)      │
│  radius: 16px, padding: 16px                    │
│  width: 320px, bg: #FFFFFF                       │
│                                                  │
│  "看起来你不太确定要做什么"                        │
│  PJS 600 14px #3A3638                            │
│                              gap: 8px            │
│  "要不要我帮你选一个任务？"                        │
│  PJS 400 13px #5C5658                            │
│                              gap: 16px           │
│  ┌────────────────────┐  ┌────────────────────┐  │
│  │ 帮我选  btn-primary│  │ 不用了  btn-ghost  │  │
│  │ bg: #D4C4FB        │  │ PJS 400 13px       │  │
│  │ text: #3A3638      │  │ #9E9899            │  │
│  └────────────────────┘  └────────────────────┘  │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 10.4 StatusBar 实现要点

| 要点 | 说明 |
|------|------|
| Tauri system tray | Use `tauri::SystemTray` API for tray icon |
| Panel position | Native popup below tray icon (OS-managed) |
| Data source | Subscribe to `useAppStore` activity + task data |
| Update frequency | Every 10 seconds for timer, real-time for task changes |
| Wandering detection | `src/services/wanderingDetector.ts`, monitors window switch events |

---

<!-- SECTION 11 -->
## 11. 通用交互状态 Interaction States

### 11.1 按钮状态 Button States

#### Primary Button `.btn-primary`

| State | Background | Shadow | Transform | Other |
|-------|-----------|--------|-----------|-------|
| Default | `var(--color-accent)` #79BEEB | `4px 4px 0px #D6D3CD` | `none` | `cursor: pointer` |
| Hover | `var(--color-accent-hover)` #5AACDF | `6px 6px 0px #D6D3CD` | `translate(-2px, -2px)` | — |
| Active/Pressed | `var(--color-accent-hover)` #5AACDF | `2px 2px 0px #D6D3CD` | `translate(0, 0)` | — |
| Focus | same as hover | same as hover | same as hover | `outline: 2px solid var(--color-accent); outline-offset: 2px` |
| Disabled | `#EDE8E2` | `none` | `none` | `cursor: not-allowed; color: #9E9899; opacity: 0.7` |
| Loading | same as default | same as default | `none` | spinner replaces text, 16px, white |

#### Secondary Button `.btn-secondary`

| State | Background | Border | Shadow | Transform |
|-------|-----------|--------|--------|-----------|
| Default | `#FFFFFF` | `2px solid #D6D3CD` | `4px 4px 0px #D6D3CD` | `none` |
| Hover | `#FAF7F2` | `2px solid #D6D3CD` | `6px 6px 0px #D6D3CD` | `translate(-2px, -2px)` |
| Active | `#F5F1EA` | `2px solid #D6D3CD` | `2px 2px 0px #D6D3CD` | `translate(0, 0)` |
| Disabled | `#FAF7F2` | `2px solid #EDE8E2` | `none` | `none` |

#### Ghost Button `.btn-ghost`

| State | Background | Border | Color |
|-------|-----------|--------|-------|
| Default | `transparent` | `2px dashed #D6D3CD` | `#9E9899` |
| Hover | `#FAF7F2` | `2px dashed #D6D3CD` | `#5C5658` |
| Active | `#F5F1EA` | `2px solid #D6D3CD` | `#3A3638` |

### 11.2 卡片状态 Card States

#### Style A (A1/A2) Cards

| State | Shadow | Transform | Other |
|-------|--------|-----------|-------|
| Default | `4px 4px 0px [color]` | `none` | — |
| Hover | `6px 6px 0px [color]` | `translate(-2px, -2px)` | — |
| Active/Click | `2px 2px 0px [color]` | `translate(0, 0)` | 100ms |
| Focus-within | same as hover | same as hover | `outline: 2px solid var(--color-accent); outline-offset: 2px` |

#### Style B (B1) Cards

| State | Shadow | Transform |
|-------|--------|-----------|
| Default | `0 8px 30px rgba(121,190,235,0.08)` | `none` |
| Hover | `0 12px 40px rgba(121,190,235,0.12)` | `translateY(-2px)` |

### 11.3 输入框状态 Input States

| State | Border | Shadow | Other |
|-------|--------|--------|-------|
| Default | `2px solid #3A3638` | `none` | — |
| Hover | `2px solid #3A3638` | `none` | `bg: #FFFFFF` |
| Focus | `2px solid var(--color-accent)` #79BEEB | `0 0 0 3px rgba(121,190,235,0.15)` | — |
| Error | `2px solid #FF8C82` | `0 0 0 3px rgba(255,140,130,0.15)` | error message below in `#FF8C82` PJS 400 12px |
| Disabled | `2px solid #EDE8E2` | `none` | `bg: #F5F1EA; color: #9E9899; cursor: not-allowed` |

### 11.4 Toggle 状态

| State | Track BG | Knob position | Border |
|-------|---------|---------------|--------|
| OFF | `#EDE8E2` | `left: 2px` | `2px solid #3A3638` |
| ON | `#A8E6CF` | `left: 22px` | `2px solid #3A3638` |
| Disabled OFF | `#F5F1EA` | `left: 2px` | `2px solid #EDE8E2` |
| Disabled ON | `rgba(168,230,207,0.5)` | `left: 22px` | `2px solid #EDE8E2` |

### 11.5 全局过渡 Transition Standards

```css
/* Default transition for all interactive elements */
transition: all 0.2s ease;

/* Exceptions */
/* Shadow offset hover: 0.2s ease */
/* Color transitions: 0.15s ease */
/* Layout/size changes: 0.3s ease-out */
/* Modal enter/exit: 0.25s ease-out / 0.2s ease-in */
/* Page transitions: 0.3s ease */
```

### 11.6 Toast 通知

**文件**：`src/components/ui/Toast.tsx`

```
┌─── 2px solid [semantic-color] ─────────────────┐
│  shadow: 4px 4px 0px rgba(...)                  │
│  radius: 12px, padding: 12px 20px               │
│  max-width: 400px                                │
│  position: fixed, top: 24px, right: 24px         │
│  z-index: 1200                                   │
│                                                  │
│  [icon] Message text     [✕]                     │
│  16px   PJS 500 14px     12px close btn           │
│                                                  │
│  enter: slideInRight 0.3s                        │
│  exit: slideOutRight 0.2s                        │
│  auto-dismiss: 4s                                │
└──────────────────────────────────────────────────┘
```

| Type | Border color | Icon color | BG tint |
|------|-------------|------------|---------|
| Success | `#A8E6CF` | `#A8E6CF` | `rgba(168,230,207,0.06)` |
| Error | `#FF8C82` | `#FF8C82` | `rgba(255,140,130,0.06)` |
| Warning | `#FFD3B6` | `#FFD3B6` | `rgba(255,211,182,0.06)` |
| Info | `#79BEEB` | `#79BEEB` | `rgba(121,190,235,0.06)` |

### 11.7 Confirm Dialog 确认对话框

**文件**：`src/components/ConfirmDialog.tsx`

```
┌─── 2px solid #D6D3CD ──────────────────────────┐
│  shadow: 4px 4px 0px #D6D3CD                    │
│  radius: 24px, padding: 24px                    │
│  max-width: 400px, centered                      │
│  bg: #FFFFFF                                     │
│  z-index: 1000                                   │
│                                                  │
│  Title: QS 700 18px #3A3638                      │
│  Message: PJS 400 14px #5C5658                   │
│                              gap: 24px           │
│  ┌────────────────────┐  ┌────────────────────┐  │
│  │  取消  btn-secondary│  │  确认  btn-primary │  │
│  └────────────────────┘  └────────────────────┘  │
│                                                  │
│  For danger: confirm btn uses coral bg #FF8C82   │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 11.8 Skeleton Loading 骨架屏

**文件**：`src/components/ui/Skeleton.tsx`

```css
.skeleton {
  background: linear-gradient(90deg, #F5F1EA 25%, #FAF7F2 50%, #F5F1EA 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

| Element type | Skeleton dimensions |
|-------------|-------------------|
| Card title | `h: 20px; w: 60%` |
| Card body | `h: 14px; w: 100%` (repeated 3x, gap 8px) |
| Metric value | `h: 28px; w: 80px` |
| Avatar | `h: 40px; w: 40px; border-radius: 50%` |
| Chart | `h: 200px; w: 100%; border-radius: 16px` |

### 11.9 Empty State 空状态

**文件**：`src/components/ui/EmptyState.tsx`

```
┌────────────────────────────────────────────────┐
│  centered, padding: 48px                        │
│                                                 │
│  Illustration: 80x80, muted color (#D6D3CD)    │
│                              gap: 16px          │
│  Title: QS 700 18px #3A3638                     │
│  Description: PJS 400 14px #9E9899              │
│  max-width: 360px, text-align: center           │
│                              gap: 24px          │
│  [CTA button] btn-primary (optional)            │
│                                                 │
└────────────────────────────────────────────────┘
```

---

<!-- SECTION 12 -->
## 12. 响应式行为 Responsive Behavior

### 12.1 Breakpoints 断点

| Breakpoint | Width | Sidebar | Layout changes |
|-----------|-------|---------|----------------|
| Desktop XL | >= 1440px | 256px fixed | Content max-width: 1024px, centered |
| Desktop | 1280-1439px | 256px fixed | Default layout |
| Desktop SM | 1024-1279px | 256px fixed | Content fills remaining, cards may reflow |
| Tablet | 768-1023px | Collapsed to 64px (icons only) | Single column layouts |
| Mobile | < 768px | Hidden (hamburger menu) | Full width, stacked |

### 12.2 Sidebar Collapse Behavior

```
Desktop (>= 1024px):
┌──────────────┬──────────────────────────────┐
│  Sidebar     │  Main Content                │
│  256px       │  remaining                   │
│  Full labels │                              │
└──────────────┴──────────────────────────────┘

Tablet (768-1023px):
┌─────┬────────────────────────────────────────┐
│ 64px│  Main Content                          │
│icons│  remaining                             │
│only │                                        │
└─────┴────────────────────────────────────────┘

Mobile (< 768px):
┌──────────────────────────────────────────────┐
│ ☰ hamburger                                  │
│ Main Content (full width)                    │
│                                              │
└──────────────────────────────────────────────┘
```

#### Collapsed Sidebar (64px)

| 属性 | 值 |
|------|-----|
| width | `64px` |
| padding | `12px` |
| nav items | icon only, centered, `40x40px`, tooltip on hover |
| logo | icon only, no brand name |
| section headers | hidden |
| category buttons | hidden (moved to main content area as horizontal strip) |

### 12.3 Page-Specific Responsive Rules

| Page | Desktop (>= 1024) | Tablet (768-1023) | Mobile (< 768) |
|------|-------------------|-------------------|-----------------|
| Dashboard | NowEngine full, C+D side-by-side | NowEngine full, all cards single col | All single col, reduced padding |
| Timeline | Stats 4-col, timeline full | Stats 2x2, timeline full | Stats single col, timeline full |
| Task | 288px sidebar + list | Sidebar collapses to horizontal tabs | No sidebar, view switcher as dropdown |
| Analytics | Metrics 4-col, charts 2-col | Metrics 2x2, charts single col | All single col |
| Settings | 720px centered | Full width | Full width, controls below labels |

### 12.4 Touch Target 触控目标

| Context | Minimum touch target |
|---------|---------------------|
| Buttons | `44px` height minimum |
| Nav items (mobile) | `48px` height |
| Checkboxes (mobile) | `44x44px` tap area |
| List items (mobile) | `48px` height minimum |

### 12.5 Modal/Overlay Responsive

| Overlay | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Morning Ritual | 560px centered modal | 560px centered | Full screen, bottom-sheet style |
| Focus Mode | Full screen | Full screen | Full screen |
| Review | 600px centered modal | 600px centered | Full screen, scrollable |
| Interruption Alert | 420px centered | 420px centered | Full width, bottom: 0, slide-up |
| Context Snapshot | 420px centered | 420px centered | Full width, bottom: 0 |

### 12.6 Typography Scaling

| Element | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Page title (QS 700) | 28px | 24px | 22px |
| Card title (QS 700) | 18px | 16px | 16px |
| Body text (PJS) | 14-15px | 14px | 14px |
| Small text (PJS) | 12-13px | 12px | 12px |
| Timer display (QS 700) | 56px | 48px | 40px |

---

## 附录 A: File Path Reference 文件路径索引

| Component | File Path | Status |
|-----------|-----------|--------|
| App Shell | `src/App.tsx` | Existing |
| Sidebar | `src/components/Sidebar.tsx` | Existing |
| Dashboard | `src/pages/Dashboard.tsx` | Existing |
| NowEngine Card | `src/components/NowEngineCard.tsx` | Existing |
| Morning Ritual | `src/components/MorningRitual.tsx` | Existing |
| Active Tracking Card | `src/components/Dashboard/ActiveTrackingCard.tsx` | Existing |
| Today Stats Cards | `src/components/Dashboard/TodayStatsCards.tsx` | Existing |
| Daily Insights Card | `src/components/Dashboard/DailyInsightsCard.tsx` | Existing |
| Timeline | `src/pages/Timeline.tsx` | Existing |
| Task | `src/pages/Task.tsx` | Existing (rename from Planner) |
| TimeBlock Planner | `src/components/TimeBlockPlanner.tsx` | Existing |
| Analytics | `src/pages/Analytics.tsx` | Existing (rename from Statistics) |
| Statistics Overview | `src/components/statistics/StatisticsOverview.tsx` | Existing |
| Statistics Deep Work | `src/components/statistics/StatisticsDeepWork.tsx` | Existing |
| Statistics AI Insights | `src/components/statistics/StatisticsAiInsights.tsx` | Existing |
| Settings | `src/pages/Settings.tsx` | Existing |
| Appearance Section | `src/components/Settings/AppearanceSection.tsx` | Existing |
| Focus Settings Section | `src/components/Settings/FocusSettingsSection.tsx` | Existing |
| Execution Guardian Section | `src/components/Settings/ExecutionGuardianSection.tsx` | **New** |
| Focus Mode | `src/pages/FocusMode.tsx` | Existing (convert to overlay) |
| Launch Boost | `src/components/LaunchBoost.tsx` | **New** |
| Interruption Alert | `src/components/InterruptionAlert.tsx` | **New** |
| Context Snapshot | `src/components/ContextSnapshot.tsx` | **New** |
| Focus Completed Modal | `src/components/FocusCompletedModal.tsx` | Existing |
| Focus Started Modal | `src/components/FocusStartedModal.tsx` | Existing |
| Daily Review | `src/components/DailyReview.tsx` | Existing |
| Review (enhanced) | `src/components/Review.tsx` | **New** |
| StatusBar Widget | `src/components/StatusBar/StatusBarWidget.tsx` | **New** |
| NowEngine Service | `src/services/nowEngine.ts` | **New** |
| Deviation Detector | `src/services/deviationDetector.ts` | **New** |
| Wandering Detector | `src/services/wanderingDetector.ts` | **New** |
| UI: Button | `src/components/ui/Button.tsx` | Existing |
| UI: Card | `src/components/ui/Card.tsx` | Existing |
| UI: Input | `src/components/ui/Input.tsx` | Existing |
| UI: Modal | `src/components/ui/Modal.tsx` | Existing |
| UI: Badge | `src/components/ui/Badge.tsx` | Existing |
| UI: Toast | `src/components/ui/Toast.tsx` | Existing |
| UI: Skeleton | `src/components/ui/Skeleton.tsx` | Existing |
| UI: EmptyState | `src/components/ui/EmptyState.tsx` | Existing |
| UI: Progress | `src/components/ui/Progress.tsx` | Existing |
| Confirm Dialog | `src/components/ConfirmDialog.tsx` | Existing |
| Theme Config | `src/config/themes.ts` | Existing |
| App Store | `src/store/useAppStore.ts` | Existing |

## 附录 B: Design Token Quick Reference 设计令牌速查

### Colors

| Token | Light | Usage |
|-------|-------|-------|
| `--color-bg-base` | `#FDFBF7` | Page background |
| `--color-bg-surface-1` | `#FFFFFF` | Card background |
| `--color-bg-surface-2` | `#FAF7F2` | Secondary surface |
| `--color-bg-surface-3` | `#F5F1EA` | Tertiary surface |
| `--color-text-primary` | `#3A3638` | Main text |
| `--color-text-secondary` | `#5C5658` | Secondary text |
| `--color-text-muted` | `#9E9899` | Muted/placeholder |
| `--color-border-subtle` | `#F5F0EA` | B1 borders |
| `--color-border-light` | `#EDE8E2` | Dividers |
| `--color-border-strong` | `#D6D3CD` | A2 borders, default |
| `--color-accent` | `#79BEEB` | Primary accent (Blue) |
| `--color-blue` | `#79BEEB` | Info, focus |
| `--color-purple` | `#D4C4FB` | AI, creativity |
| `--color-green` | `#A8E6CF` | Success, completion |
| `--color-lemon` | `#FFD3B6` | Warning, warmth |
| `--color-coral` | `#FF8C82` | Danger, urgent |
| `--color-pink` | `#FFB5D4` | Celebration, reward |

### Border Radius

| Token | Value |
|-------|-------|
| `--radius-sm` | `8px` |
| `--radius-md` | `12px` |
| `--radius-lg` | `16px` |
| `--radius-xl` | `20px` |
| `--radius-2xl` | `24px` |

### Card Style Classes

| Class | Border | Shadow | Radius | Usage |
|-------|--------|--------|--------|-------|
| `.trace-card` (A2) | `2px solid #D6D3CD` | `4px 4px 0px #D6D3CD` | `24px` | Default card |
| `.trace-card-[color]` (A1) | `2px solid [semantic]` | `4px 4px 0px rgba(...)` | `24px` | Emphasis card |
| `.trace-card-soft` (B1) | `1px solid #F5F0EA` | `0 8px 30px rgba(121,190,235,0.08)` | `24px` | Dashboard, charts |
| `.trace-card-flat` (B2) | `none` | `none` | `24px` | Secondary content |

---

*Last updated: 2026-04-21 · Trace Page Design Spec v1.0 — 基于 Dual Layer Macaron 设计系统*
