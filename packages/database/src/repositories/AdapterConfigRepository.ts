/**
 * Adapter Config Repository
 *
 * Repository implementation for AdapterConfig entities
 * Handles all database operations for plugin/adapter configurations
 */

import type { AdapterConfig, RepositoryFilter } from '@dashboard-link/shared'
import { DatabaseAdapter } from '../adapters/DatabaseAdapter.js'
import { BaseRepository } from '../base/BaseRepository.js'

export class AdapterConfigRepository extends BaseRepository<AdapterConfig> {
  protected tableName = 'adapter_configs'

  constructor(adapter: DatabaseAdapter) {
    super(adapter)
  }

  async findById(id: string): Promise<AdapterConfig | null> {
    this.validateId(id)

    try {
      const result = await this.adapter.query(this.tableName).where({ id }).first()

      return result ? this.transformFromDB(result) : null
    } catch (error) {
      throw this.handleError(error, 'findById')
    }
  }

  async findMany(filter: RepositoryFilter): Promise<AdapterConfig[]> {
    try {
      const query = this.buildQuery(filter)
      const results = await query.build()
      return results.map((row) => this.transformFromDB(row))
    } catch (error) {
      throw this.handleError(error, 'findMany')
    }
  }

  async findOne(filter: RepositoryFilter): Promise<AdapterConfig | null> {
    try {
      const query = this.buildQuery({ ...filter, limit: 1 })
      const results = await query.build()
      return results.length > 0 ? this.transformFromDB(results[0]) : null
    } catch (error) {
      throw this.handleError(error, 'findOne')
    }
  }

  async create(data: Partial<AdapterConfig>): Promise<AdapterConfig> {
    this.validateCreateData(data)

    try {
      const insertData = this.setCreateTimestamps(data)
      const transformedData = this.transformToDB(insertData)

      const created = await this.adapter
        .query(this.tableName)
        .insert(transformedData)
        .returning('*')
        .first()

      return this.transformFromDB(created)
    } catch (error) {
      throw this.handleError(error, 'create')
    }
  }

  async update(id: string, data: Partial<AdapterConfig>): Promise<AdapterConfig> {
    this.validateId(id)
    this.validateUpdateData(data)

    try {
      const updateData = this.setUpdateTimestamp(data)
      const transformedData = this.transformToDB(updateData)

      const result = await this.adapter
        .query(this.tableName)
        .update(transformedData)
        .where({ id })
        .returning('*')
        .first()

      return this.transformFromDB(result)
    } catch (error) {
      throw this.handleError(error, 'update')
    }
  }

  async delete(id: string): Promise<void> {
    this.validateId(id)

    try {
      await this.adapter.query(this.tableName).delete().where({ id })
    } catch (error) {
      throw this.handleError(error, 'delete')
    }
  }

  // Custom adapter-config-specific methods
  async findByOrganizationId(organizationId: string): Promise<AdapterConfig[]> {
    return this.findMany({
      where: { organizationId },
      orderBy: [{ field: 'adapterType', direction: 'asc' }],
    })
  }

  async findByAdapterType(
    organizationId: string,
    adapterType: string
  ): Promise<AdapterConfig | null> {
    return this.findOne({
      where: { organizationId, adapterType },
    })
  }

  async findEnabled(organizationId: string): Promise<AdapterConfig[]> {
    return this.findMany({
      where: { organizationId, enabled: true },
      orderBy: [{ field: 'adapterType', direction: 'asc' }],
    })
  }

  async toggleEnabled(id: string, enabled: boolean): Promise<AdapterConfig> {
    return this.update(id, { enabled } as Partial<AdapterConfig>)
  }

  // Transform methods
  protected transformFromDB(row: unknown): AdapterConfig {
    if (!row) {
      throw new Error('Cannot transform null or undefined row to AdapterConfig')
    }

    const data = row as Record<string, unknown>
    return {
      id: data.id as string,
      organizationId: data.organization_id as string,
      adapterType: data.adapter_type as string,
      config: data.config as Record<string, unknown>,
      enabled: data.enabled as boolean,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    }
  }

  protected transformToDB(adapterConfig: Partial<AdapterConfig>): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    if (adapterConfig.organizationId !== undefined)
      result.organization_id = adapterConfig.organizationId
    if (adapterConfig.adapterType !== undefined) result.adapter_type = adapterConfig.adapterType
    if (adapterConfig.config !== undefined) result.config = adapterConfig.config
    if (adapterConfig.enabled !== undefined) result.enabled = adapterConfig.enabled
    if (adapterConfig.createdAt !== undefined) result.created_at = adapterConfig.createdAt
    if (adapterConfig.updatedAt !== undefined) result.updated_at = adapterConfig.updatedAt

    return result
  }

  // Override create validation
  protected validateCreateData(data: Partial<AdapterConfig>): void {
    super.validateCreateData(data)

    if (!data.organizationId) {
      throw new Error('Organization ID is required')
    }

    if (!data.adapterType) {
      throw new Error('Adapter type is required')
    }
  }
}
