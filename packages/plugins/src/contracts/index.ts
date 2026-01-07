import { z } from 'zod'

export const dateRangeSchema = z.object({
  start: z.string().min(1, 'start is required'),
  end: z.string().min(1, 'end is required'),
})

export type DateRange = z.infer<typeof dateRangeSchema>

export const pluginConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  enabled: z.boolean(),
  settings: z.record(z.unknown()),
  credentials: z.record(z.unknown()).optional(),
})

export type PluginConfig = z.infer<typeof pluginConfigSchema>

export const pluginErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  retryable: z.boolean().optional(),
})

export type PluginError = z.infer<typeof pluginErrorSchema>

export const pluginMetadataSchema = z.object({
  source: z.string(),
  timestamp: z.string(),
  version: z.string(),
  totalItems: z.number().optional(),
  processingTime: z.number().optional(),
})

export type PluginMetadata = z.infer<typeof pluginMetadataSchema>

export const standardScheduleItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.unknown()),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['scheduled', 'cancelled', 'completed']).optional(),
})

export type StandardScheduleItem = z.infer<typeof standardScheduleItemSchema>

export const standardTaskItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  assignee: z.string().optional(),
  metadata: z.record(z.unknown()),
  tags: z.array(z.string()).optional(),
  estimatedTime: z.number().optional(),
})

export type StandardTaskItem = z.infer<typeof standardTaskItemSchema>

export const pluginResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.array(dataSchema),
    errors: z.array(pluginErrorSchema).optional(),
    metadata: pluginMetadataSchema,
  })

export type PluginResponse<T> = {
  success: boolean
  data: T[]
  errors?: PluginError[]
  metadata: PluginMetadata
}

export const validationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
})

export type ValidationResult = z.infer<typeof validationResultSchema>
export type PluginValidationResult = ValidationResult

export const pluginConfigSchemaShape = z.object({
  type: z.literal('object'),
  properties: z.record(
    z.object({
      type: z.string(),
      title: z.string(),
      description: z.string().optional(),
      required: z.boolean().optional(),
      enum: z.array(z.string()).optional(),
      format: z.string().optional(),
    })
  ),
  required: z.array(z.string()),
})

export type PluginConfigSchema = z.infer<typeof pluginConfigSchemaShape>

export const webhookResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  status: z.string(),
  metadata: z.record(z.unknown()).optional(),
})

export type WebhookResponse = z.infer<typeof webhookResponseSchema>

export const pluginHealthSchema = z.object({
  healthy: z.boolean(),
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  message: z.string().optional(),
  lastChecked: z.string(),
  responseTime: z.number().optional(),
})

export type PluginHealthResult = z.infer<typeof pluginHealthSchema>

export interface PluginAdapter {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly description: string

  getSchedule(
    workerId: string,
    dateRange: DateRange,
    config: PluginConfig
  ): Promise<PluginResponse<StandardScheduleItem>>

  getTasks(workerId: string, config: PluginConfig): Promise<PluginResponse<StandardTaskItem>>

  validateConfig(config: PluginConfig): Promise<ValidationResult>

  getConfigSchema(): PluginConfigSchema

  getTodaySchedule?(
    workerId: string,
    config: PluginConfig
  ): Promise<PluginResponse<StandardScheduleItem>>

  getTodayTasks?(workerId: string, config: PluginConfig): Promise<PluginResponse<StandardTaskItem>>

  handleWebhook?(payload: unknown, config: PluginConfig): Promise<WebhookResponse>

  healthCheck?(config: PluginConfig): Promise<PluginHealthResult>
}

export interface PluginRegistry {
  register(plugin: PluginAdapter): void
  unregister(pluginId: string): void
  get(pluginId: string): PluginAdapter | undefined
  getAll(): PluginAdapter[]
  getEnabled(): PluginAdapter[]
}

export interface PluginManager {
  executeSchedulePlugins(
    workerId: string,
    configs: PluginConfig[],
    dateRange: DateRange
  ): Promise<PluginResponse<StandardScheduleItem>[]>
  executeTaskPlugins(
    workerId: string,
    configs: PluginConfig[]
  ): Promise<PluginResponse<StandardTaskItem>[]>
  validatePlugin(plugin: PluginAdapter): Promise<boolean>
  getPluginStatus(pluginId: string): Promise<PluginHealthResult>
  updatePluginConfig(pluginId: string, config: Partial<PluginConfig>): Promise<void>
}

export type PluginExecutionResult<T> = {
  pluginId: string
  success: boolean
  data?: T[]
  errors?: PluginError[]
  executionTime: number
}

export type PluginBatchResult<T> = {
  totalPlugins: number
  successfulPlugins: number
  failedPlugins: number
  results: PluginExecutionResult<T>[]
  aggregatedData: T[]
}
