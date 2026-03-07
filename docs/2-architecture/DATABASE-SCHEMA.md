# Database Schema

## Overview
Relational database (PostgreSQL via Supabase) with Row-Level Security (RLS) enforcing multi-tenant isolation. All tenant-scoped tables include `organization_id` column with RLS policies using `current_setting('app.tenant_id')::uuid`.

**✅ VERIFIED:** This schema documentation has been verified against actual migration files:
- `supabase/migrations/20260124231200_mvp_schema.sql` — All tables, fields, types, constraints match
- `supabase/migrations/20260124231201_rls_policies.sql` — RLS pattern confirmed
- `supabase/migrations/20260124231202_indexes.sql` — All indexes documented

**IMPORTANT:** This RLS pattern is **CUSTOM**, not standard Supabase. Standard Supabase RLS uses JWT claims (`auth.uid()`, `auth.jwt() ->> 'organization_id'`). Our custom pattern requires the backend API to explicitly set the session variable via `SET LOCAL app.tenant_id = <org_id>` on each request. This provides better control for service role operations but requires careful implementation in the API middleware.

**Alternative approach:** Standard Supabase RLS using JWT claims would eliminate the need for session variables but requires encoding `organization_id` in the JWT token during authentication.

## Tables / Collections

### organizations
Core tenant table. Each organization represents a separate business using the platform.

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | PRIMARY KEY, DEFAULT gen_random_uuid() | Primary key |
| name | TEXT | Yes | CHECK (length(name) BETWEEN 1 AND 100) | Organization name |
| slug | TEXT | Yes | UNIQUE, CHECK (slug ~ '^[a-z0-9-]{3,50}$') | URL-friendly identifier (lowercase, numbers, hyphens only) |
| sms_limit_per_hour | INTEGER | No | DEFAULT 100, CHECK (sms_limit_per_hour BETWEEN 1 AND 1000) | Rate limit for SMS sending |
| default_token_expiry_hours | INTEGER | No | DEFAULT 8, CHECK (default_token_expiry_hours BETWEEN 1 AND 24) | Default dashboard link expiry |
| plan | TEXT | No | DEFAULT 'free', CHECK (plan IN ('free', 'pro', 'enterprise')) | Subscription plan |
| created_at | TIMESTAMPTZ | No | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | No | DEFAULT NOW() | Last update timestamp (auto-updated via trigger) |

**Indexes:**
- `idx_organizations_slug` on `slug`

### users
Admin users who manage the organization. These are the people who log into the admin dashboard.

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | PRIMARY KEY, DEFAULT gen_random_uuid() | Primary key |
| organization_id | UUID | Yes | REFERENCES organizations(id) ON DELETE CASCADE | Foreign key to organizations |
| email | TEXT | Yes | UNIQUE, CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$') | User email (validated regex) |
| full_name | TEXT | No | CHECK (length(full_name) BETWEEN 1 AND 100) | User's full name |
| role | TEXT | No | DEFAULT 'admin', CHECK (role IN ('admin', 'owner')) | User role |
| created_at | TIMESTAMPTZ | No | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | No | DEFAULT NOW() | Last update timestamp (auto-updated via trigger) |

**Indexes:**
- `idx_users_org` on `organization_id`
- `idx_users_email` on `email`

