/**
 * TokenService
 * Bridges the API layer to the @dashboard-link/tokens package and
 * the dashboard_tokens table for worker-facing token operations.
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

export interface RedeemTokenResult {
  workerId: string
  orgId: string
  dashboardId: string
  workerName: string
}

export interface CreateTokenOptions {
  workerId: string
  orgId: string
  dashboardId: string
  expiresInHours: number
}

export interface CreateTokenResult {
  rawToken: string
  tokenId: string
  expiresAt: string
}

function getSupabaseAdmin() {
  return createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')
}

export class TokenService {
  /**
   * Redeem a raw token string: hash it, look up the dashboard_tokens row,
   * verify expiry/revocation, fetch worker, and return dashboard data.
   */
  async redeemToken(rawToken: string): Promise<RedeemTokenResult> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const supabase = getSupabaseAdmin()

    const { data: tokenRow, error } = await supabase
      .from('dashboard_tokens')
      .select('id, worker_id, organization_id, expires_at, revoked_at')
      .eq('token_hash', tokenHash)
      .single()

    if (error || !tokenRow) {
      throw new Error('Invalid token')
    }

    if (tokenRow.revoked_at) {
      throw new Error('Token has been revoked')
    }

    if (new Date(tokenRow.expires_at) < new Date()) {
      throw new Error('Token has expired')
    }

    // Fetch worker
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('id, name')
      .eq('id', tokenRow.worker_id)
      .single()

    if (workerError || !worker) {
      throw new Error('Worker not found for token')
    }

    // Log access
    await supabase.from('access_logs').insert({
      organization_id: tokenRow.organization_id,
      worker_id: tokenRow.worker_id,
      token_id: tokenRow.id,
      validation_status: 'success',
    })

    return {
      workerId: tokenRow.worker_id,
      orgId: tokenRow.organization_id,
      dashboardId: tokenRow.id,
      workerName: worker.name,
    }
  }

  /**
   * Create a new dashboard token for a worker.
   * Returns the raw (unhashed) token string — only shown once.
   */
  async createToken(options: CreateTokenOptions): Promise<CreateTokenResult> {
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000).toISOString()

    const supabase = getSupabaseAdmin()

    const tokenId = crypto.randomUUID()
    const { error } = await supabase.from('dashboard_tokens').insert({
      id: tokenId,
      token_hash: tokenHash,
      worker_id: options.workerId,
      organization_id: options.orgId,
      expires_at: expiresAt,
    })

    if (error) {
      throw new Error(`Failed to create token: ${error.message}`)
    }

    return {
      rawToken,
      tokenId,
      expiresAt,
    }
  }
}
