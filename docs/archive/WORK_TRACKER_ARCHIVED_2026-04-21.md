# Trace Work Tracker

> Last updated: 2026-04-20
> Single source of truth for internal-beta execution
> Product concept source: `docs/EXECUTION_GUARDIAN_BLUEPRINT.md`
> Visual/token source: `docs/DESIGN_SYSTEM.md`
> If this document conflicts with broader product ideas in the blueprint, this document wins for **beta scope and implementation order**

---

## 1. Purpose of This Document

This file is no longer just a checklist. It is the **master execution runbook** for AI coding agents.

It is written for a solo non-technical product owner using Claude Code / Codex to ship an internal beta quickly, with minimal rework.

### Document precedence

When an AI agent is implementing the product, use this priority order:

1. **`docs/WORK_TRACKER.md`** — beta scope, execution order, stop gates, run rules
2. **`docs/DESIGN_SYSTEM.md`** — visual tokens, spacing, typography, border/shadow rules
3. **`docs/EXECUTION_GUARDIAN_BLUEPRINT.md`** — product intent, rationale, full roadmap
4. **Current codebase reality** — actual routes, actual types, actual schema, actual working commands
5. **Archive docs / historical references** — inspiration only, never source of implementation truth

### Single-source rule

- Do not create a second execution plan in another markdown file.
- If product scope changes, update this file first.
- If implementation discovers a mismatch between docs and code, update this file before continuing large work.

---

## 2. Beta Goal (Locked)

### Target

Ship an internal beta **within this month**.

### Beta promise

The beta must clearly deliver this loop:

1. User opens Trace
2. Trace shows **one recommended task**
3. Trace helps the user **start**
4. Trace helps the user **bookend the day**
5. User feels: **“I am being gently guided into execution”**

### What beta must prove

- The product is not “another task list”
- The “Execution Guardian” concept is felt in real usage
- The app can guide action without requiring a chat conversation
- The app can be used daily without obvious navigation confusion or broken flows

### What beta does **not** need to prove

- Full AI intelligence
- Full automation
- Perfect analytics
- External integrations
- Team features
- Cloud sync
- System-tray sophistication

---

## 3. Locked References

### Primary references

| Reference | Location | How to use it | Status |
|---|---|---|---|
| Product blueprint | `docs/EXECUTION_GUARDIAN_BLUEPRINT.md` | Concept, positioning, page intent, full roadmap | Active |
| Design system | `docs/DESIGN_SYSTEM.md` | Tokens, typography, shadows, spacing, dark mode | Active |
| Architecture | `docs/ARCHITECTURE.md` | Understand current stack and layering | Active |
| Security/release baseline | `docs/SECURITY_AND_RELEASE.md` | Do not violate security or release assumptions | Active |

### Visual / UX references

| Reference | Link / Path | Important note |
|---|---|---|
| Figma UI/UX reference | `https://www.figma.com/design/3unJhB3SS9BrARGmyv3Qo2/Untitled?node-id=0-1&m=dev&t=FtIZOdL5MiLPz2SG-1` | **Reference only**. Not final page design. Use for tone, layout feeling, component treatment. |
| Historical HTML blueprint | `/Users/aurum/Downloads/trace-product-blueprint_d8eb7fba.html` | Reference for concept presentation and page narrative, not implementation truth. |

### Archive references (inspiration only)

| Reference | Location | Use with caution |
|---|---|---|
| Historical design notes | `docs/archive/DESIGN.md` | Old design thinking only |
| Visual research | `docs/archive/VISUAL_DESIGN_RESEARCH.md` | Mood / inspiration only |
| Product design archive | `docs/archive/PRODUCT_DESIGN.md` | Historical context only |

### Critical visual clarification

- The Figma file is **not** the final product page map.
- The Figma file is a **UI/UX style reference**.
- **Black borders are removed.**
- Use the current design-system rule: warm borders, soft strong borders, offset editorial shadows, **no harsh black outline cards**.

---

## 4. Hard Product Decisions for Beta

These decisions are locked unless explicitly changed in this file.

### Navigation

- Beta navigation is **5 tabs only**:
  - `Dashboard`
  - `Timeline`
  - `Task`
  - `Analytics`
  - `Settings`

### Focus Mode

- Focus is **not** a first-class nav tab in beta.
- Product intent is “overlay / immersive mode”.
- For compatibility, a hidden legacy route may exist temporarily if needed, but user-facing navigation must still behave like a 5-tab product.

