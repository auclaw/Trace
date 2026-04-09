# Merize 产品设计文档 / Product Design Document

> **Version**: 2.0 (redesign/v2)
> **Last Updated**: 2026-04-08
> **Status**: Active Development

---

## 目录 / Table of Contents

1. [产品愿景 / Product Vision](#1-产品愿景--product-vision)
2. [核心功能：AI 自动追踪 / Core Feature: AI Auto-Tracking](#2-核心功能ai-自动追踪--core-feature-ai-auto-tracking)
3. [导航结构 / Navigation Structure](#3-导航结构--navigation-structure)
4. [宠物系统 / Pet System Design](#4-宠物系统--pet-system-design)
5. [习惯系统 / Habit System Design](#5-习惯系统--habit-system-design)
6. [新手引导 / Onboarding Flow](#6-新手引导--onboarding-flow)
7. [设计令牌 / Design Tokens](#7-设计令牌--design-tokens)
8. [技术架构 / Technical Architecture](#8-技术架构--technical-architecture)

---

<!-- SECTION 1 -->

## 1. 产品愿景 / Product Vision

### 1.1 What is Merize?

Merize is an **AI-powered time management platform** that unifies the best ideas from five category-leading products into a single, cohesive experience purpose-built for the Chinese market:

| Inspiration Source | What We Take | How It Manifests in Merize |
|--------------------|-------------|----------------------------|
| **Rize.io** | Automatic background time tracking with AI categorization | Core tracking engine -- passive, always-on window/app monitoring that requires zero manual input |
| **TickTick / 滴答清单** | Multi-view task planning (list, board, calendar, timeline) | The Planner module with drag-and-drop, subtasks, priorities, and AI smart-reorder |
| **Forest** | Gamification of productivity through a living metaphor | The Pet system -- a virtual companion whose health and growth are tied directly to user productivity |
| **Duolingo** | Engagement psychology: streaks, encouragement, gentle guilt | Dialogue bubbles from the pet, streak celebrations in habits, progressive onboarding |
| **Monday.com** | Project/team management with color-coded status boards | Team module for business users, Kanban/board view in Planner, color-coded category system |

### 1.2 Target Market

- **Primary**: Chinese professionals, knowledge workers, students (zh-CN)
- **Secondary**: English-speaking users in bilingual environments (en-US)
- **All UI strings are bilingual** (zh-CN primary, en-US secondary). The app defaults to system locale and allows manual override in Settings.

### 1.3 Platform Strategy

| Platform | Technology | Data Layer | Purpose |
|----------|-----------|------------|---------|
| **Desktop App** (primary) | Tauri 2 (Rust backend + React frontend) | SQLite local + cloud sync | Full product. Native window tracking, system tray, global hotkeys, autostart. |
| **Web Demo** | Same React frontend, served via Vite | localStorage only | Marketing demo and lightweight access. No native tracking -- shows sample data or manual entry. |

The desktop app is the commercial product. The web demo exists for onboarding, showcasing, and as a fallback for users who cannot install native software (e.g., corporate-locked machines).

### 1.4 Commercial Model

- **Users cannot bring their own API keys.** All AI inference (categorization, summaries, insights, pet dialogue generation) runs through the Merize managed backend.
- This is a deliberate choice for three reasons:
  1. **Consistent quality** -- we control prompt engineering, model selection, and fallback chains.
  2. **Simplified UX** -- no API key management, no quota confusion, no billing surprises from third parties.
  3. **Revenue model** -- AI features are gated by subscription tier, not by token balance.

### 1.5 Subscription Tiers

| Tier | Price | Key Features |
|------|-------|-------------|
| **Free** | 0 | Basic tracking (7-day history), manual categorization, 1 pet, basic stats |
| **Personal / 个人版** | 29 CNY/month or 199 CNY/year | Unlimited history, AI auto-categorization, AI summaries, all pets, habits, focus mode, data export |
| **Business / 商业版** | 59 CNY/user/month | Everything in Personal + Team dashboard, weekly approval, org admin, priority support |

### 1.6 Competitive Positioning

| Competitor | AI Auto-Classify | Chinese-Native | Price | Merize Advantage |
|------------|-----------------|----------------|-------|------------------|
| Rize.io | Yes | No | ~80+ CNY/mo | Full zh-CN, domestic servers, 1/3 price, gamification |
| RescueTime | No (manual) | No | ~85 CNY/mo | AI auto-classify, zh-CN, integrated task planning |
| ManicTime | No | No | Free | Outdated UI, no AI, no mobile |
| Timing (macOS) | No | Partial | ~450 CNY one-time | No AI categorization, macOS only |
| Forest | No tracking | Yes | ~25 CNY one-time | Forest is focus-only; Merize adds full tracking + planning |
| TickTick | No tracking | Yes | ~139 CNY/year | TickTick has no auto-tracking; Merize adds passive monitoring |

---

## 2. 核心功能：AI 自动追踪 / Core Feature: AI Auto-Tracking

### 2.1 How It Works

```
┌─────────────────────────────────────────────────────┐
│                   Tauri Rust Backend                 │
│                                                     │
│  1. Poll active window every 1 second               │
│     → Window title, app name, process name          │
│     → URL (for browsers, if privacy level allows)   │
│                                                     │
│  2. Aggregate into activity segments                 │
│     → Same app + similar title = one segment        │
│     → Minimum segment duration: 10 seconds          │
│     → Idle detection: 5 min no input = pause        │
│                                                     │
│  3. Send segments to AI categorization              │
│     → Rule-based first pass (fast, offline)         │
│     → AI refinement via managed backend             │
│     → User corrections fed back as training signal  │
└─────────────────────────────────────────────────────┘
```

### 2.2 Privacy Levels

Users choose their comfort level during onboarding (and can change anytime in Settings):

| Level | What Is Tracked | What Is Sent to AI | Use Case |
|-------|----------------|-------------------|----------|
| **Level 1: Basic / 基础** | App name only | App name | Privacy-conscious users. Categories are coarse (e.g., "Chrome" = "Browsing"). |
| **Level 2: Standard / 标准** (default) | App name + window title | App name + window title | Good balance. AI can distinguish "VS Code - project-x" from "VS Code - YouTube tutorial". |
| **Level 3: Detailed / 详细** | App name + window title + URL (browsers) | All of the above | Maximum accuracy. AI knows "youtube.com/watch?v=..." is entertainment vs. "youtube.com/watch?v=..." is a tutorial. |

**Privacy guarantees at all levels:**
- Raw tracking data is stored locally first (SQLite in Tauri app directory).
- Cloud sync (if enabled) uses end-to-end encryption.
- Users can choose "local only" mode -- zero data leaves the machine.
- Ignored apps list: user can exclude any app from tracking entirely.
- Auto-delete: configurable auto-purge of raw data after N days (default: 90).

### 2.3 AI Categorization Pipeline

```
Raw Segment
    │
    ▼
┌──────────────────┐     Match?     ┌──────────────┐
│ Rule-Based Pass  │ ──── Yes ────→ │ Category Set │
│ (offline, fast)  │                └──────────────┘
│ e.g., "WeChat"→  │
│   Communication  │
└──────────────────┘
    │ No match
    ▼
┌──────────────────┐                ┌──────────────┐
│ AI Backend Pass  │ ─────────────→ │ Category Set │
│ (Ernie/Doubao/   │                └──────────────┘
│  Qwen API)       │
└──────────────────┘
    │
    ▼
┌──────────────────┐
│ User Correction  │  ← User clicks a time block, picks different category
│ (feedback loop)  │  → Stored as training signal
└──────────────────┘  → Next time similar segment appears, use corrected category
```

**Built-in categories (default set, user can add custom):**

| Category (zh-CN) | Category (en-US) | Color | Examples |
|-------------------|-------------------|-------|----------|
| 编程开发 | Development | `#6366f1` | VS Code, IntelliJ, Terminal |
| 设计创作 | Design | `#ec4899` | Figma, Photoshop, Sketch |
| 写作文档 | Writing | `#8b5cf6` | Word, Notion, Typora |
| 沟通协作 | Communication | `#3b82f6` | WeChat, DingTalk, Feishu, Slack |
| 会议 | Meetings | `#06b6d4` | Zoom, Tencent Meeting, Teams |
| 学习阅读 | Learning | `#10b981` | PDF readers, Coursera, Zhihu |
| 娱乐休闲 | Entertainment | `#f59e0b` | Bilibili, YouTube, Games |
| 社交媒体 | Social Media | `#ef4444` | Weibo, Xiaohongshu, Twitter |
| 邮件 | Email | `#14b8a6` | Outlook, Gmail, QQ Mail |
| 其他 | Other | `#6b7280` | Uncategorized |

### 2.4 Real-Time Timeline

The timeline is the **core visualization** of Merize. It is a vertical time axis (0:00 - 24:00) with colored blocks representing activity segments:

- **Block height** is proportional to duration (visual time = real time).
- **Block color** matches the activity category.
- **Hover** reveals a tooltip: app name, window title, category, start/end time, duration.
- **Click** opens a category reassignment dropdown (user correction).
- **Right-click** offers delete (with confirmation).
- **Current moment** is marked with a pulsing accent-colored indicator.
- **Gaps** (idle time, breaks) are shown as empty space on the timeline.

### 2.5 Plan vs. Actual Comparison

When a user has tasks in the Planner with estimated durations, the Timeline can overlay "planned blocks" (semi-transparent) alongside "actual blocks" (solid). This comparison answers: "Did I spend my time the way I intended?"

- Planned blocks appear as dashed outlines on the left side of the timeline.
- Actual tracked blocks appear as solid fills on the right side.
- A summary card shows: planned total, actual total, delta, and an AI-generated insight (e.g., "You planned 4h of coding but only did 2.5h. Meetings ate 1.5h more than expected.").

---

## 3. 导航结构 / Navigation Structure

### 3.1 Sidebar Layout (Restructured for v2)

The sidebar is fixed at 260px width on the left. Navigation is organized into logical groups:

```
┌──────────────────────────────┐
│  🟠 Merize                   │  ← Logo + brand name
│  ● 正在追踪  [暂停]          │  ← Tracking status indicator
├──────────────────────────────┤
│                              │
│  ◇ 仪表盘      Dashboard     │  /
│  ◇ 时间线      Timeline      │  /timeline        ★ CORE
│  ◇ 计划任务    Planner        │  /planner
│  ◇ 专注模式    Focus Mode     │  /focus
│                              │
│  ── 个人成长 ──               │
│  ◇ 习惯打卡    Habits         │  /habits
│  ◇ 统计分析    Statistics     │  /statistics
│  ◇ 我的宠物    Pet            │  /pet
│                              │
│  ── 团队协作 (商业版) ──      │
│  ◇ 团队仪表盘  Team           │  /team
│                              │
├──────────────────────────────┤
│  ◇ 设置        Settings       │  /settings
└──────────────────────────────┘
```

### 3.2 Page Specifications

#### 3.2.1 仪表盘 / Dashboard (`/`)

The daily overview -- the first thing users see when they open the app.

**Layout:**
- **Top row**: Stat cards (4-column grid)
  - Total tracked time today
  - Number of activities
  - Top category (by time)
  - Focus score (percentage of time in "productive" categories)
- **Middle**: Compact timeline preview (today, horizontal or vertical, showing last 6-8 hours)
  - Click "View Full Timeline" to navigate to `/timeline`
- **Bottom row**: Two cards side by side
  - Left: Today's planned tasks (top 5 from Planner, with completion status)
  - Right: AI daily insight (one-paragraph summary generated at end of day, or "Keep going!" during the day)
- **Pet widget**: Mini pet avatar in bottom-right corner with a dialogue bubble (see Section 4)

#### 3.2.2 时间线 / Timeline (`/timeline`) -- THE CORE VIEW

This is the Rize-style activity log, the single most important screen in the app.

**Layout:**
- **Header**: Date selector (today by default, arrow buttons for prev/next day, calendar picker for jump)
- **Main area**: Full vertical timeline (0:00 to 24:00)
  - Color-coded activity blocks (see Section 2.4)
  - Left gutter: hour markers
  - Right side: category legend (collapsible)
- **Side panel** (collapsible): Category breakdown for selected day
  - Pie chart or horizontal bar chart
  - List of categories with time and percentage
- **Plan overlay toggle**: Button to show/hide planned blocks alongside actual (see Section 2.5)
- **Interactions**:
  - Scroll vertically through the day
  - Hover block = tooltip
  - Click block = reassign category
  - Right-click block = delete
  - Drag to select time range = view stats for that range
  - Keyboard: arrow keys to navigate between blocks

#### 3.2.3 计划任务 / Planner (`/planner`)

Multi-view task management inspired by TickTick and Monday.com.

**Views** (tabs at top):
1. **List View** (default): Task list grouped by priority or project
   - Each task: checkbox, title, priority badge, project tag, estimated time, actual tracked time, progress bar
   - Subtasks: expandable, each with own checkbox
   - "AI Smart Reorder" button: AI re-sorts tasks based on urgency, estimated duration, and historical patterns
2. **Board View**: Kanban columns (To Do / In Progress / Done / Blocked)
   - Drag-and-drop between columns
   - Cards show title, priority, assignee (team mode)
3. **Calendar View**: Month grid with tasks placed on their due dates
   - Color-coded by priority or project
   - Click date to see that day's tasks
   - Heatmap overlay showing task density
4. **Timeline View**: Gantt-style horizontal timeline
   - Tasks as horizontal bars spanning start → due date
   - Drag to adjust dates
   - Dependencies shown as connecting lines (future feature)

**Task properties:**
- Title (required)
- Description (optional, markdown)
- Priority: P1 (urgent/red), P2 (high/orange), P3 (medium/yellow), P4 (low/blue), P5 (none/gray)
- Estimated duration (hours:minutes)
- Due date/time
- Project/tag
- Subtasks (unlimited nesting, one level)
- Recurrence (daily, weekdays, weekly, monthly, custom)
- Linked app/keyword (for automatic time tracking association)

#### 3.2.4 专注模式 / Focus Mode (`/focus`)

Combines pomodoro timer with distraction blocking.

**Layout (Z-pattern):**
- **Top-left**: Today's focus goal (editable text input)
- **Center**: Large timer display (MM:SS), breathing animation (scale 1.0 to 1.02, 4s cycle)
- **Bottom**: AI focus insight / encouragement message
- **Non-focus elements**: Auto-fade to 30% opacity + 1px blur; restore on hover

**Pomodoro integration:**
- Default: 25min focus / 5min break / 15min long break every 4 cycles
- Fully customizable durations in Settings
- Auto-start next cycle option
- Sound notification at cycle boundaries (customizable or mutable)

**Distraction blocking:**
- During active focus session, configured blocked apps/websites are intercepted
- Block list managed in Settings > Flow Blocks
- Supports: website domains (browser extension or DNS-level in desktop) and app names
- "Soft block" mode: shows warning overlay ("Are you sure? You're in focus mode.") instead of hard block
- "Hard block" mode: completely prevents access until session ends

#### 3.2.5 习惯打卡 / Habits (`/habits`)

See Section 5 for full design.

#### 3.2.6 统计分析 / Statistics (`/statistics`)

Merged view combining general stats, deep work analysis, and AI insights (previously three separate pages).

**Tabs:**
1. **Overview / 总览**: Weekly pie chart by category, daily bar chart, trending comparison (this week vs last week)
2. **Deep Work / 深度工作**: Continuous focus session analysis, longest streak, daily deep work hours trend, goal tracking
3. **AI Insights / AI 洞察**: AI-generated weekly/monthly summaries, productivity patterns, personalized recommendations
4. **Export / 导出**: Export JSON, CSV, PDF. Generate shareable weekly report image (PNG).

#### 3.2.7 我的宠物 / Pet (`/pet`)

See Section 4 for full design.

#### 3.2.8 设置 / Settings (`/settings`)

**Setting groups:**

| Group | Settings |
|-------|----------|
| **Display / 显示** | Theme color (5 options), Light/Dark mode, Skin style (gradient/solid/glassmorphism) |
| **Modules / 功能模块** | Toggle visibility: Keyboard shortcuts, Focus mode, Pomodoro, PDF export, Onboarding tour, Idle detection |
| **Tracking / 追踪** | Tracking on/off, Privacy level (1/2/3), Ignored apps list |
| **Flow Blocks / 分心屏蔽** | Blocked websites list, Blocked apps list, Block mode (soft/hard) |
| **Privacy & Sync / 隐私同步** | Local-only mode / Summary-only sync / Full sync (E2E encrypted), Auto-delete old data (N days) |
| **Data / 数据** | Export JSON, Export CSV, Clear all data (with confirmation) |
| **Account / 账户** | Subscription tier display, Logout |

#### 3.2.9 团队 / Team (`/team`) -- Business Tier Only

Sub-pages:
- **Team Dashboard**: Aggregate stats for the team (total focus hours, category breakdown per member)
- **Team Focus**: Live view of who is currently focused and on what
- **Weekly Approval**: Manager reviews team members' weekly summaries
- **Org Admin**: Member management, seat allocation, billing

---

## 4. 宠物系统 / Pet System Design

### 4.1 Art Style

- **Pixel art or 2D cute illustration style** (not 3D, not realistic)
- Inspired by Tamagotchi aesthetics crossed with modern pixel art games
- Each pet has idle animation (breathing/blinking), happy animation, sad animation, sleeping animation, eating animation
- Art should feel warm, handcrafted, and endearing -- consistent with the warm design language of the app

### 4.2 Available Pets

| Pet | zh-CN | Unlock Condition |
|-----|-------|-----------------|
| Cat / 猫咪 | 默认 | Free (default starter) |
| Dog / 狗狗 | 等级 5 | Reach user level 5 |
| Rabbit / 兔子 | 等级 10 | Reach user level 10 |
| Bird / 小鸟 | 等级 15 | Reach user level 15 |

Users can switch between unlocked pets at any time. Only one pet is active.

### 4.3 Naming

- Users **name their pet** during onboarding (or on first visit to Pet page).
- Name is displayed in dialogue bubbles and throughout the UI.
- Name can be changed at any time from the Pet page.
- Default name if user skips: "小橙" (Little Orange, matching the brand accent).

### 4.4 Pet Stats

| Stat | Range | Decay Rate | Recovery Method |
|------|-------|-----------|----------------|
| **Hunger / 饥饿度** | 0-100 | -2 per hour | Feed with coins (earned from tasks) |
| **Mood / 心情** | 0-100 | -1 per hour of inactivity | Complete tasks, focus sessions |
| **Energy / 精力** | 0-100 | -1 per focus session | Rest (non-focus time), sleep (overnight auto-recovery) |
| **XP / 经验值** | 0-∞ | Does not decay | Earned from productivity actions (see below) |
| **Level / 等级** | 1-99 | Does not decay | XP thresholds: Level N requires N * 100 XP |

### 4.5 XP & Coin Economy

**Earning XP:**

| Action | XP Earned |
|--------|----------|
| Complete a focus session (25 min) | +20 XP |
| Complete a task | +10 XP |
| Complete a subtask | +3 XP |
| Maintain a habit streak (per day) | +5 XP |
| Log 4+ hours of productive time | +15 XP |
| Log 8+ hours of productive time | +30 XP (bonus) |

**Earning Coins:**

| Action | Coins Earned |
|--------|-------------|
| Complete a task | +5 coins |
| Complete a focus session | +10 coins |
| 7-day habit streak | +20 coins |
| Weekly productivity goal met | +50 coins |

**Spending Coins:**

| Item | Cost | Effect |
|------|------|--------|
| Feed pet (small snack) | 5 coins | +20 hunger |
| Feed pet (full meal) | 15 coins | +50 hunger, +10 mood |
| Pet toy | 10 coins | +30 mood |
| Pet accessory (cosmetic) | 50-200 coins | Unlocks hat, collar, background, etc. |

### 4.6 Productivity Link

The pet's state directly reflects the user's behavior:

- **Focus time**: Each completed pomodoro = +mood, +XP. Longer focus streaks = bonus mood.
- **Task completion**: Each completed task = coins and mood boost. Pet does a happy dance animation.
- **Distraction**: If the user spends >30 min on entertainment/social media during a planned focus block, pet mood drops. Pet shows sad animation.
- **Neglect**: If the user does not open the app for 24+ hours, hunger drops significantly. Pet shows hungry/sad state.
- **Streaks**: Maintaining habit streaks keeps mood high. Breaking a streak causes a mood dip.

### 4.7 Duolingo-Style Dialogue System

The pet communicates through dialogue bubbles. These appear:
1. On the Pet page (main interaction area)
2. As a mini-widget on other pages (bottom-right corner, small avatar + short bubble)

**Dialogue categories:**

| Trigger | Tone | Example (zh-CN) | Example (en-US) |
|---------|------|------------------|------------------|
| Morning greeting | Cheerful | "早上好！今天也一起加油吧~" | "Good morning! Let's crush it today~" |
| Focus session started | Supportive | "专注模式开启！我会安静陪着你的~" | "Focus mode on! I'll be right here quietly~" |
| Focus session completed | Celebrating | "太厉害了！25分钟的专注，你真棒！" | "Amazing! 25 minutes of pure focus!" |
| Task completed | Happy | "又完成了一个任务！继续保持~" | "Another task down! Keep it up~" |
| Long idle (>2h no activity) | Gentle nudge | "你去哪了呀？我有点想你了..." | "Where did you go? I missed you..." |
| Returning after long absence | Slightly guilt-tripping, mostly sweet | "你终于回来了！我一个人等了好久呢..." | "You're finally back! I waited so long..." |
| Hunger low (<30) | Pleading | "肚子好饿...能给我吃点东西吗？" | "So hungry... can you feed me?" |
| Mood low (<30) | Sad | "今天不太开心...能陪我玩一会吗？" | "Not feeling great today... play with me?" |
| High productivity day | Proud | "今天效率超高！我为你骄傲！" | "What a productive day! I'm so proud!" |
| Streak milestone (7 days) | Excited | "连续7天打卡！你太棒了！！！" | "7-day streak! You're incredible!!!" |
| Distraction detected | Gentle reminder | "嗯...是不是该回去工作了呀？" | "Um... shouldn't we get back to work?" |
| Night time (after 22:00) | Caring | "已经很晚了，注意休息哦~" | "It's getting late, don't forget to rest~" |

**Implementation**: Dialogues are selected from a pool based on triggers, with randomization to avoid repetition. Premium tier can have AI-generated contextual dialogues via the backend.

### 4.8 Mini Pet Widget

On all pages except the Pet page itself, a mini pet widget appears in the bottom-right corner:
- Small avatar (48x48 px) showing current pet with current mood animation
- Short dialogue bubble (max 2 lines, auto-dismiss after 5 seconds)
- Click on pet avatar to navigate to full Pet page
- Can be minimized/hidden via Settings
- Does not overlap with essential content (absolute positioned, z-index managed)

---

## 5. 习惯系统 / Habit System Design

### 5.1 Habit Types

| Type | Description | Example |
|------|------------|---------|
| **Single-check / 单次打卡** | One completion per day | "Meditate", "Read 30 minutes" |
| **Multi-check / 多次打卡** | Multiple completions per day (N checks) | "Drink 8 cups of water" (8 checks), "Take 10,000 steps" (1 progress bar) |
| **Timed / 计时** | Linked to tracked time in a category | "Code for 2 hours" (auto-completes when tracking shows 2h in Development category) |

### 5.2 Habit Properties

- **Name**: User-defined (e.g., "Drink water / 喝水")
- **Emoji icon**: Selected from predefined set or custom
- **Color**: Selected from 8 predefined colors
- **Frequency**: Daily, specific weekdays (e.g., Mon/Wed/Fri), X times per week
- **Target count** (multi-check only): Number of checks per day (e.g., 8)
- **Reminder times**: Multiple reminders per habit (e.g., 08:00, 12:00, 18:00)
- **Category**: User-defined groups (e.g., Health, Learning, Fitness)
- **Start date**: When the habit tracking begins
- **Archived**: Soft-delete; habit disappears from active list but data is preserved

### 5.3 Visual Design

**Habit card layout:**
```
┌─────────────────────────────────────────┐
│  💧 喝水                    🔥 23天连续  │  ← Emoji + name + streak badge
│  今日: ○ ○ ● ● ● ○ ○ ○    5/8 完成     │  ← Multi-check circles + count
│                                         │
│  ┌─┬─┬─┬─┬─┬─┬─┐                      │
│  │ │ │█│█│ │█│ │  ← 30-day heatmap     │
│  │█│ │█│█│█│█│ │     (green intensity   │
│  │█│█│█│█│█│█│█│      = completion %)   │
│  │█│█│ │█│█│ │█│                        │
│  └─┴─┴─┴─┴─┴─┴─┘                      │
│  本月完成率: 78%                         │
└─────────────────────────────────────────┘
```

### 5.4 Streak System

- **Current streak**: Consecutive days of completion (resets to 0 on missed day)
- **Best streak**: All-time longest streak (never resets)
- **Streak milestones**: 3, 7, 14, 21, 30, 50, 100, 365 days
- **Celebration animations**:
  - 3-day: Confetti burst (small)
  - 7-day: Confetti + pet happy dance + "streak badge" awarded
  - 14-day: Full-screen celebration with fireworks
  - 30-day: Golden celebration + special pet dialogue
  - 100-day: Platinum celebration + exclusive pet accessory unlocked
  - 365-day: Diamond celebration + unique pet evolution

### 5.5 Duolingo-Style Encouragement

Messages appear as toast notifications or in the pet dialogue bubble:

| Trigger | Message Style | Example |
|---------|--------------|---------|
| First check of the day | Cheerful | "Good start! / 好的开始！" |
| All checks completed | Celebrating | "Perfect day! / 完美的一天！" |
| Streak about to break (evening, not checked in) | Urgent-sweet | "Don't break your 15-day streak! / 别让15天的连续记录断了！" |
| Streak broken | Compassionate | "It's okay, let's start fresh! / 没关系，重新开始！" |
| New personal best streak | Proud | "New record! 30 days! / 新纪录！30天！" |
| Return after missed days | Welcoming | "Welcome back! Your habits missed you. / 欢迎回来！" |

### 5.6 30-Day Heatmap

- Grid of 30 squares (or 5 weeks x 7 days) showing the last 30 days
- Color intensity: 0% = empty/gray, 1-50% = light accent, 51-99% = medium accent, 100% = full accent
- For multi-check habits, intensity = (checks completed / target) * 100%
- Today's square has a border highlight
- Hover shows date and completion details

### 5.7 Categories

Users can organize habits into categories:
- Default categories: Health / 健康, Learning / 学习, Fitness / 运动, Mindfulness / 身心, Custom
- Categories are shown as collapsible groups on the Habits page
- Each category can have its own color

---

## 6. 新手引导 / Onboarding Flow

### 6.1 Flow Overview

```
App First Launch
    │
    ▼
Step 1: Welcome Screen
    "Welcome to Merize! / 欢迎来到 Merize！"
    Brief value prop (3 bullet points)
    [Get Started / 开始使用]
    │
    ▼
Step 2: Choose Your Pet
    Display all starter pets (cat is free, others shown as locked)
    User selects pet → names it
    Pet does a greeting animation
    │
    ▼
Step 3: Set Daily Goals
    "How much focused time do you want each day? / 你每天想要多少专注时间？"
    Slider: 2h / 4h / 6h / 8h (default 4h)
    "What categories matter most? / 哪些分类最重要？"
    Select top 3 categories from the default set
    │
    ▼
Step 4: Choose Modules
    Checkboxes for optional modules:
    ☑ Habits / 习惯打卡
    ☑ Focus Mode / 专注模式
    ☑ Pet / 宠物系统
    ☐ Team / 团队 (requires Business tier)
    "You can change these anytime in Settings."
    │
    ▼
Step 5: Privacy Level
    "How much should Merize track? / Merize 应该追踪多少？"
    Radio buttons for Level 1 / 2 / 3 (see Section 2.2)
    Clear explanation of each level
    Default: Level 2 (Standard)
    │
    ▼
Step 6: Quick Tour
    Interactive spotlight tour of key UI elements:
    1. Sidebar navigation (highlight, explain)
    2. Tracking status indicator (show pause/resume)
    3. Timeline (show a sample day)
    4. Pet widget (pet waves hello)
    "You're all set! / 准备就绪！"
    │
    ▼
Dashboard (main app)
```

### 6.2 Tour Implementation

- Uses spotlight/overlay pattern: darkened background with a bright cutout around the featured element
- Each step has: title, description (bilingual), "Next" button, "Skip tour" link
- Tour can be replayed from Settings > Features > Onboarding Tour
- Tour state saved in localStorage (`onboarding_completed: true`)

---

## 7. 设计令牌 / Design Tokens

### 7.1 Theme System

Merize ships with **5 color themes**. Each theme defines an accent color palette; the base neutrals (backgrounds, text, borders) adapt to warm-shift toward that accent.

| Theme | zh-CN | Accent Primary | Accent Hover | Accent Soft | Default? |
|-------|-------|---------------|-------------|-------------|----------|
| **Vitality Orange / 活力橙** | 活力橙黄 | `#ff4f00` | `#e64600` | `rgba(255,79,0,0.10)` | Yes (default) |
| **Ocean Blue / 清爽天蓝** | 清爽天蓝 | `#5aa9e6` | `#4a95cc` | `rgba(90,169,230,0.10)` | |
| **Forest Green / 自然翠绿** | 自然翠绿 | `#34c759` | `#2db04d` | `rgba(52,199,89,0.10)` | |
| **Elegant Purple / 优雅紫调** | 优雅紫调 | `#af52de` | `#9b45c7` | `rgba(175,82,222,0.10)` | |
| **Sakura Pink / 柔粉樱花** | 柔粉樱花 | `#ff2d55` | `#e6284c` | `rgba(255,45,85,0.10)` | |

### 7.2 Light Mode Palette

```
Background (base):      #fffefb    (warm cream, not pure white)
Background (surface):   #ffffff    (card surfaces)
Background (sidebar):   #faf6f1    (warm-tinted sidebar)
Background (muted):     #f5f0ea    (grouped/secondary areas)

Text (primary):         #201515    (warm near-black with reddish undertone)
Text (secondary):       #36342e    (warm dark charcoal)
Text (muted):           #939084    (warm mid-gray)

Border (default):       #c5c0b1    (warm sand -- primary structural element)
Border (subtle):        #eceae3    (light sand)
Border (strong):        #36342e    (dark charcoal for emphasis)

Shadow base color:      rgba(44, 24, 16, X)  (warm brown-tinted, NOT gray)
```

### 7.3 Dark Mode Palette

```
Background (base):      #1a1614    (warm dark, not blue-dark)
Background (surface):   #25201e    (warm dark surface)
Background (sidebar):   #1e1812    (warm dark sidebar)
Background (muted):     #1f1914    (warm dark grouped)

Text (primary):         #f8f5f0    (warm off-white)
Text (secondary):       #d1cdc4    (warm light gray)
Text (muted):           #a19d94    (warm muted)

Border (default):       #4a4640    (warm dark gray)
Border (subtle):        #3a3028    (subtle warm dark)
Border (strong):        #5a524a    (stronger dark border)

Shadow base color:      rgba(0, 0, 0, X)  (standard dark shadows)
Accent adjustment:      Slightly lighter than light mode for visibility
```

### 7.4 Typography

| Role | Font | Size | Weight | Line Height |
|------|------|------|--------|-------------|
| **Chinese body text** | Noto Sans SC | 14-16px | 400 | 1.6-1.8 |
| **English body text** | Inter | 14-16px | 400 | 1.5 |
| **Headings (all languages)** | Inter / Noto Sans SC | 18-32px | 600-700 | 1.2 |
| **Metrics / large numbers** | Inter | 32-40px | 700 | 1.0 |
| **Timer display** | Inter | 48px | 300 (light) | 1.0 |
| **Captions / labels** | Inter / Noto Sans SC | 12-13px | 500 | 1.4 |
| **Uppercase labels** | Inter | 12px | 600 | 1.0 |

Font stack:
```css
--font-sans: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Principles:**
- Noto Sans SC is the primary CJK font; Inter handles Latin characters, numbers, and UI chrome.
- Never use font size smaller than 12px.
- Chinese text gets slightly more generous line-height (1.6-1.8) for readability.
- Tabular numbers (`font-variant-numeric: tabular-nums`) for all time/stat displays.

### 7.5 Spacing & Radius

**Spacing scale** (base unit 4px):
```
4px / 8px / 12px / 16px / 20px / 24px / 32px / 40px / 48px / 64px
```

**Border radius scale:**
```
sm:    6px    (buttons, inputs, small chips)
md:    10px   (task rows, tags, sidebar items)
lg:    16px   (cards, panels -- primary container radius)
xl:    20px   (modals, floating panels)
2xl:   24px   (hero sections, large containers)
full:  9999px (pills, avatars, circular elements)
```

### 7.6 Shadows (Warm-Tinted)

A critical design detail: all shadows use warm brown base color, not gray/black.

```css
--shadow-xs:   0 1px 2px rgba(44, 24, 16, 0.04);
--shadow-sm:   0 2px 8px rgba(44, 24, 16, 0.06);
--shadow-md:   0 4px 16px rgba(44, 24, 16, 0.08);
--shadow-lg:   0 8px 32px rgba(44, 24, 16, 0.10);
--shadow-xl:   0 16px 48px rgba(44, 24, 16, 0.12);
--shadow-hover: 0 8px 24px rgba(44, 24, 16, 0.10), 0 2px 8px rgba(44, 24, 16, 0.04);
```

### 7.7 Skin Styles

In addition to theme colors, users can choose a "skin" that affects card rendering:

| Skin | zh-CN | Description |
|------|-------|-------------|
| **Gradient / 通透渐变** | 通透渐变 | Cards have subtle gradient backgrounds, warm surface tints |
| **Solid / 纯净纯色** | 纯净纯色 | Flat white cards with border-forward structure (Zapier-inspired) |
| **Glass / 玻璃拟态** | 玻璃拟态 | Frosted glass cards: `backdrop-filter: blur(16px); background: rgba(255,255,255,0.72)` |

### 7.8 Motion & Animation

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| Card hover lift | 200ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Cards translate Y -2px + shadow increase |
| Sidebar item hover | 150ms | ease | Background color fade-in |
| Checkbox bounce | 150ms | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` (spring) | Scale 1 -> 1.1 -> 1 on check |
| Page transition | 200ms | ease | Fade between route changes |
| Focus breathing | 4000ms | ease-in-out | Timer container scales 1.0 -> 1.02 -> 1.0 |
| Metric entrance | 400ms | ease-out | Fade up from +8px translateY |
| Celebration confetti | 2000ms | ease-out | Particle burst on streak milestones |
| Pet idle animation | 3000ms loop | ease-in-out | Subtle bobbing/breathing |
| Tracking pulse | 1500ms loop | ease-in-out | Orange dot scale pulse on "tracking active" |

---

## 8. 技术架构 / Technical Architecture

### 8.1 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Machine                       │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Tauri 2 Shell                       │  │
│  │                                                       │  │
│  │  ┌─────────────────┐    ┌──────────────────────────┐  │  │
│  │  │   Rust Backend   │    │     React Frontend       │  │  │
│  │  │                 │    │                          │  │  │
│  │  │  - Window poll  │    │  - React 18              │  │  │
│  │  │  - SQLite store │◄──►│  - TypeScript            │  │  │
│  │  │  - System tray  │IPC │  - Zustand (state)       │  │  │
│  │  │  - Autostart    │    │  - Tailwind CSS          │  │  │
│  │  │  - Global keys  │    │  - Framer Motion         │  │  │
│  │  │  - Idle detect  │    │  - React Router          │  │  │
│  │  │                 │    │  - Recharts              │  │  │
│  │  └─────────────────┘    └──────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────┐                                           │
│  │ SQLite DB    │  Local data storage (activities,          │
│  │ (app dir)    │  tasks, habits, pet state, settings)      │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
           │
           │ HTTPS (encrypted)
           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Merize Cloud Backend                       │
│                                                             │
│  ┌──────────────────┐    ┌──────────────────────────────┐  │
│  │  Python Flask     │    │  AI Service Layer            │  │
│  │                  │    │                              │  │
│  │  - Auth (phone   │    │  - Ernie (Baidu)             │  │
│  │    SMS + WeChat)  │    │  - Doubao (ByteDance)        │  │
│  │  - Data sync     │    │  - Qwen (Alibaba)            │  │
│  │  - Subscription  │    │  - Fallback chain:           │  │
│  │    management    │    │    Ernie → Doubao → Qwen     │  │
│  │  - API gateway   │    │  - Prompt management         │  │
│  │                  │    │  - Rate limiting per user    │  │
│  └──────────────────┘    └──────────────────────────────┘  │
│                                                             │
│  ┌──────────────────┐                                       │
│  │  Cloud Database   │  User accounts, sync data,           │
│  │  (PostgreSQL)    │  subscription state, AI feedback      │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Frontend Stack

| Technology | Version | Role |
|-----------|---------|------|
| **React** | 18.x | UI framework |
| **TypeScript** | 5.x | Type safety |
| **Zustand** | 5.x | Global state management (single store: `useAppStore`) |
| **Tailwind CSS** | 3.x | Utility-first styling |
| **Framer Motion** | (to add) | Animations (celebrations, page transitions, pet animations) |
| **React Router** | 7.x | Client-side routing |
| **Recharts** | 2.x | Charts (pie, bar, line, area) |
| **Vite** | 5.x | Build tool and dev server |
| **html-to-image** | 1.x | Screenshot generation for shareable reports |
| **jsPDF** | 4.x | PDF export |
| **uuid** | 13.x | ID generation |

### 8.3 Desktop Stack (Tauri 2)

| Technology | Role |
|-----------|------|
| **Tauri 2** (Rust) | Native shell: window management, system tray, global shortcuts |
| **Tauri Autostart Plugin** | Launch on system boot |
| **Tauri Global Shortcut Plugin** | Keyboard shortcuts (e.g., Cmd+Shift+F for focus mode) |
| **Tauri Notification Plugin** | Native OS notifications |
| **Active Window Polling** (Rust) | Read foreground window title, app name, PID every 1s |
| **SQLite** (via Tauri) | Local persistent storage |
| **IPC** (Tauri commands) | Frontend ↔ Rust communication |

### 8.4 Backend Stack

| Technology | Role |
|-----------|------|
| **Python Flask** | REST API server |
| **JWT** | Authentication tokens |
| **Aliyun SMS** | Phone verification codes |
| **WeChat OAuth** | WeChat login integration |
| **Ernie API** (Baidu) | Primary AI model for categorization + summaries |
| **Doubao API** (ByteDance) | Secondary AI model (fallback) |
| **Qwen API** (Alibaba) | Tertiary AI model (fallback) |
| **PostgreSQL** | Cloud database (user accounts, sync data) |

### 8.5 Web Demo Mode

When running as a web app (no Tauri):
- `@tauri-apps/api` calls are wrapped in a compatibility layer that returns mock data or uses `localStorage`.
- No native window tracking -- users see sample/demo data or can manually add entries.
- All data stored in `localStorage` (no cloud sync in demo mode).
- Purpose: marketing landing page demo, try-before-install experience.

### 8.6 Data Flow

```
[User Activity]
    │
    ▼
[Rust: poll active window] ──→ [Raw segment: app, title, timestamp]
    │
    ▼
[Rust: aggregate segments] ──→ [Activity: app, title, start, end, duration]
    │
    ▼
[Frontend: display on timeline] ←── [Rust → IPC → React]
    │
    ▼
[Backend: AI categorize] ←── [HTTPS POST with activity batch]
    │
    ▼
[Frontend: update category] ←── [Category result from backend]
    │
    ▼
[User: correct if wrong] ──→ [Store correction locally + send feedback to backend]
```

### 8.7 State Management

Single Zustand store (`useAppStore`) manages:

| State Slice | Content |
|-------------|---------|
| `activities` | Array of tracked activities (today + cached recent days) |
| `tasks` | Planner tasks with subtasks |
| `habits` | Habit definitions + check-in records |
| `pet` | Pet state (type, name, hunger, mood, energy, XP, level, coins) |
| `settings` | Theme, dark mode, skin, privacy level, feature toggles, ignored apps |
| `tracking` | isTracking, current segment info |
| `auth` | User info, token, subscription tier |
| `ui` | Sidebar collapsed, active modal, onboarding state |

### 8.8 Project Structure

```
merize/
├── docs/                     # Design docs, research
│   └── PRODUCT_DESIGN.md     # ← This document
├── src/                      # React frontend
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Router + layout
│   ├── index.css             # Global styles + CSS variables
│   ├── pages/                # Route pages
│   │   ├── Dashboard.tsx
│   │   ├── Timeline.tsx      # (to be added — currently embedded in Dashboard)
│   │   ├── Planner.tsx
│   │   ├── FocusMode.tsx
│   │   ├── Habits.tsx
│   │   ├── Statistics.tsx
│   │   ├── VirtualPet.tsx
│   │   ├── Settings.tsx
│   │   ├── Login.tsx
│   │   ├── Calendar.tsx      # (legacy — merging into Planner calendar view)
│   │   ├── AiSummary.tsx     # (legacy — merging into Statistics)
│   │   ├── DeepWorkStats.tsx # (legacy — merging into Statistics)
│   │   ├── FlowBlocks.tsx    # (legacy — merging into Settings)
│   │   ├── TeamDashboard.tsx
│   │   ├── TeamFocus.tsx
│   │   ├── WeeklyApproval.tsx
│   │   ├── OrgAdmin.tsx
│   │   └── StylePreview.tsx  # (legacy — merging into Settings)
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── Timeline.tsx      # Timeline visualization component
│   │   ├── OnboardingTour.tsx
│   │   ├── StatsCard.tsx
│   │   ├── ThemeSelector.tsx
│   │   ├── TimeBlockPlanner.tsx
│   │   └── ui/               # Reusable UI primitives (Button, Modal, Input, Card, Progress, etc.)
│   ├── store/
│   │   └── useAppStore.ts    # Single Zustand store
│   ├── services/             # Data service layer
│   ├── hooks/                # Custom React hooks (useTheme, etc.)
│   ├── config/               # App configuration
│   └── utils/                # Utilities (api, auth, tracking, planner helpers)
├── src-tauri/                # Rust backend (Tauri 2)
│   ├── src/
│   │   └── main.rs           # Tauri commands, window tracking, system tray
│   ├── Cargo.toml
│   └── tauri.conf.json
├── backend/                  # Python Flask API
│   ├── app.py
│   ├── config.example.py
│   └── requirements.txt
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

### 8.9 Key Migration Notes (v1 → v2 Restructure)

The v2 redesign consolidates several previously separate pages:

| v1 Page | v2 Destination | Rationale |
|---------|---------------|-----------|
| `/ai-summary` | `/statistics` (AI Insights tab) | AI summaries belong with other stats |
| `/deep-work-stats` | `/statistics` (Deep Work tab) | Same -- it's a type of statistic |
| `/calendar` | `/planner` (Calendar view tab) | Calendar is a view of tasks, not a separate feature |
| `/flow-blocks` | `/settings` (Flow Blocks group) | Block list is a setting, not a standalone page |
| `/style-preview` | `/settings` (Display group) | Theme preview belongs in settings |
| (new) `/timeline` | Dedicated route | Timeline is promoted from a Dashboard widget to the core standalone view |
| (new) `/pet` | Dedicated route | Pet system gets its own full page (previously `VirtualPet`) |

---

## Appendix A: Glossary

| Term | Definition |
|------|-----------|
| **Activity** | A tracked time segment: app name + window title + category + start/end time |
| **Category** | A label for an activity (e.g., Development, Entertainment). Auto-assigned by AI, correctable by user. |
| **Flow Block** | A website or app that should be blocked during focus sessions |
| **Focus Session** | A timed period (pomodoro or custom) where the user is intentionally focused |
| **Segment** | A raw data point from window polling, before aggregation into an Activity |
| **Streak** | Consecutive days of completing a habit |
| **XP** | Experience points earned by the pet from user productivity actions |

## Appendix B: API Endpoints (Backend)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/send-code` | Send SMS verification code |
| `POST` | `/auth/login` | Verify code and return JWT |
| `POST` | `/auth/wechat` | WeChat OAuth login |
| `GET` | `/activities?date=YYYY-MM-DD` | Get activities for a date |
| `POST` | `/activities` | Create/sync activities |
| `PATCH` | `/activities/:id/category` | Update activity category (user correction) |
| `DELETE` | `/activities/:id` | Delete an activity |
| `POST` | `/ai/categorize` | AI categorize a batch of activities |
| `POST` | `/ai/summary` | Generate AI summary for a date range |
| `GET` | `/tasks` | List tasks |
| `POST` | `/tasks` | Create task |
| `PATCH` | `/tasks/:id` | Update task |
| `DELETE` | `/tasks/:id` | Delete task |
| `POST` | `/ai/reorder-tasks` | AI smart reorder tasks |
| `GET` | `/habits` | List habits |
| `POST` | `/habits` | Create habit |
| `POST` | `/habits/:id/check` | Record a habit check-in |
| `GET` | `/pet` | Get pet state |
| `POST` | `/pet/feed` | Feed the pet (spend coins) |
| `POST` | `/pet/interact` | Interact with pet (toy, etc.) |
| `GET` | `/user/subscription` | Get current subscription info |

## Appendix C: Agent API (Future MCP Compatibility)

Merize exposes structured capabilities for AI agent integration:

```typescript
// Available agent-callable functions
get_time_summary(days: number)           // → Time breakdown for last N days
create_task(title, scheduledTime?)       // → Create a new task
list_tasks(status?)                      // → List tasks by status
get_insights()                           // → AI-generated productivity insights
update_activity_category(id, category)   // → Correct an activity's category
get_pet_status()                         // → Current pet state
start_focus_session(minutes?)            // → Start a focus session
```

Currently exposed as REST endpoints. Architecture is designed for future adaptation to MCP (Model Context Protocol) when the ecosystem matures, enabling any AI agent to discover and invoke Merize capabilities automatically.
