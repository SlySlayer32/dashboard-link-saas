// Plugin system exports - NEW Zapier-style architecture
// TODO(google-calendar): There are two Google Calendar adapters with conflicting auth strategies:
// - OAuth Bearer access token (packages/plugins/src/google-calendar/index.ts)
// - API key (packages/plugins/src/adapters/GoogleCalendarAdapter.ts)
// Pick one (OAuth is required for private/primary calendars), remove the other, and align env/docs/tests.
export { GoogleCalendarAdapter } from './adapters/GoogleCalendarAdapter'
export { ManualAdapter } from './adapters/ManualAdapter'
export { BasePluginAdapter } from './base/BasePluginAdapter'
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
