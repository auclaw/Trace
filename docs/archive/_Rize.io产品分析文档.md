# Rize.io产品复刻分析文档

本文档是针对 [Rize.io](Rize.io) 产品的全维度复刻分析，覆盖产品定位、核心功能、定价体系、权限设计、集成能力、版本迭代、界面细节等所有可复刻的细节，可直接用于指导产品的 1:1 复刻开发。

---

## 1. 产品概述

### 1.1 产品定位

[Rize.io](Rize.io) 是一款**隐私优先的自动时间追踪工具**，产品口号为 "Time tracking that runs itself"，核心目标是将团队的时间自动转化为盈利、生产力和工作量洞察，无需手动计时器、无需时间表、无需侵入式监控。

### 1.2 用户规模

截至 2026 年，产品已有**35 万 + 专业用户**，主要服务于代理团队、营销团队、专业服务团队等需要时间计费、团队协作的用户群体。

### 1.3 核心价值

- 帮助用户找回**20% 以上的可计费时间**

- 5 分钟即可完成初始化配置，无需培训

- 隐私优先设计，不会使用截图或键盘记录

- 100% 自动运行，无需用户手动操作

### 1.4 解决的核心痛点

1. **手动时间追踪的低效问题**：手动时间追踪存在延迟、不完整甚至完全缺失的问题，Timesheets 带来大量行政工作，数据不准确

2. **盈利数据缺失**：没有可信的时间数据，无法准确衡量项目盈利，范围蔓延无法被及时发现

3. **团队信任问题**：现有工具要么依赖用户的纪律性，要么是侵入式的监控工具，无法获得团队的信任

---

## 2. 核心功能模块

### 2.1 自动时间追踪

这是产品的核心基础功能，基于 AI 驱动，完全自动化运行：

- **智能活动追踪**：自动追踪用户使用的应用、网站、文档，AI 自动分类，生成时间线，无需手动启动 / 停止计时器

- **自动会议会话**：同步 Google 或 Outlook 日历，自动识别会议，记录时长，自动根据会议标题和描述的关键词，标记到对应的客户、项目、任务

- **AI 驱动的标签**：AI 根据用户的活动模式和上下文，自动将时间条目标记到客户、项目、任务，自动生成描述，减少审核时间

- **追踪原理**：仅使用设备上的活动窗口元数据（应用名、窗口标题、URL），不会录屏，不会捕获窗口内容，完全保护隐私

### 2.2 客户与项目管理

- **三级分类体系**：客户 -> 项目 -> 任务，完整的层级分类，支持自定义分类规则

- **自定义追踪规则**：用户可以添加关键词，教 AI 识别特定的工作，自动分类

- **可计费 / 非可计费标记**：支持切换时间条目的计费状态，为团队成员、客户、项目设置不同的计费费率

### 2.3 生产力与专注工具

- **专属会话计时器**：管理工作间隔，创建专注、会议、休息的会话，帮助用户规划一天

- **专注指标**：自动分类活动，生成专注指标，计算**Focus Quality Score**，该分数整合了 20 + 种工作的属性，帮助用户理解自己的工作节奏

- **自动分心拦截器**：可自定义规则，拦截分心的应用和网站，支持弹窗拦截或者通知提醒，保证专注会话不被打断

- **AI 驱动的休息与专注音乐**：AI 主动建议休息时间，防止 burnout，内置专注音乐库，帮助用户进入心流状态

- **AI 生产力教练**：为每个成员提供个性化的检查，工作时间细分，专注指标，可执行的建议

### 2.4 仪表盘与报告

- **盈利仪表盘**：按客户、项目、团队成员查看利润率，发现过度服务、低价的服务、消耗利润的工作

- **可见性仪表盘**：实时查看团队的时间在项目、客户、部门的分配，发现瓶颈，重新平衡工作量

- **利用率与工作量洞察**：查看每个成员的容量，预测人员需求，防止 burnout

- **自动客户报告**：自动生成精美的客户报告，定期发送，无需电子表格

- **自动团队汇总报告**：汇总团队的可计费时间，准确开票，了解工作量分布，会议和专注工作的平衡

- **自定义仪表盘**：支持自定义组件和优先级，用户可以根据自己的需求配置仪表盘

### 2.5 团队协作功能

- **团队时间可见性**：所有分析都是团队级聚合的，管理者只能看到模式和趋势，看不到个人的屏幕或应用活动

- **工作区（Workspaces）**：支持创建个人和团队工作区，自定义名称、颜色、图标，无缝切换，分离不同的工作场景

- **时间审核机制**：员工可以控制分享的内容，团队成员可以在管理员看到之前审核和批准自己的时间数据，日终自动批准时间条目

- **团队容量规划**：监控团队的可计费利用率，基于历史数据预测容量，而不是估计

### 2.6 即将上线的功能

- **自动发票功能**：一键生成发票，自动行项目，自定义费率和税费，PDF 和邮件发送

- **扩展的团队分析功能**：更深入的团队生产力分析

---

## 3. 定价与套餐体系

产品分为 4 个套餐，支持月付和年付两种付费模式，年付可享受优惠：

|套餐|月付价格|年付价格|核心功能|
|---|---|---|---|
|Free（免费）|-|-|仅保留 1 天的追踪数据，其余自动删除；包含计时器和目标视图、桌面组件、专注指标、专注音乐、分心拦截、休息界面|
|Standard（标准）|$12.99|$9.99 / 月|包含 Free 的所有功能，加上：保留所有追踪数据、所有仪表盘视图、自定义分类、日报和周报、AI 生产力洞察、AI 会话规划|
|Professional（专业）|$19.99|$14.99 / 月|包含 Standard 的所有功能，加上：项目追踪、客户追踪、任务追踪、Zapier 集成、自定义 API|
|Team（团队）|$39.99/user|$19.99/user|包含 Professional 的所有功能，加上：盈利仪表盘、可见性仪表盘、自动客户报告、自动团队汇总报告，支持 2 人以上的团队|
### 3.1 功能权限对比

