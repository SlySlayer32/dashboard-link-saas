-- Verify database indexes are being used for worker queries
-- Run with: psql -f scripts/verify-indexes.sql

-- Test 1: List active workers by organization (most common query)
EXPLAIN ANALYZE
SELECT * FROM workers 
WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
  AND deleted_at IS NULL;

-- Test 2: Find active worker by phone and organization (duplicate check)
EXPLAIN ANALYZE
SELECT * FROM workers 
WHERE phone = '+61412345678' 
  AND organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
  AND deleted_at IS NULL;

-- Test 3: Get single worker by ID with org check
EXPLAIN ANALYZE
SELECT * FROM workers 
WHERE id = '00000000-0000-0000-0000-000000000002'::uuid 
  AND organization_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Expected indexes to be used:
-- Query 1: idx_workers_org_active (partial index on organization_id, deleted_at WHERE deleted_at IS NULL)
-- Query 2: idx_workers_phone_org_active (unique partial index on phone, organization_id WHERE deleted_at IS NULL)
-- Query 3: workers_pkey (primary key on id)
