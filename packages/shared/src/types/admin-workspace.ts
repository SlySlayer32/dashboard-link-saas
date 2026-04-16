import { z } from 'zod'

export const adminWorkspaceNavItemIds = [
  'dashboard',
  'workers',
  'manual-data',
  'tokens',
  'sms-logs',
  'plugins',
] as const

export const adminWorkspaceRouteMap = {
  dashboard: '/',
  workers: '/workers',
  'manual-data': '/manual-data',
  tokens: '/tokens',
  'sms-logs': '/sms-logs',
  plugins: '/plugins',
  settings: '/settings',
} as const

export const adminDashboardSectionIds = [
  'follow-up-needed',
  'quick-actions',
  'statistics',
  'recent-activity',
  'workflow-guide',
] as const

export const workspaceThemeModes = ['light', 'dark', 'system'] as const
export const workspaceThemeAccents = ['blue', 'emerald', 'slate'] as const
export const workspaceDensityModes = ['comfortable', 'compact'] as const
export const dashboardStylePresets = [
  'operations-clarity',
  'dark-saas',
  'healthcare-clean',
] as const
export const dashboardVisualizationIntensityLevels = ['minimal', 'balanced', 'bold'] as const

export const AdminWorkspaceNavItemIdSchema = z.enum(adminWorkspaceNavItemIds)
export const AdminWorkspaceRouteSchema = z.enum([
  adminWorkspaceRouteMap.dashboard,
  adminWorkspaceRouteMap.workers,
  adminWorkspaceRouteMap['manual-data'],
  adminWorkspaceRouteMap.tokens,
  adminWorkspaceRouteMap['sms-logs'],
  adminWorkspaceRouteMap.plugins,
  adminWorkspaceRouteMap.settings,
])
export const AdminDashboardSectionIdSchema = z.enum(adminDashboardSectionIds)
export const WorkspaceThemeModeSchema = z.enum(workspaceThemeModes)
export const WorkspaceThemeAccentSchema = z.enum(workspaceThemeAccents)
export const WorkspaceDensityModeSchema = z.enum(workspaceDensityModes)
export const DashboardStylePresetSchema = z.enum(dashboardStylePresets)
export const DashboardVisualizationIntensitySchema = z.enum(dashboardVisualizationIntensityLevels)

export const WorkspaceThemeSchema = z.object({
  mode: WorkspaceThemeModeSchema,
  accent: WorkspaceThemeAccentSchema,
})

export const AdminWorkspacePreferencesSchema = z.object({
  version: z.literal(1),
  completedAt: z.string().datetime({ offset: true }).optional(),
  skippedAt: z.string().datetime({ offset: true }).optional(),
  defaultRoute: AdminWorkspaceRouteSchema,
  visibleNavItems: z.array(AdminWorkspaceNavItemIdSchema).min(1),
  dashboardSections: z.array(AdminDashboardSectionIdSchema),
  theme: WorkspaceThemeSchema,
  density: WorkspaceDensityModeSchema.optional(),
  dashboardStylePreset: DashboardStylePresetSchema.optional(),
  dashboardVisualizationIntensity: DashboardVisualizationIntensitySchema.optional(),
  showDashboardSecondaryMetrics: z.boolean().optional(),
})

export type AdminWorkspaceNavItemId = z.infer<typeof AdminWorkspaceNavItemIdSchema>
export type AdminWorkspaceRoute = z.infer<typeof AdminWorkspaceRouteSchema>
export type AdminDashboardSectionId = z.infer<typeof AdminDashboardSectionIdSchema>
export type WorkspaceThemeMode = z.infer<typeof WorkspaceThemeModeSchema>
export type WorkspaceThemeAccent = z.infer<typeof WorkspaceThemeAccentSchema>
export type WorkspaceDensityMode = z.infer<typeof WorkspaceDensityModeSchema>
export type DashboardStylePreset = z.infer<typeof DashboardStylePresetSchema>
export type DashboardVisualizationIntensity = z.infer<typeof DashboardVisualizationIntensitySchema>
export type WorkspaceTheme = z.infer<typeof WorkspaceThemeSchema>
export type AdminWorkspacePreferences = z.infer<typeof AdminWorkspacePreferencesSchema>

export const defaultAdminWorkspacePreferences: AdminWorkspacePreferences = {
  version: 1,
  defaultRoute: adminWorkspaceRouteMap.dashboard,
  visibleNavItems: [...adminWorkspaceNavItemIds],
  dashboardSections: [...adminDashboardSectionIds],
  theme: {
    mode: 'system',
    accent: 'blue',
  },
  density: 'comfortable',
  dashboardStylePreset: 'operations-clarity',
  dashboardVisualizationIntensity: 'balanced',
  showDashboardSecondaryMetrics: true,
}

export function createAdminWorkspacePreferences(
  overrides: Partial<AdminWorkspacePreferences> = {}
): AdminWorkspacePreferences {
  return {
    ...defaultAdminWorkspacePreferences,
    ...overrides,
    theme: {
      ...defaultAdminWorkspacePreferences.theme,
      ...overrides.theme,
    },
    visibleNavItems: overrides.visibleNavItems
      ? [...overrides.visibleNavItems]
      : [...defaultAdminWorkspacePreferences.visibleNavItems],
    dashboardSections: overrides.dashboardSections
      ? [...overrides.dashboardSections]
      : [...defaultAdminWorkspacePreferences.dashboardSections],
  }
}

export function parseAdminWorkspacePreferences(
  value: unknown
): AdminWorkspacePreferences | undefined {
  if (!value) {
    return undefined
  }

  const result = AdminWorkspacePreferencesSchema.safeParse(value)
  return result.success ? result.data : undefined
}

export function getDefaultAdminWorkspaceRoute(
  visibleNavItems: readonly AdminWorkspaceNavItemId[]
): AdminWorkspaceRoute {
  const firstVisibleNavItem = visibleNavItems[0]
  if (!firstVisibleNavItem) {
    return adminWorkspaceRouteMap.dashboard
  }

  return adminWorkspaceRouteMap[firstVisibleNavItem]
}
