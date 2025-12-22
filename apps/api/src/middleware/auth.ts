import { createClient } from '@supabase/supabase-js'
import { Context, Next } from 'hono'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '')

/**
 * Authentication middleware
 * Validates Supabase JWT token from Authorization header
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.substring(7)

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  // Add user to context
  c.set('user', user)
  c.set('userId', user.id)

  await next()
}

/**
 * Optional auth middleware
 * Doesn't fail if no token, but validates if present
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)

    const {
      data: { user },
    } = await supabase.auth.getUser(token)
    if (user) {
      c.set('user', user)
      c.set('userId', user.id)
    }
  }

  await next()
}
