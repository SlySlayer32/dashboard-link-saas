import { AuthConfig, ITaskProvider, TaskItem, TaskRequest } from '../types'

export class AirtableAdapter implements ITaskProvider {
  readonly id = 'airtable'
  readonly name = 'Airtable'
  readonly version = '1.0.0'
  readonly capabilities = ['tasks', 'api-key']

  private config: AuthConfig | null = null
  private baseUrl = 'https://api.airtable.com/v0'

  async initialize(config: AuthConfig): Promise<void> {
    if (!this.validateConfig(config)) {
      throw new Error('Invalid Airtable config')
    }
    this.config = config
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string }> {
    try {
      if (!this.config?.apiKey) {
        return { status: 'unhealthy', message: 'No API key' }
      }

      const response = await fetch(`${this.baseUrl}/meta/bases`, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      })

      if (!response.ok) {
        return { status: 'unhealthy', message: 'API request failed' }
      }

      return { status: 'healthy' }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async shutdown(): Promise<void> {
    this.config = null
  }

  validateConfig(config: unknown): config is AuthConfig {
    const c = config as Record<string, unknown>
    return (
      typeof c === 'object' &&
      c !== null &&
      typeof c.apiKey === 'string' &&
      typeof c.baseId === 'string' &&
      typeof c.tableId === 'string'
    )
  }

  getConfigSchema(): JSONSchema {
    return {
      type: 'object',
      properties: {
        apiKey: { type: 'string', description: 'Airtable API key (personal access token)' },
        baseId: { type: 'string', description: 'Airtable base ID' },
        tableId: { type: 'string', description: 'Airtable table ID' },
        viewId: { type: 'string', description: 'Airtable view ID (optional)' },
      } as Record<string, unknown>,
      required: ['apiKey', 'baseId', 'tableId'],
    }
  }

  async getTasks(request: TaskRequest): Promise<TaskItem[]> {
    if (!this.config) {
      throw new Error('Adapter not initialized')
    }

    const params = new URLSearchParams()

    // Add filter formula if worker filter is provided
    if (request.workerId || request.workerEmail) {
      const filterField = request.workerId ? 'Worker ID' : 'Worker Email'
      const filterValue = request.workerId || request.workerEmail
      params.set('filterByFormula', `{${filterField}} = '${filterValue}'`)
    }

    // Add view if specified
    if (this.config.viewId) {
      params.set('view', this.config.viewId)
    }

    // Add date filter if requested
    if (request.startDate && request.endDate) {
      const dateField = request.dateField || 'Date'
      params.set(
        'filterByFormula',
        `AND(IS_AFTER({${dateField}}, '${request.startDate.toISOString()}'), IS_BEFORE({${dateField}}, '${request.endDate.toISOString()}'))`
      )
    }

    const response = await fetch(
      `${this.baseUrl}/${this.config.baseId}/${this.config.tableId}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch Airtable records')
    }

    const data = await response.json()

    return data.records.map((record: Record<string, unknown>) => {
      const fields = record.fields as Record<string, unknown>

      return {
        id: record.id,
        title:
          (fields['Task Name'] as string) ||
          (fields['Title'] as string) ||
          (fields['Name'] as string) ||
          'Untitled',
        description: (fields['Description'] as string) || (fields['Notes'] as string) || '',
        status: this.mapStatus((fields['Status'] as string) || (fields['State'] as string)),
        priority: this.mapPriority(fields['Priority'] as string),
        assignee: (fields['Assignee'] as string) || (fields['Worker Name'] as string) || '',
        dueDate: fields['Due Date'] ? new Date(fields['Due Date'] as string) : undefined,
        metadata: {
          source: 'airtable',
          baseId: this.config!.baseId,
          tableId: this.config!.tableId,
          fields: Object.keys(fields),
          raw: record,
        },
      }
    })
  }

  private mapStatus(status: string): 'pending' | 'in_progress' | 'completed' | 'cancelled' {
    const s = (status || '').toLowerCase()

    if (['done', 'complete', 'completed', 'finished'].includes(s)) {
      return 'completed'
    }
    if (['in progress', 'working', 'active'].includes(s)) {
      return 'in_progress'
    }
    if (['cancelled', 'canceled', 'void'].includes(s)) {
      return 'cancelled'
    }

    return 'pending'
  }

  private mapPriority(priority: string): 'low' | 'medium' | 'high' | 'urgent' {
    const p = (priority || '').toLowerCase()

    if (['urgent', 'critical', 'asap'].includes(p)) {
      return 'urgent'
    }
    if (['high', 'important'].includes(p)) {
      return 'high'
    }
    if (['low', 'minor'].includes(p)) {
      return 'low'
    }

    return 'medium'
  }
}

interface JSONSchema {
  type: string
  properties: Record<string, unknown>
  required?: string[]
}
