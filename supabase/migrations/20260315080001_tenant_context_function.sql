-- Migration 005: Tenant Context for RLS Policies
-- Adds function to set tenant context for Row Level Security

-- Function to set tenant context for RLS policies
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Set the tenant context that RLS policies can access
  PERFORM set_config('app.tenant_id', tenant_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_tenant_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION set_tenant_context(UUID) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION set_tenant_context IS 'Sets the tenant context for Row Level Security policies. Used by middleware to scope database queries to the correct organization.';
