# 🎨 Modern Finance Theme Guide

## Overview
This Tontine Management System now features a sophisticated **Modern Finance** visual identity with professional aesthetics designed for financial applications.

---

## 🎨 Color Palette

### Primary Colors

#### **Navy Blue / Slate** (Backgrounds & Structure)
- Used for: Main backgrounds, sidebars, structural elements
- Light mode: `slate-50` to `slate-100`
- Dark mode: `navy-900` to `navy-950`

```tsx
// Examples
<div className="bg-slate-100 dark:bg-navy-900">...</div>
<div className="text-navy-700 dark:text-navy-300">...</div>
```

#### **Emerald Green** (Success & Growth Actions)
- Used for: Contributions, gains, positive metrics, primary CTAs
- HSL: `160 84% 39%`
- Variants: `emerald-50` to `emerald-900`

```tsx
// Examples
<Button className="bg-emerald-600 hover:bg-emerald-700">Add Contribution</Button>
<div className="text-success">+15% Growth</div>
<div className="border-success">...</div>
```

#### **Golden/Amber** (Alerts & Credits)
- Used for: Credit notifications, warnings, important alerts
- Variants: `amber-50` to `amber-900`

```tsx
// Examples
<Badge className="bg-amber-100 text-amber-800">Credit Alert</Badge>
<div className="text-alert">Warning message</div>
<Card className="border-amber-200">...</Card>
```

---

## 🔤 Typography

### Font Family: **Plus Jakarta Sans**

A clean, professional sans-serif font perfect for financial interfaces.

```css
/* Automatically applied via tailwind.config.js */
font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
```

### Font Weights Available
- `font-light` (300)
- `font-normal` (400)
- `font-medium` (500) - **Default for labels**
- `font-semibold` (600) - **For headings**
- `font-bold` (700) - **For metrics/numbers**
- `font-extrabold` (800) - **For hero text**

---

## ✨ Glassmorphism Effects

### Available Glass Utilities

#### `.glass` - Standard Glassmorphism
Semi-transparent with medium blur. Perfect for overlays and floating elements.

```tsx
<div className="glass p-4">
  Floating content with subtle blur
</div>
```

#### `.glass-card` - Enhanced Glass Card
Stronger blur and better contrast. **Recommended for Dashboard cards**.

```tsx
<Card className="glass-card">
  <CardHeader>...</CardHeader>
  <CardContent>Financial metrics</CardContent>
</Card>
```

#### `.glass-strong` - Maximum Glass Effect
Strongest blur and opacity. For critical UI elements.

```tsx
<div className="glass-strong">
  Important notification
</div>
```

### Glassmorphism with Color Accents

Combine glass effects with colored borders for visual hierarchy:

```tsx
{/* Success card with emerald accent */}
<Card className="glass-card border-emerald-200 dark:border-emerald-900">
  <div className="text-emerald-700 dark:text-emerald-300">
    Total Cash: {amount}
  </div>
</Card>

{/* Alert card with amber accent */}
<Card className="glass-card border-amber-200 dark:border-amber-900">
  <div className="text-amber-700 dark:text-amber-300">
    Credits Active: {count}
  </div>
</Card>

{/* Error/Penalty card with red accent */}
<Card className="glass-card border-red-200 dark:border-red-900">
  <div className="text-red-700 dark:text-red-300">
    Penalties: {count}
  </div>
</Card>
```

---

## 🎯 Theme Utility Classes

### Success/Growth (Emerald)
```tsx
.text-success     // Emerald text color
.bg-success       // Emerald background
.border-success   // Emerald border
```

### Alert/Warning (Amber)
```tsx
.text-alert       // Amber text color
.bg-alert         // Amber background
.border-alert     // Amber border
```

### Navy Accents
```tsx
.text-navy        // Navy text color
.bg-navy          // Navy background
.border-navy      // Navy border
```

---

## 📏 Border Radius

Modern, softer interface with rounded corners:
- `--radius: 0.75rem` (12px)
- `rounded-lg`: `0.75rem`
- `rounded-md`: `0.625rem` (10px)
- `rounded-sm`: `0.5rem` (8px)

```tsx
<Card className="rounded-lg">...</Card>  {/* 12px corners */}
<Button className="rounded-md">...</Button> {/* 10px corners */}
```

---

## 🎨 Usage Examples

### Dashboard Metric Cards

```tsx
{/* Cash in Hand - Emerald accent for positive metrics */}
<Card className="glass-card border-emerald-200 dark:border-emerald-900">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Cash en Caisse</CardTitle>
    <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
      {formatCurrency(totalCash)}
    </div>
  </CardContent>
</Card>

{/* Credits - Amber accent for alerts */}
<Card className="glass-card border-amber-200 dark:border-amber-900">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Crédits Actifs</CardTitle>
    <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
      {activeCredits}
    </div>
  </CardContent>
</Card>
```

### Chart Colors

Use the theme colors in Recharts for consistency:

```tsx
<LineChart data={data}>
  <Line 
    dataKey="contributions" 
    stroke="hsl(160 84% 39%)"  {/* Emerald */}
    strokeWidth={2}
  />
  <Line 
    dataKey="penalties" 
    stroke="hsl(0 84% 60%)"    {/* Red */}
    strokeWidth={2}
  />
</LineChart>

<PieChart>
  <Pie data={data}>
    <Cell fill="hsl(160 84% 39%)" /> {/* Emerald */}
    <Cell fill="hsl(43 96% 56%)" />  {/* Amber */}
  </Pie>
</PieChart>
```

### Buttons with Theme Colors

```tsx
{/* Primary action - Emerald */}
<Button className="bg-emerald-600 hover:bg-emerald-700">
  Add Contribution
</Button>

{/* Warning action - Amber */}
<Button className="bg-amber-500 hover:bg-amber-600">
  Review Credit
</Button>

{/* Destructive - Red */}
<Button variant="destructive">
  Delete Member
</Button>
```

---

## 🌓 Dark Mode Support

All theme colors are optimized for both light and dark modes:

```tsx
{/* Automatically adapts to theme */}
<div className="bg-background text-foreground">
  <Card className="glass-card">
    <div className="text-emerald-700 dark:text-emerald-300">
      Adapts to dark mode
    </div>
  </Card>
</div>
```

---

## 🚀 Quick Start Checklist

- ✅ **Font**: Plus Jakarta Sans loaded automatically
- ✅ **Colors**: Navy/Emerald/Amber palette configured
- ✅ **Glassmorphism**: `.glass`, `.glass-card`, `.glass-strong` available
- ✅ **Radius**: Softer 0.75rem borders applied globally
- ✅ **Utilities**: `.text-success`, `.text-alert`, `.text-navy` ready
- ✅ **Dark Mode**: All colors optimized for light/dark themes

---

## 📝 Best Practices

1. **Use glassmorphism for data cards**: Creates depth and modern feel
2. **Emerald for positive metrics**: Contributions, growth, success states
3. **Amber for attention items**: Credits, warnings, important notices
4. **Navy for structure**: Headers, sidebars, navigation
5. **Combine glass + colored borders**: Visual hierarchy on dashboard
6. **Consistent font weights**: Medium for labels, Bold for numbers
7. **Respect dark mode**: Test all components in both themes

---

## 🎯 Component Examples

Check these files for implementation examples:
- `src/pages/Dashboard.tsx` - Glassmorphism cards with color accents
- `src/index.css` - Theme variables and utility classes
- `tailwind.config.js` - Color palette and font configuration

---

**Enjoy your Modern Finance theme! 🎨💼**
