# Trace 时迹 — 产品蓝图 v3.0

> **文档目的**：本文档是 Trace 时迹的完整产品方案，涵盖产品定位、AI Agent 角色、心理学依据、页面结构、功能详解、开发任务清单。任何开发者（包括 AI Agent）阅读本文档后，应能理解设计意图并直接开始编码。
>
> **最后更新**：2026-04-20
>
> **版本变更**：v3.0 — 重新定义产品为 AI 原生时间管理产品；精简至 5 个主标签页；新增 AI Agent 角色定义；新增外部 API 集成愿景。

---

## 目录

1. [产品定位：AI 原生的执行守护系统](#1-产品定位ai-原生的执行守护系统)
2. [问题诊断：为什么计划了还是做不到](#2-问题诊断为什么计划了还是做不到)
3. [理论框架：行为心理学基础](#3-理论框架行为心理学基础)
4. [设计原则](#4-设计原则)
5. [AI Agent：你的私人项目经理](#5-ai-agent你的私人项目经理)
6. [产品架构：四层系统全景](#6-产品架构四层系统全景)
7. [页面结构：5 个主标签页](#7-页面结构5-个主标签页)
8. [逐页详解：功能与设计理据](#8-逐页详解功能与设计理据)
9. [全局组件（非标签页）](#9-全局组件非标签页)
10. [功能逻辑图与依赖关系](#10-功能逻辑图与依赖关系)
11. [用户引导：产品内教育与能力培养](#11-用户引导产品内教育与能力培养)
12. [开发阶段：四版迭代路线图](#12-开发阶段四版迭代路线图)
13. [衡量标准](#13-衡量标准)
14. [V1 开发任务清单（面向开发者）](#14-v1-开发任务清单面向开发者)
15. [技术实现指南](#15-技术实现指南)
16. [外部 API 集成愿景](#16-外部-api-集成愿景)
17. [Strategic Decisions Log](#17-strategic-decisions-log)
18. [Gap Analysis: Current Codebase vs V1 Plan](#18-gap-analysis-current-codebase-vs-v1-plan)

---

<!-- SECTION 1 -->
## 1. 产品定位：AI 原生的执行守护系统

### 1.1 一句话定位

**Trace 是一个 AI 原生的时间管理与执行守护产品——你的私人项目经理。**

它不仅仅追踪时间和管理任务，而是通过一个持续学习、不断进化的 AI Agent，**主动替你做决策、督促你执行、帮你复盘成长**。用得越久，它越懂你。

### 1.2 与传统工具的本质区别

| 维度 | 传统工具（Todoist/Notion） | Trace |
|------|--------------------------|-------|
| 角色 | 被动记录器 | 主动执行教练 |
| 谁做决策 | 用户自己面对列表选择 | AI 替你选好，你只需说「开始」 |
| 打断处理 | 不知道你被打断了 | 实时检测偏离，温和拉回 |
| 时间感知 | 任务有截止日期，但你不知道时间在流逝 | 常驻条让时间始终可见 |
| 学习能力 | 不了解你 | 持续学习你的习惯、能量曲线、回避模式 |
| 护城河 | 数据可导出即可迁移 | AI 对你的理解越深，迁移成本越高 |

### 1.3 AI 原生意味着什么

1. **AI 不是附加功能，是产品核心**——去掉 AI，产品不成立
2. **所有数据都喂给 AI**——窗口活动、任务完成率、打断模式、能量曲线、情绪标签……AI 从中提取洞察
3. **AI 主动行动，不只是被动响应**——它会主动推荐任务、主动检测偏离、主动提醒复盘
4. **架构面向未来**——AI 层独立于 UI 层，底层模型可替换，能力可扩展，可被其他 AI Agent 调用
5. **数据飞轮**——用户使用 → 产生数据 → AI 更懂用户 → 建议更精准 → 用户更依赖 → 更多数据

---

<!-- SECTION 2 -->
## 2. 问题诊断：为什么计划了还是做不到

### 2.1 核心发现

用户的痛点**不是缺少任务管理工具**。用户已经有分类、优先级、任务列表——形式完整，但执行依然极度混乱。问题出在：**计划与执行之间缺少一个实时、主动的连接层。**

### 2.2 三层问题模型

#### 层级 A：启动冻结（Decision Paralysis）

| 症状 | 心理机制 | 现有产品缺失 |
|------|----------|-------------|
| 面对 20 条任务却无法动手 | Hick's Law：选项越多，决策时间越长 | 只展示列表，不替用户做选择 |
| 不知从何开始，面对电脑发呆 | 决策疲劳 + 任务模糊性 | 无「第一步」引导 |
| 从小被安排，缺乏自驱启动能力 | 外部执行系统依赖（父母/老师/老板） | 无主动推送机制 |

#### 层级 B：上下文蒸发（Context Evaporation）

| 症状 | 心理机制 | 现有产品缺失 |
|------|----------|-------------|
| 被打断后忘了在做什么 | 工作记忆只有 4±1 个槽位 | 无上下文保存/恢复 |
| 中途插入事情后偏离计划 | 注意力跟随外部刺激而非内部计划 | 无偏离检测与提醒 |
| 不知道自己是否应该被打断 | 无法实时判断打断的优先级 | 无打断决策辅助 |

#### 层级 C：拖延螺旋（Procrastination Spiral）

| 症状 | 心理机制 | 现有产品缺失 |
|------|----------|-------------|
| 忙了一天但什么都没完成 | 无目的切换 = 虚假忙碌 | 无「有效工作」检测 |
| 拖延 → 内疚 → 焦虑 → 更拖延 | 负反馈循环 + 情绪性回避 | 日终只展示负面数据 |
| 手机/社交媒体持续分散注意力 | 多巴胺劫持 + 注意力碎片化 | 干扰屏蔽力度不足 |
| 可能进一步导致抑郁 | 习得性无助（Seligman） | 无正反馈机制 |

### 2.3 核心洞察

> 用户描述的模式本质上是 **「被动响应式注意力」** ——注意力跟着外部刺激走，而非被内部计划驱动。
>
> 这不是个人缺陷，而是**一个从未被训练过的能力**。从小到大，父母、老师、老板扮演了「外部执行系统」的角色。当这个外部指令源消失，需要自驱时，大脑没有现成的回路可用。
>
> **Trace 的 AI Agent 需要扮演的角色：一个温和但坚定的「内化执行教练」**——不是监工，不是老板，而是一个始终在场、主动引导、在你脱轨时温和拉你回来的私人项目经理。最终目标：在使用过程中，逐渐帮用户建立起自己的执行功能。

---

<!-- SECTION 3 -->
## 3. 理论框架：行为心理学基础

产品中的每一个设计决策都基于经过验证的心理学原理。以下是核心理论支柱。

### 3.1 执行功能理论（Executive Function）

执行功能包括：**工作记忆**、**认知灵活性**、**抑制控制**。这三项能力决定了你能否「计划 → 启动 → 维持 → 完成」一件事。ADHD 研究表明，执行功能可以通过外部支架（scaffold）来增强。

**产品应用**：AI Agent 的「此刻该做什么」功能充当外部工作记忆；「打断拦截」充当外部抑制控制。AI 持续学习后，逐渐降低干预频率，帮用户内化这些能力。

### 3.2 时间感知障碍（Time Blindness）

拖延者往往有「时间盲」——无法准确感知时间的流逝。10 分钟和 60 分钟在主观上没有明显差异。这导致计划不切实际、截止日期总是突然到来。

**产品应用**：系统托盘常驻条实时显示已用时间/剩余时间；Timeline 让时间「可见」。

### 3.3 习惯回路（Habit Loop — Duhigg）

提示(Cue) → 惯常行为(Routine) → 奖励(Reward)。拖延本身也是一个习惯回路：焦虑(提示) → 刷手机(惯常行为) → 暂时缓解(奖励)。要改变行为，需要**替换惯常行为并保留奖励**。

**产品应用**：AI 检测到「漫游模式」时提供替代行为（帮你选一个任务开始），完成后给予正反馈。

### 3.4 自我决定理论（SDT — Deci & Ryan）

内在动机来自三个基本心理需求：**自主性(Autonomy)**、**胜任感(Competence)**、**归属感(Relatedness)**。监控式工具破坏自主性，过难的任务破坏胜任感。

**产品应用**：每个 AI 提醒都保留「别管我」选项（自主性）；「只要 15 分钟」降低门槛（胜任感）；AI 用温暖的对话语气建立情感连接（归属感）。

### 3.5 实施意图（Implementation Intentions — Gollwitzer）

「我打算在 X 时间、X 地点做 X 事」的 if-then 计划比模糊的目标意图（「我要写报告」）执行率高 2-3 倍。关键是预先绑定时间、地点和行为。

**产品应用**：时间块系统将任务绑定到具体时段；AI 驱动的晨间启动仪式帮用户形成 if-then 计划。

### 3.6 情绪调节与拖延（Sirois & Pychyl）

拖延的核心不是时间管理问题，而是**情绪管理问题**。人们回避任务是因为任务引发了不愉快的情绪（焦虑、无聊、挫败），拖延是短期情绪调节策略。

**产品应用**：AI 收集「换一个任务」的原因数据；识别情绪性回避模式并提供温和的认知重构建议。

### 3.7 Zeigarnik 效应

未完成的具体行为比未完成的抽象目标更能吸引大脑注意。一旦写下具体的「第一步」，大脑会持续惦记它。

**产品应用**：每个任务鼓励填写「第一步」字段——「打开文档，从第三节开始」而非「写报告」。AI 也会自动建议第一步。

### 3.8 Foot-in-the-door 效应

一旦开始一个小行动，人会倾向于继续。15 分钟的承诺远比 2 小时容易接受，而实际上大多数人开始后会继续超过 15 分钟。

**产品应用**：AI 启动助推的「只要 15 分钟就好」。

---

<!-- SECTION 4 -->
## 4. 设计原则

基于以上理论，产品的每一个干预都遵循三条核心原则：

| 原则 | 含义 | 反面教材 |
|------|------|---------|
| **① 降低启动摩擦** | 让开始一件事变得比不开始更容易 | 让用户面对 20 条列表自己选 |
| **② 增加脱轨摩擦** | 让偏离计划变成一个有意识的决定，而非无意识的滑动 | 用户切走时不做任何提醒 |
| **③ 建立正反馈闭环** | 让每一次「完成」都被看见、被庆祝、被记住 | 日终只展示「5 个任务未完成」 |

补充设计准则：

- **产品是教练，不是监工**：所有提醒语气温和，所有功能都可关闭，用户拥有最终控制权
- **脚手架式教育**：初期高度辅助，随用户能力增长逐步撤除干预，最终目标是用户不再需要系统的主动引导
- **数据驱动个性化**：AI 基于用户历史行为数据，让建议越来越精准
- **先表扬后改进**：任何反馈场景都先展示成就，再温和提出改进空间
- **极简界面**：只有 5 个主标签页，每个页面的存在都无可争议。功能通过上下文自然呈现，而非堆砌入口
- **AI 原生架构**：AI 不是 feature，是 infrastructure。所有功能设计都考虑 AI 如何参与

---

<!-- SECTION 5 -->
## 5. AI Agent：你的私人项目经理

### 5.1 角色定义

Trace 的 AI Agent 不是一个聊天机器人，也不是一个被动的分析工具。它是用户的**私人项目经理兼私人秘书**——

- **主动分配任务**：不等用户问「我该做什么」，而是主动告诉你「现在做这个」
- **督促完成**：检测到你偏离时温和提醒，不是骂你，是拉你回来
- **持续学习、不断进化**：每一天都在更了解你——你的能量曲线、你总是回避什么类型的任务、你在几点最容易分心、你对什么语气最有反应
- **自动处理琐事**：自动追踪时间、自动填充事件、自动规划日程、自动统计数据、自动生成复盘报告

### 5.2 AI Agent 的六大能力

| 能力 | 描述 | 版本 | 数据来源 |
|------|------|------|---------|
| **感知** | 自动追踪你在做什么（窗口监控 + AI 分类） | V1 | 系统事件流 |
| **决策** | 替你选择此刻该做什么任务（此刻引擎） | V1 | 任务列表 + 时间块 + 历史数据 |
| **干预** | 检测偏离/漫游，温和拉回 | V1 | 实时活动 vs 计划 |
| **规划** | 自动安排时间块，建议任务排序 | V2 | 历史能量曲线 + 任务属性 |
| **洞察** | 发现行为模式，提供个性化建议 | V2 | 多天行为数据聚合 |
| **教练** | 引导能力成长，逐步撤除干预 | V3 | 长期成长指标 |

### 5.3 AI 的学习飞轮（护城河）

```
用户使用 Trace
       │
       ↓
产生行为数据（窗口活动、任务完成、打断模式、情绪标签、能量曲线……）
       │
       ↓
AI 建立用户画像（User Profile）
       │
       ↓
建议更精准（知道你几点最高效、什么任务你总是逃避、什么语气最管用）
       │
       ↓
用户感受到价值，更依赖 Trace
       │
       ↓
更多数据 → AI 更懂你 → 迁移成本越来越高
```

**这就是产品的核心护城河**：AI 对你的理解不可迁移。用了 3 个月的 Trace 比新装的任何竞品都更了解你。

### 5.4 AI 用户画像（User Profile）数据结构

AI 持续学习并维护的用户画像：

```typescript
interface UserProfile {
  // 能量曲线：每小时的平均专注能力 (0-100)
  energyCurve: Record<number, number>; // hour -> focus_score

  // 任务偏好
  taskAvoidancePatterns: {
    categories: string[];          // 总是回避的任务类别
    emotionalTriggers: string[];   // 触发回避的情绪
    avgProcrastinationDays: number; // 平均拖延天数
  };

  // 打断模式
  interruptionProfile: {
    peakHours: number[];           // 最容易被打断的时段
    topSources: string[];          // 最常打断你的应用
    avgRecoveryMinutes: number;    // 平均恢复时间
  };

  // 专注能力
  focusProfile: {
    optimalSessionLength: number;  // 最适合你的专注时长
    deepWorkCapacity: number;      // 日均深度工作上限（分钟）
    bestDeepWorkHours: number[];   // 最适合深度工作的时段
  };

  // 行为习惯
  behaviorPatterns: {
    morningStartTime: string;      // 通常开始工作的时间
    lunchBreakPattern: string;     // 午休习惯
    afternoonDipHours: number[];   // 下午低谷时段
    endOfDayTime: string;          // 通常结束工作的时间
  };

  // 响应偏好
  responsePreferences: {
    preferredTone: 'gentle' | 'neutral' | 'direct';
    reminderEffectiveness: Record<string, number>; // 哪种提醒最有效
    motivationStyle: 'praise' | 'data' | 'challenge';
  };

  // 成长轨迹
  growthMetrics: {
    selfStartRate: number[];       // 自主启动率趋势
    interruptionRecovery: number[];// 打断恢复速度趋势
    timeEstimationAccuracy: number[];// 时间预估准确度趋势
  };
}
```

### 5.5 AI Agent 在每个场景的行为

| 场景 | AI 做什么 | 心理学依据 |
|------|----------|-----------|
| 早上打开 App | 主动推送今日计划 + 第一个任务 | 实施意图 |
| 用户面对列表发呆 | 检测无操作 30s → 弹出「我帮你选一个？」 | Hick's Law |
| 开始任务 | 展示第一步 +「只要 15 分钟」 | Foot-in-the-door |
| 执行中被打断 | 温和提醒 + 保存上下文 | 执行功能 · 抑制控制 |
| 漫游模式（无目的切换） | 「看起来你不确定要做什么，帮你选一个？」 | 元认知激活 |
| 连续 3 天回避同一任务 | 「这个任务让你感觉如何？试试拆成 10 分钟小块」 | 情绪调节 |
| 日终 | 先表扬完成的，再温和分析改进空间 | 自我同情 |
| 一周总结 | 发现模式：「你周三效率总是最低，可能和周三的例会有关」 | 元认知 |
| 用户什么都不做 | 不催促，只温和地说「今天感觉怎样？」 | SDT · 自主性 |

### 5.6 AI Agent 可被调用

Trace 的 AI Agent 不是一个封闭系统。它暴露标准接口，可以：

- **被其他 AI Agent 调用**：比如用户的日程管理 Agent 可以查询「他今天还有多少空闲时间块」
- **调用其他 AI Agent**：比如 Trace Agent 可以调用用户的邮件 Agent「帮我把这个任务的截止日期告诉团队」
- **Agent-to-Agent 协议**：未来支持 MCP (Model Context Protocol) 等标准协议

这使得 Trace 成为用户 AI 生态中的「时间与执行」节点，而非孤立应用。

---

<!-- SECTION 6 -->
## 6. 产品架构：四层系统全景

### 6.1 四层架构

在原有的感知层和计划层基础上，新增**执行守护层**和**AI Agent 层**：

```
┌──────────────────────────────────────────────────────────────────┐
│                    AI Agent 层 (Intelligence)                     │
│                     ★ 产品灵魂 — 持续进化 ★                       │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 用户画像  │ │ 行为预测  │ │ 智能推荐  │ │ 自然语言  │           │
│  │ 持续学习  │ │ 模式识别  │ │ 任务排序  │ │ 对话交互  │           │
│  │ 越来越懂你│ │ 能量曲线  │ │ 时间规划  │ │ 教练引导  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├──────────────────────────────────────────────────────────────────┤
│                         ⬆ 驱动 ⬇                                │
├──────────────────────────────────────────────────────────────────┤
│                    执行守护层 (Execution Guardian)                 │
│                       ★ V1 核心新增 ★                             │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 此刻引擎  │ │ 启动助推  │ │ 打断拦截  │ │上下文快照 │           │
│  │ 决定现在  │ │ 第一步   │ │ 脱轨检测  │ │ 保存进度  │           │
│  │ 该做什么  │ │ +15min   │ │ +温和提醒 │ │ +恢复引导 │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │ 晨间仪式  │ │ 日终闭环  │ │ 漫游检测  │                        │
│  │ 每日启动  │ │ 计划vs实际│ │ 无目的切换│                        │
│  │ 确认计划  │ │ 对账复盘  │ │ 识别介入  │                        │
│  └──────────┘ └──────────┘ └──────────┘                        │
├──────────────────────────────────────────────────────────────────┤
│                         ⬆ 连接 ⬇                                │
├──────────────────────────────────────────────────────────────────┤
│                    计划层 (Planning Layer)                        │
│                      已有 · 增强                                  │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 任务管理  │ │  时间块   │ │ 每日目标  │ │ AI 排序  │           │
│  │优先级·子任│ │任务绑定时│ │ 当日必须  │ │ 智能推荐  │           │
│  │务·标签   │ │ 段       │ │ 完成项    │ │ 任务顺序  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├──────────────────────────────────────────────────────────────────┤
│                         ⬆ 数据 ⬇                                │
├──────────────────────────────────────────────────────────────────┤
│                    感知层 (Perception Layer)                      │
│                         已有                                      │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 窗口监控  │ │ AI 分类  │ │ 空闲检测  │ │ 时间记录  │           │
│  │每秒检测  │ │自动归类  │ │5min暂停  │ │ 精确到秒  │           │
│  │活跃应用  │ │活动类型  │ │          │ │ 时间追踪  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 架构关键点

1. **感知层**持续产出事件流（当前活跃窗口、空闲状态、切换频率）
2. **计划层**持续提供期望状态（当前时间块应该做什么）
3. **执行守护层**实时比对两者，在偏差超出阈值时触发干预
4. **AI Agent 层**消费所有层的数据，建立用户画像，驱动越来越精准的决策

技术实现路径：在 Zustand store 中新增 `executionGuardian` 和 `aiAgent` slice，监听 activity 和 task 数据变化，驱动 UI 层的提醒弹窗和状态更新。AI Agent 通过独立的 service 层运行，与 UI 解耦。

---

<!-- SECTION 7 -->
## 7. 页面结构：5 个主标签页

### 7.1 设计决策：为什么只有 5 个标签页

**原则：每个标签页的存在必须无可争议。**

用户打开一个 App 看到 8 个标签页，心理压力等同于面对 8 个选择——这本身就违反了我们要解决的 Hick's Law 问题。5 个标签页是经过反复推敲的最小完备集。

### 7.2 五页总览

| 标签页 | 图标 | 一句话定位 | 用户心智模型 |
|--------|------|-----------|-------------|
| **Dashboard** | 🏠 | 今天的指挥中心——AI 告诉你现在该做什么 | 「打开 App 第一眼」 |
| **Timeline** | 📐 | 时间去哪了——逐小时活动回顾 | 「回头看今天做了什么」 |
| **Task** | ✅ | 所有任务的管理中心——创建、排序、规划 | 「我的待办清单」 |
| **Analytics** | 📊 | 数据洞察——AI 帮你发现模式和成长 | 「我这周/月怎么样」 |
| **Settings** | ⚙️ | 一切配置——外观、追踪、AI、执行守护参数 | 「调整偏好」 |

### 7.3 不是标签页，但同样重要的全局组件

| 组件 | 触发方式 | 为什么不是标签页 |
|------|---------|----------------|
| **Focus Mode** | 从 Dashboard/Task 点击「开始」进入，覆盖全屏 | 专注模式是一个沉浸状态，不是一个浏览页面。用户不会「去逛专注页」，而是「进入专注状态」 |
| **Review** | 日终自动弹出（可配置时间），或从 Dashboard 手动触发 | 复盘是一个流程，不是一个常驻页面。每天只用一次，不值得占一个标签位 |
| **StatusBar** | 系统托盘/桌面悬浮窗，始终显示 | 它是操作系统级的组件，不在 App 标签栏里 |
| **Morning Ritual** | 每日首次打开 App 时自动弹出 | 晨间仪式是一个启动流程，完成后消失 |
| **Habits** (V2) | 在 Dashboard 中作为卡片出现，或在 Analytics 中作为 Tab | V2 才实现，且不需要独立页面 |
| **Virtual Pet** (V2) | 在 Dashboard 中作为迷你组件，点击展开 | 宠物是激励系统的一部分，不是核心功能页 |

### 7.4 原有代码的页面重组说明

现有代码有 8 个标签页（Dashboard, Timeline, Planner, Focus, Habits, Statistics, Pet, Settings），需要重组：

| 原页面 | 重组到 | 变更说明 |
|--------|--------|---------|
| `Dashboard.tsx` | **Dashboard** | 保留 + 大量增强（此刻引擎、晨间仪式入口、活动追踪等） |
| `Timeline.tsx` | **Timeline** | 基本保留，增加打断标记 |
| `Planner.tsx` | **Task** | 重命名 + 增强（第一步字段、情绪标签、时间块缓冲） |
| `FocusMode.tsx` | **Focus Mode（全局覆盖层）** | 从标签页改为全屏覆盖层，增加启动助推、打断拦截、上下文快照 |
| `Habits.tsx` | Dashboard 卡片 (V2) | V1 暂时隐藏，V2 在 Dashboard 中作为卡片重现 |
| `Statistics.tsx` | **Analytics** | 重命名 + 增强（执行守护统计 Tab） |
| `VirtualPet.tsx` | Dashboard 迷你组件 (V2) | V1 暂时隐藏，V2 在 Dashboard 中作为迷你组件重现 |
| `Settings.tsx` | **Settings** | 保留 + 新增执行守护设置区 + 所有散落的设置归拢 |

### 7.5 Sidebar 导航配置

```typescript
// V1 Sidebar 配置
const V1_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'House',     path: '/' },
  { id: 'timeline',  label: 'Timeline',  icon: 'Timeline',  path: '/timeline' },
  { id: 'task',      label: 'Task',      icon: 'CheckSquare', path: '/task' },
  { id: 'analytics', label: 'Analytics', icon: 'ChartBar',  path: '/analytics' },
  { id: 'settings',  label: 'Settings',  icon: 'Gear',      path: '/settings' },
];
// Focus Mode 不在导航栏，通过 Dashboard/Task 的「开始」按钮触发
// Review 不在导航栏，通过定时弹出或 Dashboard 入口触发
```

---

<!-- SECTION 8 -->
## 8. 逐页详解：功能与设计理据

### 8.1 Dashboard 仪表盘

**定位**：今天的指挥中心。用户每天的第一个接触点。AI 在这里告诉你「现在该做什么」。
**文件**：`src/pages/Dashboard.tsx`, `src/components/Dashboard/`

#### 功能 A：此刻引擎 · 单一任务展示 `[V1] [新增] [核心]`

**是什么**：Dashboard 中央不再是 todo list，而是一个大字展示：
- 「现在 → 写季度报告」+ 预估时间 + 已拖延天数
- 只给一个任务，只需点「开始」
- 点「换一个」可切换（V2 需说明原因）

**为什么**：Hick's Law——选项越多决策时间越长。当任务列表有 20 条时，大脑在选择上花的精力可能比做任务本身还多。**AI 给出一个答案，而不是一个列表。**

**AI 推荐算法**（V1 简单版，优先级序列）：
1. 当前时间块绑定的任务（最高优先）
2. 昨日日终设定的「明日一件事」
3. 优先级最高的未完成任务
4. 拖延天数最多的任务

**心理角色**：Hick's Law · 消除选择瘫痪 · AI 替你决策

**UI 结构**：
```
┌───────────────────────────────────────┐
│       现在 →                          │
│   ┌─────────────────────────┐         │
│   │  📝 写季度报告           │         │
│   │  预估: 2h  已拖延: 3天   │         │
│   │  第一步: 打开文档从第三节  │         │
│   └─────────────────────────┘         │
│                                       │
│   [ 🚀 开始 ]    [ 🔄 换一个 ]        │
└───────────────────────────────────────┘
```

**实现要点**：
- 新组件 `src/components/Dashboard/NowEngine.tsx`
- 推荐算法封装在 `src/services/nowEngine.ts`
- 点击「开始」→ 触发 Focus Mode 全屏覆盖层
- 无任务时显示引导创建任务

#### 功能 B：晨间启动仪式入口 `[V1] [新增]`

**是什么**：打开 App 时（每日首次），不是空白桌面，而是一个结构化启动流程：
1. AI 问候 + 今日日期
2. 展示今日时间块计划概览
3. 展示昨日未完成任务 + 「明日一件事」（如已设定）
4. 确认/调整计划
5. 「开始第一个任务」→ 直接进入此刻引擎

**为什么**：实施意图理论(Gollwitzer)——预先确认「几点做什么」比模糊计划执行率高 2-3 倍。

**心理角色**：实施意图 · 降低启动摩擦

**实现要点**：
- 新组件 `src/components/Dashboard/MorningRitual.tsx`
- 检测当日是否首次打开（store: `lastMorningRitualDate`）
- 完成后不再重复弹出，可在 Settings 关闭
- 底部 CTA 联动此刻引擎

#### 功能 C：实时活动追踪 `[V1] [已有·保留]`

已有功能保留：脉冲动画显示当前追踪状态，今日时间线预览，分类统计卡片。

#### 功能 D：计划 vs 实际对比 `[V1] [已有·增强]`

**增强内容**：当前时间块的计划任务与实际追踪到的活动并排显示。偏差时高亮提示。

#### 功能 E：日终复盘入口 `[V1] [新增]`

Dashboard 底部常驻一个「今日复盘」入口卡片。AI 到了设定时间（默认 21:00）会主动弹出 Review 流程。也可手动点击进入。

#### 功能 F：未恢复快照卡片 `[V1] [新增]`

如果有被暂停的任务（上下文快照），在 Dashboard 顶部显示恢复卡片：
```
┌───────────────────────────────┐
│  📸 你有一个未完成的任务        │
│  写季度报告 · 已投入 47min     │
│  "写到了第三节的数据分析部分"   │
│  暂停于 14:32                  │
│  [ 继续 ]  [ 稍后 ]            │
└───────────────────────────────┘
```

---

### 8.2 Timeline 时间线

**定位**：时间去哪了？逐小时活动回顾，让时间变得可见。
**文件**：`src/pages/Timeline.tsx`

#### 已有功能 `[V1] [保留]`

垂直时间轴 · 颜色编码活动块 · 批量重分类 · 上下文切换计数 · 工作时间高亮 · 隐私级别切换 · NOW 标记线。

#### 新增：打断标记 `[V1] [新增]`

在时间线上标记每次「打断」事件——红色小旗帜 + 打断原因。累计后可视化一天的打断模式：什么时段最容易被打断、被什么打断、打断后恢复用了多久。

**心理角色**：模式识别 · 打断成本可视化

**实现要点**：
- Timeline 组件读取打断事件数据，叠加渲染红色标记
- 点击标记展示详情（打断时长、原因、恢复时间）

#### 新增：AI 时间分析摘要 `[V2] [新增]`

Timeline 顶部增加 AI 生成的当日摘要卡片：「今天你在 3 个项目间频繁切换，共切换 47 次。建议明天试试时间块——把上午整块给一个项目。」

---

### 8.3 Task 任务管理

**定位**：所有任务的管理中心。创建、排序、规划时间块。
**文件**：`src/pages/Planner.tsx` → 重命名为 `src/pages/Task.tsx`

#### 功能 A：任务管理增强 `[V1] [增强]`

保留已有功能（多视图：列表/看板/日历/时间线、优先级、子任务、项目分组、拖拽排序）。

**增强内容**：
- 每个任务新增**「第一步」字段**——创建任务时鼓励写出第一个具体动作
- 任务卡片新增**「情绪标签」**——标记这个任务让你感觉如何（轻松/中性/抗拒）
- AI 自动建议「第一步」（V2）

**为什么**：
- 「第一步」利用 Zeigarnik 效应——未完成的具体行为比抽象目标更吸引大脑
- 「情绪标签」帮 AI 识别情绪性回避模式

**数据模型变更**：
```sql
ALTER TABLE tasks ADD COLUMN first_step TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN emotional_tag TEXT DEFAULT 'neutral'
  CHECK(emotional_tag IN ('easy', 'neutral', 'resist'));
```

#### 功能 B：时间块系统增强 `[V1] [增强]`

**增强内容**：
- 时间块自动关联到此刻引擎——到了开始时间，AI 主动推送该任务
- 增加**「缓冲时间」**——每个时间块之间自动插入 5-10 分钟缓冲
- 增加**「能量曲线」**参考——根据历史数据显示你在每个时段的平均专注度（V2）

#### 功能 C：AI 智能排序增强 `[V2] [增强]`

加入「情绪标签」权重 + 「拖延天数衰减」 + 能量曲线匹配。

#### 功能 D：「换一个」日志 `[V2] [新增]`

当用户在此刻引擎中选择「换一个任务」时，需简单说明原因。数据汇总后在 Analytics 展示回避模式。

---

### 8.4 Analytics 数据分析

**定位**：AI 帮你发现模式，看见成长。周/月级别的数据洞察。
**文件**：`src/pages/Statistics.tsx` → 重命名为 `src/pages/Analytics.tsx`

#### Tab 1：Overview 总览 `[V1] [已有·保留]`

周/月总览 · 饼图分类分布 · 深度工作分数 · 每小时热力图。

#### Tab 2：Execution 执行守护 `[V1] [新增]`

1. **打断分析**——每日打断次数趋势、打断来源 Top 5、打断后恢复平均时长
2. **拖延模式**——被回避最多的任务类型、回避原因分布、任务停滞天数分布
3. **能量曲线**——基于历史数据的每小时平均专注度，帮助安排高/低能量任务

#### Tab 3：AI Insights AI 洞察 `[V1] [已有·增强]`

保留已有 AI 分析功能，增强：
- 个性化建议基于多天数据（不只是本周）
- 与「执行守护」数据整合——打断模式洞察、拖延趋势分析
- 连续 3 天回避同一个任务时主动给出建议

#### Tab 4：Growth 成长轨迹 `[V3] [新增]`

追踪并展示用户在以下维度的成长趋势：

| 能力维度 | 计算方式 | 数据来源 |
|----------|---------|---------|
| 时间感知准确度 | 预估时间 vs 实际时间的偏差率趋势 | 任务预估 + 实际追踪 |
| 打断恢复速度 | 从脱轨到恢复执行的平均时间趋势 | 打断事件记录 |
| 自主启动率 | 不需要 AI 提醒就主动开始的比例 | 此刻引擎使用 vs 主动开始 |

---

### 8.5 Settings 设置

**定位**：一切配置集中管理。用户不需要到处找设置。
**文件**：`src/pages/Settings.tsx`, `src/components/Settings/`

**关键原则**：**所有设置，无论属于哪个功能，都集中在 Settings 页面。** 不允许在其他页面散落配置项。

#### 设置分区结构

```
Settings
├── 外观 (Appearance)
│   ├── 主题：深色/浅色
│   ├── 强调色
│   └── 背景皮肤
│
├── 追踪 (Tracking)
│   ├── 自动追踪开关
│   ├── 追踪规则管理
│   ├── 忽略的应用列表
│   ├── 隐私级别
│   └── 空闲检测阈值
│
├── AI 配置 (AI)
│   ├── AI 提供商选择
│   ├── API Key
│   ├── AI 分类规则
│   └── AI 语气偏好（温和/中性/直接）
│
├── 执行守护 (Execution Guardian) [V1 新增]
│   ├── 打断检测灵敏度：宽松(5min) / 标准(2min) / 严格(1min)
│   ├── 漫游检测阈值：宽松 / 标准 / 严格
│   ├── 晨间仪式：开启 / 关闭
│   ├── 日终复盘自动弹出时间：自定义 / 关闭
│   ├── 缓冲时间：5 / 10 / 15 分钟
│   └── 「只要N分钟」门槛：10 / 15 / 20 / 25 分钟
│
├── 专注模式 (Focus)
│   ├── 工作时长（默认 25min）
│   ├── 休息时长（默认 5min）
│   ├── 长休息时长（默认 15min）
│   ├── 长休息间隔（默认 4 个番茄钟）
│   ├── 环境音偏好
│   └── 干扰屏蔽规则
│
├── 通知 (Notifications)
│   ├── 习惯提醒
│   ├── 休息提醒
│   ├── 专注结束提醒
│   └── AI 主动推送开关
│
├── 数据 (Data)
│   ├── 导出（JSON/CSV）
│   ├── 本地数据保留天数
│   ├── 云同步设置 (V2)
│   └── 隐私同步模式 (V2)
│
└── 关于 (About)
    ├── 版本号
    ├── 更新检查
    └── 隐私政策
```

**实现要点**：
- 新组件 `src/components/Settings/ExecutionGuardianSection.tsx`
- 将现有散落在其他页面的设置（如 Focus 的环境音偏好、Habits 的提醒时间）迁移到 Settings
- 每个设置项有简短说明
- 有「恢复默认」按钮
- 配置变更实时生效

---

<!-- SECTION 9 -->
## 9. 全局组件（非标签页）

这些组件不占标签位，但在用户体验中至关重要。

### 9.1 Focus Mode 专注模式（全屏覆盖层）

**触发方式**：从 Dashboard 此刻引擎点「开始」/ 从 Task 页任务卡片点「开始」
**文件**：`src/pages/FocusMode.tsx`（改为覆盖层组件），`src/components/FocusStartedModal.tsx`

**为什么不是标签页**：专注模式是一个沉浸状态。用户不会在标签栏「导航」到专注——他们是「进入」专注。全屏覆盖强化了沉浸感，也防止用户在 App 内乱切。

#### 功能 A：启动助推 · 第一步引导 `[V1] [新增]`

**是什么**：点击「开始专注」后，先弹出一个轻量引导：
1. 「你打算先做哪一小步？」
2. 显示任务的 `first_step` 字段 + AI 建议的 2-3 个具体动作
3. 底部提示：「只要 15 分钟就好。」
4. 两个按钮：「开始 15 分钟」/「开始 25 分钟」+ 「直接开始」跳过链接

**为什么**：启动是拖延的最大障碍。"只要15分钟"利用了 foot-in-the-door 效应。具体的第一步消除模糊性。

**心理角色**：Foot-in-the-door · 去模糊化

```
┌─────────────────────────────────┐
│  准备开始: 写季度报告            │
│                                 │
│  你打算先做哪一小步？            │
│  ┌─ AI建议 ──────────────────┐  │
│  │ • 打开文档从第三节开始      │  │
│  │ • 先列一个三级小标题大纲    │  │
│  │ • 回顾上次写到哪里         │  │
│  └───────────────────────────┘  │
│  [ 自定义输入框 ]                │
│                                 │
│  ⏱️ 只要 15 分钟就好            │
│  [ 开始 15 分钟 ] [ 开始 25 分钟 ] │
│  直接开始 ↗                     │
└─────────────────────────────────┘
```

**实现要点**：
- 新组件 `src/components/LaunchBoost.tsx`
- 修改 `FocusStartedModal.tsx` 在现有启动流程中增加一步
- 15 分钟快捷计时选项（与现有 25 分钟并列）

#### 功能 B：打断拦截器 `[V1] [新增]`

**是什么**：专注期间，检测到切换到计划外应用超过阈值（默认 2min），弹出温和提醒：
- 「你已经离开 [当前任务] X 分钟了。」
- 三个选项：
  1. **回去继续** — 直接恢复
  2. **只是看一眼**（3min 倒计时）— 限时偏离
  3. **确实有急事，暂停任务** — 触发上下文快照

**为什么**：很多时候人不是故意拖延，是真的没意识到自己已经切走了。温和提醒足以重新激活抑制控制。三个选项尊重自主性（SDT）。

**心理角色**：抑制控制激活 · 自主性保护

**语气根据 Settings 配置**：
- 温和：「你已经离开一会儿了～要回来吗？」
- 中性：「你已经离开 [任务] X 分钟了。」
- 直接：「注意！你已偏离计划 X 分钟。」

**实现要点**：
- 新组件 `src/components/InterruptionAlert.tsx`
- 新服务 `src/services/deviationDetector.ts` 监听窗口切换
- 偏离阈值可在 Settings 配置
- 所有打断事件记录到数据库

#### 功能 C：上下文快照 `[V1] [新增]`

**是什么**：选择「暂停任务」时自动保存：
- 当前任务名 + 已投入时间
- 用户写的一句话备注（弹窗快速输入"做到哪了"）
- 恢复时显示上下文信息

**为什么**：工作记忆只有 4±1 个槽位。快照充当外部工作记忆，消除恢复成本。

**心理角色**：外部工作记忆 · 恢复成本归零

**实现要点**：
- 新组件 `src/components/ContextSnapshot.tsx`
- 数据模型新增 `context_snapshots` 表
- Dashboard 和 StatusBar 显示未恢复快照

#### 功能 D：已有功能保留 `[V1]`

番茄钟计时器、呼吸动画、环境音、干扰网站屏蔽、专注会话记录与 XP 奖励。

---

### 9.2 Review 日终复盘（弹窗/覆盖层）

**触发方式**：AI 在设定时间自动弹出（默认 21:00）/ Dashboard 手动点击
**文件**：新增 `src/components/Review.tsx`

**为什么不是标签页**：复盘每天只做一次，是一个线性流程（先看成就 → 对账 → 设明天一件事），不需要随时访问。

#### 功能 A：先说做了什么 · 正反馈优先 `[V1] [新增]`

页面顶部展示：
- 你今天实际工作了多少时间
- 完成了哪些任务（绿色勾选）
- 有进展但未完成的任务（蓝色进度条）

语气积极：不是「你有 5 个任务没完成」，而是「你完成了 3 个任务，还有 2 个有了进展」。

**心理角色**：自我同情 · 正反馈优先

#### 功能 B：结构化对账 `[V1] [新增]`

- 计划 vs 实际逐项对比
- 打断统计摘要
- 时间黑洞 Top 3（如「微信 95min，分散在 12 个片段中」）

#### 功能 C：明日一件事 `[V1] [新增]`

页面最后——「明天最重要的一件事是什么？」单一输入框。写完即闭合今日循环。这件事明天晨间仪式作为第一个推荐任务出现。

**心理角色**：Ivy Lee Method · 预决策

**实现要点**：
- 新组件 `src/components/Review.tsx`
- 从 tasks/timeblocks/activities/interruptions 多数据源聚合
- 「明日一件事」保存到 store，供晨间仪式读取
- 自动弹出时间可在 Settings 配置

#### 功能 D：AI 模式洞察 `[V2] [新增]`

AI 基于多天数据给出具体洞察：
- 「你连续 3 天在下午 2-3 点注意力最分散，建议把低优先级任务放在这个时段」
- 「你在标记为"抗拒"的任务上平均拖延 3.2 天，试试把它们拆成 15 分钟的小块」

---

### 9.3 StatusBar 系统托盘常驻条

**触发方式**：App 启动后始终显示在系统托盘 / 桌面悬浮窗
**文件**：新增 `src/components/StatusBar/`

**为什么不是标签页**：它是操作系统级组件，不在 App 窗口内。始终可见，即使用户在用其他应用。

#### 功能 A：常驻信息展示 `[V1] [新增]`

始终显示：
1. 当前正在执行的任务名
2. 已用时间 / 预估时间的进度条
3. 下一个计划任务是什么

**心理角色**：时间盲矫正 · 持续感知

#### 功能 B：漫游模式检测 `[V1] [新增]`

检测条件：5 分钟内切换窗口超过 15 次、每个停留不到 20 秒 → 判定为「漫游」

检测到后温和介入：「看起来你不太确定要做什么。要不要我帮你选一个任务？」→ 连接到此刻引擎

**心理角色**：元认知激活 · 行为模式识别

**实现要点**：
- Tauri 层系统托盘增强
- 新组件 `src/components/StatusBar/StatusBarWidget.tsx`
- 新服务 `src/services/wanderingDetector.ts`
- 点击展开快捷操作面板（暂停/切换/查看进度/打开主窗口）

---

<!-- SECTION 10 -->
## 10. 功能逻辑图与依赖关系

### 10.1 用户一天的使用流程

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  晨间启动  │──→│ 此刻引擎  │──→│ 启动助推  │──→│ 专注执行  │──→│ 日终闭环  │
│ Dashboard │    │Dashboard │    │Focus覆盖 │    │Focus覆盖 │    │Review弹窗│
│(自动弹出) │    │(AI推荐)  │    │(第一步)  │    │(番茄钟)  │    │(自动弹出)│
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                       ↑              │                │               │
                       │              │                ↓               │
                       │              │         ┌──────────┐           │
                       │              │         │ 打断处理  │           │
                       │              │         │(弹窗选择)│           │
                       │              │         └──────────┘           │
                       │              │                │               │
                       └──────────────┘                │               │
                        被打断后恢复 ←─────────────────┘               │
                                                                      │
                 如果没计划：此刻引擎自动推荐     ←── 明日一件事 ──────┘
```

### 10.2 功能 × 页面 关联矩阵

| 功能模块 | Dashboard | Timeline | Task | Analytics | Settings | Focus(覆盖) | Review(弹窗) | StatusBar |
|----------|:---------:|:--------:|:----:|:---------:|:--------:|:-----------:|:------------:|:---------:|
| 此刻引擎 | ● | | ◐ | | ◐ | ◐ | | ● |
| 启动助推 | ● | | ● | | | ● | | ● |
| 打断拦截 | | ◐ | | ◐ | ● | ● | ◐ | ● |
| 上下文快照 | ● | ◐ | | | | ● | | ● |
| 晨间仪式 | ● | | ◐ | | ◐ | | | |
| 日终闭环 | ● | ◐ | | ● | ◐ | | ● | |
| 漫游检测 | | ◐ | | ◐ | ● | | ◐ | ● |
| AI 用户画像 | ◐ | ◐ | ◐ | ● | ◐ | ◐ | ◐ | ◐ |

> ● = 主要涉及，◐ = 数据关联或辅助显示

### 10.3 心理干预管道：从拖延到完成

```
阶段1「觉察」          阶段2「决策」          阶段3「启动」
"我在拖延"             "我应该做什么"         "第一步做什么"
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ 漫游检测     │  ──→  │ 此刻引擎     │  ──→  │ 启动助推     │
│ StatusBar   │       │ AI推荐      │       │ Focus覆盖   │
│              │       │ Dashboard   │       │ "只要15分钟" │
└─────────────┘       └─────────────┘       └─────────────┘
                                                    │
            ┌───────────────────────────────────────┘
            ↓
阶段4「维持」          阶段5「完成」          阶段6「反思」
"保持专注"             "我做到了"             "今天怎么样"
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ 打断拦截     │  ──→  │ 正反馈机制   │  ──→  │ 日终闭环     │
│ 上下文快照   │       │ 完成动画     │       │ Review弹窗  │
│ Focus覆盖   │       │ XP/宠物(V2) │       │ Analytics   │
│              │       │ 进度可视化   │       │ AI 洞察      │
└─────────────┘       └─────────────┘       └─────────────┘
```

### 10.4 功能依赖关系图

```
                    ┌──────────────────┐
                    │    感知层数据流    │
                    │ (窗口监控·AI分类) │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ↓              ↓              ↓
      ┌──────────────┐ ┌──────────┐ ┌──────────────┐
      │  漫游检测     │ │ 偏离检测  │ │  空闲检测     │
      │(窗口切换频率) │ │(计划vs实际)│ │(已有·增强)   │
      └──────┬───────┘ └────┬─────┘ └──────┬───────┘
             │              │              │
             ↓              ↓              ↓
      ┌──────────────┐ ┌──────────┐ ┌──────────────┐
      │  此刻引擎     │ │ 打断拦截  │ │  上下文快照   │
      │(AI推荐任务)  │ │(温和提醒) │ │(保存恢复点)  │
      └──────┬───────┘ └────┬─────┘ └──────────────┘
             │              │
             ↓              ↓
      ┌──────────────┐ ┌──────────┐
      │  启动助推     │ │ StatusBar│
      │(第一步+15min)│ │(全局可见) │
      └──────────────┘ └──────────┘
             │
             ↓
      ┌──────────────┐     ┌──────────────┐
      │  日终闭环     │ ←── │  数据聚合     │
      │(Review弹窗)  │     │(打断/回避/时间)│
      └──────┬───────┘     └──────────────┘
             │
             ↓
      ┌──────────────┐
      │  晨间仪式     │
      │(明日一件事→   │
      │ 第一个推荐)   │
      └──────┬───────┘
             │
             ↓
      ┌──────────────┐
      │  AI Agent    │
      │(学习一切数据, │
      │ 持续优化画像) │
      └──────────────┘
```

### 10.5 开发依赖顺序（关键路径）

```
数据库 Schema 扩展 ──→ Zustand Store 扩展 ──→ IPC 命令扩展
         │                     │                     │
         └─────────┬───────────┘                     │
                   ↓                                 │
            此刻引擎服务  ←──────────────────────────┘
                   │
         ┌─────────┼─────────┐
         ↓         ↓         ↓
   NowEngine    LaunchBoost  偏离检测服务
   (Dashboard)  (Focus覆盖) (Focus覆盖)
         │         │         │
         │         │         ↓
         │         │    打断拦截弹窗 + 上下文快照
         │         │         │
         └─────────┼─────────┘
                   ↓
            StatusBar + 漫游检测
                   │
                   ↓
         晨间仪式 + 日终复盘
                   │
                   ↓
         执行守护统计 (Analytics)
                   │
                   ↓
         Settings 执行守护区 + Onboarding 更新
                   │
                   ↓
         Sidebar 重组（5 标签页）+ 页面重命名
```

---

<!-- SECTION 11 -->
## 11. 用户引导：产品内教育与能力培养

### 11.1 设计哲学：脚手架式教育

「脚手架」(Scaffolding) 是教育学概念：提供临时支撑，让学习者完成原本无法独立完成的任务，然后逐步撤除支撑。Trace 的 AI Agent 就是脚手架——初期高度辅助，随着用户能力增长，逐渐降低干预频率，最终用户能独立管理执行。

### 11.2 知识卡片系统（Knowledge Cards）`[V2]`

在产品的关键触点嵌入 30 秒可读完的心理学知识卡片。不是独立的「学习中心」，而是在上下文中自然出现。

| 触发场景 | 卡片内容 |
|----------|---------|
| 第一次被打断拦截时 | 「研究表明，被打断后平均需要 23 分钟才能完全恢复到之前的专注状态。这就是为什么我在你切走时提醒你——不是不信任你，而是帮你省下那 23 分钟。」 |
| 第一次使用「只要15分钟」 | 「心理学中的"foot-in-the-door"效应：一旦开始一个小行动，你的大脑会自然想要继续。大多数人在开始 15 分钟后会选择继续——因为启动才是最难的部分。」 |
| 日终复盘时看到时间黑洞 | 「很多人低估了"刷一会儿"的实际时间。这不是自控力差，而是大脑天生不擅长感知时间流逝。这就是为什么我让时间始终可见——帮你建立准确的时间感知。」 |
| 连续 3 天回避同一个任务 | 「拖延不是时间管理问题，而是情绪管理问题。你回避这个任务，可能是因为它引发了不愉快的情绪。试试把它拆成一个 10 分钟的小步骤，降低情绪门槛。」 |
| 第一次晨间仪式 | 「研究表明，"我打算在X时间做X事"的具体计划比"我今天要努力"的模糊意图，执行率高出 2-3 倍。你现在做的就是在形成这种高效计划。」 |
| 首次日终复盘 | 「自我批评不会减少拖延，反而会加重。自我同情才是打破拖延循环的关键。所以我先让你看你做了什么，再看改进空间。」 |

**实现要点**：
- 新组件 `src/components/KnowledgeCard.tsx`
- 卡片数据 `src/data/knowledgeCards.ts`（JSON，方便国际化）
- 每张卡片有唯一 ID，看过后记录到 store（不重复展示）
- 卡片可收藏，在 Settings 中回顾

### 11.3 渐进式脚手架撤除 `[V3]`

AI Agent 根据用户行为数据自动调整干预强度：

| 阶段 | 条件 | 干预水平 |
|------|------|---------|
| **初期** | 默认 | 高频：晨间仪式自动弹出，打断检测灵敏，每 25 分钟状态确认，日终复盘自动触发 |
| **中期** | 连续 2 周打断恢复 < 5min 且自主启动率 > 60% | 中频：打断检测延迟到 3 分钟，状态确认改为 45 分钟 |
| **后期** | 各项指标持续达标 1 个月 | 安静模式：只在检测到明显异常时才介入 |

### 11.4 Onboarding 引导流程优化 `[V1]`

首次使用时的引导从「功能教学」升级为「理念引导」：

> 「我不会给你一个 20 条的任务列表让你选，因为选择本身就消耗精力。我每次只告诉你一件事。」

引导步骤：此刻引擎 → StatusBar → 打断拦截 → 晨间/日终 → 设置个性化参数

**实现要点**：修改 `src/components/Onboarding.tsx`

---

<!-- SECTION 12 -->
## 12. 开发阶段：四版迭代路线图

### 12.1 总览

| 版本 | 代号 | 核心目标 | 关键词 |
|------|------|---------|--------|
| **V1** | 核心执行 MVP | 5 标签页 + 执行守护核心 + AI 基础推荐 | 能用 |
| **V2** | 智能守护 | AI 深度学习 + 行为模式识别 + 游戏化 + 知识卡片 | 好用 |
| **V3** | 认知训练 | 脚手架撤除 + 能力内化 + 自适应 + 外部 API | 离不开 |
| **V4** | 开放生态 | Agent 协议 + 团队 + 社交 + 平台 | 生态 |

### 12.2 V1 核心执行 — MVP

**页面**：Dashboard, Timeline, Task, Analytics, Settings + Focus(覆盖层) + Review(弹窗) + StatusBar(系统托盘)

**已有功能保留**：
- 自动活动追踪（窗口监控 + AI 分类）
- 时间线可视化
- 任务管理（多视图 + 优先级 + 子任务）
- 专注模式（番茄钟 + 环境音 + 干扰屏蔽）
- 基础统计
- 设置

**增强功能**：
- 任务增加「第一步」字段 + 「情绪标签」
- 时间块增加缓冲时间 + 此刻引擎联动
- 计划 vs 实际对比增强
- Sidebar 精简为 5 标签页
- Settings 整合所有散落配置
- Onboarding 引导流程优化

**全新功能（执行守护核心）**：
- 此刻引擎（AI 单一任务推荐）
- 启动助推（第一步引导 + 15 分钟门槛）
- 打断拦截器（温和提醒 + 三选项）
- 上下文快照（暂停保存 + 恢复引导）
- 系统托盘常驻条（任务 + 时间 + 下一个）
- 漫游模式检测（无目的切换识别）
- 晨间启动仪式
- 日终闭环复盘（正反馈优先 + 对账 + 明日一件事）
- 执行守护统计 Tab（Analytics 内）
- 执行守护设置区（Settings 内）

**核心价值**：解决最核心的三个问题——不知道做什么（此刻引擎）、启动不了（启动助推）、做着做着忘了（打断拦截 + 上下文快照）。

### 12.3 V2 智能守护 — AI 增强

**新增功能**：
- AI 智能排序增强（情绪权重 + 拖延衰减 + 能量曲线匹配）
- 「换一个」日志与回避模式分析
- AI 模式洞察（日终复盘中的个性化建议）
- 漫游模式检测增强（AI 辅助判定）
- 知识卡片系统
- 能量曲线（历史专注度热力图指导排程）
- AI 自动建议「第一步」
- AI 自动规划时间块
- 习惯打卡系统（Dashboard 卡片）
- 虚拟宠物系统（Dashboard 迷你组件）
- AI 用户画像基础版

**核心价值**：从「被动提醒」升级为「主动理解」。AI 开始识别个人行为模式，建议越来越精准。

### 12.4 V3 认知训练 — 能力内化

**新增功能**：
- 能力成长可视化（Analytics Growth Tab）
- 渐进式脚手架撤除（自动降低干预频率）
- 宠物智能对话（基于执行数据的个性化建议）
- 情绪日记集成
- 自适应番茄时长（根据个人注意力曲线调整）
- 深度 AI 教练（多轮对话式反思引导）
- 「回顾周」功能
- 外部 API 集成基础版（日历同步、邮件摘要等）
- AI 用户画像高级版

**核心价值**：从「工具依赖」转向「能力内化」。AI 有意识地减少存在感。

### 12.5 V4 开放生态 — 连接与扩展

**新增功能**：
- Agent-to-Agent 协议（MCP 等标准）
- 外部软件深度集成（Slack/飞书/微信/邮件/日历）
- 团队仪表盘
- 同伴专注
- 匿名数据基准
- 成就与徽章系统
- API 开放平台
- 企业版

**核心价值**：Trace 成为用户 AI 生态中的「时间与执行」节点。

---

<!-- SECTION 13 -->
## 13. 衡量标准

### 13.1 核心指标

| 指标 | 定义 | 目标方向 | 对应功能 |
|------|------|---------|---------|
| 任务完成率 | 计划任务中标记完成的比例 | ↑ 提升 | 此刻引擎 · 启动助推 |
| 预估偏差率 | \|预估时间 - 实际时间\| / 预估时间 | ↓ 降低 | 时间块 · 统计 |
| 平均打断恢复时间 | 从脱轨到恢复执行的平均分钟数 | ↓ 降低 | 打断拦截 · 上下文快照 |
| 日均打断次数 | 每天被打断的总次数 | ↓ 降低 | 干扰屏蔽 · 打断拦截 |
| 自主启动率 | 不需 AI 推荐就主动开始任务的比例 | ↑ 提升 | 脚手架撤除指标 |
| 漫游时间占比 | 无目的切换时间 / 总追踪时间 | ↓ 降低 | 漫游检测 |
| 深度工作占比 | 连续专注 ≥25min 的时间 / 总追踪时间 | ↑ 提升 | 专注模式 · 打断拦截 |
| 日终闭合率 | 完成日终复盘流程的天数比例 | ↑ 提升 | 日终闭环 |

### 13.2 预期效果（使用 3 个月后）

| 指标 | 干预前基线 | 3 个月后目标 |
|------|-----------|------------|
| 任务完成率 | ~35% | ~72% |
| 深度工作占比 | ~25% | ~55% |
| 自主启动率 | ~15% | ~60% |
| 日终闭合率 | ~20% | ~80% |
| 预估准确度 | ~40% | ~70% |
| 打断恢复速度 | ~30min | ~5min |

---

<!-- SECTION 14 -->
## 14. V1 开发任务清单（面向开发者）

> **阅读指南**：以下任务按 Sprint 划分，Sprint 之间有严格依赖关系。每个 Task 包含：涉及文件、前置依赖、实现描述、验收标准。AI Agent 读完即可编码。

### Sprint 0：页面重组与导航精简（前置工作，P0）

> **目的**：在开发新功能之前，先把房子的结构整理好。

#### Task 0.1：Sidebar 精简为 5 标签页

**前置依赖**：无
**涉及文件**：
- `src/components/Sidebar.tsx` — 修改导航项
- `src/App.tsx` — 修改路由配置

**实现描述**：
1. 修改 Sidebar 导航项为 5 个：Dashboard(`/`), Timeline(`/timeline`), Task(`/task`), Analytics(`/analytics`), Settings(`/settings`)
2. 移除 Focus, Habits, Pet 的标签页入口
3. 在 `App.tsx` 中将 `/planner` 路由改为 `/task`，`/statistics` 改为 `/analytics`
4. Focus Mode 改为全局覆盖层组件（不通过路由导航，通过 store 状态控制显隐）
5. 保留 Habits 和 VirtualPet 的代码文件但不在 V1 导航中显示

**验收标准**：
- [ ] Sidebar 只显示 5 个导航项
- [ ] Focus Mode 不再是独立路由，而是通过 `isFocusModeOpen: boolean` 控制的全屏覆盖层
- [ ] 原有的 `/planner` URL 重定向到 `/task`
- [ ] 原有的 `/statistics` URL 重定向到 `/analytics`
- [ ] 所有已有功能仍然正常工作

#### Task 0.2：页面文件重命名

**前置依赖**：Task 0.1
**涉及文件**：
- `src/pages/Planner.tsx` → 复制并修改为 `src/pages/Task.tsx`（保留原文件避免 git 历史丢失）
- `src/pages/Statistics.tsx` → 复制并修改为 `src/pages/Analytics.tsx`
- 所有 import 引用更新

**验收标准**：
- [ ] `Task.tsx` 和 `Analytics.tsx` 正常工作
- [ ] 无断裂的 import

#### Task 0.3：Settings 散落配置归拢

**前置依赖**：Task 0.1
**涉及文件**：
- `src/pages/Settings.tsx` — 增加新的设置区
- `src/components/Settings/` — 整理

**实现描述**：
1. 将 Focus Mode 中的环境音偏好配置入口移到 Settings
2. 将各处散落的 localStorage 配置统一到 Settings 页面展示和管理
3. 在 Settings 中增加「专注模式」分区（合并现有的 FocusSettingsSection 和 DistractionBlockingSection）
4. 增加「通知」分区

**验收标准**：
- [ ] Settings 页面有清晰的分区结构
- [ ] 所有可配置项都能在 Settings 中找到
- [ ] 其他页面不再有独立的「设置」入口（除了 Settings 本身的跳转链接）

---

### Sprint 1：数据层与基础设施（P0）

> **目的**：为所有执行守护功能准备数据基础。

#### Task 1.1：数据库 Schema 扩展

**前置依赖**：无
**涉及文件**：
- `src-tauri/src/database.rs` — 新增 migration
- `backend/models/database_models.py` — 新增 ORM 模型
- `backend/models/orm_models.py` — 更新

**实现描述**：新增/修改的数据表：

```sql
-- 任务表增加字段
ALTER TABLE tasks ADD COLUMN first_step TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN emotional_tag TEXT DEFAULT 'neutral'
  CHECK(emotional_tag IN ('easy', 'neutral', 'resist'));

-- 上下文快照表
CREATE TABLE context_snapshots (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  note TEXT DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resumed_at DATETIME,
  is_active BOOLEAN NOT NULL DEFAULT 1
);

-- 打断事件表
CREATE TABLE interruption_events (
  id TEXT PRIMARY KEY,
  focus_session_id TEXT,
  task_id TEXT REFERENCES tasks(id),
  interrupted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resumed_at DATETIME,
  duration_seconds INTEGER,
  interruption_type TEXT DEFAULT 'self'
    CHECK(interruption_type IN ('self', 'external', 'glance')),
  source_app TEXT,
  user_choice TEXT
    CHECK(user_choice IN ('resume', 'glance', 'pause')),
  note TEXT DEFAULT ''
);

-- 日终复盘记录表
CREATE TABLE daily_reviews (
  id TEXT PRIMARY KEY,
  review_date DATE NOT NULL UNIQUE,
  completed_tasks_count INTEGER DEFAULT 0,
  total_focus_minutes INTEGER DEFAULT 0,
  total_interruptions INTEGER DEFAULT 0,
  tomorrow_top_task TEXT DEFAULT '',
  mood_rating INTEGER CHECK(mood_rating BETWEEN 1 AND 5),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 执行守护配置表
CREATE TABLE guardian_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 漫游检测事件表
CREATE TABLE wandering_events (
  id TEXT PRIMARY KEY,
  detected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  window_switch_count INTEGER,
  duration_seconds INTEGER,
  user_action TEXT CHECK(user_action IN ('accepted_task', 'dismissed', 'ignored'))
);
```

**验收标准**：
- [ ] Tauri 层 migration 在 app 启动时自动执行
- [ ] 后端 ORM 模型同步更新
- [ ] 所有新表有对应的 CRUD IPC 命令

#### Task 1.2：Zustand Store 扩展 — executionGuardian slice

**前置依赖**：Task 1.1
**涉及文件**：`src/store/useAppStore.ts` — 新增 slice

**实现描述**：

```typescript
interface ExecutionGuardianState {
  // 此刻引擎
  currentRecommendedTask: Task | null;
  nowEngineSource: 'timeblock' | 'priority' | 'overdue' | 'tomorrow_top';

  // 执行状态
  isInFocusSession: boolean;
  isFocusModeOpen: boolean; // 控制 Focus 覆盖层显隐
  currentFocusTaskId: string | null;
  focusElapsedSeconds: number;

  // 打断状态
  isDeviating: boolean;
  deviationStartTime: number | null;
  deviationApp: string | null;

  // 上下文快照
  activeSnapshots: ContextSnapshot[];

  // 漫游检测
  isWandering: boolean;
  recentWindowSwitches: number;

  // 晨间/日终状态
  morningRitualCompleted: boolean;
  lastMorningRitualDate: string;
  eveningReviewCompleted: boolean;
  tomorrowTopTask: string;

  // 配置
  guardianSettings: {
    interruptionSensitivity: 'relaxed' | 'standard' | 'strict';
    wanderingThreshold: 'relaxed' | 'standard' | 'strict';
    reminderTone: 'gentle' | 'neutral' | 'direct';
    morningRitualEnabled: boolean;
    eveningReviewTime: string; // HH:mm
    bufferMinutes: number;
    quickStartMinutes: number;
  };
}

interface ExecutionGuardianActions {
  // Focus 覆盖层
  openFocusMode: (taskId?: string) => void;
  closeFocusMode: () => void;

  // 此刻引擎
  refreshRecommendedTask: () => void;
  skipRecommendedTask: (reason?: string) => void;
  acceptRecommendedTask: () => void;

  // 打断
  reportDeviation: (app: string) => void;
  handleDeviationChoice: (choice: 'resume' | 'glance' | 'pause') => void;

  // 快照
  createSnapshot: (note: string) => void;
  resumeSnapshot: (snapshotId: string) => void;

  // 日终
  completeMorningRitual: () => void;
  completeEveningReview: (tomorrowTask: string) => void;

  // 设置
  updateGuardianSettings: (settings: Partial<GuardianSettings>) => void;
}
```

**验收标准**：
- [ ] Store slice 初始化不影响现有功能
- [ ] `isFocusModeOpen` 控制 Focus Mode 覆盖层的显隐
- [ ] 配置项持久化到 localStorage / Tauri store
- [ ] 所有 action 有对应的数据库写入

#### Task 1.3：IPC 命令扩展

**前置依赖**：Task 1.1
**涉及文件**：
- `src/services/ipc/guardianIpc.ts` — 新建
- `src-tauri/src/main.rs` — 注册新命令

**实现描述**：

新增 Tauri IPC 命令：
```rust
// 上下文快照
#[tauri::command] fn create_context_snapshot(task_id, elapsed, note) -> Result<String>
#[tauri::command] fn get_active_snapshots() -> Result<Vec<ContextSnapshot>>
#[tauri::command] fn resume_snapshot(snapshot_id) -> Result<()>

// 打断事件
#[tauri::command] fn record_interruption(event: InterruptionEvent) -> Result<String>
#[tauri::command] fn get_interruptions_by_date(date) -> Result<Vec<InterruptionEvent>>
#[tauri::command] fn get_interruption_stats(start_date, end_date) -> Result<InterruptionStats>

// 日终复盘
#[tauri::command] fn save_daily_review(review: DailyReview) -> Result<String>
#[tauri::command] fn get_daily_review(date) -> Result<Option<DailyReview>>

// 漫游事件
#[tauri::command] fn record_wandering_event(event) -> Result<String>

// 执行守护配置
#[tauri::command] fn get_guardian_settings() -> Result<HashMap<String, String>>
#[tauri::command] fn set_guardian_setting(key, value) -> Result<()>
```

前端 IPC 桥接：
```typescript
// src/services/ipc/guardianIpc.ts
export const guardianIpc = {
  createSnapshot: (taskId: string, elapsed: number, note: string) =>
    invoke('create_context_snapshot', { taskId, elapsed, note }),
  getActiveSnapshots: () => invoke('get_active_snapshots'),
  resumeSnapshot: (snapshotId: string) => invoke('resume_snapshot', { snapshotId }),
  recordInterruption: (event: InterruptionEvent) => invoke('record_interruption', { event }),
  getInterruptionsByDate: (date: string) => invoke('get_interruptions_by_date', { date }),
  getInterruptionStats: (start: string, end: string) => invoke('get_interruption_stats', { startDate: start, endDate: end }),
  saveDailyReview: (review: DailyReview) => invoke('save_daily_review', { review }),
  getDailyReview: (date: string) => invoke('get_daily_review', { date }),
  recordWanderingEvent: (event: WanderingEvent) => invoke('record_wandering_event', { event }),
  getGuardianSettings: () => invoke('get_guardian_settings'),
  setGuardianSetting: (key: string, value: string) => invoke('set_guardian_setting', { key, value }),
};
```

**验收标准**：
- [ ] 所有 IPC 命令在 Tauri 层注册且可调用
- [ ] 前端 IPC 桥接文件导出所有方法
- [ ] 错误处理统一

---

### Sprint 2：此刻引擎 + 启动助推（P0）

> **目的**：解决「不知道做什么」和「启动不了」两个核心问题。

#### Task 2.1：此刻引擎推荐服务

**前置依赖**：Task 1.2
**涉及文件**：`src/services/nowEngine.ts` — 新建

**实现描述**：

```typescript
// 推荐算法（V1 简单版）
function getRecommendedTask(tasks: Task[], timeBlocks: TimeBlock[], tomorrowTop: string): {
  task: Task;
  source: 'timeblock' | 'tomorrow_top' | 'priority' | 'overdue';
} {
  // 1. 当前时间块绑定的任务
  const currentBlock = findCurrentTimeBlock(timeBlocks);
  if (currentBlock?.taskId) return { task: findTask(currentBlock.taskId), source: 'timeblock' };

  // 2. 昨日设定的「明日一件事」
  if (tomorrowTop) {
    const topTask = findTaskByName(tomorrowTop);
    if (topTask && !topTask.completed) return { task: topTask, source: 'tomorrow_top' };
  }

  // 3. 优先级最高的未完成任务
  const byPriority = tasks.filter(t => !t.completed).sort((a, b) => b.priority - a.priority);
  if (byPriority.length) return { task: byPriority[0], source: 'priority' };

  // 4. 拖延最久的任务
  const byOverdue = tasks.filter(t => !t.completed && t.dueDate)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  if (byOverdue.length) return { task: byOverdue[0], source: 'overdue' };

  return null;
}
```

**验收标准**：
- [ ] 正确实现 4 级优先序列
- [ ] 无任务时返回 null
- [ ] 单元测试覆盖各种场景

#### Task 2.2：NowEngine Dashboard 组件

**前置依赖**：Task 2.1
**涉及文件**：
- `src/components/Dashboard/NowEngine.tsx` — 新建
- `src/pages/Dashboard.tsx` — 集成

**实现描述**：
- Dashboard 中央显示单一推荐任务（大字体 + 第一步 + 预估时间 + 拖延天数）
- 「开始」按钮 → 触发 `openFocusMode(taskId)`
- 「换一个」按钮 → 切换到下一个推荐
- 无任务时显示引导创建任务

**验收标准**：
- [ ] Dashboard 中央显示单一推荐任务
- [ ] 点击「开始」触发 Focus Mode 覆盖层并关联该任务
- [ ] 点击「换一个」切换到下一个推荐
- [ ] 无任务时显示引导

#### Task 2.3：LaunchBoost 启动助推组件

**前置依赖**：Task 2.2, Task 1.2 (isFocusModeOpen)
**涉及文件**：
- `src/components/LaunchBoost.tsx` — 新建
- `src/pages/FocusMode.tsx` — 修改启动流程

**实现描述**：
- 在 Focus Mode 启动和倒计时之间插入一步引导
- 显示任务的 `first_step` 字段
- 提供 15 分钟和 25 分钟两个快捷选项
- 「直接开始」跳过链接

**验收标准**：
- [ ] Focus 启动流程增加引导步骤
- [ ] 显示 `first_step`
- [ ] 15 分钟和 25 分钟选项
- [ ] 可跳过
- [ ] 选择的第一步保存到 focus session

---

### Sprint 3：打断拦截 + 上下文快照（P0）

> **目的**：解决「做着做着忘了」和「被打断后无法恢复」的问题。

#### Task 3.1：偏离检测服务

**前置依赖**：Task 1.2, Task 1.3
**涉及文件**：`src/services/deviationDetector.ts` — 新建

**实现描述**：

```typescript
class DeviationDetector {
  private currentTask: Task;
  private allowedApps: string[]; // 任务关联的应用
  private sensitivity: 'relaxed' | 'standard' | 'strict';
  private thresholds = { relaxed: 300, standard: 120, strict: 60 }; // 秒

  onWindowChange(newApp: string, newTitle: string) {
    if (this.isAllowedApp(newApp)) return;
    this.deviationTimer = setTimeout(() => {
      this.triggerInterruptionAlert();
    }, this.thresholds[this.sensitivity] * 1000);
  }

  onReturnToAllowedApp() {
    clearTimeout(this.deviationTimer);
  }
}
```

**验收标准**：
- [ ] Focus 期间切换到非关联应用时开始计时
- [ ] 超过阈值时触发提醒
- [ ] 回到关联应用时自动取消
- [ ] 灵敏度可配置

#### Task 3.2：打断拦截弹窗

**前置依赖**：Task 3.1
**涉及文件**：`src/components/InterruptionAlert.tsx` — 新建

**实现描述**：
- 弹窗显示任务名 + 偏离时间
- 三个选项：回去继续 / 只是看一眼(3min倒计时) / 暂停任务
- 语气根据 Settings 配置变化
- 底部可选知识卡片提示
- 所有打断事件记录到数据库

**验收标准**：
- [ ] 弹窗显示正确信息
- [ ] 三个选项各自触发正确行为
- [ ] 「只是看一眼」启动 3 分钟倒计时悬浮窗
- [ ] 「暂停任务」触发上下文快照流程
- [ ] 数据记录到 `interruption_events` 表

#### Task 3.3：上下文快照组件

**前置依赖**：Task 3.2, Task 1.3
**涉及文件**：`src/components/ContextSnapshot.tsx` — 新建

**实现描述**：
- 暂停时弹出保存弹窗（任务名 + 已投入时间 + 一行文本输入）
- 恢复卡片在 Dashboard 和 StatusBar 显示
- 点击「继续」恢复 Focus session 并显示上下文

**验收标准**：
- [ ] 暂停时弹出保存弹窗
- [ ] 备注保存到数据库
- [ ] Dashboard 显示未恢复快照卡片
- [ ] 点击「继续」恢复 Focus session
- [ ] 数据持久化

---

### Sprint 4：系统托盘常驻条 + 漫游检测（P0）

#### Task 4.1：StatusBar 系统托盘组件

**前置依赖**：Task 1.2
**涉及文件**：
- `src/components/StatusBar/StatusBarWidget.tsx` — 新建
- `src/components/StatusBar/StatusBarPopover.tsx` — 新建
- `src-tauri/src/main.rs` — 系统托盘增强

**实现描述**：
- 系统托盘显示：当前任务名 + 已用时间/预估时间 + 下一个任务
- 每秒更新已用时间
- 点击展开快捷操作面板（暂停/继续/切换/查看进度/打开主窗口）
- 无活跃任务时显示「无进行中的任务」

**验收标准**：
- [ ] 系统托盘显示任务和时间
- [ ] 实时更新
- [ ] 操作面板可用

#### Task 4.2：漫游检测服务

**前置依赖**：Task 1.2, Task 1.3
**涉及文件**：`src/services/wanderingDetector.ts` — 新建

**实现描述**：

```typescript
class WanderingDetector {
  private switchBuffer: number[] = [];
  private thresholds = {
    relaxed: { switches: 20, window: 300 },
    standard: { switches: 15, window: 300 },
    strict: { switches: 10, window: 300 },
  };

  onWindowSwitch() {
    this.switchBuffer.push(Date.now());
    this.cleanOldSwitches();
    if (this.switchBuffer.length >= this.currentThreshold.switches) {
      this.triggerWanderingAlert();
    }
  }
}
```

**验收标准**：
- [ ] 正确检测高频窗口切换
- [ ] 触发温和提醒弹窗
- [ ] 弹窗连接到此刻引擎
- [ ] 非 Focus 时段也能检测
- [ ] 阈值可配置
- [ ] 事件记录到 `wandering_events` 表

---

### Sprint 5：晨间仪式 + 日终复盘（P0）

#### Task 5.1：晨间启动仪式

**前置依赖**：Task 2.2 (NowEngine)
**涉及文件**：
- `src/components/Dashboard/MorningRitual.tsx` — 新建
- `src/pages/Dashboard.tsx` — 集成

**实现描述**：
1. 检测当日首次打开（store: `lastMorningRitualDate`）
2. 流程：AI 问候 → 今日时间块概览 → 昨日未完成 + 明日一件事 → 确认/调整 → 「开始第一个任务」
3. 完成后不再重复弹出
4. 可在 Settings 关闭

**验收标准**：
- [ ] 每日首次打开自动显示
- [ ] 已完成不重复
- [ ] 可关闭
- [ ] 最后一步联动此刻引擎

#### Task 5.2：日终复盘组件

**前置依赖**：Task 1.3
**涉及文件**：
- `src/components/Review.tsx` — 新建
- `src/pages/Dashboard.tsx` — 增加入口

**实现描述**：
1. 成就区（正反馈优先）→ 对账区（计划vs实际 + 打断统计 + 时间黑洞）→ 明日预设区
2. 从 tasks/timeblocks/activities/interruptions 聚合数据
3. 「明日一件事」保存到 store
4. 定时自动弹出（默认 21:00，可配置）

**验收标准**：
- [ ] 正面信息优先展示
- [ ] 数据聚合正确
- [ ] 「明日一件事」保存后明天晨间仪式读取
- [ ] 自动弹出可配置
- [ ] Dashboard 有手动入口

---

### Sprint 6：执行守护统计 + Settings + Onboarding（P1）

#### Task 6.1：执行守护统计 Tab

**前置依赖**：Sprint 3, Sprint 4
**涉及文件**：
- `src/components/statistics/ExecutionGuardianStats.tsx` — 新建
- `src/pages/Analytics.tsx` — 增加 Tab

**验收标准**：
- [ ] 打断分析图表（每日趋势 + 来源分布）
- [ ] 拖延模式分析
- [ ] 能量曲线基础版（每小时平均专注时长热力图）

#### Task 6.2：执行守护设置区

**前置依赖**：Task 1.2
**涉及文件**：
- `src/components/Settings/ExecutionGuardianSection.tsx` — 新建
- `src/pages/Settings.tsx` — 集成

**验收标准**：
- [ ] 所有 7 项执行守护参数可配置
- [ ] 每个设置有说明
- [ ] 配置变更实时生效
- [ ] 有「恢复默认」按钮

#### Task 6.3：Onboarding 更新

**前置依赖**：Sprint 2, Sprint 3
**涉及文件**：`src/components/Onboarding.tsx` — 修改

**实现描述**：新增引导步骤——此刻引擎 → StatusBar → 打断拦截 → 晨间/日终 → 个性化设置。融入理念引导。

#### Task 6.4：Timeline 打断标记

**前置依赖**：Sprint 3
**涉及文件**：`src/pages/Timeline.tsx` — 修改

**实现描述**：在时间线上叠加渲染打断事件标记，点击展示详情。

---

### Sprint 7：集成测试 + 修复（P1）

#### Task 7.1：E2E 测试

**涉及文件**：`tests/` 目录

为所有新增功能编写 Playwright E2E 测试：
- 此刻引擎推荐逻辑
- 启动助推流程
- 打断拦截触发与选项
- 上下文快照创建与恢复
- 晨间仪式 / 日终复盘流程
- Settings 配置变更
- Sidebar 5 标签页导航

#### Task 7.2：全链路冒烟测试

验证完整的用户一天流程：晨间仪式 → 此刻引擎 → 启动助推 → 专注 → 被打断 → 恢复 → 完成 → 日终复盘 → 明日一件事

---

<!-- SECTION 15 -->
## 15. 技术实现指南

### 15.1 文件组织约定

新增文件统一遵循现有代码结构：

```
src/
├── components/
│   ├── Dashboard/
│   │   ├── MorningRitual.tsx          # 晨间启动仪式
│   │   ├── NowEngine.tsx              # 此刻引擎
│   │   └── (existing files...)        # 保留已有组件
│   ├── StatusBar/
│   │   ├── StatusBarWidget.tsx         # 常驻条主组件
│   │   └── StatusBarPopover.tsx        # 展开面板
│   ├── Settings/
│   │   ├── ExecutionGuardianSection.tsx # 执行守护设置
│   │   └── (existing files...)        # 保留已有组件
│   ├── statistics/
│   │   ├── ExecutionGuardianStats.tsx   # 执行守护统计
│   │   └── (existing files...)        # 保留已有组件
│   ├── InterruptionAlert.tsx           # 打断拦截弹窗
│   ├── ContextSnapshot.tsx             # 上下文快照
│   ├── LaunchBoost.tsx                 # 启动助推引导
│   ├── WanderingAlert.tsx              # 漫游检测提醒
│   ├── Review.tsx                      # 日终复盘（弹窗组件）
│   └── KnowledgeCard.tsx              # 知识卡片 (V2)
├── pages/
│   ├── Dashboard.tsx                   # 保留
│   ├── Timeline.tsx                    # 保留
│   ├── Task.tsx                        # 原 Planner.tsx 重命名
│   ├── Analytics.tsx                   # 原 Statistics.tsx 重命名
│   ├── Settings.tsx                    # 保留
│   └── FocusMode.tsx                   # 改为覆盖层组件
├── services/
│   ├── ipc/
│   │   ├── guardianIpc.ts             # 执行守护 IPC 桥接
│   │   └── (existing files...)
│   ├── deviationDetector.ts           # 偏离检测服务
│   ├── wanderingDetector.ts           # 漫游检测服务
│   └── nowEngine.ts                   # 此刻引擎推荐算法
└── data/
    └── knowledgeCards.ts              # 知识卡片数据 (V2)
```

### 15.2 状态管理约定

所有执行守护相关状态统一放在 `useAppStore` 的 `executionGuardian` slice 中。避免创建独立 store。

```typescript
// 读取状态
const recommendedTask = useAppStore(s => s.executionGuardian.currentRecommendedTask);
const isFocusOpen = useAppStore(s => s.executionGuardian.isFocusModeOpen);

// 触发 action
const { openFocusMode, refreshRecommendedTask } = useAppStore(s => s.executionGuardianActions);
```

### 15.3 Focus Mode 覆盖层架构

Focus Mode 不再是路由页面，而是全局覆盖层：

```tsx
// src/App.tsx
function App() {
  const isFocusModeOpen = useAppStore(s => s.executionGuardian.isFocusModeOpen);

  return (
    <div className="app">
      <Sidebar />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/task" element={<Task />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      {/* Focus Mode 全屏覆盖层 */}
      {isFocusModeOpen && <FocusMode />}

      {/* Review 弹窗 */}
      <ReviewAutoTrigger />

      {/* Morning Ritual 弹窗 */}
      <MorningRitualAutoTrigger />
    </div>
  );
}
```

### 15.4 事件流架构

```
┌──────────────┐
│  Tauri 层     │  每秒产出 window_change 事件
│  (Rust)       │  通过 tauri event 发送到前端
└──────┬───────┘
       │ tauri://event
       ↓
┌──────────────┐
│ trackingService│  接收事件，更新 activity store
│  (已有)       │
└──────┬───────┘
       │ store 订阅
       ↓
┌──────────────────────────────────┐
│ deviationDetector / wanderingDetector │
│  (新增 services)                      │
│  监听 store 变化，判断偏离/漫游        │
└──────┬───────────────────────────┘
       │ 触发 store action
       ↓
┌──────────────┐
│  UI 层        │  InterruptionAlert / WanderingAlert
│  (React)      │  弹窗组件响应 store 状态变化
└──────────────┘
```

### 15.5 关键注意事项

1. **不破坏现有功能**：所有新增功能通过 feature flag 控制，可单独开关
2. **性能**：偏离检测和漫游检测在前端 service 层运行，不在渲染循环中；使用 `requestIdleCallback` 或 debounce
3. **隐私**：打断事件数据存储在本地，不上传云端（除非用户主动开启同步）
4. **国际化**：所有新增文案同步更新 `src/i18n/zh-CN.json` 和 `src/i18n/en-US.json`
5. **无障碍**：弹窗支持键盘导航和 ESC 关闭
6. **测试**：每个新组件需有对应的 Playwright 测试用例

### 15.6 后端 API 扩展（V2+ 云同步）

V1 所有数据仅存本地（Tauri IPC）。V2 云同步时新增 REST 端点：

```
POST   /api/v1/guardian/snapshots          # 创建快照
GET    /api/v1/guardian/snapshots           # 获取活跃快照
PATCH  /api/v1/guardian/snapshots/:id       # 恢复快照
POST   /api/v1/guardian/interruptions       # 记录打断
GET    /api/v1/guardian/interruptions/stats  # 打断统计
POST   /api/v1/guardian/reviews             # 保存日终复盘
GET    /api/v1/guardian/reviews/:date       # 获取某日复盘
POST   /api/v1/guardian/wandering           # 记录漫游事件
GET    /api/v1/guardian/settings            # 获取配置
PUT    /api/v1/guardian/settings            # 更新配置
```

---

<!-- SECTION 16 -->
## 16. 外部 API 集成愿景

### 16.1 愿景

Trace 未来将通过接入外部软件 API，成为用户数字生活的「时间与执行」中枢。AI Agent 不仅知道你在电脑上做了什么，还知道你的日历、邮件、聊天、项目管理工具里发生了什么。

### 16.2 集成路线图

| 阶段 | 集成对象 | AI Agent 获得的能力 | 版本 |
|------|---------|-------------------|------|
| **基础** | 系统日历（Apple Calendar / Google Calendar） | 自动把会议时间标记为不可规划，在会议前提醒准备材料 | V3 |
| **通信** | 邮件（Gmail / Outlook）、即时通讯（Slack / 飞书 / 企业微信） | 检测到与当前任务相关的新消息时智能判断是否打断 | V3 |
| **项目** | 项目管理（Jira / Linear / Notion / Trello） | 自动同步任务状态，从项目管理工具导入任务到 Trace | V3 |
| **代码** | GitHub / GitLab | 检测到代码提交自动关联到对应任务，标记进度 | V4 |
| **生活** | 健康数据（Apple Health / Google Fit）、音乐（Spotify） | 了解睡眠质量对第二天能量的影响，专注时自动播放白噪音 | V4 |
| **AI 生态** | 其他 AI Agent（通过 MCP 协议） | Trace Agent 可被查询「他今天还有多少空闲时间」 | V4 |

### 16.3 集成架构

```
┌───────────────────────────────────────────────────┐
│                  Trace AI Agent                     │
│          (消费所有数据源，统一决策)                    │
└───────────────────┬───────────────────────────────┘
                    │
     ┌──────────────┼──────────────┬──────────────┐
     ↓              ↓              ↓              ↓
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 本地感知  │ │ 日历 API │ │ 通信 API │ │ 项目 API │
│(窗口监控) │ │(事件同步)│ │(消息过滤)│ │(任务同步)│
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### 16.4 数据安全原则

1. **所有外部 API 数据在本地处理**——不上传到 Trace 服务器
2. **用户完全控制授权**——随时可撤销任何集成
3. **最小权限原则**——只请求必要的 API 权限（如日历只读）
4. **数据隔离**——外部数据与 Trace 原生数据分表存储
5. **敏感信息脱敏**——邮件内容只提取主题和发件人，不存正文

### 16.5 为什么这是护城河

每接入一个新的数据源，AI Agent 对用户的理解就更深一层：

- 只有 Trace → 知道你在电脑上做了什么
- + 日历 → 知道你的时间被谁占了
- + 邮件 → 知道你有哪些待回复的事
- + 项目管理 → 知道你在团队中的角色和交付压力
- + 健康数据 → 知道你今天的身体状态

**这种全方位的用户理解，是任何单一工具无法复制的。**

---

---

<!-- SECTION 17 -->
## 17. Strategic Decisions Log

> Decisions made during product planning sessions. AI agents should follow these when developing.

### 17.1 Habits & Virtual Pet — Deferred to V2

**Decision**: Keep the code, hide from navigation. Do NOT permanently remove.

- Habits will return as a Dashboard widget card (daily check-in) in V2
- Virtual Pet will return as a Dashboard mini widget (motivation layer) in V2
- Both are already removed from `DEFAULT_MODULES` in `src/config/themes.ts`
- Code files (`src/pages/Habits.tsx`, `src/pages/VirtualPet.tsx`) remain in codebase
- No routes or nav items for these in V1

**Rationale**: The gamification layer is not the core value prop. The execution guardian loop must prove itself first. Once users are engaged, habits and pet features become natural retention boosters.

### 17.2 AI API Key Strategy — Hybrid Model (Details TBD)

**Decision**: Support both managed AI and user-provided API keys. Exact pricing and tier boundaries to be decided later — ask the product owner before implementing payment logic.

**Architecture**:
```
Settings → AI Configuration
  ├── Option A: "Use Trace AI" (managed, requires subscription — pricing TBD)
  │   └── User sees: toggle on, no key needed
  └── Option B: "Use your own key" (BYO)
      └── User sees: provider dropdown + API key input (already exists in Settings)
```

**Implementation notes**:
- The AI service layer (`src/services/`) must abstract the provider so the rest of the app doesn't care where inference comes from
- V1: BYO Key only (no managed service yet). The Settings UI already supports this.
- V2+: Add managed AI option when subscription infrastructure is ready
- **Do NOT hardcode any specific pricing or tier names into the UI**. Use feature flags.

### 17.3 Data Strategy — Local-First, Cloud Sync in V2+

**Decision**: V1 is 100% local (SQLite via Tauri). Multi-device sync and cloud storage are deferred to V2 or V3.

**V1 (current)**:
- All data in local SQLite database
- No server communication except optional BYO AI API calls
- Data export available (JSON/CSV)

**V2+ (future — do not build yet, but design for it)**:
- End-to-end encrypted cloud sync (user holds decryption key, server stores encrypted blobs)
- Same model as Standard Notes / Obsidian Sync
- Phone companion app reads from encrypted sync
- Privacy claim: "Your data is encrypted with your personal key. We cannot read it even if we wanted to."

**Architecture consideration for V1 developers**:
- Use the existing data service abstraction layer. Don't bypass it with direct localStorage calls.
- All data writes should go through `src/services/dataService.ts` or IPC commands, never direct DB access from components.
- This ensures V2 cloud sync can be added by replacing the data layer without touching UI code.

### 17.4 Beta Website Fixes Needed (trace-ai-zh.lovable.app)

The following issues were identified on the beta landing page and should be fixed:

| Issue | Current | Should Be |
|-------|---------|-----------|
| Fake social proof | "已有 1,017 人预约" (hardcoded) | Remove, or connect to real database count |
| Privacy claim too absolute | "我们不会上传、分析或出售你的任何数据" | "数据默认存储在本地。Pro 用户可开启端到端加密云同步，仅你持有解密密钥。" |
| E2E encryption misuse | "支持端对端加密" (but data is local) | "本地加密存储" (V1), or "云同步采用端到端加密" (V2) |
| Brand inconsistency | "时迹 TraceAI" in hero vs "时迹 Trace" elsewhere | Pick one: **时迹 Trace** |
| Gender selector | 男/女 in signup flow | Remove — unnecessary for time tracking, potential inclusivity issue |
| Dead links | Privacy Policy and Contact Us → `#` | Link to actual pages |
| Builder badge | "Edit with Lovable" visible | Hide or migrate to custom domain |

### 17.5 Development Constraints

**Critical context for AI agents doing development:**

1. **Solo developer** — the product owner is a single non-technical person using AI coding agents (Claude Code, Codex, etc.) to build
2. **No manual coding** — all code changes must be complete and working. Don't leave TODOs that require manual intervention.
3. **Incremental changes** — make small, testable commits. Don't refactor 20 files at once.
4. **English-first development** — write code, comments, and variable names in English. Chinese localization will be done as a separate pass after features are complete.
5. **Test before commit** — run `npm run build` (at minimum) before declaring a task complete. Ideally run any existing tests too.
6. **Feature flags** — all new execution guardian features must be behind feature flags so they can be toggled off if broken
7. **Don't break existing features** — the activity tracking, task management, timeline, and settings must continue working throughout development

### 17.6 Monetization Strategy (High-Level — Details TBD)

**Revenue sources under consideration** (do not implement payment yet):

| Source | Description | When |
|--------|-------------|------|
| Pro subscription | Managed AI (no BYO key), advanced analytics, priority support | V2 |
| Cloud sync | Encrypted backup + cross-device sync | V2-V3 |
| AI coaching reports | Weekly AI-generated execution coaching summaries | V2 |

**Competitive moat is NOT the data** — it's the execution guardian logic, the UX patterns, and the AI behavioral model that learns the user over time. Even if users export all data, they cannot replicate the Now Engine + Interruption Alert + Morning Ritual flow elsewhere.

---

<!-- SECTION 18 -->
## 18. Gap Analysis: Current Codebase vs V1 Plan

> Last updated: 2026-04-20. This section helps AI agents understand what exists and what needs to be built.

### 18.1 What Already Works (No Changes Needed)

| Feature | Files | Status |
|---------|-------|--------|
| Activity auto-tracking (window monitoring, AI classification) | `src/services/trackingService.ts`, Tauri layer | Complete |
| Task management (kanban/list/calendar, subtasks, priorities) | `src/pages/Planner.tsx` | Complete (needs rename to Task.tsx) |
| Focus Mode (Pomodoro, distraction blocking, ambient sounds) | `src/pages/FocusMode.tsx` | Complete (needs overlay refactor) |
| Timeline visualization | `src/pages/Timeline.tsx` | Complete |
| Statistics/charts | `src/pages/Statistics.tsx` | Complete (needs rename to Analytics.tsx) |
| Settings (theme, AI key, privacy, tracking rules, modules) | `src/pages/Settings.tsx`, `src/components/Settings/` | Complete |
| Zustand store, IPC layer, data service | `src/store/`, `src/services/ipc/`, `src/services/dataService.ts` | Complete |
| Onboarding flow | `src/components/Onboarding.tsx` | Basic — needs enhancement |

### 18.2 What Needs Refactoring (Small-Medium Effort)

| Task | Effort | Sprint |
|------|--------|--------|
| Sidebar: 8 tabs → 5 tabs | Small | Sprint 0 |
| Focus Mode: page route → overlay | Medium | Sprint 0 |
| Planner.tsx → Task.tsx rename | Small | Sprint 0 |
| Statistics.tsx → Analytics.tsx rename | Small | Sprint 0 |
| Settings consolidation (scattered config → unified) | Small-Medium | Sprint 0 |
| Store: add executionGuardian slice | Medium | Sprint 1 |

### 18.3 What Needs to Be Built from Scratch

| Feature | Complexity | Sprint | Files to Create |
|---------|-----------|--------|-----------------|
| DB schema (5 new tables) | Low | Sprint 1 | SQL migrations |
| Store executionGuardian slice | Medium | Sprint 1 | Modify `useAppStore.ts` |
| IPC guardian commands | Medium | Sprint 1 | `guardianIpc.ts`, Rust commands |
| Now Engine service | Medium | Sprint 2 | `nowEngine.ts` |
| NowEngine Dashboard component | Medium | Sprint 2 | `NowEngine.tsx` |
| LaunchBoost component | Medium | Sprint 2 | `LaunchBoost.tsx` |
| DeviationDetector service | High | Sprint 3 | `deviationDetector.ts` |
| InterruptionAlert modal | High | Sprint 3 | `InterruptionAlert.tsx` |
| Context Snapshot system | High | Sprint 3 | Components + service |
| Morning Ritual flow | Medium | Sprint 5 | `MorningRitual.tsx` |
| Daily Review flow | High | Sprint 5 | `DailyReview.tsx` |
| Wandering Detection | Medium | Sprint 4 | `wanderingDetector.ts` |
| StatusBar (system tray) | High | Sprint 4 | Tauri + `StatusBar.tsx` |
| Guardian analytics tab | Medium | Sprint 6 | Analytics section |
| Guardian settings section | Low | Sprint 6 | Settings section |

### 18.4 Recommended Beta Scope (Minimum Viable)

For fastest path to testable beta, build in this order:

**Must have (Core Loop)**:
1. Sprint 0: Navigation simplification (5 tabs, Focus → overlay)
2. Sprint 1: Data layer (DB schema, Store slice, IPC)
3. Sprint 2: Now Engine + Launch Boost
4. Sprint 5: Morning Ritual + Daily Review (basic versions)

**Should have (Key Differentiator)**:
5. Sprint 3: Interruption Alert + Context Snapshot

**Can defer to post-beta**:
6. Sprint 4: StatusBar + Wandering Detection
7. Sprint 6: Guardian analytics + settings UI (use defaults)

**With this scope, the beta delivers**: "AI tells you one task → helps you start it → bookends your day with ritual and review."

---

> **Document end**. This document should be updated continuously as the product evolves. Any feature changes should be reflected here.
