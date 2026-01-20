-- Tenant-first database schema for CleanConnect
-- All tables have org_id for multi-tenancy with RLS

-- Organizations table (top-level tenant)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table (admin users linked to Supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'owner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, id) -- One user per org per auth user
);

-- Workers table (non-admin recipients)
CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone_e164 TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, phone_e164) -- Unique phone per org
);

-- Dashboards table (configuration per worker)
CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  layout_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, worker_id) -- One dashboard per worker
);

-- Dashboard tokens (secure access tokens)
CREATE TABLE IF NOT EXISTS dashboard_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL, -- Hashed token for security
  jti TEXT NOT NULL UNIQUE, -- JWT ID for revocation
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SMS jobs (tracking all SMS sends)
CREATE TABLE IF NOT EXISTS sms_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  token_id UUID NOT NULL REFERENCES dashboard_tokens(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  provider_msg_id TEXT, -- ID from MobileMessage.au
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adapter configurations (per org plugin settings)
CREATE TABLE IF NOT EXISTS adapter_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  adapter_id TEXT NOT NULL, -- e.g., 'google-calendar', 'airtable'
  config_json JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, adapter_id) -- One config per adapter per org
);

-- Dashboard sources (link dashboards to adapters)
CREATE TABLE IF NOT EXISTS dashboard_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  adapter_config_id UUID NOT NULL REFERENCES adapter_configs(id) ON DELETE CASCADE,
  mapping_json JSONB NOT NULL DEFAULT '{}', -- Maps adapter data to dashboard fields
  cache_ttl_sec INTEGER NOT NULL DEFAULT 300, -- 5 minutes default
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(dashboard_id, adapter_config_id)
);

-- Webhook events (incoming from external providers)
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- e.g., 'google-calendar', 'airtable'
  external_id TEXT, -- ID from external system
  payload JSONB NOT NULL DEFAULT '{}',
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  error TEXT,
  UNIQUE(org_id, provider, external_id) -- Prevent duplicates
);

-- Dead Letter Queue (failed jobs)
CREATE TABLE IF NOT EXISTS dlq_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  queue TEXT NOT NULL, -- e.g., 'sms', 'sync', 'webhook'
  payload JSONB NOT NULL DEFAULT '{}',
  error TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tenant-scoped tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE adapter_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlq_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies using app.tenant_id context
-- Organizations policy (special case - no org_id column)
CREATE POLICY "Organizations are viewable by org members" ON organizations
  FOR ALL USING (
    id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

-- Users policy
CREATE POLICY "Users are viewable by org members" ON users
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

-- Workers policy
CREATE POLICY "Workers are viewable by org members" ON workers
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

-- Dashboards policy
CREATE POLICY "Dashboards are viewable by org members" ON dashboards
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

-- Dashboard tokens policy
CREATE POLICY "Dashboard tokens are viewable by org members" ON dashboard_tokens
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

-- SMS jobs policy
CREATE POLICY "SMS jobs are viewable by org members" ON sms_jobs
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

-- Adapter configs policy
CREATE POLICY "Adapter configs are viewable by org members" ON adapter_configs
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

-- Dashboard sources policy
CREATE POLICY "Dashboard sources are viewable by org members" ON dashboard_sources
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

-- Webhook events policy
CREATE POLICY "Webhook events are viewable by org members" ON webhook_events
  FOR ALL USING (
    org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '')::uuid
  );

-- DLQ jobs policy
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
CREATE INDEX idx_dashboard_tokens_org_id ON dashboard_tokens(org_id);
CREATE INDEX idx_dashboard_tokens_jti ON dashboard_tokens(jti);
CREATE INDEX idx_dashboard_tokens_expires_at ON dashboard_tokens(expires_at);
CREATE INDEX idx_sms_jobs_org_id ON sms_jobs(org_id);
CREATE INDEX idx_sms_jobs_worker_id ON sms_jobs(worker_id);
CREATE INDEX idx_sms_jobs_status ON sms_jobs(status);
CREATE INDEX idx_adapter_configs_org_id ON adapter_configs(org_id);
CREATE INDEX idx_dashboard_sources_org_id ON dashboard_sources(org_id);
CREATE INDEX idx_dashboard_sources_dashboard_id ON dashboard_sources(dashboard_id);
CREATE INDEX idx_webhook_events_org_id ON webhook_events(org_id);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_dlq_jobs_org_id ON dlq_jobs(org_id);
CREATE INDEX idx_dlq_jobs_queue ON dlq_jobs(queue);

-- Function to set tenant context from JWT
CREATE OR REPLACE FUNCTION set_tenant_context()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract org_id from JWT claims and set as tenant context
  PERFORM set_config('app.tenant_id', auth.jwt()->>'org_id', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically set tenant context
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION set_tenant_context();

-- Updated timestamps trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER handle_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_workers_updated_at BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_dashboards_updated_at BEFORE UPDATE ON dashboards
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_sms_jobs_updated_at BEFORE UPDATE ON sms_jobs
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_adapter_configs_updated_at BEFORE UPDATE ON adapter_configs
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
