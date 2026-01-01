/**
 * Standardized Plugin Data Contracts
 * These are YOUR data shapes - they never change
 * External services must adapt to these
 */

// ============================================
// STANDARDIZED DATA SHAPES (Never Change)
// ============================================

export interface StandardScheduleItem {
  id: string;
  title: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  location?: string;
  description?: string;
  metadata: Record<string, unknown>;
}

export interface StandardTaskItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string; // ISO 8601
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  metadata: Record<string, unknown>;
}

// ============================================
// PLUGIN RESPONSE ENVELOPE
// ============================================

export interface PluginResponse<T> {
  success: boolean;
  data: T[];
  errors?: PluginError[];
  metadata: PluginMetadata;
}

export interface PluginError {
  code: string;
  message: string;
  recoverable: boolean;
}

export interface PluginMetadata {
  source: string; // Plugin ID
  timestamp: string;
  version: string;
  hasMore?: boolean;
}

// ============================================
// PLUGIN INTERFACE (Your Contract)
// ============================================

export interface PluginAdapter {
  // Identity
  readonly id: string;
  readonly name: string;
  readonly version: string;

  // Core methods - only deal with YOUR data shapes
  getSchedule(
    workerId: string,
    dateRange: DateRange,
    config: PluginConfig
  ): Promise<PluginResponse<StandardScheduleItem>>;

  getTasks(
    workerId: string,
    config: PluginConfig
  ): Promise<PluginResponse<StandardTaskItem>>;

  // Configuration
  validateConfig(config: PluginConfig): Promise<ValidationResult>;
  
  // Optional: webhooks for real-time updates
  handleWebhook?(
    payload: unknown,
    config: PluginConfig
  ): Promise<WebhookResponse>;
}

// ============================================
// SUPPORTING TYPES
// ============================================

export interface DateRange {
  start: string; // ISO 8601
  end: string; // ISO 8601
}

export interface PluginConfig {
  enabled: boolean;
  settings: Record<string, unknown>; // Plugin-specific config
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface WebhookResponse {
  processed: boolean;
  shouldRefresh: boolean;
}

// ============================================
// LEGACY TYPES (For Migration)
// ============================================

// Keep existing types for backward compatibility during migration
export interface LegacyPluginConfig {
  id: string;
  organization_id: string;
  plugin_id: string;
  config: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PluginInfo {
  id: string;
  name: string;
  description: string;
  version: string;
  category: 'calendar' | 'task' | 'manual';
  documentationUrl?: string;
  webhookSupported: boolean;
  features: string[];
}

export interface PluginStatus {
  id: string;
  enabled: boolean;
  configured: boolean;
  connected: boolean;
  lastTested?: string;
  error?: string;
}

export interface PluginOrganizationConfig {
  enabled: boolean;
  config: Record<string, unknown>;
  status?: PluginStatus;
}

export interface PluginsConfig {
  [pluginId: string]: PluginOrganizationConfig;
}

export interface GoogleCalendarConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  accessToken?: string;
  refreshToken?: string;
  calendarId?: string;
}

export interface AirtableConfig {
  apiKey?: string;
  baseId?: string;
  tableName?: string;
}

export interface NotionConfig {
  integrationSecret?: string;
  databaseId?: string;
}

export interface PluginTestResult {
  success: boolean;
  message: string;
  timestamp: string;
}

export interface OAuthConfig {
  authUrl: string;
  tokenUrl: string;
  scope: string[];
  clientId: string;
  redirectUri: string;
}

// ============================================
// MIGRATION HELPERS
// ============================================

/**
 * Transform legacy ScheduleItem to StandardScheduleItem
 */
export function toStandardScheduleItem(item: {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  description?: string;
  type?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}): StandardScheduleItem {
  return {
    id: item.id,
    title: item.title,
    startTime: item.start_time,
    endTime: item.end_time,
    location: item.location,
    description: item.description,
    metadata: {
      ...item.metadata,
      type: item.type,
      source: item.source,
    },
  };
}

/**
 * Transform legacy TaskItem to StandardTaskItem
 */
export function toStandardTaskItem(item: {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed';
  type?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}): StandardTaskItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    dueDate: item.due_date,
    priority: item.priority || 'medium',
    status: item.status || 'pending',
    metadata: {
      ...item.metadata,
      type: item.type,
      source: item.source,
    },
  };
}
