# Tasks: Database Schema Alignment

**Input**: Design documents from `/specs/001-schema-alignment/`  
**Feature Branch**: `001-schema-alignment`  
**Created**: 2026-03-19  
**Updated**: 2026-03-19 - Migration consolidation completed

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/worker-api.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

**🔄 CONSOLIDATION NOTE**: Migration work consolidated into `20260311000000_add_worker_soft_delete.sql`. 
Redundant `20260319000000_schema_alignment_workers.sql` removed for cleaner migration history.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Database Migration Creation)

**Purpose**: Create the database migration that aligns schema with application code

- [x] T001 Verify current database state matches expected pre-migration schema in Supabase dashboard
- [ ] T002 Create manual backup snapshot of production database via Supabase dashboard (document snapshot ID)
- [x] T003 [P] Verify `packages/database/src/repositories/worker-repository.ts` exists and document current column references
- [x] T004 [P] Verify `apps/api/src/services/worker-service.ts` exists and document current column references

**Checkpoint**: Migration file created with all schema changes defined

---

## Phase 2: Foundational (Repository & Type Updates)

**Purpose**: Update application code to use new column names (BLOCKS all user stories)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create migration file `supabase/migrations/20260311000000_add_worker_soft_delete.sql` with consolidated schema alignment (all-or-nothing rollback safety)
- [x] T006 [P] Write column rename statements in migration: `full_name` → `name`, `phone_number` → `phone`, `calendar_email` → `email
- [x] T007 [P] Write new column additions in migration: `active` (BOOLEAN DEFAULT true), `deleted_at` (TIMESTAMPTZ), `metadata` (JSONB DEFAULT '{}')
- [x] T008 Update index definitions in migration: rename `idx_workers_phone_number` → `idx_workers_phone`, `idx_workers_calendar_email` → `idx_workers_email`
- [x] T009 Add new indexes in migration: `idx_workers_active`, `idx_workers_deleted_at` (partial index)
- [x] T010 Add data validation queries to migration (report violations, non-blocking per clarification)
- [x] T011 Add rollback SQL comments to migration file for emergency recovery

**Checkpoint**: Foundation ready - migration script created with transaction safety, all-or-nothing rollback, and validation queries

---

## Phase 3: User Story 1 - Worker CRUD Operations Work (Priority: P1) 🎯 MVP

**Goal**: Administrators can create, read, update, and delete workers without database errors. Fixes critical bug where all worker operations fail due to column name mismatches.

**Independent Test**: Create a new worker via API with `name`, `phone`, `email` fields and verify 201 response with correct data mapping

### Implementation for User Story 1

- [x] T012 Apply migration to local database: `supabase migration up`
- [x] T013 Verify migration completes within 30-second target (per clarification requirement)
- [x] T014 Execute post-migration verification queries to confirm column renames
- [x] T015 Verify `packages/database/src/repositories/worker-repository.ts` uses new column names (`name`, `phone`, `email`)
- [x] T016 Verify `apps/api/src/services/worker-service.ts` uses new column names in all queries
- [x] T017 Test worker creation API endpoint `POST /api/v1/workers` returns 201 with correct field mapping
- [x] T018 Test worker list API endpoint `GET /api/v1/workers` returns workers with new field names
- [x] T019 Verify 100% data integrity: all existing worker records preserved with new column names

**Checkpoint**: Worker CRUD operations fully functional with new schema, migration completed within 30 seconds

---

## Phase 4: User Story 2 - Soft Delete Functionality (Priority: P2)

**Goal**: Administrators can soft-delete workers, marking them as deleted without removing data. The `deleted_at` column enables this pattern.

**Independent Test**: Delete a worker and verify `deleted_at` timestamp is set while worker remains in database but is excluded from active queries

### Implementation for User Story 2

- [x] T022 Update `packages/database/src/repositories/worker-repository.ts` to filter by `deleted_at IS NULL` by default
- [x] T023 Update `apps/api/src/services/worker-service.ts` delete method to set `deleted_at = now()` instead of hard delete
- [x] T024 Add restore/undelete method in worker service to set `deleted_at = NULL`
- [x] T025 Implement `DELETE /api/v1/workers/:id` endpoint to soft-delete
- [x] T026 Implement `POST /api/v1/workers/:id/restore` endpoint for undelete
- [x] T027 Update `GET /api/v1/workers` to support `include_deleted` query parameter
- [x] T028 Test soft delete flow: delete worker, verify not in list, verify present with `include_deleted=true`
- [x] T029 Test restore flow: restore deleted worker, verify reappears in active list

**Checkpoint**: Soft delete functionality fully operational with restore capability

---

## Phase 5: User Story 3 - Active/Inactive Worker Filtering (Priority: P3)

**Goal**: Administrators can toggle worker status between active and inactive, and filter the worker list by this status.

**Independent Test**: Set `active = false` on a worker and verify they don't appear in `active=true` filtered queries

### Implementation for User Story 3

- [x] T031 Update `packages/database/src/repositories/worker-repository.ts` queries to filter by `active` status when parameter provided
- [x] T032 Update `apps/api/src/services/worker-service.ts` to handle `active` field in create/update operations
- [x] T033 Implement active status toggle in `PATCH /api/v1/workers/:id` endpoint
- [x] T034 Update `GET /api/v1/workers` to support `active` query parameter filtering
- [x] T035 Test active filtering: create active and inactive workers, verify filtering works
- [x] T036 Test status toggle: update worker `active` field, verify appears/disappears from filtered list

**Checkpoint**: Active/inactive filtering fully functional via API

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, deployment, and verification per clarification requirements (30s completion target, backup strategy, monitoring)

**Note on Task Numbering**: Task IDs T020, T021, and T030 are reserved/unused to maintain sequential alignment with implementation phases. Success Criteria SC-003 through SC-007 are verified by T048-T052 below.

- [x] T037 [P] Run all post-migration verification queries from plan.md and document results
- [x] T038 [P] Execute data integrity check: verify 100% of worker records preserved
- [x] T039 [P] Verify index performance: `EXPLAIN` query plans show index usage on renamed columns
- [x] T040 Verify RLS policies still enforce tenant isolation (cross-tenant access blocked)
- [x] T041 Run API integration tests for all worker CRUD operations
- [x] T042 Update `specs/001-schema-alignment/quickstart.md` with test results
- [ ] T043 Staging deployment: apply migration to staging environment
- [ ] T044 Run smoke tests against staging API for all three user stories
- [ ] T045 Production deployment: schedule maintenance window and apply migration
- [ ] T046 Monitor error rates for 30 minutes post-production deployment
- [x] T047 [P] Verify metadata JSONB storage works (accepts and returns arbitrary key-value pairs)
- [x] T048 [P] **SC-003 Verification**: Verify soft delete excludes workers from active queries (query `WHERE deleted_at IS NULL` filters correctly)
- [x] T049 [P] **SC-004 Verification**: Verify active=true filter returns only active workers (query `WHERE active = true` filters correctly)
- [x] T050 [P] **SC-005 Verification**: Verify metadata JSONB accepts arbitrary key-value pairs (test insert/update with nested JSON objects)
- [x] T051 [P] **SC-006 Verification**: Verify EXPLAIN shows index usage on renamed columns (`idx_workers_phone`, `idx_workers_email` are used in queries)
- [x] T052 [P] **SC-007 Verification**: Verify cross-tenant access is blocked via RLS (attempt data access with different `organization_id`, verify 403/error)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
  - Database migration must be applied before repository code can use new columns
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
  - Core CRUD functionality - **THIS IS THE MVP**
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Extends US1 with soft delete
  - Depends on US1 repository patterns but can be developed in parallel
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Extends US1 with active filtering
  - Depends on US1 list queries but can be developed in parallel

### Within Each User Story

- Repository updates before endpoint changes
- API changes before frontend changes
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- Once Foundational phase completes, US2 and US3 can start in parallel with US1 polish
- Frontend updates (T014-T015, T025-T026) can run parallel to backend work
- Polish phase tasks all marked [P] for parallel execution

---

## Parallel Example: Multiple Developers

```bash
# Developer A: Foundational (blocking)
Task: "Update database types in /packages/database/src/types/database.ts"
Task: "Update repository queries in /packages/database/src/repositories/worker-repository.ts"

