# ADR 002: Hard Deletes Over Soft Deletes

**Status:** Accepted  
**Date:** 2026-03-07  
**Decision Makers:** Engineering Team  
**Consulted:** Context7 (Vitest best practices)

## Context

When designing the database schema for CleanConnect, we needed to decide between two deletion strategies:

1. **Soft Deletes**: Add `deleted_at` timestamp to tables, filter out deleted records in queries
2. **Hard Deletes**: Permanently remove records using `DELETE` with `ON DELETE CASCADE` or `ON DELETE SET NULL`

This decision impacts:
- Data recovery capabilities
- Query complexity
- Compliance with data privacy regulations (GDPR, CCPA)
- Database performance and storage costs
- Audit trail completeness

## Decision

**We will use HARD DELETES for all tables in CleanConnect.**

No `deleted_at` columns will be added to any tables. Deletion operations will permanently remove records from the database using:
- `ON DELETE CASCADE` for dependent records that should be removed
- `ON DELETE SET NULL` for audit logs that should preserve historical references

## Rationale

### 1. **Compliance with Data Privacy Regulations**

**GDPR Article 17 (Right to Erasure)** and similar regulations require that users can request complete deletion of their personal data. Soft deletes complicate compliance because:
- Data remains in the database (even if marked deleted)
- Requires additional processes to truly purge data
- Creates liability if "deleted" data is exposed in a breach

**Hard deletes provide clean compliance:**
- When a worker or organization is deleted, their data is immediately and permanently removed
- No ambiguity about whether data has been truly erased
- Simpler to demonstrate compliance in audits

### 2. **Simplified Query Logic**

**Soft deletes add complexity to every query:**
```sql
-- Every query needs WHERE deleted_at IS NULL
SELECT * FROM workers 
WHERE organization_id = $1 
  AND deleted_at IS NULL  -- Easy to forget!
```

**Hard deletes keep queries simple:**
```sql
-- Clean, straightforward queries
SELECT * FROM workers 
WHERE organization_id = $1
```

This reduces:
- Developer cognitive load
- Risk of accidentally exposing "deleted" data
- Query execution time (no extra filter on every query)

### 3. **Audit Trail Preserved Where Needed**

We still maintain audit trails through:
- **SMS logs** (`sms_logs`) with `ON DELETE SET NULL` for `worker_id`
- **Access logs** (`access_logs`) with `ON DELETE SET NULL` for `token_id`
- **Immutable logs** that preserve historical references even after entities are deleted

Example:
```sql
-- Worker deleted, but SMS history preserved
DELETE FROM workers WHERE id = '123';
-- sms_logs.worker_id becomes NULL, but record remains
-- We can still see "SMS sent to +61..." in logs
```

### 4. **Token-Based Architecture Reduces Risk**

CleanConnect's architecture minimizes data loss risk:
- **Dashboard tokens** are time-limited (1-24 hours) and auto-expire
- **Worker dashboards** are regenerated daily from live plugin data
- **No critical user-generated content** stored in the database (tasks/schedules come from external sources)

If a worker is accidentally deleted:
- SMS logs show when they were last sent a dashboard
- Organization can re-add the worker with the same phone number
- Next dashboard send will work normally

### 5. **Performance and Storage Benefits**

