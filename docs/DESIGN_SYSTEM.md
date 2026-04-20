# Trace Design System v3 — "Macaron Editorial"

> Figma UI Reference · Light + Dark mode · Gender-neutral

---

## 1. Design Philosophy

Editorial illustration style meets pastel macaron palette. Cards have soft borders with offset shadows (like editorial print), giving a playful yet structured feel. Rounded corners (24px cards, 12px buttons) keep the interface friendly and approachable.

**Key principles:**
- Warm parchment canvas (`#FDFBF7`), never pure white backgrounds
- Soft 2px borders with offset box-shadows — the "editorial stamp" look
- Macaron pastel accents — soft enough for all-day use, distinctive enough to feel premium
- Progressive disclosure — clean surfaces, complexity revealed on interaction
- Default shipped visual tone should be **blue-forward and gender-neutral**, not pink-forward
- Coral Pink remains an optional accent theme, but should not define the default product feel

---

## 2. Color Palette

### Default Beta Accent — Macaron Blue
| Token | Light | Dark |
|---|---|---|
| `--color-accent` | `#79BEEB` | `#79BEEB` |
| `--color-accent-hover` | `#5AACDF` | `#8DCAF0` |
| `--color-accent-soft` | `rgba(121,190,235,0.12)` | `rgba(121,190,235,0.18)` |

> Default shipped accent should be **Macaron Blue** to keep the product broadly appealing and less overly cute. Coral Pink remains available as a selectable theme.

### Macaron Secondaries
| Name | Hex | Usage |
|---|---|---|
| Macaron Mint | `#A8E6CF` | Success, rest, health |
| Macaron Lilac | `#D4C4FB` | Creative, learning, AI |
| Macaron Lemon | `#FFD3B6` | Warning, breaks, warmth |
| Macaron Blue | `#79BEEB` | Info, meetings, focus |

### Canvas & Surface
| Token | Light | Dark |
|---|---|---|
| `--color-bg-base` | `#FDFBF7` | `#1A1718` |
| `--color-bg-surface-1` | `#FFFFFF` | `#242022` |
| `--color-bg-surface-2` | `#FAF7F2` | `#2E2A2C` |
| `--color-bg-surface-3` | `#F5F1EA` | `#383436` |

### Text
| Token | Light | Dark |
|---|---|---|
| `--color-text-primary` | `#3A3638` | `#F5F0ED` |
| `--color-text-secondary` | `#5C5658` | `#D4CCCF` |
| `--color-text-muted` | `#9E9899` | `#A89DA0` |

### Borders
| Token | Light | Dark |
|---|---|---|
| `--color-border-subtle` | `#E8E4DE` | `#3A3436` |
| `--color-border-strong` | `#D6D3CD` | `#504A4C` |

> Cards use `--color-border-strong` (`#D6D3CD`) for borders — no dark/black borders.

---

## 3. Typography

| Role | Font | Weight | Usage |
|---|---|---|---|
| Headings | **Quicksand** | 700 | Page titles, section headers, card titles |
| Body | **Plus Jakarta Sans** | 400–700 | Body text, labels, descriptions |
| Code/Tags | **JetBrains Mono** | 400–500 | Time displays, data labels, tags, metrics |
| Chinese | **Noto Sans SC** | 300–700 | CJK fallback for all roles |

### Scale
| Level | Size | Line Height | Font |
|---|---|---|---|
| Display | 32px | 1.2 | Quicksand 700 |
| H1 | 24px | 1.3 | Quicksand 700 |
| H2 | 20px | 1.3 | Quicksand 700 |
| H3 | 16px | 1.4 | Quicksand 600 |
| Body | 14px | 1.6 | Plus Jakarta Sans 400 |
| Body Bold | 14px | 1.6 | Plus Jakarta Sans 600 |
| Caption | 12px | 1.5 | Plus Jakarta Sans 500 |
| Mono | 13px | 1.4 | JetBrains Mono 400 |

---

## 4. Spacing & Layout

**8px grid system**

| Token | Value |
|---|---|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 12px |
| `lg` | 16px |
| `xl` | 24px |
| `2xl` | 32px |
| `3xl` | 48px |
| `4xl` | 64px |

### Sidebar
- Width: `256px` (expanded), `68px` (collapsed)
- Background: `#FFFFFF` (light), `#242022` (dark)
- Border right: `2px solid #D6D3CD`

### Content area
- Max width: `960px` (centered)
- Page padding: `32px`

---

## 5. Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 8px | Small elements, tags |
| `--radius-md` | 12px | Buttons, inputs, chips |
| `--radius-lg` | 16px | Small cards, dialogs |
| `--radius-xl` | 20px | Modals |
| `--radius-2xl` | 24px | Primary cards |
| `--radius-full` | 9999px | Avatars, circular buttons |

