/**
 * WorkerService Unit Tests (T076-T079)
 *
 * Business logic tests - 80% coverage target
 * Tests for:
 * - T076: createWorker (phone validation, normalization, duplicate prevention, name trimming, special chars, logging)
 * - T077: updateWorker (phone validation, duplicate check, conflict detection, name trimming, logging)
 * - T078: deleteWorker (soft delete, existence check, org ownership, logging)
 * - T079: getWorkers (filters deleted workers, tenant scoping, logging)
 */

import type { WorkerRepository } from '@dashboard-link/database'
import { formatAustralianPhone, type Worker } from '@dashboard-link/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkerService } from '../../services/WorkerService'

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock phone formatter
vi.mock('@dashboard-link/shared', async () => {
  const actual = await vi.importActual('@dashboard-link/shared')
  return {
    ...actual,
    formatAustralianPhone: vi.fn((phone: string) => {
      // Normalize to E.164 format
      if (phone.startsWith('+61')) return phone
      if (phone.startsWith('04')) return `+614${phone.slice(2).replace(/[\s-]/g, '')}`
      throw new Error('Invalid Australian phone number')
    }),
  }
})

describe('WorkerService', () => {
  let service: WorkerService
  let mockRepo: WorkerRepository
  const mockOrgId = 'org-123'
  const mockWorkerId = 'worker-456'

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

  beforeEach(() => {
    mockRepo = {
      findByOrganizationId: vi.fn(),
      findByPhoneActive: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      getWorkerStats: vi.fn(),
      searchWorkers: vi.fn(),
      findActiveWorkers: vi.fn(),
    } as unknown as WorkerRepository

    service = new WorkerService(mockRepo)

    vi.mocked(formatAustralianPhone).mockImplementation((phone: string) => {
      if (phone.startsWith('+61')) return phone
      if (phone.startsWith('04')) return `+614${phone.slice(2).replace(/[\s-]/g, '')}`
      throw new Error('Invalid Australian phone number')
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('T076: createWorker', () => {
    describe('phone validation and normalization', () => {
      it('should normalize phone from 04XX XXX XXX to E.164 format', async () => {
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
        vi.mocked(mockRepo.create).mockResolvedValue(createMockWorker())

        await service.createWorker({ name: 'John Smith', phone: '0412 345 678' }, mockOrgId)

        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: '+61412345678',
          })
        )
      })

      it('should normalize phone from 0412345678 to E.164 format', async () => {
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
        vi.mocked(mockRepo.create).mockResolvedValue(createMockWorker())

        await service.createWorker({ name: 'John Smith', phone: '0412345678' }, mockOrgId)

        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: '+61412345678',
          })
        )
      })

      it('should normalize phone from 0412-345-678 to E.164 format', async () => {
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
        vi.mocked(mockRepo.create).mockResolvedValue(createMockWorker())

        await service.createWorker({ name: 'John Smith', phone: '0412-345-678' }, mockOrgId)

        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: '+61412345678',
          })
        )
      })

      it('should accept phone already in E.164 format', async () => {
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
        vi.mocked(mockRepo.create).mockResolvedValue(createMockWorker())

        await service.createWorker({ name: 'John Smith', phone: '+61412345678' }, mockOrgId)

        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: '+61412345678',
          })
        )
      })

      it('should reject invalid phone format', async () => {
        const { formatAustralianPhone } = await import('@dashboard-link/shared')
        vi.mocked(formatAustralianPhone).mockImplementation(() => {
          throw new Error('Invalid Australian phone number')
        })

        await expect(
          service.createWorker({ name: 'John Smith', phone: '1234' }, mockOrgId)
        ).rejects.toThrow('Invalid Australian phone number')
      })
    })

    describe('duplicate active worker prevention', () => {
      it('should prevent duplicate phone for active workers', async () => {
        const existingWorker = createMockWorker()
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(existingWorker)

        await expect(
          service.createWorker({ name: 'Jane Doe', phone: '0412345678' }, mockOrgId)
        ).rejects.toThrow('already in use')
      })

      it('should allow phone reuse from soft deleted worker', async () => {
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
        vi.mocked(mockRepo.create).mockResolvedValue(createMockWorker())

        await service.createWorker({ name: 'New Worker', phone: '0412345678' }, mockOrgId)

        expect(mockRepo.create).toHaveBeenCalled()
      })

      it('should check duplicate within same organization only', async () => {
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
        vi.mocked(mockRepo.create).mockResolvedValue(createMockWorker())

        await service.createWorker({ name: 'John Smith', phone: '0412345678' }, mockOrgId)

        expect(mockRepo.findByPhoneActive).toHaveBeenCalledWith('+61412345678', mockOrgId)
      })
    })

    describe('name trimming and special characters', () => {
      it('should trim leading and trailing whitespace from name', async () => {
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
        vi.mocked(mockRepo.create).mockResolvedValue(createMockWorker())

        await service.createWorker({ name: '  John Smith  ', phone: '0412345678' }, mockOrgId)

        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Smith',
          })
        )
      })

      it('should handle names with apostrophes', async () => {
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
        vi.mocked(mockRepo.create).mockResolvedValue(createMockWorker({ name: "O'Brien" }))

        await service.createWorker({ name: "O'Brien", phone: '0412345678' }, mockOrgId)

        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "O'Brien",
          })
        )
      })

      it('should handle names with hyphens', async () => {
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
        vi.mocked(mockRepo.create).mockResolvedValue(createMockWorker({ name: 'Mary-Jane' }))

        await service.createWorker({ name: 'Mary-Jane', phone: '0412345678' }, mockOrgId)

        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Mary-Jane',
          })
        )
      })

      it('should handle names with unicode characters', async () => {
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
        vi.mocked(mockRepo.create).mockResolvedValue(createMockWorker({ name: 'José García' }))

        await service.createWorker({ name: 'José García', phone: '0412345678' }, mockOrgId)

        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'José García',
          })
        )
      })
    })

    describe('structured logging', () => {
      it('should log successful creation with required fields', async () => {
        const { logger } = await import('../../utils/logger.js')
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
        vi.mocked(mockRepo.create).mockResolvedValue(createMockWorker())

        await service.createWorker({ name: 'John Smith', phone: '0412345678' }, mockOrgId)

        expect(logger.info).toHaveBeenCalledWith(
          'Worker created successfully',
          expect.objectContaining({
            operation: 'create_worker',
            duration_ms: expect.any(Number),
            success: true,
            organization_id: mockOrgId,
            worker_id: mockWorkerId,
          })
        )
      })

      it('should log failure with error_type on duplicate phone', async () => {
        const { logger } = await import('../../utils/logger.js')
        const existingWorker = createMockWorker()
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(existingWorker)

        await expect(
          service.createWorker({ name: 'Jane Doe', phone: '0412345678' }, mockOrgId)
        ).rejects.toThrow()

        expect(logger.error).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Error),
          expect.objectContaining({
            operation: 'create_worker',
            duration_ms: expect.any(Number),
            success: false,
            organization_id: mockOrgId,
            error_type: 'duplicate_phone',
          })
        )
      })
    })
  })

  describe('T077: updateWorker', () => {
    describe('phone validation on update', () => {
      it('should validate and normalize phone when updating', async () => {
        const worker = createMockWorker()
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
        vi.mocked(mockRepo.update).mockResolvedValue({
          ...worker,
          phone: '+61423456789',
        })

        await service.updateWorker(mockWorkerId, { phone: '0423 456 789' }, mockOrgId)

        expect(mockRepo.update).toHaveBeenCalledWith(
          mockWorkerId,
          expect.objectContaining({
            phone: '+61423456789',
          })
        )
      })

      it('should not validate phone if not being updated', async () => {
        const worker = createMockWorker()
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)
        vi.mocked(mockRepo.update).mockResolvedValue({
          ...worker,
          name: 'Jane Doe',
        })

        await service.updateWorker(mockWorkerId, { name: 'Jane Doe' }, mockOrgId)

        expect(mockRepo.findByPhoneActive).not.toHaveBeenCalled()
      })
    })

    describe('duplicate phone check (different worker)', () => {
      it('should prevent updating to phone used by different active worker', async () => {
        const worker = createMockWorker()
        const otherWorker = createMockWorker({ id: 'worker-999' })
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(otherWorker)

        await expect(
          service.updateWorker(mockWorkerId, { phone: '0423456789' }, mockOrgId)
        ).rejects.toThrow('already in use')
      })

      it('should allow updating to same phone (no change)', async () => {
        const worker = createMockWorker()
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(worker)
        vi.mocked(mockRepo.update).mockResolvedValue(worker)

        await service.updateWorker(mockWorkerId, { phone: '0412345678' }, mockOrgId)

        expect(mockRepo.update).toHaveBeenCalled()
      })

      it('should allow phone from soft deleted worker', async () => {
        const worker = createMockWorker()
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)
        vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
        vi.mocked(mockRepo.update).mockResolvedValue({
          ...worker,
          phone: '+61423456789',
        })

        await service.updateWorker(mockWorkerId, { phone: '0423456789' }, mockOrgId)

        expect(mockRepo.update).toHaveBeenCalled()
      })
    })

    describe('last-write-wins conflict detection (409)', () => {
      it('should detect concurrent edit via updated_at mismatch', async () => {
        const worker = createMockWorker({ updatedAt: '2024-01-01T12:00:00Z' })
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)

        // Simulate concurrent edit - updatedAt has changed
        const error: Error & { statusCode?: number } = new Error(
          'Worker was updated by another user. Please refresh and try again.'
        )
        error.statusCode = 409
        vi.mocked(mockRepo.update).mockRejectedValue(error)

        await expect(
          service.updateWorker(mockWorkerId, { name: 'New Name' }, mockOrgId)
        ).rejects.toThrow('updated by another user')
      })
    })

    describe('name trimming on update', () => {
      it('should trim name when updating', async () => {
        const worker = createMockWorker()
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)
        vi.mocked(mockRepo.update).mockResolvedValue({
          ...worker,
          name: 'Jane Doe',
        })

        await service.updateWorker(mockWorkerId, { name: '  Jane Doe  ' }, mockOrgId)

        expect(mockRepo.update).toHaveBeenCalledWith(
          mockWorkerId,
          expect.objectContaining({
            name: 'Jane Doe',
          })
        )
      })
    })

    describe('structured logging', () => {
      it('should log successful update', async () => {
        const { logger } = await import('../../utils/logger.js')
        const worker = createMockWorker()
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)
        vi.mocked(mockRepo.update).mockResolvedValue(worker)

        await service.updateWorker(mockWorkerId, { name: 'Jane Doe' }, mockOrgId)

        expect(logger.info).toHaveBeenCalledWith(
          'Worker updated successfully',
          expect.objectContaining({
            operation: 'update_worker',
            duration_ms: expect.any(Number),
            success: true,
            organization_id: mockOrgId,
            worker_id: mockWorkerId,
          })
        )
      })

      it('should log failure with error_type on concurrent edit', async () => {
        const { logger } = await import('../../utils/logger.js')
        const worker = createMockWorker()
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)

        const error: Error & { statusCode?: number } = new Error('Concurrent edit')
        error.statusCode = 409
        vi.mocked(mockRepo.update).mockRejectedValue(error)

        await expect(
          service.updateWorker(mockWorkerId, { name: 'New Name' }, mockOrgId)
        ).rejects.toThrow()

        expect(logger.error).toHaveBeenCalledWith(
          'Failed to update worker',
          expect.any(Error),
          expect.objectContaining({
            operation: 'update_worker',
            error_type: 'concurrent_edit',
          })
        )
      })
    })
  })

  describe('T078: deleteWorker', () => {
    describe('soft delete (sets deletedAt)', () => {
      it('should call softDelete on repository', async () => {
        const worker = createMockWorker()
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)
        vi.mocked(mockRepo.softDelete).mockResolvedValue()

        await service.deleteWorker(mockWorkerId, mockOrgId)

        expect(mockRepo.softDelete).toHaveBeenCalledWith(mockWorkerId)
      })

      it('should not hard delete the worker', async () => {
        const worker = createMockWorker()
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)
        vi.mocked(mockRepo.softDelete).mockResolvedValue()

        await service.deleteWorker(mockWorkerId, mockOrgId)

        expect(mockRepo.softDelete).toHaveBeenCalled()
        // Verify it's soft delete, not hard delete
        expect(mockRepo.softDelete).not.toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ hard: true })
        )
      })
    })

    describe('worker existence check', () => {
      it('should verify worker exists before deleting', async () => {
        vi.mocked(mockRepo.findById).mockResolvedValue(null)

        await expect(service.deleteWorker(mockWorkerId, mockOrgId)).rejects.toThrow(
          'Worker not found'
        )

        expect(mockRepo.softDelete).not.toHaveBeenCalled()
      })
    })

    describe('organization ownership verification', () => {
      it('should verify worker belongs to organization', async () => {
        const worker = createMockWorker({ organizationId: 'other-org' })
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)

        await expect(service.deleteWorker(mockWorkerId, mockOrgId)).rejects.toThrow(
          'Worker not found'
        )

        expect(mockRepo.softDelete).not.toHaveBeenCalled()
      })

      it('should allow deletion for correct organization', async () => {
        const worker = createMockWorker()
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)
        vi.mocked(mockRepo.softDelete).mockResolvedValue()

        await service.deleteWorker(mockWorkerId, mockOrgId)

        expect(mockRepo.softDelete).toHaveBeenCalled()
      })
    })

    describe('structured logging', () => {
      it('should log successful deletion', async () => {
        const { logger } = await import('../../utils/logger.js')
        const worker = createMockWorker()
        vi.mocked(mockRepo.findById).mockResolvedValue(worker)
        vi.mocked(mockRepo.softDelete).mockResolvedValue()

        await service.deleteWorker(mockWorkerId, mockOrgId)

        expect(logger.info).toHaveBeenCalledWith(
          'Worker soft deleted successfully',
          expect.objectContaining({
            operation: 'delete_worker',
            duration_ms: expect.any(Number),
            success: true,
            organization_id: mockOrgId,
            worker_id: mockWorkerId,
          })
        )
      })

      it('should log failure with error_type not_found', async () => {
        const { logger } = await import('../../utils/logger.js')
        vi.mocked(mockRepo.findById).mockResolvedValue(null)

        await expect(service.deleteWorker(mockWorkerId, mockOrgId)).rejects.toThrow()

        expect(logger.error).toHaveBeenCalledWith(
          'Failed to delete worker',
          expect.any(Error),
          expect.objectContaining({
            operation: 'delete_worker',
            error_type: 'not_found',
          })
        )
      })
    })
  })

  describe('T079: getWorkers', () => {
    describe('filters deleted workers (deletedAt IS NULL)', () => {
      it('should only return active workers', async () => {
        const activeWorker = createMockWorker()
        vi.mocked(mockRepo.findByOrganizationId).mockResolvedValue([activeWorker])

        const result = await service.getWorkers(mockOrgId)

        expect(result).toHaveLength(1)
        expect(result[0].deletedAt).toBeNull()
      })

      it('should not return soft deleted workers', async () => {
        vi.mocked(mockRepo.findByOrganizationId).mockResolvedValue([])

        const result = await service.getWorkers(mockOrgId)

        expect(result).toHaveLength(0)
      })
    })

    describe('tenant scoping', () => {
      it('should only return workers for specified organization', async () => {
        const workers = [
          createMockWorker({ organizationId: mockOrgId }),
          createMockWorker({ id: 'worker-789', organizationId: mockOrgId }),
        ]
        vi.mocked(mockRepo.findByOrganizationId).mockResolvedValue(workers)

        const result = await service.getWorkers(mockOrgId)

        expect(result).toHaveLength(2)
        expect(result.every((w) => w.organizationId === mockOrgId)).toBe(true)
      })

      it('should call repository with correct organization ID', async () => {
        vi.mocked(mockRepo.findByOrganizationId).mockResolvedValue([])

        await service.getWorkers(mockOrgId)

        expect(mockRepo.findByOrganizationId).toHaveBeenCalledWith(mockOrgId)
      })
    })

    describe('structured logging', () => {
      it('should log successful retrieval with worker count', async () => {
        const { logger } = await import('../../utils/logger.js')
        const workers = [createMockWorker(), createMockWorker({ id: 'worker-789' })]
        vi.mocked(mockRepo.findByOrganizationId).mockResolvedValue(workers)

        await service.getWorkers(mockOrgId)

        expect(logger.info).toHaveBeenCalledWith(
          'Workers retrieved successfully',
          expect.objectContaining({
            operation: 'get_workers',
            duration_ms: expect.any(Number),
            success: true,
            organization_id: mockOrgId,
            worker_count: 2,
          })
        )
      })

      it('should log failure with error_type', async () => {
        const { logger } = await import('../../utils/logger.js')
        vi.mocked(mockRepo.findByOrganizationId).mockRejectedValue(new Error('Database error'))

        await expect(service.getWorkers(mockOrgId)).rejects.toThrow()

        expect(logger.error).toHaveBeenCalledWith(
          'Failed to list workers',
          expect.any(Error),
          expect.objectContaining({
            operation: 'get_workers',
            success: false,
            error_type: 'unknown',
          })
        )
      })
    })
  })
})
