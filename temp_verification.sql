-- Post-Migration Verification Queries
-- Run these to verify the schema alignment was successful

-- 1. Verify column renames
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'workers' AND column_name IN ('name', 'phone', 'email', 'active', 'deleted_at', 'metadata')
ORDER BY column_name;

-- 2. Verify data integrity (record count preservation)
SELECT COUNT(*) as total_workers FROM workers;

-- 3. Verify indexes are created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'workers' 
  AND indexname LIKE 'idx_workers_%'
ORDER BY indexname;

-- 4. Sample data verification
SELECT id, name, phone, email, active, deleted_at, metadata 
FROM workers 
LIMIT 3;

-- 5. Verify soft delete filtering works
SELECT COUNT(*) as active_workers FROM workers WHERE deleted_at IS NULL;

-- 6. Verify active filtering works
SELECT COUNT(*) as truly_active FROM workers WHERE active = true AND deleted_at IS NULL;
