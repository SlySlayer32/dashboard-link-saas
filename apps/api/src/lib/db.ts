import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Set tenant context for RLS policies
 */
export async function setTenantContext(tenantId: string) {
  await supabase.rpc('set_tenant_id', {
    tenant_id_value: tenantId,
  })
}

/**
 * Clear tenant context
 */
export async function clearTenantContext() {
  await supabase.rpc('set_tenant_id', {
    tenant_id_value: '',
  })
}
