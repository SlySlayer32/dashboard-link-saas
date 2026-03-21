# Data Model: Worker Entity (Schema Alignment)

**Feature**: 001-schema-alignment  
**Date**: 2026-03-19  

---

## Entity: Worker

Represents a field worker/employee who receives daily dashboard SMS messages.

### Schema

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| organization_id | UUID | NO | - | Foreign key to organizations (RLS tenant key) |
| name | VARCHAR(255) | NO | - | Worker's full name (was `full_name`) |
| phone | VARCHAR(20) | NO | - | E.164 formatted phone number (was `phone_number`) |
| email | VARCHAR(255) | YES | NULL | Calendar/contact email (was `calendar_email`) |
| active | BOOLEAN | NO | true | Whether worker is currently active |
| deleted_at | TIMESTAMPTZ | YES | NULL | Soft delete timestamp (NULL = not deleted) |
| metadata | JSONB | NO | '{}' | Arbitrary key-value storage |
| created_at | TIMESTAMPTZ | NO | now() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | now() | Last update timestamp |

### Constraints

- **Primary Key**: `id`
- **Foreign Key**: `organization_id` references `organizations(id)` with CASCADE DELETE
- **Unique**: None at worker level (phone uniqueness enforced at application layer per organization)
- **Check**: `phone` must match E.164 format (`^\+[1-9]\d{1,14}$`)

### Indexes

| Name | Columns | Type | Notes |
|------|---------|------|-------|
| workers_pkey | id | B-tree | Primary key index (auto-created) |
| idx_workers_organization | organization_id | B-tree | RLS query optimization |
| idx_workers_phone | phone | B-tree | Phone lookup (was `idx_workers_phone_number`) |
| idx_workers_email | email | B-tree | Email lookup (was `idx_workers_calendar_email`) |
| idx_workers_active | active | B-tree | Active filter optimization |
| idx_workers_deleted_at | deleted_at | B-tree | Soft delete filter (partial index recommended) |

### RLS Policies

| Policy | Operation | Using Expression | With Check Expression |
|--------|-----------|------------------|----------------------|
| tenant_isolation_select | SELECT | organization_id = current_setting('app.tenant_id')::uuid | - |
| tenant_isolation_insert | INSERT | - | organization_id = current_setting('app.tenant_id')::uuid |
| tenant_isolation_update | UPDATE | organization_id = current_setting('app.tenant_id')::uuid | organization_id = current_setting('app.tenant_id')::uuid |
| tenant_isolation_delete | DELETE | organization_id = current_setting('app.tenant_id')::uuid | - |

**Note**: RLS policies use `organization_id` which is unchanged. No policy updates needed for column renames.

---

## State Transitions

### Active Status

```
┌─────────────┐    Set active=false    ┌─────────────┐
│   ACTIVE    │ ─────────────────────→ │  INACTIVE   │
│ (active=true│                        │ (active=fals│
└─────────────┘ ←───────────────────── └─────────────┘
        Set active=true
```

### Soft Delete

```
┌─────────────┐    Set deleted_at=now()    ┌─────────────┐
│   ACTIVE    │ ─────────────────────────→ │   DELETED   │
│(deleted_at=N│                            │(deleted_at=t│
└─────────────┘ ←───────────────────────── └─────────────┘
        Set deleted_at=NULL (undelete - rare)
```

**Active Query Pattern**:
```sql
-- Standard "active workers" query filters both status and soft delete
SELECT * FROM workers 
WHERE organization_id = :org_id 
  AND active = true 
  AND deleted_at IS NULL;
```

---

## TypeScript Interface

```typescript
interface Worker {
  id: string;
  organization_id: string;
  name: string;
  phone: string;
  email: string | null;
  active: boolean;
  deleted_at: string | null;  // ISO 8601 timestamp
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// For creating a new worker
interface CreateWorkerInput {
  name: string;
  phone: string;
  email?: string | null;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

// For updating a worker (all fields optional)
interface UpdateWorkerInput {
  name?: string;
  phone?: string;
  email?: string | null;
  active?: boolean;
  metadata?: Record<string, unknown>;
  deleted_at?: string | null;  // For soft delete/undelete
}
```

---

## Zod Schema

```typescript
import { z } from 'zod';

export const WorkerSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Must be E.164 format (+1234567890)'),
  email: z.string().email().nullable(),
  active: z.boolean().default(true),
  deleted_at: z.string().datetime().nullable(),
  metadata: z.record(z.unknown()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateWorkerSchema = WorkerSchema.omit({
  id: true,
  organization_id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
}).partial({
  active: true,
  metadata: true,
});

export const UpdateWorkerSchema = CreateWorkerSchema.partial();
```

---

## Related Entities

### Organization (Parent)

| Column | Type | Relationship |
|--------|------|--------------|
| id | UUID | One-to-Many with workers |

### DashboardToken (Child)

Workers have many dashboard tokens (one per SMS sent):

| Column | Type | Description |
|--------|------|-------------|
| worker_id | UUID | Foreign key to workers(id) |
| token_hash | VARCHAR(64) | SHA-256 hash of the access token |
| expires_at | TIMESTAMPTZ | Token expiration time |

### DataSource (Related)

Workers are associated with data sources for schedule/task retrieval:

| Column | Type | Description |
|--------|------|-------------|
| worker_id | UUID | Foreign key to workers(id) - optional |
| organization_id | UUID | Required association |
