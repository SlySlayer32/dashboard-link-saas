import {
    PluginConfig,
    StandardScheduleItem,
    StandardTaskItem
} from '@dashboard-link/shared';
import { BasePluginAdapter } from '../base/BasePluginAdapter';

// Manual data interfaces (from database)
interface ManualScheduleItem {
  id: string;
  worker_id: string;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface ManualTaskItem {
  id: string;
  worker_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  metadata?: Record<string, unknown>;
  tags?: string[];
  estimated_time?: number;
  created_at: string;
  updated_at: string;
}

// Manual adapter implementation - uses database directly
export class ManualAdapter extends BasePluginAdapter {
  readonly id = 'manual';
  readonly name = 'Manual Entry';
  readonly version = '1.0.0';
  readonly description = 'Manually entered schedule and task data';

  // Required abstract method implementations
  protected async fetchExternalSchedule(workerId: string, config: PluginConfig): Promise<unknown[]> {
    // In a real implementation, this would query the database
    // For now, we'll return mock data
    const mockData: ManualScheduleItem[] = [
      {
        id: '1',
        worker_id: workerId,
        title: 'Team Standup',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        location: 'Conference Room A',
        description: 'Daily team standup meeting',
        metadata: { type: 'meeting' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        worker_id: workerId,
        title: 'Client Call',
        start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        location: 'Virtual',
        description: 'Weekly client check-in',
        metadata: { type: 'client' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return mockData;
  }

  protected async fetchExternalTasks(workerId: string, config: PluginConfig): Promise<unknown[]> {
    // Mock task data
    const mockData: ManualTaskItem[] = [
      {
        id: '1',
        worker_id: workerId,
        title: 'Complete project proposal',
        description: 'Finish the Q1 project proposal document',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        status: 'in_progress',
        metadata: { project: 'Q1 Proposal' },
        tags: ['project', 'urgent'],
        estimated_time: 120,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        worker_id: workerId,
        title: 'Review code changes',
        description: 'Review pull requests from team',
        due_date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        priority: 'medium',
        status: 'pending',
        metadata: { type: 'review' },
        tags: ['code', 'team'],
        estimated_time: 60,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return mockData;
  }

  protected transformScheduleItem(item: unknown): StandardScheduleItem {
    const manualItem = item as ManualScheduleItem;
    
    return {
      id: manualItem.id,
      title: manualItem.title,
      startTime: manualItem.start_time,
      endTime: manualItem.end_time,
      location: manualItem.location,
      description: manualItem.description,
      metadata: {
        ...manualItem.metadata,
        source: 'manual',
        createdAt: manualItem.created_at,
        updatedAt: manualItem.updated_at
      },
      priority: 'medium', // Default priority for manual items
      status: 'scheduled'
    };
  }

  protected transformTaskItem(item: unknown): StandardTaskItem {
    const manualItem = item as ManualTaskItem;
    
    return {
      id: manualItem.id,
      title: manualItem.title,
      description: manualItem.description,
      dueDate: manualItem.due_date,
      priority: manualItem.priority,
      status: manualItem.status,
      assignee: undefined, // Manual items don't have assignees
      metadata: {
        ...manualItem.metadata,
        source: 'manual',
        createdAt: manualItem.created_at,
        updatedAt: manualItem.updated_at
      },
      tags: manualItem.tags,
      estimatedTime: manualItem.estimated_time
    };
  }

  // Configuration schema - manual adapter doesn't need much config
  getConfigSchema() {
    return {
      type: 'object' as const,
      properties: {
        enabled: {
          type: 'boolean' as const,
          title: 'Enabled',
          description: 'Whether manual entries are enabled',
          required: false
        }
      },
      required: [] as string[]
    };
  }
}
