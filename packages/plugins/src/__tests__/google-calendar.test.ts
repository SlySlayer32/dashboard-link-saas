import type {
    DateRange,
    PluginConfig,
    StandardScheduleItem
} from '@dashboard-link/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BasePluginAdapter } from '../base/adapter'
import { GoogleCalendarAdapter } from '../google-calendar'

// Mock global fetch with proper typing
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('GoogleCalendarAdapter', () => {
  let adapter: GoogleCalendarAdapter

  beforeEach(() => {
    adapter = new GoogleCalendarAdapter()
    vi.clearAllMocks()
  })

  describe('Plugin Identity', () => {
    it('should have correct plugin metadata', () => {
      expect(adapter.id).toBe('google-calendar')
      expect(adapter.name).toBe('Google Calendar')
      expect(adapter.version).toBe('1.0.0')
    })

    it('should extend BasePluginAdapter', () => {
      expect(adapter).toBeInstanceOf(BasePluginAdapter)
    })
  })

  describe('fetchExternalSchedule', () => {
    it('should fetch events from Google Calendar API', async () => {
      const mockEvents = [
        {
          id: 'event123',
          summary: 'Team Meeting',
          description: 'Weekly team sync',
          location: 'Conference Room A',
          start: { dateTime: '2024-01-01T10:00:00Z' },
          end: { dateTime: '2024-01-01T11:00:00Z' },
          htmlLink: 'https://calendar.google.com/event'
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockEvents })
      })

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const config: PluginConfig = {
        id: 'google-calendar-plugin',
        name: 'Google Calendar Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          calendarId: 'primary',
          accessToken: 'test-token'
        }
      }

      const result = await (adapter as any).fetchExternalSchedule('worker-123', dateRange, config)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://www.googleapis.com/calendar/v3/calendars/primary/events?'),
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }
        }
      )

      expect(result).toEqual(mockEvents)
    })

    it('should use default calendar ID when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] })
      })

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const config: PluginConfig = {
        id: 'google-calendar-plugin',
        name: 'Google Calendar Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          accessToken: 'test-token'
        }
      }

      await (adapter as any).fetchExternalSchedule('worker-123', dateRange, config)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('calendars/primary/events'),
        expect.any(Object)
      )
    })

    it('should handle missing access token', async () => {
      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const config: PluginConfig = {
        id: 'google-calendar-plugin',
        name: 'Google Calendar Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {}
      }

      await expect(
        (adapter as any).fetchExternalSchedule('worker-123', dateRange, config)
      ).rejects.toThrow('Google Calendar access token is required')
    })

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized'
      })

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const config: PluginConfig = {
        id: 'google-calendar-plugin',
        name: 'Google Calendar Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          accessToken: 'invalid-token'
        }
      }

      await expect(
        (adapter as any).fetchExternalSchedule('worker-123', dateRange, config)
      ).rejects.toThrow('Google Calendar API error: Unauthorized')
    })

    it('should handle empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      })

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const config: PluginConfig = {
        id: 'google-calendar-plugin',
        name: 'Google Calendar Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          accessToken: 'test-token'
        }
      }

      const result = await (adapter as any).fetchExternalSchedule('worker-123', dateRange, config)
      expect(result).toEqual([])
    })

    it('should properly encode calendar ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] })
      })

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const config: PluginConfig = {
        id: 'google-calendar-plugin',
        name: 'Google Calendar Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          calendarId: 'user@example.com',
          accessToken: 'test-token'
        }
      }

      await (adapter as any).fetchExternalSchedule('worker-123', dateRange, config)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('calendars/user%40example.com/events'),
        expect.any(Object)
      )
    })
  })

  describe('fetchExternalTasks', () => {
    it('should return empty array as Google Calendar does not support tasks', async () => {
      const result = await (adapter as any).fetchExternalTasks('worker-123', { enabled: true, settings: {} })
      expect(result).toEqual([])
    })
  })

  describe('transformScheduleItem', () => {
    it('should transform Google Calendar event to standard format', () => {
      const externalEvent = {
        id: 'event123',
        summary: 'Team Meeting',
        description: 'Weekly team sync',
        location: 'Conference Room A',
        start: { dateTime: '2024-01-01T10:00:00Z' },
        end: { dateTime: '2024-01-01T11:00:00Z' },
        htmlLink: 'https://calendar.google.com/event',
        attendees: [{ email: 'user@example.com' }]
      }

      const result = (adapter as any).transformScheduleItem(externalEvent)

      const expected: StandardScheduleItem = {
        id: 'event123',
        title: 'Team Meeting',
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T11:00:00Z',
        location: 'Conference Room A',
        description: 'Weekly team sync',
        metadata: {
          googleEventId: 'event123',
          htmlLink: 'https://calendar.google.com/event',
          attendees: [{ email: 'user@example.com' }]
        }
      }

      expect(result).toEqual(expected)
    })

    it('should handle all-day events', () => {
      const externalEvent = {
        id: 'event123',
        summary: 'All Day Event',
        start: { date: '2024-01-01' },
        end: { date: '2024-01-02' }
      }

      const result = (adapter as any).transformScheduleItem(externalEvent)

      expect(result).toEqual({
        id: 'event123',
        title: 'All Day Event',
        startTime: '2024-01-01',
        endTime: '2024-01-02',
        location: undefined,
        description: undefined,
        metadata: {
          googleEventId: 'event123'
        }
      })
    })

    it('should handle event with missing optional fields', () => {
      const externalEvent = {
        id: 'event123',
        summary: 'Simple Event',
        start: { dateTime: '2024-01-01T10:00:00Z' },
        end: { dateTime: '2024-01-01T11:00:00Z' }
      }

      const result = (adapter as any).transformScheduleItem(externalEvent)

      expect(result).toEqual({
        id: 'event123',
        title: 'Simple Event',
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T11:00:00Z',
        location: undefined,
        description: undefined,
        metadata: {
          googleEventId: 'event123'
        }
      })
    })

    it('should handle event without title', () => {
      const externalEvent = {
        id: 'event123',
        start: { dateTime: '2024-01-01T10:00:00Z' },
        end: { dateTime: '2024-01-01T11:00:00Z' }
      }

      const result = (adapter as any).transformScheduleItem(externalEvent)

      expect(result?.title).toBe('Untitled Event')
    })

    it('should return null for invalid event', () => {
      const invalidEvent = {
        id: 'event123',
        summary: 'Invalid Event'
        // Missing start and end
      }

      const result = (adapter as any).transformScheduleItem(invalidEvent)
      expect(result).toBeNull()
    })
  })

  describe('transformTaskItem', () => {
    it('should return null as Google Calendar does not support tasks', () => {
      const result = (adapter as any).transformTaskItem({})
      expect(result).toBeNull()
    })
  })

  describe('validateConfig', () => {
    it('should validate config with required fields', async () => {
      const config: PluginConfig = {
        id: 'google-calendar-plugin',
        name: 'Google Calendar Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          calendarId: 'primary',
          accessToken: 'test-token'
        }
      }

      // Mock successful API call
      mockFetch.mockResolvedValueOnce({
        ok: true
      })

      const result = await adapter.validateConfig(config)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should handle missing access token', async () => {
      const config: PluginConfig = {
        id: 'google-calendar-plugin',
        name: 'Google Calendar Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          calendarId: 'primary'
        }
      }

      const result = await adapter.validateConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Access token is required')
    })

    it('should handle API connection errors', async () => {
      const config: PluginConfig = {
        id: 'google-calendar-plugin',
        name: 'Google Calendar Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          calendarId: 'primary',
          accessToken: 'invalid-token'
        }
      }

      // Mock failed API call
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized'
      })

      const result = await adapter.validateConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Failed to connect to Google Calendar')
    })

    it('should handle network errors', async () => {
      const config: PluginConfig = {
        id: 'google-calendar-plugin',
        name: 'Google Calendar Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          calendarId: 'primary',
          accessToken: 'test-token'
        }
      }

      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await adapter.validateConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Failed to connect to Google Calendar')
    })
  })

  describe('getSchedule', () => {
    it('should return standardized schedule response', async () => {
      const mockEvents = [
        {
          id: 'event123',
          summary: 'Team Meeting',
          start: { dateTime: '2024-01-01T10:00:00Z' },
          end: { dateTime: '2024-01-01T11:00:00Z' }
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockEvents })
      })

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const result = await adapter.getSchedule('worker-123', dateRange, {
        id: 'google-calendar-plugin',
        name: 'Google Calendar Plugin',
        version: '1.0.0',
        enabled: true,
        settings: { accessToken: 'test-token' }
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toBe('Team Meeting')
      expect(result.metadata.source).toBe('google-calendar')
      expect(result.metadata.version).toBe('1.0.0')
    })

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const result = await adapter.getSchedule('worker-123', dateRange, {
        id: 'google-calendar-plugin',
        name: 'Google Calendar Plugin',
        version: '1.0.0',
        enabled: true,
        settings: { accessToken: 'test-token' }
      })

      expect(result.success).toBe(false)
      expect(result.data).toEqual([])
      expect(result.errors).toHaveLength(1)
      expect(result.errors?.[0]?.code).toBe('PLUGIN_ERROR')
    })
  })

  describe('getTasks', () => {
    it('should return empty tasks response', async () => {
      const result = await adapter.getTasks('worker-123', { 
        id: 'google-calendar-plugin',
        name: 'Google Calendar Plugin',
        version: '1.0.0',
        enabled: true, 
        settings: {} 
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
      expect(result.metadata.source).toBe('google-calendar')
    })
  })
})