**Hard deletes:**
- Reduce database size (deleted records don't consume space)
- Eliminate need for periodic purge jobs
- Simplify index maintenance (no filtering on `deleted_at`)
- Faster queries (fewer rows to scan)

**Soft deletes would require:**
- Scheduled jobs to purge old soft-deleted records
- Larger indexes (including deleted records)
- More complex backup/restore procedures

## Consequences

### Positive

✅ **Compliance**: Clean GDPR/CCPA compliance with right to erasure  
✅ **Simplicity**: No `WHERE deleted_at IS NULL` on every query  
✅ **Performance**: Smaller database, faster queries, simpler indexes  
✅ **Security**: No risk of exposing "deleted" data  
✅ **Audit Trail**: Preserved through `ON DELETE SET NULL` in logs  

### Negative

⚠️ **No Undo**: Accidental deletions cannot be recovered from database  
⚠️ **Data Loss Risk**: Requires careful UI confirmation dialogs  
⚠️ **Testing**: Need to test cascade behavior thoroughly  

### Mitigations

**To address the negative consequences:**

1. **Database Backups**: Daily automated backups with point-in-time recovery
   - Supabase provides automatic backups
   - Can restore accidentally deleted data from backup

2. **Confirmation Dialogs**: All delete operations require explicit confirmation
   ```typescript
   // Example: Worker deletion confirmation
   <ConfirmDialog
     title="Delete Worker?"
     message="This will permanently delete {worker.name} and all associated tokens. SMS logs will be preserved. This action cannot be undone."
     confirmText="Delete Permanently"
     variant="destructive"
   />
   ```

3. **Cascade Testing**: Comprehensive tests for `ON DELETE CASCADE` behavior
   ```typescript
   // Test: Deleting organization cascades to workers
   test('deleting organization removes all workers', async () => {
     await deleteOrganization(orgId)
     const workers = await getWorkers(orgId)
     expect(workers).toHaveLength(0)
   })
   ```

4. **Audit Logging**: All delete operations logged with timestamp and user
   ```typescript
   // Log who deleted what and when
   await auditLog.create({
     action: 'DELETE_WORKER',
     userId: currentUser.id,
     resourceId: worker.id,
     metadata: { workerName: worker.name, phone: worker.phone }
   })
   ```

## Alternatives Considered

### Alternative 1: Soft Deletes with Periodic Purge

**Approach**: Add `deleted_at` to all tables, filter in queries, purge after 30 days

**Rejected because:**
- Adds 30-day compliance window (GDPR requires "without undue delay")
- Requires complex purge jobs
- Every query needs `WHERE deleted_at IS NULL`
- Doesn't eliminate data loss risk (still need backups)

### Alternative 2: Hybrid Approach

**Approach**: Soft delete for critical tables (workers, organizations), hard delete for others

**Rejected because:**
- Inconsistent patterns confuse developers
- Still requires complex query logic for soft-deleted tables
- Doesn't solve compliance issues
- Adds cognitive overhead ("which tables are soft-deleted?")

### Alternative 3: Event Sourcing

**Approach**: Store all changes as immutable events, reconstruct state from event log

**Rejected because:**
- Massive over-engineering for MVP
- Significant complexity in queries and data access
- Not needed for CleanConnect's use case (external data sources are source of truth)

## Implementation Details

### Database Schema

All foreign key constraints use explicit cascade behavior:

```sql
-- Cascade deletes (dependent data removed)
CREATE TABLE workers (
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE
);

-- Preserve audit trail (set to NULL)
CREATE TABLE sms_logs (
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL
);
```

### API Layer

Delete endpoints require explicit confirmation:

```typescript
// DELETE /api/v1/workers/:id
app.delete('/workers/:id', async (c) => {
  const { confirm } = await c.req.json()
  
  if (confirm !== 'DELETE') {
    return c.json({ 
      error: 'Confirmation required. Send { "confirm": "DELETE" }' 
    }, 400)
  }
  
  await workerRepo.delete(workerId)
  return c.json({ success: true })
})
```

### Frontend

All delete actions use confirmation dialogs with clear warnings:

```tsx
const handleDelete = async () => {
  const confirmed = await confirmDialog({
    title: 'Delete Worker?',
    message: `This will permanently delete ${worker.name}. This action cannot be undone.`,
    confirmText: 'Delete Permanently',
    variant: 'destructive'
  })
  
  if (confirmed) {
    await deleteWorker(worker.id, { confirm: 'DELETE' })
  }
}
```

## References

- [GDPR Article 17 - Right to Erasure](https://gdpr-info.eu/art-17-gdpr/)
- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- Migration: `supabase/migrations/20260124231200_mvp_schema.sql`
- Related ADR: [001-repository-pattern.md](./001-repository-pattern.md)

## Review Schedule

This decision should be reviewed if:
- We add user-generated content (notes, custom tasks)
- Compliance requirements change
- We need to support "archive" functionality
- Customer requests "undo delete" feature

**Next Review:** Q3 2026 (after 6 months of production use)