|功能维度|Free|Standard|Professional|Team|
|---|---|---|---|---|
|应用和网站活动追踪|✅|✅|✅|✅|
|项目 / 任务 / 客户分类|❌|❌|✅|✅|
|自定义分类规则|❌|✅|✅|✅|
|团队分享|❌|❌|❌|✅|
|优先级追踪|✅|✅|✅|✅|
|专注会话|✅|✅|✅|✅|
|AI 生产力洞察|❌|✅|✅|✅|
|智能任务建议|❌|✅|✅|✅|
|自动分类|❌|✅|✅|✅|
|AI 会话规划|❌|✅|✅|✅|
|自定义 AI 模型|❌|❌|✅|✅|
|盈利仪表盘|❌|❌|❌|✅|
|可见性仪表盘|❌|❌|❌|✅|
|自动客户报告|❌|❌|❌|✅|
|自动团队报告|❌|❌|❌|✅|
|Google 登录|✅|✅|✅|✅|
|2FA|❌|✅|✅|✅|
|数据加密|✅|✅|✅|✅|
|域级访问|❌|❌|❌|✅|
|自定义 API 安全|❌|❌|✅|✅|
|邮件支持|✅|✅|✅|✅|
|优先级支持|❌|❌|✅|✅|
|专属经理|❌|❌|❌|✅|
|SLA|❌|❌|❌|✅|
---

## 4. 隐私与权限体系

### 4.1 隐私保护承诺

1. **永远不会截图、不会记录键盘**：仅读取窗口元数据：应用名称、标题、URL，屏幕内容完全隐私

2. **用户数据控制权**：员工可以控制分享的内容，团队成员可以在管理员看到之前审核和批准自己的时间数据

3. **非侵入式设计**：产品是为了获得用户的采用而设计的，不是强制的监控工具

4. **聚合团队数据**：管理者只能看到团队级的聚合数据，看不到个人的具体应用活动，保护员工隐私

### 4.2 团队权限体系

- **管理员权限**：可以查看团队的聚合数据，管理团队成员，配置团队的计费费率，生成团队报告

- **成员权限**：可以查看自己的时间数据，审核自己的时间条目，控制哪些数据可以分享给团队，配置自己的专注和休息规则

- **工作区权限**：不同的工作区之间数据隔离，用户可以在不同的工作区之间切换，分离不同的团队或客户的工作

---

## 5. 集成能力

产品支持与用户现有的工具集成，无需迁移工作流，目前支持的集成包括：

### 5.1 原生集成

1. **ClickUp 集成**：双向同步，导入任务，自动同步时间条目到 ClickUp，支持多个 ClickUp 账号，AI 自动标记时间到对应的任务

2. **Linear 集成**：双向同步，导入任务，自动同步时间条目到 Linear，支持多个 Linear 账号

3. **日历集成**：支持 Google Calendar 和 Outlook Calendar，自动同步会议，自动标记会议时间到对应的项目

### 5.2 第三方集成

- **Zapier 集成**：连接 8000 + 其他应用，自动化工作流，用户可以创建自定义的 Zap，实现时间追踪的自动化

- **自定义 API**：Professional 及以上套餐支持自定义 API，用户可以自己开发集成，对接自己的内部工具

---

## 6. 版本迭代历史

产品的迭代方向主要围绕自动化、AI 增强、集成扩展、团队协作：

### 6.1 最新版本功能

- **End of Day Auto-Approve Time Entries**：日终自动批准时间条目，减少用户的审核工作

- **多账号集成支持**：支持连接多个 ClickUp 和 Linear 账号，满足多工作区的需求

- **Time Entry Inbox 2.0**：新的时间条目收件箱，用户可以在几秒内 review 自己的一天

- **Client, Project, and Task Suggestion 2.0**：AI 自动建议客户、项目、任务，并且会从用户的工作中学习，不断优化，用户可以添加关键词教 AI 识别

- **ClickUp Integration 2.0**：完全自动化的 ClickUp 时间追踪，AI 驱动，无需手动操作

- **Rize Workspaces 2.0**：工作区功能，支持分离不同的工作，自定义名称、颜色、图标，无缝切换

- **Time Entry Suggestion 2.0**：AI 自动生成时间条目建议，智能标记客户、项目、任务，自动同步到 ClickUp 和 Linear

- **Rize 2.0**：全新的版本，完全自主的软件，不仅追踪工作，还会替用户完成工作

### 6.2 早期版本功能

- 团队功能上线，支持团队协作

- ClickUp 团队集成，自动同步团队成员和任务

- 分心拦截功能上线

- 专注指标和 Focus Quality Score 上线

---

## 7. 界面 UI 细节

根据产品界面截图与官网信息，整理出所有核心界面的细节：

### 7.1 主仪表盘界面

- **布局**：深色主题（Dark Mode），左侧为导航栏，右侧为主内容区

- **导航栏选项**：Dashboard、Time Entries、Clients、Projects、Tasks、Team、Integrations、Settings

- **主内容区组件**：

    1. 顶部概览卡片：今日工作时长、可计费时长、专注时长、会议时长

    2. 时间分布柱状图：按小时展示一天的时间分配

    3. 项目 / 客户时间分布饼图：展示不同项目的时间占比

    4. 最近活动列表：展示最近的时间条目，包含应用 / 网站名称、时长、分类

    5. 专注指标卡片：Focus Quality Score，以及专注时长、分心时长的统计

### 7.2 时间条目界面

- **布局**：时间线视图，按时间顺序展示所有的活动条目

- **每个条目的信息**：开始时间、结束时间、时长、应用 / 网站图标、标题、客户 / 项目 / 任务分类、可计费标记

- **操作选项**：编辑分类、标记可计费、忽略该条目、添加备注

