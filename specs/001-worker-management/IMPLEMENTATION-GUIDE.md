# Implementation Guide: Worker Management Feature

**Status**: Ready for incremental implementation on existing codebase  
**Date**: 2026-03-11  
**Purpose**: Guide `/speckit.implement` to build on existing code rather than starting from scratch

---

## Existing Codebase Analysis

### ✅ What Already Exists

#### Database Layer
- **Workers table**: EXISTS in `20260124231200_mvp_schema.sql`
  - ⚠️ **Column mismatch**: Uses `full_name` (100 chars) instead of `name` (255 chars)
  - ⚠️ **Column mismatch**: Uses `phone_number` instead of `phone`
  - ❌ **Missing**: `deleted_at` column for soft delete
  - ❌ **Missing**: `active` boolean column
  - ❌ **Missing**: `metadata` JSONB column
  - ✅ Has: `organization_id`, `created_at`, `updated_at`, E.164 phone validation

#### Repository Layer
- **WorkerRepository**: EXISTS at `packages/database/src/repositories/WorkerRepository.ts`
  - ✅ Extends `BaseRepository` (constitution compliant)
  - ✅ Has: `findById`, `findMany`, `findOne`, `create`, `update`, `delete`
  - ✅ Has: `findByOrganizationId`, `findByPhone`, `findActiveWorkers`
  - ❌ **Missing**: `softDelete` method
  - ❌ **Missing**: `findByPhoneActive` method (filters deleted workers)
  - ⚠️ **Transform issue**: Maps to `name`/`phone` but DB has `full_name`/`phone_number`

#### Service Layer
- **WorkerService**: EXISTS at `apps/api/src/services/WorkerService.ts`
  - ✅ Uses repository pattern (constitution compliant)
  - ✅ Has: `getWorkers`, `getWorkerById`, `createWorker`, `updateWorker`, `deleteWorker`
  - ✅ Has: Phone validation with `formatAustralianPhone` utility
  - ❌ **Missing**: Duplicate phone check before create/update
  - ❌ **Missing**: Soft delete implementation (currently hard deletes)
  - ❌ **Missing**: Last-write-wins conflict detection (updated_at check)
  - ❌ **Missing**: Structured logging (NFR-003)

#### API Routes
- **workers.ts**: EXISTS at `apps/api/src/routes/workers.ts`
  - ✅ Has: GET /, GET /:id, POST /, PATCH /:id, DELETE /:id
  - ✅ Uses `authMiddleware` (constitution compliant)
  - ⚠️ **Method mismatch**: Uses PATCH instead of PUT (spec says PUT)
  - ❌ **Missing**: Zod validation schemas
  - ❌ **Missing**: 409 Conflict handling for duplicates
  - ❌ **Missing**: 409 Conflict handling for concurrent edits
  - ❌ **Missing**: Inline error format per FR-020

#### Frontend
- **Admin app**: EXISTS at `apps/admin/src/`
  - ✅ Has: React 18 + Vite setup
  - ✅ Has: Components, hooks, pages structure
  - ❌ **Missing**: Worker-specific components (WorkerForm, WorkerList, WorkerCard)
  - ❌ **Missing**: Worker API client
  - ❌ **Missing**: Worker hooks (useWorkers, useWorkerMutations)

---

## Implementation Strategy

### Phase 1: Database Schema Updates (MODIFY EXISTING)

**T001** - Update existing migration or create new migration:
- **Action**: Create `20260311000000_add_worker_soft_delete.sql`
- **Changes**:
  ```sql
  -- Rename columns to match spec
  ALTER TABLE workers RENAME COLUMN full_name TO name;
  ALTER TABLE workers RENAME COLUMN phone_number TO phone;
  
  -- Update name length constraint
  ALTER TABLE workers DROP CONSTRAINT workers_full_name_check;
  ALTER TABLE workers ADD CONSTRAINT workers_name_check CHECK (length(name) BETWEEN 1 AND 255);
  
  -- Add soft delete column
  ALTER TABLE workers ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
  
  -- Add active column (default true for existing workers)
  ALTER TABLE workers ADD COLUMN active BOOLEAN DEFAULT TRUE NOT NULL;
  
  -- Add metadata column
  ALTER TABLE workers ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  
  -- Add partial indexes for soft delete
  CREATE INDEX idx_workers_org_active ON workers(organization_id, deleted_at) WHERE deleted_at IS NULL;
  CREATE UNIQUE INDEX idx_workers_phone_org_active ON workers(phone, organization_id) WHERE deleted_at IS NULL;
  
  -- Drop old phone index, replace with partial index
  DROP INDEX IF EXISTS idx_workers_phone;
  ```

### Phase 2: Repository Layer (EXTEND EXISTING)

**T010-T013** - Update `WorkerRepository.ts`:
- **Action**: ADD methods, don't replace file
- **Add**:
  ```typescript
  async softDelete(id: string): Promise<void> {
    // Set deleted_at to NOW()
  }
  
  async findByPhoneActive(phone: string, organizationId: string): Promise<Worker | null> {
    // WHERE deleted_at IS NULL
  }
  ```
- **Modify**: `findByOrganizationId` to filter `deleted_at IS NULL`
- **Modify**: `transformFromDB` to include `deletedAt` field

### Phase 3: Service Layer (EXTEND EXISTING)

**T020-T026** - Update `WorkerService.ts`:
- **Action**: MODIFY existing methods, don't replace file
- **Modify `createWorker`**:
  - Add duplicate check using `findByPhoneActive`
  - Add structured logging
