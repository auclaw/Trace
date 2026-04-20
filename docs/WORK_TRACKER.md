# Trace Work Tracker

> Last updated: 2026-04-20
> Source of truth for feature requirements: `EXECUTION_GUARDIAN_BLUEPRINT.md`
> Design system reference: `DESIGN_SYSTEM.md`

---

## Current Status: Pre-Beta Development

**Product**: Trace 时迹 — AI-native execution guardian
**Solo developer using AI coding agents (Claude Code, Codex, etc.)**
**Language**: English-first development, Chinese localization later

---

## Completed (V1.0 Infrastructure)

- [x] Activity auto-tracking (window monitoring, Tauri layer)
- [x] AI classification with approval workflow
- [x] Task management (kanban/list/calendar/timeline views, subtasks, priorities)
- [x] Focus Mode (Pomodoro timer, distraction blocking, ambient sounds, XP/coins)
- [x] Timeline visualization (chronological, color-coded, adjustable granularity)
- [x] Statistics (weekly/monthly, pie charts, heatmap, basic AI insights)
- [x] Habits system (daily check-in, streaks, categories)
- [x] Virtual Pet system (stats, feeding, shop, decorations)
- [x] Settings (theme, color themes, AI config, privacy, tracking rules, data export)
- [x] Zustand store + IPC layer + data service
- [x] Onboarding flow (basic)
- [x] Light/dark mode
- [x] Design system v3 "Macaron Editorial" (Coral Pink, Quicksand/Plus Jakarta Sans/JetBrains Mono)
- [x] Key/config security (env vars, no hardcoded secrets)
- [x] CI/CD release pipeline (updater pubkey, signing)
- [x] Payment infrastructure (Alipay, WeChat — backend)
- [x] License/activation mechanism
- [x] API/E2E test foundation (Playwright)
- [x] Product rename to Trace 时迹
- [x] Code security audit
- [x] Documentation: Blueprint v3.0, Design System v3, Architecture, API, Deployment

---

## In Progress: Execution Guardian Development

### Sprint 0: Page Reorganization (NEXT — Start Here)

- [ ] **Task 0.1**: Sidebar 8 tabs → 5 tabs (Dashboard, Timeline, Task, Analytics, Settings)
- [ ] **Task 0.1**: Focus Mode → full-screen overlay (controlled by `isFocusModeOpen` store state, not a route)
- [ ] **Task 0.2**: Rename `Planner.tsx` → `Task.tsx`, `Statistics.tsx` → `Analytics.tsx`
- [ ] **Task 0.3**: Consolidate scattered settings into Settings page

### Sprint 1: Data Layer Foundation

- [ ] **Task 1.1**: Create 5 new DB tables (context_snapshots, interruption_events, daily_reviews, guardian_settings, wandering_events)
- [ ] **Task 1.2**: Add `executionGuardian` slice to Zustand store
- [ ] **Task 1.3**: Create `guardianIpc.ts` with IPC commands for all new tables

### Sprint 2: Now Engine + Launch Boost

- [ ] **Task 2.1**: Now Engine recommendation service (`nowEngine.ts`)
- [ ] **Task 2.2**: NowEngine Dashboard component (single task display + "Start" + "Switch")
- [ ] **Task 2.3**: LaunchBoost component (first-step guidance before Focus timer starts)

### Sprint 3: Interruption Alert + Context Snapshot

- [ ] **Task 3.1**: DeviationDetector service (window switch monitoring during focus)
- [ ] **Task 3.2**: InterruptionAlert modal (3 choices: resume / glance / pause)
- [ ] **Task 3.3**: Context Snapshot creation on pause, recovery on resume

### Sprint 4: StatusBar + Wandering Detection (Can defer to post-beta)

- [ ] **Task 4.1**: StatusBar system tray widget (Tauri, current task + timer)
- [ ] **Task 4.2**: WanderingDetector service (high-frequency window switch detection)
- [ ] **Task 4.3**: Wandering intervention modal

### Sprint 5: Morning Ritual + Daily Review

- [ ] **Task 5.1**: Morning Ritual flow (daily first-open → greeting → timeblocks → confirm)
- [ ] **Task 5.2**: Daily Review flow (positive-first feedback → plan vs actual → tomorrow's top task)

### Sprint 6: Analytics + Settings + Onboarding (Can defer to post-beta)

- [ ] **Task 6.1**: Execution Guardian analytics tab (interruption trends, procrastination patterns, energy curve)
- [ ] **Task 6.2**: Guardian settings section (sensitivity, thresholds, ritual config)
- [ ] **Task 6.3**: Enhanced onboarding (Now Engine intro, Guardian concept explanation)

### Sprint 7: Testing + Polish

- [ ] E2E tests for all new guardian features
- [ ] Bug fixes and integration testing
- [ ] Performance optimization (deviation detector efficiency)

---

## Deferred to V2+

| Feature | Version | Notes |
|---------|---------|-------|
| Habits (as Dashboard widget) | V2 | Code exists, hidden from nav |
| Virtual Pet (as Dashboard widget) | V2 | Code exists, hidden from nav |
| Managed AI service (Trace AI Pro) | V2 | BYO key only in V1, hybrid model details TBD |
| Cloud sync (E2E encrypted) | V2-V3 | Local-first in V1, design for abstraction |
| Multi-device / phone companion | V2-V3 | Depends on cloud sync |
| Calendar integration (Apple/Google) | V3 | See Blueprint Section 16 |
| Email/IM integration (Slack, 飞书) | V3 | See Blueprint Section 16 |
| Project tool integration (Jira, Linear) | V3 | See Blueprint Section 16 |
| Code integration (GitHub/GitLab) | V4 | See Blueprint Section 16 |
| Health data integration | V4 | See Blueprint Section 16 |
| MCP protocol (AI agent interop) | V4 | See Blueprint Section 16 |
| Team features | V4+ | Not planned yet |
| Enterprise version | V4+ | Not planned yet |

---

## Beta Website Fixes (trace-ai-zh.lovable.app)

- [ ] Remove hardcoded "已有 1,017 人预约" or connect to real count
- [ ] Fix privacy claim wording (too absolute, contradicts cloud AI)
- [ ] Fix E2E encryption claim (should say "本地加密存储" for V1)
- [ ] Unify brand name to "时迹 Trace" (not "TraceAI")
- [ ] Remove gender selector from signup flow
- [ ] Add real Privacy Policy and Contact pages
- [ ] Hide or remove "Edit with Lovable" builder badge

---

## Key References

| Document | Purpose |
|----------|---------|
| `EXECUTION_GUARDIAN_BLUEPRINT.md` | Complete product spec — AI agents read this to understand what to build |
| `DESIGN_SYSTEM.md` | Visual design tokens, component primitives, typography, colors |
| `ARCHITECTURE.md` | System architecture (Tauri + React + Flask) |
| `API.md` | Backend REST API specification |
| `CONTRIBUTING.md` | Dev setup and code standards |
| `DEPLOYMENT.md` | Production deployment guide |
| `SECURITY_AND_RELEASE.md` | Security checklist |
