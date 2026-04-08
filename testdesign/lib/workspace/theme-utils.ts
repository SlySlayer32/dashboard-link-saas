import type { WorkspaceTheme, BorderRadius, FontFamily } from '@/lib/data/types'

// Convert hex to HSL for CSS variables
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { h: 0, s: 0, l: 0 }

  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

// Generate color variants from a primary color
export function generateColorVariants(hex: string) {
  const hsl = hexToHsl(hex)
  
  return {
    primary: `oklch(0.65 0.2 ${hsl.h})`,
    primaryForeground: hsl.l > 50 ? 'oklch(0.15 0 0)' : 'oklch(1 0 0)',
    accent: `oklch(0.65 0.2 ${hsl.h})`,
    accentForeground: hsl.l > 50 ? 'oklch(0.15 0 0)' : 'oklch(1 0 0)',
    ring: `oklch(0.65 0.2 ${hsl.h})`,
    sidebarPrimary: `oklch(0.65 0.2 ${hsl.h})`,
    sidebarRing: `oklch(0.65 0.2 ${hsl.h})`,
  }
}

// Generate background color variants
export function generateBackgroundVariants(hex: string) {
  const hsl = hexToHsl(hex)
  const isDark = hsl.l < 30
  
  if (isDark) {
    return {
      background: `oklch(${0.1 + hsl.l / 200} 0.005 ${hsl.h})`,
      foreground: 'oklch(0.95 0 0)',
      card: `oklch(${0.14 + hsl.l / 200} 0.005 ${hsl.h})`,
      cardForeground: 'oklch(0.95 0 0)',
      popover: `oklch(${0.14 + hsl.l / 200} 0.005 ${hsl.h})`,
      popoverForeground: 'oklch(0.95 0 0)',
      secondary: `oklch(${0.2 + hsl.l / 200} 0.01 ${hsl.h})`,
      secondaryForeground: 'oklch(0.95 0 0)',
      muted: `oklch(${0.2 + hsl.l / 200} 0.01 ${hsl.h})`,
      mutedForeground: 'oklch(0.65 0.01 260)',
      border: `oklch(${0.24 + hsl.l / 200} 0.01 ${hsl.h})`,
      input: `oklch(${0.2 + hsl.l / 200} 0.01 ${hsl.h})`,
    }
  }
  
  // Light theme (for future use)
  return {
    background: 'oklch(1 0 0)',
    foreground: 'oklch(0.145 0 0)',
    card: 'oklch(1 0 0)',
    cardForeground: 'oklch(0.145 0 0)',
    popover: 'oklch(1 0 0)',
    popoverForeground: 'oklch(0.145 0 0)',
    secondary: 'oklch(0.97 0 0)',
    secondaryForeground: 'oklch(0.205 0 0)',
    muted: 'oklch(0.97 0 0)',
    mutedForeground: 'oklch(0.556 0 0)',
    border: 'oklch(0.922 0 0)',
    input: 'oklch(0.922 0 0)',
  }
}

// Generate sidebar color variants
export function generateSidebarVariants(hex: string, primaryHue: number) {
  const hsl = hexToHsl(hex)
  
  return {
    sidebar: `oklch(${0.08 + hsl.l / 200} 0.005 ${hsl.h})`,
    sidebarForeground: 'oklch(0.95 0 0)',
    sidebarAccent: `oklch(${0.18 + hsl.l / 200} 0.01 ${hsl.h})`,
    sidebarAccentForeground: 'oklch(0.95 0 0)',
    sidebarBorder: `oklch(${0.2 + hsl.l / 200} 0.01 ${hsl.h})`,
  }
}

// Border radius values
const borderRadiusValues: Record<BorderRadius, string> = {
  none: '0',
  small: '0.25rem',
  medium: '0.5rem',
  large: '0.75rem',
}

// Font family CSS values
const fontFamilyValues: Record<FontFamily, string> = {
  inter: "'Inter', 'Geist', system-ui, sans-serif",
  system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  roboto: "'Roboto', 'Geist', system-ui, sans-serif",
  poppins: "'Poppins', 'Geist', system-ui, sans-serif",
}

// Apply theme to document
export function applyTheme(theme: WorkspaceTheme) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const primaryHsl = hexToHsl(theme.primaryColor)
  
  // Apply primary color variants
  const primaryVariants = generateColorVariants(theme.primaryColor)
  root.style.setProperty('--primary', primaryVariants.primary)
  root.style.setProperty('--primary-foreground', primaryVariants.primaryForeground)
  root.style.setProperty('--accent', primaryVariants.accent)
  root.style.setProperty('--accent-foreground', primaryVariants.accentForeground)
  root.style.setProperty('--ring', primaryVariants.ring)
  root.style.setProperty('--sidebar-primary', primaryVariants.sidebarPrimary)
  root.style.setProperty('--sidebar-ring', primaryVariants.sidebarRing)
  
  // Apply background variants
  const bgVariants = generateBackgroundVariants(theme.backgroundColor)
  root.style.setProperty('--background', bgVariants.background)
  root.style.setProperty('--foreground', bgVariants.foreground)
  root.style.setProperty('--card', bgVariants.card)
  root.style.setProperty('--card-foreground', bgVariants.cardForeground)
  root.style.setProperty('--popover', bgVariants.popover)
  root.style.setProperty('--popover-foreground', bgVariants.popoverForeground)
  root.style.setProperty('--secondary', bgVariants.secondary)
  root.style.setProperty('--secondary-foreground', bgVariants.secondaryForeground)
  root.style.setProperty('--muted', bgVariants.muted)
  root.style.setProperty('--muted-foreground', bgVariants.mutedForeground)
  root.style.setProperty('--border', bgVariants.border)
  root.style.setProperty('--input', bgVariants.input)
  
  // Apply sidebar variants
  const sidebarVariants = generateSidebarVariants(theme.sidebarColor, primaryHsl.h)
  root.style.setProperty('--sidebar', sidebarVariants.sidebar)
  root.style.setProperty('--sidebar-foreground', sidebarVariants.sidebarForeground)
  root.style.setProperty('--sidebar-accent', sidebarVariants.sidebarAccent)
  root.style.setProperty('--sidebar-accent-foreground', sidebarVariants.sidebarAccentForeground)
  root.style.setProperty('--sidebar-border', sidebarVariants.sidebarBorder)
  
  // Apply border radius
  root.style.setProperty('--radius', borderRadiusValues[theme.borderRadius])
  
  // Apply font family
  root.style.setProperty('--font-sans', fontFamilyValues[theme.fontFamily])
}

// Reset theme to defaults
export function resetTheme() {
  if (typeof document === 'undefined') return
  
  const root = document.documentElement
  const properties = [
    '--primary', '--primary-foreground', '--accent', '--accent-foreground',
    '--ring', '--sidebar-primary', '--sidebar-ring', '--background', '--foreground',
    '--card', '--card-foreground', '--popover', '--popover-foreground',
    '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
    '--border', '--input', '--sidebar', '--sidebar-foreground', '--sidebar-accent',
    '--sidebar-accent-foreground', '--sidebar-border', '--radius', '--font-sans'
  ]
  
  properties.forEach(prop => root.style.removeProperty(prop))
}

// Predefined color palette for picker
export const colorPalette = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Violet', value: '#8b5cf6' },
]

export const backgroundPalette = [
  { name: 'Midnight', value: '#0f1117' },
  { name: 'Slate', value: '#0f172a' },
  { name: 'Zinc', value: '#18181b' },
  { name: 'Stone', value: '#1c1917' },
  { name: 'Gray', value: '#111827' },
]
