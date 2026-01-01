import type {
    DateRange,
    PluginConfig,
    StandardScheduleItem,
    StandardTaskItem
} from '@dashboard-link/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BasePluginAdapter } from '../base/adapter'
import { NotionAdapter } from '../notion'

// Mock global fetch with proper typing
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('NotionAdapter', () => {
  let adapter: NotionAdapter

  beforeEach(() => {
    adapter = new NotionAdapter()
    vi.clearAllMocks()
  })

  describe('Plugin Identity', () => {
    it('should have correct plugin metadata', () => {
      expect(adapter.id).toBe('notion')
      expect(adapter.name).toBe('Notion')
      expect(adapter.version).toBe('1.0.0')
    })

    it('should extend BasePluginAdapter', () => {
      expect(adapter).toBeInstanceOf(BasePluginAdapter)
    })
  })

  describe('fetchExternalSchedule', () => {
    it('should fetch schedule pages from Notion database', async () => {
      const mockPages = [
        {
          id: 'page123',
          created_time: '2024-01-01T10:00:00Z',
          properties: {
            'Worker': { rich_text: [{ plain_text: 'worker-123' }] },
            'Date': { date: { start: '2024-01-01' } },
            'Start Time': { rich_text: [{ plain_text: '09:00' }] },
            'End Time': { rich_text: [{ plain_text: '17:00' }] },
            'Title': { title: [{ plain_text: 'Office Shift' }] },
            'Location': { rich_text: [{ plain_text: 'Main Office' }] },
            'Description': { rich_text: [{ plain_text: 'Regular work shift' }] }
          }
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: mockPages })
      })

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const config: PluginConfig = {
        id: 'notion-plugin',
        name: 'Notion Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          integrationSecret: 'secret123',
          scheduleDatabaseId: 'db123',
          workerProperty: 'Worker',
          dateProperty: 'Date'
        }
      }

      const result = await (adapter as any).fetchExternalSchedule('worker-123', dateRange, config)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.notion.com/v1/databases/db123/query'),
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer secret123',
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28'
          },
          body: expect.stringContaining('Worker')
        }
      )

      expect(result).toEqual(mockPages)
    })

    it('should use default property names', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] })
      })

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const config: PluginConfig = {
        id: 'notion-plugin',
        name: 'Notion Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          integrationSecret: 'secret123',
          scheduleDatabaseId: 'db123'
        }
      }

      await (adapter as any).fetchExternalSchedule('worker-123', dateRange, config)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('Worker')
        })
      )
    })

    it('should handle missing integration secret or database ID', async () => {
      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const config: PluginConfig = {
        id: 'notion-plugin',
        name: 'Notion Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          integrationSecret: 'secret123'
          // Missing scheduleDatabaseId
        }
      }

      await expect(
        (adapter as any).fetchExternalSchedule('worker-123', dateRange, config)
      ).rejects.toThrow('Notion integration secret and database ID are required')
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
        id: 'notion-plugin',
        name: 'Notion Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          integrationSecret: 'invalid-secret',
          scheduleDatabaseId: 'db123'
        }
      }

      await expect(
        (adapter as any).fetchExternalSchedule('worker-123', dateRange, config)
      ).rejects.toThrow('Notion API error: Unauthorized')
    })

    it('should properly construct filter with custom property names', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] })
      })

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const config: PluginConfig = {
        id: 'notion-plugin',
        name: 'Notion Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          integrationSecret: 'secret123',
          scheduleDatabaseId: 'db123',
          workerProperty: 'Employee ID',
          dateProperty: 'Schedule Date'
        }
      }

      await (adapter as any).fetchExternalSchedule('worker-123', dateRange, config)

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string) as {
  filter: {
    and: Array<{
      property: string;
      date?: { on_or_after?: string; on_or_before?: string };
    }>;
  };
}
      expect(requestBody.filter.and[0].property).toBe('Employee ID')
      expect(requestBody.filter.and[1].property).toBe('Schedule Date')
    })
  })

  describe('fetchExternalTasks', () => {
    it('should fetch task pages from Notion database', async () => {
      const mockPages = [
        {
          id: 'page456',
          created_time: '2024-01-01T10:00:00Z',
          properties: {
            'Worker': { rich_text: [{ plain_text: 'worker-123' }] },
            'Title': { title: [{ plain_text: 'Complete Report' }] },
            'Description': { rich_text: [{ plain_text: 'Monthly report' }] },
            'Due Date': { date: { start: '2024-01-01' } },
            'Priority': { select: { name: 'High' } },
            'Status': { select: { name: 'Pending' } }
          }
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: mockPages })
      })

      const config: PluginConfig = {
        id: 'notion-plugin',
        name: 'Notion Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          integrationSecret: 'secret123',
          tasksDatabaseId: 'task123',
          workerProperty: 'Worker'
        }
      }

      const result = await (adapter as any).fetchExternalTasks('worker-123', config)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.notion.com/v1/databases/db456/query'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer secret123',
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28'
          }
        })
      )

      expect(result).toEqual(mockPages)
    })

    it('should use default tasks database when not specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] })
      })

      const config: PluginConfig = {
        id: 'notion-plugin',
        name: 'Notion Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          integrationSecret: 'secret123',
          scheduleDatabaseId: 'db123'
        }
      }

      await (adapter as any).fetchExternalTasks('worker-123', config)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('databases/db123/query'),
        expect.any(Object)
      )
    })
  })

  describe('transformScheduleItem', () => {
    it('should transform Notion page to standard schedule format', () => {
      const externalPage = {
        id: 'page123',
        created_time: '2024-01-01T10:00:00Z',
        properties: {
          'Worker': { rich_text: [{ plain_text: 'worker-123' }] },
          'Date': { date: { start: '2024-01-01' } },
          'Start Time': { rich_text: [{ plain_text: '09:00' }] },
          'End Time': { rich_text: [{ plain_text: '17:00' }] },
          'Title': { title: [{ plain_text: 'Office Shift' }] },
          'Location': { rich_text: [{ plain_text: 'Main Office' }] },
          'Description': { rich_text: [{ plain_text: 'Regular work shift' }] }
        }
      }

      const result = (adapter as any).transformScheduleItem(externalPage)

      const expected: StandardScheduleItem = {
        id: 'page123',
        title: 'Office Shift',
        startTime: '2024-01-01T09:00:00Z',
        endTime: '2024-01-01T17:00:00Z',
        location: 'Main Office',
        description: 'Regular work shift',
        metadata: {
          notionPageId: 'page123',
          createdTime: '2024-01-01T10:00:00Z',
          workerId: 'worker-123'
        }
      }

      expect(result).toEqual(expected)
    })

    it('should handle page with missing optional properties', () => {
      const externalPage = {
        id: 'page123',
        created_time: '2024-01-01T10:00:00Z',
        properties: {
          'Worker': { rich_text: [{ plain_text: 'worker-123' }] },
          'Date': { date: { start: '2024-01-01' } },
          'Start Time': { rich_text: [{ plain_text: '09:00' }] },
          'End Time': { rich_text: [{ plain_text: '17:00' }] },
          'Title': { title: [{ plain_text: 'Office Shift' }] }
        }
      }

      const result = (adapter as any).transformScheduleItem(externalPage)

      expect(result).toEqual({
        id: 'page123',
        title: 'Office Shift',
        startTime: '2024-01-01T09:00:00Z',
        endTime: '2024-01-01T17:00:00Z',
        location: undefined,
        description: undefined,
        metadata: {
          notionPageId: 'page123',
          createdTime: '2024-01-01T10:00:00Z',
          workerId: 'worker-123'
        }
      })
    })

    it('should return null for invalid page', () => {
      const invalidPage = {
        id: 'page123',
        created_time: '2024-01-01T10:00:00Z',
        properties: {
          'Worker': { rich_text: [{ plain_text: 'worker-123' }] },
          'Date': { date: { start: '2024-01-01' } }
          // Missing Start Time and End Time
        }
      }

      const result = (adapter as any).transformScheduleItem(invalidPage)
      expect(result).toBeNull()
    })

    it('should handle page without title', () => {
      const externalPage = {
        id: 'page123',
        created_time: '2024-01-01T10:00:00Z',
        properties: {
          'Worker': { rich_text: [{ plain_text: 'worker-123' }] },
          'Date': { date: { start: '2024-01-01' } },
          'Start Time': { rich_text: [{ plain_text: '09:00' }] },
          'End Time': { rich_text: [{ plain_text: '17:00' }] }
        }
      }

      const result = (adapter as any).transformScheduleItem(externalPage)
      expect(result?.title).toBe('Untitled Schedule Item')
    })

    it('should handle missing worker in properties', () => {
      const externalPage = {
        id: 'page123',
        created_time: '2024-01-01T10:00:00Z',
        properties: {
          'Date': { date: { start: '2024-01-01' } },
          'Start Time': { rich_text: [{ plain_text: '09:00' }] },
          'End Time': { rich_text: [{ plain_text: '17:00' }] },
          'Title': { title: [{ plain_text: 'Office Shift' }] }
        }
      }

      const result = (adapter as any).transformScheduleItem(externalPage)
      expect(result?.metadata.workerId).toBeUndefined()
    })
  })

  describe('transformTaskItem', () => {
    it('should transform Notion page to standard task format', () => {
      const externalPage = {
        id: 'page456',
        created_time: '2024-01-01T10:00:00Z',
        properties: {
          'Worker': { rich_text: [{ plain_text: 'worker-123' }] },
          'Title': { title: [{ plain_text: 'Complete Report' }] },
          'Description': { rich_text: [{ plain_text: 'Monthly report' }] },
          'Due Date': { date: { start: '2024-01-01' } },
          'Priority': { select: { name: 'High' } },
          'Status': { select: { name: 'Pending' } }
        }
      }

      const result = (adapter as any).transformTaskItem(externalPage)

      const expected: StandardTaskItem = {
        id: 'page456',
        title: 'Complete Report',
        description: 'Monthly report',
        dueDate: '2024-01-01T00:00:00Z',
        priority: 'high',
        status: 'pending',
        metadata: {
          notionPageId: 'page456',
          createdTime: '2024-01-01T10:00:00Z',
          workerId: 'worker-123'
        }
      }

      expect(result).toEqual(expected)
    })

    it('should handle different priority values', () => {
      const testCases = [
        { priority: { name: 'High' }, expected: 'high' },
        { priority: { name: 'Medium' }, expected: 'medium' },
        { priority: { name: 'Low' }, expected: 'low' },
        { priority: { name: 'URGENT' }, expected: 'medium' }, // default
        { priority: undefined, expected: 'medium' } // default
      ]

      testCases.forEach(({ priority, expected }) => {
        const externalPage = {
          id: 'page456',
          created_time: '2024-01-01T10:00:00Z',
          properties: {
            'Worker': { rich_text: [{ plain_text: 'worker-123' }] },
            'Title': { title: [{ plain_text: 'Test Task' }] },
            'Priority': priority
          }
        }

        const result = (adapter as any).transformTaskItem(externalPage)
        expect(result?.priority).toBe(expected)
      })
    })

    it('should handle different status values', () => {
      const testCases = [
        { status: { name: 'Pending' }, expected: 'pending' },
        { status: { name: 'In Progress' }, expected: 'in_progress' },
        { status: { name: 'Completed' }, expected: 'completed' },
        { status: { name: 'Done' }, expected: 'pending' }, // default
        { status: undefined, expected: 'pending' } // default
      ]

      testCases.forEach(({ status, expected }) => {
        const externalPage = {
          id: 'page456',
          created_time: '2024-01-01T10:00:00Z',
          properties: {
            'Worker': { rich_text: [{ plain_text: 'worker-123' }] },
            'Title': { title: [{ plain_text: 'Test Task' }] },
            'Status': status
          }
        }

        const result = (adapter as any).transformTaskItem(externalPage)
        expect(result?.status).toBe(expected)
      })
    })

    it('should handle page with missing optional properties', () => {
      const externalPage = {
        id: 'page456',
        created_time: '2024-01-01T10:00:00Z',
        properties: {
          'Worker': { rich_text: [{ plain_text: 'worker-123' }] },
          'Title': { title: [{ plain_text: 'Simple Task' }] },
          'Priority': { select: { name: 'Medium' } },
          'Status': { select: { name: 'In Progress' } }
        }
      }

      const result = (adapter as any).transformTaskItem(externalPage)

      expect(result).toEqual({
        id: 'page456',
        title: 'Simple Task',
        description: undefined,
        dueDate: undefined,
        priority: 'medium',
        status: 'in_progress',
        metadata: {
          notionPageId: 'page456',
          createdTime: '2024-01-01T10:00:00Z',
          workerId: 'worker-123'
        }
      })
    })

    it('should return null for invalid page', () => {
      const invalidPage = {
        id: 'page456',
        created_time: '2024-01-01T10:00:00Z',
        properties: {
          'Worker': { rich_text: [{ plain_text: 'worker-123' }] }
          // Missing title
        }
      }

      const result = (adapter as any).transformTaskItem(invalidPage)
      expect(result).toBeNull()
    })
  })

  describe('validateConfig', () => {
    it('should validate config with required fields', async () => {
      const config: PluginConfig = {
        id: 'notion-plugin',
        name: 'Notion Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          integrationSecret: 'secret123',
          scheduleDatabaseId: 'db123'
        }
      }

      // Mock successful API calls
      mockFetch
        .mockResolvedValueOnce({ ok: true }) // Schedule database check
        .mockResolvedValueOnce({ ok: true }) // Tasks database check

      const result = await adapter.validateConfig(config)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should handle missing integration secret', async () => {
      const config: PluginConfig = {
        id: 'notion-plugin',
        name: 'Notion Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          scheduleDatabaseId: 'db123'
        }
      }

      const result = await adapter.validateConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Integration secret is required')
    })

    it('should handle missing database ID', async () => {
      const config: PluginConfig = {
        id: 'notion-plugin',
        name: 'Notion Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          integrationSecret: 'secret123'
        }
      }

      const result = await adapter.validateConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Schedule database ID is required')
    })

    it('should handle API connection errors', async () => {
      const config: PluginConfig = {
        id: 'notion-plugin',
        name: 'Notion Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          integrationSecret: 'invalid-secret',
          scheduleDatabaseId: 'db123'
        }
      }

      // Mock failed API call
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized'
      })

      const result = await adapter.validateConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Failed to connect to Notion')
    })

    it('should handle network errors', async () => {
      const config: PluginConfig = {
        id: 'notion-plugin',
        name: 'Notion Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          integrationSecret: 'secret123',
          scheduleDatabaseId: 'db123'
        }
      }

      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await adapter.validateConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Failed to connect to Notion')
    })
  })

  describe('getSchedule', () => {
    it('should return standardized schedule response', async () => {
      const mockPages = [
        {
          id: 'page123',
          created_time: '2024-01-01T10:00:00Z',
          properties: {
            'Worker': { rich_text: [{ plain_text: 'worker-123' }] },
            'Date': { date: { start: '2024-01-01' } },
            'Start Time': { rich_text: [{ plain_text: '09:00' }] },
            'End Time': { rich_text: [{ plain_text: '17:00' }] },
            'Title': { title: [{ plain_text: 'Office Shift' }] }
          }
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: mockPages })
      })

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const result = await adapter.getSchedule('worker-123', dateRange, {
        id: 'notion-plugin',
        name: 'Notion Plugin',
        version: '1.0.0',
        enabled: true,
        settings: { integrationSecret: 'secret123', scheduleDatabaseId: 'db123' }
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toBe('Office Shift')
      expect(result.metadata.source).toBe('notion')
      expect(result.metadata.version).toBe('1.0.0')
    })

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const result = await adapter.getSchedule('worker-123', dateRange, {
        id: 'notion-plugin',
        name: 'Notion Plugin',
        version: '1.0.0',
        enabled: true,
        settings: { integrationSecret: 'secret123', scheduleDatabaseId: 'db123' }
      })

      expect(result.success).toBe(false)
      expect(result.data).toEqual([])
      expect(result.errors).toHaveLength(1)
      expect(result.errors?.[0]?.code).toBe('PLUGIN_ERROR')
    })
  })

  describe('getTasks', () => {
    it('should return standardized tasks response', async () => {
      const mockPages = [
        {
          id: 'page456',
          created_time: '2024-01-01T10:00:00Z',
          properties: {
            'Worker': { rich_text: [{ plain_text: 'worker-123' }] },
            'Title': { title: [{ plain_text: 'Complete Report' }] },
            'Priority': { select: { name: 'High' } },
            'Status': { select: { name: 'Pending' } }
          }
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: mockPages })
      })

      const result = await adapter.getTasks('worker-123', {
        id: 'notion-plugin',
        name: 'Notion Plugin',
        version: '1.0.0',
        enabled: true,
        settings: { integrationSecret: 'secret123', scheduleDatabaseId: 'db123' }
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toBe('Complete Report')
      expect(result.metadata.source).toBe('notion')
    })

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      const result = await adapter.getTasks('worker-123', {
        id: 'notion-plugin',
        name: 'Notion Plugin',
        version: '1.0.0',
        enabled: true,
        settings: { integrationSecret: 'secret123', scheduleDatabaseId: 'db123' }
      })

      expect(result.success).toBe(false)
      expect(result.data).toEqual([])
      expect(result.errors).toHaveLength(1)
    })
  })
})
