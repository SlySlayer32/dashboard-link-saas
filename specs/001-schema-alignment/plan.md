# Implementation Plan: Database Schema Alignment

**Branch**: `001-schema-alignment` | **Date**: 2026-03-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-schema-alignment/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Execute a database migration to align the `workers` table schema with application expectations. Rename columns (`full_name` → `name`, `phone_number` → `phone`, `calendar_email` → `email`), add new columns (`active`, `deleted_at`, `metadata`), update indexes, and verify RLS policies remain functional. Migration must complete within 30 seconds with automated backup snapshot and all-or-nothing transaction safety.

## Technical Context

**Language/Version**: PostgreSQL 15+ (Supabase)
**Primary Dependencies**: Supabase CLI, PostgreSQL ALTER TABLE operations
**Storage**: Supabase PostgreSQL with RLS
**Testing**: Manual verification via Supabase dashboard + API integration tests
**Target Platform**: Supabase Cloud (managed PostgreSQL)
**Project Type**: database-migration
**Performance Goals**: Migration completes within 30 seconds
**Constraints**: No downtime constraint (table locks acceptable), automated backup required, transaction-safe rollback
**Scale/Scope**: Single table (`workers`), moderate record count

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| **Scope Boundary** | PASS | Database migration only; no new features added |
| **Technology Stack** | PASS | Uses existing Supabase/PostgreSQL stack (ADR-002) |
| **Security - RLS** | PASS | No RLS policy changes required; `organization_id` unchanged |
| **Multi-Tenancy** | PASS | Tenant isolation preserved at database level |
| **Testing Standards** | PASS | Database migrations tested manually per constitution Section II |
| **File Structure** | PASS | Migration follows `/supabase/migrations/` convention |

**No constitution violations detected.** Migration is a pure infrastructure change with no application code modifications.

## Project Structure

### Documentation (this feature)

```text
specs/001-schema-alignment/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification (input to this plan)
├── data-model.md        # Entity schema reference (already exists)
├── quickstart.md        # Testing instructions (already exists)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
supabase/
├── migrations/
│   └── [timestamp]_schema_alignment_workers.sql    # NEW: Migration file
├── config.toml
└── seed.sql

packages/database/
└── src/
    └── repositories/
        └── worker-repository.ts                     # VERIFY: Uses correct column names

apps/api/
└── src/
    └── services/
        └── worker-service.ts                        # VERIFY: Uses correct column names
```

**Structure Decision**: Database migration is a Supabase-native operation. No new application code required—only verification that existing code references the correct column names. Migration file follows Supabase conventions with timestamp prefix.

## Environment Deployment Sequence

**Deployment Order**: Dev → Staging → Production (sequential, no parallel environments)

| Environment | Trigger | Verification Method |
|-------------|---------|---------------------|
| **Dev (Local)** | Manual `supabase migration up` | Manual verification via Supabase Studio + API tests |
| **Staging** | After local success | Smoke tests via admin dashboard + API health checks |
| **Production** | After staging success | Smoke tests + 30-minute error rate monitoring |

**Environment Gates**:
- Dev → Staging: All local tests must pass
- Staging → Production: Staging smoke tests must pass

## Post-Migration Verification

**Verification Type**: Automated tests + manual smoke tests (hybrid approach)

| Verification | Method | Responsibility |
|--------------|--------|----------------|
| **Schema validation** | Automated SQL queries | Script execution |
| **API integration** | Automated test suite | CI/CD pipeline |
| **Dashboard UI** | Manual smoke test | Developer/QA |
| **Error rate monitoring** | Automated (30 min post-deploy) | Monitoring system |