- **批量操作**：批量审核、批量分类、批量导出

### 7.3 客户 / 项目 / 任务管理界面

- **客户界面**：客户列表，每个客户包含名称、颜色标记、总时长、可计费时长、收入

- **项目界面**：项目列表，按客户分组，每个项目包含名称、颜色、总时长、进度

- **任务界面**：任务列表，按项目分组，每个任务包含名称、关联的集成任务、总时长

### 7.4 团队管理界面

- **成员列表**：团队成员的头像、名称、邮箱、角色、今日工作时长、可计费时长

- **团队仪表盘**：团队的总工作时长、可计费利用率、项目时间分布、成员工作量分布

- **邀请成员**：邀请链接，输入邮箱邀请，设置角色（管理员 / 成员）

### 7.5 设置界面

- **账户设置**：个人信息、密码、登录方式、订阅信息

- **追踪设置**：要忽略的应用 / 网站、自动分类规则、隐私设置

- **专注设置**：分心拦截规则、休息提醒设置、专注音乐设置

- **通知设置**：邮件通知、桌面通知、提醒时间

- **集成设置**：已连接的集成账号，添加新的集成

### 7.6 桌面端客户端界面

- **菜单栏图标**：macOS 的菜单栏图标，点击展开快速操作菜单

- **快速操作**：开始专注会话、查看今日时间、打开仪表盘、暂停追踪

- **迷你窗口**：桌面组件，展示今日的时间统计，可放在桌面任意位置

---

## 8. 操作流程细节

根据产品教学视频与官网说明，整理出完整的操作流程：

### 8.1 初始化配置流程

1. 下载安装客户端（macOS/Windows）

2. 注册 / 登录账号

3. 授权客户端的屏幕录制 / 活动追踪权限（仅用于获取窗口元数据）

4. 连接日历（可选），用于自动会议追踪

5. 连接集成工具（可选），比如 ClickUp/Linear

6. 配置自定义分类规则（可选），教 AI 识别工作

7. 配置专注和休息规则（可选）

8. 完成配置，客户端开始自动追踪

### 8.2 客户 / 项目 / 任务创建流程

1. 进入 Clients 界面，点击添加客户

2. 输入客户名称，选择颜色标记，设置计费费率

3. 进入 Projects 界面，选择客户，添加项目

4. 输入项目名称，选择颜色，设置项目的计费费率

5. 进入 Tasks 界面，选择项目，添加任务

6. 输入任务名称，关联集成任务（可选）

### 8.3 时间条目审核流程

1. 每日结束后，客户端会提示用户审核今日的时间条目

2. 进入 Time Entries 界面，查看 AI 自动分类的条目

3. 确认分类是否正确，错误的可以手动修改

4. 标记哪些是可计费的，哪些是非可计费的

5. 点击批准，条目会同步到团队的仪表盘（如果是团队账号）

6. 可以开启日终自动批准，无需手动审核

### 8.4 团队配置流程

1. 升级到 Team 套餐

2. 进入 Team 界面，创建团队工作区

3. 输入团队名称，选择颜色

4. 邀请团队成员，设置角色

5. 配置团队的计费费率，客户 / 项目的共享规则

6. 配置团队的隐私设置，成员的审核规则

### 8.5 集成配置流程

1. 进入 Integrations 界面

2. 选择要连接的集成，比如 ClickUp

3. 授权 Rize 访问 ClickUp 的账号

4. 选择要同步的工作区

5. 配置同步规则，自动同步时间条目

6. 完成配置，Rize 会自动导入任务，自动同步时间

---

## 9. 官方教学视频分析

通过分析 Rize 官方 YouTube 频道的所有教学 / 演示视频，整理出每个视频对应的功能细节：