### AI scope

- Beta “AI” is primarily **deterministic product logic**, not LLM-heavy orchestration.
- `Now Engine` must work without requiring a live LLM call.
- `Morning Ritual` and `Daily Review` must have useful non-LLM fallback behavior.

### Local-first scope

- Beta is **local-first**.
- Do not build cloud sync.
- Do not build managed AI subscription logic.
- Do not make Flask backend changes unless a beta-critical path explicitly requires it.

### Modules hidden from beta nav

- Habits
- Virtual Pet
- Team
- Any V2/V3/V4 page or module

### Beta features that are explicitly deferred unless approved later

- System tray `StatusBar`
- `WanderingDetector`
- Advanced Guardian analytics
- Knowledge cards
- Adaptive intervention frequency
- External integrations

---

## 5. Current Code Reality (Observed Before Beta Execution)

AI agents must not assume the docs match the repo. The current codebase has known drift.

### Known reality gaps

1. **Navigation mismatch**
   - `src/config/themes.ts` already defaults to 5 modules: `dashboard`, `timeline`, `task`, `analytics`, `settings`
   - But `src/components/Sidebar.tsx` still uses old keys/routes like `planner`, `focus`, `habits`, `statistics`, `pet`
   - `src/App.tsx` still routes to `/planner`, `/focus`, `/statistics`, `/habits`, `/pet`

2. **Onboarding mismatch**
   - `src/components/Onboarding.tsx` still references old module IDs like `planner`, `focus`, `statistics`, `pet`

3. **Type / schema drift**
   - `Task` and `TimeBlock` TS types do not yet include the beta guardian fields needed by the blueprint
   - Tauri SQLite schema, TypeScript types, and Flask ORM models are not fully aligned

4. **Persistence fragmentation**
   - Many settings and feature states still write directly to `localStorage`
   - This conflicts with the long-term local-first data-service abstraction

5. **Build trust not yet established**
   - Development should not proceed blindly until dependencies are installed and `npm run build` is attempted successfully

### Consequence

The first job is **not feature expansion**.
The first job is **baseline alignment**, so later work lands on stable foundations.

---

## 6. Locked Beta Scope

### Must-have for internal beta

1. Baseline alignment
   - 5-tab navigation behaves correctly
   - old URLs redirect safely
   - module IDs are consistent

2. Guardian data foundation
   - `Task.firstStep`
   - `Task.emotionalTag`
   - minimal guardian settings persistence
   - daily review storage
   - context snapshot storage if that phase is approved

3. Core execution loop
   - `Now Engine`
   - `Launch Boost`
   - `Morning Ritual` (basic)
   - `Daily Review` (basic)

### Should-have for beta if earlier phases are stable

- Manual `Context Snapshot`
- Resume unfinished work card

### Explicitly out of beta

- `StatusBar`
- `WanderingDetector`
- automatic system-level roaming interventions
- advanced guardian analytics tab
- broad settings consolidation beyond beta-critical items
- backend Flask schema expansion for new guardian entities

---

## 7. Non-Negotiable Development Rules for Claude Code

These rules exist to reduce rework and token waste.

### Scope control

- Execute **one phase at a time**
- Do **not** jump ahead to later phases
- Do **not** implement V2/V3/V4 ideas “while you are here”
- Do **not** broaden scope because “the code is nearby”

### Change size

- Keep each implementation pass small enough to review
- If a phase appears to require touching more than ~10-12 files in a meaningful way, stop and report before continuing

### Architecture discipline

- Frontend data access must go through `src/services/dataService.ts` or IPC bridges
- New Tauri calls must live in `src/services/ipc/`
- Global state stays in `src/store/useAppStore.ts`
- New beta guardian features must be behind feature flags or equivalent safe gating

### Backend discipline

- Do **not** change Flask backend just because models look inconsistent
- Beta is local-first
- Only touch Python backend if there is a confirmed beta-critical reason
- If backend drift is discovered, report it; do not automatically expand scope

### UI discipline

- Follow `docs/DESIGN_SYSTEM.md`
- Do not treat Figma as a final route / page specification
- No black borders
- No design-system reinvention during beta

### Naming discipline

- Code identifiers, file names, comments: English-first
- User-facing copy: route through existing i18n pattern when practical
- If a new string is added and there is already an i18n pattern in that surface, extend it instead of hardcoding many raw strings

