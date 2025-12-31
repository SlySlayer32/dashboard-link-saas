export interface Plugin {
  id: string
  name: string
  description: string
  category: 'property-management' | 'calendar' | 'communication' | 'data' | 'automation'
  icon: string
  connected: boolean
  features: string[]
  setupRequired: boolean
}

export interface OnboardingState {
  step: 'welcome' | 'plugin-selection' | 'dashboard-setup' | 'complete'
  selectedPlugins: string[]
  connectedPlugins: string[]
  dashboardLayout: DashboardLayout[]
  isCompleted: boolean
}

export interface DashboardLayout {
  id: string
  pluginId: string
  widgetType: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  config: Record<string, unknown>
}
