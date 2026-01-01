import {
    PluginAdapter,
    PluginBatchResult,
    PluginConfig,
    PluginExecutionResult,
    PluginHealthResult,
    PluginManager,
    PluginRegistry,
    PluginResponse,
    StandardScheduleItem,
    StandardTaskItem
} from '@dashboard-link/shared';
import { pluginRegistry } from './PluginRegistry';

// Plugin manager implementation - orchestrates plugin execution
export class PluginManagerImpl implements PluginManager {
  constructor(private registry: PluginRegistry = pluginRegistry) {}

  async executeSchedulePlugins(
    workerId: string, 
    configs: PluginConfig[]
  ): Promise<PluginResponse<StandardScheduleItem>[]> {
    const results: PluginResponse<StandardScheduleItem>[] = [];
    
    for (const config of configs) {
      const plugin = this.registry.get(config.id);
      if (!plugin) {
        results.push({
          success: false,
          data: [],
          errors: [{
            code: 'PLUGIN_NOT_FOUND',
            message: `Plugin with id '${config.id}' not found in registry`,
            retryable: false
          }],
          metadata: {
            source: 'plugin-manager',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        });
        continue;
      }

      try {
        const result = await plugin.getTodaySchedule(workerId, config);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          data: [],
          errors: [{
            code: 'PLUGIN_EXECUTION_ERROR',
            message: error instanceof Error ? error.message : 'Unknown plugin execution error',
            retryable: true
          }],
          metadata: {
            source: config.id,
            timestamp: new Date().toISOString(),
            version: config.version
          }
        });
      }
    }

    return results;
  }

  async executeTaskPlugins(
    workerId: string, 
    configs: PluginConfig[]
  ): Promise<PluginResponse<StandardTaskItem>[]> {
    const results: PluginResponse<StandardTaskItem>[] = [];
    
    for (const config of configs) {
      const plugin = this.registry.get(config.id);
      if (!plugin) {
        results.push({
          success: false,
          data: [],
          errors: [{
            code: 'PLUGIN_NOT_FOUND',
            message: `Plugin with id '${config.id}' not found in registry`,
            retryable: false
          }],
          metadata: {
            source: 'plugin-manager',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        });
        continue;
      }

      try {
        const result = await plugin.getTodayTasks(workerId, config);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          data: [],
          errors: [{
            code: 'PLUGIN_EXECUTION_ERROR',
            message: error instanceof Error ? error.message : 'Unknown plugin execution error',
            retryable: true
          }],
          metadata: {
            source: config.id,
            timestamp: new Date().toISOString(),
            version: config.version
          }
        });
      }
    }

    return results;
  }

  async validatePlugin(plugin: PluginAdapter): Promise<boolean> {
    try {
      // Create a minimal config for validation
      const schema = plugin.getConfigSchema();
      const minimalConfig: PluginConfig = {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        enabled: true,
        settings: {}
      };

      // Add required fields with empty values
      for (const requiredField of schema.required) {
        const fieldSchema = schema.properties[requiredField];
        if (fieldSchema) {
          switch (fieldSchema.type) {
            case 'string':
              minimalConfig.settings[requiredField] = '';
              break;
            case 'number':
              minimalConfig.settings[requiredField] = 0;
              break;
            case 'boolean':
              minimalConfig.settings[requiredField] = false;
              break;
            case 'array':
              minimalConfig.settings[requiredField] = [];
              break;
            case 'object':
              minimalConfig.settings[requiredField] = {};
              break;
          }
        }
      }

      const validation = await plugin.validateConfig(minimalConfig);
      return validation.valid;
    } catch (error) {
      console.error(`Plugin validation failed for ${plugin.id}:`, error);
      return false;
    }
  }

  async getPluginStatus(pluginId: string): Promise<PluginHealthResult> {
    const plugin = this.registry.get(pluginId);
    if (!plugin) {
      return {
        healthy: false,
        status: 'unhealthy',
        message: `Plugin with id '${pluginId}' not found`,
        lastChecked: new Date().toISOString()
      };
    }

    // Create a minimal config for health check
    const minimalConfig: PluginConfig = {
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      enabled: true,
      settings: {}
    };

    if (plugin.healthCheck) {
      return await plugin.healthCheck(minimalConfig);
    }

    // Default health check if plugin doesn't implement one
    try {
      await this.validatePlugin(plugin);
      return {
        healthy: true,
        status: 'healthy',
        message: 'Plugin is operating normally (default health check)',
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown health check error',
        lastChecked: new Date().toISOString()
      };
    }
  }

  async updatePluginConfig(pluginId: string, config: Partial<PluginConfig>): Promise<void> {
    // This would typically update a configuration store
    // For now, we'll just log the action
    console.log(`Plugin config update requested for ${pluginId}:`, config);
    
    // In a real implementation, this would:
    // 1. Validate the new config
    // 2. Update the configuration in the database
    // 3. Notify the plugin of the config change
    // 4. Possibly restart the plugin if needed
  }

  // Additional utility methods
  async executeAllPlugins(
    workerId: string, 
    configs: PluginConfig[]
  ): Promise<{
    scheduleResults: PluginBatchResult<StandardScheduleItem>;
    taskResults: PluginBatchResult<StandardTaskItem>;
  }> {
    const scheduleResults = await this.executeSchedulePlugins(workerId, configs);
    const taskResults = await this.executeTaskPlugins(workerId, configs);

    return {
      scheduleResults: this.createBatchResult(scheduleResults),
      taskResults: this.createBatchResult(taskResults)
    };
  }

  private createBatchResult<T>(
    results: PluginResponse<T>[]
  ): PluginBatchResult<T> {
    const executionResults: PluginExecutionResult<T>[] = results.map((result, index) => ({
      pluginId: result.metadata.source,
      success: result.success,
      data: result.data,
      errors: result.errors,
      executionTime: result.metadata.processingTime || 0
    }));

    const successfulPlugins = executionResults.filter(r => r.success).length;
    const aggregatedData = results
      .filter(r => r.success)
      .flatMap(r => r.data);

    return {
      totalPlugins: results.length,
      successfulPlugins,
      failedPlugins: results.length - successfulPlugins,
      results: executionResults,
      aggregatedData
    };
  }

  async getHealthStatus(): Promise<Map<string, PluginHealthResult>> {
    const healthStatus = new Map<string, PluginHealthResult>();
    
    for (const plugin of this.registry.getAll()) {
      const status = await this.getPluginStatus(plugin.id);
      healthStatus.set(plugin.id, status);
    }

    return healthStatus;
  }

  async validateAllPlugins(): Promise<Map<string, boolean>> {
    const validationResults = new Map<string, boolean>();
    
    for (const plugin of this.registry.getAll()) {
      const isValid = await this.validatePlugin(plugin);
      validationResults.set(plugin.id, isValid);
    }

    return validationResults;
  }
}

// Export singleton instance
export const pluginManager = new PluginManagerImpl();
