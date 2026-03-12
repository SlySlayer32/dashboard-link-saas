# Data Model: Worker Management

**Feature**: Worker Management  
**Date**: 2026-03-08  
**Status**: Complete

## Overview

Data model for worker management with soft delete, phone validation, and multi-tenant isolation. Extends existing `workers` table with `deleted_at` column.

---

## Entities

### Worker

Represents a field worker who receives dashboard links via SMS.

**Table**: `workers`  
**Primary Key**: `id` (UUID)  
**Tenant Scoped**: Yes (via `organization_id`)

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique worker identifier |
| `name` | VARCHAR(255) | NOT NULL, CHECK (length(name) > 0 AND length(name) <= 255) | Worker's full name |
| `phone` | TEXT | NOT NULL, CHECK (phone ~ '^\+[1-9]\d{1,14}$') | Phone in E.164 format (+614XXXXXXXX) |
| `email` | TEXT | NULLABLE, CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$') | Optional email address |
| `organization_id` | UUID | NOT NULL, FOREIGN KEY → organizations(id) | Organization this worker belongs to |
| `active` | BOOLEAN | NOT NULL, DEFAULT true | Worker status (for future use) |
| `deleted_at` | TIMESTAMPTZ | NULLABLE, DEFAULT NULL | Soft delete timestamp (NULL = active) |
| `metadata` | JSONB | NOT NULL, DEFAULT '{}' | Extensible metadata field |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

#### Indexes

```sql
-- Primary key index (automatic)
CREATE UNIQUE INDEX workers_pkey ON workers(id);

-- Organization + active workers (most common query)
CREATE INDEX idx_workers_org_active ON workers(organization_id, deleted_at) 
WHERE deleted_at IS NULL;

-- Phone uniqueness for active workers only (prevents duplicates)
CREATE UNIQUE INDEX idx_workers_phone_org_active 
ON workers(phone, organization_id) 
WHERE deleted_at IS NULL;

-- Full-text search on name (for search functionality)
CREATE INDEX idx_workers_name_trgm ON workers USING gin(name gin_trgm_ops);
```

#### Relationships

- **Belongs to**: `organizations` (many-to-one)
  - Foreign key: `organization_id → organizations.id`
  - Cascade: ON DELETE CASCADE (if org deleted, workers deleted)

**Future Relationships** (not in this feature):
  
- **Has many**: `dashboard_tokens` (one-to-many) — Feature 002-token-system
  - Foreign key: `dashboard_tokens.worker_id → workers.id`
  - Cascade: ON DELETE CASCADE (if worker deleted, tokens deleted)
  
- **Has many**: `sms_logs` (one-to-many) — Feature 003-sms-delivery
  - Foreign key: `sms_logs.worker_id → workers.id`
  - Cascade: ON DELETE SET NULL (preserve SMS history even if worker deleted)
  
- **Has many**: `access_logs` (one-to-many) — Feature 005-access-logging
  - Foreign key: `access_logs.worker_id → workers.id`
  - Cascade: ON DELETE SET NULL (preserve access history even if worker deleted)

**Note**: This feature (001) only implements the `workers` table. Related tables are implemented in features 002, 003, and 005.

#### Validation Rules

**Name**:
- Required (NOT NULL)
- Min length: 1 character
- Max length: 255 characters
- Trimmed on input
- Supports Unicode (apostrophes, hyphens, accents)

**Phone**:
- Required (NOT NULL)
- Format: E.164 (`^\+[1-9]\d{1,14}$`)
- Australian mobile: `+614XXXXXXXX` (X = 0-9)
- Validated via libphonenumber-js before storage
- Unique per organization for active workers only
- Display format: "04XX XXX XXX" (UI only)

**Email**:
- Optional (NULLABLE)
- Format: Basic email regex (not strict RFC 5322)
- Trimmed on input
- Empty string converted to NULL

