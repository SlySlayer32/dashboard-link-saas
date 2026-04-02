/**
 * Access Log Repository
 *
 * Repository implementation for AccessLog entities
 * Handles all database operations for access logs
 * Note: Access logs are immutable (no updates or deletes)
 */

import type { RepositoryFilter } from '@dashboard-link/shared'
import { DatabaseAdapter } from '../adapters/DatabaseAdapter.js'
import { BaseRepository } from '../base/BaseRepository.js'

export interface AccessLog {
  id: string
  organizationId: string
  workerId: string
  tokenId: string | null
  accessedAt: string
  ipAddress: string | null
  userAgent: string | null
  validationStatus: 'success' | 'expired' | 'invalid' | 'revoked'
  createdAt: string
  updatedAt: string // Required by BaseEntity, but never actually updated
}

export interface AccessLogCreateInput {
  organizationId: string
  workerId: string
  tokenId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  validationStatus: 'success' | 'expired' | 'invalid' | 'revoked'
}

export interface AccessLogStats {
  totalAccesses: number
  successfulAccesses: number
  failedAccesses: number
  uniqueWorkers: number
  openRate: number
}

export interface WorkerAccessStats {
  workerId: string
  workerName: string
  lastAccessedAt: string | null
  totalAccesses: number
  successfulAccesses: number
}

export class AccessLogRepository extends BaseRepository<AccessLog> {
  protected tableName = 'access_logs'

  constructor(adapter: DatabaseAdapter) {
    super(adapter)
  }

  async findById(id: string): Promise<AccessLog | null> {
    this.validateId(id)

    try {
      const result = await this.adapter.query(this.tableName).where({ id }).first()

      return result ? this.transformFromDB(result) : null
    } catch (error) {
      throw this.handleError(error, 'findById')
    }
  }

  async findMany(filter: RepositoryFilter): Promise<AccessLog[]> {
    try {
      const query = this.buildQuery(filter)
      const results = await query.build()
      return results.map((row) => this.transformFromDB(row))
    } catch (error) {
      throw this.handleError(error, 'findMany')
    }
  }

  async findOne(filter: RepositoryFilter): Promise<AccessLog | null> {
    try {
      const query = this.buildQuery({ ...filter, limit: 1 })
      const results = await query.build()
      return results.length > 0 ? this.transformFromDB(results[0]) : null
    } catch (error) {
      throw this.handleError(error, 'findOne')
    }
  }

  async create(data: AccessLogCreateInput): Promise<AccessLog> {
    this.validateCreateData(data)

    try {
      const insertData = this.setCreateTimestamps(data)
      const insertTransformed = this.transformToDB(insertData)

      const [created] = await this.adapter
        .query(this.tableName)
        .insert(insertTransformed)
        .returning('*')
        .build()

      return this.transformFromDB(created)
    } catch (error) {
      throw this.handleError(error, 'create')
    }
  }

  async update(_id: string, _data: Partial<AccessLog>): Promise<AccessLog> {
    throw new Error('Access logs are immutable and cannot be updated')
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Access logs are immutable and cannot be deleted')
  }

  // Custom access log methods

  /**
   * Find all access logs for a specific organization
   */
  async findByOrganizationId(
    organizationId: string,
    limit = 100,
    offset = 0
  ): Promise<AccessLog[]> {
    return this.findMany({
      where: { organizationId },
      orderBy: [{ field: 'accessedAt', direction: 'desc' }],
      limit,
      offset,
    })
  }

  /**
   * Find all access logs for a specific worker
   */
  async findByWorkerId(workerId: string, limit = 50, offset = 0): Promise<AccessLog[]> {
    return this.findMany({
      where: { workerId },
      orderBy: [{ field: 'accessedAt', direction: 'desc' }],
      limit,
      offset,
    })
  }

  /**
   * Find access logs within a date range
   */
  async findByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AccessLog[]> {
    try {
      const results = await this.adapter
        .query(this.tableName)
        .where({ organization_id: organizationId })
        .whereBetween('accessed_at', [startDate.toISOString(), endDate.toISOString()])
        .orderBy('accessed_at', 'desc')
        .build()

      return results.map((row) => this.transformFromDB(row))
    } catch (error) {
      throw this.handleError(error, 'findByDateRange')
    }
  }

  /**
   * Get the last access log for a specific worker
   */
  async findLastAccessByWorkerId(workerId: string): Promise<AccessLog | null> {
    return this.findOne({
      where: { workerId, validationStatus: 'success' },
      orderBy: [{ field: 'accessedAt', direction: 'desc' }],
    })
  }

