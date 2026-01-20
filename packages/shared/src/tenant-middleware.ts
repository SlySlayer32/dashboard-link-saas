import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { createHash } from 'node:crypto'

interface JWTPayload {
  sub: string // user ID
  org_id: string
  role: string
  exp: number
  iat: number
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}

// Simple JWT verification function for development
// In production, use proper JWT library with Supabase
function verify(token: string, _secret: string): JWTPayload {
  // This is a placeholder - implement proper JWT verification
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid token format')
  }

  // Decode payload (for development only)
  const payloadStr = atob(parts[1])
  const payload = JSON.parse(payloadStr) as JWTPayload

  if (payload.exp && payload.exp < Date.now() / 1000) {
    throw new Error('Token expired')
  }

  return payload
}

export interface TenantContext {
  userId: string
  orgId: string
  role: string
}

/**
 * Middleware to extract tenant context from JWT and set database session variable
 */
export async function tenantMiddleware(c: Context, next: Next) {
  // Skip tenant check for auth routes and webhook endpoints
  if (c.req.path.startsWith('/auth/') || c.req.path.startsWith('/webhooks/')) {
    await next()
    return
  }

  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing or invalid authorization header' })
  }

  const token = authHeader.substring(7)

  try {
    // Verify JWT using Supabase JWT secret
    const jwtSecret = process.env.SUPABASE_JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT secret not configured')
    }

    const payload = verify(token, jwtSecret)

    // Set tenant context in request
    const tenantContext: TenantContext = {
      userId: payload.sub,
      orgId: payload.org_id,
      role: payload.role,
    }

    c.set('tenant', tenantContext)

    // Add logging context
    c.set('requestId', crypto.randomUUID())
    c.set('tenantId', payload.org_id)
    c.set('userId', payload.sub)
    c.set('userRole', payload.role)

    // For database operations, set the tenant context
    // This will be used by RLS policies
    if (c.env?.DB) {
      await c.env.DB.execute('SET LOCAL app.tenant_id = $1', [payload.org_id])
    }

    // Log the request with tenant context
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
        method: c.req.method,
        path: c.req.path,
        tenantId: payload.org_id,
        userId: payload.sub,
        role: payload.role,
        ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
        userAgent: c.req.header('user-agent') || 'unknown',
      })
    )

    await next()
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }

    // Log authentication failure
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        error: 'Authentication failed',
        path: c.req.path,
        message: error instanceof Error ? error.message : 'Unknown error',
        ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
      })
    )

    throw new HTTPException(401, { message: 'Invalid token' })
  }
}

/**
 * Middleware for token-based dashboard access (workers)
 * Validates dashboard tokens without requiring full JWT
 */
export async function dashboardTokenMiddleware(c: Context, next: Next) {
  const token = c.req.param('token')

  if (!token) {
    throw new HTTPException(401, { message: 'Missing dashboard token' })
  }

  // Look up token in database
  const { results } = await c.env.DB.prepare(
    `
    SELECT 
      dt.org_id,
      dt.worker_id,
      dt.expires_at,
      dt.used_at,
      w.name as worker_name,
      o.plan as org_plan
    FROM dashboard_tokens dt
    JOIN workers w ON dt.worker_id = w.id
    JOIN organizations o ON dt.org_id = o.id
    WHERE dt.token_hash = ?
  `
  )
    .bind(createHash('sha256').update(token).digest('hex'))
    .all()

  if (results.length === 0) {
    throw new HTTPException(404, { message: 'Invalid token' })
  }

  const tokenData = results[0] as {
    org_id: string
    worker_id: string
    expires_at: string
    used_at: string | null
    worker_name: string
    org_plan: string
  }

  // Check expiry
  if (new Date() > new Date(tokenData.expires_at)) {
    throw new HTTPException(410, { message: 'Token expired' })
  }

  // Check if single-use token was already used
  if (tokenData.used_at) {
    throw new HTTPException(410, { message: 'Token already used' })
  }

  // Set tenant context for this request
  const tenantContext: TenantContext = {
    userId: tokenData.worker_id, // Worker acts as user for dashboard
    orgId: tokenData.org_id,
    role: 'worker',
  }

  c.set('tenant', tenantContext)
  c.set('workerName', tokenData.worker_name)
  c.set('orgPlan', tokenData.org_plan)

  // Set database tenant context
  await c.env.DB.execute('SET LOCAL app.tenant_id = $1', [tokenData.org_id])

  // Mark single-use token as used
  await c.env.DB.prepare(
    `
    UPDATE dashboard_tokens 
    SET used_at = NOW() 
    WHERE token_hash = ?
  `
  )
    .bind(createHash('sha256').update(token).digest('hex'))
    .run()

  await next()
}

