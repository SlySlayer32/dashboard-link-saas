-- Consolidated migration: Complete tenant schema with dashboard tokens and webhooks
-- This consolidates the tenant-first schema with additional webhook and token functionality

-- Drop existing tables if they exist in inconsistent state
DROP TABLE IF EXISTS dlq_jobs CASCADE;
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS webhook_jobs CASCADE;
DROP TABLE IF EXISTS webhook_idempotency CASCADE;
DROP TABLE IF EXISTS dashboard_sources CASCADE;
DROP TABLE IF EXISTS adapter_configs CASCADE;
DROP TABLE IF EXISTS sms_jobs CASCADE;
DROP TABLE IF EXISTS dashboard_tokens CASCADE;
DROP TABLE IF EXISTS dashboard_widgets CASCADE;
DROP TABLE IF EXISTS manual_task_items CASCADE;
DROP TABLE IF EXISTS manual_schedule_items CASCADE;
DROP TABLE IF EXISTS dashboards CASCADE;
DROP TABLE IF EXISTS plugin_configs CASCADE;
DROP TABLE IF EXISTS worker_tokens CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Organizations table (top-level tenant)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT '',
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table (admin users linked to Supabase auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'owner')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, id)
);

-- Workers table (non-admin recipients)
CREATE TABLE workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    phone_e164 TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, phone_e164)
);

-- Dashboards table (configuration per worker)
CREATE TABLE dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Daily Dashboard',
    layout_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, worker_id)
);

-- Dashboard widgets
CREATE TABLE dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    plugin_id TEXT NOT NULL,
    config JSONB DEFAULT '{}'::jsonb,
    "order" INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dashboard tokens (secure access tokens)
CREATE TABLE dashboard_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    jti TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT dashboard_tokens_not_expired CHECK (expires_at > created_at)
);

-- SMS jobs (tracking all SMS sends)
CREATE TABLE sms_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    token_id UUID REFERENCES dashboard_tokens(id) ON DELETE CASCADE,
    to_phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    provider_msg_id TEXT,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SMS logs (legacy compatibility)
CREATE TABLE sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    to_phone TEXT NOT NULL,
    message TEXT NOT NULL,
    provider TEXT DEFAULT 'mobilemessage',
    provider_msg_id TEXT,
    status TEXT DEFAULT 'pending',
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adapter configurations (per org plugin settings)
CREATE TABLE adapter_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    adapter_type TEXT NOT NULL,
    adapter_id TEXT NOT NULL, -- e.g., 'google-calendar', 'airtable'
    config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, adapter_id)
);

-- Dashboard sources (link dashboards to adapters)
CREATE TABLE dashboard_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    adapter_config_id UUID NOT NULL REFERENCES adapter_configs(id) ON DELETE CASCADE,
    mapping_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    cache_ttl_sec INTEGER NOT NULL DEFAULT 300,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(dashboard_id, adapter_config_id)
);

-- Manual schedule entries (for manual plugin)
CREATE TABLE manual_schedule_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Manual task entries (for manual plugin)
CREATE TABLE manual_task_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Webhook idempotency table to prevent duplicate processing
CREATE TABLE webhook_idempotency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT webhook_idempotency_ttl CHECK (created_at > NOW() - INTERVAL '30 days')
);

-- Webhook jobs table for async processing
CREATE TABLE webhook_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    CONSTRAINT webhook_jobs_max_attempts CHECK (attempts <= 5)
);

-- Webhook events (incoming from external providers)
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    external_id TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
    error TEXT,
    UNIQUE(org_id, provider, external_id)
);

