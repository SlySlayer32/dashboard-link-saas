import { ScheduleItem, TaskItem } from '@dashboard-link/shared'
import { BaseAdapter } from '../base/adapter'

/**
 * Google Calendar Plugin Adapter
 * Fetches schedule data from Google Calendar API
 */
export class GoogleCalendarAdapter extends BaseAdapter {
  id = 'google-calendar'
  name = 'Google Calendar'
  description = 'Sync daily schedule from Google Calendar'
  version = '1.0.0'

  async getTodaySchedule(workerId: string, config: Record<string, unknown>): Promise<ScheduleItem[]> {
    try {
      const { accessToken, calendarId = 'primary' } = config as {
        accessToken: string
        calendarId?: string
      }

      if (!accessToken) {
        throw new Error('Google Calendar access token is required')
      }

      // Get today's date range
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

      // Fetch events from Google Calendar API
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
        new URLSearchParams({
          timeMin: startOfDay.toISOString(),
          timeMax: endOfDay.toISOString(),
          singleEvents: 'true',
          orderBy: 'startTime',
        }),
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Transform events to ScheduleItem format
      return (data.items || []).map((event: Record<string, unknown>) => ({
        id: (event.id as string) || '',
        title: (event.summary as string) || 'Untitled Event',
        startTime: ((event.start as Record<string, unknown>)?.dateTime as string) || ((event.start as Record<string, unknown>)?.date as string),
        endTime: ((event.end as Record<string, unknown>)?.dateTime as string) || ((event.end as Record<string, unknown>)?.date as string),
        location: event.location as string,
        description: event.description as string,
        type: 'calendar',
        source: 'google-calendar',
        metadata: {
          eventId: event.id as string,
          calendarId,
          workerId,
        },
      }))
    } catch (error) {
      console.error(`Error fetching Google Calendar for worker ${workerId}:`, error)
      return []
    }
  }

  async getTodayTasks(_workerId: string, _config: unknown): Promise<TaskItem[]> {
    // Google Calendar doesn't have tasks, return empty
    return []
  }

  async validateConfig(config: unknown): Promise<boolean> {
    try {
      const { accessToken } = config as { accessToken?: string }
      
      if (!accessToken) {
        return false
      }

      // Test the access token by making a simple API call
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      return response.ok
    } catch {
      return false
    }
  }
}
