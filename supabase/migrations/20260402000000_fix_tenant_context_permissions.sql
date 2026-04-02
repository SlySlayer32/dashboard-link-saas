-- Migration: Fix tenant context function permissions and consolidate duplicates
-- R12: Revoke authenticated grant on set_tenant_context — only service_role should set tenant context
-- R13: Drop duplicate set_tenant_id(TEXT) function, keep canonical set_tenant_context(UUID)

-- Revoke the overly permissive grant from the newer migration (20260315080001)
REVOKE EXECUTE ON FUNCTION set_tenant_context(UUID) FROM authenticated;

-- Drop the older duplicate function with weaker TEXT typing
DROP FUNCTION IF EXISTS set_tenant_id(TEXT);

-- Ensure only service_role can set tenant context (matches original security model)
GRANT EXECUTE ON FUNCTION set_tenant_context(UUID) TO service_role;

-- get_tenant_id() is safe for authenticated users to read (read-only)
-- Keep that grant from 20260131000000 unchanged
