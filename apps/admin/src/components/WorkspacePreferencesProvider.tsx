import type { AdminWorkspacePreferences } from '@dashboard-link/shared'
import {
  createAdminWorkspacePreferences,
  defaultAdminWorkspacePreferences,
  parseAdminWorkspacePreferences,
} from '@dashboard-link/shared'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { isPreviewMode } from '../lib/preview'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'

const WORKSPACE_PREFERENCES_CACHE_KEY = 'admin-workspace-preferences'

type WorkspaceLaunchSource = 'required' | 'settings'
type CachedWorkspacePreferences = {
  preferences: AdminWorkspacePreferences
  userId: string
}

interface WorkspacePreferencesContextValue {
  preferences: AdminWorkspacePreferences
  isSaving: boolean
  isOnboardingOpen: boolean
  onboardingSource: WorkspaceLaunchSource
  isOnboardingRequired: boolean
  openOnboarding: (source?: WorkspaceLaunchSource) => void
  closeOnboarding: () => void
  savePreferences: (preferences: AdminWorkspacePreferences) => Promise<AdminWorkspacePreferences>
  updatePreferences: (
    updates: Partial<AdminWorkspacePreferences>
  ) => Promise<AdminWorkspacePreferences>
  skipOnboarding: () => Promise<AdminWorkspacePreferences>
  resetPreferences: () => Promise<AdminWorkspacePreferences>
}

const WorkspacePreferencesContext = createContext<WorkspacePreferencesContextValue | undefined>(
  undefined
)

function readCachedWorkspacePreferences() {
  if (typeof window === 'undefined') {
    return undefined
  }

  try {
    const rawValue = localStorage.getItem(WORKSPACE_PREFERENCES_CACHE_KEY)
    if (!rawValue) {
      return undefined
    }

    const parsedCache = JSON.parse(rawValue) as CachedWorkspacePreferences
    const parsedPreferences = parseAdminWorkspacePreferences(parsedCache.preferences)

    if (!parsedPreferences || !parsedCache.userId) {
      return undefined
    }

    return {
      preferences: createAdminWorkspacePreferences(parsedPreferences),
      userId: parsedCache.userId,
    }
  } catch {
    return undefined
  }
}

function writeCachedWorkspacePreferences(preferences: AdminWorkspacePreferences, userId: string) {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(
    WORKSPACE_PREFERENCES_CACHE_KEY,
    JSON.stringify({
      preferences,
      userId,
    } satisfies CachedWorkspacePreferences)
  )
}

function applyWorkspaceTheme(
  preferences: AdminWorkspacePreferences,
  systemTheme: 'light' | 'dark'
) {
  const resolvedTheme = preferences.theme.mode === 'system' ? systemTheme : preferences.theme.mode
  const root = document.documentElement

  root.dataset.theme = resolvedTheme
  root.dataset.themePreference = preferences.theme.mode
  root.dataset.accent = preferences.theme.accent
  root.dataset.density =
    preferences.density || defaultAdminWorkspacePreferences.density || 'comfortable'
  root.dataset.dashboardPreset =
    preferences.dashboardStylePreset || defaultAdminWorkspacePreferences.dashboardStylePreset
  root.dataset.visualizationIntensity =
    preferences.dashboardVisualizationIntensity ||
    defaultAdminWorkspacePreferences.dashboardVisualizationIntensity
  root.dataset.dashboardSecondaryMetrics = String(
    preferences.showDashboardSecondaryMetrics ??
      defaultAdminWorkspacePreferences.showDashboardSecondaryMetrics
  )
  root.classList.toggle('dark', resolvedTheme === 'dark')
}

export function WorkspacePreferencesProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const setWorkspacePreferences = useAuthStore((state) => state.setWorkspacePreferences)
  const [cachedPreferences, setCachedPreferences] = useState<
    CachedWorkspacePreferences | undefined
  >(() => readCachedWorkspacePreferences())
  const [isSaving, setIsSaving] = useState(false)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [onboardingSource, setOnboardingSource] = useState<WorkspaceLaunchSource>('required')
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const matchingCachedPreferences =
    cachedPreferences?.userId === user?.id ? cachedPreferences?.preferences : undefined
  const preferences =
    user?.workspace_preferences || matchingCachedPreferences || createAdminWorkspacePreferences()

  const isOnboardingRequired = Boolean(user && !preferences.completedAt && !preferences.skippedAt)

  useEffect(() => {
    if (!user?.workspace_preferences) {
      return
    }

    setCachedPreferences({
      preferences: user.workspace_preferences,
      userId: user.id,
    })
    writeCachedWorkspacePreferences(user.workspace_preferences, user.id)
  }, [user?.id, user?.workspace_preferences])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    applyWorkspaceTheme(preferences, systemTheme)
  }, [preferences, systemTheme])

  useEffect(() => {
    if (!user) {
      setIsOnboardingOpen(false)
      return
    }

    if (isOnboardingRequired) {
      setOnboardingSource('required')
      setIsOnboardingOpen(true)
    }
  }, [isOnboardingRequired, user])

  const applySavedPreferences = (savedPreferences: AdminWorkspacePreferences) => {
    setWorkspacePreferences(savedPreferences)

    if (user?.id) {
      setCachedPreferences({
        preferences: savedPreferences,
        userId: user.id,
      })
      writeCachedWorkspacePreferences(savedPreferences, user.id)
    }

    setIsOnboardingOpen(false)
  }

  const savePreferences = async (nextPreferences: AdminWorkspacePreferences) => {
    setIsSaving(true)

    try {
      if (isPreviewMode()) {
        applySavedPreferences(nextPreferences)
        return nextPreferences
      }

      const { data, error } = await supabase.auth.updateUser({
        data: {
          workspace_preferences: nextPreferences,
        },
      })

      if (error) {
        throw error
      }

      const savedPreferences =
        parseAdminWorkspacePreferences(data.user?.user_metadata?.workspace_preferences) ||
        nextPreferences

      applySavedPreferences(savedPreferences)

      return savedPreferences
    } finally {
      setIsSaving(false)
    }
  }

  const updatePreferences = async (updates: Partial<AdminWorkspacePreferences>) => {
    return savePreferences(
      createAdminWorkspacePreferences({
        ...preferences,
        ...updates,
        theme: {
          ...preferences.theme,
          ...updates.theme,
        },
      })
    )
  }

  const skipOnboarding = async () => {
    return savePreferences(
      createAdminWorkspacePreferences({
        ...preferences,
        skippedAt: new Date().toISOString(),
        completedAt: undefined,
      })
    )
  }

  const resetPreferences = async () => {
    return savePreferences(
      createAdminWorkspacePreferences({
        ...defaultAdminWorkspacePreferences,
        completedAt: new Date().toISOString(),
      })
    )
  }

  return (
    <WorkspacePreferencesContext.Provider
      value={{
        preferences,
        isSaving,
        isOnboardingOpen,
        onboardingSource,
        isOnboardingRequired,
        openOnboarding: (source = 'settings') => {
          setOnboardingSource(source)
          setIsOnboardingOpen(true)
        },
        closeOnboarding: () => setIsOnboardingOpen(false),
        savePreferences,
        updatePreferences,
        skipOnboarding,
        resetPreferences,
      }}
    >
      {children}
    </WorkspacePreferencesContext.Provider>
  )
}

export function useWorkspacePreferences() {
  const context = useContext(WorkspacePreferencesContext)
  if (!context) {
    throw new Error('useWorkspacePreferences must be used within WorkspacePreferencesProvider')
  }

  return context
}