-- Dead Letter Queue (failed jobs)
CREATE TABLE dlq_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    queue TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    error TEXT NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tenant-scoped tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE adapter_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_task_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlq_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies using app.tenant_id context
CREATE POLICY "Organizations are viewable by org members" ON organizations
  FOR ALL USING (
    id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

CREATE POLICY "Users are viewable by org members" ON users
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

CREATE POLICY "Workers are viewable by org members" ON workers
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

CREATE POLICY "Dashboards are viewable by org members" ON dashboards
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

CREATE POLICY "Dashboard widgets are viewable by org members" ON dashboard_widgets
  FOR ALL USING (
    dashboard_id IN (
      SELECT id FROM dashboards 
      WHERE org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
    )
  );

CREATE POLICY "Dashboard tokens are viewable by org members" ON dashboard_tokens
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

CREATE POLICY "SMS jobs are viewable by org members" ON sms_jobs
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

CREATE POLICY "SMS logs are viewable by org members" ON sms_logs
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

CREATE POLICY "Adapter configs are viewable by org members" ON adapter_configs
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

CREATE POLICY "Dashboard sources are viewable by org members" ON dashboard_sources
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

CREATE POLICY "Manual schedule items are viewable by org members" ON manual_schedule_items
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

CREATE POLICY "Manual task items are viewable by org members" ON manual_task_items
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

-- Webhook tables have system-level access
CREATE POLICY "Webhook idempotency is manageable" ON webhook_idempotency
  FOR ALL USING (true);

CREATE POLICY "Webhook jobs are viewable" ON webhook_jobs
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

CREATE POLICY "Webhook events are viewable by org members" ON webhook_events
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

CREATE POLICY "DLQ jobs are viewable by org members" ON dlq_jobs
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

-- Indexes for performance
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_workers_org_id ON workers(org_id);
CREATE INDEX idx_workers_phone ON workers(phone_e164);
CREATE INDEX idx_dashboards_org_id ON dashboards(org_id);
CREATE INDEX idx_dashboards_worker_id ON dashboards(worker_id);
CREATE INDEX idx_dashboard_widgets_dashboard_id ON dashboard_widgets(dashboard_id);
CREATE INDEX idx_dashboard_tokens_org_id ON dashboard_tokens(org_id);
CREATE INDEX idx_dashboard_tokens_jti ON dashboard_tokens(jti);
CREATE INDEX idx_dashboard_tokens_expires_at ON dashboard_tokens(expires_at);
CREATE INDEX idx_dashboard_tokens_token_hash ON dashboard_tokens(token_hash);
CREATE INDEX idx_sms_jobs_org_id ON sms_jobs(org_id);
CREATE INDEX idx_sms_jobs_worker_id ON sms_jobs(worker_id);
CREATE INDEX idx_sms_jobs_status ON sms_jobs(status);
CREATE INDEX idx_sms_logs_org_id ON sms_logs(org_id);
CREATE INDEX idx_adapter_configs_org_id ON adapter_configs(org_id);
CREATE INDEX idx_adapter_configs_type ON adapter_configs(adapter_type);
CREATE INDEX idx_dashboard_sources_org_id ON dashboard_sources(org_id);
CREATE INDEX idx_dashboard_sources_dashboard_id ON dashboard_sources(dashboard_id);
CREATE INDEX idx_manual_schedule_worker_date ON manual_schedule_items(worker_id, start_time);
CREATE INDEX idx_manual_task_worker_date ON manual_task_items(worker_id, due_date);
CREATE INDEX idx_webhook_idempotency_key ON webhook_idempotency(idempotency_key);
CREATE INDEX idx_webhook_idempotency_created_at ON webhook_idempotency(created_at);
CREATE INDEX idx_webhook_jobs_status ON webhook_jobs(status);
CREATE INDEX idx_webhook_jobs_created_at ON webhook_jobs(created_at);
CREATE INDEX idx_webhook_jobs_provider ON webhook_jobs(provider);
CREATE INDEX idx_webhook_events_org_id ON webhook_events(org_id);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_dlq_jobs_org_id ON dlq_jobs(org_id);
CREATE INDEX idx_dlq_jobs_queue ON dlq_jobs(queue);

-- Functions
CREATE OR REPLACE FUNCTION set_tenant_context()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM set_config('app.tenant_id', auth.jwt()->>'org_id', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_expired_dashboard_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM dashboard_tokens
    WHERE expires_at < NOW() - INTERVAL '1 day';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_webhook_idempotency()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM webhook_idempotency
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION set_tenant_context();

CREATE TRIGGER handle_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_workers_updated_at BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_dashboards_updated_at BEFORE UPDATE ON dashboards
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_dashboard_widgets_updated_at BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_sms_jobs_updated_at BEFORE UPDATE ON sms_jobs
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_adapter_configs_updated_at BEFORE UPDATE ON adapter_configs
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_manual_schedule_items_updated_at BEFORE UPDATE ON manual_schedule_items
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_manual_task_items_updated_at BEFORE UPDATE ON manual_task_items
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON workers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON dashboards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON dashboard_widgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON dashboard_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sms_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sms_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON adapter_configs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON dashboard_sources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON manual_schedule_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON manual_task_items TO authenticated;
GRANT SELECT, INSERT, DELETE ON webhook_idempotency TO authenticated;
GRANT SELECT ON webhook_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON webhook_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON dlq_jobs TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION cleanup_expired_dashboard_tokens() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_webhook_idempotency() TO authenticated;
