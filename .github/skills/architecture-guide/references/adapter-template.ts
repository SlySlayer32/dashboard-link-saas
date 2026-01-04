# Plugin Adapter Template

Use this template when creating a new plugin adapter for Dashboard Link SaaS.

## File: `packages/plugins/src/adapters/NewServiceAdapter.ts`

```typescript
import {
  PluginAdapter,
  PluginConfig,
  PluginResponse,
  PluginError,
  ValidationResult,
  HealthStatus
} from '../contracts/PluginAdapter';
import {
  StandardScheduleItem,
  StandardTaskItem
} from '../types/pluginTypes';

/**
 * Adapter for [Service Name]
 * Transforms [Service] API data to standard Dashboard Link format
 */
export class NewServiceAdapter implements PluginAdapter {
  readonly id = 'new-service';
  readonly name = 'New Service';
  readonly version = '1.0.0';
  
  private apiKey: string;
  private baseUrl: string;
  
  constructor(config: { apiKey: string; baseUrl?: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.newservice.com';
  }
  
  /**
   * Fetch schedule data from [Service] and transform to standard format
   */
  async getSchedule(
    workerId: string,
    config: PluginConfig
  ): Promise<PluginResponse<StandardScheduleItem>> {
    try {
      // 1. Fetch from external API
      const externalData = await this.fetchScheduleFromAPI(workerId, config);
      
      // 2. Transform to YOUR standard format
      const standardItems: StandardScheduleItem[] = externalData.map(item => ({
        id: item.externalId,
        title: item.externalTitle,
        startTime: this.convertToISO(item.externalStartTime),
        endTime: this.convertToISO(item.externalEndTime),
        location: item.externalLocation,
        description: item.externalDescription,
        priority: this.mapPriority(item.externalPriority),
        metadata: {
          // Store provider-specific data here
          externalId: item.externalId,
          externalUrl: item.externalUrl,
          customFields: item.customFields
        }
      }));
      
      // 3. Return in standard envelope
      return {
        success: true,
        data: standardItems,
        metadata: {
          provider: this.id,
          fetchedAt: new Date().toISOString(),
          recordCount: standardItems.length
        }
      };
    } catch (error) {
      // 4. Handle errors gracefully (don't leak internals)
      console.error(`${this.name} fetch error:`, error);
      
      return {
        success: false,
        data: [],
        errors: [{
          code: this.getErrorCode(error),
          message: this.getErrorMessage(error),
          provider: this.id
        }],
        metadata: {
          provider: this.id,
          fetchedAt: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * Fetch tasks from [Service] and transform to standard format
   */
  async getTasks(
    workerId: string,
    config: PluginConfig
  ): Promise<PluginResponse<StandardTaskItem>> {
    try {
      const externalData = await this.fetchTasksFromAPI(workerId, config);
      
      const standardItems: StandardTaskItem[] = externalData.map(item => ({
        id: item.externalId,
        title: item.externalTitle,
        description: item.externalDescription,
        dueDate: item.externalDueDate,
        priority: this.mapPriority(item.externalPriority),
        status: this.mapStatus(item.externalStatus),
        assignee: item.externalAssignee,
        tags: item.externalTags || [],
        estimatedTime: item.externalEstimatedTime,
        metadata: {
          externalId: item.externalId,
          externalUrl: item.externalUrl
        }
      }));
      
      return {
        success: true,
        data: standardItems,
        metadata: {
          provider: this.id,
          fetchedAt: new Date().toISOString(),
          recordCount: standardItems.length
        }
      };
    } catch (error) {
      console.error(`${this.name} fetch tasks error:`, error);
      
      return {
        success: false,
        data: [],
        errors: [{
          code: this.getErrorCode(error),
          message: this.getErrorMessage(error),
          provider: this.id
        }],
        metadata: {
          provider: this.id,
          fetchedAt: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * Validate plugin configuration
   */
  async validateConfig(config: PluginConfig): Promise<ValidationResult> {
    const errors: string[] = [];
    
    // Validate required fields
    if (!config.apiKey) {
      errors.push('API key is required');
    }
    
    if (!config.workspaceId) {
      errors.push('Workspace ID is required');
    }
    
    // Validate API key format
    if (config.apiKey && !this.isValidApiKey(config.apiKey)) {
      errors.push('Invalid API key format');
    }
    
    // Test connection (optional)
    if (errors.length === 0) {
      try {
        await this.testConnection(config);
      } catch (error) {
        errors.push(`Connection test failed: ${error.message}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Health check for the adapter
   */
  async healthCheck(): Promise<HealthStatus> {
    try {
      // Ping the service
      const response = await fetch(`${this.baseUrl}/health`);
      
      return {
        healthy: response.ok,
        message: response.ok ? 'Service is operational' : 'Service is down',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Health check failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // ============================================
  // Private Helper Methods
  // ============================================
  
  private async fetchScheduleFromAPI(
    workerId: string,
    config: PluginConfig
  ): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/api/schedule?workerId=${workerId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.items || [];
  }
  
  private async fetchTasksFromAPI(
    workerId: string,
    config: PluginConfig
  ): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/api/tasks?workerId=${workerId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.items || [];
  }
  
  private async testConnection(config: PluginConfig): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/test`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Connection test failed');
    }
  }
  
  private convertToISO(dateString: string): string {
    // Convert external date format to ISO 8601
    return new Date(dateString).toISOString();
  }
  
  private mapPriority(externalPriority: string): 'low' | 'medium' | 'high' {
    const priorityMap: Record<string, 'low' | 'medium' | 'high'> = {
      'P1': 'high',
      'P2': 'medium',
      'P3': 'low',
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    };
    
    return priorityMap[externalPriority] || 'medium';
  }
  
  private mapStatus(externalStatus: string): 'todo' | 'in_progress' | 'done' {
    const statusMap: Record<string, 'todo' | 'in_progress' | 'done'> = {
      'open': 'todo',
      'in-progress': 'in_progress',
      'completed': 'done',
      'todo': 'todo',
      'doing': 'in_progress',
      'done': 'done'
    };
    
    return statusMap[externalStatus] || 'todo';
  }
  
  private isValidApiKey(apiKey: string): boolean {
    // Validate API key format (adjust for your service)
    return apiKey.length > 20 && apiKey.startsWith('sk_');
  }
  
  private getErrorCode(error: any): string {
    if (error.code) return error.code;
    if (error.response?.status === 401) return 'UNAUTHORIZED';
    if (error.response?.status === 403) return 'FORBIDDEN';
    if (error.response?.status === 404) return 'NOT_FOUND';
    if (error.response?.status === 429) return 'RATE_LIMITED';
    return 'FETCH_ERROR';
  }
  
  private getErrorMessage(error: any): string {
    // Don't leak internal error details to users
    if (error.response?.status === 401) {
      return 'Invalid API credentials';
    }
    if (error.response?.status === 403) {
      return 'Insufficient permissions';
    }
    if (error.response?.status === 404) {
      return 'Resource not found';
    }
    if (error.response?.status === 429) {
      return 'Rate limit exceeded';
    }
    return 'Failed to fetch data from service';
  }
}
```

## Usage Example

```typescript
// Create adapter instance
const adapter = new NewServiceAdapter({
  apiKey: process.env.NEW_SERVICE_API_KEY!,
  baseUrl: 'https://api.newservice.com'
});

// Use in plugin system
const pluginRegistry = {
  'new-service': adapter,
  'google-calendar': googleAdapter,
  'airtable': airtableAdapter
};

// Service layer uses generic interface
async function getWorkerData(workerId: string, pluginId: string) {
  const adapter = pluginRegistry[pluginId]; // PluginAdapter interface
  const schedule = await adapter.getSchedule(workerId, config);
  
  if (schedule.success) {
    return schedule.data; // All in standard format!
  } else {
    console.error('Fetch failed:', schedule.errors);
    return [];
  }
}
```

## Testing Your Adapter

```typescript
import { describe, it, expect, vi } from 'vitest';
import { NewServiceAdapter } from './NewServiceAdapter';

describe('NewServiceAdapter', () => {
  const adapter = new NewServiceAdapter({
    apiKey: 'test_key',
    baseUrl: 'https://test.api.com'
  });
  
  describe('getSchedule', () => {
    it('should transform external data to standard format', async () => {
      // Mock external API
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [{
            externalId: '123',
            externalTitle: 'Meeting',
            externalStartTime: '2024-01-01T10:00:00Z',
            externalEndTime: '2024-01-01T11:00:00Z'
          }]
        })
      });
      
      const result = await adapter.getSchedule('worker_123', {});
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: '123',
        title: 'Meeting',
        startTime: '2024-01-01T10:00:00.000Z',
        endTime: '2024-01-01T11:00:00.000Z',
        location: undefined,
        description: undefined,
        priority: 'medium',
        metadata: expect.any(Object)
      });
    });
    
    it('should handle errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized'
      });
      
      const result = await adapter.getSchedule('worker_123', {});
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].code).toBe('UNAUTHORIZED');
    });
  });
});
```

## Checklist

- [ ] Implement all PluginAdapter interface methods
- [ ] Transform external data to standard format
- [ ] Handle all error cases gracefully
- [ ] Don't leak external API errors
- [ ] Store provider-specific data in metadata
- [ ] Add comprehensive error codes
- [ ] Write tests for happy path
- [ ] Write tests for error cases
- [ ] Document configuration requirements
- [ ] Add JSDoc comments
