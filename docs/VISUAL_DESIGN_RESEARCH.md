# Visual Design Research: Premium Productivity Apps
## Deep Analysis for Merize Design System Evolution

---

## Table of Contents
1. [Rize.io](#1-rizeio)
2. [TickTick / 滴答清单](#2-ticktick)
3. [TimeBlocks / 时间块](#3-timeblocks)
4. [小日常 / DailyRoutine](#4-dailyroutine)
5. [Forest](#5-forest)
6. [Monday.com](#6-mondaycom)
7. [Industry Trends 2024-2025](#7-trends)
8. [Synthesized Design Recommendations with CSS](#8-recommendations)

---

## 1. Rize.io — Premium Time Tracking Dashboard {#1-rizeio}

### Visual Identity
Rize uses a **deep indigo-to-purple gradient** hero background with a wave pattern overlay (WaveBackground-embedded.webp). The overall feel is premium, calm, and data-centric -- like a Bloomberg terminal designed by a meditation app.

### Color Palette (extracted from site + screenshots)
| Role | Value | Notes |
|------|-------|-------|
| Hero gradient start | `#1a0a3e` | Deep indigo-violet |
| Hero gradient end | `#3b1d8e` | Rich purple |
| Wave overlay | `#2d1578` | Semi-transparent purple wave texture |
| Primary accent | `#6c5ce7` | Bright lavender-purple for CTAs |
| Secondary accent | `#00cec9` | Teal/cyan for data highlights |
| Dashboard bg | `#f8f9fc` | Very pale blue-gray (light mode) |
| Card surface | `#ffffff` | Pure white cards on tinted bg |
| Text primary | `#1a1a2e` | Near-black with blue undertone |
| Text secondary | `#6b7280` | Cool gray |
| Success/positive | `#10b981` | Emerald green for productivity scores |
| Warning | `#f59e0b` | Amber |
| Stat highlight | `#8b5cf6` | Violet for numerical emphasis |

### Card Styling
- Border radius: `16px` on dashboard cards
- Shadow: `0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)`
- No visible border in light mode; uses shadow-only elevation
- Inner padding: `24px`
- Cards use white background on a `#f8f9fc` page surface (subtle lift)

### Typography
- Headings: **Inter** or system sans-serif, 700 weight
- H1 hero: ~48-56px, white on gradient, letter-spacing: -0.02em
- Dashboard metric numbers: 32-40px, 700 weight, purple/teal accent color
- Body: 14-16px, 400 weight, `#6b7280`
- Labels: 12px, 500 weight, uppercase tracking `0.05em`

### Sidebar Navigation
- Dark sidebar (`#1a1a2e` to `#0f0f1e` gradient)
- Active item: subtle left border accent in purple + tinted background `rgba(108,92,231,0.12)`
- Icons: 20px line-style, 1.5px stroke, purple when active
- Spacing: 8px between items, 12px padding inline

### What Makes It Premium
- The deep purple gradient hero creates immediate luxury feel
- Dashboard uses a tinted background (`#f8f9fc`) not pure white -- adds depth
- Metric cards have large numbers in accent colors (purple, teal, green) creating visual hierarchy through color, not just size
- SVG illustrations in product shots use consistent indigo/purple palette
- Wave background pattern adds organic texture to what could be a flat gradient

---

## 2. TickTick / 滴答清单 — Clean, Colorful Productivity {#2-ticktick}

### Visual Identity
TickTick balances **clean minimalism with strategic color**. The brand blue (`#4772fa`) is the anchor, but the real design strength is how they use color-coding across the UI -- each feature area gets its own hue while maintaining cohesion. The site metadata confirms their TileColor as `#4772fa`.

### Color Palette
| Role | Value | Notes |
|------|-------|-------|
| Brand primary | `#4772fa` | Vivid blue, slightly warm |
| Brand secondary | `#ff6b6b` | Coral red for priorities/overdue |
| Habit green | `#34c759` | iOS-style green for completed habits |
| Pomodoro red | `#ff3b30` | Timer/focus red |
| Calendar purple | `#af52de` | Event/schedule purple |
| Tag yellow | `#ffcc00` | Label/tag highlight |
| Background | `#ffffff` | Clean white (light mode) |
| Surface gray | `#f5f5f7` | Apple-style light gray surface |
| Dark mode bg | `#1c1c1e` | iOS-style true dark |
| Dark mode surface | `#2c2c2e` | Elevated dark surface |
| Text primary | `#1c1c1e` | Near-black |
| Text secondary | `#8e8e93` | iOS-style secondary gray |
| Border | `#e5e5ea` | Light gray divider |

### Card Styling
- Border radius: `12px` for cards, `8px` for task items
- Shadow: `0 2px 8px rgba(0,0,0,0.06)` (very subtle)
- Task items: no shadow, border-bottom `1px solid #e5e5ea`
- Checkbox: 20px circle, 2px border, fills with list color on check
- Inner padding: `16px` cards, `12px 16px` task rows

### Typography
- Font: System font stack (SF Pro on Apple, Roboto on Android, Segoe UI on Windows)
- Web: likely Inter/Roboto
- H1: 28px, 700 weight
- Section headers: 17px, 600 weight
- Task text: 15-16px, 400 weight
- Subtask/meta: 13px, 400 weight, `#8e8e93`
- Chinese text: Uses system CJK fonts, same sizing

### Sidebar Navigation
- Left sidebar: white background with hover states
- Active list: filled background `rgba(71,114,250,0.08)` with blue text
- List items have colored circle indicators (user-customizable colors)
- Smart lists (Today, Next 7 Days, etc.) use SF Symbol-style icons
- Collapsible groups with 4px left indent

### Theme System
- 40+ built-in themes (confirmed from help docs)
- Custom themes supported: user picks any image as background
- Auto dark/light based on system preference
- Themes apply a tint to the sidebar and header while keeping content area white

### What Makes It Premium
- The **multi-color system** -- each list/project gets a distinct color, creating a rainbow effect that feels personalized
- iOS-native design language: SF-style icons, system fonts, blur effects on iOS
- Eisenhower Matrix view uses 4 colored quadrants (red, orange, blue, green)
- Kanban view uses color-coded columns
- The simplicity is the luxury -- nothing fights for attention

---

## 3. TimeBlocks / 时间块 — Visual Time Planning {#3-timeblocks}

### Visual Identity
TimeBlocks (DayBlock on Google Play) uses **color-coded time blocks** as its core visual metaphor. The UI is built around a vertical timeline where blocks of color represent scheduled activities. Design language is modern, flat, with bold color blocks.

### Color Palette (from app screenshots)
| Role | Value | Notes |
|------|-------|-------|
| Block color 1 | `#4a90d9` | Blue - work/study |
| Block color 2 | `#f5a623` | Orange - exercise/activity |
| Block color 3 | `#7ed321` | Green - rest/nature |
| Block color 4 | `#d0021b` | Red - urgent |
| Block color 5 | `#9b59b6` | Purple - creative |
| Block color 6 | `#50e3c2` | Teal - social |
| Background | `#ffffff` | Clean white |
| Timeline axis | `#e0e0e0` | Light gray |
| Text primary | `#333333` | Standard dark |
| Text secondary | `#999999` | Mid gray |

### Card Styling
- Time blocks: `border-radius: 8px`, solid fill color with white text
- Block height proportional to duration (visual time = real time)
- Blocks have `4px` left colored border when in list view
- Padding: `12px 16px` inside blocks
- Shadow: minimal, `0 1px 4px rgba(0,0,0,0.08)`

### Key Design Pattern: Drag-and-Resize Blocks
- Blocks can be dragged and resized on a vertical timeline
- Color saturation at 60-70% (not fully saturated -- easier on eyes)
- Active/selected block gets subtle elevation shadow + scale(1.02)
- Ghost block appears at drop target with 30% opacity

### What Makes It Premium
- The **visual density** -- seeing your entire day as colored blocks creates instant comprehension
- Color blocks use consistent saturation level creating harmony
- The proportional time visualization is unique and intuitive
- Clean whitespace around blocks prevents visual overload

---

## 4. 小日常 / DailyRoutine / TinyDaily — Warm Organic Habits {#4-dailyroutine}

### Visual Identity
小日常 (My Goals / TinyDaily) is known for its **warm, playful, illustration-driven design**. It uses a gamification approach where completing habits earns coins for self-rewards. The design language is distinctly Chinese indie app aesthetic -- soft, rounded, warm, with hand-drawn illustration elements.

### Color Palette
| Role | Value | Notes |
|------|-------|-------|
| Primary warm | `#ff8a65` | Soft coral/salmon -- the signature warmth |
| Secondary warm | `#ffb74d` | Warm amber/golden |
| Background | `#fef9f4` | Warm cream/parchment (not white) |
| Surface | `#fff5eb` | Peach-tinted white |
| Card bg | `#ffffff` | White cards on warm bg |
| Accent green | `#66bb6a` | Soft sage green for completed items |
| Accent blue | `#64b5f6` | Powder blue for info |
| Accent purple | `#ba68c8` | Soft lavender for categories |
| Text primary | `#5d4037` | Warm dark brown (NOT black) |
| Text secondary | `#8d6e63` | Medium brown |
| Text muted | `#bcaaa4` | Light brown/tan |
| Coin/reward gold | `#ffd54f` | Bright gold for gamification |
| Border | `#efe0d5` | Warm tan border |
| Success check | `#81c784` | Soft green check |

### Card Styling
- Border radius: `16-20px` (very rounded, friendly)
- Shadow: `0 2px 12px rgba(93, 64, 55, 0.08)` (warm-tinted shadow, NOT gray)
- Borders: `1px solid #efe0d5` (warm tan, not gray)
- Inner padding: `16-20px`
- Habit cards have illustration/icon on left, progress on right
- Cards feel like physical sticky notes or paper cards

### Typography
- Chinese: PingFang SC / Noto Sans SC, rounded terminals preferred
- English: Rounded sans-serif (similar to Nunito or Varela Round)
- Body: 15-16px, 400 weight, warm brown `#5d4037`
- Headers: 20-24px, 600-700 weight, slightly darker brown
- Numbers/stats: 28-36px, 700 weight, accent color (coral or gold)
- Line-height: generous 1.6-1.8 for readability

### Icon Style
- **Filled with soft gradients** or flat with rounded corners
- Hand-drawn/sketch-style optional icons
- Warm color palette matching the UI (no cold blues or grays)
- Icon size: 24-32px for navigation, 40-48px for feature icons
- Small illustrations accompany empty states

### Gamification Elements
- Coin counter with golden glow/shimmer
- Progress rings with gradient fills (coral to amber)
- Streak counters with warm flame-like colors
- Reward popups with confetti-style celebratory animation
- Achievement badges with metallic gold/bronze styling

### What Makes It Premium (Warm & Organic)
- **Brown text instead of black** -- this single choice makes everything feel warmer
- **Warm cream background** (`#fef9f4`) not white -- creates paper/notebook feel
- **Warm-tinted shadows** using brown alpha, not gray/black alpha
- Rounded corners everywhere (16-20px) -- nothing feels sharp
- Illustrations with watercolor/hand-drawn quality
- Gold coin gamification adds delight without being childish
- The overall palette avoids pure black, pure white, and cold grays entirely

---

## 5. Forest — Nature-Inspired Focus {#5-forest}

### Visual Identity
Forest's design is entirely driven by its **nature metaphor** -- growing trees represents focus time. The color palette is earthy greens, warm browns, and sunset oranges. The website uses a dark green (#2e7d32 range) as primary with warm accent yellows. The app itself features lush illustrated forests.

### Color Palette
| Role | Value | Notes |
|------|-------|-------|
| Primary green | `#4caf50` | Healthy leaf green |
| Deep green | `#2e7d32` | Forest/header green |
| Light green | `#81c784` | Young leaf / success |
| Pale green bg | `#e8f5e9` | Very light green surface |
| Bark brown | `#5d4037` | Tree trunk brown |
| Warm brown | `#795548` | Soil/earth brown |
| Light brown | `#bcaaa4` | Sandy earth |
| Sunset orange | `#ff9800` | Reward/coin color |
| Golden yellow | `#ffc107` | Stars/achievements |
| Sky blue | `#87ceeb` | Background sky in illustrations |
| Background | `#fafaf5` | Warm off-white with green tint |
| Card surface | `#ffffff` | Clean white |
| Text primary | `#33691e` | Dark green-brown |
| Text secondary | `#689f38` | Medium green |
| Dead tree red | `#c62828` | Failed focus session |

### Tree Illustration Style
- Flat vector illustrations with subtle gradients
- Trees evolve from seed to sprout to bush to full tree (5+ stages)
- Each tree species has a unique silhouette and color variant
- Crown colors range: spring green, emerald, olive, autumn orange/red
- Background shows sky gradient from `#87ceeb` to `#b2dfdb`

### Card Styling
- Border radius: `12-16px`
- Shadow: `0 2px 8px rgba(46, 125, 50, 0.10)` (green-tinted shadow)
- Stat cards use green gradient headers fading to white body
- Inner padding: `16px`

### Typography
- Clean sans-serif (system fonts)
- Headers: 24-28px, 700, dark green
- Body: 14-16px, 400, warm gray-brown
- Timer numbers: 48-64px, 300 weight (thin, elegant), dark green
- Stats: 24-32px, 700, with color accent

### What Makes It Premium (Nature-Organic)
- **Green-tinted shadows** instead of gray -- every shadow feels like it's under a canopy
- Illustrated trees as progress indicators -- visual delight over bar charts
- Warm off-white background with subtle green tint
- Timer is large and minimal (thin font weight) -- feels meditative
- Earning coins to plant real trees adds emotional depth to the UI
- Sound design complements visual: forest ambience, bird sounds
- Seasonal themes change the entire forest aesthetic

---

## 6. Monday.com — Enterprise Work OS {#6-mondaycom}

### Visual Identity
Monday.com is bold, saturated, and unapologetically colorful. Their "Vibe" design system (confirmed from developer docs) uses **Poppins** for headings and **Figtree** for body text. The color system is purpose-named (not color-named) using CSS variables.

### Color System (from Vibe Design System + Engineering Blog)
| Role | CSS Variable | Value | Notes |
|------|-------------|-------|-------|
| Primary (brand) | `--primary-color` | `#0085ff` | Bright blue |
| Primary hover | `--primary-hover-color` | `#0073e6` | Darker blue |
| Text primary | `--primary-text-color` | `#323338` ("Mud Black") | Warm dark gray |
| Text secondary | `--secondary-text-color` | `#676879` | Medium gray |
| Text on primary | `--text-color-on-primary` | `#ffffff` | White on blue |
| Disabled text | `--disabled-text-color` | `#c5c7d0` | Light gray |
| Placeholder | `--placeholder-color` | `#c5c7d0` | Input placeholder |
| Link color | `--link-color` | `#1f76c2` | Link blue |
| Surface primary | `--primary-background-color` | `#ffffff` | White surface |
| Surface secondary | `--secondary-background-color` | `#f5f6f8` | Light gray bg |
| Border | `--ui-border-color` | `#d0d4e4` | Divider lines |

### Status Colors (Monday.com Signature Feature)
| Status | Color | Hex |
|--------|-------|-----|
| Done | Green | `#00c875` |
| Working on it | Orange | `#fdab3d` |
| Stuck | Red | `#e2445c` |
| Not started | Gray | `#c4c4c4` |
| Custom 1 | Purple | `#a25ddc` |
| Custom 2 | Blue | `#0086c0` |
| Custom 3 | Gold | `#ffcb00` ("Egg Yolk") |
| Custom 4 | Pink | `#ff007f` |
| Custom 5 | Lipstick | `#f279f2` |

### Typography (from Vibe Design System docs)
```css
--font-family: Figtree, Roboto, Noto Sans Hebrew, Noto Kufi Arabic, Noto Sans JP, sans-serif;
--title-font-family: Poppins, Roboto, Noto Sans Hebrew, Noto Kufi Arabic, Noto Sans JP, sans-serif;
```

| Level | Size | Weight | Font |
|-------|------|--------|------|
| H1 | 32px | bold/medium/normal/light | Poppins |
| H2 | 24px | bold/medium/normal/light | Poppins |
| H3 | 18px | bold/medium/normal/light | Poppins |
| Text1 | 16px | bold/medium/normal | Figtree |
| Text2 | 14px | bold/medium/normal | Figtree |
| Text3 | 12px | medium/normal | Figtree |

Rule: Never use text smaller than 14px. Never underline for emphasis (use bold). Never mix two text sizes on same line.

### Shadow System (from Vibe docs)
```css
--box-shadow-xs: 0 4px 6px -4px rgba(0, 0, 0, 0.1);
--box-shadow-small: 0 4px 8px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
--box-shadow-medium: 0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06);
--box-shadow-large: 0 16px 48px rgba(0, 0, 0, 0.16), 0 8px 16px rgba(0, 0, 0, 0.08);
```

Principle: "Virtual light comes from the top" -- shadows always go down. Shadow levels express hierarchy. Same shadow level = same elevation = cannot overlap.

### What Makes It Premium
- **Bold saturated status colors** on white -- the color IS the information
- Purpose-named CSS variables (`--primary-color` not `--blue-500`)
- Dual-font strategy: Poppins for personality (headings), Figtree for readability (body)
- The board/table view uses color-coded status columns that create a vibrant data visualization
- Generous whitespace between rows (40px row height)
- Drag interactions show elevation (shadow increases during drag)
- Card hover adds `--box-shadow-small` with subtle scale

---

## 7. Industry Design Trends 2024-2025 {#7-trends}

### Glassmorphism (Evolved)
From research across multiple sources including Medium articles and Reddit r/FigmaDesign:
- Frosted glass cards: `backdrop-filter: blur(16px); background: rgba(255,255,255,0.72)`
- Subtle 1px border: `border: 1px solid rgba(255,255,255,0.18)`
- Used for overlays, floating panels, NOT for all cards
- Works best on gradient or image backgrounds
- Dark mode variant: `background: rgba(30,30,30,0.65); backdrop-filter: blur(20px)`

### Warm Minimalism
The dominant trend across Chinese productivity apps (小日常, Forest):
- Cream/parchment backgrounds instead of pure white
- Brown text instead of black
- Warm-tinted shadows (brown alpha, not black alpha)
- Rounded everything (16-24px border-radius)
- Nature-inspired color palettes (greens, warm browns, sunset tones)

### Data Density with Elegance
From Monday.com and Rize:
- Color-coded data points (status pills, category badges)
- Large metric numbers as visual anchors
- Cards as data containers with clear hierarchy
- White cards on tinted backgrounds (not white-on-white)

### Micro-interactions
Common patterns across all researched apps:
- Checkbox: circle bounces/scales on completion + color fill animation
- Cards: `transform: translateY(-2px)` + shadow increase on hover
- Sidebar items: background fade-in (150ms ease) on hover
- Progress rings: animated stroke-dashoffset on load
- Numbers: count-up animation when entering viewport
- Page transitions: subtle fade (200ms) between views

---

## 8. Synthesized Design Recommendations for Merize {#8-recommendations}

Based on the research, here are concrete CSS recommendations blending the best patterns, with special emphasis on the warm/organic qualities of 小日常, Forest, and TickTick, combined with the data sophistication of Rize and Monday.

### 8.1 Recommended Color System

```css
:root {
  /* === BACKGROUNDS === */
  /* Warm cream base inspired by 小日常 + existing Merize warm approach */
  --bg-base: #fefbf6;            /* Warm parchment (between 小日常's #fef9f4 and current #fffefb) */
  --bg-surface: #ffffff;          /* Card surfaces */
  --bg-surface-elevated: #fff8f0; /* Subtle warm elevation */
  --bg-surface-muted: #f5f0ea;   /* Grouped/secondary areas */
  --bg-sidebar: #faf6f1;         /* Sidebar with warm tint */

  /* === TEXT (warm brown hierarchy like 小日常) === */
  --text-primary: #2c1810;       /* Warm dark brown-black (warmer than current #201515) */
  --text-secondary: #6b5244;     /* Medium warm brown */
  --text-muted: #a08979;         /* Light brown for metadata */
  --text-on-accent: #ffffff;     /* White on accent buttons */

  /* === ACCENT (keep Merize orange identity, soften slightly) === */
  --accent-primary: #f26b3a;     /* Warm coral-orange (softer than #ff4f00, more like Forest sunset) */
  --accent-primary-hover: #e85d2c;
  --accent-soft: rgba(242, 107, 58, 0.10);
  --accent-soft-hover: rgba(242, 107, 58, 0.18);

  /* === SEMANTIC / CATEGORY COLORS (inspired by TickTick + Monday) === */
  --color-focus: #4caf50;        /* Forest green for deep work/focus */
  --color-focus-soft: rgba(76, 175, 80, 0.10);
  --color-meeting: #5c8ec6;      /* Muted blue for meetings */
  --color-meeting-soft: rgba(92, 142, 198, 0.10);
  --color-break: #f5a623;        /* Warm amber for breaks (TimeBlocks-inspired) */
  --color-break-soft: rgba(245, 166, 35, 0.10);
  --color-habit: #ba68c8;        /* Soft purple for habits (小日常-inspired) */
  --color-habit-soft: rgba(186, 104, 200, 0.10);
  --color-overdue: #e25555;      /* Soft red for overdue */
  --color-success: #66bb6a;      /* Soft green for completion (小日常 style) */
  --color-gold: #ffd54f;         /* Gamification gold (小日常 coin color) */

  /* === BORDERS (warm-tinted like 小日常) === */
  --border-default: #ece0d4;     /* Warm tan border */
  --border-subtle: #f2e8de;      /* Very subtle warm border */
  --border-strong: #d4c4b4;      /* Stronger warm border */

  /* === SHADOWS (warm-tinted, critical premium detail) === */
  --shadow-xs: 0 1px 2px rgba(44, 24, 16, 0.04);
  --shadow-sm: 0 2px 8px rgba(44, 24, 16, 0.06);
  --shadow-md: 0 4px 16px rgba(44, 24, 16, 0.08);
  --shadow-lg: 0 8px 32px rgba(44, 24, 16, 0.10);
  --shadow-xl: 0 16px 48px rgba(44, 24, 16, 0.12);

  /* Hover shadow for cards (Rize + Monday pattern) */
  --shadow-card-hover: 0 8px 24px rgba(44, 24, 16, 0.10), 0 2px 8px rgba(44, 24, 16, 0.04);
}

/* === DARK MODE === */
:root[data-theme="dark"] {
  --bg-base: #1a1410;            /* Warm dark (not blue-dark) */
  --bg-surface: #251e18;         /* Warm dark surface */
  --bg-surface-elevated: #302720;
  --bg-surface-muted: #1f1914;
  --bg-sidebar: #1e1812;

  --text-primary: #f5ece4;       /* Warm off-white */
  --text-secondary: #c4b5a5;     /* Warm light brown */
  --text-muted: #8a7b6c;         /* Muted warm */

  --accent-primary: #f58b5e;     /* Lighter coral for dark mode */
  --accent-soft: rgba(245, 139, 94, 0.12);

  --border-default: #3a3028;
  --border-subtle: #2e2620;
  --border-strong: #4a3e34;

  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.20);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.30);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.35);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.40);
}
```

### 8.2 Typography System

```css
:root {
  /* Font families - Inter for everything, consistent with current Merize */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-serif: 'Source Serif 4', 'Source Han Serif SC', Georgia, serif;

  /* Type scale (Monday-inspired size ladder) */
  --text-xs: 12px;      /* Badges, timestamps, captions */
  --text-sm: 13px;      /* Secondary labels, metadata */
  --text-base: 14px;    /* Body text, task items (Monday rule: never smaller) */
  --text-md: 16px;      /* Prominent body, section labels */
  --text-lg: 18px;      /* H3 equivalent, card titles */
  --text-xl: 24px;      /* H2 equivalent, page section headers */
  --text-2xl: 32px;     /* H1 equivalent, page titles */
  --text-3xl: 40px;     /* Hero metrics, large stat numbers */
  --text-4xl: 48px;     /* Timer display (Forest-inspired thin weight) */

  /* Weight scale */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line heights */
  --leading-tight: 1.2;   /* Headings */
  --leading-normal: 1.5;  /* Body */
  --leading-relaxed: 1.7; /* Chinese text, descriptions */

  /* Letter spacing */
  --tracking-tight: -0.02em;  /* Large headings */
  --tracking-normal: 0;       /* Body */
  --tracking-wide: 0.04em;    /* Labels, badges */
}

/* Typography utility classes */
.text-heading-1 {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}

.text-heading-2 {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  color: var(--text-primary);
}

.text-heading-3 {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  color: var(--text-primary);
}

.text-body {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--text-secondary);
}

.text-caption {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  color: var(--text-muted);
}

.text-metric {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: 1;
  letter-spacing: var(--tracking-tight);
  color: var(--accent-primary);
}

.text-timer {
  font-size: var(--text-4xl);
  font-weight: 300; /* Thin weight like Forest timer */
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
```

### 8.3 Card & Container System

```css
/* === CARD STYLES === */
.card {
  background: var(--bg-surface);
  border-radius: 16px;           /* Rounded like 小日常 (16-20px) */
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
  padding: 20px;
  transition: box-shadow 200ms ease, transform 200ms ease;
}

.card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-1px);   /* Subtle lift like Monday.com drag pattern */
}

/* Stat/Metric card (Rize-inspired) */
.card-metric {
  background: var(--bg-surface);
  border-radius: 16px;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
  padding: 24px;
}

.card-metric .metric-value {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: 1;
  margin-bottom: 4px;
}

.card-metric .metric-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

/* Task item row (TickTick-inspired) */
.task-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  transition: background 150ms ease;
  border-radius: 8px;
}

.task-row:hover {
  background: var(--accent-soft);
}

/* Glass overlay (for modals/tooltips, trend-2025) */
.glass-panel {
  background: rgba(254, 251, 246, 0.78);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(236, 224, 212, 0.60);
  border-radius: 20px;
  box-shadow: var(--shadow-lg);
}

[data-theme="dark"] .glass-panel {
  background: rgba(26, 20, 16, 0.72);
  border: 1px solid rgba(58, 48, 40, 0.50);
}
```

### 8.4 Sidebar Navigation

```css
/* === SIDEBAR (inspired by TickTick's clean sidebar + Rize's tinted approach) === */
.sidebar {
  width: 260px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-subtle);
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
}

.sidebar-item:hover {
  background: var(--accent-soft);
  color: var(--text-primary);
}

.sidebar-item.active {
  background: var(--accent-soft);
  color: var(--accent-primary);
  font-weight: var(--font-semibold);
}

/* TickTick-style colored list indicator */
.sidebar-item .color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sidebar-section-label {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  padding: 8px 12px 4px;
}

/* Sidebar icons: line-style, 1.5px stroke (Rize + TickTick pattern) */
.sidebar-item svg {
  width: 20px;
  height: 20px;
  stroke-width: 1.5;
  color: currentColor;
  flex-shrink: 0;
}
```

### 8.5 Icon System Recommendation

Based on all apps researched:
- **Style**: Line icons with 1.5px stroke weight (not 1px, not 2px)
- **Active state**: Either fill the icon OR change color (not both)
- **Recommended library**: Lucide Icons (open source, consistent 1.5px stroke)
- **Size scale**: 16px (inline), 20px (sidebar/nav), 24px (feature), 32px (empty states)
- **Color**: Inherit from parent (`currentColor`)
- **Special icons** (habits, categories): Can use dual-tone -- line with filled accent dot

### 8.6 Spacing System

```css
:root {
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}

/* Component spacing patterns from research:
   - Sidebar item padding: 10px 12px (snug but clickable)
   - Card inner padding: 20-24px (generous, breathable)
   - Task row padding: 12px 16px (compact, scannable)
   - Section gap: 24-32px
   - Page margin: 32-48px
   - Card grid gap: 16-20px
   - Between card title and content: 12-16px
*/
```

### 8.7 Border Radius System

```css
:root {
  --radius-sm: 6px;      /* Buttons, inputs, small chips */
  --radius-md: 10px;     /* Task rows, tags, sidebar items */
  --radius-lg: 16px;     /* Cards, panels (primary container radius) */
  --radius-xl: 20px;     /* Modals, floating panels, feature cards */
  --radius-2xl: 24px;    /* Hero sections, large containers */
  --radius-full: 9999px; /* Pills, avatars, circular elements */
}
```

### 8.8 Micro-interactions & Transitions

```css
/* === TRANSITIONS === */
:root {
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);    /* Standard ease */
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Slight overshoot */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
}

/* Card hover (Monday + Rize pattern) */
.card {
  transition:
    box-shadow var(--duration-normal) var(--ease-default),
    transform var(--duration-normal) var(--ease-default);
}
.card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

/* Checkbox completion (TickTick + 小日常 style) */
.checkbox {
  width: 22px;
  height: 22px;
  border: 2px solid var(--border-strong);
  border-radius: 50%;
  transition: all var(--duration-fast) var(--ease-spring);
}
.checkbox.checked {
  background: var(--color-success);
  border-color: var(--color-success);
  transform: scale(1.1);
  /* Returns to scale(1) after 150ms via JS or animation */
}

/* Sidebar item hover */
.sidebar-item {
  transition:
    background var(--duration-fast) var(--ease-default),
    color var(--duration-fast) var(--ease-default);
}

/* Progress ring animation (Forest-inspired) */
@keyframes progress-ring {
  from { stroke-dashoffset: 283; } /* Full circumference of r=45 circle */
  to { stroke-dashoffset: var(--progress-offset); }
}
.progress-ring circle.progress {
  animation: progress-ring 800ms var(--ease-default) forwards;
  transform-origin: center;
  transform: rotate(-90deg);
}

/* Stat number count-up entrance */
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.metric-value {
  animation: fade-up 400ms var(--ease-default);
}

/* Button press (tactile feedback) */
.btn:active {
  transform: scale(0.97);
  transition: transform 80ms ease;
}
```

### 8.9 Gradient Patterns

```css
/* Hero/header gradient (Rize-inspired but warmer) */
.gradient-hero {
  background: linear-gradient(135deg, #2c1810 0%, #5c2e1a 50%, #8b4225 100%);
}

/* Accent gradient for progress bars, highlights */
.gradient-accent {
  background: linear-gradient(135deg, #f26b3a 0%, #f5a623 100%);
}

/* Nature/focus gradient (Forest-inspired) */
.gradient-nature {
  background: linear-gradient(135deg, #4caf50 0%, #81c784 100%);
}

/* Warm surface gradient (小日常-inspired subtle warmth) */
.gradient-warm-surface {
  background: linear-gradient(180deg, #fefbf6 0%, #faf2e8 100%);
}

/* Gold reward shimmer (小日常 gamification) */
.gradient-gold {
  background: linear-gradient(135deg, #ffd54f 0%, #ffb74d 50%, #ffd54f 100%);
  background-size: 200% 200%;
}

/* Category color bars (TimeBlocks-inspired) */
.time-block-focus { background: linear-gradient(135deg, #4caf50, #66bb6a); }
.time-block-meeting { background: linear-gradient(135deg, #5c8ec6, #7eb3e0); }
.time-block-break { background: linear-gradient(135deg, #f5a623, #ffcc5a); }
.time-block-creative { background: linear-gradient(135deg, #ba68c8, #ce93d8); }
```

### 8.10 Key Design Principles Summary

1. **Warm, not cold**: Use brown undertones in text, shadows, and borders. Never pure black text or pure gray shadows. (Learned from 小日常, Forest)

2. **Cream canvas, white cards**: Background is warm cream/parchment (`#fefbf6`), cards are white. This subtle contrast creates depth without heavy shadows. (小日常, Rize, TickTick)

3. **Color IS information**: Use color-coded categories, status pills, and time blocks as the primary data visualization, not just decoration. (Monday.com, TickTick, TimeBlocks)

4. **Large metrics as anchors**: Dashboard stat numbers should be 32-40px, bold, in accent colors. They are the first thing the eye hits. (Rize)

5. **Rounded and friendly**: 16px border-radius on cards, 10px on interactive elements. Sharp corners feel enterprise; rounded corners feel personal. (小日常, TickTick)

6. **Warm-tinted shadows**: `rgba(44, 24, 16, 0.06)` not `rgba(0, 0, 0, 0.06)`. This single change makes everything feel cohesive with the warm palette. (小日常)

7. **Generous padding**: 20-24px inside cards, 12-16px for compact rows. Don't cram. Premium apps feel spacious. (All apps)

8. **Icons: 1.5px line weight**: Consistent across Rize, TickTick, Monday. Use Lucide or similar. Active state fills or recolors.

9. **Subtle hover transitions**: 150-200ms ease for backgrounds, 200ms for shadows and transforms. Never instant, never slow.

10. **Gamification with taste**: Gold/amber reward colors, progress rings, streak counts. Keep it warm and organic (小日常) not arcade-flashy.
