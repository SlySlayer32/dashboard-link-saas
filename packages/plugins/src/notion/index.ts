import { ScheduleItem, TaskItem } from '@dashboard-link/shared'
import { BaseAdapter } from '../base/adapter'

interface NotionPage {
  id: string
  created_time: string
  properties: Record<string, unknown>
}

/**
 * Notion Plugin Adapter
 * Fetches schedule and task data from Notion databases
 */
export class NotionAdapter extends BaseAdapter {
  id = 'notion'
  name = 'Notion'
  description = 'Sync schedules and tasks from Notion databases'
  version = '1.0.0'

  async getTodaySchedule(workerId: string, config: Record<string, unknown>): Promise<ScheduleItem[]> {
    try {
      const { 
        integrationSecret, 
        scheduleDatabaseId,
        workerProperty = 'Worker',
        dateProperty = 'Date',
        titleProperty = 'Title',
        timeProperty = 'Time',
        locationProperty = 'Location',
        descriptionProperty = 'Description'
      } = config as {
        integrationSecret: string
        scheduleDatabaseId: string
        workerProperty?: string
        dateProperty?: string
        titleProperty?: string
        timeProperty?: string
        locationProperty?: string
        descriptionProperty?: string
      }

      if (!integrationSecret || !scheduleDatabaseId) {
        throw new Error('Notion integration secret and database ID are required')
      }

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0]

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
              equals: today
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
      
      // Transform pages to ScheduleItem format
      return (data.results || []).map((page: NotionPage) => {
        const properties = page.properties
        
        // Extract property values (simplified - in production you'd handle different property types)
        const title = this.extractTextProperty(properties[titleProperty])
        const time = this.extractTextProperty(properties[timeProperty])
        const location = this.extractTextProperty(properties[locationProperty])
        const description = this.extractTextProperty(properties[descriptionProperty])
        const date = this.extractDateProperty(properties[dateProperty]) || today
        
        // Parse time and create datetime
        let startTime: string
        if (time && date) {
          startTime = `${date}T${time.padStart(5, '0')}:00`
        } else {
          startTime = date || new Date().toISOString()
        }

        return {
          id: page.id,
          title: title || 'Untitled Schedule',
          startTime,
          endTime: startTime, // Notion might not have end times
          location,
          description,
          type: 'schedule',
          source: 'notion',
          metadata: {
            pageId: page.id,
            databaseId: scheduleDatabaseId,
            workerId,
          },
        }
      })
    } catch (error) {
      console.error(`Error fetching Notion schedule for worker ${workerId}:`, error)
      return []
    }
  }

  async getTodayTasks(workerId: string, config: unknown): Promise<TaskItem[]> {
    try {
      const { 
        integrationSecret, 
        taskDatabaseId,
        workerProperty = 'Worker',
        dueDateProperty = 'Due Date',
        titleProperty = 'Title',
        statusProperty = 'Status',
        priorityProperty = 'Priority'
      } = config as {
        integrationSecret: string
        taskDatabaseId: string
        workerProperty?: string
        dueDateProperty?: string
        titleProperty?: string
        statusProperty?: string
        priorityProperty?: string
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
      
      // Transform pages to TaskItem format
      return (data.results || []).map((page: NotionPage) => {
        const properties = page.properties
        
        const title = this.extractTextProperty(properties[titleProperty])
        const status = this.extractSelectProperty(properties[statusProperty]) || 'todo'
        const priority = this.extractSelectProperty(properties[priorityProperty]) || 'medium'
        const dueDate = this.extractDateProperty(properties[dueDateProperty])
        
        return {
          id: page.id,
          title: title || 'Untitled Task',
          status,
          priority,
          dueDate,
          type: 'task',
          source: 'notion',
          metadata: {
            pageId: page.id,
            databaseId: taskDatabaseId,
            workerId,
          },
        }
      })
    } catch (error) {
      console.error(`Error fetching Notion tasks for worker ${workerId}:`, error)
      return []
    }
  }

  async validateConfig(config: unknown): Promise<boolean> {
    try {
      const { integrationSecret, scheduleDatabaseId } = config as { 
        integrationSecret?: string
        scheduleDatabaseId?: string 
      }
      
      if (!integrationSecret || !scheduleDatabaseId) {
        return false
      }

      // Test the integration secret by fetching database info
      const response = await fetch(`https://api.notion.com/v1/databases/${scheduleDatabaseId}`, {
        headers: {
          'Authorization': `Bearer ${integrationSecret}`,
          'Notion-Version': '2022-06-28',
        },
      })

      return response.ok
    } catch {
      return false
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
