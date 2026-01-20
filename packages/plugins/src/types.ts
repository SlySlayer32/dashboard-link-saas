export interface AuthConfig {
  [key: string]: unknown
  accessToken?: string
  refreshToken?: string
  apiKey?: string
  clientId?: string
  clientSecret?: string
  redirectUri?: string
  baseId?: string
  tableId?: string
  viewId?: string
  schedules?: ManualScheduleItem[]
  tasks?: ManualTaskItem[]
}

export interface ManualScheduleItem {
  id?: string
  workerId?: string
  title: string
  startTime: string
  endTime: string
  location?: string
  description?: string
}

export interface ManualTaskItem {
  id?: string
  workerId?: string
  title: string
  description?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  assignee?: string
}

export interface AdapterCapability {
  id: string
  name: string
  description: string
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  message?: string
}

export interface JSONSchema {
  type: string
  properties: Record<string, unknown>
  required?: string[]
}

export interface IAdapter {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly capabilities: string[]

  initialize(config: AuthConfig): Promise<void>
  healthCheck(): Promise<HealthStatus>
  shutdown(): Promise<void>

  validateConfig(config: unknown): config is AuthConfig
  getConfigSchema(): JSONSchema
}

export interface TokenSet {
  accessToken: string
  refreshToken?: string
}

export interface WebhookConfig {
  url: string
  secret?: string
  events: string[]
}

export interface IScheduleProvider extends IAdapter {
  getSchedule(req: ScheduleRequest): Promise<ScheduleItem[]>
  subscribeToChanges?(webhook: WebhookConfig): Promise<void>
}

export interface ITaskProvider extends IAdapter {
  getTasks(req: TaskRequest): Promise<TaskItem[]>
}

export interface ScheduleRequest {
  workerId?: string
  startDate: Date
  endDate: Date
  calendarId?: string
}

export interface TaskRequest {
  workerId?: string
  workerEmail?: string
  startDate?: Date
  endDate?: Date
  dateField?: string
}

export interface ScheduleItem {
  id: string
  title: string
  startTime: Date
  endTime: Date
  location?: string
  description?: string
  status: 'confirmed' | 'cancelled' | 'tentative'
  metadata?: Record<string, unknown>
}

export interface TaskItem {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee?: string
  dueDate?: Date
  metadata?: Record<string, unknown>
}
