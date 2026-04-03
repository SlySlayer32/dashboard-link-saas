-- Migration 003: Performance Indexes
-- Composite and partial indexes for common query patterns

-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- ============================================================================
-- USERS
-- ============================================================================
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);

-- ============================================================================
-- WORKERS
-- ============================================================================
CREATE INDEX idx_workers_org ON workers(organization_id);
CREATE INDEX idx_workers_org_active ON workers(organization_id, deleted_at) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_workers_phone_org_active ON workers(phone, organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_workers_phone ON workers(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_workers_email ON workers(email) WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_workers_deleted_at ON workers(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_workers_org_phone ON workers(organization_id, phone);

-- ============================================================================
-- DATA SOURCES
-- ============================================================================
CREATE INDEX idx_data_sources_org ON data_sources(organization_id);
CREATE INDEX idx_data_sources_plugin ON data_sources(plugin_id);
CREATE INDEX idx_data_sources_status ON data_sources(status) WHERE status = 'error';
CREATE INDEX idx_data_sources_org_active ON data_sources(organization_id, status) WHERE status = 'active';

-- ============================================================================
-- ADAPTER CONFIGS
-- ============================================================================
CREATE INDEX idx_adapter_configs_org ON adapter_configs(organization_id);
CREATE INDEX idx_adapter_configs_enabled ON adapter_configs(enabled) WHERE enabled = TRUE;

-- ============================================================================
-- DASHBOARD TOKENS
-- ============================================================================
CREATE INDEX idx_dashboard_tokens_worker ON dashboard_tokens(worker_id);
CREATE INDEX idx_dashboard_tokens_org ON dashboard_tokens(organization_id);
CREATE INDEX idx_dashboard_tokens_expires ON dashboard_tokens(expires_at);
CREATE INDEX idx_dashboard_tokens_expired ON dashboard_tokens(expires_at) WHERE revoked_at IS NULL;
CREATE INDEX idx_dashboard_tokens_user_id ON dashboard_tokens(user_id);
CREATE INDEX idx_dashboard_tokens_session_id ON dashboard_tokens(session_id);
CREATE INDEX idx_dashboard_tokens_last_used_at ON dashboard_tokens(last_used_at);

-- ============================================================================
-- SMS LOGS
-- ============================================================================
CREATE INDEX idx_sms_logs_org_sent_at ON sms_logs(organization_id, sent_at DESC);
CREATE INDEX idx_sms_logs_worker ON sms_logs(worker_id);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_sent_by ON sms_logs(sent_by);
CREATE INDEX idx_sms_logs_provider ON sms_logs(provider);
CREATE INDEX idx_sms_logs_message_id ON sms_logs(message_id);
CREATE INDEX idx_sms_logs_org_worker_sent ON sms_logs(organization_id, worker_id, sent_at DESC);

-- ============================================================================
-- ACCESS LOGS
-- ============================================================================
CREATE INDEX idx_access_logs_org_time ON access_logs(organization_id, accessed_at DESC);
CREATE INDEX idx_access_logs_worker ON access_logs(worker_id);
CREATE INDEX idx_access_logs_token ON access_logs(token_id);
CREATE INDEX idx_access_logs_validation_status ON access_logs(validation_status) WHERE validation_status != 'success';
CREATE INDEX idx_access_logs_org_worker_time ON access_logs(organization_id, worker_id, accessed_at DESC);

-- ============================================================================
-- SCHEDULE ITEMS
-- ============================================================================
CREATE INDEX idx_schedule_items_worker_time ON schedule_items(worker_id, start_time);
CREATE INDEX idx_schedule_items_org_time ON schedule_items(organization_id, start_time);

-- ============================================================================
-- TASK ITEMS
-- ============================================================================
CREATE INDEX idx_task_items_worker_due ON task_items(worker_id, due_date);
CREATE INDEX idx_task_items_org_due ON task_items(organization_id, due_date);
CREATE INDEX idx_task_items_completed ON task_items(completed) WHERE completed = FALSE;

-- ============================================================================
-- DASHBOARDS
-- ============================================================================
CREATE INDEX idx_dashboards_worker ON dashboards(worker_id);
CREATE INDEX idx_dashboards_org ON dashboards(organization_id);
