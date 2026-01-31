# Data Model: SMS Dashboard MVP

**Feature**: CleanConnect SMS Dashboard MVP  
**Branch**: `001-sms-dashboard-mvp`  
**Date**: 2026-01-21

## Overview

This document defines the complete data model for the CleanConnect MVP, including entity definitions, relationships, validation rules, and the Supabase PostgreSQL schema with Row Level Security (RLS) policies.

## Entity Relationship Diagram

```
┌─────────────────┐
│  organizations  │
└────────┬────────┘
         │ 1
         │
         │ N
    ┌────┴─────────────────────────────────────┐
    │                                           │
    │ N                                         │ N
┌───┴──────┐                            ┌──────┴─────┐
│  users   │                            │  workers   │
│ (admins) │                            └──────┬─────┘
└──────────┘                                   │ 1
                                               │
                                               │ N
                                        ┌──────┴──────────┐
                                        │                 │
                                   ┌────┴────────┐  ┌────┴────────┐
                                   │ sms_logs    │  │ dashboard_  │
                                   │             │  │ tokens      │
                                   └─────────────┘  └──────┬──────┘
                                                           │ 1
                                                           │
                                                           │ N
                                                    ┌──────┴──────┐
                                                    │ access_logs │
                                                    └─────────────┘

┌─────────────────┐
│  organizations  │
└────────┬────────┘
         │ 1
         │
         │ N
    ┌────┴─────────┐
    │ data_sources │
    └──────────────┘
```

## Core Entities

### 1. Organization

**Description**: Represents a tenant in the multi-tenant system. Each organization is completely isolated from others.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | TEXT | NOT NULL | Organization display name |
| `slug` | TEXT | UNIQUE, NOT NULL | URL-friendly identifier |
| `sms_limit_per_hour` | INTEGER | DEFAULT 100 | SMS rate limit per hour |
| `default_token_expiry_hours` | INTEGER | DEFAULT 8 | Default dashboard token expiry |
| `plan` | TEXT | DEFAULT 'free' | Subscription plan (free, pro, enterprise) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Validation Rules**:
- `name`: 1-100 characters
- `slug`: Lowercase alphanumeric + hyphens, 3-50 characters
- `sms_limit_per_hour`: 1-1000
- `default_token_expiry_hours`: 1-24
- `plan`: Enum ['free', 'pro', 'enterprise']

**Relationships**:
- Has many `users` (admins)
- Has many `workers`
- Has many `data_sources`
- Has many `sms_logs`
- Has many `dashboard_tokens`
- Has many `access_logs`

**Business Rules**:
- Organization deletion cascades to all related entities
- Slug must be unique across all organizations
- Cannot delete organization with active workers (soft delete future)

---

### 2. User (Admin)

**Description**: Represents an administrator who manages an organization. Authentication is handled by Supabase Auth.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier (matches Supabase Auth user ID) |
| `organization_id` | UUID | NOT NULL, REFERENCES organizations(id) ON DELETE CASCADE | Organization association |
| `email` | TEXT | UNIQUE, NOT NULL | Email address (managed by Supabase Auth) |
| `full_name` | TEXT | | Admin's full name |
| `role` | TEXT | DEFAULT 'admin' | Role within organization |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Validation Rules**:
- `email`: Valid email format
- `full_name`: 1-100 characters (optional)
- `role`: Enum ['admin', 'owner']

**Relationships**:
- Belongs to one `organization`
- Creates many `sms_logs` (via `sent_by` foreign key)

**Business Rules**:
- Email must be unique across all organizations
- User deletion cascades from Supabase Auth
- At least one 'owner' role required per organization (future)
- Cannot delete last admin in organization (future)

**RLS Policy**:
```sql
-- Users can only see users in their organization
CREATE POLICY tenant_isolation ON users
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id')::uuid);
```

---

### 3. Worker

