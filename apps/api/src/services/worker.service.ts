import { supabase } from '../lib/db.js';
import { parsePhoneNumber } from 'libphonenumber-js';

export interface CreateWorkerData {
  full_name: string;
  phone_number: string;
  calendar_email?: string;
}

export interface UpdateWorkerData {
  full_name?: string;
  phone_number?: string;
  calendar_email?: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export class WorkerService {
  /**
   * Validate and format phone number to E.164 format
   */
  private validatePhoneNumber(phone: string): string {
    try {
      const phoneNumber = parsePhoneNumber(phone, 'AU');
      if (!phoneNumber.isValid()) {
        throw new Error('Invalid phone number');
      }
      return phoneNumber.format('E.164');
    } catch (error) {
      throw new Error(`Invalid phone number format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get workers for an organization with pagination
   */
  async getWorkers(orgId: string, pagination: PaginationParams = {}) {
    const { limit = 50, offset = 0 } = pagination;

    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('organization_id', orgId)
      .order('full_name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get workers: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new worker
   */
  async createWorker(orgId: string, workerData: CreateWorkerData) {
    // Validate and format phone number
    const formattedPhone = this.validatePhoneNumber(workerData.phone_number);

    const { data, error } = await supabase
      .from('workers')
      .insert({
        organization_id: orgId,
        full_name: workerData.full_name.trim(),
        phone_number: formattedPhone,
        calendar_email: workerData.calendar_email?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create worker: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a worker
   */
  async updateWorker(workerId: string, orgId: string, updateData: UpdateWorkerData) {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.full_name !== undefined) {
      updates.full_name = updateData.full_name.trim();
    }

    if (updateData.phone_number !== undefined) {
      updates.phone_number = this.validatePhoneNumber(updateData.phone_number);
    }

    if (updateData.calendar_email !== undefined) {
      updates.calendar_email = updateData.calendar_email?.trim() || null;
    }

    const { data, error } = await supabase
      .from('workers')
      .update(updates)
      .eq('id', workerId)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update worker: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a worker
   */
  async deleteWorker(workerId: string, orgId: string) {
    const { error } = await supabase
      .from('workers')
      .delete()
      .eq('id', workerId)
      .eq('organization_id', orgId);

    if (error) {
      throw new Error(`Failed to delete worker: ${error.message}`);
    }
  }
}

export const workerService = new WorkerService();
