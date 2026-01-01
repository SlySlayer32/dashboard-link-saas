import {
    PluginAdapter,
    PluginConfig,
    PluginHealthResult,
    PluginResponse,
    PluginValidationResult,
    StandardScheduleItem,
    StandardTaskItem
} from '@dashboard-link/shared';

// Abstract base class that all plugin adapters should extend
// This provides the standard implementation pattern and error handling
export abstract class BasePluginAdapter implements PluginAdapter {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly description: string;

  // Abstract methods that each plugin must implement
  protected abstract fetchExternalSchedule(workerId: string, config: PluginConfig): Promise<unknown[]>;
  protected abstract fetchExternalTasks(workerId: string, config: PluginConfig): Promise<unknown[]>;
  protected abstract transformScheduleItem(item: unknown): StandardScheduleItem;
  protected abstract transformTaskItem(item: unknown): StandardTaskItem;

  // Standardized implementation - plugins don't need to reimplement this
  async getTodaySchedule(workerId: string, config: PluginConfig): Promise<PluginResponse<StandardScheduleItem>> {
    const startTime = Date.now();
    
    try {
      // Validate config first
      const validation = await this.validateConfig(config);
      if (!validation.valid) {
        return this.createErrorResponse<StandardScheduleItem>(
          'CONFIG_INVALID',
          `Plugin configuration is invalid: ${validation.errors?.join(', ')}`,
          startTime
        );
      }

      // Fetch external data
      const externalData = await this.fetchExternalSchedule(workerId, config);
      
      // Transform to standard format
      const standardItems = externalData.map(item => this.transformScheduleItem(item));
      
      // Validate transformed items
      const validItems = standardItems.filter(item => this.validateScheduleItem(item));
      
      return {
        success: true,
        data: validItems,
        metadata: {
          source: this.id,
          timestamp: new Date().toISOString(),
          version: this.version,
          totalItems: externalData.length,
          processingTime: Date.now() - startTime
        }
      };
    } catch (error) {
      return this.createErrorResponse<StandardScheduleItem>(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Unknown error fetching schedule',
        startTime,
        error
      );
    }
  }

  async getTodayTasks(workerId: string, config: PluginConfig): Promise<PluginResponse<StandardTaskItem>> {
    const startTime = Date.now();
    
    try {
      // Validate config first
      const validation = await this.validateConfig(config);
      if (!validation.valid) {
        return this.createErrorResponse<StandardTaskItem>(
          'CONFIG_INVALID',
          `Plugin configuration is invalid: ${validation.errors?.join(', ')}`,
          startTime
        );
      }

      // Fetch external data
      const externalData = await this.fetchExternalTasks(workerId, config);
      
      // Transform to standard format
      const standardItems = externalData.map(item => this.transformTaskItem(item));
      
      // Validate transformed items
      const validItems = standardItems.filter(item => this.validateTaskItem(item));
      
      return {
        success: true,
        data: validItems,
        metadata: {
          source: this.id,
          timestamp: new Date().toISOString(),
          version: this.version,
          totalItems: externalData.length,
          processingTime: Date.now() - startTime
        }
      };
    } catch (error) {
      return this.createErrorResponse<StandardTaskItem>(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Unknown error fetching tasks',
        startTime,
        error
      );
    }
  }

  // Default validation implementation - can be overridden
  async validateConfig(config: PluginConfig): Promise<PluginValidationResult> {
    const schema = this.getConfigSchema();
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    for (const requiredField of schema.required) {
      if (!(requiredField in config.settings)) {
        errors.push(`Missing required field: ${requiredField}`);
      }
    }

    // Validate field types
    for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
      const value = config.settings[fieldName];
      
      if (value !== undefined && !this.validateFieldType(value, fieldSchema.type)) {
        errors.push(`Invalid type for field ${fieldName}: expected ${fieldSchema.type}, got ${typeof value}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  // Default health check - can be overridden
  async healthCheck(config: PluginConfig): Promise<PluginHealthResult> {
    const startTime = Date.now();
    
    try {
      // Try a simple validation to check if the plugin is responsive
      await this.validateConfig(config);
      
      return {
        healthy: true,
        status: 'healthy',
        message: 'Plugin is operating normally',
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown health check error',
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
    }
  }

  // Helper methods
  protected createErrorResponse<T>(
    code: string, 
    message: string, 
    startTime: number, 
    originalError?: unknown
  ): PluginResponse<T> {
    return {
      success: false,
      data: [],
      errors: [{
        code,
        message,
        details: originalError instanceof Error ? { stack: originalError.stack } : undefined,
        retryable: this.isRetryableError(code)
      }],
      metadata: {
        source: this.id,
        timestamp: new Date().toISOString(),
        version: this.version,
        processingTime: Date.now() - startTime
      }
    };
  }

  protected validateScheduleItem(item: StandardScheduleItem): boolean {
    return !!(
      item.id &&
      item.title &&
      item.startTime &&
      item.endTime &&
      this.isValidISODate(item.startTime) &&
      this.isValidISODate(item.endTime) &&
      new Date(item.startTime) < new Date(item.endTime)
    );
  }

  protected validateTaskItem(item: StandardTaskItem): boolean {
    return !!(
      item.id &&
      item.title &&
      ['low', 'medium', 'high'].includes(item.priority) &&
      ['pending', 'in_progress', 'completed', 'cancelled'].includes(item.status) &&
      (!item.dueDate || this.isValidISODate(item.dueDate))
    );
  }

  protected validateFieldType(value: unknown, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true; // Unknown type, assume valid
    }
  }

  protected isValidISODate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString === date.toISOString();
  }

  protected isRetryableError(code: string): boolean {
    // Define which errors are retryable
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'RATE_LIMIT_ERROR'];
    return retryableCodes.includes(code);
  }

  // Utility methods for date handling
  protected getTodayRange(): { start: string; end: string } {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    return {
      start: startOfDay.toISOString(),
      end: endOfDay.toISOString()
    };
  }

  protected isToday(dateString: string): boolean {
    const date = new Date(dateString);
    const now = new Date();
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }
}