**Description**: Represents a frontline worker who receives dashboard links via SMS. Workers do not have login credentials.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `organization_id` | UUID | NOT NULL, REFERENCES organizations(id) ON DELETE CASCADE | Organization association |
| `full_name` | TEXT | NOT NULL | Worker's full name |
| `phone_number` | TEXT | NOT NULL | Phone number in E.164 format (+61XXXXXXXXX) |
| `calendar_email` | TEXT | | Email for Google Calendar lookup (optional) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Validation Rules**:
- `full_name`: 1-100 characters
- `phone_number`: E.164 format, validated via libphonenumber-js
- `calendar_email`: Valid email format (optional)

**Relationships**:
- Belongs to one `organization`
- Has many `dashboard_tokens`
- Has many `sms_logs`
- Has many `access_logs`

**Business Rules**:
- Phone numbers can be duplicated within an organization (shared work phones)
- Phone numbers should be unique across organizations (warning only)
- Worker deletion cascades to tokens, logs
- Worker deletion invalidates all active dashboard tokens

**RLS Policy**:
```sql
CREATE POLICY tenant_isolation ON workers
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id')::uuid);
```

**Indexes**:
```sql
CREATE INDEX idx_workers_org ON workers(organization_id);
CREATE INDEX idx_workers_phone ON workers(phone_number);
CREATE INDEX idx_workers_calendar_email ON workers(calendar_email) WHERE calendar_email IS NOT NULL;
```

---

### 4. Data Source

**Description**: Represents an external integration (e.g., Google Calendar) configured for an organization. Stores OAuth tokens and connection status.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `organization_id` | UUID | NOT NULL, REFERENCES organizations(id) ON DELETE CASCADE | Organization association |
| `plugin_id` | TEXT | NOT NULL | Plugin identifier (e.g., 'google-calendar') |
| `plugin_version` | TEXT | NOT NULL | Plugin version (e.g., '1.0.0') |
| `config` | JSONB | NOT NULL | Plugin-specific configuration |
| `access_token_encrypted` | TEXT | | Encrypted OAuth access token |
| `refresh_token_encrypted` | TEXT | | Encrypted OAuth refresh token |
| `token_expires_at` | TIMESTAMPTZ | | Access token expiry timestamp |
| `status` | TEXT | NOT NULL, DEFAULT 'active' | Connection status |
| `last_sync_at` | TIMESTAMPTZ | | Last successful data sync timestamp |
| `last_error` | TEXT | | Last error message (if any) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Validation Rules**:
- `plugin_id`: Enum ['google-calendar', 'airtable', 'notion', 'manual']
- `plugin_version`: Semantic versioning format (e.g., '1.0.0')
- `status`: Enum ['active', 'error', 'disconnected']
- `config`: Valid JSON object (schema varies by plugin)

**Relationships**:
- Belongs to one `organization`

**Business Rules**:
- Only one data source per plugin_id per organization (MVP)
- OAuth tokens encrypted at rest using AES-256-GCM
- Token refresh attempted automatically on expiry
- Status set to 'error' after 3 consecutive failures
- Admin notified when status changes to 'error'

**RLS Policy**:
```sql
CREATE POLICY tenant_isolation ON data_sources
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id')::uuid);
```

**Indexes**:
```sql
CREATE INDEX idx_data_sources_org ON data_sources(organization_id);
CREATE INDEX idx_data_sources_plugin ON data_sources(plugin_id);
CREATE INDEX idx_data_sources_status ON data_sources(status) WHERE status = 'error';
```

**Encryption Strategy**:
```typescript
// Encrypt tokens before storage
const encryptedAccessToken = encrypt(accessToken, ENCRYPTION_KEY);
const encryptedRefreshToken = encrypt(refreshToken, ENCRYPTION_KEY);

// Decrypt tokens for use
const accessToken = decrypt(encryptedAccessToken, ENCRYPTION_KEY);
```

---

### 5. Dashboard Token

