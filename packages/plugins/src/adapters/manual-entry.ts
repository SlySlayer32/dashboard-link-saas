import {
  AuthConfig,
  IScheduleProvider,
  ITaskProvider,
  ManualScheduleItem,
  ManualTaskItem,
  ScheduleItem,
  ScheduleRequest,
  TaskItem,
  TaskRequest,
} from '../types'

export class ManualEntryAdapter implements IScheduleProvider, ITaskProvider {
  readonly id = 'manual-entry'
  readonly name = 'Manual Entry'
  readonly version = '1.0.0'
  readonly capabilities = ['schedule', 'tasks', 'manual']

  private config: AuthConfig | null = null

  async initialize(config: AuthConfig): Promise<void> {
    this.config = config
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string }> {
    return { status: 'healthy' }
  }

  async shutdown(): Promise<void> {
    this.config = null
  }

  validateConfig(config: unknown): config is AuthConfig {
    const c = config as Record<string, unknown>
    return typeof c === 'object' && c !== null
  }

  getConfigSchema(): JSONSchema {
    return {
      type: 'object',
      properties: {
        schedules: {
          type: 'array',
          description: 'Manual schedule entries',
          items: {
            type: 'object',
            properties: {
              workerId: { type: 'string' },
              title: { type: 'string' },
              startTime: { type: 'string', format: 'date-time' },
              endTime: { type: 'string', format: 'date-time' },
              location: { type: 'string' },
              description: { type: 'string' },
            },
          },
        } as Record<string, unknown>,
        tasks: {
          type: 'array',
          description: 'Manual task entries',
          items: {
            type: 'object',
            properties: {
              workerId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              status: {
                type: 'string',
                enum: ['pending', 'in_progress', 'completed', 'cancelled'],
              },
              priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
              dueDate: { type: 'string', format: 'date-time' },
            },
          },
        } as Record<string, unknown>,
      },
    }
  }

  async getSchedule(request: ScheduleRequest): Promise<ScheduleItem[]> {
    if (!this.config?.schedules) {
      return []
    }

    return this.config.schedules
      .filter((item: ManualScheduleItem) => {
        // Filter by worker if specified
        if (request.workerId && item.workerId !== request.workerId) {
          return false
        }

        // Filter by date range
        const startTime = new Date(item.startTime)
        return startTime >= request.startDate && startTime <= request.endDate
      })
      .map((item: ManualScheduleItem) => ({
        id: item.id || Math.random().toString(36).substr(2, 9),
        title: item.title,
        startTime: new Date(item.startTime),
        endTime: new Date(item.endTime),
        location: item.location,
        description: item.description,
        status: 'confirmed',
        metadata: {
          source: 'manual-entry',
        },
      }))
  }

  async getTasks(request: TaskRequest): Promise<TaskItem[]> {
    if (!this.config?.tasks) {
      return []
    }

    return this.config.tasks
      .filter((item: ManualTaskItem) => {
        // Filter by worker if specified
        if (request.workerId && item.workerId !== request.workerId) {
          return false
        }

        // Filter by date range if specified
        if (request.startDate && item.dueDate) {
          const dueDate = new Date(item.dueDate)
          return dueDate >= request.startDate && dueDate <= (request.endDate || request.startDate)
        }

        return true
      })
      .map((item: ManualTaskItem) => ({
        id: item.id || Math.random().toString(36).substr(2, 9),
        title: item.title,
        description: item.description || '',
        status: item.status || 'pending',
        priority: item.priority || 'medium',
        assignee: item.assignee || '',
        dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
        metadata: {
          source: 'manual-entry',
        },
      }))
  }
}

interface JSONSchema {
  type: string
  properties: Record<string, unknown>
  required?: string[]
}
