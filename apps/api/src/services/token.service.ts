import type { WorkerToken } from '@dashboard-link/shared'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

export interface TokenListOptions {
  page?: number
  limit?: number
  workerId?: string
  status?: 'active' | 'used' | 'expired' | 'revoked'
}

export interface TokenStats {
  total: number
  active: number
  used: number
  expired: number
  revoked: number
}

export interface GenerateTokenOptions {
  workerId: string
  expirySeconds?: number // Default 1 day (86400 seconds)
}

export class TokenService {
  /**
   * Generate a secure random token
   */
  private static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Generate a new token for a worker
   */
  static async generateToken(options: GenerateTokenOptions): Promise<WorkerToken> {
    const token = this.generateSecureToken()
    const expirySeconds = options.expirySeconds || 86400 // Default 1 day
    const expiresAt = new Date(Date.now() + expirySeconds * 1000)

    const { data, error } = await supabase
      .from('worker_tokens')
      .insert({
        worker_id: options.workerId,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to generate token: ${error.message}`)
    }

    return data as WorkerToken
  }

  /**
   * Validate a token and return worker data
   */
  static async validateToken(token: string): Promise<{
    valid: boolean
    workerId?: string
    workerData?: unknown
    reason?: 'not_found' | 'expired'
  }> {
    const { data: tokenData, error: tokenError } = await supabase
      .from('worker_tokens')
      .select('*, workers(*)')
      .eq('token', token)
      .eq('revoked', false)
      .single()

    if (tokenError || !tokenData) {
      return { valid: false, reason: 'not_found' }
    }

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at)
    if (expiresAt < new Date()) {
      return { valid: false, reason: 'expired' }
    }

    // Mark token as used (first time only)
    if (!tokenData.used_at) {
      await supabase
        .from('worker_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', tokenData.id)
    }

    return {
      valid: true,
      workerId: tokenData.worker_id,
      workerData: tokenData.workers,
    }
  }

  /**
   * Revoke a token
   */
  static async revokeToken(token: string): Promise<void> {
    await supabase.from('worker_tokens').update({ revoked: true }).eq('token', token)
  }

  /**
   * Generate SMS-friendly short link
   */
  static generateDashboardLink(token: string): string {
    // Worker dashboard is on port 5174, not 5173 (which is admin)
    const appUrl = process.env.APP_URL || 'http://localhost:5174'
    return `${appUrl}/dashboard/${token}`
  }

  /**
   * List tokens with filtering and pagination
   */
  static async listTokens(
    organizationId: string,
    options: TokenListOptions = {}
  ): Promise<{
    tokens: WorkerToken[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }> {
    const { page = 1, limit = 20, workerId, status } = options
    const offset = (page - 1) * limit

    let query = supabase
      .from('worker_tokens')
      .select('*, workers(*)', { count: 'exact' })
      .eq('workers.organization_id', organizationId)

    // Apply filters
    if (workerId) {
      query = query.eq('worker_id', workerId)
    }

    if (status) {
      const now = new Date().toISOString()
      switch (status) {
        case 'active':
          query = query.eq('revoked', false).gt('expires_at', now).is('used_at', null)
          break
        case 'used':
          query = query.eq('revoked', false).gt('expires_at', now).not('used_at', 'is', null)
          break
        case 'expired':
          query = query.eq('revoked', false).lt('expires_at', now)
          break
        case 'revoked':
          query = query.eq('revoked', true)
          break
      }
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to list tokens: ${error.message}`)
    }

    return {
      tokens: data as WorkerToken[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }
  }

  /**
   * Revoke token by ID
   */
  static async revokeById(tokenId: string): Promise<void> {
    const { error } = await supabase
      .from('worker_tokens')
      .update({ revoked: true })
      .eq('id', tokenId)

    if (error) {
      throw new Error(`Failed to revoke token: ${error.message}`)
    }
  }

  /**
   * Bulk revoke all expired tokens
   */
  static async bulkRevokeExpired(organizationId: string): Promise<number> {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('worker_tokens')
      .update({ revoked: true })
      .eq('revoked', false)
      .lt('expires_at', now)
      .in(
        'worker_id',
        (
          await supabase.from('workers').select('id').eq('organization_id', organizationId)
        ).data?.map((w) => w.id) || []
      )
      .select('id')

    if (error) {
      throw new Error(`Failed to bulk revoke expired tokens: ${error.message}`)
    }

    return data?.length || 0
  }

  /**
   * Get token statistics
   */
  static async getTokenStats(organizationId: string): Promise<TokenStats> {
    const now = new Date().toISOString()

    const { data: tokens, error } = await supabase
      .from('worker_tokens')
      .select('revoked, expires_at, used_at')
      .in(
        'worker_id',
        (
          await supabase.from('workers').select('id').eq('organization_id', organizationId)
        ).data?.map((w) => w.id) || []
      )

    if (error) {
      throw new Error(`Failed to get token stats: ${error.message}`)
    }

    const stats: TokenStats = {
      total: tokens.length,
      active: 0,
      used: 0,
      expired: 0,
      revoked: 0,
    }

    tokens.forEach((token) => {
      if (token.revoked) {
        stats.revoked++
      } else if (new Date(token.expires_at) < new Date(now)) {
        stats.expired++
      } else if (token.used_at) {
        stats.used++
      } else {
        stats.active++
      }
    })

    return stats
  }
}