- **Modify `updateWorker`**:
  - Add duplicate phone check (different worker)
  - Add last-write-wins check (compare `updated_at`)
  - Return 409 if conflict
  - Add structured logging
- **Modify `deleteWorker`**:
  - Call `workerRepo.softDelete` instead of `delete`
  - Add structured logging

### Phase 4: API Routes (EXTEND EXISTING)

**T024-T025, T052-T054, T065-T066** - Update `workers.ts`:
- **Action**: MODIFY existing endpoints, don't replace file
- **Add**: Zod validation schemas at top of file
- **Modify POST /**:
  - Add Zod validation
  - Add 409 Conflict error handling
- **Change PATCH /:id to PUT /:id**:
  - Add Zod validation
  - Add 409 Conflict error handling (duplicate + concurrent edit)
- **Modify DELETE /:id**:
  - Update success message
  - Verify soft delete behavior

### Phase 5: Frontend (CREATE NEW)

**T027-T033, T037-T046, T055-T062, T067-T074** - Create new files:
- **Create**: `apps/admin/src/lib/api/workers.ts` (API client)
- **Create**: `apps/admin/src/hooks/useWorkers.ts` (TanStack Query hooks)
- **Create**: `apps/admin/src/components/workers/WorkerForm.tsx`
- **Create**: `apps/admin/src/components/workers/WorkerCard.tsx`
- **Create**: `apps/admin/src/components/workers/WorkerList.tsx`
- **Create**: `apps/admin/src/components/workers/DeleteWorkerDialog.tsx`
- **Create**: `apps/admin/src/pages/WorkersPage.tsx`
- **Create**: `apps/admin/src/lib/utils/phone.ts` (formatPhoneDisplay)

---

## Critical Implementation Notes

### 1. Database Column Mapping

**IMPORTANT**: The database uses `full_name` and `phone_number`, but the spec uses `name` and `phone`.

**Options**:
- **A) Rename columns** (T001 migration above) - RECOMMENDED
- **B) Update repository transforms** to map correctly

**Decision**: Use Option A (rename columns) to match spec and avoid confusion.

### 2. Soft Delete vs Hard Delete

**Current**: `WorkerService.deleteWorker` calls `workerRepo.delete` (hard delete)  
**Required**: Must call `workerRepo.softDelete` (sets `deleted_at`)

**Action**: 
- Add `softDelete` method to repository
- Update service to call `softDelete`
- Update all queries to filter `WHERE deleted_at IS NULL`

### 3. Duplicate Phone Validation

**Current**: No duplicate check  
**Required**: Prevent duplicate phone for active workers only

**Action**:
- Create `findByPhoneActive` method (filters deleted workers)
- Check before create and update
- Return 409 Conflict if duplicate found

### 4. Concurrent Edit Handling

**Current**: No conflict detection  
**Required**: Last-write-wins with 409 error

**Action**:
- Accept `updated_at` in update request
- Compare with DB `updated_at` before UPDATE
- Return 409 if mismatch with message: "Worker was updated by another user. Please refresh and try again."

### 5. Structured Logging

**Current**: Basic error logging  
**Required**: JSON logs with operation, duration_ms, success, error_type, organization_id, worker_id

**Action**: Add to all CRUD operations in service layer

---

## Task Execution Order

### Must Complete First (Blocking)
1. **T001-T002**: Database migration (schema changes)
2. **T007-T019**: Foundational utilities and middleware verification

### Can Build Incrementally
3. **User Story 1** (T020-T033): Add worker functionality
4. **User Story 2** (T034-T046): View worker list + inactive indicator
5. **User Story 3** (T047-T062): Edit worker + conflict handling
6. **User Story 4** (T063-T074): Soft delete worker

### After Implementation
7. **Phase 7** (T075-T094): Testing (can run in parallel with TDD)
8. **Phase 8** (T095-T105): Polish and verification

---

## Key Files to Modify

| File | Action | Tasks |
|------|--------|-------|
| `supabase/migrations/20260311000000_add_worker_soft_delete.sql` | CREATE | T001 |
| `packages/database/src/repositories/WorkerRepository.ts` | EXTEND | T010-T013 |
| `apps/api/src/services/WorkerService.ts` | MODIFY | T020-T026, T048-T051, T062-T064 |
| `apps/api/src/routes/workers.ts` | MODIFY | T024-T025, T052-T054, T065-T066 |
| `packages/shared/src/validators/worker.ts` | CREATE | T007-T008 |
| `apps/admin/src/lib/api/workers.ts` | CREATE | T027, T037, T055, T067 |
| `apps/admin/src/hooks/useWorkers.ts` | CREATE | T028, T038, T056, T068 |
| `apps/admin/src/components/workers/*` | CREATE | T029-T033, T040-T046, T057-T062, T069-T074 |
| `apps/admin/src/pages/WorkersPage.tsx` | CREATE | T046 |

---

## Testing Verification

After implementation, verify:
- ✅ Workers table has `deleted_at`, `active`, `metadata` columns
- ✅ Column names are `name` (255 chars) and `phone` (not `full_name`/`phone_number`)
- ✅ Soft delete sets `deleted_at`, doesn't remove row
- ✅ Active queries filter `WHERE deleted_at IS NULL`
- ✅ Duplicate phone check prevents active worker duplicates
- ✅ Concurrent edit returns 409 with user-friendly message
- ✅ Structured logs emitted for all CRUD operations
- ✅ Inactive badge shows on soft-deleted workers in UI
- ✅ API endpoints match contracts (PUT not PATCH, correct error codes)

---

**Ready for `/speckit.implement`** - This guide ensures incremental building on existing code.
