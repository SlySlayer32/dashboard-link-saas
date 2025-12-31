import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DashboardLayout, OnboardingState, Plugin } from '../types/onboarding'

// Mock plugins data
const mockPlugins: Plugin[] = [
  {
    id: 'airbnb',
    name: 'Airbnb',
    description: 'Manage your Airbnb properties, bookings, and guest communications',
    category: 'property-management',
    icon: '🏠',
    connected: false,
    features: ['Property listings', 'Booking management', 'Guest messaging', 'Calendar sync'],
    setupRequired: true,
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync your schedule and manage appointments',
    category: 'calendar',
    icon: '📅',
    connected: false,
    features: ['Event synchronization', 'Schedule management', 'Meeting reminders'],
    setupRequired: true,
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Connect your workspace and databases',
    category: 'data',
    icon: '📝',
    connected: false,
    features: ['Database sync', 'Page management', 'Task tracking'],
    setupRequired: true,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication and notifications',
    category: 'communication',
    icon: '💬',
    connected: false,
    features: ['Channel integration', 'Message notifications', 'Team updates'],
    setupRequired: true,
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automate workflows between your favorite apps',
    category: 'automation',
    icon: '⚡',
    connected: false,
    features: ['Workflow automation', 'App integrations', 'Custom triggers'],
    setupRequired: true,
  },
]

interface OnboardingStore extends OnboardingState {
  plugins: Plugin[]
  setStep: (step: OnboardingState['step']) => void
  selectPlugin: (pluginId: string) => void
  deselectPlugin: (pluginId: string) => void
  connectPlugin: (pluginId: string) => void
  disconnectPlugin: (pluginId: string) => void
  updateDashboardLayout: (layout: DashboardLayout[]) => void
  completeOnboarding: () => void
  resetOnboarding: () => void
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      step: 'welcome',
      selectedPlugins: [],
      connectedPlugins: [],
      dashboardLayout: [],
      isCompleted: false,
      plugins: mockPlugins,

      // Actions
      setStep: (step) => set({ step }),

      selectPlugin: (pluginId) => {
        const selectedPlugins = [...get().selectedPlugins, pluginId]
        set({ selectedPlugins })
      },

      deselectPlugin: (pluginId) => {
        const selectedPlugins = get().selectedPlugins.filter(id => id !== pluginId)
        set({ selectedPlugins })
      },

      connectPlugin: (pluginId) => {
        const plugins = get().plugins.map(p => 
          p.id === pluginId ? { ...p, connected: true } : p
        )
        const connectedPlugins = [...get().connectedPlugins, pluginId]
        set({ plugins, connectedPlugins })
      },

      disconnectPlugin: (pluginId) => {
        const plugins = get().plugins.map(p => 
          p.id === pluginId ? { ...p, connected: false } : p
        )
        const connectedPlugins = get().connectedPlugins.filter(id => id !== pluginId)
        set({ plugins, connectedPlugins })
      },

      updateDashboardLayout: (dashboardLayout) => set({ dashboardLayout }),

      completeOnboarding: () => set({ isCompleted: true, step: 'complete' }),

      resetOnboarding: () => set({
        step: 'welcome',
        selectedPlugins: [],
        connectedPlugins: [],
        dashboardLayout: [],
        isCompleted: false,
      }),
    }),
    {
      name: 'onboarding-storage',
      partialize: (state) => ({
        step: state.step,
        selectedPlugins: state.selectedPlugins,
        connectedPlugins: state.connectedPlugins,
        dashboardLayout: state.dashboardLayout,
        isCompleted: state.isCompleted,
      }),
    }
  )
)