### Safety discipline

- No destructive data migrations for beta
- Prefer additive schema changes
- Preserve backward compatibility routes when refactoring navigation
- Do not delete legacy files unless there is a strong reason and the replacement already works

---

## 8. Token-Efficiency Rules

Claude Code should optimize for **high signal, low context waste**.

### Read efficiently

- Prefer `rg` / targeted file reads over opening large files end-to-end
- Read only the files needed for the active phase
- Do not repeatedly re-open the same unchanged files

### Edit efficiently

- Prefer small, surgical patches
- Avoid full-file rewrites unless the file is small or structurally impossible to patch safely
- Reuse existing components before creating new abstractions

### Think efficiently

- Do not paste large doc excerpts back into chat
- Summarize logs instead of dumping full logs
- When a command fails, quote only the relevant error lines

### Build efficiently

- Do not run every possible command after every tiny edit
- Mandatory validation happens at review gates
- Use the smallest useful validation first

### Product efficiency

- Prefer deterministic rules over LLM calls for beta
- Prefer simple UI flows over over-engineered agent systems
- Prefer “works clearly” over “clever but fragile”

---

## 9. Recommended Claude Code Skills / Capabilities

If the Claude Code environment supports skills, modes, subagents, or reusable workflows, only use equivalents of the following.

| Skill / Capability | Use it for | Do not use it for |
|---|---|---|
| Codebase search / repo explorer | locating routes, stores, IPC calls, schema definitions | making architecture decisions by itself |
| React + TypeScript refactor | page aliases, route updates, overlay integration, state wiring | broad visual redesign |
| Tauri IPC + SQLite migration | new local tables, new commands, schema-safe additions | speculative cloud sync work |
| UI integration / modal flow | `Now Engine`, `LaunchBoost`, `Morning Ritual`, `Daily Review` | inventing new product pages |
| Diff reviewer / self-audit | checking scope stayed within phase | replacing manual review gates |
| Build / smoke-test runner | validating the current phase | driving product direction |
| Token-budget discipline | keeping prompts and outputs compact | skipping necessary validation |

### Skills to avoid during beta

- “Big redesign” skills
- “Growth / launch / SEO” skills
- “Backend platform expansion” skills
- Any workflow that encourages broad parallel edits across overlapping files

---

## 10. Mandatory Review Gates

Claude Code must stop at these checkpoints and wait for human review.

### Review package format

At each gate, Claude Code must report:

1. Phase completed
2. Files changed
3. Commands run
4. Build result
5. Key behavior now working
6. Remaining risks
7. Recommended next phase

### Gate list

| Gate | When to stop | Human review required? |
|---|---|---|
| Gate 0 | After environment setup + baseline audit | Yes |
| Gate 1 | After navigation / route / module alignment | Yes |
| Gate 2 | After schema + TS type + store foundation | Yes |
| Gate 3 | After `Now Engine` + `LaunchBoost` | Yes |
| Gate 4 | After `Morning Ritual` + `Daily Review` basic flow | Yes |
| Gate 5 | Before any automatic interruption detection | Yes |

### Hard stop conditions

Claude Code must stop immediately if:

- `npm run build` fails for a reason it cannot confidently fix within the current phase
- a change would require destructive migration
- a phase starts dragging in Flask backend work unexpectedly
- system-tray / OS permission work appears necessary before beta core loop is proven
- the requested change starts spilling into V2/V3/V4 scope

---

## 11. Validation Commands

### Environment setup (run once)

```bash
npm install
```

If backend work is explicitly required later:

```bash
cd backend && pip install -r requirements.txt
cd ../src-tauri && cargo build
```

### Mandatory per review gate

```bash
npm run build
```

### Preferred when useful and affordable

```bash
npm run lint
```

### Optional smoke after core-loop phases

```bash
npm run test:e2e
```

### Validation rule

- `npm run build` is the minimum bar before declaring a phase complete
- If lint or e2e fail because of clearly pre-existing unrelated problems, do not branch into unrelated cleanup; report the issue

---

## 12. Phase Plan (Beta-Critical)

This is the exact order of execution.

---

### Phase 0 — Environment Setup and Baseline Audit

**Goal**: establish whether the repo can be built and confirm current code reality before feature work.

#### In scope

