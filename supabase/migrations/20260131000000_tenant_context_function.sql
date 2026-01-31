-- Migration: Add tenant context helper functions for RLS
-- This provides a clean interface for setting/clearing tenant context

-- Function to set tenant ID in session config
CREATE OR REPLACE FUNCTION set_tenant_id(tenant_id_value TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM set_config('app.tenant_id', tenant_id_value, true);
END;
$$;

-- Function to get current tenant ID from session config
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN current_setting('app.tenant_id', true);
END;
$$;

-- Grant execute permissions to service_role only (not to authenticated users)
-- This prevents authenticated users from arbitrarily changing tenant context
-- Only the backend API with service_role credentials can set tenant context
GRANT EXECUTE ON FUNCTION set_tenant_id(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_tenant_id() TO authenticated;
