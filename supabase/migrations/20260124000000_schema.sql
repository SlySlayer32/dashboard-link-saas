-- Migration 001: Complete Schema for Dashboard Link SaaS
-- Multi-tenant SaaS with Row Level Security
-- Consolidated baseline — all tables, triggers, functions

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]{3,50}$'),
  sms_limit_per_hour INTEGER DEFAULT 100 CHECK (sms_limit_per_hour BETWEEN 1 AND 1000),
  default_token_expiry_hours INTEGER DEFAULT 8 CHECK (default_token_expiry_hours BETWEEN 1 AND 24),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (admins)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  auth_user_id UUID UNIQUE,
  email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  full_name TEXT CHECK (length(full_name) BETWEEN 1 AND 100),
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'owner')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN users.auth_user_id IS 'Supabase auth user UUID';

-- Workers
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 255),
  phone TEXT NOT NULL CHECK (phone ~ '^\+[1-9]\d{1,14}$'),
  email TEXT CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  active BOOLEAN DEFAULT TRUE NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN workers.deleted_at IS 'Soft delete timestamp. NULL = active, NOT NULL = deleted';
COMMENT ON COLUMN workers.active IS 'Worker active status. Inactive workers cannot receive SMS but are not deleted';
COMMENT ON COLUMN workers.metadata IS 'Extensible JSONB field for future worker attributes';

-- Data sources (plugin integrations — OAuth tokens, sync state)
CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plugin_id TEXT NOT NULL CHECK (plugin_id IN ('google-calendar', 'airtable', 'notion', 'manual')),
  plugin_version TEXT NOT NULL CHECK (plugin_version ~ '^\d+\.\d+\.\d+$'),
  config JSONB NOT NULL DEFAULT '{}',
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'error', 'disconnected')),
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, plugin_id)
);

-- Adapter configs (lightweight plugin enable/disable + settings)
CREATE TABLE adapter_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  adapter_type TEXT NOT NULL CHECK (adapter_type IN ('google-calendar', 'airtable', 'notion', 'manual')),
  config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, adapter_type)
);

-- Dashboard tokens
CREATE TABLE dashboard_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  session_id TEXT,
  payload JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN dashboard_tokens.user_id IS 'User who generated this token';
COMMENT ON COLUMN dashboard_tokens.session_id IS 'Optional session identifier for multi-session support';
COMMENT ON COLUMN dashboard_tokens.payload IS 'Token payload data (JSON)';
COMMENT ON COLUMN dashboard_tokens.last_used_at IS 'Timestamp when token was last validated';
COMMENT ON COLUMN dashboard_tokens.revoked_at IS 'When the token was revoked (NULL = active)';
COMMENT ON COLUMN dashboard_tokens.revoked_by IS 'User who revoked this token';

-- SMS logs
CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL CHECK (phone_number ~ '^\+[1-9]\d{1,14}$'),
  message_content TEXT NOT NULL CHECK (length(message_content) BETWEEN 1 AND 320),
  token_id UUID REFERENCES dashboard_tokens(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  provider VARCHAR(50) NOT NULL DEFAULT 'unknown'
    CHECK (provider IN ('mobile-message', 'twilio', 'aws-sns', 'legacy', 'unknown', 'validation')),
  message_id VARCHAR(255),
  error_reason TEXT,
  error_type VARCHAR(20) CHECK (error_type IN ('temporary', 'permanent', 'rate_limit', 'invalid_number') OR error_type IS NULL),
  cost DECIMAL(10,4) DEFAULT 0.0000 CHECK (cost >= 0),
  sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN sms_logs.provider IS 'SMS provider used (mobile-message, twilio, aws-sns)';
COMMENT ON COLUMN sms_logs.message_id IS 'Provider-specific message ID for tracking';
COMMENT ON COLUMN sms_logs.error_type IS 'Categorized error type';
COMMENT ON COLUMN sms_logs.cost IS 'Actual cost of sending this SMS message';

-- Access logs
CREATE TABLE access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  token_id UUID REFERENCES dashboard_tokens(id) ON DELETE SET NULL,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT CHECK (length(user_agent) <= 500),
  validation_status TEXT NOT NULL CHECK (validation_status IN ('success', 'expired', 'invalid', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule items (manual schedule data)
CREATE TABLE schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL CHECK (end_time > start_time),
  location TEXT CHECK (length(location) BETWEEN 1 AND 200),
  notes TEXT CHECK (length(notes) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task items (manual task data)
CREATE TABLE task_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  description TEXT CHECK (length(description) <= 1000),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboards
CREATE TABLE dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, organization_id)
);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Compatibility view for tokens package
CREATE OR REPLACE VIEW tokens AS
SELECT
  id,
  token_hash,
  user_id,
  organization_id,
  session_id,
  payload::text AS payload,
  expires_at,
  created_at,
  last_used_at,
  revoked_at,
  revoked_by,
  metadata::text AS metadata
FROM dashboard_tokens;

GRANT SELECT, INSERT, UPDATE, DELETE ON tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tokens TO service_role;

COMMENT ON VIEW tokens IS 'Compatibility view for tokens package — maps dashboard_tokens to expected schema';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tenant context: set (service_role only)
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.tenant_id', tenant_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION set_tenant_context IS 'Sets the tenant context for RLS. Only service_role may call this.';

-- Tenant context: read (safe for authenticated)
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS TEXT
LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN current_setting('app.tenant_id', true);
END;
$$;

-- Auto-populate user_id on dashboard_tokens from worker's org
CREATE OR REPLACE FUNCTION populate_token_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.worker_id IS NOT NULL THEN
    SELECT u.id INTO NEW.user_id
    FROM workers w
    JOIN users u ON u.organization_id = w.organization_id
    WHERE w.id = NEW.worker_id
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired tokens (call via cron or manual)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM dashboard_tokens
  WHERE expires_at < NOW() - INTERVAL '24 hours';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workers_updated_at
  BEFORE UPDATE ON workers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_sources_updated_at
  BEFORE UPDATE ON data_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_adapter_configs_updated_at
  BEFORE UPDATE ON adapter_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_items_updated_at
  BEFORE UPDATE ON schedule_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_items_updated_at
  BEFORE UPDATE ON task_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at
  BEFORE UPDATE ON dashboards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER populate_dashboard_token_user_id
  BEFORE INSERT OR UPDATE ON dashboard_tokens FOR EACH ROW EXECUTE FUNCTION populate_token_user_id();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION set_tenant_context(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_tenant_id() TO authenticated;
