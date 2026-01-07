import {
  DateRange,
  PluginConfig,
  PluginRegistry,
  PluginResponse,
  StandardScheduleItem,
  StandardTaskItem,
  dateRangeSchema,
  pluginConfigSchema,
  pluginResponseSchema,
  standardScheduleItemSchema,
  standardTaskItemSchema,
} from '../contracts'
import { pluginRegistry } from '../registry/PluginRegistry'

export class PluginService {
  constructor(private readonly registry: PluginRegistry = pluginRegistry) {}

  private createMissingPluginResponse<T>(pluginId: string): PluginResponse<T> {
    return {
      success: false,
      data: [],
      errors: [
        {
          code: 'PLUGIN_NOT_FOUND',
          message: `Plugin with id '${pluginId}' not found`,
          retryable: false,
        },
      ],
      metadata: {
        source: 'plugin-service',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    }
  }

  async getSchedule(
    workerId: string,
    dateRange: DateRange,
    config: PluginConfig
  ): Promise<PluginResponse<StandardScheduleItem>> {
    const parsedConfig = pluginConfigSchema.safeParse(config)
    const parsedRange = dateRangeSchema.safeParse(dateRange)

    if (!parsedConfig.success || !parsedRange.success) {
      const issues = [
        ...(!parsedConfig.success ? parsedConfig.error.errors.map((e) => e.message) : []),
        ...(!parsedRange.success ? parsedRange.error.errors.map((e) => e.message) : []),
      ]

      return {
        success: false,
        data: [],
        errors: [
          {
            code: 'CONFIG_INVALID',
            message: issues.join(', '),
            retryable: false,
          },
        ],
        metadata: {
          source: config.id,
          timestamp: new Date().toISOString(),
          version: config.version,
        },
      }
    }

    const plugin = this.registry.get(parsedConfig.data.id)
    if (!plugin) {
      return this.createMissingPluginResponse<StandardScheduleItem>(parsedConfig.data.id)
    }

    const response = await plugin.getSchedule(workerId, parsedRange.data, parsedConfig.data)
    pluginResponseSchema(standardScheduleItemSchema).parse(response)
    return response
  }

  async getTasks(
    workerId: string,
    config: PluginConfig
  ): Promise<PluginResponse<StandardTaskItem>> {
    const parsedConfig = pluginConfigSchema.safeParse(config)

    if (!parsedConfig.success) {
      const issues = parsedConfig.error.errors.map((e) => e.message)
      return {
        success: false,
        data: [],
        errors: [
          {
            code: 'CONFIG_INVALID',
            message: issues.join(', '),
            retryable: false,
          },
        ],
        metadata: {
          source: config.id,
          timestamp: new Date().toISOString(),
          version: config.version,
        },
      }
    }

    const plugin = this.registry.get(parsedConfig.data.id)
    if (!plugin) {
      return this.createMissingPluginResponse<StandardTaskItem>(parsedConfig.data.id)
    }

    const response = await plugin.getTasks(workerId, parsedConfig.data)
    pluginResponseSchema(standardTaskItemSchema).parse(response)
    return response
  }
}

export const pluginService = new PluginService()
