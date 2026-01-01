/**
 * Worker Service (Refactored)
 * 
 * Business logic for worker operations using the repository pattern
 * Replaces direct database queries with repository abstraction
 */

import { WorkerRepository } from '@dashboard-link/database';
import type { Worker } from '@dashboard-link/shared';
import { formatAustralianPhone } from '@dashboard-link/shared';

export interface CreateWorkerRequest {
  name: string;
  phone: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateWorkerRequest {
  name?: string;
  phone?: string;
  email?: string;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface WorkerStats {
  totalSms: number;
  sentSms: number;
  failedSms: number;
  smsToday: number;
  smsThisWeek: number;
}

export class WorkerService {
  constructor(private workerRepo: WorkerRepository) {}

  async getWorkers(organizationId: string): Promise<Worker[]> {
    return this.workerRepo.findByOrganizationId(organizationId);
  }

  async getWorkerById(id: string, organizationId: string): Promise<Worker | null> {
    const worker = await this.workerRepo.findById(id);
    
    if (!worker || worker.organizationId !== organizationId) {
      return null;
    }
    
    return worker;
  }

  async getWorkerStats(workerId: string, organizationId: string): Promise<{
    worker: Worker;
    stats: WorkerStats;
  }> {
    const worker = await this.getWorkerById(workerId, organizationId);
    
    if (!worker) {
      throw new Error('Worker not found');
    }
    
    const stats = await this.workerRepo.getWorkerStats(workerId);
    
    return {
      worker,
      stats
    };
  }

  async createWorker(
    data: CreateWorkerRequest, 
    organizationId: string
  ): Promise<Worker> {
    // Validate and format phone number
    const formattedPhone = formatAustralianPhone(data.phone);
    
    const workerData = {
      name: data.name.trim(),
      phone: formattedPhone,
      email: data.email?.trim() || undefined,
      organizationId,
      active: true,
      metadata: data.metadata || {}
    };

    return this.workerRepo.create(workerData);
  }

  async updateWorker(
    id: string, 
    data: UpdateWorkerRequest, 
    organizationId: string
  ): Promise<Worker> {
    // Verify worker belongs to organization
    const existingWorker = await this.getWorkerById(id, organizationId);
    if (!existingWorker) {
      throw new Error('Worker not found');
    }

    const updateData: Partial<Worker> = {};
    
    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }
    
    if (data.phone !== undefined) {
      updateData.phone = formatAustralianPhone(data.phone);
    }
    
    if (data.email !== undefined) {
      updateData.email = data.email?.trim() || undefined;
    }
    
    if (data.active !== undefined) {
      updateData.active = data.active;
    }
    
    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata;
    }

    return this.workerRepo.update(id, updateData);
  }

  async deleteWorker(id: string, organizationId: string): Promise<void> {
    // Verify worker belongs to organization
    const worker = await this.getWorkerById(id, organizationId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    await this.workerRepo.delete(id);
  }

  async activateWorker(id: string, organizationId: string): Promise<Worker> {
    return this.updateWorker(id, { active: true }, organizationId);
  }

  async deactivateWorker(id: string, organizationId: string): Promise<Worker> {
    return this.updateWorker(id, { active: false }, organizationId);
  }

  async searchWorkers(
    organizationId: string,
    query: string,
    limit = 10
  ): Promise<Worker[]> {
    return this.workerRepo.searchWorkers(organizationId, query, limit);
  }

  async getActiveWorkers(organizationId: string): Promise<Worker[]> {
    return this.workerRepo.findActiveWorkers(organizationId);
  }

  async findWorkerByPhone(
    phone: string, 
    organizationId: string
  ): Promise<Worker | null> {
    const formattedPhone = formatAustralianPhone(phone);
    return this.workerRepo.findByPhone(formattedPhone, organizationId);
  }

  // Validation helpers
  private validateWorkerData(data: CreateWorkerRequest | UpdateWorkerRequest): void {
    if ('name' in data && data.name && data.name.trim().length === 0) {
      throw new Error('Worker name cannot be empty');
    }
    
    if ('phone' in data && data.phone) {
      // Basic phone validation - formatAustralianPhone will handle detailed validation
      const trimmedPhone = data.phone.trim();
      if (trimmedPhone.length === 0) {
        throw new Error('Phone number cannot be empty');
      }
    }
    
    if ('email' in data && data.email) {
      const trimmedEmail = data.email.trim();
      if (trimmedEmail.length > 0 && !trimmedEmail.includes('@')) {
        throw new Error('Invalid email format');
      }
    }
  }

  // Business logic methods
  async canSendSMS(workerId: string, organizationId: string): Promise<boolean> {
    const worker = await this.getWorkerById(workerId, organizationId);
    return worker ? worker.active : false;
  }

  async getWorkersWithSMSCount(organizationId: string): Promise<Array<{
    worker: Worker;
    smsCount: number;
  }>> {
    const workers = await this.getWorkers(organizationId);
    
    // In a real implementation, this would be optimized with a join
    const workersWithCount = await Promise.all(
      workers.map(async (worker) => {
        const stats = await this.workerRepo.getWorkerStats(worker.id);
        return {
          worker,
          smsCount: stats.totalSms
        };
      })
    );

    return workersWithCount.sort((a, b) => b.smsCount - a.smsCount);
  }

  async bulkUpdateStatus(
    workerIds: string[], 
    active: boolean, 
    organizationId: string
  ): Promise<Worker[]> {
    const updatedWorkers = await Promise.all(
      workerIds.map(async (id) => {
        try {
          return await this.updateWorker(id, { active }, organizationId);
        } catch (error) {
          console.error(`Failed to update worker ${id}:`, error);
          return null;
        }
      })
    );

    return updatedWorkers.filter((worker): worker is Worker => worker !== null);
  }
}
