/**
 * Worker Service (Refactored)
 *
 * Business logic for worker operations using the repository pattern
 * Replaces direct database queries with repository abstraction
 */

import { WorkerRepository } from '@dashboard-link/database'
import type { Worker } from '@dashboard-link/shared'
import { formatAustralianPhone } from '@dashboard-link/shared'
import { logger } from '../utils/logger.js'

type WorkerServiceError = Error & { statusCode?: number }

export interface CreateWorkerRequest {
  name: string
  phone: string
  email?: string
  metadata?: Record<string, unknown>
}

export interface UpdateWorkerRequest {
  name?: string
  phone?: string
  email?: string
  active?: boolean
  metadata?: Record<string, unknown>
}

export interface WorkerStats {
  totalSms: number
  sentSms: number
  failedSms: number
  smsToday: number
  smsThisWeek: number
}

export class WorkerService {
  constructor(private workerRepo: WorkerRepository) {}

  async getWorkers(organizationId: string): Promise<Worker[]> {
    if (!organizationId) {
      throw new Error('Organization ID is required')
    }

    const startTime = Date.now()

    try {
      const workers = await this.workerRepo.findByOrganizationId(organizationId)

      logger.info('Workers retrieved successfully', {
        operation: 'get_workers',
        duration_ms: Date.now() - startTime,
        success: true,
        organization_id: organizationId,
        worker_count: workers.length,
      })

      return workers
    } catch (error) {
      logger.error(
        'Failed to list workers',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'get_workers',
          duration_ms: Date.now() - startTime,
          success: false,
          organization_id: organizationId,
          worker_count: 0,
          error_type: 'unknown',
        }
      )

      throw error
    }
  }

  async getWorkerById(id: string, organizationId: string): Promise<Worker | null> {
    const startTime = Date.now()

    try {
      const worker = await this.workerRepo.findById(id)

      if (!worker || worker.organizationId !== organizationId) {
        logger.warn('Worker not found', {
          operation: 'get_worker',
          duration_ms: Date.now() - startTime,
          success: false,
          organization_id: organizationId,
          worker_id: id,
          error_type: 'not_found',
        })
        return null
      }

      logger.info('Worker retrieved successfully', {
        operation: 'get_worker',
        duration_ms: Date.now() - startTime,
        success: true,
        organization_id: organizationId,
        worker_id: id,
      })

      return worker
    } catch (error) {
      logger.error(
        'Failed to retrieve worker',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'get_worker',
          duration_ms: Date.now() - startTime,
          success: false,
          organization_id: organizationId,
          worker_id: id,
          error_type: 'unknown',
        }
      )

      throw error
    }
  }

  async getWorkerStats(
    workerId: string,
    organizationId: string
  ): Promise<{
    worker: Worker
    stats: WorkerStats
  }> {
    const worker = await this.getWorkerById(workerId, organizationId)

    if (!worker) {
      throw new Error('Worker not found')
    }

    const stats = await this.workerRepo.getWorkerStats(workerId)

    return {
      worker,
      stats,
    }
  }

  async createWorker(data: CreateWorkerRequest, organizationId: string): Promise<Worker> {
    const startTime = Date.now()

    try {
      this.validateWorkerData(data)

      // Validate and format phone number
      const formattedPhone = formatAustralianPhone(data.phone)

      // Check for duplicate phone number (active workers only)
      const existingWorker = await this.workerRepo.findByPhoneActive(formattedPhone, organizationId)
      if (existingWorker) {
        logger.error('Duplicate phone number detected', new Error('Phone number already in use'), {
          operation: 'create_worker',
          organization_id: organizationId,
          phone: formattedPhone,
          error_type: 'duplicate_phone',
        })
        throw new Error('Phone number already in use by an active worker')
      }

      const workerData = {
        name: data.name.trim(),
        phone: formattedPhone,
        email: data.email?.trim() || undefined,
        organizationId,
        active: true,
        deletedAt: null,
        metadata: data.metadata || {},
      }

      const worker = await this.workerRepo.create(workerData)

      logger.info('Worker created successfully', {
        operation: 'create_worker',
        duration_ms: Date.now() - startTime,
        success: true,
        organization_id: organizationId,
        worker_id: worker.id,
      })

      return worker
    } catch (error) {
      logger.error(
        'Failed to create worker',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'create_worker',
          duration_ms: Date.now() - startTime,
          success: false,
          organization_id: organizationId,
          error_type:
            error instanceof Error &&
            (error.message.includes('duplicate') || error.message.includes('already in use'))
              ? 'duplicate_phone'
              : 'unknown',
        }
      )
      throw error
    }
  }

  async updateWorker(
    id: string,
    data: UpdateWorkerRequest & { updatedAt?: string },
    organizationId: string
  ): Promise<Worker> {
    const startTime = Date.now()

    try {
      this.validateWorkerData(data)

      // Verify worker belongs to organization
      const existingWorker = await this.getWorkerById(id, organizationId)
      if (!existingWorker) {
        throw new Error('Worker not found')
      }

      // Last-write-wins conflict detection (FR-019)
      if (data.updatedAt && existingWorker.updatedAt !== data.updatedAt) {
        logger.warn('Concurrent edit conflict detected', {
          operation: 'update_worker',
          organization_id: organizationId,
          worker_id: id,
          error_type: 'concurrent_edit',
        })
        const error: WorkerServiceError = new Error(
          'Worker was updated by another user. Please refresh and try again.'
        )
        error.statusCode = 409
        throw error
      }

      const updateData: Partial<Worker> = {}

      if (data.name !== undefined) {
        updateData.name = data.name.trim()
      }

      if (data.phone !== undefined) {
        const formattedPhone = formatAustralianPhone(data.phone)

        // Check for duplicate phone number (different worker, active only)
        const existingWithPhone = await this.workerRepo.findByPhoneActive(
          formattedPhone,
          organizationId
        )
        if (existingWithPhone && existingWithPhone.id !== id) {
          logger.error(
            'Duplicate phone number detected on update',
            new Error('Phone number already in use'),
            {
              operation: 'update_worker',
              organization_id: organizationId,
              worker_id: id,
              phone: formattedPhone,
              error_type: 'duplicate_phone',
            }
          )
          throw new Error('Phone number already in use by an active worker')
        }

        updateData.phone = formattedPhone
      }

      if (data.email !== undefined) {
        updateData.email = data.email?.trim() || undefined
      }

      if (data.active !== undefined) {
        updateData.active = data.active
      }

      if (data.metadata !== undefined) {
        updateData.metadata = data.metadata
      }

      const worker = await this.workerRepo.update(id, updateData)

      logger.info('Worker updated successfully', {
        operation: 'update_worker',
        duration_ms: Date.now() - startTime,
        success: true,
        organization_id: organizationId,
        worker_id: id,
      })

      return worker
    } catch (error) {
      const serviceError = error as WorkerServiceError

      logger.error(
        'Failed to update worker',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'update_worker',
          duration_ms: Date.now() - startTime,
          success: false,
          organization_id: organizationId,
          worker_id: id,
          error_type:
            error instanceof Error &&
            (error.message.includes('duplicate') || error.message.includes('already in use'))
              ? 'duplicate_phone'
              : serviceError.statusCode === 409
                ? 'concurrent_edit'
                : 'unknown',
        }
      )
      throw error
    }
  }

  async deleteWorker(id: string, organizationId: string): Promise<void> {
    const startTime = Date.now()

    try {
      // Verify worker belongs to organization
      const worker = await this.getWorkerById(id, organizationId)
      if (!worker) {
        throw new Error('Worker not found')
      }

      // Soft delete (sets deleted_at timestamp)
      await this.workerRepo.softDelete(id)

      logger.info('Worker soft deleted successfully', {
        operation: 'delete_worker',
        duration_ms: Date.now() - startTime,
        success: true,
        organization_id: organizationId,
        worker_id: id,
      })
    } catch (error) {
      logger.error(
        'Failed to delete worker',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'delete_worker',
          duration_ms: Date.now() - startTime,
          success: false,
          organization_id: organizationId,
          worker_id: id,
          error_type:
            error instanceof Error && error.message === 'Worker not found'
              ? 'not_found'
              : 'unknown',
        }
      )
      throw error
    }
  }

  async activateWorker(id: string, organizationId: string): Promise<Worker> {
    return this.updateWorker(id, { active: true }, organizationId)
  }

  async deactivateWorker(id: string, organizationId: string): Promise<Worker> {
    return this.updateWorker(id, { active: false }, organizationId)
  }

  async searchWorkers(organizationId: string, query: string, limit = 10): Promise<Worker[]> {
    return this.workerRepo.searchWorkers(organizationId, query, limit)
  }

  async getWorkersIncludingDeleted(organizationId: string, limit?: number): Promise<Worker[]> {
    const startTime = Date.now()

    try {
      const workers = await this.workerRepo.findMany({
        where: { organizationId },
        limit,
        orderBy: [{ field: 'name', direction: 'asc' }],
      })

      logger.info('Workers retrieved successfully (including deleted)', {
        operation: 'get_workers_including_deleted',
        duration_ms: Date.now() - startTime,
        success: true,
        organization_id: organizationId,
        worker_count: workers.length,
      })

      return workers
    } catch (error) {
      logger.error(
        'Failed to list workers including deleted',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'get_workers_including_deleted',
          duration_ms: Date.now() - startTime,
          success: false,
          organization_id: organizationId,
          error_type: 'unknown',
        }
      )

      throw error
    }
  }

  async searchWorkersIncludingDeleted(
    organizationId: string,
    query: string,
    limit?: number
  ): Promise<Worker[]> {
    const startTime = Date.now()

    try {
      const workers = await this.workerRepo.findMany({
        where: { organizationId },
        search: {
          fields: ['name', 'email', 'phone'],
          query,
        },
        limit,
        orderBy: [{ field: 'name', direction: 'asc' }],
      })

      logger.info('Workers searched successfully (including deleted)', {
        operation: 'search_workers_including_deleted',
        duration_ms: Date.now() - startTime,
        success: true,
        organization_id: organizationId,
        worker_count: workers.length,
      })

      return workers
    } catch (error) {
      logger.error(
        'Failed to search workers including deleted',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'search_workers_including_deleted',
          duration_ms: Date.now() - startTime,
          success: false,
          organization_id: organizationId,
          error_type: 'unknown',
        }
      )

      throw error
    }
  }

  async getActiveWorkers(organizationId: string): Promise<Worker[]> {
    return this.workerRepo.findActiveWorkers(organizationId)
  }

  async getWorkersByActiveStatus(organizationId: string, active?: boolean): Promise<Worker[]> {
    if (active === undefined) {
      return this.getWorkers(organizationId)
    }
    return this.workerRepo.findByActiveStatus(organizationId, active)
  }

  async findWorkerByPhone(phone: string, organizationId: string): Promise<Worker | null> {
    const formattedPhone = formatAustralianPhone(phone)
    return this.workerRepo.findByPhoneActive(formattedPhone, organizationId)
  }

  // Validation helpers
  private validateWorkerData(data: CreateWorkerRequest | UpdateWorkerRequest): void {
    if ('name' in data && data.name && data.name.trim().length === 0) {
      throw new Error('Worker name cannot be empty')
    }

    if ('name' in data && data.name && data.name.trim().length > 255) {
      throw new Error('Name must be 255 characters or less')
    }

    if ('phone' in data && data.phone) {
      // Basic phone validation - formatAustralianPhone will handle detailed validation
      const trimmedPhone = data.phone.trim()
      if (trimmedPhone.length === 0) {
        throw new Error('Phone number cannot be empty')
      }
    }

    if ('email' in data && data.email) {
      const trimmedEmail = data.email.trim()
      if (trimmedEmail.length > 0 && !trimmedEmail.includes('@')) {
        throw new Error('Invalid email format')
      }
    }
  }

  // Business logic methods
  async canSendSMS(workerId: string, organizationId: string): Promise<boolean> {
    const worker = await this.getWorkerById(workerId, organizationId)
    return worker ? worker.active : false
  }

  async getWorkersWithSMSCount(organizationId: string): Promise<
    Array<{
      worker: Worker
      smsCount: number
    }>
  > {
    const workers = await this.getWorkers(organizationId)

    // In a real implementation, this would be optimized with a join
    const workersWithCount = await Promise.all(
      workers.map(async (worker) => {
        const stats = await this.workerRepo.getWorkerStats(worker.id)
        return {
          worker,
          smsCount: stats.totalSms,
        }
      })
    )

    return workersWithCount.sort((a, b) => b.smsCount - a.smsCount)
  }

  async bulkUpdateStatus(
    workerIds: string[],
    active: boolean,
    organizationId: string
  ): Promise<Worker[]> {
    const updatedWorkers = await Promise.all(
      workerIds.map(async (id) => {
        try {
          return await this.updateWorker(id, { active }, organizationId)
        } catch (error) {
          console.error(
            `[bulkUpdateStatus] Failed to update worker ${id}:`,
            error instanceof Error ? error.message : error
          )
          return null
        }
      })
    )

    return updatedWorkers.filter((worker): worker is Worker => worker !== null)
  }
}