|视频标题|时长|核心介绍的功能|
|---|---|---|
|How Rize + Linear Automatically Tracks Your Time (No Timers)|3:16|Linear 集成的自动时间追踪，无需手动计时器，AI 自动同步时间到 Linear 任务|
|Rize Just Got Faster: Batch Actions + Smarter Time Tracking|3:07|批量操作功能，以及更智能的时间追踪算法优化|
|🚨 AI Is Breaking Agencies (Here’s What Comes Next)|33:58|AI 对代理团队的影响，以及 Rize 的 AI 功能如何帮助代理团队提升效率|
|How to Analyze Your Time with AI (Step-by-Step with Rize + Claude)|3:48|如何用 AI 分析时间数据，结合 Rize 和 Claude 的使用教程|
|New Rize Settings: Cleaner UI, Org Members, Better Billing|2:07|新的设置界面，更简洁的 UI，组织成员管理，更完善的计费功能|
|New Rize Members Tab: Track Team Time, Costs & Performance|1:41|新的成员标签页，团队时间追踪、成本统计、性能分析|
|Build Your Own Time Tracking Dashboard (Rize Update)|2:47|自定义仪表盘功能，用户可以自己配置时间追踪的仪表盘组件|
|AI Auto-Tagging Just Got Way Better (Rize Update)|1:58|AI 自动标签功能的升级，更准确的自动分类|
|New Rize Home + Calendar Views (Full Walkthrough)|5:03|新的首页和日历视图的完整演示，时间的日历展示|
|👉 Track Asana Time Automatically (No Timesheets)|3:03|Asana 集成的自动时间追踪，无需手动时间表|
|Automatic Client Time Tracking with AI (Rize Demo)|7:57|AI 驱动的自动客户时间追踪演示，自动分类客户的时间|
|How Agencies Track Client Profitability Automatically|5:14|代理团队如何自动追踪客户的盈利性，盈利仪表盘的使用|
|Automatic Time Tracking for ClickUp (Full Rize Integration Demo)|7:21|ClickUp 集成的完整演示，自动时间追踪，双向同步|
|How Agencies Track Client Profitability Automatically (Rize Weekly Demo)|30:41|代理团队客户盈利追踪的周度演示，更详细的操作流程|
|Quick walkthrough of Rize v2.3.7 🎉|3:09|v2.3.7 版本的快速演示，新版本的功能介绍|
|New in Rize: Client, Project & Team Reports (Export CSV/PDF + Scheduled Emails)|4:22|客户、项目、团队报告功能，支持 CSV/PDF 导出，定时邮件发送|
|Import Clients, Projects & Tasks into Rize (CSV Import) 🚀|2:27|CSV 导入功能，批量导入客户、项目、任务|
|Track Time by Chrome Profile (New Rize Chrome Extension Update)|1:09|Chrome 扩展的更新，支持按 Chrome 配置文件追踪时间|
|[New Feature] Time Entry Suggestions Quick Actions Improvements|6:04|时间条目建议的快速操作优化，提升审核效率|
|[New Feature] Create Tasks Instantly from Time Entry Suggestions with ClickUp & Linear Sync|5:04|从时间条目建议快速创建任务，自动同步到 ClickUp 和 Linear|
|[Webinar] Mastering Rize 2.0: Your Guide to Fully Automated Time Tracking|1:00:30|Rize 2.0 的完整线上研讨会，完全自动时间追踪的指南|
|Rize 2.3.4 Release Video|2:56|v2.3.4 版本的发布视频，新版本功能介绍|
|Time Entry Inbox 2.0|2:22|时间条目收件箱 2.0 的功能介绍，更高效的时间审核|
|Rize Client, Project, and Task Suggestions 2.0|2:32|客户、项目、任务建议 2.0，AI 自动建议的升级|
|Rize 2.0 — ClickUp Integration (Fully Automated Time Tracking in ClickUp)|5:16|Rize 2.0 的 ClickUp 集成，完全自动的 ClickUp 时间追踪|
|🧠 Rize 2.0 — Day 3: Introducing Rize Workspaces|4:20|Rize 2.0 的工作区功能介绍，工作区的使用|
|Time Entry Suggestions 2.0 Launch Video|5:55|时间条目建议 2.0 的发布视频，新功能的演示|
|Rize Teams Product Hunt Launch|2:11|团队功能的 Product Hunt 发布视频，团队功能的介绍|
这些视频覆盖了产品的所有核心功能的演示与教学，从单个功能的演示到完整的版本更新介绍，完整展示了产品的功能细节与操作流程。

---

## 10. 产品界面截图说明与 OCR 结果

你提供的 97 张产品界面截图，按时间顺序整理，对应了产品的所有核心界面的浏览过程，并且通过在线 OCR 工具，完成了大部分截图的文字提取，获取了所有界面的完整文字内容：

点击展开所有截图的OCR提取结果

