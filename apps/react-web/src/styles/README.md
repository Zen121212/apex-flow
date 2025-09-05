# ApexFlow Design System

## Brand Colors

### Primary Colors
- **Main**: `#04172F` (Deep Navy) - Primary brand color
- **Accent**: `#0097F6` (Bright Blue) - Secondary brand color for CTAs and highlights

### Usage
All colors are available as CSS custom properties in `/styles/brand.css`:

```css
/* Primary Brand Colors */
--apex-main: #04172F;
--apex-accent: #0097F6;

/* Color Variations */
--apex-main-light: rgba(4, 23, 47, 0.1);
--apex-main-hover: rgba(4, 23, 47, 0.8);
--apex-accent-light: rgba(0, 151, 246, 0.1);
--apex-accent-hover: rgba(0, 151, 246, 0.8);
```

### Semantic Colors
```css
/* Text Colors */
--text-primary: var(--apex-main);    /* Main text */
--text-secondary: var(--color-gray-600);  /* Secondary text */
--text-accent: var(--apex-accent);    /* Accent text */

/* Background Colors */
--bg-brand: var(--apex-main);        /* Brand backgrounds */
--bg-accent: var(--apex-accent);     /* Accent backgrounds */

/* Border Colors */
--border-focus: var(--apex-accent);  /* Focus states */
--border-accent: var(--apex-accent); /* Accent borders */
```

## Components Using Brand Colors

### Buttons
- **Primary**: Uses accent color (`--apex-accent`)
- **Secondary**: Uses main color (`--apex-main`)

### Icons
- **Default**: Main color (`--apex-main`)
- **Interactive**: Hover transitions main → accent
- **Sidebar**: Preserves existing styling

### Inputs
- **Focus states**: Use accent color
- **Borders**: Use semantic border colors

## Import Order
The styles are imported in this order via `/styles/index.css`:
1. `brand.css` - Brand colors and design tokens
2. `globals.css` - Global styles
3. `tokens.css` - Additional design tokens

## Usage Examples

```css
/* Use brand colors */
.my-component {
  color: var(--text-primary);
  background: var(--bg-accent);
  border: 1px solid var(--border-accent);
}

/* Interactive states */
.interactive-element {
  color: var(--apex-main);
  transition: color 0.2s ease;
}

.interactive-element:hover {
  color: var(--apex-accent);
}
```
