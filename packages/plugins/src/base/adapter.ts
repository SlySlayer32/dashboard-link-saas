import {
    DateRange,
    PluginConfig,
    PluginError,
    PluginResponse,
    StandardScheduleItem,
    StandardTaskItem,
    ValidationResult,
    WebhookResponse
} from '@dashboard-link/shared'

/**
 * Base adapter class that handles common concerns
 * All plugin adapters extend this - provides separation of concerns
 */
export abstract class BasePluginAdapter {
  abstract readonly id: string
  abstract readonly name: string
  abstract readonly version: string

  // Each plugin implements these - they do the API-specific work
  protected abstract fetchExternalSchedule(
    workerId: string,
    dateRange: DateRange,
    config: PluginConfig
  ): Promise<unknown[]>

  protected abstract fetchExternalTasks(
    workerId: string,
    config: PluginConfig
  ): Promise<unknown[]>

  protected abstract transformScheduleItem(
    externalItem: unknown
  ): StandardScheduleItem | null

  protected abstract transformTaskItem(
    externalItem: unknown
  ): StandardTaskItem | null

  // Public methods your app calls - these never change
  async getSchedule(
    workerId: string,
    dateRange: DateRange,
    config: PluginConfig
  ): Promise<PluginResponse<StandardScheduleItem>> {
    try {
      const externalItems = await this.fetchExternalSchedule(
        workerId,
        dateRange,
        config
      )

      const standardItems = externalItems
        .map(item => this.transformScheduleItem(item))
        .filter((item): item is StandardScheduleItem => item !== null)

      return this.createSuccessResponse(standardItems)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  async getTasks(
    workerId: string,
    config: PluginConfig
  ): Promise<PluginResponse<StandardTaskItem>> {
    try {
      const externalItems = await this.fetchExternalTasks(workerId, config)

      const standardItems = externalItems
        .map(item => this.transformTaskItem(item))
        .filter((item): item is StandardTaskItem => item !== null)

      return this.createSuccessResponse(standardItems)
    } catch (error) {
      return this.createErrorResponse(error)
    }
  }

  // Optional webhook handler - override if supported
  async handleWebhook(
    _payload: unknown,
    _config: PluginConfig
  ): Promise<WebhookResponse> {
    throw new Error(`Webhook not implemented for ${this.name}`)
  }

  // Configuration validation - must be implemented by plugins
  abstract validateConfig(config: PluginConfig): Promise<ValidationResult>

  // Helper methods for creating standardized responses
  protected createSuccessResponse<T>(
    data: T[]
  ): PluginResponse<T> {
    return {
      success: true,
      data,
      metadata: {
        source: this.id,
        timestamp: new Date().toISOString(),
        version: this.version
      }
    }
  }

  protected createErrorResponse(error: unknown): PluginResponse<never> {
    const pluginError: PluginError = {
      code: 'PLUGIN_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      retryable: true
    }

    return {
      success: false,
      data: [],
      errors: [pluginError],
      metadata: {
        source: this.id,
        timestamp: new Date().toISOString(),
        version: this.version
      }
    }
  }

  protected createValidationErrorResponse(errors: string[]): PluginResponse<never> {
    const pluginError: PluginError = {
      code: 'VALIDATION_ERROR',
      message: errors.join(', '),
      retryable: false
    }

    return {
      success: false,
      data: [],
      errors: [pluginError],
      metadata: {
        source: this.id,
        timestamp: new Date().toISOString(),
        version: this.version
      }
    }
  }

  }
