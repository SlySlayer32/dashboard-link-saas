# Review Fix Tasks — 2026-03-15

**Generated from**: Code review of Worker Management feature (172 files)  
**Review scope**: Most recent commit on main branch  
**Status**: ✅ ALL TASKS COMPLETED (0 CRITICAL, 2 HIGH, 5 MEDIUM, 1 LOW)

---

## HIGH Priority

### [REVIEW-2026-03-15-phone-dup] Remove duplicate phone validation

**Severity**: HIGH  
**Type**: DUPLICATION  
**Location**: `packages/shared/src/validators/worker.validator.ts`

**Issue**: Two separate phone validation implementations exist:
- `validateAndFormatPhone()` in `worker.validator.ts`
- `formatAustralianPhone()` in `utils/phone.ts`

Both use libphonenumber-js but with different interfaces, creating confusion.

**Action**:
1. Remove `validateAndFormatPhone()` function from `packages/shared/src/validators/worker.validator.ts`
2. Update the Zod schema `phoneNumberSchema` to import and use `formatAustralianPhone` from `utils/phone.ts`
3. Update the refine function to call `formatAustralianPhone(phone)` instead of local implementation

**Canonical path**: Keep `packages/shared/src/utils/phone.ts` (already used by WorkerService)

---

### [REVIEW-2026-03-15-service-bypass] Move query logic to service layer

**Severity**: HIGH  
**Type**: VIOLATION (Constitution Section I)  
**Location**: `apps/api/src/routes/workers.ts:L70-88`

**Issue**: Direct repository calls in route handler for `include_deleted` logic bypasses service layer. Violates Constitution requirement that "Business logic in services".

**Action**:
1. Add methods to `WorkerService`:
   - `getWorkersIncludingDeleted(organizationId: string, limit?: number): Promise<Worker[]>`
   - `searchWorkersIncludingDeleted(organizationId: string, query: string, limit?: number): Promise<Worker[]>`
2. Update route handler to call service methods instead of direct repository access
3. Keep routes thin — only handle HTTP concerns

---

## MEDIUM Priority

### [REVIEW-2026-03-15-schema-fields] Update schema field names to match database

**Severity**: MEDIUM  
**Type**: DUPLICATION  
**Location**: `packages/shared/src/validators/worker.validator.ts:L18-32`

**Issue**: Schema uses `full_name`, `phone_number`, `calendar_email` but migration renamed columns to `name`, `phone`. Schema field names don't match database schema or spec terminology.

**Action**:
1. Update `CreateWorkerSchema` fields:
   - `full_name` → `name`
   - `phone_number` → `phone`
   - `calendar_email` → `email` (optional)
2. Update `UpdateWorkerSchema` fields to match
3. Update any API contracts or frontend code expecting old field names

**Note**: Migration `20260311000000_add_worker_soft_delete.sql` already renamed columns in database.

---

### [REVIEW-2026-03-15-orphan-endpoints] Document or remove orphan endpoints

**Severity**: MEDIUM  
**Type**: ORPHAN  
**Location**: `apps/api/src/routes/workers.ts:L318-399`

**Issue**: Four endpoints exist with no spec backing:
1. `GET /search/:query` (L318-337)
2. `GET /active/list` (L340-357)
3. `POST /:id/activate` (L360-378)
4. `POST /:id/deactivate` (L381-399)

No spec requirements or tasks backing these endpoints.

**Action** (choose one):
- **Option A**: Add to `specs/001-worker-management/spec.md` as "Enhanced Functionality" section if valuable for MVP
- **Option B**: Remove from codebase to maintain strict spec-code alignment

**Decision needed**: Consult with product owner on whether these are needed for MVP.

---

### [REVIEW-2026-03-15-repo-create] Implement repository create() method

**Severity**: MEDIUM  
**Type**: BUG  
**Location**: `packages/database/src/repositories/WorkerRepository.ts:L51-68`

**Issue**: Repository `create()` method uses `.where()` instead of `.insert()` — placeholder implementation that won't actually create records. Comment on L58 says "In a real implementation, you'd use insert()".

**Action**:
1. Replace placeholder with actual insert implementation:
```typescript
const [created] = await this.adapter
  .query(this.tableName)
  .insert(insertTransformed)
  .returning('*')
return this.transformFromDB(created)
```
2. Remove placeholder comment
3. Test with integration tests

**Blocker**: Worker creation will not function until this is implemented.

---

### [REVIEW-2026-03-15-repo-update] Implement repository update() method

**Severity**: MEDIUM  
**Type**: BUG  
**Location**: `packages/database/src/repositories/WorkerRepository.ts:L71-88`

**Issue**: Repository `update()` method uses `.where().first()` instead of actual update operation — placeholder implementation.

**Action**:
1. Replace placeholder with actual update implementation:
```typescript
const [updated] = await this.adapter
  .query(this.tableName)
  .update(transformedData)
  .where({ id })
  .returning('*')
return this.transformFromDB(updated)
```
2. Remove placeholder comment (L79)
3. Test with integration tests

**Blocker**: Worker updates will not function until this is implemented.

---

### [REVIEW-2026-03-15-repo-delete] Implement repository delete() method

**Severity**: MEDIUM  
**Type**: BUG  
**Location**: `packages/database/src/repositories/WorkerRepository.ts:L91-99`

**Issue**: Repository `delete()` method uses `.where().first()` instead of actual delete operation — placeholder implementation.

**Action**:
1. Replace placeholder with actual delete implementation:
```typescript
await this.adapter
  .query(this.tableName)
  .delete()
  .where({ id })
```
2. Remove placeholder comment (L95)
3. Test with integration tests

**Note**: This is for hard delete. Soft delete is correctly implemented in `softDelete()` method (L116-123).

---

## LOW Priority

### [REVIEW-2026-03-15-name-length] Update name length constraint in schema

**Severity**: LOW  
**Type**: VIOLATION (Spec FR-018)  
**Location**: `packages/shared/src/validators/worker.validator.ts:L22`

**Issue**: Name length constraint is 100 characters in validator but spec FR-018 and migration require 255 characters. Inconsistency between validation and database constraint.

**Action**:
1. Update `CreateWorkerSchema` line 22:
   - Change `.max(100, 'Name must be less than 100 characters')` 
   - To `.max(255, 'Name must be 255 characters or less')`
2. Update `UpdateWorkerSchema` line 29 to match

**Reference**: 
- Spec FR-018: "Name field limited to 255 characters"
- Migration line 10: `CHECK (length(name) BETWEEN 1 AND 255)`

---

## Summary

**Total tasks**: 8  
**Estimated effort**: 4-6 hours  
**Blockers**: 3 repository method implementations (create, update, delete) must be completed before Worker CRUD is functional

**Priority order**:
1. Repository implementations (MEDIUM but blocking)
2. Phone validation duplication (HIGH)
3. Service layer bypass (HIGH)
4. Schema field naming (MEDIUM)
5. Orphan endpoints decision (MEDIUM)
6. Name length constraint (LOW)
