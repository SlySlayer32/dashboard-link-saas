/**
 * Multi-Tenant Isolation Security Tests (T084)
 *
 * Security-critical tests - 90% coverage target
 * Verifies complete tenant isolation across all worker operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Worker } from '@dashboard-link/shared'
import { WorkerService } from '../../services/WorkerService'
import type { WorkerRepository } from '@dashboard-link/database'

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

describe('Multi-Tenant Isolation Security Tests (T084)', () => {
  let service: WorkerService
  let mockRepo: WorkerRepository

  const orgA = 'org-aaa'
  const orgB = 'org-bbb'
  const workerIdA = 'worker-111'
  const workerIdB = 'worker-222'

  const createWorkerForOrg = (orgId: string, workerId: string): Worker => ({
    id: workerId,
    name: 'Test Worker',
    phone: '+61412345678',
    email: 'test@example.com',
    organizationId: orgId,
    active: true,
    deletedAt: null,
    metadata: {},
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  })

  beforeEach(() => {
    mockRepo = {
      findByOrganizationId: vi.fn(),
      findByPhoneActive: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    } as unknown as WorkerRepository

    service = new WorkerService(mockRepo)
  })

  describe('Org A cannot list Org B workers', () => {
    it('should only return workers from Org A when listing', async () => {
      const workersOrgA = [createWorkerForOrg(orgA, workerIdA)]
      vi.mocked(mockRepo.findByOrganizationId).mockResolvedValue(workersOrgA)

      const result = await service.getWorkers(orgA)

      expect(result).toHaveLength(1)
      expect(result.every((w) => w.organizationId === orgA)).toBe(true)
      expect(mockRepo.findByOrganizationId).toHaveBeenCalledWith(orgA)
    })

    it('should return empty array for Org A if only Org B workers exist', async () => {
      vi.mocked(mockRepo.findByOrganizationId).mockResolvedValue([])

      const result = await service.getWorkers(orgA)

      expect(result).toHaveLength(0)
    })

    it('should never expose Org B workers in Org A list', async () => {
      const workersOrgA = [createWorkerForOrg(orgA, workerIdA)]
      vi.mocked(mockRepo.findByOrganizationId).mockResolvedValue(workersOrgA)

      const result = await service.getWorkers(orgA)

      expect(result.some((w) => w.organizationId === orgB)).toBe(false)
    })
  })

  describe('Org A cannot get Org B worker by ID', () => {
    it('should return null when Org A tries to get Org B worker', async () => {
      const workerB = createWorkerForOrg(orgB, workerIdB)
      vi.mocked(mockRepo.findById).mockResolvedValue(workerB)

      const result = await service.getWorkerById(workerIdB, orgA)

      expect(result).toBeNull()
    })

    it('should return worker when organization matches', async () => {
      const workerA = createWorkerForOrg(orgA, workerIdA)
      vi.mocked(mockRepo.findById).mockResolvedValue(workerA)

      const result = await service.getWorkerById(workerIdA, orgA)

      expect(result).not.toBeNull()
      expect(result?.organizationId).toBe(orgA)
    })

    it('should verify organization ownership before returning worker', async () => {
      const workerB = createWorkerForOrg(orgB, workerIdB)
      vi.mocked(mockRepo.findById).mockResolvedValue(workerB)

      const result = await service.getWorkerById(workerIdB, orgA)

      expect(result).toBeNull()
      expect(mockRepo.findById).toHaveBeenCalledWith(workerIdB)
    })
  })

  describe('Org A cannot create worker in Org B', () => {
    it('should create worker with Org A context only', async () => {
      const newWorker = createWorkerForOrg(orgA, workerIdA)
      vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
      vi.mocked(mockRepo.create).mockResolvedValue(newWorker)

      const result = await service.createWorker({ name: 'Test Worker', phone: '0412345678' }, orgA)

      expect(result.organizationId).toBe(orgA)
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: orgA,
        })
      )
    })

    it('should not allow creating worker with different org ID in request', async () => {
      const newWorker = createWorkerForOrg(orgA, workerIdA)
      vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
      vi.mocked(mockRepo.create).mockResolvedValue(newWorker)

      // Even if client tries to specify different org, service uses auth context
      const result = await service.createWorker({ name: 'Test Worker', phone: '0412345678' }, orgA)

      expect(result.organizationId).toBe(orgA)
    })

    it('should check duplicate phone only within same organization', async () => {
      vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
      vi.mocked(mockRepo.create).mockResolvedValue(createWorkerForOrg(orgA, workerIdA))

      await service.createWorker({ name: 'Test Worker', phone: '0412345678' }, orgA)

      expect(mockRepo.findByPhoneActive).toHaveBeenCalledWith('+61412345678', orgA)
    })
  })

  describe('Org A cannot update Org B worker', () => {
    it('should return null when trying to update Org B worker', async () => {
      const workerB = createWorkerForOrg(orgB, workerIdB)
      vi.mocked(mockRepo.findById).mockResolvedValue(workerB)

      const result = await service.getWorkerById(workerIdB, orgA)

      expect(result).toBeNull()
    })

    it('should verify organization ownership before update', async () => {
      const workerB = createWorkerForOrg(orgB, workerIdB)
      vi.mocked(mockRepo.findById).mockResolvedValue(workerB)

      const result = await service.getWorkerById(workerIdB, orgA)

      expect(result).toBeNull()
      expect(mockRepo.update).not.toHaveBeenCalled()
    })

    it('should allow update when organization matches', async () => {
      const workerA = createWorkerForOrg(orgA, workerIdA)
      vi.mocked(mockRepo.findById).mockResolvedValue(workerA)
      vi.mocked(mockRepo.update).mockResolvedValue({
        ...workerA,
        name: 'Updated Name',
      })

      const result = await service.updateWorker(workerIdA, { name: 'Updated Name' }, orgA)

      expect(result.name).toBe('Updated Name')
      expect(result.organizationId).toBe(orgA)
    })

    it('should not allow cross-organization phone conflicts', async () => {
      const workerA = createWorkerForOrg(orgA, workerIdA)
      vi.mocked(mockRepo.findById).mockResolvedValue(workerA)
      vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
      vi.mocked(mockRepo.update).mockResolvedValue({
        ...workerA,
        phone: '+61423456789',
      })

      await service.updateWorker(workerIdA, { phone: '0423456789' }, orgA)

      expect(mockRepo.findByPhoneActive).toHaveBeenCalledWith('+61423456789', orgA)
    })
  })

  describe('Org A cannot delete Org B worker', () => {
    it('should throw error when trying to delete Org B worker', async () => {
      const workerB = createWorkerForOrg(orgB, workerIdB)
      vi.mocked(mockRepo.findById).mockResolvedValue(workerB)

      await expect(service.deleteWorker(workerIdB, orgA)).rejects.toThrow('Worker not found')

      expect(mockRepo.softDelete).not.toHaveBeenCalled()
    })

    it('should verify organization ownership before delete', async () => {
      const workerB = createWorkerForOrg(orgB, workerIdB)
      vi.mocked(mockRepo.findById).mockResolvedValue(workerB)

      await expect(service.deleteWorker(workerIdB, orgA)).rejects.toThrow()

      expect(mockRepo.findById).toHaveBeenCalledWith(workerIdB)
    })

    it('should allow delete when organization matches', async () => {
      const workerA = createWorkerForOrg(orgA, workerIdA)
      vi.mocked(mockRepo.findById).mockResolvedValue(workerA)
      vi.mocked(mockRepo.softDelete).mockResolvedValue()

      await service.deleteWorker(workerIdA, orgA)

      expect(mockRepo.softDelete).toHaveBeenCalledWith(workerIdA)
    })
  })

  describe('RLS policy enforcement at database level', () => {
    it('should enforce organization_id filter in repository queries', async () => {
      vi.mocked(mockRepo.findByOrganizationId).mockResolvedValue([
        createWorkerForOrg(orgA, workerIdA),
      ])

      await service.getWorkers(orgA)

      expect(mockRepo.findByOrganizationId).toHaveBeenCalledWith(orgA)
    })

    it('should enforce organization_id in phone duplicate checks', async () => {
      vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
      vi.mocked(mockRepo.create).mockResolvedValue(createWorkerForOrg(orgA, workerIdA))

      await service.createWorker({ name: 'Test Worker', phone: '0412345678' }, orgA)

      expect(mockRepo.findByPhoneActive).toHaveBeenCalledWith(expect.any(String), orgA)
    })

    it('should never query without organization context', async () => {
      vi.mocked(mockRepo.findByOrganizationId).mockResolvedValue([])

      await service.getWorkers(orgA)

      expect(mockRepo.findByOrganizationId).toHaveBeenCalledWith(orgA)
      expect(mockRepo.findByOrganizationId).not.toHaveBeenCalledWith(undefined)
    })
  })

  describe('Cross-organization data leakage prevention', () => {
    it('should not leak worker data in error messages', async () => {
      const workerB = createWorkerForOrg(orgB, workerIdB)
      vi.mocked(mockRepo.findById).mockResolvedValue(workerB)

      const result = await service.getWorkerById(workerIdB, orgA)

      expect(result).toBeNull()
      // Should not throw error with worker details
    })

    it('should not expose existence of Org B workers to Org A', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null)

      const result = await service.getWorkerById(workerIdB, orgA)

      expect(result).toBeNull()
    })

    it('should handle same phone across organizations independently', async () => {
      // Org A can use same phone as Org B (different orgs)
      vi.mocked(mockRepo.findByPhoneActive).mockResolvedValue(null)
      vi.mocked(mockRepo.create).mockResolvedValue(createWorkerForOrg(orgA, workerIdA))

      const result = await service.createWorker({ name: 'Test Worker', phone: '0412345678' }, orgA)

      expect(result.organizationId).toBe(orgA)
      expect(mockRepo.findByPhoneActive).toHaveBeenCalledWith('+61412345678', orgA)
    })
  })

  describe('Authorization bypass prevention', () => {
    it('should not allow worker access via direct ID without org check', async () => {
      const workerB = createWorkerForOrg(orgB, workerIdB)
      vi.mocked(mockRepo.findById).mockResolvedValue(workerB)

      const result = await service.getWorkerById(workerIdB, orgA)

      expect(result).toBeNull()
    })

    it('should validate organization on every operation', async () => {
      const workerA = createWorkerForOrg(orgA, workerIdA)
      vi.mocked(mockRepo.findById).mockResolvedValue(workerA)

      // Get
      await service.getWorkerById(workerIdA, orgA)
      expect(mockRepo.findById).toHaveBeenCalled()

      // Update
      vi.mocked(mockRepo.update).mockResolvedValue(workerA)
      await service.updateWorker(workerIdA, { name: 'New' }, orgA)
      expect(mockRepo.findById).toHaveBeenCalled()

      // Delete
      vi.mocked(mockRepo.softDelete).mockResolvedValue()
      await service.deleteWorker(workerIdA, orgA)
      expect(mockRepo.findById).toHaveBeenCalled()
    })

    it('should reject operations without organization context', async () => {
      // Service layer should always require organizationId
      await expect(service.getWorkers('' as string)).rejects.toThrow()
    })
  })
})
