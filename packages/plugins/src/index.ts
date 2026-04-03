// Plugin system exports - NEW Zapier-style architecture
// Google Calendar uses OAuth Bearer tokens (required for private/primary calendars)
export { ManualAdapter } from './adapters/ManualAdapter'
export { BasePluginAdapter } from './base/BasePluginAdapter'
export { GoogleCalendarAdapter } from './google-calendar'
export { PluginManagerImpl, pluginManager } from './manager/PluginManager'
export { PluginService, pluginService } from './manager/PluginService'
export { PluginRegistryImpl, pluginRegistry } from './registry/PluginRegistry'

export * from './contracts'

// Re-export types from shared package for convenience
export type {
  PluginAdapter,
  PluginBatchResult,
  PluginConfig,
  PluginConfigSchema,
  PluginError,
  PluginExecutionResult,
  PluginHealthResult,
  PluginManager,
  PluginMetadata,
  PluginRegistry,
  PluginResponse,
  PluginValidationResult,
  StandardScheduleItem,
  StandardTaskItem,
} from '@dashboard-link/shared'
