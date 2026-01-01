/**
 * SMS Log Repository
 * 
 * Repository implementation for SMS Log entities
 * Handles all database operations for SMS logs
 */

import type {
    RepositoryFilter,
    SMSLog
} from '@dashboard-link/shared';
import { DatabaseAdapter } from '../adapters/DatabaseAdapter.js';
import { BaseRepository, RepositoryUtils } from '../base/BaseRepository.js';

export class SMSLogRepository extends BaseRepository<SMSLog> {
  protected tableName = 'sms_logs';

  constructor(adapter: DatabaseAdapter) {
    super();
    this.adapter = adapter;
  }

  async findById(id: string): Promise<SMSLog | null> {
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

  async findMany(filter: RepositoryFilter): Promise<SMSLog[]> {
    try {
      const query = this.buildQuery(filter);
      const results = await query.build();
      return results.map(row => this.transformFromDB(row));
    } catch (error) {
      throw this.handleError(error, 'findMany');
    }
  }

  async findOne(filter: RepositoryFilter): Promise<SMSLog | null> {
    try {
      const query = this.buildQuery({ ...filter, limit: 1 });
      const results = await query.build();
      return results.length > 0 ? this.transformFromDB(results[0]) : null;
    } catch (error) {
      throw this.handleError(error, 'findOne');
    }
  }

  async create(data: Partial<SMSLog>): Promise<SMSLog> {
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

  async update(id: string, data: Partial<SMSLog>): Promise<SMSLog> {
    this.validateId(id);
    this.validateUpdateData(data);
    
    try {
      const updateData = this.setUpdateTimestamps(data);
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

  // Custom SMS log-specific methods
  async findByWorkerId(workerId: string, limit = 100): Promise<SMSLog[]> {
    return this.findMany({
      where: { workerId },
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit
    });
  }

  async findByOrganizationId(organizationId: string, limit = 100): Promise<SMSLog[]> {
    return this.findMany({
      where: { organizationId },
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit
    });
  }

  async findByStatus(status: SMSLog['status'], organizationId?: string): Promise<SMSLog[]> {
    const filter: RepositoryFilter = {
      where: { status },
      orderBy: [{ field: 'createdAt', direction: 'desc' }]
    };
    
    if (organizationId) {
      filter.where = { ...filter.where, organizationId };
    }
    
    return this.findMany(filter);
  }

  async findByProvider(provider: string, organizationId?: string): Promise<SMSLog[]> {
    const filter: RepositoryFilter = {
      where: { provider },
      orderBy: [{ field: 'createdAt', direction: 'desc' }]
    };
    
    if (organizationId) {
      filter.where = { ...filter.where, organizationId };
    }
    
    return this.findMany(filter);
  }

  async findByProviderMessageId(providerMessageId: string): Promise<SMSLog | null> {
    return this.findOne({
      where: { providerMessageId }
    });
  }

  async getSMSStats(
    workerId?: string, 
    organizationId?: string,
    dateRange?: { start: string; end: string }
  ): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
    delivered: number;
    totalCost: number;
  }> {
    try {
      const filter: RepositoryFilter = {};
      
      if (workerId) {
        filter.where = { ...filter.where, workerId };
      }
      
      if (organizationId) {
        filter.where = { ...filter.where, organizationId };
      }
      
      if (dateRange) {
        filter.whereBetween = {
          createdAt: [dateRange.start, dateRange.end]
        };
      }

      const allLogs = await this.findMany(filter);
      
      const stats = allLogs.reduce((acc, log) => {
        acc.total++;
        acc[log.status]++;
        if (log.cost) acc.totalCost += log.cost;
        return acc;
      }, {
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0,
        delivered: 0,
        totalCost: 0
      });

      return stats;
    } catch (error) {
      throw this.handleError(error, 'getSMSStats');
    }
  }

  async getDailySMSStats(
    organizationId: string,
    days = 30
  ): Promise<Array<{
    date: string;
    sent: number;
    failed: number;
    cost: number;
  }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const logs = await this.findMany({
        where: { organizationId },
        whereBetween: {
          createdAt: [startDate.toISOString(), new Date().toISOString()]
        },
        orderBy: [{ field: 'createdAt', direction: 'asc' }]
      });

      // Group by date
      const dailyStats = logs.reduce((acc, log) => {
        const date = log.createdAt.split('T')[0];
        if (!acc[date]) {
          acc[date] = { sent: 0, failed: 0, cost: 0 };
        }
        
        if (log.status === 'sent' || log.status === 'delivered') {
          acc[date].sent++;
        } else if (log.status === 'failed') {
          acc[date].failed++;
        }
        
        if (log.cost) acc[date].cost += log.cost;
        
        return acc;
      }, {} as Record<string, { sent: number; failed: number; cost: number }>);

      // Convert to array and fill missing dates
      const result = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dateStr = date.toISOString().split('T')[0];
        
        result.push({
          date: dateStr,
          ...dailyStats[dateStr]
        });
      }

      return result.reverse();
    } catch (error) {
      throw this.handleError(error, 'getDailySMSStats');
    }
  }

