# Trace Design System v3 — "Dual Layer Macaron"

> 双层马卡龙设计系统 · 灵活的边框+阴影组合 · 按需使用 · Light + Dark mode

---

## 1. 设计哲学

**两种边框风格，按需使用：**
- **风格 A — 硬朗印刷风**：2px 实色边框 + offset 硬阴影 — 用于强调、CTA、需要视觉突出的卡片
- **风格 B — 马卡龙奶油风**：1px 淡奶油边框 + 柔和光晕阴影 — 用于常规内容、次要卡片、长时间阅读区域

**Key principles:**
- 温暖羊皮纸画布 (`#FDFBF7`)，绝不使用纯白色背景
- 边框颜色 = 语义颜色：不同颜色代表不同含义
- 阴影可选：不是所有卡片都需要阴影，可以无阴影或无边框
- 默认主色：马卡龙蓝，保持中性普适
- 渐进式信息披露：干净表面，复杂操作在交互时才展现
- 圆角弧度：24px 卡片，12px 按钮 — 保持界面友好亲和

---

## 2. 边框风格系统 Border System

### 四种边框组合，按需选择

| 风格 | 边框 | 阴影 | 使用场景 | CSS 类名 |
|---|---|---|---|---|
| **A1 — 强调印刷风** | `2px solid [语义色]` | `4px 4px 0px [语义色]` | CTA 卡片、重点功能、需要突出的内容 | `.trace-card-strong` |
| **A2 — 柔和印刷风** | `2px solid #D6D3CD` | `4px 4px 0px #D6D3CD` | 常规卡片、列表项、表单容器 | `.trace-card` (默认) |
| **B1 — 奶油光晕风** | `1px solid #F5F0EA` | `0 8px 30px rgba(121,190,235,0.08)` | Dashboard 卡片、数据可视化、沉浸式内容 | `.trace-card-soft` |
| **B2 — 纯净无边框** | `none` 或 `1px solid transparent` | `none` 或 `0 2px 8px rgba(0,0,0,0.02)` | 次要内容、分组容器、纯文字卡片 | `.trace-card-flat` |

### 语义边框颜色 Semantic Border Colors

| 颜色 | Hex | 含义 | 阴影 |
|---|---|---|---|
| 🟦 马卡龙蓝 | `#79BEEB` | 主色、信息、专注、默认 | `4px 4px 0px rgba(121,190,235,0.4)` |
| 🟪 马卡龙紫 | `#D4C4FB` | AI、创意、学习、智能功能 | `4px 4px 0px rgba(212,196,251,0.4)` |
| 🟩 马卡龙绿 | `#A8E6CF` | 成功、完成、休息、健康 | `4px 4px 0px rgba(168,230,207,0.4)` |
| 🟧 马卡龙柠檬 | `#FFD3B6` | 警告、提示、温暖 | `4px 4px 0px rgba(255,211,182,0.4)` |
| 🟥 马卡龙珊瑚 | `#FF8C82` | 危险、删除、紧急操作 | `4px 4px 0px rgba(255,140,130,0.4)` |
| 🩷 马卡龙粉 | `#FFB5D4` | 庆祝、奖励、治愈 | `4px 4px 0px rgba(255,181,212,0.4)` |
| ⬜ 中性灰 | `#D6D3CD` | 常规、默认、无特殊含义 | `4px 4px 0px #D6D3CD` |

> 💡 **设计铁律**: 绝对不要黑色/深灰色边框 (`#000`, `#111`, `#222`, `#333`)。最暗的边框就是 `#D6D3CD`（中灰色）。

---

## 3. 阴影系统 Shadow System

### 风格 A — Offset Shadow (印刷风)
```css
--shadow-offset: 4px 4px 0px [颜色];
--shadow-offset-hover: 6px 6px 0px [颜色];
```

### 风格 B — Glow Shadow (光晕风)
```css
--shadow-glow-xs: 0 1px 3px rgba(121, 190, 235, 0.05);
--shadow-glow-sm: 0 2px 8px rgba(121, 190, 235, 0.08);
--shadow-glow-md: 0 4px 16px rgba(121, 190, 235, 0.10);
--shadow-glow-lg: 0 8px 30px rgba(121, 190, 235, 0.12);
```

### 无阴影 No Shadow
```css
--shadow-none: none;
```