- install JS dependencies
- run `npm run build`
- inspect current route/module mismatch
- inspect current store/type/schema locations
- produce a short baseline report

#### Out of scope

- feature work
- design changes
- backend expansion

#### Deliverables

- dependency install completed
- first build attempt completed
- short baseline mismatch summary

#### Stop at Gate 0

Do not start implementation until Gate 0 is reviewed.

---

### Phase 1 — Navigation, Route, and Module Alignment

**Goal**: make the app behave like a 5-tab beta without breaking old entry points.

#### Required outcome

- visible user navigation = 5 tabs only
- `Task` and `Analytics` are the public route names
- old routes still redirect safely
- Focus is no longer a nav module

#### Implementation rules

1. Keep legacy files if that reduces risk
2. Prefer thin wrappers / aliases over copying full page logic
3. Preserve compatibility URLs

#### Recommended implementation shape

- Create `src/pages/Task.tsx` as a thin wrapper or re-export of `Planner`
- Create `src/pages/Analytics.tsx` as a thin wrapper or re-export of `Statistics`
- Update `src/App.tsx` to expose:
  - `/`
  - `/timeline`
  - `/task`
  - `/analytics`
  - `/settings`
- Add compatibility redirects:
  - `/planner` -> `/task`
  - `/statistics` -> `/analytics`
- Remove Focus / Habits / Pet / Statistics from visible nav behavior
- Update `src/components/Sidebar.tsx`
- Update `src/components/Onboarding.tsx` module IDs

#### Focus rule for beta

Implement the beta-compatible surface like this:

- user does **not** see Focus as a nav item
- `isFocusModeOpen` store state can be introduced now
- a hidden compatibility route may still exist if needed to keep old buttons working
- if using a compatibility `/focus` route, it should support migration toward overlay behavior, not preserve Focus as a first-class page in the UX

#### Acceptance checklist

- [ ] only 5 user-facing nav items remain
- [ ] `/task` works
- [ ] `/analytics` works
- [ ] `/planner` safely redirects
- [ ] `/statistics` safely redirects
- [ ] onboarding no longer uses obsolete module IDs
- [ ] build passes

#### Stop at Gate 1

---

### Phase 2 — Guardian Data Contract and Local Persistence Foundation

**Goal**: create the minimum stable data foundation for beta guardian features.

#### Beta data contract (source of truth)

```ts
interface Task {
  id: string
  title: string
  priority: 1 | 2 | 3 | 4 | 5
  status: 'pending' | 'in_progress' | 'completed'
  estimatedMinutes: number
  actualMinutes: number
  project: string
  subtasks: Subtask[]
  dueDate: string
  repeatType: RepeatType
  createdAt: string
  firstStep: string
  emotionalTag: 'easy' | 'neutral' | 'resist'
}

interface TimeBlock {
  id: string
  taskId?: string | null
  title: string
  startTime: string
  endTime: string
  durationMinutes: number
  category: ActivityCategory
  date: string
  completed: boolean
  notes?: string
}
```

#### Guardian state required for beta

Only add what beta actually needs:

- `isFocusModeOpen`
- `currentFocusTaskId`
- `currentRecommendedTaskId`
- `lastMorningRitualDate`
- `lastDailyReviewDate`
- `tomorrowTopTask`
- `guardianSettings`
- `activeSnapshotId` or equivalent minimal snapshot reference

Do **not** add a huge V2/V3 state machine now.

#### Persistence required for beta

**Required now**

- `tasks.first_step`
- `tasks.emotional_tag`
- `daily_reviews`
- `guardian_settings`

**Optional now, required only if Phase 5 is approved**

- `context_snapshots`

**Blocked until later**

- `wandering_events`
- advanced `interruption_events`

#### Backend rule

- Tauri SQLite is the beta source of truth
- Do not expand Flask ORM just because it exists
- Only note backend drift in the review report

#### Acceptance checklist

- [ ] TS types updated
- [ ] Tauri schema migrations added safely
- [ ] new IPC bridge added for guardian data
- [ ] store foundation added without breaking existing features
- [ ] build passes

#### Stop at Gate 2

---

### Phase 3 — `Now Engine` and `Launch Boost`

**Goal**: make the user feel the core product difference immediately.

#### `Now Engine` beta logic

Use deterministic ordering only:

1. current time block task
2. yesterday’s `tomorrowTopTask`
3. highest-priority incomplete task
4. oldest overdue / most delayed task

