/**
 * Zapier-inspired design tokens
 * Minimalist, professional, workflow-first design system
 */

export const tokens = {
  colors: {
    // Brand colors (neutral, professional)
    brand: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    
    // Primary blue (professional, calm)
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    
    // Semantic colors (clear status communication)
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    
    // Surface colors (clean, minimal)
    surface: {
      background: '#ffffff',
      foreground: '#0f172a',
      muted: '#f8fafc',
      border: '#e2e8f0',
    },
    
    // Dark mode support
    dark: {
      background: '#0f172a',
      foreground: '#f8fafc',
      muted: '#1e293b',
      border: '#334155',
    }
  },
  
  spacing: {
    // Consistent spacing scale (8px base)
    0: '0',
    px: '1px',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },
  
  typography: {
    // Clean, readable typography
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
    },
    
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],    // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],  // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],   // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  borderRadius: {
    // Consistent, subtle border radius
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    full: '9999px',
  },
  
  shadows: {
    // Subtle, professional shadows
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  animation: {
    // Minimal, functional animations
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  // Zapier-style component states
  states: {
    hover: {
      background: '#f8fafc',
      border: '#cbd5e1',
    },
    focus: {
      ring: '0 0 0 2px #3b82f6',
      border: '#3b82f6',
    },
    active: {
      background: '#f1f5f9',
      border: '#94a3b8',
    },
    disabled: {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  },
  
  // Dark mode states
  darkStates: {
    hover: {
      background: '#1e293b',
      border: '#475569',
    },
    focus: {
      ring: '0 0 0 2px #3b82f6',
      border: '#3b82f6',
    },
    active: {
      background: '#334155',
      border: '#64748b',
    },
    disabled: {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  }
}

// Helper functions for accessing tokens
export const color = (path: string) => {
  const keys = path.split('.')
  let value: unknown = tokens.colors
  
  for (const key of keys) {
    value = (value as Record<string, unknown>)[key]
    if (!value) return path
  }
  
  return value as string
}

export const spacing = (key: keyof typeof tokens.spacing) => tokens.spacing[key]
export const borderRadius = (key: keyof typeof tokens.borderRadius) => tokens.borderRadius[key]
export const shadow = (key: keyof typeof tokens.shadows) => tokens.shadows[key]

// Dark mode helpers
export const isDarkMode = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return false
}

export const getThemeColors = (dark = false) => {
  return dark ? tokens.colors.dark : tokens.colors.surface
}

// CSS custom properties for theme switching
export const cssVars = {
  light: {
    '--color-background': tokens.colors.surface.background,
    '--color-foreground': tokens.colors.surface.foreground,
    '--color-muted': tokens.colors.surface.muted,
    '--color-border': tokens.colors.surface.border,
  },
  dark: {
    '--color-background': tokens.colors.dark.background,
    '--color-foreground': tokens.colors.dark.foreground,
    '--color-muted': tokens.colors.dark.muted,
    '--color-border': tokens.colors.dark.border,
  }
}

// Type-safe theme utilities
export type ThemeMode = 'light' | 'dark'
export type ColorPath = `brand.${50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900}` | 
                       `primary.${50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900}` | 
                       `semantic.${'success' | 'warning' | 'error' | 'info'}` | 
                       `surface.${'background' | 'foreground' | 'muted' | 'border'}` | 
                       `dark.${'background' | 'foreground' | 'muted' | 'border'}`

export type SpacingKey = keyof typeof tokens.spacing
export type BorderRadiusKey = keyof typeof tokens.borderRadius
export type ShadowKey = keyof typeof tokens.shadows
