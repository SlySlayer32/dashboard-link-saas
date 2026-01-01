import { DateRange, PluginConfig, StandardScheduleItem, StandardTaskItem, ValidationResult } from '@dashboard-link/shared'
import { BasePluginAdapter } from '../base/adapter'

interface NotionPage {
  id: string
  created_time: string
  properties: Record<string, unknown>
}

/**
 * Notion Plugin Adapter
 * Fetches schedule and task data from Notion databases
 */
export class NotionAdapter extends BasePluginAdapter {
  readonly id = 'notion'
  readonly name = 'Notion'
  readonly version = '1.0.0'

  protected async fetchExternalSchedule(
    workerId: string,
    dateRange: DateRange,
    config: PluginConfig
  ): Promise<unknown[]> {
    const { settings } = config
    const { 
      integrationSecret, 
      scheduleDatabaseId,
      workerProperty = 'Worker',
      dateProperty = 'Date'
    } = settings as {
      integrationSecret: string
      scheduleDatabaseId: string
      workerProperty?: string
      dateProperty?: string
    }

    if (!integrationSecret || !scheduleDatabaseId) {
      throw new Error('Notion integration secret and database ID are required')
    }

    // Convert date range to Notion format
    const startDate = new Date(dateRange.start).toISOString().split('T')[0]

    // Build Notion filter for today's schedule for this worker
    const filter = {
      and: [
        {
          property: workerProperty,
          rich_text: {
            equals: workerId
          }
        },
        {
          property: dateProperty,
          date: {
            equals: startDate
          }
        }
      ]
    }

    // Fetch pages from Notion database
    const response = await fetch(`https://api.notion.com/v1/databases/${scheduleDatabaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integrationSecret}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        filter,
      }),
    })

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.results || []
  }

  protected async fetchExternalTasks(
    workerId: string,
    config: PluginConfig
  ): Promise<unknown[]> {
    const { settings } = config
    const { 
      integrationSecret, 
      taskDatabaseId,
      workerProperty = 'Worker',
      dueDateProperty = 'Due Date'
    } = settings as {
      integrationSecret: string
      taskDatabaseId: string
      workerProperty?: string
      dueDateProperty?: string
    }

    if (!integrationSecret || !taskDatabaseId) {
      throw new Error('Notion integration secret and database ID are required')
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]

    // Build Notion filter for tasks due today or before for this worker
    const filter = {
      and: [
        {
          property: workerProperty,
          rich_text: {
            equals: workerId
          }
        },
        {
          property: dueDateProperty,
          date: {
            on_or_before: today
          }
        }
      ]
    }

    // Fetch pages from Notion database
    const response = await fetch(`https://api.notion.com/v1/databases/${taskDatabaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integrationSecret}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        filter,
      }),
    })

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.results || []
  }

  protected transformScheduleItem(externalItem: unknown): StandardScheduleItem | null {
    const page = externalItem as NotionPage
    const properties = page.properties
    
    // Extract property values (simplified - in production you'd handle different property types)
    const title = this.extractTextProperty(properties['Title'])
    const time = this.extractTextProperty(properties['Time'])
    const location = this.extractTextProperty(properties['Location'])
    const description = this.extractTextProperty(properties['Description'])
    const date = this.extractDateProperty(properties['Date']) || new Date().toISOString().split('T')[0]
    
    // Parse time and create datetime
    let startTime: string
    let endTime: string
    
    if (time && date) {
      startTime = `${date}T${time.padStart(5, '0')}:00`
      // Default to 1 hour duration if no end time specified
      const endDateTime = new Date(startTime)
      endDateTime.setHours(endDateTime.getHours() + 1)
      endTime = endDateTime.toISOString()
    } else {
      startTime = date || new Date().toISOString()
      endTime = startTime
    }

    return {
      id: page.id,
      title: title || 'Untitled Schedule',
      startTime,
      endTime,
      location,
      description,
      metadata: {
        source: 'notion',
        pageId: page.id,
        createdTime: page.created_time,
        // Store any Notion-specific data here
      },
    }
  }

  protected transformTaskItem(externalItem: unknown): StandardTaskItem | null {
    const page = externalItem as NotionPage
    const properties = page.properties
    
    const title = this.extractTextProperty(properties['Title'])
    const status = this.extractSelectProperty(properties['Status']) || 'todo'
    const priority = this.extractSelectProperty(properties['Priority']) || 'medium'
    const dueDate = this.extractDateProperty(properties['Due Date'])
    
    // Map Notion status to standard status
    let standardStatus: 'pending' | 'in_progress' | 'completed' = 'pending'
    if (status?.toLowerCase().includes('complete') || status?.toLowerCase().includes('done')) {
      standardStatus = 'completed'
    } else if (status?.toLowerCase().includes('progress') || status?.toLowerCase().includes('working')) {
      standardStatus = 'in_progress'
    }

    // Map Notion priority to standard priority
    let standardPriority: 'low' | 'medium' | 'high' = 'medium'
    if (priority?.toLowerCase().includes('high') || priority?.toLowerCase().includes('urgent')) {
      standardPriority = 'high'
    } else if (priority?.toLowerCase().includes('low')) {
      standardPriority = 'low'
    }

    return {
      id: page.id,
      title: title || 'Untitled Task',
      description: this.extractTextProperty(properties['Description']),
      dueDate,
      priority: standardPriority,
      status: standardStatus,
      metadata: {
        source: 'notion',
        pageId: page.id,
        createdTime: page.created_time,
        // Store any Notion-specific data here
      },
    }
  }

  async validateConfig(config: PluginConfig): Promise<ValidationResult> {
    const { settings } = config
    const { integrationSecret, scheduleDatabaseId } = settings as { 
      integrationSecret?: string
      scheduleDatabaseId?: string 
    }
    
    if (!integrationSecret || !scheduleDatabaseId) {
      return {
        valid: false,
        errors: ['Integration Secret and Database ID are required']
      }
    }

    try {
      // Test the integration secret by fetching database info
      const response = await fetch(`https://api.notion.com/v1/databases/${scheduleDatabaseId}`, {
        headers: {
          'Authorization': `Bearer ${integrationSecret}`,
          'Notion-Version': '2022-06-28',
        },
      })

      if (!response.ok) {
        return {
          valid: false,
          errors: ['Failed to connect to Notion']
        }
      }

      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Connection failed']
      }
    }
  }

  // Helper methods for extracting different Notion property types
  private extractTextProperty(property: unknown): string | undefined {
    if (!property || typeof property !== 'object') return undefined
    
    const prop = property as Record<string, unknown>
    if ((prop.type as string) === 'title' && (prop.title as Array<Record<string, unknown>>)?.[0]?.text) {
      return (((prop.title as Array<Record<string, unknown>>)[0].text as Record<string, unknown>).content as string)
    }
    if ((prop.type as string) === 'rich_text' && (prop.rich_text as Array<Record<string, unknown>>)?.[0]?.text) {
      return (((prop.rich_text as Array<Record<string, unknown>>)[0].text as Record<string, unknown>).content as string)
    }
    if ((prop.type as string) === 'text' && (prop.text as Record<string, unknown>)?.content) {
      return ((prop.text as Record<string, unknown>).content as string)
    }
    return undefined
  }

  private extractSelectProperty(property: unknown): string | undefined {
    if (!property || typeof property !== 'object') return undefined
    
    const prop = property as Record<string, unknown>
    if ((prop.type as string) === 'select' && (prop.select as Record<string, unknown>)?.name) {
      return ((prop.select as Record<string, unknown>).name as string)
    }
    return undefined
  }

  private extractDateProperty(property: unknown): string | undefined {
    if (!property || typeof property !== 'object') return undefined
    
    const prop = property as Record<string, unknown>
    if ((prop.type as string) === 'date' && ((prop.date as Record<string, unknown>)?.start as string)) {
      return ((prop.date as Record<string, unknown>).start as string)
    }
    return undefined
  }
}
