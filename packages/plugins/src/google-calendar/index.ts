import { DateRange, PluginConfig, StandardScheduleItem, StandardTaskItem, ValidationResult } from '@dashboard-link/shared'
import { BasePluginAdapter } from '../base/adapter'

/**
 * Google Calendar Plugin Adapter
 * Fetches schedule data from Google Calendar API
 */
export class GoogleCalendarAdapter extends BasePluginAdapter {
  readonly id = 'google-calendar'
  readonly name = 'Google Calendar'
  readonly version = '1.0.0'

  protected async fetchExternalSchedule(
    _workerId: string,
    dateRange: DateRange,
    config: PluginConfig
  ): Promise<unknown[]> {
    const { settings } = config
    const { calendarId = 'primary', accessToken } = settings as {
      calendarId?: string
      accessToken?: string
    }

    if (!accessToken) {
      throw new Error('Google Calendar access token is required')
    }

    // Fetch events from Google Calendar API
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
      new URLSearchParams({
        timeMin: dateRange.start,
        timeMax: dateRange.end,
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
    return data.items || []
  }

  protected async fetchExternalTasks(
    _workerId: string,
    _config: PluginConfig
  ): Promise<unknown[]> {
    // Google Calendar doesn't have tasks, return empty
    return []
  }

  protected transformScheduleItem(externalItem: unknown): StandardScheduleItem | null {
    const event = externalItem as {
      id?: string
      summary?: string
      start?: {
        dateTime?: string
        date?: string
      }
      end?: {
        dateTime?: string
        date?: string
      }
      location?: string
      description?: string
      htmlLink?: string
      attendees?: Array<{
        email?: string
        responseStatus?: string
      }>
      status?: string
    }

    // Skip events without proper time data
    if (!event.start || !event.end) {
      return null
    }

    return {
      id: event.id || '',
      title: event.summary || 'Untitled Event',
      startTime: event.start.dateTime || event.start.date || '',
      endTime: event.end.dateTime || event.end.date || '',
      location: event.location,
      description: event.description,
      metadata: {
        source: 'google-calendar',
        googleEventId: event.id,
        htmlLink: event.htmlLink,
        attendees: event.attendees,
        status: event.status,
        // Store any Google-specific data here
      },
    }
  }

  protected transformTaskItem(_externalItem: unknown): StandardTaskItem | null {
    // Google Calendar doesn't have tasks
    return null
  }

  async validateConfig(config: PluginConfig): Promise<ValidationResult> {
    const { settings } = config
    const { calendarId, accessToken } = settings as {
      calendarId?: string
      accessToken?: string
    }

    if (!calendarId || !accessToken) {
      return {
        valid: false,
        errors: ['Calendar ID and Access Token are required']
      }
    }

    try {
      // Test the access token by making a simple API call
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        return {
          valid: false,
          errors: ['Failed to connect to Google Calendar']
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
