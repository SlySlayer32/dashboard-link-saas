import { ScheduleItem, TaskItem } from '@dashboard-link/shared'
import { BaseAdapter } from '../base/adapter'

interface AirtableRecord {
  id: string
  createdTime: string
  fields: Record<string, unknown>
}

/**
 * Airtable Plugin Adapter
 * Fetches schedule and task data from Airtable bases
 */
export class AirtableAdapter extends BaseAdapter {
  id = 'airtable'
  name = 'Airtable'
  description = 'Sync schedules and tasks from Airtable'
  version = '1.0.0'

  async getTodaySchedule(workerId: string, config: Record<string, unknown>): Promise<ScheduleItem[]> {
    try {
      const { 
        apiKey, 
        baseId, 
        scheduleTable = 'Schedule',
        workerField = 'Worker',
        dateField = 'Date',
        titleField = 'Title',
        timeField = 'Time',
        locationField = 'Location',
        descriptionField = 'Description'
      } = config as {
        apiKey: string
        baseId: string
        scheduleTable?: string
        workerField?: string
        dateField?: string
        titleField?: string
        timeField?: string
        locationField?: string
        descriptionField?: string
      }

      if (!apiKey || !baseId) {
        throw new Error('Airtable API key and base ID are required')
      }

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0]

      // Build Airtable formula to filter by worker and today's date
      const filterFormula = `AND({${workerField}}='${workerId}', {${dateField}}='${today}')`

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
      
      // Transform records to ScheduleItem format
      return (data.records || []).map((record: AirtableRecord) => {
        const fields = record.fields
        const timeStr = fields[timeField] as string
        const dateStr = fields[dateField] as string
        
        // Parse time and create datetime
        let startTime: string
        if (timeStr && dateStr) {
          startTime = `${dateStr}T${timeStr.padStart(5, '0')}:00`
        } else {
          startTime = dateStr || new Date().toISOString()
        }

        return {
          id: record.id,
          title: (fields[titleField] as string) || 'Untitled Schedule',
          startTime,
          endTime: startTime, // Airtable might not have end times
          location: fields[locationField] as string,
          description: fields[descriptionField] as string,
          type: 'schedule',
          source: 'airtable',
          metadata: {
            recordId: record.id,
            baseId,
            tableId: scheduleTable,
            workerId,
          },
        }
      })
    } catch (error) {
      console.error(`Error fetching Airtable schedule for worker ${workerId}:`, error)
      return []
    }
  }

  async getTodayTasks(workerId: string, config: unknown): Promise<TaskItem[]> {
    try {
      const { 
        apiKey, 
        baseId, 
        taskTable = 'Tasks',
        workerField = 'Worker',
        dueDateField = 'Due Date',
        titleField = 'Title',
        statusField = 'Status',
        priorityField = 'Priority'
      } = config as {
        apiKey: string
        baseId: string
        taskTable?: string
        workerField?: string
        dueDateField?: string
        titleField?: string
        statusField?: string
        priorityField?: string
      }

      if (!apiKey || !baseId) {
        throw new Error('Airtable API key and base ID are required')
      }

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0]

      // Build Airtable formula to filter by worker and due date (today or before)
      const filterFormula = `AND({${workerField}}='${workerId}', IS_BEFORE({${dueDateField}}, '${today}'))`

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
      
      // Transform records to TaskItem format
      return (data.records || []).map((record: AirtableRecord) => {
        const fields = record.fields
        
        return {
          id: record.id,
          title: (fields[titleField] as string) || 'Untitled Task',
          status: (fields[statusField] as string) || 'todo',
          priority: (fields[priorityField] as string) || 'medium',
          dueDate: fields[dueDateField] as string,
          type: 'task',
          source: 'airtable',
          metadata: {
            recordId: record.id,
            baseId,
            tableId: taskTable,
            workerId,
          },
        }
      })
    } catch (error) {
      console.error(`Error fetching Airtable tasks for worker ${workerId}:`, error)
      return []
    }
  }

  async validateConfig(config: unknown): Promise<boolean> {
    try {
      const { apiKey, baseId } = config as { apiKey?: string; baseId?: string }
      
      if (!apiKey || !baseId) {
        return false
      }

      // Test the API key by fetching base metadata
      const response = await fetch(`https://api.airtable.com/v0/${baseId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })

      return response.ok
    } catch {
      return false
    }
  }
}