---

## 4. 颜色调色板 Complete Palette

### Default Accent — Macaron Blue
| Token | Light | Dark |
|---|---|---|
| `--color-accent` | `#79BEEB` | `#79BEEB` |
| `--color-accent-hover` | `#5AACDF` | `#8DCAF0` |
| `--color-accent-soft` | `rgba(121,190,235,0.12)` | `rgba(121,190,235,0.18)` |

### Complete Macaron Palette
| Name | Main | Soft Background | Usage |
|---|---|---|---|
| Macaron Blue | `#79BEEB` | `rgba(121,190,235,0.12)` | 主色、信息、专注 |
| Macaron Purple | `#D4C4FB` | `rgba(212,196,251,0.12)` | AI、创意、学习 |
| Macaron Green | `#A8E6CF` | `rgba(168,230,207,0.12)` | 成功、休息、完成 |
| Macaron Lemon | `#FFD3B6` | `rgba(255,211,182,0.12)` | 警告、休息、温暖 |
| Macaron Coral | `#FF8C82` | `rgba(255,140,130,0.12)` | 危险、删除、紧急 |
| Macaron Pink | `#FFB5D4` | `rgba(255,181,212,0.12)` | 庆祝、奖励、治愈 |

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
| `--color-border-subtle` | `#F5F0EA` | `#3A3436` |
| `--color-border-light` | `#EDE8E2` | `#453F41` |
| `--color-border-strong` | `#D6D3CD` | `#504A4C` |

---

## 5. 组件样式速查 Component Cheat Sheet

### 🃏 Cards — 四种风格

```css
/* 默认：风格 A2 — 柔和印刷风 (2px 灰边框 + offset 阴影) */
.trace-card {
  background: var(--color-bg-surface-1);
  border: 2px solid var(--color-border-strong);  /* #D6D3CD */
  border-radius: 24px;
  box-shadow: 4px 4px 0px var(--color-border-strong);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.trace-card:hover {
  box-shadow: 6px 6px 0px var(--color-border-strong);
  transform: translate(-2px, -2px);
}

/* 强调：风格 A1 — 语义色印刷风 (2px 彩色边框 + 彩色 offset 阴影) */
.trace-card-blue {
  border-color: var(--color-blue);
  box-shadow: 4px 4px 0px rgba(121,190,235,0.4);
}
.trace-card-purple {
  border-color: var(--color-purple);
  box-shadow: 4px 4px 0px rgba(212,196,251,0.4);
}
.trace-card-green {
  border-color: var(--color-green);
  box-shadow: 4px 4px 0px rgba(168,230,207,0.4);
}
/* ... 同理其他颜色 */

/* 柔和：风格 B1 — 奶油光晕风 (1px 淡边框 + 蓝色光晕) */
.trace-card-soft {
  background: var(--color-bg-surface-1);
  border: 1px solid var(--color-border-subtle);  /* #F5F0EA */
  border-radius: 24px;
  box-shadow: 0 8px 30px rgba(121,190,235,0.08), 0 2px 8px rgba(0,0,0,0.02);
}
.trace-card-soft:hover {
  box-shadow: 0 12px 40px rgba(121,190,235,0.12), 0 4px 12px rgba(0,0,0,0.03);
  transform: translateY(-2px);
}

/* 纯净：风格 B2 — 无边框无阴影 (用于次要内容) */
.trace-card-flat {
  background: var(--color-bg-surface-1);
  border: none;
  border-radius: 24px;
  box-shadow: none;
}

/* 极简：无边框但有极淡阴影 */
.trace-card-minimal {
  background: var(--color-bg-surface-2);
  border: 1px solid transparent;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}
```

### 🔘 Buttons — 按钮

```css
/* Primary Button — 强调印刷风 */
.btn-primary {
  background: var(--color-accent);
  color: #FFFFFF;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 4px 4px 0px var(--color-border-strong);
  transition: all 0.2s ease;
}
.btn-primary:hover {
  box-shadow: 6px 6px 0px var(--color-border-strong);
  transform: translate(-2px, -2px);
}

/* Secondary Button */
.btn-secondary {
  background: #FFFFFF;
  color: #3A3638;
  border: 2px solid var(--color-border-strong);
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 4px 4px 0px var(--color-border-strong);
}

/* Soft Button — 奶油光晕风 */
.btn-soft {
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(121,190,235,0.20);
}
```

