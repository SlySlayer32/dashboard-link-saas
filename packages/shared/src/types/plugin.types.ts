// Standard data contracts for the CleanConnect plugin system
// These interfaces define the stable contract between the core system and plugins

export interface PluginResponse<T> {
  success: boolean;
  data: T[];
  errors?: PluginError[];
  metadata: PluginMetadata;
}

export interface PluginError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable?: boolean;
}

// Standard data shapes - these NEVER change
export interface StandardScheduleItem {
  id: string;
  title: string;
  startTime: string; // ISO 8601 format
  endTime: string;   // ISO 8601 format
  location?: string;
  description?: string;
  metadata: Record<string, unknown>; // Plugin-specific data
  priority?: 'low' | 'medium' | 'high';
  status?: 'scheduled' | 'cancelled' | 'completed';
}

export interface StandardTaskItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string; // ISO 8601 format
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignee?: string;
  metadata: Record<string, unknown>; // Plugin-specific data
  tags?: string[];
  estimatedTime?: number; // in minutes
}

// Plugin configuration interface
export interface PluginConfig {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  settings: Record<string, unknown>;
  credentials?: Record<string, unknown>; // Encrypted in storage
}

export interface PluginMetadata {
  source: string;
  timestamp: string;
  version: string;
  totalItems?: number;
  processingTime?: number;
}

// Plugin interface that all adapters must implement
export interface PluginAdapter {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  
  // Core data fetching methods
  getTodaySchedule(workerId: string, config: PluginConfig): Promise<PluginResponse<StandardScheduleItem>>;
  getTodayTasks(workerId: string, config: PluginConfig): Promise<PluginResponse<StandardTaskItem>>;
  
  // Configuration and validation
  validateConfig(config: PluginConfig): Promise<PluginValidationResult>;
  getConfigSchema(): PluginConfigSchema;
  
  // Optional webhook support
  handleWebhook?(payload: unknown, config: PluginConfig): Promise<PluginResponse<null>>;
  
  // Health check
  healthCheck?(config: PluginConfig): Promise<PluginHealthResult>;
}

// Plugin registry interface
export interface PluginRegistry {
  register(plugin: PluginAdapter): void;
  unregister(pluginId: string): void;
  get(pluginId: string): PluginAdapter | undefined;
  getAll(): PluginAdapter[];
  getEnabled(): PluginAdapter[];
}

export interface PluginValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface PluginConfigSchema {
  type: 'object';
  properties: Record<string, {
    type: string;
    title: string;
    description?: string;
    required?: boolean;
    enum?: string[];
    format?: string;
  }>;
  required: string[];
}

export interface PluginHealthResult {
  healthy: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  lastChecked: string;
  responseTime?: number;
}

// Alias for database adapters to maintain compatibility
export interface AdapterHealthCheck extends PluginHealthResult {
  adapter?: string;
  metadata?: Record<string, unknown>;
}

// Plugin manager interface
export interface PluginManager {
  // Execute plugins with error handling
  executeSchedulePlugins(workerId: string, configs: PluginConfig[]): Promise<PluginResponse<StandardScheduleItem>[]>;
  executeTaskPlugins(workerId: string, configs: PluginConfig[]): Promise<PluginResponse<StandardTaskItem>[]>;
  
  // Plugin lifecycle
  validatePlugin(plugin: PluginAdapter): Promise<boolean>;
  getPluginStatus(pluginId: string): Promise<PluginHealthResult>;
  
  // Configuration management
  updatePluginConfig(pluginId: string, config: Partial<PluginConfig>): Promise<void>;
}

// Utility types for plugin execution
export type PluginExecutionResult<T> = {
  pluginId: string;
  success: boolean;
  data?: T[];
  errors?: PluginError[];
  executionTime: number;
};

export type PluginBatchResult<T> = {
  totalPlugins: number;
  successfulPlugins: number;
  failedPlugins: number;
  results: PluginExecutionResult<T>[];
  aggregatedData: T[];
};