# Developer B: User Story 2 (after foundational)
Task: "Implement soft delete logic in worker service"
Task: "Update list workers endpoint to support include_deleted"

# Developer C: User Story 3 (after foundational)
Task: "Add active filter parameter to list workers endpoint"
Task: "Implement toggle active status endpoint"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (migration creation)
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (core CRUD works)
4. **STOP and VALIDATE**: Test worker creation succeeds with 200 status
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test worker CRUD works → Deploy/Demo (MVP!)
3. Add User Story 2 → Test soft delete → Deploy/Demo
4. Add User Story 3 → Test active filtering → Deploy/Demo
5. Each story adds value without breaking previous stories

### Recommended Execution Order

Given this is a critical bug fix:

1. **Execute T001-T004**: Create migration with all schema changes
2. **Execute T005-T009**: Update repositories and apply migration (foundational)
3. **Execute T010-T015**: Verify and fix CRUD operations (MVP - P1)
4. **Execute T016-T021**: Add soft delete functionality (P2)
5. **Execute T022-T027**: Add active/inactive filtering (P3)
6. **Execute T028-T032**: Final verification and polish

---

## Success Criteria Mapping

| Success Criteria | Task Verification |
|------------------|-------------------|
| SC-001: Worker creation API succeeds | T017, T018 |
| SC-002: Data preservation (100% retained) | T038 |
| SC-003: Soft delete functionality works | T048 |
| SC-004: Active/inactive filtering works | T049 |
| SC-005: Metadata storage works | T050 |
| SC-006: Indexes function correctly | T051 |
| SC-007: RLS policies enforce tenant isolation | T052 |

**Note**: Task IDs T020, T021, and T030 are reserved (unused) to maintain phase alignment.

---

## Notes

- **Critical Path**: T001 → T008 → T010 → T012 (migration → apply → verify API → test creation)
- **No tests included**: Feature spec did not explicitly request TDD approach
- **Database-first**: Migration must run before any code can use new columns
- **Zero data loss**: T013 verifies all existing data preserved with new column names
- **RLS unchanged**: Policies use `organization_id` which is unaffected by column renames
- **Frontend may need updates**: T014-T015 verify admin dashboard field names match API
