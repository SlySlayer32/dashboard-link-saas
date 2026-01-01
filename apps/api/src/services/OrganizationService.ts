/**
 * Organization Service (Refactored)
 * 
 * Business logic for organization operations using the repository pattern
 * Replaces direct database queries with repository abstraction
 */

import { OrganizationRepository } from '@dashboard-link/database';
import type { Admin, Organization } from '@dashboard-link/shared';

export interface UpdateOrganizationRequest {
  name?: string;
  settings?: {
    smsSenderId?: string;
    defaultTokenExpiry?: number; // in hours
    customMetadata?: Record<string, unknown>;
  };
}

export interface OrganizationWithAdmins {
  organization: Organization;
  admins: Admin[];
}

export class OrganizationService {
  constructor(private organizationRepo: OrganizationRepository) {}

  async getOrganizationById(id: string): Promise<Organization | null> {
    return this.organizationRepo.findById(id);
  }

  async getOrganizationByName(name: string): Promise<Organization | null> {
    return this.organizationRepo.findByName(name);
  }

  async updateOrganization(
    id: string, 
    data: UpdateOrganizationRequest
  ): Promise<Organization> {
    const updateData: Partial<Organization> = {};
    
    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }
    
    if (data.settings !== undefined) {
      updateData.settings = {
        ...data.settings,
        // Convert hours to seconds for storage
        defaultTokenExpiry: data.settings.defaultTokenExpiry 
          ? data.settings.defaultTokenExpiry * 3600 
          : undefined
      };
    }

    return this.organizationRepo.update(id, updateData);
  }

  async updateOrganizationSettings(
    id: string, 
    settings: Organization['settings']
  ): Promise<Organization> {
    return this.organizationRepo.updateSettings(id, settings);
  }

  async getOrganizationWithAdmins(organizationId: string): Promise<OrganizationWithAdmins> {
    return this.organizationRepo.getOrganizationWithAdmins(organizationId);
  }

  async searchOrganizations(query: string, limit = 10): Promise<Organization[]> {
    return this.organizationRepo.searchOrganizations(query, limit);
  }

  // Validation helpers
  private validateOrganizationData(data: UpdateOrganizationRequest): void {
    if (data.name !== undefined) {
      const trimmedName = data.name.trim();
      if (trimmedName.length === 0) {
        throw new Error('Organization name cannot be empty');
      }
      
      if (trimmedName.length > 255) {
        throw new Error('Organization name is too long (max 255 characters)');
      }
    }
    
    if (data.settings?.smsSenderId !== undefined) {
      const senderId = data.settings.smsSenderId;
      if (senderId && senderId.length > 11) {
        throw new Error('SMS sender ID must be 11 characters or less');
      }
    }
    
    if (data.settings?.defaultTokenExpiry !== undefined) {
      const expiry = data.settings.defaultTokenExpiry;
      if (expiry < 1 || expiry > 168) { // 1 hour to 7 days
        throw new Error('Default token expiry must be between 1 and 168 hours');
      }
    }
  }

  // Business logic methods
  async canSendSMS(organizationId: string): Promise<boolean> {
    const organization = await this.organizationRepo.findById(organizationId);
    return organization ? !!organization.settings?.smsSenderId : false;
  }

  async getTokenExpiryHours(organizationId: string): Promise<number> {
    const organization = await this.organizationRepo.findById(organizationId);
    const expirySeconds = organization?.settings?.defaultTokenExpiry || 3600; // Default 1 hour
    return expirySeconds / 3600; // Convert to hours
  }

  async getSMSSenderId(organizationId: string): Promise<string> {
    const organization = await this.organizationRepo.findById(organizationId);
    return organization?.settings?.smsSenderId || 'DashLink';
  }

  async getCustomMetadata(organizationId: string): Promise<Record<string, unknown>> {
    const organization = await this.organizationRepo.findById(organizationId);
    return organization?.settings?.customMetadata || {};
  }

  async updateCustomMetadata(
    organizationId: string, 
    metadata: Record<string, unknown>
  ): Promise<Organization> {
    const organization = await this.organizationRepo.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    const updatedSettings = {
      ...organization.settings,
      customMetadata: metadata
    };

    return this.organizationRepo.updateSettings(organizationId, updatedSettings);
  }

  // Analytics methods
  async getOrganizationStats(organizationId: string): Promise<{
    adminCount: number;
    workerCount: number;
    dashboardCount: number;
    totalSMSSent: number;
    totalSMSCost: number;
  }> {
    // This would typically involve joins with other tables
    // For now, returning placeholder data
    const organization = await this.organizationRepo.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    // In a real implementation, these would be actual database queries
    return {
      adminCount: 0,
      workerCount: 0,
      dashboardCount: 0,
      totalSMSSent: 0,
      totalSMSCost: 0
    };
  }

  // Utility methods
  formatOrganizationForResponse(organization: Organization): Organization {
    return {
      ...organization,
      settings: organization.settings ? {
        smsSenderId: organization.settings.smsSenderId || 'DashLink',
        defaultTokenExpiry: (organization.settings.defaultTokenExpiry || 3600) / 3600, // Convert to hours
        customMetadata: organization.settings.customMetadata || {}
      } : undefined
    };
  }
}
