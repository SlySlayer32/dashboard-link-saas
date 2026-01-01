import type {
    DateRange,
    PluginConfig,
    StandardScheduleItem,
    StandardTaskItem,
    ValidationResult
} from '@dashboard-link/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BasePluginAdapter } from '../src/base/adapter'
import { ManualAdapter } from '../src/manual'

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lt: vi.fn(() => ({
              order: vi.fn(() => ({
                data: null,
                error: null
              }))
            }))
          }))
        })),
        lt: vi.fn(() => ({
          order: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      }))
    }))
  }))
}))

describe('ManualAdapter', () => {
  let adapter: ManualAdapter
  let mockSupabase: any

  beforeEach(() => {
    adapter = new ManualAdapter()
    // Get the mocked Supabase client
    const { createClient } = require('@supabase/supabase-js')
    mockSupabase = createClient()
  })

  describe('Plugin Identity', () => {
    it('should have correct plugin metadata', () => {
      expect(adapter.id).toBe('manual')
      expect(adapter.name).toBe('Manual Entry')
      expect(adapter.version).toBe('1.0.0')
    })

    it('should extend BasePluginAdapter', () => {
      expect(adapter).toBeInstanceOf(BasePluginAdapter)
    })
  })

  describe('fetchExternalSchedule', () => {
    it('should fetch schedule items for worker within date range', async () => {
      const mockScheduleData = [
        {
          id: '1',
          worker_id: 'worker-123',
          title: 'Test Shift',
          start_time: '2024-01-01T09:00:00Z',
          end_time: '2024-01-01T17:00:00Z',
          location: 'Office',
          description: 'Regular shift'
        }
      ]

      // Mock the Supabase chain
      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockScheduleData,
          error: null
        })
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockChain)
      })

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const result = await (adapter as any).fetchExternalSchedule(
        'worker-123',
        dateRange,
        { enabled: true, settings: {} }
      )

      expect(mockSupabase.from).toHaveBeenCalledWith('manual_schedule_items')
      expect(mockChain.eq).toHaveBeenCalledWith('worker_id', 'worker-123')
      expect(mockChain.gte).toHaveBeenCalledWith('start_time', dateRange.start)
      expect(mockChain.lt).toHaveBeenCalledWith('start_time', dateRange.end)
      expect(result).toEqual(mockScheduleData)
    })

    it('should handle database errors', async () => {
      const mockError = new Error('Database connection failed')

      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: mockError
        })
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockChain)
      })

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      await expect(
        (adapter as any).fetchExternalSchedule('worker-123', dateRange, { enabled: true, settings: {} })
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('fetchExternalTasks', () => {
    it('should fetch task items for worker for today', async () => {
      const mockTaskData = [
        {
          id: '1',
          worker_id: 'worker-123',
          title: 'Complete Report',
          description: 'Monthly report',
          due_date: '2024-01-01T17:00:00Z',
          priority: 'high',
          status: 'pending'
        }
      ]

      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockTaskData,
          error: null
        })
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockChain)
      })

      const result = await (adapter as any).fetchExternalTasks(
        'worker-123',
        { enabled: true, settings: {} }
      )

      expect(mockSupabase.from).toHaveBeenCalledWith('manual_task_items')
      expect(mockChain.eq).toHaveBeenCalledWith('worker_id', 'worker-123')
      expect(result).toEqual(mockTaskData)
    })
  })

  describe('transformScheduleItem', () => {
    it('should transform manual schedule item to standard format', () => {
      const externalItem = {
        id: '1',
        worker_id: 'worker-123',
        title: 'Test Shift',
        start_time: '2024-01-01T09:00:00Z',
        end_time: '2024-01-01T17:00:00Z',
        location: 'Office',
        description: 'Regular shift'
      }

      const result = (adapter as any).transformScheduleItem(externalItem)

      const expected: StandardScheduleItem = {
        id: '1',
        title: 'Test Shift',
        startTime: '2024-01-01T09:00:00Z',
        endTime: '2024-01-01T17:00:00Z',
        location: 'Office',
        description: 'Regular shift',
        metadata: {
          source: 'manual',
          workerId: 'worker-123'
        }
      }

      expect(result).toEqual(expected)
    })

    it('should handle item with missing optional fields', () => {
      const externalItem = {
        id: '1',
        worker_id: 'worker-123',
        title: 'Test Shift',
        start_time: '2024-01-01T09:00:00Z',
        end_time: '2024-01-01T17:00:00Z'
      }

      const result = (adapter as any).transformScheduleItem(externalItem)

      expect(result).toEqual({
        id: '1',
        title: 'Test Shift',
        startTime: '2024-01-01T09:00:00Z',
        endTime: '2024-01-01T17:00:00Z',
        location: undefined,
        description: undefined,
        metadata: {
          source: 'manual',
          workerId: 'worker-123'
        }
      })
    })

    it('should return null for invalid item', () => {
      const invalidItem = {
        id: '1',
        worker_id: 'worker-123',
        title: 'Test Shift'
        // Missing start_time and end_time
      }

      const result = (adapter as any).transformScheduleItem(invalidItem)
      expect(result).toBeNull()
    })
  })

  describe('transformTaskItem', () => {
    it('should transform manual task item to standard format', () => {
      const externalItem = {
        id: '1',
        worker_id: 'worker-123',
        title: 'Complete Report',
        description: 'Monthly report',
        due_date: '2024-01-01T17:00:00Z',
        priority: 'high',
        status: 'pending'
      }

      const result = (adapter as any).transformTaskItem(externalItem)

      const expected: StandardTaskItem = {
        id: '1',
        title: 'Complete Report',
        description: 'Monthly report',
        dueDate: '2024-01-01T17:00:00Z',
        priority: 'high',
        status: 'pending',
        metadata: {
          source: 'manual',
          workerId: 'worker-123'
        }
      }

      expect(result).toEqual(expected)
    })

    it('should handle item with missing optional fields', () => {
      const externalItem = {
        id: '1',
        worker_id: 'worker-123',
        title: 'Complete Report',
        priority: 'medium',
        status: 'in_progress'
      }

      const result = (adapter as any).transformTaskItem(externalItem)

      expect(result).toEqual({
        id: '1',
        title: 'Complete Report',
        description: undefined,
        dueDate: undefined,
        priority: 'medium',
        status: 'in_progress',
        metadata: {
          source: 'manual',
          workerId: 'worker-123'
        }
      })
    })

    it('should return null for invalid item', () => {
      const invalidItem = {
        id: '1',
        worker_id: 'worker-123'
        // Missing title
      }

      const result = (adapter as any).transformTaskItem(invalidItem)
      expect(result).toBeNull()
    })
  })

  describe('validateConfig', () => {
    it('should validate config successfully', async () => {
      const config: PluginConfig = {
        enabled: true,
        settings: {}
      }

      const result = await adapter.validateConfig(config)

      const expected: ValidationResult = {
        valid: true,
        errors: []
      }

      expect(result).toEqual(expected)
    })

    it('should validate config for any settings since manual plugin has no external dependencies', async () => {
      const config: PluginConfig = {
        enabled: true,
        settings: {
          anySetting: 'any-value'
        }
      }

      const result = await adapter.validateConfig(config)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })
  })

  describe('getSchedule', () => {
    it('should return standardized schedule response', async () => {
      const mockExternalData = [
        {
          id: '1',
          worker_id: 'worker-123',
          title: 'Test Shift',
          start_time: '2024-01-01T09:00:00Z',
          end_time: '2024-01-01T17:00:00Z',
          location: 'Office',
          description: 'Regular shift'
        }
      ]

      // Mock fetchExternalSchedule
      vi.spyOn(adapter as any, 'fetchExternalSchedule').mockResolvedValue(mockExternalData)

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const result = await adapter.getSchedule('worker-123', dateRange, { enabled: true, settings: {} })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toBe('Test Shift')
      expect(result.data[0].startTime).toBe('2024-01-01T09:00:00Z')
      expect(result.metadata.source).toBe('manual')
      expect(result.metadata.version).toBe('1.0.0')
    })

    it('should handle fetch errors gracefully', async () => {
      const mockError = new Error('Database connection failed')
      vi.spyOn(adapter as any, 'fetchExternalSchedule').mockRejectedValue(mockError)

      const dateRange: DateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      }

      const result = await adapter.getSchedule('worker-123', dateRange, { enabled: true, settings: {} })

      expect(result.success).toBe(false)
      expect(result.data).toEqual([])
      expect(result.errors).toHaveLength(1)
      expect(result.errors![0].code).toBe('PLUGIN_ERROR')
      expect(result.errors![0].message).toBe('Database connection failed')
      expect(result.errors![0].recoverable).toBe(true)
    })
  })

  describe('getTasks', () => {
    it('should return standardized tasks response', async () => {
      const mockExternalData = [
        {
          id: '1',
          worker_id: 'worker-123',
          title: 'Complete Report',
          description: 'Monthly report',
          due_date: '2024-01-01T17:00:00Z',
          priority: 'high',
          status: 'pending'
        }
      ]

      vi.spyOn(adapter as any, 'fetchExternalTasks').mockResolvedValue(mockExternalData)

      const result = await adapter.getTasks('worker-123', { enabled: true, settings: {} })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toBe('Complete Report')
      expect(result.data[0].priority).toBe('high')
      expect(result.metadata.source).toBe('manual')
    })

    it('should handle fetch errors gracefully', async () => {
      const mockError = new Error('Database connection failed')
      vi.spyOn(adapter as any, 'fetchExternalTasks').mockRejectedValue(mockError)

      const result = await adapter.getTasks('worker-123', { enabled: true, settings: {} })

      expect(result.success).toBe(false)
      expect(result.data).toEqual([])
      expect(result.errors).toHaveLength(1)
      expect(result.errors![0].code).toBe('PLUGIN_ERROR')
    })
  })
})
