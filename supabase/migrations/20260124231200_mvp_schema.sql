-- Migration 001: Initial MVP Schema for CleanConnect SMS Dashboard
-- Multi-tenant SaaS with Row Level Security
-- Based on specs/001-sms-dashboard-mvp/data-model.md

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]{3,50}$'),
  sms_limit_per_hour INTEGER DEFAULT 100 CHECK (sms_limit_per_hour BETWEEN 1 AND 1000),
  default_token_expiry_hours INTEGER DEFAULT 8 CHECK (default_token_expiry_hours BETWEEN 1 AND 24),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Users table (admins)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  full_name TEXT CHECK (length(full_name) BETWEEN 1 AND 100),
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'owner')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Workers table
CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (length(full_name) BETWEEN 1 AND 100),
  phone_number TEXT NOT NULL CHECK (phone_number ~ '^\+[1-9]\d{1,14}$'),
  calendar_email TEXT CHECK (calendar_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workers_org ON workers(organization_id);
CREATE INDEX IF NOT EXISTS idx_workers_phone ON workers(phone_number);
CREATE INDEX IF NOT EXISTS idx_workers_calendar_email ON workers(calendar_email) WHERE calendar_email IS NOT NULL;

-- Data sources table (for plugin integrations)
CREATE TABLE IF NOT EXISTS data_sources (
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

CREATE INDEX IF NOT EXISTS idx_data_sources_org ON data_sources(organization_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_plugin ON data_sources(plugin_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_status ON data_sources(status) WHERE status = 'error';

-- Dashboard tokens table
CREATE TABLE IF NOT EXISTS dashboard_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL CHECK (expires_at > created_at),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_tokens_hash ON dashboard_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_dashboard_tokens_worker ON dashboard_tokens(worker_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_tokens_expires ON dashboard_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_dashboard_tokens_org ON dashboard_tokens(organization_id);

-- SMS logs table
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL CHECK (phone_number ~ '^\+[1-9]\d{1,14}$'),
  message_content TEXT NOT NULL CHECK (length(message_content) BETWEEN 1 AND 320),
  token_id UUID REFERENCES dashboard_tokens(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'failed')),
  provider_message_id TEXT,
  error_reason TEXT,
  sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_org_sent_at ON sms_logs(organization_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_worker ON sms_logs(worker_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_by ON sms_logs(sent_by);

-- Access logs table
CREATE TABLE IF NOT EXISTS access_logs (
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

CREATE INDEX IF NOT EXISTS idx_access_logs_org_time ON access_logs(organization_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_worker ON access_logs(worker_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_token ON access_logs(token_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_validation_status ON access_logs(validation_status) WHERE validation_status != 'success';

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workers_updated_at ON workers;
CREATE TRIGGER update_workers_updated_at
  BEFORE UPDATE ON workers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_sources_updated_at ON data_sources;
CREATE TRIGGER update_data_sources_updated_at
  BEFORE UPDATE ON data_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Cleanup function for expired tokens
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