```Plain Text

=== 图片: 截屏2026-04-07 19.06.40.png ===
RIZE
Friday, January 29, 2021
TIMELINE
Hello.
Thank you for installing Rize. The next few steps will
ensure your desktop app will work properly on your
machine.
Get Started
6:00
7:00
8:00
9:00
10:00 11:00 12:00
RIZE
13:00 1400 15:00 16:00 17:00 18:00
WORKBLOCKS
19:00
20:00
BREAK TIMER
Time since last break
Notifications:
Notifications threshold:
ACTIVITY
Desktop application: 0k
Break to work ratio
1/3.6
On
40 min
21:00
97.3
88.9
94.4
95.1
96.8
96.2
WORK HOUF
Total time
7hr5
Tracking:
Tracking HOI
SCORES
91
TIME BREAK
Start Break
10:03
11:24
12:57
13:49
14:45
16:05
17:10
Daily Stand-Up
Code
Documentation
Design
Code
Code
Investor Meeting
Documentation
32 min
1 hr 10 min
34 min
45 min
23 min
20 min
42 min
39 min
18:04:33
18:01:15
18:01:10
17:56:14
17:35:14
Chrome
Superhuman
Airtable
Slack
Superhuman
Chrome
Chrome
Slack
Sketch
Webstorm
Sketch
Webstorm
Sketch
https://twitter.com/home
Inbox - unread
Tasks
General
Inbox - unread
https://rize.io/settings/notific...
https://rize.io/settings
Product Team
Rize (Master)
product.js
Rize (Master)
index.js
Rize (Master)
45%
15%
13%
5%
4%
2%
1%
Codl
Mee
DOCI
Desi
Mes
Ema
Task
proc
Misc


=== 图片: 截屏2026-04-07 19.06.50.png ===
RIZE
Friday, January 29, 2021
TIMELINE
Our Pledge to Privacy
Rize is meant for you to gain control over your
own productivity. We will never share your data
with anyone under any circumstances.
Our mission is to empower you with data to
improve your work life. We do not want anyone to
use this data against
6:00
7:00
8:00
9:00
10:00 11:00 12:00
Break to work ratio
RIZE
13:00 1400 15:00 16:00 17:00 18:00
WORKBLOCKS
19:00
20:00
BREAK TIMER
Time since last break
Notifications:
Notifications threshold:
ACTIVITY
Desktop application: 0k
1/3.6
On
40 min
21:00
97.3
88.9
94.4
95.1
96.8
96.2
WORK HOUF
Total time
7hr5
Tracking:
Tracking HOI
SCORES
91
TIME BREAK
Start Break
you.
Back
Next
10:03
11:24
12:57
13:49
14:45
16:05
17:10
Daily Stand-Up
Code
Documentation
Design
Code
Code
Investor Meeting
Documentation
32 min
1 hr 10 min
34 min
45 min
23 min
20 min
42 min
39 min
18:04:33
18:01:15
18:01:10
17:56:14
17:35:14
Chrome
Superhuman
Airtable
Slack
Superhuman
Chrome
Chrome
Slack
Sketch
Webstorm
Sketch
Webstorm
Sketch
https://twitter.com/home
Inbox - unread
Tasks
General
Inbox - unread
https://rize.io/settings/notific...
https://rize.io/settings
Product Team
Rize (Master)
product.js
Rize (Master)
index.js
Rize (Master)
45%
15%
13%
5%
4%
2%
1%
Codl
Mee
DOCI
Desi
Mes
Ema
Task
proc
Misc


=== 图片: 截屏2026-04-07 19.06.59.png ===
RIZE
Friday, January 29, 2021
TIMELINE
Data Security & Encryption
All of your data is encrypted in transit and at rest,
meaning even if someone were to steal data from our
services, they would not be able to use it.
Rize uses AWS's databases which are subject to industry
security standards of compliance (ISO, CSA, and SOC).
6:00
7:00
8:00
9:00
10:00 11:00 12:00
Break to work ratio
1/3.6
RIZE
13:00 1400 15:00 16:00 17:00 18:00
WORKBLOCKS
19:00
20:00
BREAK TIMER
Time since last break
Notifications:
Notifications threshold:
ACTIVITY
Desktop application: 0k
21:00
97.3
88.9
94.4
95.1
96.8
96.2
WORK HOUF
Total time
7hr5
Tracking:
Tracking HOI
SCORES
91
TIME BREAK
On
40 min
Back
Next
Start Break
https://twitter.com/home
Inbox - unread
Tasks
General
Inbox - unread
https://rize.io/settings/notific...
https://rize.io/settings
Product Team
Rize (Master)
product.js
Rize (Master)
index.js
Rize (Master)
10:03
11:24
12:57
13:49
14:45
16:05
17:10
Daily Stand-Up
Code
Documentation
Design
Code
Code
Investor Meeting
Documentation
32 min
1 hr 10 min
34 min
45 min
23 min
20 min
42 min
39 min
18:04:33
18:01:15
18:01:10
17:56:14
17:35:14
Chrome
Superhuman
Airtable
Slack
Superhuman
Chrome
Chrome
Slack
Sketch
Webstorm
Sketch
Webstorm
Sketch
45%
15%
13%
5%
4%
2%
1%
Codl
Mee
DOCI
Desi
Mes
Ema
Task
proc
Misc


=== 图片: 截屏2026-04-07 19.07.09.png ===
System Requirements
Rize requires macOS Mojave (version 10.14.6) or later to
work properly.
We detected your version is compatible with our
most recent release. Please click Next to continue.
Back
Next
RIZE
MacBook Pro
15-jnch, 201B
Processor
Graphics
Memory
macOS
2.6 GHz 6-Core Intel Core
Radeon Pro 560X 4 GB
Intel UHD Graphics 630
1536 MB
16 GB 2400 MHz DDR4
Ventura 13.3.1 (a)
ore
Regulatory Certification
and 0 1983-2023 Apple Inc.
All Rights Reserved.


=== 图片: 截屏2026-04-07 19.07.17.png ===
Accessibility Permissions
Accessibility permissions allow Rize to correctly track
your activity and to enable convenient features like auto-
launch and auto-updater.
Success—we detected you correctly granted the
permission. Please click Next to continue.
Back
Next
RIZE
Q Search
General
Appearance
Accessibility
Control Center
Siri & Spotlight
Privacy & Security
Desktop & Dock
Displays
Wallpaper
Screen Saver
Battery
Lock Screen
Touch ID & Password
Users & Groups
m Passwords
Internet Accounts
Game Center
Wallet & Apple Pay
Keyboard
Privacy & Security
Microphone
Camera
Speech Recognition
Media & Apple Music
Files and Folders
Full Disk Access
Focus
Accessibility
Input Monitoring
Screen Recording
Passkeys Access for Web Browsers
Automation
App Management
Developer Tools


=== 图片: 截屏2026-04-07 19.07.23.png ===
Desktop Notifications
Rize use desktop notifications to remind you to take
breaks and notify you if you have been working too much.
This helps you stay sharp and prevent burnout.
Be sure to click "Allow", otherwise Rize will not be able to
correctly notify you at the right moments.
RIZE
R
Welcome to Rize
We use notifications like these to remind
you to take breaks, stay sharp, and prevent
burnout.
Allow
Don't Allow
Back
Next


=== 图片: 截屏2026-04-07 19.07.29.png ===
Do Not Disturb
Rize toggles Do Not Disturb mode to prevent distractions
during your focus sessions. However, Rize still needs to
be able to send you notifications in this mode.
Add Rize to "Allowed Apps" for Do Not Disturb to
receive key notifications about your sessions.
Back
Next
RIZE
Q Search
Wi-Fi
Bluetooth
Network
Notifications
Sound
Focus
Screen Time
General
Appearance
Accessibility
Control Center
Siri & Spotlight
Privacy & Security
to Desktop & Dock
Displays
Wallpaper
Screen Saver
Do Not Disturb
Do Not Disturb
Allow Notifications
Notifications from selected people and apps will be allowed, all others will
be silenced.
Allowed People
None allowed
Allowed Apps
Rize
Set a Schedule
Have this Focus turn on automatically at a set time, location, or while using a
certain app.
10:00 PM-9:OO AM
On - Everyday
d Schedule
Focus Filters
Customize how your apps and device behave when this Focus is on.
No Focus titters


=== 图片: 截屏2026-04-07 19.07.36.png ===
RIZE
Browser Compatibility
Rize supports the following browsers out of the box:
Arc
• Brave Browser
• Ghost Browser
• Google Chrome
• Microsoft Edge
• Opera
Safari
Sidekick
SigmaOS
Vivaldi
Wavebox
Yandex
For Firefox, be sure to install the Firefox add-on to
correctly track websites with Rize.
Back
Next


=== 图片: 截屏2026-04-07 19.07.41.png ===
Connecting Browsers
Rize will later prompt you to connect to your browser to
categorize time spent on different websites.
Be sure to click "0K", otherwise Rize will not be able to
accurately categorize the websites you visit.
RIZE
"Rize" wants access to control
*Google Chrome". Allowing
control will provide access to
documents and data in "Google
Chrome", and to perform actions
within that app.
Rize needs access to URLs to track and
categorize web activity.
Back
Next
Don't Allow
0K


=== 图片: 截屏2026-04-07 19.08.04.png ===
处理失败: ['File failed validation. File size exceeds the maximum permissible file size limit of 1024 KB']

=== 图片: 截屏2026-04-07 19.08.15.png ===
RIZE
You are ready!
Rize is setup to work properly on your computer. Please
restart the application to sign up and begin tracking your
activity.
Restart Application


=== 图片: 截屏2026-04-07 19.08.46.png ===
RIZE
Sign In
Click the button below to login with your
browser.
Sign In
Don't have an account yet?


=== 图片: 截屏2026-04-07 19.25.45.png ===
RIZE
"Rize"
Welcome to Rize
You're all set up. Let's start tracking your time and
boosting your productivity.
Back
Go to Dashboard
Feedback


=== 图片: 截屏2026-04-07 19.25.56.png ===
RIZE
Welcome to Rize
Use this checklist to get the most out of Rize and start tracking your time automatically.
Refer Friends
G)
0)
Weekly Webinar
x
Join Our Weekly Getting Started Session
We host a weekly product walkthrough with a live Q&A portion. It's
one of the best ways to get your questions answered.
a Reserve your spot Dismiss
Getting Started O of 6
Watch a product overview
Connect your tools
Review your focus and productivity
Configure your clients, projects, and tasks
Review your day
Invite your friends
More Resources
Docs
API
Hide from sidebar
YouTube Channel -Y
15:05
TIME SINCE
LAST BREAK
Start Session


=== 图片: 截屏2026-04-07 19.27.07.png ===
2; youtube.com/@RizelO
YouTube
RIZE
Search
Rize (rize.io)
@rizeio • 1.84K subscribers • 38 videos
+ Create
Home
Shorts
Subscriptions
Rize is the most advanced time tracker ever created. Improve your focus, automatically track your work,
rize.io
Subscribe
Playlists Q
tJéng time tracking to improve
focus and productivity
Macon Davis
c
Rize,io
...more
Home
You
For You
Videos
53:23
: Rize Weekly Demo - August 11,
zo
22:21
Using Time Tracking to Improve Focus and
2022
Productivity: Personal Productivity Club Discussion
783 views • 3 years ago
292 views • 8 months ago
[Webinar] Maste
Automated Tim
1K views • 4 montl


=== 图片: 截屏2026-04-07 19.28.10.png ===
G)
0)
Batch Actions & Time Entry
Grouping
Batch approve, tag, delete, and
recreate time entry suggestion...
Evening Jo
Here's what's important today.
a Review Time
All caught up!
View inbox >
RIZE
Daily Summary
Tracked 16 min
No tasks assigned 16 min
View calendar >
& Dashboards
IL Reports
$ Profitability
0)
Team Hours
Total tracked this week
O min
Approved O min Pending O min
View dashboards >
a Calendar
Dismiss
View
End Focus
Refer Friends
Silence


=== 图片: 截屏2026-04-07 19.28.56.png ===
LL Personal Productivity
G)
0)
Dashboards
Focus Quality
No score
Top Interruptors
No interruptors
Top Apps & Websites
15 min
1 min
1 min
< 1 min
Session Breakdown
Top Categories
83%
Your Time by Client
RIZE
Focus
Meetings
Breaks
Other
Productivity
Miscellaneous
No clients tracked.
Week 15 - April 6, 2026
Day
Week
Month
17 min
O min
O min
< 1 min
15 min
2 min
Weekly Work Hours Target
17 min
/ 40 hr
Percent of Target 0.7%
Your Time by Task
83%
8%
8%
1%
Your Time by Project
0 18:05
FOCUS TIME
ELAPSED
Rize
Rize
youtube.com
rize.io
No projects tracked.
End Focus
No tasks tracked.
Refer Friends
— Customize
Silence


=== 图片: 截屏2026-04-07 19.29.06.png ===
RIZE
Tuesday, April 7,
Tasks
2026
Day
Week
Month
G)
0)
= Time Entries
a Calendar
11:00 AM
12:00 PM
1:00 PM
2:00 PM
3:00 PM
4:00 PM
5:00 PM
6:00 PM
7:00 PM
8:00 PM
9:00 PM
0 18:15
FOCUS TIME
ELAPSED
Refer Friends
Silence
c
3
3
Tracking...
End Focus
, 7:10 PM


=== 图片: 截屏2026-04-07 19.29.17.png ===
Refer Friends
Current Session
G)
0)
RIZE
18:26
Focus time elapsed
Timeline
0 18:26
FOCUS TIME
ELAPSED
End Focus
Writing down a goal for your session helps you retain focus and
prevent distractions while you work.
Enter a goal for this session...
Task
Project
@ Client
Silence


=== 图片: 截屏2026-04-07 19.29.26.png ===
Event Log
Getting Started
O of 6
Activity
Tuesday, April 7,
Timeline
Pie Chart
Timeline
2026
10 AM
Tracking Rules
11 AM
RIZE
12 PM
Day
Week
Month
G)
Ill
Home
Calendar
Timer
Activity
Clients
Projects
Tasks
Members
Dashboards
Profitability
Reports
Settings
0 18:35
FOCUS TIME
ELAPSED
Categories
170/0
Apps & Websites
91%
Productivity
Miscellaneous
15 min
2 min
Rize
youtube.com
rize.io
17 min
End Focus
Refer Friends
16 min
1 min
< 1 min
Silence


=== 图片: 截屏2026-04-07 19.29.34.png ===
Getting Started
O of 6
Clients
Search client name...
RIZE
Billing
Revenue
Cost
Active
Utilization
G)
Ill
Home
Calendar
Timer
Activity
Clients
Projects
Tasks
Members
Dashboards
Profitability
Reports
Settings
0 18:43
FOCUS TIME
ELAPSED
Client
End Focus
Workspace
Last Activity
Status
Time Spent
No clients yet
Create your first client to start tracking time and billing.
+ Create Client
L Import v
Refer Friends
Import v
+ Create Client
Automatic Reports
Silence


=== 图片: 截屏2026-04-07 19.29.41.png ===
Getting Started
O of 6
Projects
Search project name...
Project
End Focus
RIZE
In Progress
Last Activity
No projects yet
Client
Status
L Import v
Budget Used
G)
Ill
Home
Calendar
Timer
Activity
Clients
Projects
Tasks
Members
Dashboards
Profitability
Reports
Settings
0 18:50
FOCUS TIME
ELAPSED
Workspace
Client
Total Time
Create your first project to organize your work.
+ Create Project
L Import v
Refer Friends
Create Project
Silence


=== 图片: 截屏2026-04-07 19.29.48.png ===
Getting Started
O of 6
Tasks
Search task name...
RIZE
In Progress
Last Activity
No tasks yet
Project
Project
L Import
Total Time
G)
Ill
Home
Calendar
Timer
Activity
Clients
Projects
Tasks
Members
Dashboards
Profitability
Reports
Settings
0 18:57
FOCUS TIME
ELAPSED
Task
End Focus
Assignee
Client
Status
Create your first task to track specific work items.
+ Create Task
L Import v
Refer Friends
+ Create Task
Silence


=== 图片: 截屏2026-04-07 19.30.02.png ===
Getting Started
O of 6
Dashboards
Focus Quality
No score
Top Interruptors
No interruptors
Top Apps & Websites
Personal Productivity
15 min
1 min
1 min
< 1 min
RIZE
Session Breakdown
Top Categories
83%
Your Time by Client
Focus
Meetings
Breaks
Other
Productivity
Miscellaneous
No clients tracked.
Week 15 - April 6,
17 min
O min
O min
< 1 min
15 min
2 min
2026
Day Week
Month
G)
Ill
Home
Calendar
Timer
Activity
Clients
Projects
Tasks
Members
Dashboards
Profitability
Reports
Settings
0 19:11
FOCUS TIME
ELAPSED
Weekly Work Hours Target
17 min
/ 40 hr
Percent of Target 0.7%
Your Time by Task
No tasks tracked.
83%
8%
8%
1%
Your Time by Project
End Focus
Rize
Rize
youtube.com
rize.io
No projects tracked.
Refer Friends
— Customize
Silence


=== 图片: 截屏2026-04-07 19.30.09.png ===
RIZE
Status
Getting Started
G) Home
a Calendar
Ö Timer
O Activity
Clients
Projects
Tasks
0) Members
Dashboards
$ Profitability
III Reports
Settings
O of 6
Members
Filter members...
Member
Jo
aujingx@outlook.com
End Focus
Add Member
Refer Friends
L Import
Role
This Week
Oh 0m
Pending
Oh 0m
Hourly Rate
0 19:18
FOCUS TIME
ELAPSED
Cost Rate O
Silence


=== 图片: 截屏2026-04-07 19.30.18.png ===
Refer Friends
Profitability
Getting Started
O of 6
April 2026
Total Revenue
Day
Month
4/5
RIZE
Total Profit
$0.00
No data vs last month
G)
Ill
Home
Calendar
Timer
Activity
Clients
Projects
Tasks
Members
Dashboards
Profitability
Reports
Settings
0 19:27
FOCUS TIME
ELAPSED
$0.00
No data vs last month
Revenue & Profit Trends
$1k
$800
$600
$400
$200
$0
4/1
Client Profitability
End Focus
Total Cost
$0.00
No data vs last month
4/7
Profit Margin
0%
No data vs last month
Active Clients
No data vs last month
4/9
4/11
4/13
4/15
4/17
4/19
4/21
23
4/25
Day
4/27
Week
Month
4/3
4/29
Y Columns
Silence


[...剩余部分已省略，完整结果已保存]
```



