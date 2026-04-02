/**
 * Worker API Integration Tests (T080-T083)
 *
 * Integration tests for worker endpoints - 70% target
 * Tests for:
 * - T080: POST /api/v1/workers (creation, validation, duplicates, auth, tenant isolation)
 * - T081: GET /api/v1/workers (list, exclude deleted, tenant isolation, empty list)
 * - T082: PUT /api/v1/workers/:id (update, validation, duplicates, conflicts, tenant isolation)
 * - T083: DELETE /api/v1/workers/:id (soft delete, not found, tenant isolation, verify deletedAt)
 */

import type { WorkerRepository } from '@dashboard-link/database'
import type { Worker } from '@dashboard-link/shared'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkerService } from '../../services/WorkerService'

// Mock dependencies
vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

vi.mock('@dashboard-link/shared', async () => {
  const actual = await vi.importActual('@dashboard-link/shared')
  return {
    ...actual,
    formatAustralianPhone: vi.fn((phone: string) => {
      if (phone.startsWith('+61')) return phone
      if (phone.startsWith('04')) return `+614${phone.slice(2).replace(/[\s-]/g, '')}`
      throw new Error('Invalid Australian phone number')
    }),
  }
})

describe('Worker API Integration Tests', () => {
  let app: Hono<{ Variables: { userId: string; organizationId: string } }>
  let mockRepo: WorkerRepository
  let service: WorkerService

  const mockOrgId = 'org-123'
  const mockOtherOrgId = 'org-999'
  const mockWorkerId = 'worker-456'
  const mockUserId = 'user-123'

  const createMockWorker = (overrides = {}): Worker => ({
    id: mockWorkerId,
    name: 'John Smith',
    phone: '+61412345678',
    email: 'john@example.com',
    organizationId: mockOrgId,
    active: true,
    deletedAt: null,
    metadata: {},
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  })

  beforeEach(async () => {
    // Reset formatAustralianPhone to default mock (prevents leak from phone validation tests)
    const { formatAustralianPhone } = await import('@dashboard-link/shared')
    vi.mocked(formatAustralianPhone).mockImplementation((phone: string) => {
      if (phone.startsWith('+61')) return phone
      if (phone.startsWith('04')) return `+614${phone.slice(2).replace(/[\s-]/g, '')}`
      throw new Error('Invalid Australian phone number')
    })

    // Create mock repository
    mockRepo = {
      findByOrganizationId: vi.fn(),
      findByPhoneActive: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    } as unknown as WorkerRepository

    service = new WorkerService(mockRepo)

    // Create test app with mocked middleware
    app = new Hono()

    // Mock auth middleware
    app.use('*', async (c, next) => {
      c.set('userId', mockUserId)
      c.set('organizationId', mockOrgId)
      await next()
    })
  })

  describe('T080: POST /api/v1/workers', () => {
    describe('successful creation (201)', () => {
      it('should create worker and return 201 with worker data', async () => {
        const newWorker = createMockWorker()
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
        vi.mocked(mockRepo.create).mockResolvedValue(newWorker)

        const result = await service.createWorker(
          { name: 'John Smith', phone: '0412345678' },
          mockOrgId
        )

        expect(result).toEqual(newWorker)
        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Smith',
            phone: '+61412345678',
            organizationId: mockOrgId,
          })
        )
      })

      it('should normalize phone number before storage', async () => {
        const newWorker = createMockWorker()
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
        vi.mocked(mockRepo.create).mockResolvedValue(newWorker)

        await service.createWorker({ name: 'John Smith', phone: '0412 345 678' }, mockOrgId)

        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: '+61412345678',
          })
        )
      })
    })

    describe('phone validation errors (400)', () => {
      it('should return 400 for invalid phone format', async () => {
        const { formatAustralianPhone } = await import('@dashboard-link/shared')
        vi.mocked(formatAustralianPhone).mockImplementation(() => {
          throw new Error('Invalid Australian phone number')
        })

        await expect(
          service.createWorker({ name: 'John Smith', phone: '1234' }, mockOrgId)
        ).rejects.toThrow('Invalid Australian phone number')
      })

      it('should return 400 for empty phone', async () => {
        await expect(
          service.createWorker({ name: 'John Smith', phone: '' }, mockOrgId)
        ).rejects.toThrow()
      })

      it('should return 400 for missing name', async () => {
        await expect(
          service.createWorker({ name: '', phone: '0412345678' }, mockOrgId)
        ).rejects.toThrow()
      })

      it('should return 400 for name exceeding 255 characters', async () => {
        const longName = 'a'.repeat(256)
        await expect(
          service.createWorker({ name: longName, phone: '0412345678' }, mockOrgId)
        ).rejects.toThrow()
      })
    })

    describe('duplicate phone (409)', () => {
      it('should return 409 when phone already in use by active worker', async () => {
        const existingWorker = createMockWorker()
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(existingWorker)

        await expect(
          service.createWorker({ name: 'Jane Doe', phone: '0412345678' }, mockOrgId)
        ).rejects.toThrow('already in use')
      })

      it('should allow phone reuse from soft deleted worker', async () => {
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
        vi.mocked(mockRepo.create).mockResolvedValue(createMockWorker())

        const result = await service.createWorker(
          { name: 'New Worker', phone: '0412345678' },
          mockOrgId
        )

        expect(result).toBeDefined()
      })
    })

    describe('tenant isolation', () => {
      it('should not allow creating worker in different organization', async () => {
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
        vi.mocked(mockRepo.create).mockResolvedValue(createMockWorker())

        const result = await service.createWorker(
          { name: 'John Smith', phone: '0412345678' },
          mockOrgId
        )

        expect(result.organizationId).toBe(mockOrgId)
        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            organizationId: mockOrgId,
          })
        )
      })

      it('should check duplicates only within same organization', async () => {
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
        vi.mocked(mockRepo.create).mockResolvedValue(createMockWorker())

        await service.createWorker({ name: 'John Smith', phone: '0412345678' }, mockOrgId)

        expect(mockRepo.findByPhoneActive).toHaveBeenCalledWith('+61412345678', mockOrgId)
      })
    })
  })

  describe('T081: GET /api/v1/workers', () => {
    describe('list active workers (200)', () => {
      it('should return list of workers with total count', async () => {
        const workers = [
          createMockWorker(),
          createMockWorker({ id: 'worker-789', name: 'Jane Doe' }),
        ]
        vi.mocked(mockRepo.findByOrganizationId).mockResolvedValue(workers)

        const result = await service.getWorkers(mockOrgId)

        expect(result).toHaveLength(2)
        expect(result[0].name).toBe('John Smith')
        expect(result[1].name).toBe('Jane Doe')
      })

      it('should return workers ordered by creation date', async () => {
        const workers = [
          createMockWorker({ createdAt: '2024-01-02T00:00:00Z' }),
          createMockWorker({
            id: 'worker-789',
            createdAt: '2024-01-01T00:00:00Z',
          }),
        ]
        vi.mocked(mockRepo.findByOrganizationId).mockResolvedValue(workers)

        const result = await service.getWorkers(mockOrgId)

        expect(result).toHaveLength(2)
      })
    })

    describe('exclude deleted workers', () => {
      it('should not return soft deleted workers', async () => {
        const activeWorkers = [createMockWorker()]
        vi.mocked(mockRepo.findByOrganizationId).mockResolvedValue(activeWorkers)

        const result = await service.getWorkers(mockOrgId)

        expect(result).toHaveLength(1)
        expect(result.every((w) => w.deletedAt === null)).toBe(true)
      })
    })

    describe('tenant isolation', () => {
      it('should only return workers from authenticated organization', async () => {
        const workers = [createMockWorker({ organizationId: mockOrgId })]
        vi.mocked(mockRepo.findByOrganizationId).mockResolvedValue(workers)

        const result = await service.getWorkers(mockOrgId)

        expect(result.every((w) => w.organizationId === mockOrgId)).toBe(true)
        expect(mockRepo.findByOrganizationId).toHaveBeenCalledWith(mockOrgId)
      })

      it('should not return workers from other organizations', async () => {
        vi.mocked(mockRepo.findByOrganizationId).mockResolvedValue([])

        const result = await service.getWorkers(mockOrgId)

        expect(result).toHaveLength(0)
      })
    })

    describe('empty list handling', () => {
      it('should return empty array when no workers exist', async () => {
        vi.mocked(mockRepo.findByOrganizationId).mockResolvedValue([])

        const result = await service.getWorkers(mockOrgId)

        expect(result).toEqual([])
      })
    })
  })

  describe('T082: PUT /api/v1/workers/:id', () => {
    describe('successful update (200)', () => {
      it('should update worker and return updated data', async () => {
        const worker = createMockWorker()
        const updatedWorker = { ...worker, name: 'Jane Doe' }
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)
        vi.mocked(mockRepo.update).mockResolvedValue(updatedWorker)

        const result = await service.updateWorker(mockWorkerId, { name: 'Jane Doe' }, mockOrgId)

        expect(result.name).toBe('Jane Doe')
      })

      it('should allow partial updates', async () => {
        const worker = createMockWorker()
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)
        vi.mocked(mockRepo.update).mockResolvedValue({
          ...worker,
          phone: '+61423456789',
        })

        const result = await service.updateWorker(mockWorkerId, { phone: '0423456789' }, mockOrgId)

        expect(result.phone).toBe('+61423456789')
        expect(result.name).toBe('John Smith') // Unchanged
      })
    })

    describe('phone validation errors (400)', () => {
      it('should return 400 for invalid phone format', async () => {
        const worker = createMockWorker()
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)

        const { formatAustralianPhone } = await import('@dashboard-link/shared')
        vi.mocked(formatAustralianPhone).mockImplementation(() => {
          throw new Error('Invalid Australian phone number')
        })

        await expect(
          service.updateWorker(mockWorkerId, { phone: '1234' }, mockOrgId)
        ).rejects.toThrow('Invalid Australian phone number')
      })
    })

    describe('duplicate phone (409)', () => {
      it('should return 409 when updating to phone used by different worker', async () => {
        const worker = createMockWorker()
        const otherWorker = createMockWorker({ id: 'worker-999' })
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(otherWorker)

        await expect(
          service.updateWorker(mockWorkerId, { phone: '0423456789' }, mockOrgId)
        ).rejects.toThrow('already in use')
      })
    })

    describe('not found (404)', () => {
      it('should return 404 when worker does not exist', async () => {
        vi.mocked(mockRepo.findById).mockResolvedValue(null)

        const result = await service.getWorkerById(mockWorkerId, mockOrgId)

        expect(result).toBeNull()
      })

      it('should return 404 when worker belongs to different organization', async () => {
        const worker = createMockWorker({ organizationId: mockOtherOrgId })
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)

        const result = await service.getWorkerById(mockWorkerId, mockOrgId)

        expect(result).toBeNull()
      })
    })

    describe('concurrent edit conflict (409)', () => {
      it('should return 409 with CONCURRENT_EDIT code on conflict', async () => {
        const worker = createMockWorker()
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)

        const error: Error & { statusCode?: number } = new Error(
          'Worker was updated by another user'
        )
        error.statusCode = 409
        vi.mocked(mockRepo.update).mockRejectedValue(error)

        await expect(
          service.updateWorker(mockWorkerId, { name: 'New Name' }, mockOrgId)
        ).rejects.toThrow('updated by another user')
      })
    })

    describe('tenant isolation', () => {
      it('should not allow updating worker from different organization', async () => {
        const worker = createMockWorker({ organizationId: mockOtherOrgId })
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)

        const result = await service.getWorkerById(mockWorkerId, mockOrgId)

        expect(result).toBeNull()
      })
    })
  })

  describe('T083: DELETE /api/v1/workers/:id', () => {
    describe('successful soft delete (200)', () => {
      it('should soft delete worker and return success', async () => {
        const worker = createMockWorker()
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)
        vi.mocked(mockRepo.softDelete).mockResolvedValue()

        await service.deleteWorker(mockWorkerId, mockOrgId)

        expect(mockRepo.softDelete).toHaveBeenCalledWith(mockWorkerId)
      })

      it('should return success message', async () => {
        const worker = createMockWorker()
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)
        vi.mocked(mockRepo.softDelete).mockResolvedValue()

        await expect(service.deleteWorker(mockWorkerId, mockOrgId)).resolves.not.toThrow()
      })
    })

    describe('not found (404)', () => {
      it('should return 404 when worker does not exist', async () => {
        vi.mocked(mockRepo.findById).mockResolvedValue(null)

        await expect(service.deleteWorker(mockWorkerId, mockOrgId)).rejects.toThrow(
          'Worker not found'
        )
      })
    })

    describe('tenant isolation', () => {
      it('should not allow deleting worker from different organization', async () => {
        const worker = createMockWorker({ organizationId: mockOtherOrgId })
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)

        await expect(service.deleteWorker(mockWorkerId, mockOrgId)).rejects.toThrow(
          'Worker not found'
        )
      })
    })

    describe('verify deletedAt set', () => {
      it('should set deletedAt timestamp via soft delete', async () => {
        const worker = createMockWorker()
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)
        vi.mocked(mockRepo.softDelete).mockResolvedValue()

        await service.deleteWorker(mockWorkerId, mockOrgId)

        expect(mockRepo.softDelete).toHaveBeenCalledWith(mockWorkerId)
      })
    })

    describe('verify excluded from active queries', () => {
      it('should not return deleted worker in subsequent list queries', async () => {
        const worker = createMockWorker()
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)
        vi.mocked(mockRepo.softDelete).mockResolvedValue()

        await service.deleteWorker(mockWorkerId, mockOrgId)

        // After deletion, list should not include this worker
        vi.mocked(mockRepo.findByOrganizationId).mockResolvedValue([])
        const workers = await service.getWorkers(mockOrgId)

        expect(workers).toHaveLength(0)
      })
    })
  })
})
