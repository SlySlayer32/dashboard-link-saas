import { ScheduleItem, TaskItem } from './dashboard';

export interface PluginAdapter {
  id: string;
  name: string;
  description: string;
  version: string;
  
  /**
   * Get today's schedule items for a worker
   */
  getTodaySchedule(workerId: string, config: Record<string, unknown>): Promise<ScheduleItem[]>;
  
  /**
   * Get today's tasks for a worker
   */
  getTodayTasks(workerId: string, config: Record<string, unknown>): Promise<TaskItem[]>;
  
  /**
   * Optional webhook handler for real-time updates
   */
  handleWebhook?(payload: unknown, config: Record<string, unknown>): Promise<void>;
  
  /**
   * Validate plugin configuration
   */
  validateConfig(config: Record<string, unknown>): Promise<boolean>;
}

export interface PluginConfig {
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
