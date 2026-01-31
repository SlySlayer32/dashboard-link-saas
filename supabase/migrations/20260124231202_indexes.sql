-- Migration 003: Performance Indexes
-- Based on specs/001-sms-dashboard-mvp/data-model.md

-- Additional composite indexes for common query patterns

-- Workers: Composite index for organization + phone lookup
CREATE INDEX IF NOT EXISTS idx_workers_org_phone ON workers(organization_id, phone_number);

-- SMS Logs: Composite index for organization + worker + date range queries
CREATE INDEX IF NOT EXISTS idx_sms_logs_org_worker_sent ON sms_logs(organization_id, worker_id, sent_at DESC);

-- Access Logs: Composite index for organization + worker + date range queries
CREATE INDEX IF NOT EXISTS idx_access_logs_org_worker_time ON access_logs(organization_id, worker_id, accessed_at DESC);

-- Dashboard Tokens: Index for cleanup queries (expired tokens)
CREATE INDEX IF NOT EXISTS idx_dashboard_tokens_expired ON dashboard_tokens(expires_at) WHERE revoked_at IS NULL;

-- Data Sources: Index for active data sources by organization
CREATE INDEX IF NOT EXISTS idx_data_sources_org_active ON data_sources(organization_id, status) WHERE status = 'active';
