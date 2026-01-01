/**
 * Organization Repository
 * 
 * Repository implementation for Organization entities
 * Handles all database operations for organizations
 */

import type {
    Organization,
    RepositoryFilter
} from '@dashboard-link/shared';
import { DatabaseAdapter } from '../adapters/DatabaseAdapter.js';
import { BaseRepository } from '../base/BaseRepository.js';

export class OrganizationRepository extends BaseRepository<Organization> {
  protected tableName = 'organizations';

  constructor(adapter: DatabaseAdapter) {
    super();
    this.adapter = adapter;
  }

  async findById(id: string): Promise<Organization | null> {
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

  async findMany(filter: RepositoryFilter): Promise<Organization[]> {
    try {
      const query = this.buildQuery(filter);
      const results = await query.build();
      return results.map(row => this.transformFromDB(row));
    } catch (error) {
      throw this.handleError(error, 'findMany');
    }
  }

  async findOne(filter: RepositoryFilter): Promise<Organization | null> {
    try {
      const query = this.buildQuery({ ...filter, limit: 1 });
      const results = await query.build();
      return results.length > 0 ? this.transformFromDB(results[0]) : null;
    } catch (error) {
      throw this.handleError(error, 'findOne');
    }
  }

  async create(data: Partial<Organization>): Promise<Organization> {
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

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
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

  // Custom organization-specific methods
  async findByName(name: string): Promise<Organization | null> {
    return this.findOne({
      where: { name }
    });
  }

  async updateSettings(id: string, settings: Organization['settings']): Promise<Organization> {
    this.validateId(id);
    
    try {
      const updateData = this.setUpdateTimestamps({ settings });
      const transformedData = this.transformToDB(updateData);
      
      const result = await this.adapter
        .query(this.tableName)
        .where({ id, ...transformedData })
        .first();
      
      return this.transformFromDB(result);
    } catch (error) {
      throw this.handleError(error, 'updateSettings');
    }
  }

  async getOrganizationWithAdmins(organizationId: string): Promise<{
    organization: Organization;
    admins: Array<{
      id: string;
      authUserId: string;
      role: string;
      createdAt: string;
    }>;
  }> {
    try {
      const organization = await this.findById(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // This would typically join with admins table
      const admins = await this.adapter
        .query('admins')
        .where({ organizationId })
        .build();

      return {
        organization,
        admins: admins.map((admin: any) => ({
          id: admin.id,
          authUserId: admin.auth_user_id,
          role: admin.role,
          createdAt: admin.created_at
        }))
      };
    } catch (error) {
      throw this.handleError(error, 'getOrganizationWithAdmins');
    }
  }

  async searchOrganizations(query: string, limit = 10): Promise<Organization[]> {
    return this.findMany({
      search: {
        fields: ['name'],
        query
      },
      limit,
      orderBy: [{ field: 'name', direction: 'asc' }]
    });
  }

  // Transform methods
  protected transformFromDB(row: any): Organization {
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      settings: row.settings ? {
        smsSenderId: row.settings.sms_sender_id,
        defaultTokenExpiry: row.settings.default_token_expiry,
        customMetadata: row.settings.custom_metadata
      } : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  protected transformToDB(organization: Partial<Organization>): any {
    const result: any = {};
    
    if (organization.name !== undefined) result.name = organization.name;
    if (organization.createdAt !== undefined) result.created_at = organization.createdAt;
    if (organization.updatedAt !== undefined) result.updated_at = organization.updatedAt;
    
    if (organization.settings !== undefined) {
      result.settings = {};
      
      if (organization.settings.smsSenderId !== undefined) {
        result.settings.sms_sender_id = organization.settings.smsSenderId;
      }
      
      if (organization.settings.defaultTokenExpiry !== undefined) {
        result.settings.default_token_expiry = organization.settings.defaultTokenExpiry;
      }
      
      if (organization.settings.customMetadata !== undefined) {
        result.settings.custom_metadata = organization.settings.customMetadata;
      }
    }
    
    return result;
  }

  // Validation helpers
  protected validateOrganizationData(data: Partial<Organization>): void {
    if (data.name && data.name.trim().length === 0) {
      throw new Error('Organization name cannot be empty');
    }
    
    if (data.name && data.name.length > 255) {
      throw new Error('Organization name is too long (max 255 characters)');
    }
    
    if (data.settings?.smsSenderId && data.settings.smsSenderId.length > 11) {
      throw new Error('SMS sender ID must be 11 characters or less');
    }
    
    if (data.settings?.defaultTokenExpiry) {
      const expiry = data.settings.defaultTokenExpiry;
      if (expiry < 60 || expiry > 604800) { // 1 minute to 7 days
        throw new Error('Default token expiry must be between 60 and 604800 seconds');
      }
    }
  }

  // Override create validation
  protected validateCreateData(data: Partial<Organization>): void {
    super.validateCreateData(data);
    this.validateOrganizationData(data);
    
    if (!data.name) {
      throw new Error('Organization name is required');
    }
  }

  // Override update validation
  protected validateUpdateData(data: Partial<Organization>): void {
    super.validateUpdateData(data);
    this.validateOrganizationData(data);
  }
}