**Organization ID**:
- Required (NOT NULL)
- Must reference existing organization
- Derived from JWT claims (never from client input)

**Deleted At**:
- NULL = active worker
- TIMESTAMPTZ = soft deleted worker
- Set to NOW() on delete operation
- Never manually set by client

#### State Transitions

```
[Created] → [Active] → [Soft Deleted]
   ↓           ↓
   └─────────→ [Active] (reactivation not in MVP)
```

**Create**: `deleted_at = NULL`, `active = true`  
**Soft Delete**: `deleted_at = NOW()`, `active` unchanged  
**Reactivate**: Not in MVP scope (would set `deleted_at = NULL`)

---

## TypeScript Types

### Domain Types

```typescript
// packages/shared/src/types/worker.ts

export interface Worker {
  id: string;
  name: string;
  phone: string;  // E.164 format: +614XXXXXXXX
  email?: string;
  organizationId: string;
  active: boolean;
  deletedAt: string | null;  // ISO 8601 timestamp or null
  metadata: Record<string, unknown>;
  createdAt: string;  // ISO 8601 timestamp
  updatedAt: string;  // ISO 8601 timestamp
}

export interface CreateWorkerRequest {
  name: string;
  phone: string;  // Accepts AU formats: "04XX XXX XXX", "0412345678", "+614XXXXXXXX"
}

export interface UpdateWorkerRequest {
  name?: string;
  phone?: string;  // Accepts AU formats
}

export interface WorkerListResponse {
  workers: Worker[];
  total: number;
}

export interface WorkerResponse {
  worker: Worker;
}
```

### Database Types

```typescript
// packages/database/src/types/worker.ts

export interface WorkerRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  organization_id: string;
  active: boolean;
  deleted_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Transform functions
export function toWorker(row: WorkerRow): Worker {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    organizationId: row.organization_id,
    active: row.active,
    deletedAt: row.deleted_at,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toWorkerRow(worker: Partial<Worker>): Partial<WorkerRow> {
  return {
    name: worker.name,
    phone: worker.phone,
    email: worker.email ?? null,
    organization_id: worker.organizationId,
    active: worker.active,
    deleted_at: worker.deletedAt,
    metadata: worker.metadata,
  };
}
```

---

## Query Patterns

### Common Queries

**List active workers for organization**:
```sql
SELECT * FROM workers 
WHERE organization_id = $1 
  AND deleted_at IS NULL
ORDER BY name ASC;
```

**Get worker by ID (with tenant check)**:
```sql
SELECT * FROM workers 
WHERE id = $1 
  AND organization_id = $2
  AND deleted_at IS NULL;
```

**Check phone uniqueness (active workers only)**:
```sql
SELECT id FROM workers 
WHERE phone = $1 
  AND organization_id = $2
  AND deleted_at IS NULL
LIMIT 1;
```

**Soft delete worker**:
```sql
UPDATE workers 
SET deleted_at = NOW(), updated_at = NOW()
WHERE id = $1 
  AND organization_id = $2
  AND deleted_at IS NULL
RETURNING *;
```

**Search workers by name**:
```sql
SELECT * FROM workers 
WHERE organization_id = $1 
  AND deleted_at IS NULL
  AND name ILIKE $2
ORDER BY name ASC
LIMIT $3;
```

### Performance Considerations

- **Index usage**: `idx_workers_org_active` covers most queries (org + active filter)
- **Partial index**: Only indexes active workers (WHERE deleted_at IS NULL)
- **Query cost**: O(log n) for indexed queries, O(n) for full table scans
- **Expected scale**: 1-10 workers per org (MVP), <100ms query time

---

## RLS Policies

### Tenant Isolation Policy

```sql
-- Enable RLS on workers table
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access workers in their organization
CREATE POLICY "tenant_isolation" ON workers
FOR ALL
USING (organization_id = current_setting('app.tenant_id')::uuid);
```

### Policy Behavior