**Post-Migration Verification Queries** (run after each environment deploy):
```sql
-- 1. Verify column renames
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'workers' AND column_name IN ('name', 'phone', 'email');

-- 2. Verify new columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'workers' AND column_name IN ('active', 'deleted_at', 'metadata');

-- 3. Verify data integrity (record count)
SELECT COUNT(*) as total_workers FROM workers;

-- 4. Verify soft delete filtering works
SELECT COUNT(*) as active_workers FROM workers WHERE deleted_at IS NULL;

-- 5. Verify active filtering works
SELECT COUNT(*) as truly_active FROM workers WHERE active = true AND deleted_at IS NULL;
```

## Implementation Phases

### Phase 1: Migration Script Creation

**Prerequisites**: spec.md with clarifications complete

**Tasks**:
1. Create Supabase migration file with timestamp prefix
2. Write `ALTER TABLE` operations in transaction block:
   - Rename columns: `full_name` → `name`, `phone_number` → `phone`, `calendar_email` → `email`
   - Add columns: `active` (BOOLEAN DEFAULT true), `deleted_at` (TIMESTAMPTZ), `metadata` (JSONB DEFAULT '{}')
   - Update indexes to reference new column names
   - Add partial index on `deleted_at` for soft delete queries
3. Include data validation queries (non-blocking, for reporting)
4. Add rollback statements in comments

**Deliverable**: `supabase/migrations/[timestamp]_schema_alignment_workers.sql`

### Phase 2: Application Code Verification

**Prerequisites**: Migration script created

**Tasks**:
1. Verify `packages/database/src/repositories/worker-repository.ts` uses `name`, `phone`, `email`
2. Verify `apps/api/src/services/worker-service.ts` uses correct column names
3. Check `packages/shared/src/schemas/index.ts` for Worker schema alignment
4. Update any hardcoded column name references if found

**Deliverable**: Verified or updated repository/service files

### Phase 3: Local Testing

**Prerequisites**: Migration script + verified code

**Tasks**:
1. Run `supabase migration up` on local environment
2. Execute test queries to verify:
   - Column renames successful
   - New columns exist with correct defaults
   - Indexes functional
   - RLS policies still enforce tenant isolation
3. Run API integration tests for worker CRUD
4. Verify soft delete filtering works (`deleted_at IS NULL`)
5. Verify active filtering works (`active = true`)

**Deliverable**: Test results documented in quickstart.md

### Phase 4: Staging Deployment

**Prerequisites**: Local testing passed

**Tasks**:
1. Create automated backup snapshot of staging database
2. Apply migration to staging environment
3. Run smoke tests against staging API
4. Verify worker management UI functions correctly

**Deliverable**: Staging environment verified

### Phase 5: Production Deployment

**Prerequisites**: Staging verification passed

**Tasks**:
1. Schedule maintenance window (per clarification: no downtime constraint)
2. Create automated backup snapshot of production database
3. Apply migration to production environment
4. Verify migration completed within 30-second target
5. Run post-migration verification queries
6. Monitor error rates for 30 minutes post-deployment

**Deliverable**: Production migration complete with verification logs

## Rollback Procedure

If migration fails or issues detected post-deployment:

```sql
-- Emergency rollback (run within same transaction window or restore from backup)
ALTER TABLE workers RENAME COLUMN name TO full_name;
ALTER TABLE workers RENAME COLUMN phone TO phone_number;
ALTER TABLE workers RENAME COLUMN email TO calendar_email;
ALTER TABLE workers DROP COLUMN IF EXISTS active;
ALTER TABLE workers DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE workers DROP COLUMN IF EXISTS metadata;
-- Re-create original indexes if needed
```

**Preferred rollback**: Restore from automated backup snapshot taken pre-migration.

## Success Verification Checklist

- [ ] Migration file created with transaction wrapper
- [ ] Local migration applies without errors
- [ ] All existing worker data preserved (100% record count match)
- [ ] Column renames verified via `\d workers` 
- [ ] New columns present with correct defaults
- [ ] Indexes updated and functional
- [ ] RLS policies verified working
- [ ] API integration tests pass
- [ ] Staging deployment successful
- [ ] Production deployment successful
