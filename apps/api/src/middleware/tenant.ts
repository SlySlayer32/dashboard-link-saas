import { createClient } from '@supabase/supabase-js'
import { createMiddleware } from 'hono/factory'
import { logger } from '../utils/logger.js'

/**
 * Tenant Context Middleware
 * Sets the organization_id as the tenant context for Row Level Security (RLS) policies
 * This ensures all database queries are properly scoped to the user's organization
 *
 * RLS policies expect: current_setting('app.tenant_id', true)::uuid
 */
export const tenantContextMiddleware = createMiddleware(async (c, next) => {
  const organizationId = c.get('organizationId')

  if (!organizationId) {
    logger.error('No organization ID found in context - RLS queries will fail')
    throw new Error('Organization context required for database operations')
  }

  try {
    // Create Supabase client with admin privileges for setting tenant context
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || ''
    )

    // Set the tenant context for RLS policies
    // This makes current_setting('app.tenant_id', true) return the organization ID
    const { error } = await supabase.rpc('set_tenant_context', {
      tenant_id: organizationId,
    })

    if (error) {
      logger.error('Failed to set tenant context', new Error(error.message), {
        organizationId,
        details: error,
      })
      throw new Error(`Failed to set tenant context: ${error.message}`)
    }

    logger.debug('Tenant context set successfully', { organizationId })

    await next()
  } catch (error) {
    logger.error('Tenant context middleware error', error as Error)
    throw new Error('Database context initialization failed')
  }
})

// The set_tenant_context(UUID) SQL function is managed via supabase/migrations.
// Only service_role can call it — see 20260402000000_fix_tenant_context_permissions.sql