**Description**: Represents a time-limited access token for worker dashboards. Enables tokenized access without worker login.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `token_hash` | TEXT | NOT NULL, UNIQUE | SHA-256 hash of JWT token |
| `worker_id` | UUID | NOT NULL, REFERENCES workers(id) ON DELETE CASCADE | Worker association |
| `organization_id` | UUID | NOT NULL, REFERENCES organizations(id) ON DELETE CASCADE | Organization association |
| `expires_at` | TIMESTAMPTZ | NOT NULL | Token expiry timestamp |
| `revoked_at` | TIMESTAMPTZ | | Revocation timestamp (if revoked) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Validation Rules**:
- `token_hash`: SHA-256 hash (64 hex characters)
- `expires_at`: Must be in the future at creation
- `expires_at`: Maximum 24 hours from creation

**Relationships**:
- Belongs to one `worker`
- Belongs to one `organization`
- Has many `access_logs`
- Referenced by many `sms_logs`

**Business Rules**:
- Token hash must be unique (prevents duplicate tokens)
- Tokens automatically revoked when worker deleted (CASCADE)
- Tokens automatically revoked when organization deleted (CASCADE)
- Manual revocation sets `revoked_at` timestamp
- Expired tokens (expires_at < NOW()) are invalid
- Revoked tokens (revoked_at IS NOT NULL) are invalid
- Daily cleanup job deletes tokens expired >24 hours ago