  /**
   * Get access statistics for an organization
   */
  async getOrganizationStats(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AccessLogStats> {
    try {
      // Build filter for date range
      const filter: RepositoryFilter = {
        where: { organizationId },
      }

      if (startDate && endDate) {
        filter.whereBetween = {
          accessedAt: [startDate.toISOString(), endDate.toISOString()],
        }
      }

      // Get all records and calculate stats in memory (simpler than raw SQL)
      const allRecords = await this.findMany(filter)
      const totalAccesses = allRecords.length
      const successfulAccesses = allRecords.filter((r) => r.validationStatus === 'success').length
      const failedAccesses = allRecords.filter((r) => r.validationStatus !== 'success').length
      const uniqueWorkers = new Set(allRecords.map((r) => r.workerId)).size

      // Calculate open rate (successful accesses / total workers in org)
      const totalWorkers = await this.adapter
        .query('workers')
        .where({ organization_id: organizationId })
        .whereNull('deleted_at')
        .count()

      const openRate = totalWorkers > 0 ? uniqueWorkers / totalWorkers : 0

      return {
        totalAccesses,
        successfulAccesses,
        failedAccesses,
        uniqueWorkers,
        openRate,
      }
    } catch (error) {
      throw this.handleError(error, 'getOrganizationStats')
    }
  }

  /**
   * Get access statistics per worker for an organization
   */
  async getWorkerAccessStats(organizationId: string): Promise<WorkerAccessStats[]> {
    try {
      // Get all access logs for the organization
      const accessLogs = await this.findByOrganizationId(organizationId, 10000, 0)

      // Get all workers for the organization
      const workers = await this.adapter
        .query('workers')
        .where({ organization_id: organizationId })
        .whereNull('deleted_at')
        .build()

      // Aggregate in memory
      const workerStats = new Map<string, WorkerAccessStats>()

      workers.forEach((worker: any) => {
        const workerLogs = accessLogs.filter((log) => log.workerId === worker.id)
        const lastAccess =
          workerLogs.length > 0
            ? workerLogs.reduce((latest, log) =>
                new Date(log.accessedAt) > new Date(latest.accessedAt) ? log : latest
              ).accessedAt
            : null

        workerStats.set(worker.id, {
          workerId: worker.id,
          workerName: worker.name,
          lastAccessedAt: lastAccess,
          totalAccesses: workerLogs.length,
          successfulAccesses: workerLogs.filter((log) => log.validationStatus === 'success').length,
        })
      })

      return Array.from(workerStats.values()).sort((a, b) => {
        if (!a.lastAccessedAt) return 1
        if (!b.lastAccessedAt) return -1
        return new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
      })
    } catch (error) {
      throw this.handleError(error, 'getWorkerAccessStats')
    }
  }

  /**
   * Get failed access attempts for security monitoring
   */
  async getFailedAccessAttempts(organizationId: string, limit = 50): Promise<AccessLog[]> {
    return this.findMany({
      where: {
        organizationId,
        validationStatus: ['expired', 'invalid', 'revoked'],
      },
      orderBy: [{ field: 'accessedAt', direction: 'desc' }],
      limit,
    })
  }

  /**
   * Count access logs for a specific token
   */
  async countByTokenId(tokenId: string): Promise<number> {
    try {
      return await this.adapter.query(this.tableName).where({ token_id: tokenId }).count()
    } catch (error) {
      throw this.handleError(error, 'countByTokenId')
    }
  }

  // Transform methods
  protected transformFromDB(row: unknown): AccessLog {
    if (!row) {
      throw new Error('Cannot transform null or undefined row to AccessLog')
    }

    const data = row as Record<string, unknown>
    return {
      id: data.id as string,
      organizationId: data.organization_id as string,
      workerId: data.worker_id as string,
      tokenId: (data.token_id as string) || null,
      accessedAt: data.accessed_at as string,
      ipAddress: (data.ip_address as string) || null,
      userAgent: (data.user_agent as string) || null,
      validationStatus: data.validation_status as 'success' | 'expired' | 'invalid' | 'revoked',
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    }
  }

  protected transformToDB(log: Partial<AccessLog> | AccessLogCreateInput): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    if ('organizationId' in log && log.organizationId !== undefined)
      result.organization_id = log.organizationId
    if ('workerId' in log && log.workerId !== undefined) result.worker_id = log.workerId
    if ('tokenId' in log && log.tokenId !== undefined) result.token_id = log.tokenId
    if ('accessedAt' in log && log.accessedAt !== undefined) result.accessed_at = log.accessedAt
    if ('ipAddress' in log && log.ipAddress !== undefined) result.ip_address = log.ipAddress
    if ('userAgent' in log && log.userAgent !== undefined) result.user_agent = log.userAgent
    if ('validationStatus' in log && log.validationStatus !== undefined)
      result.validation_status = log.validationStatus
    if ('createdAt' in log && log.createdAt !== undefined) result.created_at = log.createdAt

    return result
  }

  // Validation helpers
  protected validateCreateData(data: Partial<AccessLogCreateInput>): void {
    super.validateCreateData(data)

    if (!data.organizationId) {
      throw new Error('Organization ID is required')
    }

    if (!data.workerId) {
      throw new Error('Worker ID is required')
    }

    if (!data.validationStatus) {
      throw new Error('Validation status is required')
    }

    const validStatuses = ['success', 'expired', 'invalid', 'revoked']
    if (!validStatuses.includes(data.validationStatus)) {
      throw new Error(`Invalid validation status. Must be one of: ${validStatuses.join(', ')}`)
    }

    if (data.userAgent && data.userAgent.length > 500) {
      throw new Error('User agent string cannot exceed 500 characters')
    }
  }
}
