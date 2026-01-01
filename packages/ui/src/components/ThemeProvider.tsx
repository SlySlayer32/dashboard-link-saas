/**
 * Theme provider for dark mode support
 * Implements Zapier-style theme switching with CSS custom properties
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ThemeMode, cssVars, isDarkMode } from '../tokens'

interface ThemeContextType {
  theme: ThemeMode
  toggleTheme: () => void
  setTheme: (theme: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: ThemeMode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'light' 
}) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    // Check for saved theme or system preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as ThemeMode
      if (saved) return saved
      return isDarkMode() ? 'dark' : 'light'
    }
    return defaultTheme
  })

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme)
    }
  }

  useEffect(() => {
    // Apply CSS custom properties
    const root = document.documentElement
    const vars = cssVars[theme]
    
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
    
    // Update data attribute for CSS targeting
    root.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
