# Design System Documentation

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Charcoal | `#2C2C2A` | Primary text, buttons, active states |
| Beige | `#F5F4EF` | App background |
| White | `#FFFFFF` | Surfaces, cards |

### Status Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#22C55E` | Present, QR scanning, positive states |
| Warning | `#F97316` | Manual entries, alerts, caution |
| Error | `#DC2626` | Errors, critical states, failed actions |
| Secondary | `#9CA3AF` | Disabled, muted text |

### Secondary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Dark Scanner | `#0D0D0D` | Scanner camera background |
| Map Light | `#93C5FD` | Map highlights |
| Map Lighter | `#BFDBFE` | Map background |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| `bg-app` | `#F5F4EF` | Application background |
| `bg-surface` | `#FFFFFF` | Card/panel backgrounds |
| `bg-subtle` | `#EEEDE8` | Subtle backgrounds |
| `bg-light` | `#F9FAFB` | Input backgrounds |
| `bg-lighter` | `#FAFAFA` | Alternating rows |
| `border-subtle` | `rgba(0,0,0,0.07)` | Subtle borders |
| `border-light` | `rgba(0,0,0,0.12)` | Standard borders |

## Typography

### Font Family

```
'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
```

### Font Sizes

| Size | Px | Usage |
|------|-----|-------|
| `xs` | 9px | Tiny labels, captions |
| `xs-sm` | 10px | Extra small labels |
| `sm` | 11px | Small labels, metadata |
| `base` | 12px | Labels, secondary text |
| `base-lg` | 13px | Body text |
| `base-xl` | 14px | Form labels |
| `lg` | 15px | Button text, body |
| `lg-xl` | 16px | Heading 4 |
| `lg-2xl` | 17px | Panel headers |
| `xl` | 18px | Heading 3 |
| `2xl` | 20px | Numbers (countdown) |
| `3xl` | 22px | Heading 2, large text |
| `4xl` | 28px | Large numbers (stats) |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Normal | 400 | Body text, inputs |
| Medium | 500 | Labels, secondary headings |
| Semibold | 600 | Emphasis, badges |
| Bold | 700 | Headings, buttons |
| Extra Bold | 800 | Large titles |

### Line Heights

- Headers: 1.2 - 1.5
- Body: 1.4 - 1.6
- Tight: 1.1

## Spacing Scale

### Padding & Margin

| Name | Size | Usage |
|------|------|-------|
| `xs` | 3px | Tiny spacing |
| `xs-sm` | 4px | Extra small |
| `xs-md` | 5px | Extra small |
| `xs-lg` | 6px | Extra small |
| `sm` | 8px | Small |
| `sm-md` | 10px | Small-medium |
| `md` | 12px | Medium |
| `md-lg` | 14px | Medium-large |
| `lg` | 16px | Large (standard) |
| `lg-xl` | 18px | Large |
| `lg-2xl` | 20px | Large |
| `xl` | 24px | Extra large |
| `xl-2xl` | 28px | Extra large |
| `xl-3xl` | 32px | Extra large |

### Gap Between Elements

- Tight: 4px (icon + label in badges)
- Very Small: 6px (chip contents)
- Small: 8px (list items, form rows)
- Medium-Small: 10px (elements in header)
- Medium: 12px (stat cards, chips)
- Medium-Large: 14px (panel sections)
- Large: 16px (main sections, columns)
- Extra Large: 20px (panel spacing)

## Border Radius

| Name | Size | Usage |
|------|------|-------|
| `xs` | 4px | Small buttons, inputs |
| `sm` | 8px | Cards, inputs |
| `md` | 12px | Panels, dialogs |
| `lg` | 14px | Large panels |
| `xl` | 20px | Badges, toggles |
| `full` | 9999px | Circles, avatars, pills |

## Shadows

| Name | Value | Usage |
|------|-------|-------|
| `subtle` | `0 1px 3px rgba(0,0,0,0.08)` | Minimal elevation |
| `subtle-md` | `0 1px 4px rgba(0,0,0,0.06)` | Cards |
| `sm` | `0 2px 8px rgba(0,0,0,0.1)` | Small elements |
| `md` | `0 4px 12px rgba(0,0,0,0.1)` | Standard panels |
| `md-lg` | `0 4px 12px rgba(0,0,0,0.15)` | Large elements |
| `lg` | `0 8px 24px rgba(0,0,0,0.25)` | Logo, hero sections |
| `glow-green` | `0 0 8px #22C55E` | QR indicator |
| `glow-green-md` | `0 0 10px 2px rgba(34,197,94,0.5)` | QR scanning |
| `glow-blue` | `0 2px 10px rgba(59,130,246,0.6)` | GPS/location |

## Animations

### Pulse (1.4s)

Status indicators, live badges

```css
animation: pulse 1.4s ease-in-out infinite;
/* scale: [1 → 1.6 → 1], opacity: [1 → 0.5 → 1] */
```

### Pulse Scale (1.2s)

Live dot in badges

```css
animation: pulse-scale 1.2s ease-in-out infinite;
```

### Scanline (2.6s)

QR scanner animation

```css
animation: scanline 2.6s ease-in-out infinite;
/* top: [6% → 88% → 6%] */
```

### GPS Rings (2s, staggered)

Geofencing validation display

```css
animation: pulse-scale-gps 2s ease-in-out infinite;
/* delay: i * 0.3s for each ring */
```

### Page Transitions (220ms)

Student mobile screens

```css
/* Enter: opacity [0 → 1], x [18px → 0] */
/* Exit: opacity [1 → 0], x [0 → -18px] */
animation: slide-in-right 0.22s ease-in-out;
```

### Countdown Bar (0.9s)

QR countdown visualization

```css
transition: width 0.9s linear, background-color 0.3s;
/* Color change to red when < 5 seconds */
```

## Component Variants

### Buttons

```
btn-primary    | bg-charcoal, text-white, hover:bg-charcoal/90
btn-secondary  | bg-bg-subtle, border, text-charcoal
btn-ghost      | transparent, hover:bg-bg-subtle
btn-danger     | bg-error, text-white, hover:bg-error/90
```

### Cards & Surfaces

```
card           | bg-white, border-subtle, rounded-sm, shadow-subtle, p-lg
panel          | bg-white, border-light, rounded-lg, p-xl
```

### Badges

```
badge          | px-md, py-xs-md, rounded-xl, text-xs, font-semibold
badge-success  | bg-success/20, text-success
badge-warning  | bg-warning/20, text-warning
badge-error    | bg-error/20, text-error
```

## Responsive Breakpoints

- **Mobile**: 360px - 430px (student views)
- **Tablet**: 768px
- **Desktop**: 1024px+ (teacher dashboard)

## Dark Mode (if implemented)

Use Tailwind CSS dark mode with `dark:` prefix.

Example:
```html
<div class="bg-white dark:bg-charcoal">
  <p class="text-charcoal dark:text-white">Content</p>
</div>
```
