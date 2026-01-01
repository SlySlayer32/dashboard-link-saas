/**
 * Dashboard Repository
 * 
 * Repository implementation for Dashboard entities
 * Handles all database operations for dashboards
 */

import type {
    Dashboard,
    RepositoryFilter
} from '@dashboard-link/shared';
import { DatabaseAdapter } from '../adapters/DatabaseAdapter.js';
import { BaseRepository } from '../base/BaseRepository.js';

export class DashboardRepository extends BaseRepository<Dashboard> {
  protected tableName = 'dashboards';

  constructor(adapter: DatabaseAdapter) {
    super(adapter);
  }

  async findById(id: string): Promise<Dashboard | null> {
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

  async findMany(filter: RepositoryFilter): Promise<Dashboard[]> {
    try {
      const query = this.buildQuery(filter);
      const results = await query.build();
      return results.map(row => this.transformFromDB(row));
    } catch (error) {
      throw this.handleError(error, 'findMany');
    }
  }

  async findOne(filter: RepositoryFilter): Promise<Dashboard | null> {
    try {
      const query = this.buildQuery({ ...filter, limit: 1 });
      const results = await query.build();
      return results.length > 0 ? this.transformFromDB(results[0]) : null;
    } catch (error) {
      throw this.handleError(error, 'findOne');
    }
  }

  async create(data: Partial<Dashboard>): Promise<Dashboard> {
    this.validateCreateData(data);
    
    try {
      const insertData = this.setCreateTimestamps(data);
      const transformedData = this.transformToDB(insertData);
      
      const created = await this.adapter
        .query(this.tableName)
        .where(transformedData)
        .first();
      
      return this.transformFromDB(created);
    } catch (error) {
      throw this.handleError(error, 'create');
    }
  }

  async update(id: string, data: Partial<Dashboard>): Promise<Dashboard> {
    this.validateId(id);
    this.validateUpdateData(data);
    
    try {
      const updateData = this.setUpdateTimestamp(data);
      const transformedData = this.transformToDB(updateData);
      
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
      await this.adapter
        .query(this.tableName)
        .where({ id })
        .first();
    } catch (error) {
      throw this.handleError(error, 'delete');
    }
  }

  // Custom dashboard-specific methods
  async findByWorkerId(workerId: string): Promise<Dashboard[]> {
    return this.findMany({
      where: { workerId },
      orderBy: [{ field: 'createdAt', direction: 'desc' }]
    });
  }

  async findByOrganizationId(organizationId: string): Promise<Dashboard[]> {
    return this.findMany({
      where: { organizationId },
      orderBy: [{ field: 'name', direction: 'asc' }]
    });
  }

  async findActiveDashboards(workerId?: string, organizationId?: string): Promise<Dashboard[]> {
    const filter: RepositoryFilter = {
      where: { active: true }
    };
    
    if (workerId) {
      filter.where = { ...filter.where, workerId };
    }
    
    if (organizationId) {
      filter.where = { ...filter.where, organizationId };
    }
    
    return this.findMany({
      ...filter,
      orderBy: [{ field: 'name', direction: 'asc' }]
    });
  }

  async activateDashboard(id: string): Promise<Dashboard> {
    return this.update(id, { active: true });
  }

  async deactivateDashboard(id: string): Promise<Dashboard> {
    return this.update(id, { active: false });
  }

  async updateDashboardConfig(id: string, config: Dashboard['config']): Promise<Dashboard> {
    this.validateId(id);
    
    try {
      const updateData = this.setUpdateTimestamp({ config });
      const transformedData = this.transformToDB(updateData);
      
      const result = await this.adapter
        .query(this.tableName)
        .where({ id, ...transformedData })
        .first();
      
      return this.transformFromDB(result);
    } catch (error) {
      throw this.handleError(error, 'updateDashboardConfig');
    }
  }

  async getDashboardWithWorker(dashboardId: string): Promise<{
    dashboard: Dashboard;
    worker?: {
      id: string;
      name: string;
      phone: string;
      email?: string;
    };
  }> {
    try {
      const dashboard = await this.findById(dashboardId);
      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      let worker: {
        id: string;
        name: string;
        phone: string;
        email?: string;
      } | undefined = undefined;
      if (dashboard.workerId) {
        // This would typically join with workers table
        const workerData = await this.adapter
          .query('workers')
          .where({ id: dashboard.workerId })
          .first();

        if (workerData) {
          const workerRecord = workerData as Record<string, unknown>;
          worker = {
            id: workerRecord.id as string,
            name: workerRecord.name as string,
            phone: workerRecord.phone as string,
            email: workerRecord.email as string | undefined
          };
        }
      }

      return { dashboard, worker };
    } catch (error) {
      throw this.handleError(error, 'getDashboardWithWorker');
    }
  }

  async searchDashboards(
    organizationId: string, 
    query: string, 
    limit = 10
  ): Promise<Dashboard[]> {
    return this.findMany({
      where: { organizationId },
      search: {
        fields: ['name'],
        query
      },
      limit,
      orderBy: [{ field: 'name', direction: 'asc' }]
    });
  }

  // Transform methods
  protected transformFromDB(row: unknown): Dashboard {
    if (!row) {
      throw new Error('Cannot transform null or undefined row to Dashboard');
    }
    
    const data = row as Record<string, unknown>;
    return {
      id: data.id as string,
      name: data.name as string,
      workerId: data.worker_id as string,
      organizationId: data.organization_id as string,
      active: data.active as boolean,
      config: data.config as Record<string, unknown>,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    };
  }

  protected transformToDB(dashboard: Partial<Dashboard>): any {
    const result: any = {};
    
    if (dashboard.name !== undefined) result.name = dashboard.name;
    if (dashboard.workerId !== undefined) result.worker_id = dashboard.workerId;
    if (dashboard.organizationId !== undefined) result.organization_id = dashboard.organizationId;
    if (dashboard.active !== undefined) result.active = dashboard.active;
    if (dashboard.config !== undefined) result.config = dashboard.config;
    if (dashboard.createdAt !== undefined) result.created_at = dashboard.createdAt;
    if (dashboard.updatedAt !== undefined) result.updated_at = dashboard.updatedAt;
    
    return result;
  }

  // Validation helpers
  protected validateDashboardData(data: Partial<Dashboard>): void {
    if (data.name && data.name.trim().length === 0) {
      throw new Error('Dashboard name cannot be empty');
    }
    
    if (data.name && data.name.length > 255) {
      throw new Error('Dashboard name is too long (max 255 characters)');
    }
  }

  // Override create validation
  protected validateCreateData(data: Partial<Dashboard>): void {
    super.validateCreateData(data);
    this.validateDashboardData(data);
    
    if (!data.name) {
      throw new Error('Dashboard name is required');
    }
    
    if (!data.organizationId) {
      throw new Error('Organization ID is required');
    }
  }

  // Override update validation
  protected validateUpdateData(data: Partial<Dashboard>): void {
    super.validateUpdateData(data);
    this.validateDashboardData(data);
  }
}