  async updateStatus(id: string, status: SMSLog['status'], metadata?: Record<string, unknown>): Promise<SMSLog> {
    this.validateId(id);
    
    try {
      const updateData = this.setUpdateTimestamps({ status });
      if (metadata) {
        updateData.metadata = metadata;
      }
      
      const transformedData = this.transformToDB(updateData);
      
      const result = await this.adapter
        .query(this.tableName)
        .where({ id, ...transformedData })
        .first();
      
      return this.transformFromDB(result);
    } catch (error) {
      throw this.handleError(error, 'updateStatus');
    }
  }

  async searchSMSLogs(
    organizationId: string,
    query: string,
    limit = 10
  ): Promise<SMSLog[]> {
    return this.findMany({
      where: { organizationId },
      search: {
        fields: ['to', 'from', 'body'],
        query
      },
      limit,
      orderBy: [{ field: 'createdAt', direction: 'desc' }]
    });
  }

  // Transform methods
  protected transformFromDB(row: any): SMSLog {
    if (!row) return null;
    
    return {
      id: row.id,
      workerId: row.worker_id,
      organizationId: row.organization_id,
      to: row.to,
      from: row.from,
      body: row.body,
      status: row.status,
      provider: row.provider,
      providerMessageId: row.provider_message_id,
      cost: row.cost,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  protected transformToDB(smsLog: Partial<SMSLog>): any {
    const result: any = {};
    
    if (smsLog.workerId !== undefined) result.worker_id = smsLog.workerId;
    if (smsLog.organizationId !== undefined) result.organization_id = smsLog.organizationId;
    if (smsLog.to !== undefined) result.to = smsLog.to;
    if (smsLog.from !== undefined) result.from = smsLog.from;
    if (smsLog.body !== undefined) result.body = smsLog.body;
    if (smsLog.status !== undefined) result.status = smsLog.status;
    if (smsLog.provider !== undefined) result.provider = smsLog.provider;
    if (smsLog.providerMessageId !== undefined) result.provider_message_id = smsLog.providerMessageId;
    if (smsLog.cost !== undefined) result.cost = smsLog.cost;
    if (smsLog.metadata !== undefined) result.metadata = smsLog.metadata;
    if (smsLog.createdAt !== undefined) result.created_at = smsLog.createdAt;
    if (smsLog.updatedAt !== undefined) result.updated_at = smsLog.updatedAt;
    
    return result;
  }

  // Validation helpers
  protected validateSMSLogData(data: Partial<SMSLog>): void {
    if (data.to && !RepositoryUtils.isValidPhone(data.to)) {
      throw new Error('Invalid recipient phone number');
    }
    
    if (data.from && !RepositoryUtils.isValidPhone(data.from)) {
      throw new Error('Invalid sender phone number');
    }
    
    if (data.body && data.body.length > 1600) {
      throw new Error('SMS body is too long (max 1600 characters)');
    }
    
    if (data.cost !== undefined && (data.cost < 0 || data.cost > 10)) {
      throw new Error('SMS cost must be between 0 and 10');
    }
    
    const validStatuses = ['pending', 'sent', 'failed', 'delivered'];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  // Override create validation
  protected validateCreateData(data: Partial<SMSLog>): void {
    super.validateCreateData(data);
    this.validateSMSLogData(data);
    
    if (!data.workerId) {
      throw new Error('Worker ID is required');
    }
    
    if (!data.organizationId) {
      throw new Error('Organization ID is required');
    }
    
    if (!data.to) {
      throw new Error('Recipient phone number is required');
    }
    
    if (!data.body) {
      throw new Error('SMS body is required');
    }
    
    if (!data.provider) {
      throw new Error('SMS provider is required');
    }
  }

  // Override update validation
  protected validateUpdateData(data: Partial<SMSLog>): void {
    super.validateUpdateData(data);
    this.validateSMSLogData(data);
  }
}
