import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'node:crypto'
import { z } from 'zod'
import { logger } from '../utils/logger.js'

// Validation schemas
export const createTokenSchema = z.object({
  workerId: z.string().uuid(),
  expiresIn: z.string().regex(/^\d+[hdm]$/).default('8h'), // 8h, 24h, 7d, 30m
})

export const revokeTokenSchema = z.object({
  tokenId: z.string().uuid(),
})

export const tokenQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  workerId: z.string().uuid().optional(),
  status: z.enum(['active', 'expired', 'revoked']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
})

export interface TokenData {
  id: string
  token_hash: string
  worker_id: string
  organization_id: string
  expires_at: string
  created_at: string
  revoked_at: string | null
  workers?: {
    id: string
    full_name: string
    phone_number: string
  }
}

export interface TokenStats {
  total: number
  active: number
  expired: number
  revoked: number
  createdLast7Days: number
}

export interface CreateTokenResult {
  id: string
  token: string // Only returned once during creation
  expiresAt: string
  workerId: string
}

export class TokenService {
  private supabase: ReturnType<typeof createClient>

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || ''
    )
  }

  /**
   * Create a new dashboard token for a worker
   */
  async createToken(workerId: string, organizationId: string, expiresIn: string = '8h'): Promise<CreateTokenResult> {
    // Verify worker belongs to organization
    const { data: worker, error: workerError } = await this.supabase
      .from('workers')
      .select('*')
      .eq('id', workerId)
      .eq('organization_id', organizationId)
      .single()

    if (workerError || !worker) {
      throw new Error('Worker not found or does not belong to organization')
    }

    // Calculate expiry time
    const expiryHours = this.parseExpiresIn(expiresIn)
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString()

    // Generate secure token
    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')

    // Insert new token
    const insertData = {
      token_hash: tokenHash,
      worker_id: workerId,
      organization_id: organizationId,
      expires_at: expiresAt,
    }

    const { data: newToken, error: insertError } = await this.supabase
      .from('dashboard_tokens')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      logger.error('Failed to create token', insertError)
      throw new Error('Failed to create token')
    }

    logger.info('Token created', {
      tokenId: newToken.id,
      workerId,
      organizationId,
      expiresAt,
    })

    return {
      id: newToken.id,
      token, // Return raw token (only time it's shown)
      expiresAt: newToken.expires_at,
      workerId: newToken.worker_id,
    }
  }

  /**
   * Validate a public token and return worker information
   */
  async validateToken(token: string): Promise<{
    valid: boolean
    worker?: {
      id: string
      full_name: string
      organization_id: string
    }
    error?: 'not_found' | 'expired' | 'revoked' | 'invalid'
  }> {
    if (!token || token.length !== 64) { // 32 bytes = 64 hex chars
      return { valid: false, error: 'invalid' }
    }

    const tokenHash = createHash('sha256').update(token).digest('hex')
    const now = new Date().toISOString()

    // Find token with worker info
    const { data: tokenData, error } = await this.supabase
      .from('dashboard_tokens')
      .select(`
        *,
        workers!inner (
          id,
          full_name,
          organization_id
        )
      `)
      .eq('token_hash', tokenHash)
      .single()

    if (error || !tokenData) {
      return { valid: false, error: 'not_found' }
    }

    // Check if token is revoked
    if (tokenData.revoked_at) {
      return { valid: false, error: 'revoked' }
    }

    // Check if token is expired
    if (tokenData.expires_at < now) {
      return { valid: false, error: 'expired' }
    }

    return {
      valid: true,
      worker: {
        id: tokenData.workers.id,
        full_name: tokenData.workers.full_name,
        organization_id: tokenData.workers.organization_id,
      },
    }
  }

  /**
   * List tokens for an organization with pagination and filters
   */
  async listTokens(
    organizationId: string,
    options: z.infer<typeof tokenQuerySchema>
  ): Promise<{ tokens: TokenData[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page, limit, workerId, status, dateFrom, dateTo } = options
    const offset = (page - 1) * limit

    // Build query
    let query = this.supabase
      .from('dashboard_tokens')
      .select(`
        *,
        workers (
          id,
          full_name,
          phone_number
        )
      `, { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    // Add filters
    if (workerId) {
      query = query.eq('worker_id', workerId)
    }

    if (status) {
      const now = new Date().toISOString()
      switch (status) {
        case 'active':
          query = query.is('revoked_at', null).gt('expires_at', now)
          break
        case 'expired':
          query = query.lt('expires_at', now).is('revoked_at', null)
          break
        case 'revoked':
          query = query.not('revoked_at', 'is', null)
          break
      }
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: tokens, error, count } = await query

    if (error) {
      logger.error('Failed to list tokens', error)
      throw new Error('Failed to retrieve tokens')
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return {
      tokens: tokens || [],
      pagination: { page, limit, total, totalPages },
    }
  }

  /**
   * Get token statistics for an organization
   */
  async getTokenStats(organizationId: string): Promise<TokenStats> {
    const now = new Date().toISOString()
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Get counts in parallel for better performance
    const [
      { data: totalTokens },
      { data: activeTokens },
      { data: expiredTokens },
      { data: revokedTokens },
      { data: recentTokens },
    ] = await Promise.all([
      this.supabase.from('dashboard_tokens').select('id', { count: 'exact' }).eq('organization_id', organizationId),
      this.supabase.from('dashboard_tokens').select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .is('revoked_at', null)
        .gt('expires_at', now),
      this.supabase.from('dashboard_tokens').select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .lt('expires_at', now)
        .is('revoked_at', null),
      this.supabase.from('dashboard_tokens').select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .not('revoked_at', 'is', null),
      this.supabase.from('dashboard_tokens').select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .gte('created_at', sevenDaysAgo),
    ])

    return {
      total: totalTokens?.length || 0,
      active: activeTokens?.length || 0,
      expired: expiredTokens?.length || 0,
      revoked: revokedTokens?.length || 0,
      createdLast7Days: recentTokens?.length || 0,
    }
  }

  /**
   * Revoke a specific token
   */
  async revokeToken(tokenId: string, organizationId: string): Promise<{ id: string; revokedAt: string }> {
    const updateData = { revoked_at: new Date().toISOString() }
    const { data: token, error } = await this.supabase
      .from('dashboard_tokens')
      .update(updateData)
      .eq('id', tokenId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Token not found')
      }
      logger.error('Failed to revoke token', error)
      throw new Error('Failed to revoke token')
    }

    logger.info('Token revoked', {
      tokenId: token.id,
      organizationId,
      revokedAt: token.revoked_at,
    })

    return {
      id: token.id,
      revokedAt: token.revoked_at || '',
    }
  }

  /**
   * Bulk revoke all expired tokens for an organization
   */
  async bulkRevokeExpired(organizationId: string): Promise<{ revokedCount: number; revokedAt: string }> {
    const now = new Date().toISOString()

    const bulkUpdateData = { revoked_at: now }
    const { data: revokedTokens, error } = await this.supabase
      .from('dashboard_tokens')
      .update(bulkUpdateData)
      .eq('organization_id', organizationId)
      .lt('expires_at', now)
      .is('revoked_at', null)
      .select('id')

    if (error) {
      logger.error('Failed to bulk revoke expired tokens', error)
      throw new Error('Failed to bulk revoke expired tokens')
    }

    const revokedCount = revokedTokens?.length || 0

    logger.info('Bulk revoked expired tokens', {
      organizationId,
      revokedCount,
      revokedAt: now,
    })

    return { revokedCount, revokedAt: now }
  }

  /**
   * Parse expiresIn string to hours
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([hdm])$/)
    if (!match) {
      throw new Error('Invalid expiresIn format. Use format like "8h", "24h", "7d", "30m"')
    }

    const [, amount, unit] = match
    const value = parseInt(amount, 10)

    switch (unit) {
      case 'm':
        return value / 60 // Convert minutes to hours
      case 'h':
        return value // Hours
      case 'd':
        return value * 24 // Convert days to hours
      default:
        throw new Error('Invalid unit. Use h (hours), m (minutes), or d (days)')
    }
  }
}

// Singleton instance
export const tokenService = new TokenService()
