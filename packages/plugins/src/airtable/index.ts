import { DateRange, PluginConfig, StandardScheduleItem, StandardTaskItem, ValidationResult } from '@dashboard-link/shared'
import { BasePluginAdapter } from '../base/adapter'

interface AirtableRecord {
  id: string
  createdTime: string
  fields: Record<string, unknown>
}

/**
 * Airtable Plugin Adapter
 * Fetches schedule and task data from Airtable bases
 */
export class AirtableAdapter extends BasePluginAdapter {
  readonly id = 'airtable'
  readonly name = 'Airtable'
  readonly version = '1.0.0'

  protected async fetchExternalSchedule(
    workerId: string,
    dateRange: DateRange,
    config: PluginConfig
  ): Promise<unknown[]> {
    const { settings } = config
    const { 
      apiKey, 
      baseId, 
      scheduleTable = 'Schedule',
      workerField = 'Worker',
      dateField = 'Date'
    } = settings as {
      apiKey: string
      baseId: string
      scheduleTable?: string
      workerField?: string
      dateField?: string
    }

    if (!apiKey || !baseId) {
      throw new Error('Airtable API key and base ID are required')
    }

    // Convert date range to Airtable format
    const startDate = new Date(dateRange.start).toISOString().split('T')[0]

    // Build Airtable formula to filter by worker and date range
    const filterFormula = `AND({${workerField}}='${workerId}', IS_SAME({${dateField}}, '${startDate}'))`

    // Fetch records from Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(scheduleTable)}?` +
      new URLSearchParams({
        filterByFormula: filterFormula,
      }),
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.records || []
  }

  protected async fetchExternalTasks(
    workerId: string,
    config: PluginConfig
  ): Promise<unknown[]> {
    const { settings } = config
    const { 
      apiKey, 
      baseId, 
      taskTable = 'Tasks',
      workerField = 'Worker',
      dueDateField = 'Due Date'
    } = settings as {
      apiKey: string
      baseId: string
      taskTable?: string
      workerField?: string
      dueDateField?: string
    }

    if (!apiKey || !baseId) {
      throw new Error('Airtable API key and base ID are required')
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]

    // Build Airtable formula to filter by worker and due date (today or before)
    const filterFormula = `AND({${workerField}}='${workerId}', OR(IS_BEFORE({${dueDateField}}, '${today}'), IS_SAME({${dueDateField}}, '${today}')))` 

    // Fetch records from Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(taskTable)}?` +
      new URLSearchParams({
        filterByFormula: filterFormula,
      }),
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.records || []
  }

  protected transformScheduleItem(externalItem: unknown): StandardScheduleItem | null {
    const record = externalItem as AirtableRecord
    const fields = record.fields
    
    // Extract field values from config - these should come from the config
    const timeStr = fields['Time'] as string
    const dateStr = fields['Date'] as string
    
    // Parse time and create datetime
    let startTime: string
    let endTime: string
    
    if (timeStr && dateStr) {
      startTime = `${dateStr}T${timeStr.padStart(5, '0')}:00`
      // Default to 1 hour duration if no end time specified
      const endDateTime = new Date(startTime)
      endDateTime.setHours(endDateTime.getHours() + 1)
      endTime = endDateTime.toISOString()
    } else {
      startTime = dateStr || new Date().toISOString()
      endTime = startTime
    }

    return {
      id: record.id,
      title: (fields['Title'] as string) || 'Untitled Schedule',
      startTime,
      endTime,
      location: fields['Location'] as string,
      description: fields['Description'] as string,
      metadata: {
        source: 'airtable',
        recordId: record.id,
        createdTime: record.createdTime,
        // Store any Airtable-specific data here
      },
    }
  }

  protected transformTaskItem(externalItem: unknown): StandardTaskItem | null {
    const record = externalItem as AirtableRecord
    const fields = record.fields
    
    // Map Airtable priority to standard priority
    let priority: 'low' | 'medium' | 'high' = 'medium'
    const airtablePriority = (fields['Priority'] as string)?.toLowerCase()
    if (airtablePriority?.includes('high') || airtablePriority?.includes('urgent')) {
      priority = 'high'
    } else if (airtablePriority?.includes('low')) {
      priority = 'low'
    }

    // Map Airtable status to standard status
    let status: 'pending' | 'in_progress' | 'completed' = 'pending'
    const airtableStatus = (fields['Status'] as string)?.toLowerCase()
    if (airtableStatus?.includes('complete') || airtableStatus?.includes('done')) {
      status = 'completed'
    } else if (airtableStatus?.includes('progress') || airtableStatus?.includes('working')) {
      status = 'in_progress'
    }

    return {
      id: record.id,
      title: (fields['Title'] as string) || 'Untitled Task',
      description: fields['Description'] as string,
      dueDate: fields['Due Date'] as string,
      priority,
      status,
      metadata: {
        source: 'airtable',
        recordId: record.id,
        createdTime: record.createdTime,
        // Store any Airtable-specific data here
      },
    }
  }

  async validateConfig(config: PluginConfig): Promise<ValidationResult> {
    const { settings } = config
    const { apiKey, baseId } = settings as { apiKey?: string; baseId?: string }
    
    if (!apiKey || !baseId) {
      return {
        valid: false,
        errors: ['API Key and Base ID are required']
      }
    }

    try {
      // Test the API key by fetching base metadata
      const response = await fetch(`https://api.airtable.com/v0/${baseId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })

      if (!response.ok) {
        return {
          valid: false,
          errors: ['Failed to connect to Airtable']
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
}