**RLS Policy**:
```sql
-- No RLS needed - tokens validated via hash lookup, not tenant context
-- Dashboard endpoint doesn't use tenant middleware
```

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_dashboard_tokens_hash ON dashboard_tokens(token_hash);
CREATE INDEX idx_dashboard_tokens_worker ON dashboard_tokens(worker_id);
CREATE INDEX idx_dashboard_tokens_expires ON dashboard_tokens(expires_at);
CREATE INDEX idx_dashboard_tokens_org ON dashboard_tokens(organization_id);
```

**Token Structure (JWT)**:
```json
{
  "sub": "worker-uuid",
  "orgId": "org-uuid",
  "type": "dashboard",
  "exp": 1737504000,
  "iat": 1737417600
}
```

---

### 6. SMS Log

**Description**: Audit log of all SMS messages sent to workers. Tracks delivery status and errors.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `organization_id` | UUID | NOT NULL, REFERENCES organizations(id) ON DELETE CASCADE | Organization association |
| `worker_id` | UUID | REFERENCES workers(id) ON DELETE SET NULL | Worker association (nullable if worker deleted) |
| `phone_number` | TEXT | NOT NULL | Recipient phone number (E.164 format) |
| `message_content` | TEXT | NOT NULL | Full SMS message text |
| `token_id` | UUID | REFERENCES dashboard_tokens(id) ON DELETE SET NULL | Associated dashboard token |
| `status` | TEXT | NOT NULL | Delivery status |
| `provider_message_id` | TEXT | | SMS provider's message ID |
| `error_reason` | TEXT | | Error description (if failed) |
| `sent_by` | UUID | REFERENCES users(id) ON DELETE SET NULL | Admin who sent the SMS |
| `sent_at` | TIMESTAMPTZ | DEFAULT NOW() | Send timestamp |
| `delivered_at` | TIMESTAMPTZ | | Delivery confirmation timestamp |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Validation Rules**:
- `phone_number`: E.164 format
- `message_content`: 1-320 characters (2 SMS parts max)
- `status`: Enum ['sent', 'delivered', 'failed']

**Relationships**:
- Belongs to one `organization`
- Belongs to one `worker` (nullable)
- References one `dashboard_token` (nullable)
- References one `user` (sent_by, nullable)

**Business Rules**:
- All SMS sends logged, regardless of success/failure
- Status lifecycle: sent → delivered (or failed)
- Worker deletion sets worker_id to NULL (preserve audit trail)
- Token deletion sets token_id to NULL
- Admin deletion sets sent_by to NULL
- Logs retained for 90 days (configurable)

**RLS Policy**:
```sql
CREATE POLICY tenant_isolation ON sms_logs
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id')::uuid);
```

**Indexes**:
```sql
CREATE INDEX idx_sms_logs_org_sent_at ON sms_logs(organization_id, sent_at DESC);
CREATE INDEX idx_sms_logs_worker ON sms_logs(worker_id);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_sent_by ON sms_logs(sent_by);
```

---

### 7. Access Log

**Description**: Audit log of worker dashboard access attempts. Tracks who viewed their dashboard and when.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `organization_id` | UUID | NOT NULL, REFERENCES organizations(id) ON DELETE CASCADE | Organization association |
| `worker_id` | UUID | NOT NULL, REFERENCES workers(id) ON DELETE CASCADE | Worker association |
| `token_id` | UUID | REFERENCES dashboard_tokens(id) ON DELETE SET NULL | Token used for access |
| `accessed_at` | TIMESTAMPTZ | DEFAULT NOW() | Access timestamp |
| `ip_address` | INET | | Client IP address |
| `user_agent` | TEXT | | Client user agent string |
| `validation_status` | TEXT | NOT NULL | Token validation result |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Validation Rules**:
- `validation_status`: Enum ['success', 'expired', 'invalid', 'revoked']
- `ip_address`: Valid IPv4 or IPv6 address
- `user_agent`: 1-500 characters

**Relationships**:
- Belongs to one `organization`
- Belongs to one `worker`
- References one `dashboard_token` (nullable)

**Business Rules**:
- All access attempts logged (success and failure)
- Worker deletion cascades to access logs
- Token deletion sets token_id to NULL
- Logs retained for 90 days (configurable)
- Failed access attempts (expired/invalid/revoked) logged for security monitoring

**RLS Policy**:
```sql
CREATE POLICY tenant_isolation ON access_logs
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id')::uuid);
```

**Indexes**:
```sql
CREATE INDEX idx_access_logs_org_time ON access_logs(organization_id, accessed_at DESC);
CREATE INDEX idx_access_logs_worker ON access_logs(worker_id);
CREATE INDEX idx_access_logs_token ON access_logs(token_id);
CREATE INDEX idx_access_logs_validation_status ON access_logs(validation_status) WHERE validation_status != 'success';
```

---

## Supporting Types

### ScheduleItem (Not Stored)

**Description**: Represents a task or event from a data source. Fetched dynamically, not persisted in database.

**Attributes**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier from source system |
| `title` | string | Event/task title |
| `description` | string | Detailed description (optional) |
| `startTime` | Date | Start date/time |
| `endTime` | Date | End date/time (optional) |
| `location` | string | Physical location (optional) |
| `sourceType` | string | Data source type ('google-calendar', etc.) |
| `sourceId` | string | Data source ID |
| `rawData` | object | Original data from source system |

**Validation Rules**:
- `title`: 1-200 characters
- `startTime`: Must be valid date
- `endTime`: Must be after startTime (if provided)
- `sourceType`: Must match plugin_id of data source

**Business Rules**:
- Fetched on-demand when dashboard accessed
- Cached for 5 minutes (future optimization)
- Filtered to show only today's items by default
- Sorted by startTime ascending

---

## Complete Supabase Schema

### Migration 001: Initial Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sms_limit_per_hour INTEGER DEFAULT 100 CHECK (sms_limit_per_hour BETWEEN 1 AND 1000),
  default_token_expiry_hours INTEGER DEFAULT 8 CHECK (default_token_expiry_hours BETWEEN 1 AND 24),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Users table (admins)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'owner')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- Workers table
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (length(full_name) BETWEEN 1 AND 100),
  phone_number TEXT NOT NULL CHECK (phone_number ~ '^\+[1-9]\d{1,14}$'),
  calendar_email TEXT CHECK (calendar_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workers_org ON workers(organization_id);
CREATE INDEX idx_workers_phone ON workers(phone_number);
CREATE INDEX idx_workers_calendar_email ON workers(calendar_email) WHERE calendar_email IS NOT NULL;

-- Data sources table
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

CREATE INDEX idx_data_sources_org ON data_sources(organization_id);
CREATE INDEX idx_data_sources_plugin ON data_sources(plugin_id);
CREATE INDEX idx_data_sources_status ON data_sources(status) WHERE status = 'error';

-- Dashboard tokens table
CREATE TABLE dashboard_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL CHECK (expires_at > created_at),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_dashboard_tokens_hash ON dashboard_tokens(token_hash);
CREATE INDEX idx_dashboard_tokens_worker ON dashboard_tokens(worker_id);
CREATE INDEX idx_dashboard_tokens_expires ON dashboard_tokens(expires_at);
CREATE INDEX idx_dashboard_tokens_org ON dashboard_tokens(organization_id);

-- SMS logs table
CREATE TABLE sms_logs (
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

CREATE INDEX idx_sms_logs_org_sent_at ON sms_logs(organization_id, sent_at DESC);
CREATE INDEX idx_sms_logs_worker ON sms_logs(worker_id);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_sent_by ON sms_logs(sent_by);

-- Access logs table
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

CREATE INDEX idx_access_logs_org_time ON access_logs(organization_id, accessed_at DESC);
CREATE INDEX idx_access_logs_worker ON access_logs(worker_id);
CREATE INDEX idx_access_logs_token ON access_logs(token_id);
CREATE INDEX idx_access_logs_validation_status ON access_logs(validation_status) WHERE validation_status != 'success';
```

