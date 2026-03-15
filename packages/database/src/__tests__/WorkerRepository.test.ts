/**
 * WorkerRepository Unit Tests (T075)
 *
 * Tests for WorkerRepository methods:
 * - findByOrganizationId (filters deleted workers)
 * - findByPhoneActive (active workers only)
 * - softDelete (sets deletedAt)
 * - transformFromDB (includes deletedAt field)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Worker } from '@dashboard-link/shared'
import { WorkerRepository } from '../repositories/WorkerRepository'
import type { DatabaseAdapter } from '../adapters/DatabaseAdapter'

// Mock DatabaseAdapter
const createMockAdapter = (): DatabaseAdapter => {
  const mockQuery = {
    where: vi.fn().mockReturnThis(),
    first: vi.fn(),
    build: vi.fn(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  }

  return {
    query: vi.fn(() => mockQuery),
    transaction: vi.fn(),
    raw: vi.fn(),
  } as any
}

describe('WorkerRepository', () => {
  let repository: WorkerRepository
  let mockAdapter: DatabaseAdapter
  let mockQuery: any

  const mockOrgId = 'org-123'
  const mockWorkerId = 'worker-456'

  const createMockWorkerRow = (overrides = {}): any => ({
    id: mockWorkerId,
    name: 'John Smith',
    phone: '+61412345678',
    email: 'john@example.com',
    organization_id: mockOrgId,
    active: true,
    deleted_at: null,
    metadata: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  })

  beforeEach(() => {
    mockAdapter = createMockAdapter()
    mockQuery = mockAdapter.query('workers')
    repository = new WorkerRepository(mockAdapter)
  })

  describe('findByOrganizationId', () => {
    it('should filter out deleted workers (deletedAt IS NULL)', async () => {
      const activeWorker = createMockWorkerRow()
      const deletedWorker = createMockWorkerRow({
        id: 'worker-789',
        deleted_at: '2024-01-15T00:00:00Z',
      })

      mockQuery.build.mockResolvedValue([activeWorker])

      const result = await repository.findByOrganizationId(mockOrgId)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(mockWorkerId)
      expect(result[0].deletedAt).toBeNull()
    })

    it('should only return workers for specified organization', async () => {
      const worker1 = createMockWorkerRow({ organization_id: mockOrgId })
      mockQuery.build.mockResolvedValue([worker1])

      const result = await repository.findByOrganizationId(mockOrgId)

      expect(result).toHaveLength(1)
      expect(result[0].organizationId).toBe(mockOrgId)
    })

    it('should return empty array when no active workers exist', async () => {
      mockQuery.build.mockResolvedValue([])

      const result = await repository.findByOrganizationId(mockOrgId)

      expect(result).toEqual([])
    })

    it('should order workers by createdAt desc', async () => {
      const worker1 = createMockWorkerRow({ created_at: '2024-01-01T00:00:00Z' })
      const worker2 = createMockWorkerRow({
        id: 'worker-789',
        created_at: '2024-01-02T00:00:00Z',
      })

      mockQuery.build.mockResolvedValue([worker2, worker1])

      const result = await repository.findByOrganizationId(mockOrgId)

      expect(result).toHaveLength(2)
      // Most recent first
      expect(result[0].createdAt).toBe('2024-01-02T00:00:00Z')
      expect(result[1].createdAt).toBe('2024-01-01T00:00:00Z')
    })
  })

  describe('findByPhoneActive', () => {
    it('should find active worker by phone and organization', async () => {
      const worker = createMockWorkerRow()
      mockQuery.build.mockResolvedValue([worker])

      const result = await repository.findByPhoneActive('+61412345678', mockOrgId)

      expect(result).not.toBeNull()
      expect(result?.phone).toBe('+61412345678')
      expect(result?.organizationId).toBe(mockOrgId)
      expect(result?.deletedAt).toBeNull()
    })

    it('should return null for deleted worker with same phone', async () => {
      mockQuery.build.mockResolvedValue([])

      const result = await repository.findByPhoneActive('+61412345678', mockOrgId)

      expect(result).toBeNull()
    })

    it('should return null when phone not found', async () => {
      mockQuery.build.mockResolvedValue([])

      const result = await repository.findByPhoneActive('+61499999999', mockOrgId)

      expect(result).toBeNull()
    })

    it('should only match active workers (deletedAt IS NULL)', async () => {
      // Deleted worker should not be returned
      mockQuery.build.mockResolvedValue([])

      const result = await repository.findByPhoneActive('+61412345678', mockOrgId)

      expect(result).toBeNull()
    })
  })

  describe('softDelete', () => {
    it('should set deletedAt timestamp without removing record', async () => {
      const worker = createMockWorkerRow()
      mockQuery.first.mockResolvedValue(worker)

      // Mock the update call
      const updateSpy = vi.spyOn(repository, 'update')
      updateSpy.mockResolvedValue({
        ...worker,
        deleted_at: expect.any(String),
      } as any)

      await repository.softDelete(mockWorkerId)

      expect(updateSpy).toHaveBeenCalledWith(
        mockWorkerId,
        expect.objectContaining({
          deletedAt: expect.any(String),
        })
      )
    })

    it('should throw error for invalid worker ID', async () => {
      await expect(repository.softDelete('')).rejects.toThrow()
    })

    it('should preserve all other worker data when soft deleting', async () => {
      const worker = createMockWorkerRow()
      mockQuery.first.mockResolvedValue(worker)

      const updateSpy = vi.spyOn(repository, 'update')
      updateSpy.mockResolvedValue({
        ...worker,
        deleted_at: '2024-01-15T00:00:00Z',
      } as any)

      await repository.softDelete(mockWorkerId)

      // Verify only deletedAt is updated
      expect(updateSpy).toHaveBeenCalledWith(
        mockWorkerId,
        expect.objectContaining({
          deletedAt: expect.any(String),
        })
      )
    })
  })

  describe('transformFromDB', () => {
    it('should include deletedAt field in transformation', () => {
      const dbRow = createMockWorkerRow({ deleted_at: '2024-01-15T00:00:00Z' })

      const result = (repository as any).transformFromDB(dbRow)

      expect(result).toHaveProperty('deletedAt')
      expect(result.deletedAt).toBe('2024-01-15T00:00:00Z')
    })

    it('should handle null deletedAt (active worker)', () => {
      const dbRow = createMockWorkerRow({ deleted_at: null })

      const result = (repository as any).transformFromDB(dbRow)

      expect(result).toHaveProperty('deletedAt')
      expect(result.deletedAt).toBeNull()
    })

    it('should transform snake_case to camelCase correctly', () => {
      const dbRow = createMockWorkerRow()

      const result = (repository as any).transformFromDB(dbRow)

      expect(result).toHaveProperty('organizationId')
      expect(result).toHaveProperty('createdAt')
      expect(result).toHaveProperty('updatedAt')
      expect(result).toHaveProperty('deletedAt')
      expect(result.organizationId).toBe(mockOrgId)
    })

    it('should preserve all worker fields', () => {
      const dbRow = createMockWorkerRow()

      const result: Worker = (repository as any).transformFromDB(dbRow)

      expect(result.id).toBe(mockWorkerId)
      expect(result.name).toBe('John Smith')
      expect(result.phone).toBe('+61412345678')
      expect(result.email).toBe('john@example.com')
      expect(result.organizationId).toBe(mockOrgId)
      expect(result.active).toBe(true)
      expect(result.metadata).toEqual({})
    })

    it('should throw error for null or undefined input', () => {
      expect(() => (repository as any).transformFromDB(null)).toThrow()
      expect(() => (repository as any).transformFromDB(undefined)).toThrow()
    })
  })

  describe('transformToDB', () => {
    it('should transform camelCase to snake_case', () => {
      const worker: Partial<Worker> = {
        organizationId: mockOrgId,
        deletedAt: '2024-01-15T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const result = (repository as any).transformToDB(worker)

      expect(result).toHaveProperty('organization_id')
      expect(result).toHaveProperty('deleted_at')
      expect(result).toHaveProperty('created_at')
      expect(result).toHaveProperty('updated_at')
    })

    it('should handle partial worker data', () => {
      const worker: Partial<Worker> = {
        name: 'Jane Doe',
        phone: '+61423456789',
      }

      const result = (repository as any).transformToDB(worker)

      expect(result.name).toBe('Jane Doe')
      expect(result.phone).toBe('+61423456789')
      expect(result).not.toHaveProperty('organization_id')
    })
  })
})