- **SELECT**: Only returns workers where `organization_id` matches tenant context
- **INSERT**: Only allows inserts where `organization_id` matches tenant context
- **UPDATE**: Only allows updates where `organization_id` matches tenant context
- **DELETE**: Only allows deletes where `organization_id` matches tenant context

### Tenant Context Setup

```typescript
// Middleware sets tenant context on every request
await supabase.rpc('set_config', {
  setting: 'app.tenant_id',
  value: organizationId,  // From JWT claims
  is_local: true
});

// All subsequent queries inherit this context
// Even SQL injection cannot cross tenant boundaries
```

---

## Migration Strategy

### Migration File: `20260311000000_add_worker_soft_delete.sql`

```sql
-- Add deleted_at column to workers table
ALTER TABLE workers ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for active worker queries
CREATE INDEX idx_workers_org_active ON workers(organization_id, deleted_at) 
WHERE deleted_at IS NULL;

-- Add unique constraint for phone numbers (active workers only)
CREATE UNIQUE INDEX idx_workers_phone_org_active 
ON workers(phone, organization_id) 
WHERE deleted_at IS NULL;

-- Update existing workers to be active (deleted_at = NULL)
-- This is a no-op since DEFAULT NULL, but explicit for clarity
UPDATE workers SET deleted_at = NULL WHERE deleted_at IS NULL;

-- Add check constraint for E.164 phone format
ALTER TABLE workers ADD CONSTRAINT check_phone_e164 
CHECK (phone ~ '^\+[1-9]\d{1,14}$');

-- Add trigger to update updated_at on changes
-- Note: update_updated_at_column() is a shared utility function reusable across tables
-- Create function only if it doesn't already exist (may be shared with other tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workers_updated_at 
BEFORE UPDATE ON workers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Rollback Strategy

```sql
-- Remove trigger
DROP TRIGGER IF EXISTS update_workers_updated_at ON workers;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Remove constraints
ALTER TABLE workers DROP CONSTRAINT IF EXISTS check_phone_e164;

-- Remove indexes
DROP INDEX IF EXISTS idx_workers_phone_org_active;
DROP INDEX IF EXISTS idx_workers_org_active;

-- Remove column
ALTER TABLE workers DROP COLUMN IF EXISTS deleted_at;
```

---

## Data Integrity Rules

### Business Rules

1. **One active worker per phone per organization**: Enforced by unique index
2. **Soft delete preserves history**: SMS logs and access logs remain queryable
3. **Phone reuse allowed**: Deleted worker's phone can be used by new worker
4. **Cross-org isolation**: Different orgs can have workers with same phone
5. **Tenant context required**: All queries must set `app.tenant_id`

### Database Constraints

- **NOT NULL**: `id`, `name`, `phone`, `organization_id`, `active`, `created_at`, `updated_at`
- **UNIQUE**: `(phone, organization_id)` WHERE `deleted_at IS NULL`
- **CHECK**: `phone` matches E.164 format
- **CHECK**: `name` length > 0
- **FOREIGN KEY**: `organization_id` references `organizations(id)`

### Application-Level Validation

- **Phone format**: Validated via libphonenumber-js before storage
- **Name trimming**: Leading/trailing whitespace removed
- **Email format**: Basic validation (contains @)
- **Duplicate check**: Service layer checks before create/update

---

## Summary

**Table**: `workers` (existing, add `deleted_at` column)  
**Key Addition**: Soft delete via `deleted_at TIMESTAMPTZ`  
**Indexes**: 3 total (primary key, org+active, phone uniqueness)  
**RLS**: Tenant isolation via `app.tenant_id` session variable  
**Validation**: E.164 phone format, libphonenumber-js, unique active phones  
**Relationships**: Belongs to organization, has many tokens/logs  

**Migration**: Single SQL file adds column, indexes, constraints, trigger  
**Rollback**: Safe - column can be dropped without data loss  
**Performance**: <100ms queries for 1-10 workers per org (indexed)
