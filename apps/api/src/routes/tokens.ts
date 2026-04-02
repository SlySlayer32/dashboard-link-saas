import { zValidator } from '@hono/zod-validator'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Hono } from 'hono'
import { z } from 'zod'
import type { AppContextVariables } from '../types'

// Lazy-initialized Supabase admin client (service key, bypasses RLS intentionally
// because we enforce tenant scoping via explicit .eq('organization_id', ...) filters)
let _supabaseAdmin: SupabaseClient | null = null
function getSupabaseAdmin(): SupabaseClient {
  _supabaseAdmin ??= createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  )
  return _supabaseAdmin
}

// Create tokens router — auth + tenant middleware applied by v1.ts
const tokens = new Hono<{
  Variables: AppContextVariables
}>()

// Zod validation schemas
const regenerateTokenSchema = z.object({
  workerId: z.string().uuid('Invalid worker ID'),
  expiresInHours: z.number().min(1).max(24).default(8),
})

const revokeTokenSchema = z.object({
  tokenId: z.string().uuid('Invalid token ID'),
})

const listTokensSchema = z.object({
  page: z.coerce.number().min(1).max(1000).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  workerId: z.string().uuid().optional(),
  status: z.enum(['active', 'expired', 'revoked']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
})

/**
 * GET /tokens
 * List tokens with pagination and filters
 */
tokens.get('/', zValidator('query', listTokensSchema), async (c) => {
  const organizationId = c.get('organizationId')
  const query = c.req.valid('query')

  if (!organizationId) {
    return c.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Missing organization context' } },
      401
    )
  }

  try {
    const supabase = getSupabaseAdmin()
    // Build base query
    let dbQuery = supabase
      .from('dashboard_tokens')
      .select(
        `
        *,
        workers (
          id,
          full_name,
          phone_number
        )
      `,
        { count: 'exact' }
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (query.workerId) {
      dbQuery = dbQuery.eq('worker_id', query.workerId)
    }

    if (query.status) {
      const now = new Date().toISOString()
      switch (query.status) {
        case 'active':
          dbQuery = dbQuery.is('revoked_at', null).gt('expires_at', now)
          break
        case 'expired':
          dbQuery = dbQuery.lt('expires_at', now).is('revoked_at', null)
          break
        case 'revoked':
          dbQuery = dbQuery.not('revoked_at', 'is', null)
          break
      }
    }

    if (query.dateFrom) {
      dbQuery = dbQuery.gte('created_at', query.dateFrom)
    }

    if (query.dateTo) {
      dbQuery = dbQuery.lte('created_at', query.dateTo)
    }

    // Apply pagination
    const offset = (query.page - 1) * query.limit
    dbQuery = dbQuery.range(offset, offset + query.limit - 1)

    const { data: tokens, error, count } = await dbQuery

    if (error) {
      throw error
    }

    return c.json({
      success: true,
      data: tokens || [],
      meta: {
        pagination: {
          page: query.page,
          limit: query.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / query.limit),
          hasMore: offset + (tokens?.length || 0) < (count || 0),
        },
        requestId: crypto.randomUUID(),
        version: '2024-01-01',
      },
    })
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to retrieve tokens',
        },
      },
      500
    )
  }
})

/**
 * GET /tokens/stats
 * Get token statistics for the organization
 */
tokens.get('/stats', async (c) => {
  const organizationId = c.get('organizationId')

  if (!organizationId) {
    return c.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Missing organization context' } },
      401
    )
  }

  try {
    const supabase = getSupabaseAdmin()
    const now = new Date().toISOString()

    // Get token counts by status
    const { data: activeTokens, error: activeError } = await supabase
      .from('dashboard_tokens')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .is('revoked_at', null)
      .gt('expires_at', now)

    if (activeError) throw activeError

    const { data: expiredTokens, error: expiredError } = await supabase
      .from('dashboard_tokens')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .lt('expires_at', now)
      .is('revoked_at', null)

    if (expiredError) throw expiredError

    const { data: revokedTokens, error: revokedError } = await supabase
      .from('dashboard_tokens')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .not('revoked_at', 'is', null)

    if (revokedError) throw revokedError

    const { data: totalTokens, error: totalError } = await supabase
      .from('dashboard_tokens')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)

    if (totalError) throw totalError

    // Get tokens created in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentTokens, error: recentError } = await supabase
      .from('dashboard_tokens')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .gte('created_at', sevenDaysAgo)

    if (recentError) throw recentError

    return c.json({
      success: true,
      data: {
        total: totalTokens?.length || 0,
        active: activeTokens?.length || 0,
        expired: expiredTokens?.length || 0,
        revoked: revokedTokens?.length || 0,
        createdLast7Days: recentTokens?.length || 0,
      },
      meta: {
        requestId: crypto.randomUUID(),
        version: '2024-01-01',
      },
    })
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to retrieve token statistics',
        },
      },
      500
    )
  }
})