/**
 * Resource quota enforcement middleware using Redis
 */
export async function quotaMiddleware(c: Context, next: Next) {
  const tenant = c.get('tenant') as TenantContext
  const orgPlan = c.get('orgPlan') || 'free'

  // Get Redis client (would be injected or from context)
  const redis = c.env?.REDIS || (global as unknown as { REDIS: unknown }).REDIS

  if (!redis) {
    // If Redis is not available, proceed without quota checking
    // In production, you'd want to fail fast
    console.warn('Redis not available - skipping quota checks')
    await next()
    return
  }

  // Define quotas per plan
  const quotas = {
    free: {
      smsPerDay: 50,
      workersPerOrg: 10,
      adaptersPerOrg: 2,
      apiRequestsPerMinute: 60,
    },
    pro: {
      smsPerDay: 500,
      workersPerOrg: 100,
      adaptersPerOrg: 10,
      apiRequestsPerMinute: 600,
    },
    enterprise: {
      smsPerDay: 5000,
      workersPerOrg: 1000,
      adaptersPerOrg: 50,
      apiRequestsPerMinute: 6000,
    },
  }

  const quota = quotas[orgPlan as keyof typeof quotas] || quotas.free

  // Get current usage from Redis
  const today = new Date().toISOString().split('T')[0]
  const currentMinute = Math.floor(Date.now() / 60000)

  const redisKeys = {
    smsToday: `quota:${tenant.orgId}:sms:${today}`,
    workers: `quota:${tenant.orgId}:workers`,
    adapters: `quota:${tenant.orgId}:adapters`,
    apiRate: `quota:${tenant.orgId}:api:${currentMinute}`,
  }

  try {
    // Check API rate limit
    const apiCount = await redis.incr(redisKeys.apiRate)
    if (apiCount === 1) {
      await redis.expire(redisKeys.apiRate, 60) // Expire after 1 minute
    }

    if (apiCount > quota.apiRequestsPerMinute) {
      // Set headers manually since HTTPException doesn't support headers
      return c.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'API rate limit exceeded',
          },
        },
        429
      )
    }

    // Check SMS quota for SMS endpoints
    if (c.req.path.includes('/sms') || c.req.path.includes('/send-link')) {
      const smsCount = await redis.incr(redisKeys.smsToday)
      if (smsCount === 1) {
        await redis.expire(redisKeys.smsToday, 86400) // Expire after 24 hours
      }

      if (smsCount > quota.smsPerDay) {
        return c.json(
          {
            success: false,
            error: {
              code: 'SMS_QUOTA_EXCEEDED',
              message: `SMS quota exceeded. Limit: ${quota.smsPerDay} per day`,
            },
          },
          429
        )
      }

      c.header('X-RateLimit-Limit', quota.smsPerDay.toString())
      c.header('X-RateLimit-Remaining', (quota.smsPerDay - smsCount).toString())
      c.header('X-RateLimit-Reset', new Date().setHours(24, 0, 0, 0).toString())
    }

    // Check worker quota
    if (c.req.method === 'POST' && c.req.path.includes('/workers')) {
      const workerCount = parseInt((await redis.get(redisKeys.workers)) || '0')

      if (workerCount >= quota.workersPerOrg) {
        throw new HTTPException(429, {
          message: `Worker quota exceeded. Limit: ${quota.workersPerOrg} workers`,
        })
      }

      // Increment worker count
      await redis.incr(redisKeys.workers)
    }

    // Check adapter quota
    if (c.req.method === 'POST' && c.req.path.includes('/adapters')) {
      const adapterCount = parseInt((await redis.get(redisKeys.adapters)) || '0')

      if (adapterCount >= quota.adaptersPerOrg) {
        throw new HTTPException(429, {
          message: `Adapter quota exceeded. Limit: ${quota.adaptersPerOrg} adapters`,
        })
      }

      // Increment adapter count
      await redis.incr(redisKeys.adapters)
    }

    // Add quota headers to all responses
    c.header('X-Quota-Plan', orgPlan)
    c.header('X-Quota-API-Remaining', (quota.apiRequestsPerMinute - apiCount).toString())

    await next()
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }

    console.error('Quota middleware error:', error)
    // Continue on Redis errors to avoid breaking the application
    await next()
  }
}
