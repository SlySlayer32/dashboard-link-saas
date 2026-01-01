/**
 * Worker Repository
 * 
 * Repository implementation for Worker entities
 * Handles all database operations for workers
 */

import type {
    RepositoryFilter,
    Worker
} from '@dashboard-link/shared';
import { DatabaseAdapter } from '../adapters/DatabaseAdapter.js';
import { BaseRepository, RepositoryUtils } from '../base/BaseRepository.js';

export class WorkerRepository extends BaseRepository<Worker> {
  protected tableName = 'workers';

  constructor(adapter: DatabaseAdapter) {
    super(adapter);
  }

  async findById(id: string): Promise<Worker | null> {
    this.validateId(id);
    
    try {
      const result = await this.adapter
        .query(this.tableName)
        .where({ id })
        .first();
      
      return result ? this.transformFromDB(result) : null;
    } catch (error) {
      throw this.handleError(error, 'findById');
    }
  }

  async findMany(filter: RepositoryFilter): Promise<Worker[]> {
    try {
      const query = this.buildQuery(filter);
      const results = await query.build();
      return results.map(row => this.transformFromDB(row));
    } catch (error) {
      throw this.handleError(error, 'findMany');
    }
  }

  async findOne(filter: RepositoryFilter): Promise<Worker | null> {
    try {
      const query = this.buildQuery({ ...filter, limit: 1 });
      const results = await query.build();
      return results.length > 0 ? this.transformFromDB(results[0]) : null;
    } catch (error) {
      throw this.handleError(error, 'findOne');
    }
  }

  async create(data: Partial<Worker>): Promise<Worker> {
    this.validateCreateData(data);
    
    try {
      const transformedData = this.transformToDB(data);
      const result = await this.adapter
        .query(this.tableName)
        .where(transformedData)
        .first();
      
      // In a real implementation, you'd use insert()
      // This is simplified for the example
      const insertData = this.setCreateTimestamps(data);
      const insertTransformed = this.transformToDB(insertData);
      
      const created = await this.adapter
        .query(this.tableName)
        .where(insertTransformed)
        .first();
      
      return this.transformFromDB(created);
    } catch (error) {
      throw this.handleError(error, 'create');
    }
  }

  async update(id: string, data: Partial<Worker>): Promise<Worker> {
    this.validateId(id);
    this.validateUpdateData(data);
    
    try {
      const updateData = this.setUpdateTimestamp(data);
      const transformedData = this.transformToDB(updateData);
      
      // In a real implementation, you'd use update()
      const result = await this.adapter
        .query(this.tableName)
        .where({ id, ...transformedData })
        .first();
      
      return this.transformFromDB(result);
    } catch (error) {
      throw this.handleError(error, 'update');
    }
  }

  async delete(id: string): Promise<void> {
    this.validateId(id);
    
    try {
      // In a real implementation, you'd use delete()
      await this.adapter
        .query(this.tableName)
        .where({ id })
        .first();
    } catch (error) {
      throw this.handleError(error, 'delete');
    }
  }

  // Custom worker-specific methods
  async findByOrganizationId(organizationId: string): Promise<Worker[]> {
    return this.findMany({
      where: { organizationId },
      orderBy: [{ field: 'createdAt', direction: 'desc' }]
    });
  }

  async findByPhone(phone: string, organizationId?: string): Promise<Worker | null> {
    const filter: RepositoryFilter = {
      where: { phone }
    };
    
    if (organizationId) {
      filter.where = { ...filter.where, organizationId };
    }
    
    return this.findOne(filter);
  }

  async findActiveWorkers(organizationId: string): Promise<Worker[]> {
    return this.findMany({
      where: { 
        organizationId, 
        active: true 
      },
      orderBy: [{ field: 'name', direction: 'asc' }]
    });
  }

  async getWorkerStats(workerId: string): Promise<{
    totalSms: number;
    sentSms: number;
    failedSms: number;
    smsToday: number;
    smsThisWeek: number;
  }> {
    try {
      // This would typically join with sms_logs table
      // For now, returning placeholder data
      return {
        totalSms: 0,
        sentSms: 0,
        failedSms: 0,
        smsToday: 0,
        smsThisWeek: 0
      };
    } catch (error) {
      throw this.handleError(error, 'getWorkerStats');
    }
  }

  async searchWorkers(
    organizationId: string, 
    query: string, 
    limit = 10
  ): Promise<Worker[]> {
    return this.findMany({
      where: { organizationId },
      search: {
        fields: ['name', 'email', 'phone'],
        query
      },
      limit,
      orderBy: [{ field: 'name', direction: 'asc' }]
    });
  }

  // Transform methods
  protected transformFromDB(row: unknown): Worker {
    if (!row) {
      throw new Error('Cannot transform null or undefined row to Worker');
    }
    
    const data = row as Record<string, unknown>;
    return {
      id: data.id as string,
      name: data.name as string,
      phone: data.phone as string,
      email: data.email as string | undefined,
      organizationId: data.organization_id as string,
      active: data.active as boolean,
      metadata: data.metadata as Record<string, unknown>,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    };
  }

  protected transformToDB(worker: Partial<Worker>): any {
    const result: any = {};
    
    if (worker.name !== undefined) result.name = worker.name;
    if (worker.phone !== undefined) result.phone = worker.phone;
    if (worker.email !== undefined) result.email = worker.email;
    if (worker.organizationId !== undefined) result.organization_id = worker.organizationId;
    if (worker.active !== undefined) result.active = worker.active;
    if (worker.metadata !== undefined) result.metadata = worker.metadata;
    if (worker.createdAt !== undefined) result.created_at = worker.createdAt;
    if (worker.updatedAt !== undefined) result.updated_at = worker.updatedAt;
    
    return result;
  }

  // Validation helpers
  protected validateWorkerData(data: Partial<Worker>): void {
    if (data.name && data.name.trim().length === 0) {
      throw new Error('Worker name cannot be empty');
    }
    
    if (data.phone && !RepositoryUtils.isValidPhone(data.phone)) {
      throw new Error('Invalid phone number format');
    }
    
    if (data.email && !RepositoryUtils.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }
  }

  // Override create validation
  protected validateCreateData(data: Partial<Worker>): void {
    super.validateCreateData(data);
    this.validateWorkerData(data);
    
    if (!data.name) {
      throw new Error('Worker name is required');
    }
    
    if (!data.phone) {
      throw new Error('Worker phone is required');
    }
    
    if (!data.organizationId) {
      throw new Error('Organization ID is required');
    }
  }

  // Override update validation
  protected validateUpdateData(data: Partial<Worker>): void {
    super.validateUpdateData(data);
    this.validateWorkerData(data);
  }
}