### workers
Field workers who receive dashboard links via SMS. No login credentials—access via token only.

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | PRIMARY KEY, DEFAULT gen_random_uuid() | Primary key |
| organization_id | UUID | Yes | REFERENCES organizations(id) ON DELETE CASCADE | Foreign key to organizations |
| full_name | TEXT | Yes | CHECK (length(full_name) BETWEEN 1 AND 100) | Worker's full name |
| phone_number | TEXT | Yes | CHECK (phone_number ~ '^\+[1-9]\d{1,14}$') | E.164 format (+61...) |
| calendar_email | TEXT | No | CHECK (calendar_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$') | Email for Google Calendar integration |
| created_at | TIMESTAMPTZ | No | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | No | DEFAULT NOW() | Last update timestamp (auto-updated via trigger) |

**Indexes:**
- `idx_workers_org` on `organization_id`
- `idx_workers_phone` on `phone_number`
- `idx_workers_calendar_email` on `calendar_email` WHERE calendar_email IS NOT NULL (partial index)
- `idx_workers_org_phone` on `(organization_id, phone_number)` (composite)

### data_sources
Plugin configurations per organization. Each organization can have multiple data sources (Google Calendar, Airtable, Notion, manual).

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | PRIMARY KEY, DEFAULT gen_random_uuid() | Primary key |
| organization_id | UUID | Yes | REFERENCES organizations(id) ON DELETE CASCADE | Foreign key to organizations |
| plugin_id | TEXT | Yes | CHECK (plugin_id IN ('google-calendar', 'airtable', 'notion', 'manual')) | Plugin identifier |
| plugin_version | TEXT | Yes | CHECK (plugin_version ~ '^\d+\.\d+\.\d+$') | SemVer version string (e.g., 1.0.0) |
| config | JSONB | No | DEFAULT '{}' | Plugin-specific configuration |
| access_token_encrypted | TEXT | No | | OAuth access token (encrypted) |
| refresh_token_encrypted | TEXT | No | | OAuth refresh token (encrypted) |
| token_expires_at | TIMESTAMPTZ | No | | OAuth token expiry timestamp |
| status | TEXT | No | DEFAULT 'active', CHECK (status IN ('active', 'error', 'disconnected')) | Connection status |
| last_sync_at | TIMESTAMPTZ | No | | Last successful data sync |
| last_error | TEXT | No | | Last error message |
| created_at | TIMESTAMPTZ | No | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | No | DEFAULT NOW() | Last update timestamp (auto-updated via trigger) |

**Unique constraint:** `UNIQUE(organization_id, plugin_id)` — one instance of each plugin per org

**Indexes:**
- `idx_data_sources_org` on `organization_id`
- `idx_data_sources_plugin` on `plugin_id`
- `idx_data_sources_status` on `status` WHERE status = 'error' (partial index)
- `idx_data_sources_org_active` on `(organization_id, status)` WHERE status = 'active' (composite partial)

### dashboard_tokens
Time-limited tokens for worker dashboard access. Each token is tied to a specific worker and organization.

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | PRIMARY KEY, DEFAULT gen_random_uuid() | Primary key |
| token_hash | TEXT | Yes | UNIQUE, CHECK (length(token_hash) = 64) | SHA-256 hash of token (64 hex chars) |
| worker_id | UUID | Yes | REFERENCES workers(id) ON DELETE CASCADE | Foreign key to workers |
| organization_id | UUID | Yes | REFERENCES organizations(id) ON DELETE CASCADE | Foreign key to organizations |
| expires_at | TIMESTAMPTZ | Yes | CHECK (expires_at > created_at) | Token expiry timestamp |
| revoked_at | TIMESTAMPTZ | No | | Manual revocation timestamp |
| created_at | TIMESTAMPTZ | No | DEFAULT NOW() | Record creation timestamp |

**Indexes:**
- `idx_dashboard_tokens_hash` on `token_hash` (UNIQUE)
- `idx_dashboard_tokens_worker` on `worker_id`
- `idx_dashboard_tokens_expires` on `expires_at`
- `idx_dashboard_tokens_org` on `organization_id`
- `idx_dashboard_tokens_expired` on `expires_at` WHERE revoked_at IS NULL (partial index for cleanup)

### sms_logs
Audit trail of all SMS messages sent. Used for delivery tracking and billing.

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | PRIMARY KEY, DEFAULT gen_random_uuid() | Primary key |
| organization_id | UUID | Yes | REFERENCES organizations(id) ON DELETE CASCADE | Foreign key to organizations |
| worker_id | UUID | No | REFERENCES workers(id) ON DELETE SET NULL | Foreign key to workers (nullable) |
| phone_number | TEXT | Yes | CHECK (phone_number ~ '^\+[1-9]\d{1,14}$') | Recipient phone number (E.164) |
| message_content | TEXT | Yes | CHECK (length(message_content) BETWEEN 1 AND 320) | SMS message body (max 2 SMS) |
| token_id | UUID | No | REFERENCES dashboard_tokens(id) ON DELETE SET NULL | Foreign key to dashboard_tokens |
| status | TEXT | Yes | CHECK (status IN ('sent', 'delivered', 'failed')) | Delivery status |
| provider_message_id | TEXT | No | | MobileMessage.com.au message ID |
| error_reason | TEXT | No | | Failure reason if status=failed |
| sent_by | UUID | No | REFERENCES users(id) ON DELETE SET NULL | Foreign key to users (who triggered send) |
| sent_at | TIMESTAMPTZ | No | DEFAULT NOW() | When SMS was sent |
| delivered_at | TIMESTAMPTZ | No | | When SMS was delivered (webhook update) |
| created_at | TIMESTAMPTZ | No | DEFAULT NOW() | Record creation timestamp |

**Indexes:**
- `idx_sms_logs_org_sent_at` on `(organization_id, sent_at DESC)` (composite)
- `idx_sms_logs_worker` on `worker_id`
- `idx_sms_logs_status` on `status`
- `idx_sms_logs_sent_by` on `sent_by`
- `idx_sms_logs_org_worker_sent` on `(organization_id, worker_id, sent_at DESC)` (composite)

### access_logs
Audit trail of dashboard access. Tracks when workers open their dashboard links.

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | PRIMARY KEY, DEFAULT gen_random_uuid() | Primary key |
| organization_id | UUID | Yes | REFERENCES organizations(id) ON DELETE CASCADE | Foreign key to organizations |
| worker_id | UUID | Yes | REFERENCES workers(id) ON DELETE CASCADE | Foreign key to workers |
| token_id | UUID | No | REFERENCES dashboard_tokens(id) ON DELETE SET NULL | Foreign key to dashboard_tokens |
| accessed_at | TIMESTAMPTZ | No | DEFAULT NOW() | Access timestamp |
| ip_address | INET | No | | Client IP address (PostgreSQL INET type) |
| user_agent | TEXT | No | CHECK (length(user_agent) <= 500) | Client user agent string (truncated) |
| validation_status | TEXT | Yes | CHECK (validation_status IN ('success', 'expired', 'invalid', 'revoked')) | Token validation result |
| created_at | TIMESTAMPTZ | No | DEFAULT NOW() | Record creation timestamp |

**Indexes:**
- `idx_access_logs_org_time` on `(organization_id, accessed_at DESC)` (composite)
- `idx_access_logs_worker` on `worker_id`
- `idx_access_logs_token` on `token_id`
- `idx_access_logs_validation_status` on `validation_status` WHERE validation_status != 'success' (partial index)
- `idx_access_logs_org_worker_time` on `(organization_id, worker_id, accessed_at DESC)` (composite)

## Relationships

- **organizations** → **users** (1:many) — One org has many admin users
- **organizations** → **workers** (1:many) — One org has many field workers
- **organizations** → **data_sources** (1:many) — One org has many plugin connections
- **organizations** → **dashboard_tokens** (1:many) — One org has many active tokens
- **workers** → **dashboard_tokens** (1:many) — One worker can have multiple tokens (e.g., daily regeneration)
- **workers** → **sms_logs** (1:many) — One worker receives many SMS messages
- **dashboard_tokens** → **access_logs** (1:many) — One token can be accessed multiple times (refresh)

## Index Summary

All indexes are documented inline with each table above. Key index patterns:

**Single-column indexes:**
- Primary keys (automatic B-tree indexes)
- Foreign keys (`organization_id`, `worker_id`, etc.) for join performance
- Unique constraints (`email`, `slug`, `token_hash`)

**Composite indexes:**
- `(organization_id, phone_number)` on workers — org-scoped phone lookup
- `(organization_id, sent_at DESC)` on sms_logs — org SMS history queries
- `(organization_id, worker_id, accessed_at DESC)` on access_logs — worker access history
- `(organization_id, status)` on data_sources — active plugins per org

**Partial indexes (WHERE clause):**
- `idx_workers_calendar_email` WHERE calendar_email IS NOT NULL — only index workers with calendar integration
- `idx_data_sources_status` WHERE status = 'error' — fast error plugin queries
- `idx_data_sources_org_active` WHERE status = 'active' — active plugins only
- `idx_dashboard_tokens_expired` WHERE revoked_at IS NULL — cleanup job optimization
- `idx_access_logs_validation_status` WHERE validation_status != 'success' — failed access attempts

**Rationale:**
- Composite indexes support common query patterns (org + date range)
- Partial indexes reduce index size and improve write performance
- DESC ordering on timestamps optimizes "recent first" queries

## Migration Strategy

**Append-only migrations:** Never edit existing migration files. Use expand-contract pattern for schema changes:
1. Add new column/table (expansion)
2. Migrate data
3. Remove old column/table (contraction)

**RLS enforcement:** All tenant-scoped tables have RLS enabled with policies using `current_setting('app.tenant_id')::uuid`. Service role bypasses RLS, so API must explicitly set tenant context per request.

**Cleanup jobs:** `cleanup_expired_tokens()` function deletes tokens older than NOW() - 24h beyond expiry window.
