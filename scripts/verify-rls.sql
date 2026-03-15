-- Verify RLS policy enforcement for workers table
-- Run with: psql -f scripts/verify-rls.sql

-- Setup: Create test organizations and workers
DO $$
DECLARE
  org_a_id uuid := '11111111-1111-1111-1111-111111111111';
  org_b_id uuid := '22222222-2222-2222-2222-222222222222';
  worker_a_id uuid;
  worker_b_id uuid;
BEGIN
  -- Clean up test data if exists
  DELETE FROM workers WHERE organization_id IN (org_a_id, org_b_id);
  DELETE FROM organizations WHERE id IN (org_a_id, org_b_id);
  
  -- Create test organizations
  INSERT INTO organizations (id, name, created_at, updated_at)
  VALUES 
    (org_a_id, 'Test Org A', NOW(), NOW()),
    (org_b_id, 'Test Org B', NOW(), NOW());
  
  -- Create test workers
  INSERT INTO workers (organization_id, name, phone, created_at, updated_at)
  VALUES 
    (org_a_id, 'Worker A', '+61412000001', NOW(), NOW())
  RETURNING id INTO worker_a_id;
  
  INSERT INTO workers (organization_id, name, phone, created_at, updated_at)
  VALUES 
    (org_b_id, 'Worker B', '+61412000002', NOW(), NOW())
  RETURNING id INTO worker_b_id;
  
  RAISE NOTICE 'Test data created: Org A (%), Org B (%), Worker A (%), Worker B (%)', 
    org_a_id, org_b_id, worker_a_id, worker_b_id;
END $$;

-- Test 1: Set tenant context to Org A, verify only Org A workers are visible
SET app.tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT 'Test 1: Org A context - should see only Worker A' AS test;
SELECT id, name, phone, organization_id FROM workers;

-- Test 2: Set tenant context to Org B, verify only Org B workers are visible
SET app.tenant_id = '22222222-2222-2222-2222-222222222222';
SELECT 'Test 2: Org B context - should see only Worker B' AS test;
SELECT id, name, phone, organization_id FROM workers;

-- Test 3: Attempt to query without tenant context (should see nothing or error)
RESET app.tenant_id;
SELECT 'Test 3: No tenant context - should see nothing' AS test;
SELECT id, name, phone, organization_id FROM workers 
WHERE organization_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- Test 4: Verify RLS policy exists and is enabled
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'workers' AND policyname = 'tenant_isolation';

-- Test 5: Verify RLS is enabled on workers table
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'workers';

-- Cleanup
DO $$
BEGIN
  DELETE FROM workers WHERE organization_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
  );
  DELETE FROM organizations WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
  );
  RAISE NOTICE 'Test data cleaned up';
END $$;