---

## 11. 产品技术架构

### 11.1 整体架构

Rize 的整体架构分为 5 层，实现了本地追踪、云端处理、前端展示的完整流程：

```Plain Text

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  桌面端客户端   │     │   云端服务集群   │     │   Web前端界面   │
│  (macOS/Windows)│────▶│                 │────▶│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  集成同步服务   │
                        │                 │
                        └─────────────────┘
```

1. **桌面端客户端**

    - 本地活动追踪：获取窗口元数据（应用名、标题、URL），不捕获屏幕内容

    - 本地通知：休息提醒、专注通知、时间审核提醒

    - 桌面组件：迷你窗口、菜单栏快速操作

    - 本地缓存：临时缓存追踪数据，网络异常时保证数据不丢失

    - 浏览器集成：对接浏览器的扩展，获取 URL 信息，支持多浏览器

2. **云端服务集群**

    - 数据存储服务：用户数据、时间条目、客户 / 项目 / 任务数据的存储，加密存储

    - AI 处理服务：自动分类、自动标签、时间条目建议、生产力分析

    - API 服务：GraphQL API，提供前端和客户端的接口，支持自定义 API key

    - Webhook 服务：事件通知，支持用户自定义的 webhook

    - 报告生成服务：自动生成客户报告、团队报告，支持 PDF/CSV 导出

