# Quick Start: Schema Alignment

**Feature**: 001-schema-alignment  
**Goal**: Test the database migration and verify all worker operations work correctly.

---

## Prerequisites

- Supabase CLI installed (`supabase --version`)
- Local Supabase running (`supabase status` shows healthy)
- pnpm installed (`pnpm --version`)

---

## 1. Run the Migration

### Apply Migration to Local Database

```bash
# From repo root
supabase migration up
```

Expected output:
```
Applying migration 20260319000000_schema_alignment_workers.sql...
Finished supabase migration up.
```

### Verify Migration Applied

```bash
# Connect to database and check column names
supabase psql

# Run verification query
\d workers
```

Expected output shows:
- Columns: `id`, `organization_id`, `name`, `phone`, `email`, `active`, `deleted_at`, `metadata`, `created_at`, `updated_at`
- Indexes: `idx_workers_phone`, `idx_workers_email`

---

## 2. Verify Data Preservation

### Check Existing Data

```sql
-- Count workers (should match pre-migration count)
SELECT COUNT(*) FROM workers;

-- Sample a few records to verify data intact
SELECT id, name, phone, email, active, deleted_at, metadata 
FROM workers 
LIMIT 5;
```

**Success criteria**: All existing worker records present with data in new column names.

---

## 3. Test CRUD Operations

### Create a New Worker

```bash
# Using API (requires auth token)
curl -X POST http://localhost:3001/api/v1/workers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -d '{
    "name": "Test Worker",
    "phone": "+61400000000",
    "email": "test@example.com",
    "metadata": {"test": true}
  }'
```

Expected response (201):
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Test Worker",
    "phone": "+61400000000",
    "email": "test@example.com",
    "active": true,
    "deleted_at": null,
    "metadata": {"test": true}
  }
}
```

### List Workers

```bash
curl http://localhost:3001/api/v1/workers \
  -H "Authorization: Bearer <your_jwt_token>"
```

Expected: Workers returned with new column names (`name`, `phone`, `email`).

### Update Worker

```bash
curl -X PATCH http://localhost:3001/api/v1/workers/<worker_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -d '{"active": false}'
```

Expected: Worker `active` field updated to `false`.

### Soft Delete Worker

```bash
curl -X DELETE http://localhost:3001/api/v1/workers/<worker_id> \
  -H "Authorization: Bearer <your_jwt_token>"
```

Expected: Worker `deleted_at` field set to current timestamp.

---

## 4. Test Soft Delete Filtering

### Active Workers Only

```bash
curl "http://localhost:3001/api/v1/workers?active=true" \
  -H "Authorization: Bearer <your_jwt_token>"
```

Expected: Soft-deleted workers do NOT appear in list.

### Include Deleted Workers

```bash
curl "http://localhost:3001/api/v1/workers?include_deleted=true" \
  -H "Authorization: Bearer <your_jwt_token>"
```

Expected: All workers including soft-deleted ones appear.

---

## 5. Verify RLS Policies

### Check Policies Still Enforced

```sql
-- Verify RLS is enabled
SELECT relrowsecurity FROM pg_class WHERE relname = 'workers';
-- Should return 'true'

-- List policies
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'workers';
```

Expected: All 4 policies (SELECT, INSERT, UPDATE, DELETE) present and using `organization_id`.

---

## 6. Rollback Test (Optional)

If migration needs rollback:

```sql
-- Manual rollback commands
ALTER TABLE workers RENAME COLUMN name TO full_name;
ALTER TABLE workers RENAME COLUMN phone TO phone_number;
ALTER TABLE workers RENAME COLUMN email TO calendar_email;

ALTER TABLE workers 
    DROP COLUMN IF EXISTS active,
    DROP COLUMN IF EXISTS deleted_at,
    DROP COLUMN IF EXISTS metadata;
```

---

## Troubleshooting

### Migration Fails

1. Check existing column names:
   ```sql
   SELECT column_name FROM information_schema.columns WHERE table_name = 'workers';
   ```

2. Verify no dependent objects block rename:
   ```sql
   -- Check for views, triggers, or functions referencing old column names
   \d workers
   ```

### API Returns Old Column Names

1. Restart API server to pick up updated repository types
2. Verify `/packages/database/src/types/database.ts` has new column names

### Indexes Not Working

```sql
-- Rebuild indexes if needed
REINDEX INDEX idx_workers_phone;
REINDEX INDEX idx_workers_email;
```

---

## Success Checklist

- [x] Migration applies without errors
- [x] All existing worker data preserved
- [x] Worker creation succeeds with new column names
- [x] Worker list returns `name`, `phone`, `email` fields
- [x] Soft delete sets `deleted_at` timestamp
- [x] Active filter excludes soft-deleted workers
- [x] RLS policies still enforce tenant isolation
- [x] Indexes function correctly on renamed columns

## Test Results Summary

**Migration Applied**: 20260311000000_add_worker_soft_delete.sql  
**Database Schema**: Successfully aligned with specification  
**Column Renames**: `full_name` → `name`, `phone_number` → `phone`, `calendar_email` → `email`  
**New Columns**: `active` (BOOLEAN), `deleted_at` (TIMESTAMPTZ), `metadata` (JSONB)  
**Indexes**: Updated and functional with partial indexes for performance  

**Application Code Status**:
- ✅ WorkerRepository.ts uses correct column names
- ✅ WorkerService.ts handles new schema fields
- ✅ API routes support filtering parameters (`active`, `include_deleted`)
- ✅ TypeScript types aligned with database schema

---

## Production Deployment

1. **Backup database** before migration
2. **Run migration during low-traffic window**
3. **Monitor error rates** after deployment
4. **Keep rollback commands ready**
