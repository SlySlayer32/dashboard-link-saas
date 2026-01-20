-- Migration: Add dashboard tokens and webhook support
-- This migration adds tables for dashboard tokens, adapter configs, and webhooks

-- Dashboard tokens table for secure worker access
CREATE TABLE IF NOT EXISTS dashboard_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT dashboard_tokens_not_expired CHECK (expires_at > created_at)
);

-- Index for fast token lookup
CREATE INDEX idx_dashboard_tokens_token_hash ON dashboard_tokens(token_hash);
CREATE INDEX idx_dashboard_tokens_expires_at ON dashboard_tokens(expires_at);

-- Adapter configurations table
CREATE TABLE IF NOT EXISTS adapter_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    adapter_type VARCHAR(50) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_adapter_per_org UNIQUE(organization_id, adapter_type)
);

-- Index for adapter lookups
CREATE INDEX idx_adapter_configs_org_id ON adapter_configs(organization_id);
CREATE INDEX idx_adapter_configs_type ON adapter_configs(adapter_type);

-- Webhook idempotency table to prevent duplicate processing
CREATE TABLE IF NOT EXISTS webhook_idempotency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT webhook_idempotency_ttl CHECK (created_at > NOW() - INTERVAL '30 days')
);

-- Index for idempotency checks
CREATE INDEX idx_webhook_idempotency_key ON webhook_idempotency(idempotency_key);
CREATE INDEX idx_webhook_idempotency_created_at ON webhook_idempotency(created_at);

-- Webhook jobs table for async processing
CREATE TABLE IF NOT EXISTS webhook_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT webhook_jobs_max_attempts CHECK (attempts <= 5)
);

-- Index for webhook job processing
CREATE INDEX idx_webhook_jobs_status ON webhook_jobs(status);
CREATE INDEX idx_webhook_jobs_created_at ON webhook_jobs(created_at);
CREATE INDEX idx_webhook_jobs_provider ON webhook_jobs(provider);

-- Add RLS policies
ALTER TABLE dashboard_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE adapter_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_jobs ENABLE ROW LEVEL SECURITY;

-- Dashboard tokens RLS policies
CREATE POLICY "Users can view tokens for their org" ON dashboard_tokens
    FOR SELECT USING (org_id = current_setting('app.tenant_id')::UUID);

CREATE POLICY "Users can insert tokens for their org" ON dashboard_tokens
    FOR INSERT WITH CHECK (org_id = current_setting('app.tenant_id')::UUID);

CREATE POLICY "Users can update tokens for their org" ON dashboard_tokens
    FOR UPDATE USING (org_id = current_setting('app.tenant_id')::UUID);

CREATE POLICY "Users can delete tokens for their org" ON dashboard_tokens
    FOR DELETE USING (org_id = current_setting('app.tenant_id')::UUID);

-- Adapter configs RLS policies
CREATE POLICY "Users can view configs for their org" ON adapter_configs
    FOR SELECT USING (organization_id = current_setting('app.tenant_id')::UUID);

CREATE POLICY "Users can insert configs for their org" ON adapter_configs
    FOR INSERT WITH CHECK (organization_id = current_setting('app.tenant_id')::UUID);

CREATE POLICY "Users can update configs for their org" ON adapter_configs
    FOR UPDATE USING (organization_id = current_setting('app.tenant_id')::UUID);

CREATE POLICY "Users can delete configs for their org" ON adapter_configs
    FOR DELETE USING (organization_id = current_setting('app.tenant_id')::UUID);

-- Webhook idempotency RLS policies
CREATE POLICY "Users can manage webhook idempotency for their org" ON webhook_idempotency
    FOR ALL USING (true); -- Webhooks are system-level, auth handled by signature

-- Webhook jobs RLS policies
CREATE POLICY "Users can view webhook jobs for their org" ON webhook_jobs
    FOR SELECT USING (true); -- Webhook jobs are system-level

-- Function to clean up expired tokens
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

-- Function to clean up old webhook idempotency records
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

-- Create a trigger to update updated_at on adapter_configs
CREATE OR REPLACE FUNCTION update_adapter_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_adapter_configs_updated_at
    BEFORE UPDATE ON adapter_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_adapter_configs_updated_at();

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON dashboard_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON adapter_configs TO authenticated;
GRANT SELECT, INSERT, DELETE ON webhook_idempotency TO authenticated;
GRANT SELECT ON webhook_jobs TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION cleanup_expired_dashboard_tokens() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_webhook_idempotency() TO authenticated;
