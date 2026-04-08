# Design System Inspiration of Zapier (adapted for Merize)

## 1. Visual Theme & Atmosphere

Zapier's website radiates warm, approachable professionalism. It rejects the cold monochrome minimalism of developer tools in favor of a cream-tinted canvas (`#fffefb`) that feels like unbleached paper -- the digital equivalent of a well-organized notebook. The near-black (`#201515`) text has a faint reddish-brown warmth, creating an atmosphere more human than mechanical. This is automation designed to feel effortless, not technical.

The brand's signature orange (`#ff4f00`) is unmistakable -- a vivid, saturated red-orange that sits precisely between traffic-cone urgency and sunset warmth. It's used sparingly but decisively: primary CTA buttons, active state underlines, and accent borders. Against the warm cream background, this orange creates a color relationship that feels energetic without being aggressive.

**Key Characteristics:**
- Warm cream canvas (`#fffefb`) instead of pure white -- organic, paper-like warmth
- Near-black with reddish undertone (`#201515`) -- text that breathes rather than dominates
- Inter as the universal UI font across all functional typography
- Zapier Orange (`#ff4f00`) as the single accent -- vivid, warm, sparingly applied
- Warm neutral palette: borders (`#c5c0b1`), muted text (`#939084`), surface tints (`#eceae3`)
- 8px base spacing system with generous padding on CTAs
- Border-forward design: `1px solid` borders in warm grays define structure over shadows

## 2. Color Palette & Roles

### Primary
- **Zapier Black** (`#201515`): Primary text, headings, dark button backgrounds. A warm near-black with reddish undertones -- never cold.
- **Cream White** (`#fffefb`): Page background, card surfaces, light button fills. Not pure white; the yellowish warmth is intentional.
- **Off-White** (`#fffdf9`): Secondary background surface, subtle alternate tint. Nearly indistinguishable from cream white but creates depth.

### Brand Accent
- **Zapier Orange** (`#ff4f00`): Primary CTA buttons, active underline indicators, accent borders. The signature color -- vivid and warm.

### Neutral Scale
- **Dark Charcoal** (`#36342e`): Secondary text, footer text, border color for strong dividers. A warm dark gray-brown with 70% opacity variant.
- **Warm Gray** (`#939084`): Tertiary text, muted labels, timestamp-style content. Mid-range with greenish-warm undertone.
- **Sand** (`#c5c0b1`): Primary border color, hover state backgrounds, divider lines. The backbone of Zapier's structural elements.
- **Light Sand** (`#eceae3`): Secondary button backgrounds, light borders, subtle card surfaces.
- **Mid Warm** (`#b5b2aa`): Alternate border tone, used on specific span elements.

### Interactive
- **Orange CTA** (`#ff4f00`): Primary action buttons and active tab underlines.
- **Dark CTA** (`#201515`): Secondary dark buttons with sand hover state.
- **Light CTA** (`#eceae3`): Tertiary/ghost buttons with sand hover.
- **Link Default** (`#201515`): Standard link color, matching body text.

### Dark Mode Palette
- **Background**: (`#1a1614`): Warm dark near-black with reddish undertones
- **Surface**: (`#25201e`): Card and container surfaces
- **Border**: (`#4a4640`): Warm dark gray borders
- **Text Primary**: (`#f8f5f0`): Primary text on dark
- **Text Secondary**: (`#d1cdc4`): Secondary text on dark
- **Accent**: (`#ff6b2a`): Lighter orange for dark mode visibility

## 3. Typography Rules

### Font Families
- **Primary**: `Inter`, with fallbacks: `Helvetica, Arial`
- **Display**: For hero headlines - same Inter with tighter tracking

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero XL | Inter | 80px (5.00rem) | 500 | 0.90 (tight) | -1px | Maximum impact, compressed block |
| Display Hero | Inter | 56px (3.50rem) | 500 | 0.90-1.10 (tight) | -0.5px | Primary hero headlines |
| Section Heading | Inter | 48px (3.00rem) | 500 | 1.04 (tight) | normal | Major section titles |
| Sub-heading LG | Inter | 36px (2.25rem) | 500 | normal | -1px | Large sub-sections |
| Sub-heading | Inter | 32px (2.00rem) | 400 | 1.25 (tight) | normal | Standard sub-sections |
| Card Title | Inter | 24px (1.50rem) | 600 | normal | -0.48px | Card headings |
| Body Large | Inter | 20px (1.25rem) | 400-500 | 1.00-1.20 (tight) | -0.2px | Feature descriptions |
| Body Emphasis | Inter | 18px (1.13rem) | 600 | 1.00 (tight) | normal | Emphasized body text |
| Body | Inter | 16px (1.00rem) | 400-500 | 1.20-1.25 | -0.16px | Standard reading text |
| Body Semibold | Inter | 16px (1.00rem) | 600 | 1.16 (tight) | normal | Strong labels |
| Button | Inter | 16px (1.00rem) | 600 | normal | normal | Standard buttons |
| Button SM | Inter | 14px (0.88rem) | 600 | normal | normal | Small buttons |
| Caption | Inter | 14px (0.88rem) | 500 | 1.25-1.43 | normal | Labels, metadata |
| Caption Upper | Inter | 14px (0.88rem) | 600 | normal | 0.5px | Uppercase section labels |
| Micro | Inter | 12px (0.75rem) | 600 | 0.90-1.33 | 0.5px | Tiny labels, often uppercase |

