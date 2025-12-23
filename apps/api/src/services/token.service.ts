import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import type { WorkerToken } from '@dashboard-link/shared';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export interface GenerateTokenOptions {
  workerId: string;
  expirySeconds?: number; // Default 1 day (86400 seconds)
}

export class TokenService {
  /**
   * Generate a secure random token
   */
  private static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate a new token for a worker
   */
  static async generateToken(
    options: GenerateTokenOptions
  ): Promise<WorkerToken> {
    const token = this.generateSecureToken();
    const expirySeconds = options.expirySeconds || 86400; // Default 1 day
    const expiresAt = new Date(Date.now() + expirySeconds * 1000);

    const { data, error } = await supabase
      .from('worker_tokens')
      .insert({
        worker_id: options.workerId,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to generate token: ${error.message}`);
    }

    return data as WorkerToken;
  }

  /**
   * Validate a token and return worker data
   */
  static async validateToken(token: string): Promise<{
    valid: boolean;
    workerId?: string;
    workerData?: unknown;
  }> {
    const { data: tokenData, error: tokenError } = await supabase
      .from('worker_tokens')
      .select('*, workers(*)')
      .eq('token', token)
      .eq('revoked', false)
      .single();

    if (tokenError || !tokenData) {
      return { valid: false };
    }

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      return { valid: false };
    }

    // Mark token as used (first time only)
    if (!tokenData.used_at) {
      await supabase
        .from('worker_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', tokenData.id);
    }

    return {
      valid: true,
      workerId: tokenData.worker_id,
      workerData: tokenData.workers,
    };
  }

  /**
   * Revoke a token
   */
  static async revokeToken(token: string): Promise<void> {
    await supabase
      .from('worker_tokens')
      .update({ revoked: true })
      .eq('token', token);
  }

  /**
   * Generate SMS-friendly short link
   */
  static generateDashboardLink(token: string): string {
    // Worker dashboard is on port 5174, not 5173 (which is admin)
    const appUrl = process.env.APP_URL || 'http://localhost:5174';
    return `${appUrl}/dashboard/${token}`;
  }
}
