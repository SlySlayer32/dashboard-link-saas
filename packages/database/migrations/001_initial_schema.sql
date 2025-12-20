-- Initial Database Schema for Dashboard Link SaaS Platform
-- Multi-tenant SaaS with Row Level Security

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admins table
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    auth_user_id UUID NOT NULL, -- References auth.users in Supabase
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email)
);

-- Workers table
CREATE TABLE workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL, -- E.164 format: +61412345678
    email TEXT,
    active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, phone)
);

-- Worker tokens for SMS links
CREATE TABLE worker_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    revoked BOOLEAN DEFAULT false
);

CREATE INDEX idx_worker_tokens_token ON worker_tokens(token);
CREATE INDEX idx_worker_tokens_expires ON worker_tokens(expires_at);

-- Plugin configurations
CREATE TABLE plugin_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plugin_id TEXT NOT NULL, -- e.g., 'google-calendar', 'airtable'
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, plugin_id)
);

-- Dashboards
CREATE TABLE dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(worker_id) -- One dashboard per worker for now
);

-- Dashboard widgets
CREATE TABLE dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    plugin_id TEXT NOT NULL,
    config JSONB DEFAULT '{}'::jsonb,
    "order" INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dashboard_widgets_dashboard ON dashboard_widgets(dashboard_id);

-- Manual schedule entries (for manual plugin)
CREATE TABLE manual_schedule_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_manual_schedule_worker_date ON manual_schedule_items(worker_id, start_time);

-- Manual task entries (for manual plugin)
CREATE TABLE manual_task_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_manual_task_worker_date ON manual_task_items(worker_id, due_date);

-- SMS logs (for tracking sent messages)
CREATE TABLE sms_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL, -- 'sent', 'failed', 'delivered'
    provider_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sms_logs_worker ON sms_logs(worker_id);
CREATE INDEX idx_sms_logs_created ON sms_logs(created_at);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plugin_configs_updated_at BEFORE UPDATE ON plugin_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at BEFORE UPDATE ON dashboards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_widgets_updated_at BEFORE UPDATE ON dashboard_widgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manual_schedule_items_updated_at BEFORE UPDATE ON manual_schedule_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manual_task_items_updated_at BEFORE UPDATE ON manual_task_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_task_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization_id
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM admins 
        WHERE auth_user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations: Admins can only see their own organization
CREATE POLICY org_policy ON organizations
    FOR ALL
    USING (id = get_user_organization_id());

-- Admins: Can only see admins in their organization
CREATE POLICY admin_policy ON admins
    FOR ALL
    USING (organization_id = get_user_organization_id());

-- Workers: Organization-scoped
CREATE POLICY worker_policy ON workers
    FOR ALL
    USING (organization_id = get_user_organization_id());

-- Worker tokens: Organization-scoped through workers
CREATE POLICY worker_token_policy ON worker_tokens
    FOR ALL
    USING (
        worker_id IN (
            SELECT id FROM workers WHERE organization_id = get_user_organization_id()
        )
    );

-- Plugin configs: Organization-scoped
CREATE POLICY plugin_config_policy ON plugin_configs
    FOR ALL
    USING (organization_id = get_user_organization_id());

-- Dashboards: Organization-scoped
CREATE POLICY dashboard_policy ON dashboards
    FOR ALL
    USING (organization_id = get_user_organization_id());

-- Dashboard widgets: Organization-scoped through dashboards
CREATE POLICY dashboard_widget_policy ON dashboard_widgets
    FOR ALL
    USING (
        dashboard_id IN (
            SELECT id FROM dashboards WHERE organization_id = get_user_organization_id()
        )
    );

-- Manual schedule items: Organization-scoped
CREATE POLICY manual_schedule_policy ON manual_schedule_items
    FOR ALL
    USING (organization_id = get_user_organization_id());

-- Manual task items: Organization-scoped
CREATE POLICY manual_task_policy ON manual_task_items
    FOR ALL
    USING (organization_id = get_user_organization_id());

-- SMS logs: Organization-scoped
CREATE POLICY sms_log_policy ON sms_logs
    FOR ALL
    USING (organization_id = get_user_organization_id());

-- Public policy for worker token validation (for dashboard access)
-- Workers accessing their dashboard via token don't have auth.uid()
-- This is handled in the API layer with service role key
