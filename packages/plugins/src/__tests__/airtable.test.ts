import type {
    DateRange,
    PluginConfig,
    StandardScheduleItem,
    StandardTaskItem
} from '@dashboard-link/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AirtableAdapter } from '../airtable'
import { BasePluginAdapter } from '../base/adapter'

// Mock global fetch with proper typing
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('AirtableAdapter', () => {
  let adapter: AirtableAdapter

  beforeEach(() => {
    adapter = new AirtableAdapter()
    vi.clearAllMocks()
  })

  describe('Plugin Identity', () => {
    it('should have correct plugin metadata', () => {
      expect(adapter.id).toBe('airtable')
      expect(adapter.name).toBe('Airtable')
      expect(adapter.version).toBe('1.0.0')
    })

    it('should extend BasePluginAdapter', () => {
      expect(adapter).toBeInstanceOf(BasePluginAdapter)
    })
  })

  describe('fetchExternalSchedule', () => {
    it('should fetch schedule records from Airtable', async () => {
      const mockRecords = [
        {
          id: 'rec123',
          createdTime: '2024-01-01T10:00:00Z',
          fields: {
            'Worker': 'worker-123',
            'Date': '2024-01-01',
            'Start Time': '09:00',
            'End Time': '17:00',
            'Title': 'Office Shift',
            'Location': 'Main Office',
            'Description': 'Regular work shift'
          }
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: mockRecords })
      })

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const config: PluginConfig = {
        id: 'airtable-plugin',
        name: 'Airtable Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          apiKey: 'test-key',
          baseId: 'app123',
          scheduleTable: 'Schedule',
          workerField: 'Worker',
          dateField: 'Date'
        }
      }

      const result = await (adapter as any).fetchExternalSchedule('worker-123', dateRange, config)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.airtable.com/v0/app123/Schedule?'),
        {
          headers: {
            'Authorization': 'Bearer test-key',
            'Content-Type': 'application/json'
          }
        }
      )

      expect(result).toEqual(mockRecords)
    })

    it('should use default table and field names', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [] })
      })

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const config: PluginConfig = {
        id: 'airtable-plugin',
        name: 'Airtable Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          apiKey: 'test-key',
          baseId: 'app123'
        }
      }

      await (adapter as any).fetchExternalSchedule('worker-123', dateRange, config)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('Schedule'),
        expect.any(Object)
      )
    })

    it('should handle missing API key or base ID', async () => {
      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const config: PluginConfig = {
        id: 'airtable-plugin',
        name: 'Airtable Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          apiKey: 'test-key'
          // Missing baseId
        }
      }

      await expect(
        (adapter as any).fetchExternalSchedule('worker-123', dateRange, config)
      ).rejects.toThrow('Airtable API key and base ID are required')
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
        id: 'airtable-plugin',
        name: 'Airtable Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          apiKey: 'invalid-key',
          baseId: 'app123'
        }
      }

      await expect(
        (adapter as any).fetchExternalSchedule('worker-123', dateRange, config)
      ).rejects.toThrow('Airtable API error: Unauthorized')
    })

    it('should properly encode filter formula', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [] })
      })

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const config: PluginConfig = {
        id: 'airtable-plugin',
        name: 'Airtable Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          apiKey: 'test-key',
          baseId: 'app123',
          workerField: 'Worker ID',
          dateField: 'Schedule Date'
        }
      }

      await (adapter as any).fetchExternalSchedule('worker-123', dateRange, config)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('filterByFormula=AND(%7BWorker+ID%7D%3D%27worker-123%27%2C+IS_SAME(%7BSchedule+Date%7D%2C+%272024-01-01%27))'),
        expect.any(Object)
      )
    })
  })

  describe('fetchExternalTasks', () => {
    it('should fetch task records from Airtable', async () => {
      const mockRecords = [
        {
          id: 'rec456',
          createdTime: '2024-01-01T10:00:00Z',
          fields: {
            'Worker': 'worker-123',
            'Title': 'Complete Report',
            'Description': 'Monthly report',
            'Due Date': '2024-01-01',
            'Priority': 'High',
            'Status': 'Pending'
          }
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: mockRecords })
      })

      const config: PluginConfig = {
        id: 'airtable-plugin',
        name: 'Airtable Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          apiKey: 'test-key',
          baseId: 'app123',
          tasksTable: 'Tasks',
          workerField: 'Worker'
        }
      }

      const result = await (adapter as any).fetchExternalTasks('worker-123', config)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.airtable.com/v0/app123/Tasks?'),
        {
          headers: {
            'Authorization': 'Bearer test-key',
            'Content-Type': 'application/json'
          }
        }
      )

      expect(result).toEqual(mockRecords)
    })

    it('should use default tasks table name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [] })
      })

      const config: PluginConfig = {
        id: 'airtable-plugin',
        name: 'Airtable Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          apiKey: 'test-key',
          baseId: 'app123'
        }
      }

      await (adapter as any).fetchExternalTasks('worker-123', config)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('Tasks'),
        expect.any(Object)
      )
    })
  })

  describe('transformScheduleItem', () => {
    it('should transform Airtable record to standard schedule format', () => {
      const externalRecord = {
        id: 'rec123',
        createdTime: '2024-01-01T10:00:00Z',
        fields: {
          'Worker': 'worker-123',
          'Date': '2024-01-01',
          'Start Time': '09:00',
          'End Time': '17:00',
          'Title': 'Office Shift',
          'Location': 'Main Office',
          'Description': 'Regular work shift'
        }
      }

      const result = (adapter as any).transformScheduleItem(externalRecord)

      const expected: StandardScheduleItem = {
        id: 'rec123',
        title: 'Office Shift',
        startTime: '2024-01-01T09:00:00Z',
        endTime: '2024-01-01T17:00:00Z',
        location: 'Main Office',
        description: 'Regular work shift',
        metadata: {
          airtableRecordId: 'rec123',
          createdTime: '2024-01-01T10:00:00Z',
          workerId: 'worker-123'
        }
      }

      expect(result).toEqual(expected)
    })

    it('should handle record with missing optional fields', () => {
      const externalRecord = {
        id: 'rec123',
        createdTime: '2024-01-01T10:00:00Z',
        fields: {
          'Worker': 'worker-123',
          'Date': '2024-01-01',
          'Start Time': '09:00',
          'End Time': '17:00',
          'Title': 'Office Shift'
        }
      }

      const result = (adapter as any).transformScheduleItem(externalRecord)

      expect(result).toEqual({
        id: 'rec123',
        title: 'Office Shift',
        startTime: '2024-01-01T09:00:00Z',
        endTime: '2024-01-01T17:00:00Z',
        location: undefined,
        description: undefined,
        metadata: {
          airtableRecordId: 'rec123',
          createdTime: '2024-01-01T10:00:00Z',
          workerId: 'worker-123'
        }
      })
    })

    it('should return null for invalid record', () => {
      const invalidRecord = {
        id: 'rec123',
        createdTime: '2024-01-01T10:00:00Z',
        fields: {
          'Worker': 'worker-123',
          'Date': '2024-01-01'
          // Missing Start Time and End Time
        }
      }

      const result = (adapter as any).transformScheduleItem(invalidRecord)
      expect(result).toBeNull()
    })

    it('should handle record without title', () => {
      const externalRecord = {
        id: 'rec123',
        createdTime: '2024-01-01T10:00:00Z',
        fields: {
          'Worker': 'worker-123',
          'Date': '2024-01-01',
          'Start Time': '09:00',
          'End Time': '17:00'
        }
      }

      const result = (adapter as any).transformScheduleItem(externalRecord)
      expect(result?.title).toBe('Untitled Schedule Item')
    })
  })

  describe('transformTaskItem', () => {
    it('should transform Airtable record to standard task format', () => {
      const externalRecord = {
        id: 'rec456',
        createdTime: '2024-01-01T10:00:00Z',
        fields: {
          'Worker': 'worker-123',
          'Title': 'Complete Report',
          'Description': 'Monthly report',
          'Due Date': '2024-01-01',
          'Priority': 'High',
          'Status': 'Pending'
        }
      }

      const result = (adapter as any).transformTaskItem(externalRecord)

      const expected: StandardTaskItem = {
        id: 'rec456',
        title: 'Complete Report',
        description: 'Monthly report',
        dueDate: '2024-01-01T00:00:00Z',
        priority: 'high',
        status: 'pending',
        metadata: {
          airtableRecordId: 'rec456',
          createdTime: '2024-01-01T10:00:00Z',
          workerId: 'worker-123'
        }
      }

      expect(result).toEqual(expected)
    })

    it('should handle different priority values', () => {
      const testCases = [
        { priority: 'High', expected: 'high' },
        { priority: 'Medium', expected: 'medium' },
        { priority: 'Low', expected: 'low' },
        { priority: 'URGENT', expected: 'medium' }, // default
        { priority: undefined, expected: 'medium' } // default
      ]

      testCases.forEach(({ priority, expected }) => {
        const externalRecord = {
          id: 'rec456',
          createdTime: '2024-01-01T10:00:00Z',
          fields: {
            'Worker': 'worker-123',
            'Title': 'Test Task',
            'Priority': priority
          }
        }

        const result = (adapter as any).transformTaskItem(externalRecord)
        expect(result?.priority).toBe(expected)
      })
    })

    it('should handle different status values', () => {
      const testCases = [
        { status: 'Pending', expected: 'pending' },
        { status: 'In Progress', expected: 'in_progress' },
        { status: 'Completed', expected: 'completed' },
        { status: 'Done', expected: 'pending' }, // default
        { status: undefined, expected: 'pending' } // default
      ]

      testCases.forEach(({ status, expected }) => {
        const externalRecord = {
          id: 'rec456',
          createdTime: '2024-01-01T10:00:00Z',
          fields: {
            'Worker': 'worker-123',
            'Title': 'Test Task',
            'Status': status
          }
        }

        const result = (adapter as any).transformTaskItem(externalRecord)
        expect(result?.status).toBe(expected)
      })
    })

    it('should handle record with missing optional fields', () => {
      const externalRecord = {
        id: 'rec456',
        createdTime: '2024-01-01T10:00:00Z',
        fields: {
          'Worker': 'worker-123',
          'Title': 'Simple Task',
          'Priority': 'Medium',
          'Status': 'In Progress'
        }
      }

      const result = (adapter as any).transformTaskItem(externalRecord)

      expect(result).toEqual({
        id: 'rec456',
        title: 'Simple Task',
        description: undefined,
        dueDate: undefined,
        priority: 'medium',
        status: 'in_progress',
        metadata: {
          airtableRecordId: 'rec456',
          createdTime: '2024-01-01T10:00:00Z',
          workerId: 'worker-123'
        }
      })
    })

    it('should return null for invalid record', () => {
      const invalidRecord = {
        id: 'rec456',
        createdTime: '2024-01-01T10:00:00Z',
        fields: {
          'Worker': 'worker-123'
          // Missing title
        }
      }

      const result = (adapter as any).transformTaskItem(invalidRecord)
      expect(result).toBeNull()
    })
  })

  describe('validateConfig', () => {
    it('should validate config with required fields', async () => {
      const config: PluginConfig = {
        id: 'airtable-plugin',
        name: 'Airtable Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          apiKey: 'test-key',
          baseId: 'app123'
        }
      }

      // Mock successful API calls
      mockFetch
        .mockResolvedValueOnce({ ok: true }) // Schedule table check
        .mockResolvedValueOnce({ ok: true }) // Tasks table check

      const result = await adapter.validateConfig(config)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should handle missing API key', async () => {
      const config: PluginConfig = {
        id: 'airtable-plugin',
        name: 'Airtable Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          baseId: 'app123'
        }
      }

      const result = await adapter.validateConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('API key is required')
    })

    it('should handle missing base ID', async () => {
      const config: PluginConfig = {
        id: 'airtable-plugin',
        name: 'Airtable Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          apiKey: 'test-key'
        }
      }

      const result = await adapter.validateConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Base ID is required')
    })

    it('should handle API connection errors', async () => {
      const config: PluginConfig = {
        id: 'airtable-plugin',
        name: 'Airtable Plugin',
        version: '1.0.0',
        enabled: true,
        settings: {
          apiKey: 'invalid-key',
          baseId: 'app123'
        }
      }

      // Mock failed API call
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized'
      })

      const result = await adapter.validateConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Failed to connect to Airtable')
    })
  })

  describe('getSchedule', () => {
    it('should return standardized schedule response', async () => {
      const mockRecords = [
        {
          id: 'rec123',
          createdTime: '2024-01-01T10:00:00Z',
          fields: {
            'Worker': 'worker-123',
            'Date': '2024-01-01',
            'Start Time': '09:00',
            'End Time': '17:00',
            'Title': 'Office Shift'
          }
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: mockRecords })
      })

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const result = await adapter.getSchedule('worker-123', dateRange, {
        id: 'airtable-plugin',
        name: 'Airtable Plugin',
        version: '1.0.0',
        enabled: true,
        settings: { apiKey: 'test-key', baseId: 'app123' }
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toBe('Office Shift')
      expect(result.metadata.source).toBe('airtable')
      expect(result.metadata.version).toBe('1.0.0')
    })

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const result = await adapter.getSchedule('worker-123', dateRange, {
        id: 'airtable-plugin',
        name: 'Airtable Plugin',
        version: '1.0.0',
        enabled: true,
        settings: { apiKey: 'test-key', baseId: 'app123' }
      })

      expect(result.success).toBe(false)
      expect(result.data).toEqual([])
      expect(result.errors).toHaveLength(1)
      expect(result.errors?.[0]?.code).toBe('PLUGIN_ERROR')
    })
  })

  describe('getTasks', () => {
    it('should return standardized tasks response', async () => {
      const mockRecords = [
        {
          id: 'rec456',
          createdTime: '2024-01-01T10:00:00Z',
          fields: {
            'Worker': 'worker-123',
            'Title': 'Complete Report',
            'Priority': 'High',
            'Status': 'Pending'
          }
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: mockRecords })
      })

      const result = await adapter.getTasks('worker-123', {
        id: 'airtable-plugin',
        name: 'Airtable Plugin',
        version: '1.0.0',
        enabled: true,
        settings: { apiKey: 'test-key', baseId: 'app123' }
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toBe('Complete Report')
      expect(result.metadata.source).toBe('airtable')
    })

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      const result = await adapter.getTasks('worker-123', {
        id: 'airtable-plugin',
        name: 'Airtable Plugin',
        version: '1.0.0',
        enabled: true,
        settings: { apiKey: 'test-key', baseId: 'app123' }
      })

      expect(result.success).toBe(false)
      expect(result.data).toEqual([])
      expect(result.errors).toHaveLength(1)
    })
  })
})
