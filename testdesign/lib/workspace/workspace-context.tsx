'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { 
  WorkspaceSettings, 
  WorkspaceTheme, 
  WorkspaceTerminology, 
  WorkspaceBranding,
  DashboardLayout,
  PluginCustomization,
  PluginId,
  IndustryType
} from '@/lib/data/types'
import { createDefaultWorkspaceSettings, pluginBaseInfo } from './defaults'
import { applyTheme } from './theme-utils'

interface WorkspaceContextType {
  settings: WorkspaceSettings
  isLoading: boolean
  
  // Theme
  updateTheme: (theme: Partial<WorkspaceTheme>) => void
  
  // Branding
  updateBranding: (branding: Partial<WorkspaceBranding>) => void
  
  // Terminology
  updateTerminology: (terminology: Partial<WorkspaceTerminology>) => void
  t: (term: keyof WorkspaceTerminology, capitalize?: boolean) => string
  
  // Plugins
  updatePlugin: (pluginId: PluginId, updates: Partial<PluginCustomization>) => void
  getPluginName: (pluginId: PluginId) => string
  getPluginDescription: (pluginId: PluginId) => string
  isPluginEnabled: (pluginId: PluginId) => boolean
  getEnabledPlugins: () => PluginCustomization[]
  
  // Dashboard layout
  updateDashboardLayout: (layout: DashboardLayout) => void
  
  // Full settings
  updateSettings: (settings: Partial<WorkspaceSettings>) => void
  resetSettings: (industry?: IndustryType) => void
  completeOnboarding: () => void
  
  // Persistence
  saveSettings: () => void
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

const STORAGE_KEY = 'workspace_settings'

export function WorkspaceProvider({ 
  children, 
  organizationId 
}: { 
  children: ReactNode
  organizationId?: string 
}) {
  const [settings, setSettings] = useState<WorkspaceSettings>(createDefaultWorkspaceSettings())
  const [isLoading, setIsLoading] = useState(true)

  // Load settings on mount
  useEffect(() => {
    const storageKey = organizationId ? `${STORAGE_KEY}_${organizationId}` : STORAGE_KEY
    const stored = localStorage.getItem(storageKey)
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as WorkspaceSettings
        setSettings(parsed)
        applyTheme(parsed.theme)
      } catch {
        // Invalid stored settings, use defaults
      }
    }
    
    setIsLoading(false)
  }, [organizationId])

  // Apply theme whenever it changes
  useEffect(() => {
    if (!isLoading) {
      applyTheme(settings.theme)
    }
  }, [settings.theme, isLoading])

  // Save settings to localStorage
  const saveSettings = useCallback(() => {
    const storageKey = organizationId ? `${STORAGE_KEY}_${organizationId}` : STORAGE_KEY
    localStorage.setItem(storageKey, JSON.stringify(settings))
  }, [settings, organizationId])

  // Auto-save on settings change
  useEffect(() => {
    if (!isLoading) {
      saveSettings()
    }
  }, [settings, isLoading, saveSettings])

  // Theme updates
  const updateTheme = useCallback((theme: Partial<WorkspaceTheme>) => {
    setSettings(prev => ({
      ...prev,
      theme: { ...prev.theme, ...theme }
    }))
  }, [])

  // Branding updates
  const updateBranding = useCallback((branding: Partial<WorkspaceBranding>) => {
    setSettings(prev => ({
      ...prev,
      branding: { ...prev.branding, ...branding }
    }))
  }, [])

  // Terminology updates
  const updateTerminology = useCallback((terminology: Partial<WorkspaceTerminology>) => {
    setSettings(prev => ({
      ...prev,
      terminology: { ...prev.terminology, ...terminology }
    }))
  }, [])

  // Get terminology with optional capitalization
  const t = useCallback((term: keyof WorkspaceTerminology, capitalize = false): string => {
    const value = settings.terminology[term]
    if (capitalize && value) {
      return value.charAt(0).toUpperCase() + value.slice(1)
    }
    return value
  }, [settings.terminology])

  // Plugin updates
  const updatePlugin = useCallback((pluginId: PluginId, updates: Partial<PluginCustomization>) => {
    setSettings(prev => ({
      ...prev,
      plugins: prev.plugins.map(p => 
        p.pluginId === pluginId ? { ...p, ...updates } : p
      )
    }))
  }, [])

  const getPluginName = useCallback((pluginId: PluginId): string => {
    const plugin = settings.plugins.find(p => p.pluginId === pluginId)
    return plugin?.customName || pluginBaseInfo[pluginId]?.defaultName || pluginId
  }, [settings.plugins])

  const getPluginDescription = useCallback((pluginId: PluginId): string => {
    const plugin = settings.plugins.find(p => p.pluginId === pluginId)
    return plugin?.customDescription || pluginBaseInfo[pluginId]?.defaultDescription || ''
  }, [settings.plugins])

  const isPluginEnabled = useCallback((pluginId: PluginId): boolean => {
    const plugin = settings.plugins.find(p => p.pluginId === pluginId)
    return plugin?.enabled ?? false
  }, [settings.plugins])

  const getEnabledPlugins = useCallback((): PluginCustomization[] => {
    return settings.plugins.filter(p => p.enabled)
  }, [settings.plugins])

  // Dashboard layout updates
  const updateDashboardLayout = useCallback((layout: DashboardLayout) => {
    setSettings(prev => ({
      ...prev,
      dashboardLayout: layout
    }))
  }, [])

  // Full settings update
  const updateSettings = useCallback((newSettings: Partial<WorkspaceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  // Reset settings
  const resetSettings = useCallback((industry: IndustryType = 'other') => {
    const defaults = createDefaultWorkspaceSettings(industry)
    setSettings(defaults)
    applyTheme(defaults.theme)
  }, [])

  // Complete onboarding
  const completeOnboarding = useCallback(() => {
    setSettings(prev => ({ ...prev, onboardingCompleted: true }))
  }, [])

  return (
    <WorkspaceContext.Provider
      value={{
        settings,
        isLoading,
        updateTheme,
        updateBranding,
        updateTerminology,
        t,
        updatePlugin,
        getPluginName,
        getPluginDescription,
        isPluginEnabled,
        getEnabledPlugins,
        updateDashboardLayout,
        updateSettings,
        resetSettings,
        completeOnboarding,
        saveSettings,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}

// Convenience hooks
export function useTheme() {
  const { settings, updateTheme } = useWorkspace()
  return { theme: settings.theme, updateTheme }
}

export function useTerminology() {
  const { settings, t, updateTerminology } = useWorkspace()
  return { terminology: settings.terminology, t, updateTerminology }
}

export function useBranding() {
  const { settings, updateBranding } = useWorkspace()
  return { branding: settings.branding, updateBranding }
}

export function usePlugins() {
  const { 
    settings, 
    updatePlugin, 
    getPluginName, 
    getPluginDescription, 
    isPluginEnabled,
    getEnabledPlugins 
  } = useWorkspace()
  return { 
    plugins: settings.plugins, 
    updatePlugin, 
    getPluginName, 
    getPluginDescription,
    isPluginEnabled,
    getEnabledPlugins
  }
}

export function useDashboardLayout() {
  const { settings, updateDashboardLayout } = useWorkspace()
  return { layout: settings.dashboardLayout, updateDashboardLayout }
}