### Migration 002: Row Level Security Policies

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see their own organization
CREATE POLICY tenant_isolation ON organizations
  FOR ALL
  USING (id = current_setting('app.tenant_id')::uuid);

-- Users: Users can only see users in their organization
CREATE POLICY tenant_isolation ON users
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id')::uuid);

-- Workers: Users can only see workers in their organization
CREATE POLICY tenant_isolation ON workers
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id')::uuid);

-- Data sources: Users can only see data sources in their organization
CREATE POLICY tenant_isolation ON data_sources
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id')::uuid);

-- Dashboard tokens: Users can only see tokens in their organization
CREATE POLICY tenant_isolation ON dashboard_tokens
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id')::uuid);

-- SMS logs: Users can only see logs in their organization
CREATE POLICY tenant_isolation ON sms_logs
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id')::uuid);

-- Access logs: Users can only see logs in their organization
CREATE POLICY tenant_isolation ON access_logs
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id')::uuid);

-- Service role bypass (for API operations)
-- The service role key bypasses RLS, so API must set tenant context
```

### Migration 003: Triggers & Functions

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workers_updated_at
  BEFORE UPDATE ON workers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_sources_updated_at
  BEFORE UPDATE ON data_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup expired tokens (run daily via cron)
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

-- Function to validate phone number format
CREATE OR REPLACE FUNCTION validate_phone_number(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN phone ~ '^\+[1-9]\d{1,14}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

## Data Validation Summary

### Phone Number Validation
- **Format**: E.164 international format
- **Pattern**: `^\+[1-9]\d{1,14}$`
- **Examples**: 
  - Valid: `+61412345678`, `+14155551234`
  - Invalid: `0412345678`, `61412345678`, `+61 412 345 678`
- **Implementation**: libphonenumber-js library in application code

### Email Validation
- **Pattern**: Standard email regex
- **Case**: Case-insensitive
- **Examples**:
  - Valid: `admin@example.com`, `worker.name@company.co.uk`
  - Invalid: `admin@`, `@example.com`, `admin example.com`

### Token Hash Validation
- **Format**: SHA-256 hash (64 hexadecimal characters)
- **Pattern**: `^[a-f0-9]{64}$`
- **Generation**: `crypto.createHash('sha256').update(jwt).digest('hex')`

### Slug Validation
- **Format**: Lowercase alphanumeric + hyphens
- **Pattern**: `^[a-z0-9-]{3,50}$`
- **Examples**:
  - Valid: `acme-cleaning`, `construction-co-123`
  - Invalid: `Acme Cleaning`, `acme_cleaning`, `a`

## Query Patterns & Performance

### Common Queries

**1. List workers for organization (paginated)**:
```sql
SELECT * FROM workers
WHERE organization_id = $1
ORDER BY full_name ASC
LIMIT $2 OFFSET $3;
```
- **Index Used**: `idx_workers_org`
- **Performance**: O(log n) + O(limit)

**2. Validate dashboard token**:
```sql
SELECT dt.*, w.full_name, w.phone_number, o.name as org_name
FROM dashboard_tokens dt
JOIN workers w ON dt.worker_id = w.id
JOIN organizations o ON dt.organization_id = o.id
WHERE dt.token_hash = $1
  AND dt.expires_at > NOW()
  AND dt.revoked_at IS NULL;
