import type {
  AdminDashboardSectionId,
  AdminWorkspaceNavItemId,
  AdminWorkspacePreferences,
  AdminWorkspaceRoute,
  DashboardStylePreset,
  DashboardVisualizationIntensity,
  WorkspaceThemeAccent,
  WorkspaceThemeMode,
} from '@dashboard-link/shared'
import {
  adminDashboardSectionIds,
  adminWorkspaceRouteMap,
  getDefaultAdminWorkspaceRoute,
} from '@dashboard-link/shared'

export interface WorkspaceModuleDefinition {
  id: AdminWorkspaceNavItemId
  label: string
  shortLabel: string
  description: string
  route: AdminWorkspaceRoute
}

export interface DashboardSectionDefinition {
  id: AdminDashboardSectionId
  label: string
  description: string
}

export const workspaceModuleDefinitions: WorkspaceModuleDefinition[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'Dashboard',
    description: 'A single overview for worker delivery, progress, and next actions.',
    route: adminWorkspaceRouteMap.dashboard,
  },
  {
    id: 'workers',
    label: 'Workers',
    shortLabel: 'Workers',
    description: 'Manage staff records, worker status, and individual delivery history.',
    route: adminWorkspaceRouteMap.workers,
  },
  {
    id: 'manual-data',
    label: 'Scheduling',
    shortLabel: 'Scheduling',
    description:
      'Plan schedules and tasks in an operational workspace when no integration is connected.',
    route: adminWorkspaceRouteMap['manual-data'],
  },
  {
    id: 'tokens',
    label: 'Tokens',
    shortLabel: 'Tokens',
    description: 'Review dashboard link tokens and manage expiry or revocation.',
    route: adminWorkspaceRouteMap.tokens,
  },
  {
    id: 'sms-logs',
    label: 'SMS Logs',
    shortLabel: 'SMS Logs',
    description: 'Track message delivery and confirm which workers received links.',
    route: adminWorkspaceRouteMap['sms-logs'],
  },
  {
    id: 'plugins',
    label: 'Integrations',
    shortLabel: 'Plugins',
    description: 'Connect external tools and manage data source configuration.',
    route: adminWorkspaceRouteMap.plugins,
  },
]

export const dashboardSectionDefinitions: DashboardSectionDefinition[] = [
  {
    id: 'follow-up-needed',
    label: 'Follow-up needed',
    description: 'Workers who still have not opened their dashboard link.',
  },
  {
    id: 'quick-actions',
    label: 'Quick actions',
    description: 'Shortcut buttons for the most common operational tasks.',
  },
  {
    id: 'statistics',
    label: 'Operations KPIs',
    description: 'Top-line delivery, worker, and dashboard-open metrics.',
  },
  {
    id: 'recent-activity',
    label: 'Recent activity',
    description: 'Latest SMS and dashboard-open events.',
  },
  {
    id: 'workflow-guide',
    label: 'Workflow guide',
    description: 'Operational reminders and shortcuts for the current workflow.',
  },
]

export const workspaceAccentOptions: Array<{
  value: WorkspaceThemeAccent
  label: string
  description: string
}> = [
  { value: 'blue', label: 'Blue', description: 'Clean and operational.' },
  { value: 'emerald', label: 'Emerald', description: 'Fresh and more energetic.' },
  { value: 'slate', label: 'Slate', description: 'Minimal and understated.' },
]

export const workspaceThemeModeOptions: Array<{
  value: WorkspaceThemeMode
  label: string
  description: string
}> = [
  { value: 'system', label: 'System', description: 'Match the device theme automatically.' },
  { value: 'light', label: 'Light', description: 'Bright workspace for daytime use.' },
  { value: 'dark', label: 'Dark', description: 'Lower-glare workspace for longer sessions.' },
]

export const workspaceDensityOptions = [
  {
    value: 'comfortable' as const,
    label: 'Comfortable',
    description: 'More breathing room between cards and sections.',
  },
  {
    value: 'compact' as const,
    label: 'Compact',
    description: 'Tighter spacing to fit more on screen.',
  },
]

export const dashboardStylePresetOptions: Array<{
  value: DashboardStylePreset
  label: string
  description: string
}> = [
  {
    value: 'operations-clarity',
    label: 'Operations Clarity',
    description: 'Light-first, fast-scan dashboard for delivery health and follow-up.',
  },
  {
    value: 'dark-saas',
    label: 'Dark SaaS',
    description: 'Future-ready darker presentation for later expansion.',
  },
  {
    value: 'healthcare-clean',
    label: 'Healthcare Clean',
    description: 'Future-ready calmer operational presentation for later expansion.',
  },
]

export const dashboardVisualizationIntensityOptions: Array<{
  value: DashboardVisualizationIntensity
  label: string
  description: string
}> = [
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Less emphasis and fewer supporting details.',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Default operational hierarchy with readable supporting context.',
  },
  {
    value: 'bold',
    label: 'Bold',
    description: 'Higher emphasis on status color, cards, and alerts.',
  },
]

export function getWorkspaceModuleDefinition(moduleId: AdminWorkspaceNavItemId) {
  return workspaceModuleDefinitions.find((module) => module.id === moduleId)
}

export function getDashboardSectionDefinition(sectionId: AdminDashboardSectionId) {
  return dashboardSectionDefinitions.find((section) => section.id === sectionId)
}

export function getVisibleWorkspaceModules(preferences: AdminWorkspacePreferences) {
  return preferences.visibleNavItems
    .map((moduleId) => getWorkspaceModuleDefinition(moduleId))
    .filter((module): module is WorkspaceModuleDefinition => Boolean(module))
}

export function getOrderedDashboardSections(preferences: AdminWorkspacePreferences) {
  return preferences.dashboardSections
    .map((sectionId) => getDashboardSectionDefinition(sectionId))
    .filter((section): section is DashboardSectionDefinition => Boolean(section))
}

export function ensureValidWorkspaceDefaultRoute(
  visibleNavItems: readonly AdminWorkspaceNavItemId[],
  route: AdminWorkspaceRoute
): AdminWorkspaceRoute {
  const allowedRoutes = new Set<AdminWorkspaceRoute>(
    visibleNavItems.map((itemId) => adminWorkspaceRouteMap[itemId])
  )
  if (allowedRoutes.has(route)) {
    return route
  }

  return getDefaultAdminWorkspaceRoute(visibleNavItems)
}

export function getNextStepActions(preferences: AdminWorkspacePreferences) {
  const candidateActions = [
    {
      id: 'workers',
      title: 'Add workers',
      description: 'Build your roster so links can be delivered to the right people.',
      route: adminWorkspaceRouteMap.workers,
    },
    {
      id: 'manual-data',
      title: 'Plan scheduling',
      description: 'Add schedules and tasks when you are not syncing from another system yet.',
      route: adminWorkspaceRouteMap['manual-data'],
    },
    {
      id: 'plugins',
      title: 'Connect integrations',
      description: 'Link calendar and data tools when you are ready to automate setup.',
      route: adminWorkspaceRouteMap.plugins,
    },
  ] as const

  return candidateActions.filter((action) => preferences.visibleNavItems.includes(action.id))
}

export function moveItemInList<T>(items: T[], currentIndex: number, direction: -1 | 1) {
  const nextIndex = currentIndex + direction
  if (nextIndex < 0 || nextIndex >= items.length) {
    return items
  }

  const reordered = [...items]
  ;[reordered[currentIndex], reordered[nextIndex]] = [reordered[nextIndex], reordered[currentIndex]]
  return reordered
}

export const allDashboardSectionIds = [...adminDashboardSectionIds]
