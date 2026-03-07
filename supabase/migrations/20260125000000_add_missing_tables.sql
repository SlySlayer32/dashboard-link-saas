-- Migration: Add missing tables for MVP functionality
-- Adds schedule_items, task_items, dashboards, and adapter_configs tables

-- Schedule items table for manual schedule data
CREATE TABLE IF NOT EXISTS schedule_items (
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

-- Task items table for manual task data
CREATE TABLE IF NOT EXISTS task_items (
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

-- Dashboards table for dashboard configurations
CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, organization_id)
);

-- Adapter configs table for plugin configurations (alias for data_sources compatibility)
CREATE TABLE IF NOT EXISTS adapter_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  adapter_type TEXT NOT NULL CHECK (adapter_type IN ('google-calendar', 'airtable', 'notion', 'manual')),
  config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, adapter_type)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_schedule_items_worker_time ON schedule_items(worker_id, start_time);
CREATE INDEX IF NOT EXISTS idx_schedule_items_org_time ON schedule_items(organization_id, start_time);
CREATE INDEX IF NOT EXISTS idx_task_items_worker_due ON task_items(worker_id, due_date);
CREATE INDEX IF NOT EXISTS idx_task_items_org_due ON task_items(organization_id, due_date);
CREATE INDEX IF NOT EXISTS idx_task_items_completed ON task_items(completed) WHERE completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_dashboards_worker ON dashboards(worker_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_org ON dashboards(organization_id);
CREATE INDEX IF NOT EXISTS idx_adapter_configs_org ON adapter_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_adapter_configs_enabled ON adapter_configs(enabled) WHERE enabled = TRUE;

-- Apply updated_at triggers to new tables
DROP TRIGGER IF EXISTS update_schedule_items_updated_at ON schedule_items;
CREATE TRIGGER update_schedule_items_updated_at
  BEFORE UPDATE ON schedule_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_items_updated_at ON task_items;
CREATE TRIGGER update_task_items_updated_at
  BEFORE UPDATE ON task_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dashboards_updated_at ON dashboards;
CREATE TRIGGER update_dashboards_updated_at
  BEFORE UPDATE ON dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_adapter_configs_updated_at ON adapter_configs;
CREATE TRIGGER update_adapter_configs_updated_at
  BEFORE UPDATE ON adapter_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
