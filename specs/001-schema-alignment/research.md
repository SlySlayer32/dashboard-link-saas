# Research: PostgreSQL Schema Migration Patterns

**Feature**: Database Schema Alignment (001-schema-alignment)  
**Date**: 2026-03-19  
**Research Tasks**: PostgreSQL column renaming, index management, RLS policy compatibility, zero-downtime migrations

---

## Decision: Column Renaming Strategy

**Chosen Approach**: Use `ALTER TABLE ... RENAME COLUMN` in a single transaction-safe migration.

### Rationale

PostgreSQL's `ALTER TABLE` operations on column names are metadata-only changes that:
- Execute instantly (no table rewrite)
- Are fully transactional (can rollback if needed)
- Preserve all existing data
- Automatically update most index references (except expression indexes)

### Migration Commands

```sql
-- Rename columns (metadata-only, instant)
ALTER TABLE workers RENAME COLUMN full_name TO name;
ALTER TABLE workers RENAME COLUMN phone_number TO phone;
ALTER TABLE workers RENAME COLUMN calendar_email TO email;

-- Add new columns with defaults
ALTER TABLE workers 
    ADD COLUMN active BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN deleted_at TIMESTAMPTZ NULL,
    ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}';

-- Update indexes to reference new column names
DROP INDEX IF EXISTS idx_workers_phone_number;
DROP INDEX IF EXISTS idx_workers_calendar_email;
CREATE INDEX idx_workers_phone ON workers(phone);
CREATE INDEX idx_workers_email ON workers(email);
```

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Create new table, migrate data, swap | Unnecessary complexity; column renames are metadata-only in PostgreSQL |
| Column views as compatibility layer | Adds tech debt; cleaner to update code to match schema |
| Multiple small migrations | Single migration is atomic and simpler for this change scope |

---

## Decision: Index Rebuild Strategy

**Chosen Approach**: Drop and recreate indexes referencing renamed columns.

### Rationale

When columns are renamed, PostgreSQL automatically updates:
- ✅ B-tree indexes on the column
- ✅ Foreign key constraints
- ✅ CHECK constraints
- ⚠️ Expression indexes (must be dropped and recreated)
- ⚠️ Partial indexes with column references in predicates

The `idx_workers_phone_number` and `idx_workers_calendar_email` indexes are simple B-tree indexes that PostgreSQL handles automatically. However, for clarity and to ensure naming consistency, we will explicitly drop and recreate them with new names matching the columns.

---

## Decision: RLS Policy Compatibility

**Chosen Approach**: No RLS policy changes required.

### Rationale

Current RLS policies on the `workers` table reference:
- `organization_id` (unchanged)
- `auth.uid()` (Supabase auth function)

Since the column renames affect `full_name`, `phone_number`, and `calendar_email` only, and RLS policies use `organization_id` for tenant isolation, **no policy modifications are needed**.

Verification query:
```sql
SELECT policyname, qual, with_check 
FROM pg_policies 
WHERE tablename = 'workers';
```

---

## Decision: Migration Safety & Rollback

**Chosen Approach**: Transaction-safe migration with verified rollback procedure.

### Rationale

PostgreSQL DDL operations in a transaction block are atomic. If any step fails, all changes rollback.

### Rollback Procedure

```sql
-- Reverse the migration if needed
ALTER TABLE workers RENAME COLUMN name TO full_name;
ALTER TABLE workers RENAME COLUMN phone TO phone_number;
ALTER TABLE workers RENAME COLUMN email TO calendar_email;

ALTER TABLE workers 
    DROP COLUMN IF EXISTS active,
    DROP COLUMN IF EXISTS deleted_at,
    DROP COLUMN IF EXISTS metadata;

DROP INDEX IF EXISTS idx_workers_phone;
DROP INDEX IF EXISTS idx_workers_email;
CREATE INDEX idx_workers_phone_number ON workers(phone_number);
CREATE INDEX idx_workers_calendar_email ON workers(calendar_email);
```

---

## Decision: Downstream Code Updates

**Chosen Approach**: Update repository layer and type definitions to match new schema.

### Files Requiring Updates

1. **`/packages/database/src/repositories/worker-repository.ts`**
   - Update SQL column references: `full_name` → `name`, etc.

2. **`/packages/database/src/types/database.ts`**
   - Update TypeScript interfaces to match new column names
   - Add new fields: `active`, `deleted_at`, `metadata`

3. **`/packages/shared/src/schemas/index.ts`**
   - Verify Zod schemas match new column names

### Rationale

The repository pattern isolates all database access. By updating the repository layer, all API routes and services automatically get the correct column mappings. The TypeScript types ensure compile-time safety.

---

## Best Practices Applied

1. **Transaction Safety**: All ALTER operations wrapped in implicit transaction
2. **Index Naming**: Indexes named consistently with column names (`idx_workers_phone` matches `phone` column)
3. **Default Values**: New columns have sensible defaults (`active = true`, `metadata = '{}'`)
4. **Nullable Soft Delete**: `deleted_at` is nullable (NULL = not deleted, timestamp = soft deleted)
5. **No Breaking Changes**: Migration is additive + renaming, no data loss

---

## Research Sources

- PostgreSQL 15 Documentation: ALTER TABLE
- Supabase Migrations Best Practices
- Project Constitution: Database patterns (soft deletes, RLS, migrations only)
