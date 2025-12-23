-- Webhook Events Table
-- Stores all incoming webhook events for processing and audit

CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plugin_id TEXT NOT NULL, -- e.g., 'google-calendar', 'airtable', 'notion'
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    signature_valid BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
    idempotency_key TEXT UNIQUE,
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_webhook_events_org_status ON webhook_events(organization_id, status);
CREATE INDEX idx_webhook_events_plugin_created ON webhook_events(plugin_id, created_at);
CREATE INDEX idx_webhook_events_idempotency ON webhook_events(idempotency_key);
CREATE INDEX idx_webhook_events_retry ON webhook_events(status, retry_count) WHERE status = 'failed';

-- Webhook configurations for each plugin
CREATE TABLE webhook_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plugin_id TEXT NOT NULL,
    endpoint_url TEXT NOT NULL,
    secret TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
    retry_attempts INTEGER NOT NULL DEFAULT 3,
    retry_delay_seconds INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, plugin_id)
);

CREATE INDEX idx_webhook_configs_org_plugin ON webhook_configs(organization_id, plugin_id);

-- Updated_at trigger for webhook_configs
CREATE TRIGGER update_webhook_configs_updated_at BEFORE UPDATE ON webhook_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security for webhook tables
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook_events
CREATE POLICY webhook_event_policy ON webhook_events
    FOR ALL
    USING (organization_id = get_user_organization_id());

-- RLS Policies for webhook_configs
CREATE POLICY webhook_config_policy ON webhook_configs
    FOR ALL
    USING (organization_id = get_user_organization_id());