/**
 * POST /tokens/regenerate
 * Generate new token for worker
 */
tokens.post('/regenerate', zValidator('json', regenerateTokenSchema), async (c) => {
  const organizationId = c.get('organizationId')
  const { workerId, expiresInHours } = c.req.valid('json')

  if (!organizationId) {
    return c.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Missing organization context' } },
      401
    )
  }

  try {
    const supabase = getSupabaseAdmin()
    // Verify worker belongs to organization
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('id, full_name, phone_number')
      .eq('id', workerId)
      .eq('organization_id', organizationId)
      .single()

    if (workerError || !worker) {
      return c.json(
        {
          success: false,
          error: {
            code: 'WORKER_NOT_FOUND',
            message: 'Worker not found or access denied',
          },
        },
        404
      )
    }

    // Generate secure token
    const nodeCrypto = await import('node:crypto')
    const token = nodeCrypto.randomBytes(32).toString('hex')
    const tokenHash = nodeCrypto.createHash('sha256').update(token).digest('hex')

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()

    // Insert new token
    const { data: newToken, error: insertError } = await supabase
      .from('dashboard_tokens')
      .insert({
        token_hash: tokenHash,
        worker_id: workerId,
        organization_id: organizationId,
        expires_at: expiresAt,
      })
      .select(
        `
        id,
        created_at,
        expires_at,
        workers (
          id,
          full_name,
          phone_number
        )
      `
      )
      .single()

    if (insertError) {
      throw insertError
    }

    return c.json(
      {
        success: true,
        data: {
          id: newToken.id,
          token: token, // Return raw token (only time it's shown)
          expiresAt: newToken.expires_at,
          createdAt: newToken.created_at,
          worker: newToken.workers,
        },
        meta: {
          requestId: crypto.randomUUID(),
          version: '2024-01-01',
        },
      },
      201
    )
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create token',
        },
      },
      500
    )
  }
})

/**
 * POST /tokens/revoke
 * Revoke a specific token
 */
tokens.post('/revoke', zValidator('json', revokeTokenSchema), async (c) => {
  const organizationId = c.get('organizationId')
  const { tokenId } = c.req.valid('json')

  if (!organizationId) {
    return c.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Missing organization context' } },
      401
    )
  }

  try {
    const supabase = getSupabaseAdmin()
    // Update token to mark as revoked
    const { data: token, error } = await supabase
      .from('dashboard_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', tokenId)
      .eq('organization_id', organizationId)
      .select(
        `
        id,
        revoked_at,
        workers (
          id,
          full_name,
          phone_number
        )
      `
      )
      .single()

    if (error) {
      throw error
    }

    if (!token) {
      return c.json(
        {
          success: false,
          error: {
            code: 'TOKEN_NOT_FOUND',
            message: 'Token not found or access denied',
          },
        },
        404
      )
    }

    return c.json({
      success: true,
      data: {
        id: token.id,
        revokedAt: token.revoked_at,
        worker: token.workers,
      },
      meta: {
        requestId: crypto.randomUUID(),
        version: '2024-01-01',
      },
    })
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to revoke token',
        },
      },
      500
    )
  }
})

/**
 * POST /tokens/bulk-revoke-expired
 * Bulk revoke all expired tokens for the organization
 */
tokens.post('/bulk-revoke-expired', async (c) => {
  const organizationId = c.get('organizationId')

  if (!organizationId) {
    return c.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Missing organization context' } },
      401
    )
  }

  try {
    const supabase = getSupabaseAdmin()
    const now = new Date().toISOString()

    // Bulk update expired tokens
    const { data: revokedTokens, error } = await supabase
      .from('dashboard_tokens')
      .update({ revoked_at: now })
      .eq('organization_id', organizationId)
      .lt('expires_at', now)
      .is('revoked_at', null)
      .select('id, worker_id')

    if (error) {
      throw error
    }

    return c.json({
      success: true,
      data: {
        revokedCount: revokedTokens?.length || 0,
        revokedAt: now,
      },
      meta: {
        requestId: crypto.randomUUID(),
        version: '2024-01-01',
      },
    })
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to bulk revoke expired tokens',
        },
      },
      500
    )
  }
})

export default tokens