### Principles
- **Single-font system** for simplicity: Inter handles everything
- **Compressed display**: Headlines at ~0.90 line-height create vertically compressed blocks that feel modern
- **Weight as hierarchy signal**: Inter uses 400 (reading), 500 (navigation/emphasis), 600 (headings/CTAs)
- **Uppercase for labels**: Section labels use `text-transform: uppercase` with 0.5px letter-spacing
- **Negative tracking for headlines**: Headings use slight negative letter-spacing for tighter modern look

## 4. Component Stylings

### Buttons

**Primary Orange**
- Background: `#ff4f00`
- Text: `#fffefb`
- Padding: 12px 24px
- Radius: 4px
- Border: `1px solid #ff4f00`
- Use: Primary CTA

**Primary Dark**
- Background: `#201515`
- Text: `#fffefb`
- Padding: 16px 24px
- Radius: 8px
- Border: `1px solid #201515`
- Hover: background shifts to `#c5c0b1`, text to `#201515`
- Use: Large secondary CTA buttons

**Light / Ghost**
- Background: `#eceae3`
- Text: `#36342e`
- Padding: 16px 24px
- Radius: 8px
- Border: `1px solid #c5c0b1`
- Hover: background shifts to `#c5c0b1`, text to `#201515`
- Use: Tertiary actions, filter buttons

**Pill Button**
- Background: `#fffefb`
- Text: `#36342e`
- Padding: 6px 16px
- Radius: 20px
- Border: `1px solid #c5c0b1`
- Use: Tag-like selections, filter pills

### Cards & Containers
- Background: `#fffefb` (light) / `#25201e` (dark)
- Border: `1px solid #c5c0b1` (light) / `1px solid #4a4640` (dark)
- Radius: 5px (standard), 8px (featured)
- No shadow elevation by default -- borders define containment
- Hover: subtle border color intensification

### Inputs & Forms
- Background: `#fffefb`
- Text: `#201515`
- Border: `1px solid #c5c0b1`
- Radius: 5px
- Focus: border color shifts to `#ff4f00` (orange)
- Placeholder: `#939084`

### Navigation (Sidebar for Desktop App)
- Clean vertical nav on cream/dark surface
- Links: Inter 16px weight 500, text matches theme
- Active items use orange left border for indication
- Compact spacing for desktop app layout

## 5. Layout Principles (Merize Desktop App Adaptation)

### Spacing System
- Base unit: 8px
- Scale: 1px, 4px, 6px, 8px, 10px, 12px, 16px, 20px, 24px, 32px, 40px, 48px
- CTA buttons use generous padding: 12px 24px for standard, 16px 24px for large
- Fixed sidebar (260px) + main content flex layout for desktop app

### Border Radius Scale
- Tight (3px): Small inline spans
- Standard (4px): Buttons (orange CTA), tags, small elements
- Content (5px): Cards, links, general containers
- Comfortable (8px): Featured cards, large buttons, tabs
- Social (14px): Social icon buttons, pill-like elements
- Pill (20px): Play buttons, large pill buttons, floating actions

### Whitespace Philosophy
- **Warm breathing room**: Generous spacing between components, but content areas are relatively dense
- **Border-forward structure**: Warm sand borders define containment instead of shadows
- **Consistent canvas**: Cream background throughout (light mode), warm dark in dark mode

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow | Page background, text blocks |
| Bordered (Level 1) | `1px solid #c5c0b1` (light) / `1px solid #4a4640` (dark) | Standard cards, containers, inputs |
| Strong Border (Level 1b) | `1px solid #36342e` | Dark dividers, emphasized sections |
| Focus (Accessibility) | `1px solid #ff4f00` outline | Focus ring on interactive elements |

**Shadow Philosophy**: Follow Zapier's border-forward approach. Structure is defined almost entirely through borders -- warm sand for light mode, warm dark gray for dark mode. This border-first approach keeps the design grounded and tangible rather than floating.

## 7. Do's and Don'ts

### Do
- Use warm cream (`#fffefb`) as the light background, never pure white -- the warmth defines the style
- Use `#201515` for text in light mode, never pure black -- the reddish warmth matters
- Keep Zapier Orange (`#ff4f00`) reserved for primary CTAs and active state indicators -- it's the only accent
- Use sand (`#c5c0b1`) borders as the primary structural element instead of shadows
- Apply generous button padding to match Zapier's spacious button style
- Use uppercase with 0.5px letter-spacing for section labels and micro-categorization
- Maintain warm neutral palette throughout -- everything shifts toward warm tones

### Don't
- Don't use pure white (`#ffffff`) or pure black (`#000000`) -- Zapier's palette is warm-shifted
- Don't apply box-shadow elevation to cards -- use borders instead
- Don't scatter Zapier Orange across the UI -- it's reserved for CTAs and active states
- Don't ignore the warm neutral system -- borders should be warm sand, not cool gray
- Don't use rounded pill shapes (9999px) for primary buttons -- pills are for tags only

## 8. Adapting to Merize

Merize is a **desktop sidebar app** (not a marketing website), so we adapt Zapier's principles:
- Left sidebar: 260px fixed width, bordered surface (using border principle)
- Main content: Flex-grow with padding, cream/dark warm background
- Sidebar navigation: Active items have orange left indicator
- Cards follow border-first approach: 1px sand border, no shadow
- Tracking indicator: Orange pulsing dot when active
- All existing functionality preserved but visually restyled to match warm orange vibrant aesthetic