### ⌨️ Inputs — 输入框

```css
/* 默认输入框 — 风格 A2 */
.input {
  background: var(--color-bg-surface-1);
  border: 2px solid var(--color-border-strong);
  border-radius: 12px;
  padding: 12px 16px;
}
.input:focus {
  border-color: var(--color-accent);
}

/* 柔和输入框 — 风格 B1 */
.input-soft {
  background: var(--color-bg-surface-1);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(121,190,235,0.05);
}
```

---

## 6. 使用场景指南 Usage Guide

### ✅ 什么时候用哪种风格？

| 页面/组件 | 推荐风格 | 原因 |
|---|---|---|
| **首页 Dashboard** | 混合使用 | 重点数据卡片用 A1 (彩色边框)，常规卡片用 A2，次要内容用 B2 |
| **任务列表 Task** | A2 (默认) + A1 (强调) | 待办任务需要清晰的边界，印刷风的明确感适合任务管理 |
| **日历视图 Calendar** | B1 (奶油光晕) | 日历需要柔和、不拥挤的视觉体验，光晕阴影更适合 |
| **统计页面 Analytics** | 混合 | 图表卡片用 B1，关键指标卡片用 A1 彩色边框突出 |
| **设置页面 Settings** | A2 (全部统一) | 设置页面需要清晰的分组边界，印刷风更合适 |
| **弹窗/模态框 Modal** | A1 (强调色边框) | 弹窗需要吸引注意力，彩色边框 + offset 阴影效果更好 |
| **AI 相关功能** | A1 (紫色边框) | 紫色语义 = AI/智能，用紫色边框 + 紫色阴影突出 |
| **成功/完成状态** | A1 (绿色边框) | 绿色语义 = 成功/完成，视觉反馈明确 |
| **警告/提示** | A1 (柠檬色边框) | 温暖的柠檬色适合提示信息，不刺眼但醒目 |
| **删除/危险操作** | A1 (珊瑚色边框) | 珊瑚色 = 危险/删除，清晰的视觉警示 |

### 💡 设计最佳实践

1. **同一页面不要混用超过 2 种风格** — 比如 A2 + A1 是可以的，但不要同时用 A1、A2、B1、B2 四种
2. **同一类组件保持风格统一** — 比如所有列表项都用同一种边框风格
3. **风格变化 = 语义变化** — 当一个卡片用了不同颜色的边框，就应该代表它有特殊含义（成功、警告、AI 等）
4. **不要过度使用阴影** — 密集列表的卡片可以不要阴影，只留边框
5. **深色模式下可以减少阴影** — 暗色背景本身已有层次感，可以适当弱化或去掉阴影

---

## 7. Typography

| Role | Font | Weight |
|---|---|---|
| Headings | **Quicksand** | 700 |
| Body | **Plus Jakarta Sans** | 400–700 |
| Code/Tags | **JetBrains Mono** | 400–500 |
| Chinese | **Noto Sans SC** | 300–700 |

---

## 8. Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 8px | Tags, badges |
| `--radius-md` | 12px | Buttons, inputs |
| `--radius-lg` | 16px | Small cards |
| `--radius-xl` | 20px | Modals |
| `--radius-2xl` | 24px | Primary cards |

---

## 9. 设计决策记录 Design Decisions

### ✅ 已确认的决策
1. **保留两种边框风格**：2px 硬边框 + offset 阴影 (风格 A) 和 1px 柔边框 + 光晕阴影 (风格 B) 都保留，按需使用
2. **边框颜色有语义**：不同颜色的边框代表不同含义（AI=紫色，成功=绿色，等等）
3. **不是所有卡片都要有阴影**：可以无阴影、可以无边框、可以只有边框没有阴影
4. **默认风格 = A2**：`2px solid #D6D3CD` + `4px 4px 0px #D6D3CD` 作为大部分组件的默认样式

### 🚫 绝对禁止
- 黑色/深灰色边框：`#000`, `#111`, `#222`, `#333` 等
- 边框颜色与语义不符（比如删除按钮用绿色边框）
- 同一页面边框风格混乱

---

*Last updated: 2026-04-21 · Design System v3 "Dual Layer Macaron" — 双层马卡龙灵活设计系统*
