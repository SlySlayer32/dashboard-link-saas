// Plugin system exports - NEW Zapier-style architecture
export { GoogleCalendarAdapter } from './adapters/GoogleCalendarAdapter';
export { ManualAdapter } from './adapters/ManualAdapter';
export { BasePluginAdapter } from './base/BasePluginAdapter';
export { PluginManagerImpl, pluginManager } from './manager/PluginManager';
export { PluginRegistryImpl, pluginRegistry } from './registry/PluginRegistry';

// Re-export types from shared package for convenience
export type {
    PluginAdapter, PluginBatchResult, PluginConfig,
    PluginConfigSchema, PluginError, PluginExecutionResult, PluginHealthResult, PluginManager, PluginMetadata, PluginRegistry, PluginResponse, PluginValidationResult, StandardScheduleItem,
    StandardTaskItem
} from '@dashboard-link/shared';