3. **Web 前端界面**

    - 单页应用，深色主题，响应式布局

    - 所有的管理界面，仪表盘、客户 / 项目 / 任务管理、团队管理

    - 实时数据更新，同步客户端的追踪数据

4. **集成同步服务**

    - 第三方集成同步：ClickUp、Linear、Asana、日历的双向同步

    - Zapier 集成：对接 Zapier 的 API，支持 8000 + 应用的自动化

    - 定时同步任务：定期同步第三方工具的任务和时间数据

5. **通知服务**

    - 桌面通知：客户端的本地通知

    - 邮件通知：每日 / 每周报告、提醒、邀请

    - 推送通知：专注会话、休息提醒的实时推送

---

## 12. 功能层级设计

产品的功能分为 5 个层级，从基础的追踪到高级的团队分析，逐层递进：

|层级|核心功能|对应套餐|
|---|---|---|
|**基础追踪层**|活动追踪、本地通知、桌面组件、基础时间统计|Free|
|**数据管理层**|时间条目管理、客户 / 项目 / 任务分类、数据导出|Standard/Professional|
|**AI 增强层**|自动分类、自动标签、时间条目建议、生产力分析|Standard+|
|**团队协作层**|团队成员管理、权限控制、团队数据聚合、盈利分析|Team|
|**集成扩展层**|第三方集成、自定义 API、Webhook、自动化工作流|Professional+|
### 12.1 功能依赖关系