No LLM dependency is required.

#### `Launch Boost` beta behavior

After clicking Start:

1. show task title
2. show `firstStep`
3. allow a small editable first action if practical
4. offer quick start durations
5. continue into Focus

#### Required UX result

- Dashboard emphasizes **one recommended task**
- user can start with low friction
- the product feels opinionated but gentle

#### Out of scope

- “switch reason” analytics
- AI-generated first-step suggestions
- adaptive recommendation based on long-term profile

#### Acceptance checklist

- [ ] Dashboard shows one recommendation
- [ ] Start enters focus flow
- [ ] Launch boost appears before timer begins
- [ ] no LLM dependency required for recommendation logic
- [ ] build passes

#### Stop at Gate 3

---

### Phase 4 — `Morning Ritual` and `Daily Review` (Basic)

**Goal**: complete the daily loop without overbuilding.

#### `Morning Ritual` beta version

Keep it simple:

1. greeting
2. show today’s time blocks
3. show unfinished work / top task if available
4. confirm today’s first action

#### `Daily Review` beta version

Keep it simple:

1. show wins first
2. show plan vs actual summary
3. ask for tomorrow’s top task
4. save result locally

#### Important rule

- Do not depend on an LLM to render these flows
- A good structured template is enough for beta

#### Out of scope

- multi-day coaching
- AI explanations
- advanced behavior insights

#### Acceptance checklist

- [ ] morning ritual can appear once per day
- [ ] daily review can be completed and saved
- [ ] tomorrow top task is reused next day
- [ ] build passes

#### Stop at Gate 4

---

### Phase 5 — Manual Context Snapshot (Optional Beta Upgrade)

**Goal**: add recovery support without yet attempting fragile automatic detection.

#### Only do this phase if Gates 0-4 are stable

#### Beta-safe implementation

- user pauses focus
- app offers one-line “where did you stop?” snapshot
- snapshot can be resumed later from Dashboard

#### Do not do yet

- automatic deviation detection
- OS-level interruption inference
- wandering detection

#### Acceptance checklist

- [ ] pause can save a snapshot
- [ ] Dashboard can show an unfinished snapshot card
- [ ] user can resume with context
- [ ] build passes

#### Stop for review before any automatic detection work

This is still part of Gate 5 discipline.

---

### Phase 6 — Automatic Interruption Detection (Blocked Until Explicit Approval)

**Status**: blocked for now

Automatic interruption detection is high-risk because it touches:

- system activity signals
- focus timing logic
- false-positive UX
- persistence
- OS-specific behavior

This phase must not start until human review explicitly approves it after earlier gates are stable.

---

## 13. Post-Beta Deferred Work

These items stay deferred unless this file is updated.

- `StatusBar`
- `WanderingDetector`
- guardian analytics tab
- guardian settings expansion beyond beta-critical fields
- knowledge cards
- habits dashboard widget
- virtual pet dashboard widget
- managed AI service
- cloud sync
- integrations

---

## 14. Claude Code Prompt Templates

These are recommended prompt shapes for the product owner to paste into Claude Code.

### Template A — Start a phase

```text
Read docs/WORK_TRACKER.md and execute exactly Phase X only.

Rules:
- Follow WORK_TRACKER.md over broader product ideas if scope conflicts.
- Do not work on later phases.
- Keep the diff as small as possible.
- Use current code reality, not assumptions.
- Run npm run build before finishing.
- Stop at the phase review gate and report:
  1) files changed
  2) commands run
  3) build result
  4) what now works
  5) remaining risks
```

### Template B — Continue after review

```text
Continue with Phase X from docs/WORK_TRACKER.md.
Do not revisit already approved phases except for directly required integration changes.
Keep scope limited to the approved phase.
Run npm run build before stopping.
```

### Template C — Blocked / uncertainty handling

```text
If this phase requires destructive migration, large backend work, or work outside the locked beta scope in docs/WORK_TRACKER.md, stop and report the blocker instead of guessing.
```

---

## 15. Final Rule for All AI Coding Agents

The goal is **not** to implement the entire blueprint quickly.

The goal is to implement the **minimum correct beta path** with:

- clear scope
- stable checkpoints
- low token waste
- low architectural drift
- minimal rework

If an AI agent is ever unsure whether to “add more”, the default answer is:

**Do less. Finish the current phase. Pass the gate. Wait for review.**
