# Schema Alignment Deployment Guide

## Remaining Tasks for Production Deployment

### T002: Production Database Backup
**Action Required**: Manual step via Supabase dashboard
1. Navigate to Supabase project dashboard
2. Go to Settings → Database → Backups
3. Create manual backup snapshot
4. Document backup ID: `_________________`

### T043: Staging Deployment
**Action Required**: Apply migration to staging environment
```bash
# Target: Staging Supabase project
supabase link --project-ref <staging-project-id>
supabase db push
```
**Verification**: Run smoke tests against staging API endpoints

### T044: Staging Smoke Tests
**Action Required**: Test all three user stories on staging
1. **User Story 1**: Worker CRUD operations
   - Create worker: `POST /api/v1/workers`
   - List workers: `GET /api/v1/workers`
   - Update worker: `PATCH /api/v1/workers/:id`
2. **User Story 2**: Soft delete functionality
   - Delete worker: `DELETE /api/v1/workers/:id`
   - Verify soft-deleted excluded from list
   - Restore worker: `POST /api/v1/workers/:id/restore`
3. **User Story 3**: Active/inactive filtering
   - Filter by active status: `GET /api/v1/workers?active=true`
   - Toggle worker status: `PATCH /api/v1/workers/:id`

### T045: Production Deployment
**Action Required**: Schedule maintenance window and deploy
1. **Pre-deployment checklist**:
   - [ ] Production backup created (T002)
   - [ ] Staging tests passed (T044)
   - [ ] Maintenance window scheduled
   - [ ] Rollback plan documented

2. **Deployment commands**:
```bash
# Target: Production Supabase project
supabase link --project-ref <production-project-id>
supabase db push
```

3. **Post-deployment verification**:
   - Migration completes within 30 seconds
   - All API endpoints respond correctly
   - Data integrity preserved

### T046: Post-Deployment Monitoring
**Action Required**: Monitor error rates for 30 minutes
1. Check Supabase dashboard error metrics
2. Monitor API response times
3. Verify worker operations continue working
4. Document any issues found

## Rollback Procedure

If issues detected post-deployment:

### Option 1: Database Rollback (Immediate)
```sql
-- Emergency rollback SQL
ALTER TABLE workers RENAME COLUMN name TO full_name;
ALTER TABLE workers RENAME COLUMN phone TO phone_number;
ALTER TABLE workers RENAME COLUMN email TO calendar_email;
ALTER TABLE workers DROP COLUMN IF EXISTS active;
ALTER TABLE workers DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE workers DROP COLUMN IF EXISTS metadata;
```

### Option 2: Backup Restore (Preferred)
1. Navigate to Supabase dashboard
2. Go to Settings → Database → Backups
3. Restore from pre-deployment backup snapshot

## Success Criteria

All deployment tasks complete when:
- [ ] Production backup documented
- [ ] Staging deployment successful
- [ ] All smoke tests pass on staging
- [ ] Production migration applied successfully
- [ ] 30-minute post-deployment monitoring complete
- [ ] No critical errors detected

## Notes

- Migration `20260311000000_add_worker_soft_delete.sql` is transaction-safe
- All application code already uses new column names
- RLS policies remain functional (no changes needed)
- Index performance optimized with partial indexes