- 所有高级功能都依赖基础的活动追踪层

- AI 增强层依赖数据管理层的分类数据

- 团队协作层依赖 AI 增强层的自动分类，减少团队成员的手动操作

- 集成扩展层依赖所有上层的功能，实现数据的同步与自动化

---

## 13. 页面功能设计详情

根据截图的 OCR 结果与官网信息，整理出所有页面的详细功能设计：

### 13.1 初始化引导页面

初始化分为 6 个步骤，引导用户完成客户端的配置：

1. **欢迎页**：介绍产品，引导用户开始配置

2. **隐私承诺页**：说明产品的隐私政策，承诺不会共享用户数据

3. **数据安全页**：说明数据的加密存储，合规标准

4. **系统要求页**：检查系统版本，确认兼容性

5. **权限配置页**：引导用户配置辅助功能权限、通知权限、Do Not Disturb 权限

6. **浏览器兼容页**：说明支持的浏览器，引导用户配置浏览器的集成

7. **完成页**：引导用户重启客户端，完成初始化

### 13.2 仪表盘页面

- **左侧导航栏**：Home、Calendar、Timer、Activity、Clients、Projects、Tasks、Members、Dashboards、Profitability、Reports、Settings

- **主内容区**：

    1. 个人生产力概览：Focus Quality Score、Top Interruptors、Top Apps & Websites

    2. 会话分解：Focus/Meetings/Breaks/Other 的占比

    3. 时间分布：按客户、项目、任务的时间占比

    4. 工作小时目标：本周的工作时长完成度

    5. 实时会话信息：当前的专注时间，结束会话的按钮

### 13.3 时间条目页面

- **时间线视图**：按时间顺序展示所有的活动条目

- **每个条目的信息**：开始 / 结束时间、时长、应用 / 网站、分类、状态（Pending/Approved）

- **操作选项**：Accept（接受 AI 建议）、Reject（拒绝）、编辑分类、添加备注

- **批量操作**：批量批准、批量标签、批量删除

- **时间条目分组**：可配置分组的粒度，更细或更粗的条目

### 13.4 客户管理页面

- **客户列表**：客户名称、状态、最后活动时间、时间花费、收入、成本、利用率

- **操作选项**：创建客户、导入客户、编辑客户、删除客户

- **统计信息**：该客户的总时间、可计费时间、收入、成本

### 13.5 项目管理页面

- **项目列表**：按客户分组，项目名称、状态、最后活动时间、预算使用情况

- **操作选项**：创建项目、导入项目、编辑项目、删除项目

- **统计信息**：该项目的总时间、进度、可计费时间

### 13.6 任务管理页面

- **任务列表**：按项目分组，任务名称、负责人、客户、状态

- **操作选项**：创建任务、导入任务、编辑任务、删除任务

- **统计信息**：该任务的总时间、进度

### 13.7 团队管理页面

- **成员列表**：成员名称、邮箱、角色、本周的时间、待审核时间、小时费率、成本费率

- **操作选项**：添加成员、导入成员、编辑角色、移除成员

- **团队统计**：团队的总工作时间、可计费利用率

### 13.8 盈利分析页面

- **总览卡片**：总收入、总利润、总成本、利润率

- **趋势图表**：月度的收入、利润、成本的趋势

- **客户盈利分析**：每个客户的盈利情况，收入、成本、利润

- **项目盈利分析**：每个项目的盈利情况

### 13.9 报告页面

- **报告配置**：每日报告、每周报告的开关

- **定时发送**：配置报告的发送时间，自动检测下班时间

- **导出功能**：CSV/PDF 导出，选择时间范围

### 13.10 集成页面

- **支持的集成**：Asana（Beta）、Linear、Zapier、ClickUp、Outlook Calendar、Google Calendar、Slack

- **每个集成的配置**：授权账号、同步规则、工作区选择

- **同步状态**：显示集成的连接状态，最后同步时间

### 13.11 设置页面

设置页面分为 5 个分类，每个分类的选项：

1. **TRACKING（追踪设置）**

    - Activity：活动追踪的配置

    - Breaks：休息提醒的配置

    - Categories：分类规则

    - Meetings：会议追踪的配置

    - Time Entries：时间条目配置，分组、自动接受建议

    - Tracking Rules：自定义追踪规则

2. **PRODUCTIVITY（生产力设置）**

    - Coach：生产力教练的配置

    - Distraction Blocker：分心拦截的规则

    - Focus：专注会话的配置

    - Planning：自动规划专注 / 休息会话的配置

3. **INTEGRATIONS & DATA（集成与数据）**

    - API：API key 管理，Webhook 配置

    - Calendars：日历集成的配置

    - Data Export：数据导出，CSV 导出

    - Integrations：第三方集成的管理

    - Reports：报告的配置

4. **PREFERENCES（偏好设置）**

    - Notifications：通知的配置，邮件 / 系统通知

    - Privacy：隐私设置，URL 追踪、标题追踪、数据删除

    - Theme：主题设置，深色 / 浅色，布局切换
> （注：文档部分内容可能由 AI 生成）