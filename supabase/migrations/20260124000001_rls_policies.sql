-- Migration 002: Row Level Security Policies
-- Tenant isolation via app.tenant_id session variable (set by API middleware)
-- Covers ALL tenant-scoped tables

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE adapter_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TENANT ISOLATION POLICIES
-- ============================================================================

-- Organizations: scoped by own id
CREATE POLICY tenant_isolation ON organizations
  FOR ALL USING (id = current_setting('app.tenant_id', true)::uuid);

-- Users: scoped by organization_id
CREATE POLICY tenant_isolation ON users
  FOR ALL USING (organization_id = current_setting('app.tenant_id', true)::uuid);

-- Workers: scoped by organization_id
CREATE POLICY tenant_isolation ON workers
  FOR ALL USING (organization_id = current_setting('app.tenant_id', true)::uuid);

-- Data sources: scoped by organization_id
CREATE POLICY tenant_isolation ON data_sources
  FOR ALL USING (organization_id = current_setting('app.tenant_id', true)::uuid);

-- Adapter configs: scoped by organization_id
CREATE POLICY tenant_isolation ON adapter_configs
  FOR ALL USING (organization_id = current_setting('app.tenant_id', true)::uuid);

-- Dashboard tokens: scoped by organization_id
CREATE POLICY tenant_isolation ON dashboard_tokens
  FOR ALL USING (organization_id = current_setting('app.tenant_id', true)::uuid);

-- SMS logs: scoped by organization_id
CREATE POLICY tenant_isolation ON sms_logs
  FOR ALL USING (organization_id = current_setting('app.tenant_id', true)::uuid);

-- Access logs: scoped by organization_id
CREATE POLICY tenant_isolation ON access_logs
  FOR ALL USING (organization_id = current_setting('app.tenant_id', true)::uuid);

-- Schedule items: scoped by organization_id
CREATE POLICY tenant_isolation ON schedule_items
  FOR ALL USING (organization_id = current_setting('app.tenant_id', true)::uuid);

-- Task items: scoped by organization_id
CREATE POLICY tenant_isolation ON task_items
  FOR ALL USING (organization_id = current_setting('app.tenant_id', true)::uuid);

-- Dashboards: scoped by organization_id
CREATE POLICY tenant_isolation ON dashboards
  FOR ALL USING (organization_id = current_setting('app.tenant_id', true)::uuid);

-- Note: service_role bypasses RLS automatically.
-- The API sets tenant context via set_tenant_context(UUID) before queries.
