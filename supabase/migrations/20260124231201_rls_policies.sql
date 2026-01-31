-- Migration 002: Row Level Security Policies
-- Based on specs/001-sms-dashboard-mvp/data-model.md

-- Enable RLS on all tenant-scoped tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see their own organization
DROP POLICY IF EXISTS tenant_isolation ON organizations;
CREATE POLICY tenant_isolation ON organizations
  FOR ALL
  USING (id = current_setting('app.tenant_id', true)::uuid);

-- Users: Users can only see users in their organization
DROP POLICY IF EXISTS tenant_isolation ON users;
CREATE POLICY tenant_isolation ON users
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id', true)::uuid);

-- Workers: Users can only see workers in their organization
DROP POLICY IF EXISTS tenant_isolation ON workers;
CREATE POLICY tenant_isolation ON workers
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id', true)::uuid);

-- Data sources: Users can only see data sources in their organization
DROP POLICY IF EXISTS tenant_isolation ON data_sources;
CREATE POLICY tenant_isolation ON data_sources
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id', true)::uuid);

-- Dashboard tokens: Users can only see tokens in their organization
DROP POLICY IF EXISTS tenant_isolation ON dashboard_tokens;
CREATE POLICY tenant_isolation ON dashboard_tokens
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id', true)::uuid);

-- SMS logs: Users can only see logs in their organization
DROP POLICY IF EXISTS tenant_isolation ON sms_logs;
CREATE POLICY tenant_isolation ON sms_logs
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id', true)::uuid);

-- Access logs: Users can only see logs in their organization
DROP POLICY IF EXISTS tenant_isolation ON access_logs;
CREATE POLICY tenant_isolation ON access_logs
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id', true)::uuid);

-- Service role bypass
-- The service role key bypasses RLS, so API must set tenant context via SET app.tenant_id