```
- **Index Used**: `idx_dashboard_tokens_hash` (unique)
- **Performance**: O(1) hash lookup

**3. Get SMS logs for organization (last 30 days)**:
```sql
SELECT * FROM sms_logs
WHERE organization_id = $1
  AND sent_at > NOW() - INTERVAL '30 days'
ORDER BY sent_at DESC
LIMIT 100;
```
- **Index Used**: `idx_sms_logs_org_sent_at`
- **Performance**: O(log n) + O(100)

**4. Check SMS rate limit**:
```sql
SELECT COUNT(*) FROM sms_logs
WHERE organization_id = $1
  AND sent_at > NOW() - INTERVAL '1 hour';
```
- **Index Used**: `idx_sms_logs_org_sent_at`
- **Performance**: O(log n) + O(count in last hour)

**5. Get worker dashboard data**:
```sql
-- First, validate token (query #2)
-- Then, fetch data source for organization
SELECT * FROM data_sources
WHERE organization_id = $1
  AND plugin_id = 'google-calendar'
  AND status = 'active';
```
- **Index Used**: `idx_data_sources_org`, `idx_data_sources_plugin`
- **Performance**: O(log n)

## Data Retention & Cleanup

### Retention Policies

| Table | Retention Period | Cleanup Method |
|-------|------------------|----------------|
| `organizations` | Indefinite | Soft delete (future) |
| `users` | Indefinite | Cascade from Supabase Auth |
| `workers` | Indefinite | Manual deletion only |
| `data_sources` | Indefinite | Manual disconnection |
| `dashboard_tokens` | 24 hours after expiry | Daily cron job |
| `sms_logs` | 90 days | Daily cron job (future) |
| `access_logs` | 90 days | Daily cron job (future) |

### Cleanup Jobs

**Daily Token Cleanup** (Supabase cron):
```sql
SELECT cron.schedule(
  'cleanup-expired-tokens',
  '0 2 * * *',  -- 2 AM daily
  $$SELECT cleanup_expired_tokens()$$
);
```

**Weekly Log Cleanup** (future):
```sql
DELETE FROM sms_logs WHERE sent_at < NOW() - INTERVAL '90 days';
DELETE FROM access_logs WHERE accessed_at < NOW() - INTERVAL '90 days';
```

## Seed Data (Development)

```sql
-- Seed organization
INSERT INTO organizations (id, name, slug, sms_limit_per_hour, plan)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Acme Cleaning Co', 'acme-cleaning', 100, 'free');

-- Seed admin user (password managed by Supabase Auth)
INSERT INTO users (id, organization_id, email, full_name, role)
VALUES 
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'admin@acme.com', 'Admin User', 'owner');

-- Seed workers
INSERT INTO workers (organization_id, full_name, phone_number, calendar_email)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'John Doe', '+61412345678', 'john@acme.com'),
  ('00000000-0000-0000-0000-000000000001', 'Jane Smith', '+61423456789', 'jane@acme.com'),
  ('00000000-0000-0000-0000-000000000001', 'Bob Wilson', '+61434567890', 'bob@acme.com');
```

---

**Document Status**: ✅ Complete  
**Next Phase**: Generate API contracts in `/contracts/`