---

## 6. Shadows — Editorial Offset

The signature "editorial stamp" look: solid offset shadows instead of blur-only.

| Token | Value | Usage |
|---|---|---|
| `--shadow-card` | `4px 4px 0px #D6D3CD` | Default card shadow |
| `--shadow-card-hover` | `6px 6px 0px #D6D3CD` | Card hover state |
| `--shadow-accent` | `4px 4px 0px rgba(255,140,130,0.35)` | Accent/CTA cards |
| `--shadow-sm` | `0 2px 6px rgba(58,54,56,0.05)` | Subtle elevation |
| `--shadow-md` | `0 4px 12px rgba(58,54,56,0.07)` | Dropdowns, tooltips |

Dark mode shadows use `rgba(0,0,0,...)` for deeper contrast.

---

## 7. Component Primitives

### Card (`.trace-card`)
```css
background: var(--color-bg-surface-1);
border: 2px solid var(--color-border-strong);
border-radius: 24px;
box-shadow: 4px 4px 0px #D6D3CD;
```

### Card Soft (`.trace-card-soft`)
```css
background: var(--color-bg-surface-1);
border: 1px solid var(--color-border-subtle);
border-radius: 24px;
box-shadow: 0 2px 6px rgba(58,54,56,0.05);
```

### Button — Primary
```css
background: var(--color-accent);
color: #FFFFFF;
border: none;
border-radius: 12px;
font-family: 'Plus Jakarta Sans';
font-weight: 600;
box-shadow: 4px 4px 0px var(--color-border-strong);
```

### Button — Secondary
```css
background: #FFFFFF;
color: #3A3638;
border: 2px solid #D6D3CD;
border-radius: 12px;
box-shadow: 4px 4px 0px #D6D3CD;
```

### Nav Item — Active
```css
background: var(--color-accent);
color: #FFFFFF;
border: none;
border-radius: 12px;
```

### Nav Item — Inactive
```css
background: transparent;
color: #5C5658;
border-radius: 12px;
```

### Input
```css
background: var(--color-bg-surface-1);
border: 2px solid var(--color-border-strong);
border-radius: 12px;
padding: 10px 14px;
font-family: 'Plus Jakarta Sans';
```

### Tag / Chip
```css
background: var(--color-accent-soft);
color: var(--color-accent);
border-radius: 8px;
font-family: 'JetBrains Mono';
font-size: 12px;
font-weight: 500;
padding: 4px 10px;
```

---

## 8. Color Themes (User Selectable)

Users can switch accent color in Settings. All themes share the same canvas and text colors.

| Theme | Accent | Hover | Chinese Name |
|---|---|---|---|
| Macaron Blue | `#79BEEB` | `#5AACDF` | 马卡龙蓝 |
| Coral Pink | `#FF8C82` | `#FB5F51` | 珊瑚粉 |
| Macaron Mint | `#A8E6CF` | `#7DD4B0` | 马卡龙薄荷 |
| Macaron Lilac | `#D4C4FB` | `#B8A3F5` | 马卡龙紫 |
| Macaron Lemon | `#FFD3B6` | `#FFBB8E` | 马卡龙柠檬 |

> Recommended default for beta shipping: **Macaron Blue**

---

## 9. Dark Mode

Dark mode inverts canvas to warm dark tones while keeping accent colors consistent.

- Background base: `#1A1718` (warm dark, not pure black)
- Cards get soft border using `--color-border-strong` (`#504A4C`), no dark/black borders
- Offset shadows use `rgba(0,0,0,0.30)` for depth
- Accent soft backgrounds increase opacity from 0.12 → 0.18 for visibility

---

## 10. Animation

| Name | Duration | Easing | Usage |
|---|---|---|---|
| `fadeIn` | 350ms | ease-default | Page content appear |
| `scaleIn` | 200ms | ease-default | Modal/popup appear |
| `slideInRight` | 250ms | ease-default | Sidebar items |
| `breath` | 4s | ease-in-out | Focus mode pulsing |
| `pageEnter` | 350ms | ease-default | Page transition in |
| Card hover | 200ms | ease-default | Shadow + translate |

---

## 11. Tailwind Classes Quick Reference

```
font-heading     → Quicksand
font-sans        → Plus Jakarta Sans
font-mono        → JetBrains Mono
shadow-card      → 4px 4px 0px #D6D3CD
shadow-card-hover → 6px 6px 0px #D6D3CD
rounded-container → 24px (cards)
rounded-button   → 12px (buttons, inputs)
```

---

*Last updated: 2026-04-20 · Design System v3 "Macaron Editorial"*
