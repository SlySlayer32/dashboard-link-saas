---
description: "Task breakdown for Worker Management feature implementation"
---

# Tasks: Worker Management

**Input**: Design documents from `/specs/001-worker-management/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api-endpoints.md, research.md, quickstart.md

**Tests**: Constitution requires 60-70% overall coverage (security-critical 90%, business logic 80%)

**Organization**: Tasks grouped by user story to enable independent implementation and testing

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and database schema

- [X] T001 Create database migration file `supabase/migrations/20260311000000_add_worker_soft_delete.sql` with: deleted_at TIMESTAMPTZ column, idx_workers_org_active partial index, idx_workers_phone_org_active unique partial index, check_phone_e164 constraint, update_updated_at_column trigger function and trigger
- [X] T002 Run migration to apply schema changes to workers table using `pnpm db:migrate`
- [X] T003 [P] Update Worker interface in `packages/shared/src/types/worker.ts` to include deletedAt: string | null field
- [X] T004 [P] Add CreateWorkerRequest, UpdateWorkerRequest, WorkerListResponse, WorkerResponse interfaces to `packages/shared/src/types/worker.ts`
- [X] T005 [P] Install libphonenumber-js if not already present in `apps/api/package.json`
- [X] T006 [P] Verify environment variables: Create `.env` file with VITE_API_URL for admin app and DATABASE_URL for API

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Create phone validation utility function formatAustralianPhone in `packages/shared/src/validators/worker.ts` using libphonenumber-js for E.164 format conversion and mobile type validation
- [X] T008 [P] Create Zod validation schemas in `packages/shared/src/validators/worker.ts` for CreateWorkerRequest (name: 1-255 chars, phone: AU mobile regex) and UpdateWorkerRequest (both optional)
- [X] T009 [P] Add toWorker and toWorkerRow transform functions in `packages/database/src/types/worker.ts` for snake_case to camelCase conversion
- [X] T010 Update WorkerRepository in `packages/database/src/repositories/WorkerRepository.ts` to add softDelete method that sets deletedAt to NOW()
- [X] T011 [P] Update WorkerRepository in `packages/database/src/repositories/WorkerRepository.ts` to add findByPhoneActive method (filters deletedAt IS NULL)
- [X] T012 Update WorkerRepository in `packages/database/src/repositories/WorkerRepository.ts` to modify findByOrganizationId to filter out deleted workers (WHERE deletedAt IS NULL)
- [X] T013 Update WorkerRepository transformFromDB method in `packages/database/src/repositories/WorkerRepository.ts` to include deletedAt field mapping from deleted_at
- [X] T014 [P] Verify tenant middleware exists in `apps/api/src/middleware/tenant.ts` that sets app.tenant_id from JWT organization_id claim
- [X] T015 [P] Verify auth middleware exists in `apps/api/src/middleware/auth.ts` that validates JWT and extracts user/org claims
- [X] T016 [P] Verify error handler exists in `apps/api/src/middleware/error.ts` for consistent error response format with error field and optional details array
- [X] T017 [P] Verify CORS middleware is configured in `apps/api/src/index.ts` or main app setup
- [X] T018 [P] Setup TanStack Query QueryClient provider in `apps/admin/src/main.tsx` or App.tsx with default options
- [X] T019 [P] Setup react-hot-toast Toaster component in `apps/admin/src/main.tsx` or App.tsx for toast notifications

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Add New Worker (Priority: P1) 🎯 MVP

**Goal**: Enable managers to add field workers with name and AU mobile phone validation

**Independent Test**: Create a worker with name "John Smith" and phone "0412 345 678", verify worker appears in system with normalized phone +61412345678

### Implementation for User Story 1

- [X] T020 [P] [US1] Update WorkerService.createWorker in `apps/api/src/services/WorkerService.ts` to validate phone format using formatAustralianPhone utility
- [X] T021 [US1] Update WorkerService.createWorker in `apps/api/src/services/WorkerService.ts` to check for duplicate active workers using findByPhoneActive before creating
- [X] T022 [US1] Update WorkerService.createWorker in `apps/api/src/services/WorkerService.ts` to normalize phone to E.164 format and trim name before storage
- [X] T023 [US1] Update WorkerService.createWorker in `apps/api/src/services/WorkerService.ts` to handle names with special characters (apostrophes, hyphens, unicode) correctly
- [X] T024 [US1] Create POST /api/v1/workers endpoint in `apps/api/src/routes/workers.routes.ts` with Zod validation for name (1-255 chars) and phone (AU mobile)
- [X] T025 [US1] Add error handling in POST endpoint for duplicate phone (409 Conflict), validation errors (400 Bad Request), and unauthorized (401)
- [X] T026 [US1] Add structured logging in WorkerService.createWorker with fields: operation="create_worker", duration_ms, success, organization_id, worker_id, error_type (if failed)
- [X] T027 [P] [US1] Create API client module `apps/admin/src/lib/api/workers.ts` with axios instance and createWorker function
- [X] T028 [P] [US1] Create useWorkerMutations hook in `apps/admin/src/hooks/useWorkers.ts` with createWorker mutation, query invalidation, and toast notifications
- [X] T029 [US1] Create WorkerForm component in `apps/admin/src/components/workers/WorkerForm.tsx` with React Hook Form, Zod resolver, and form state management
- [X] T030 [US1] Add phone input field to WorkerForm with AU mobile format validation (04XX XXX XXX or 0412345678 patterns) and placeholder "0412 345 678"
- [X] T031 [US1] Add name input field to WorkerForm with 1-255 character validation, trimming, and support for special characters
- [X] T032 [US1] Add inline validation error display in WorkerForm that shows field-specific errors and preserves user input on validation failure (FR-020)
- [X] T033 [US1] Connect WorkerForm submit handler to createWorker mutation with loading state, success toast, error toast, and form reset on success

**Checkpoint**: At this point, User Story 1 should be fully functional - managers can add workers with phone validation

---

## Phase 4: User Story 2 - View Worker List (Priority: P2)

**Goal**: Enable managers to see all their field workers in one place with multi-tenant isolation

**Independent Test**: Add 3 workers to Org A, verify all 3 appear in list and workers from Org B are not visible

### Implementation for User Story 2

- [ ] T034 [P] [US2] Create GET /api/v1/workers endpoint in `apps/api/src/routes/workers.routes.ts` that calls WorkerService.getWorkers with organization_id from tenant context
- [ ] T035 [US2] Verify WorkerService.getWorkers in `apps/api/src/services/WorkerService.ts` uses findByOrganizationId (already filters deleted workers via deletedAt IS NULL)
- [ ] T036 [US2] Add structured logging in WorkerService.getWorkers with fields: operation="list_workers", duration_ms, success, organization_id, worker_count
- [ ] T037 [P] [US2] Add listWorkers function to API client in `apps/admin/src/lib/api/workers.ts` that returns WorkerListResponse
- [ ] T038 [P] [US2] Create useWorkers hook in `apps/admin/src/hooks/useWorkers.ts` with TanStack Query for fetching worker list with queryKey ['workers']
- [ ] T039 [US2] Create phone formatting utility function formatPhoneDisplay in `apps/admin/src/lib/utils/phone.ts` to convert +61412345678 to "04XX XXX XXX" display format
- [ ] T040 [US2] Create WorkerCard component in `apps/admin/src/components/workers/WorkerCard.tsx` to display worker name and formatted phone number
- [ ] T041 [US2] Create WorkerList component in `apps/admin/src/components/workers/WorkerList.tsx` that maps workers array to WorkerCard components with grid layout
- [ ] T042 [US2] Add empty state to WorkerList component with message "No workers yet. Add your first worker to get started." and optional CTA
- [ ] T043 [US2] Add loading state to WorkerList component while useWorkers query is fetching (skeleton or spinner)
- [ ] T044 [US2] Add error state to WorkerList component for failed queries with retry option
- [ ] T045 [US2] Add inactive worker indicator to WorkerCard component: display "Inactive" badge when deletedAt is not null (FR-012)
- [ ] T046 [US2] Create WorkersPage in `apps/admin/src/pages/WorkersPage.tsx` that renders WorkerForm and WorkerList in responsive grid layout

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - managers can add and view workers

---

## Phase 5: User Story 3 - Edit Worker Details (Priority: P3)

**Goal**: Enable managers to update worker name or phone number when details change

**Independent Test**: Edit existing worker's phone from "0412 345 678" to "0423 456 789", verify change persists and SMS would go to new number

### Implementation for User Story 3

- [ ] T047 [P] [US3] Create GET /api/v1/workers/:id endpoint in `apps/api/src/routes/workers.routes.ts` to fetch single worker with tenant isolation
- [ ] T048 [P] [US3] Update WorkerService.getWorkerById in `apps/api/src/services/WorkerService.ts` to verify worker belongs to organization and is not deleted
- [ ] T049 [P] [US3] Update WorkerService.updateWorker in `apps/api/src/services/WorkerService.ts` to validate phone format using formatAustralianPhone if phone is being updated
- [ ] T050 [US3] Update WorkerService.updateWorker in `apps/api/src/services/WorkerService.ts` to check for duplicate phone on different active worker if phone is being updated
- [ ] T051 [US3] Update WorkerService.updateWorker in `apps/api/src/services/WorkerService.ts` to normalize phone to E.164 format and trim name if being updated
- [ ] T052 [US3] Update WorkerService.updateWorker in `apps/api/src/services/WorkerService.ts` to implement last-write-wins: check updated_at matches expected value before UPDATE, return 409 Conflict with message "Worker was updated by another user. Please refresh and try again." if mismatch (NFR-005, FR-019)
- [ ] T053 [US3] Create PUT /api/v1/workers/:id endpoint in `apps/api/src/routes/workers.routes.ts` with Zod validation for optional name (1-255 chars) and phone (AU mobile)
- [ ] T054 [US3] Add error handling in PUT endpoint for not found (404), duplicate phone (409), validation errors (400), and unauthorized (401)
- [ ] T055 [US3] Add structured logging in WorkerService.updateWorker with fields: operation="update_worker", duration_ms, success, organization_id, worker_id, error_type (if failed)
- [ ] T056 [P] [US3] Add getWorker and updateWorker functions to API client in `apps/admin/src/lib/api/workers.ts`
- [ ] T057 [P] [US3] Add updateWorker mutation to useWorkerMutations hook in `apps/admin/src/hooks/useWorkers.ts` with query invalidation
- [ ] T058 [US3] Add edit mode state (workerId, isEditMode) to WorkerForm component in `apps/admin/src/components/workers/WorkerForm.tsx`
- [ ] T059 [US3] Update WorkerForm to populate fields with existing worker data when in edit mode using getWorker or passed worker prop
- [ ] T060 [US3] Update WorkerForm submit handler to handle 409 Conflict error by showing toast "Worker was updated by another user. Please refresh and try again." and reloading worker data to call updateWorker mutation when in edit mode instead of createWorker
- [ ] T061 [US3] Add Edit button to WorkerCard component in `apps/admin/src/components/workers/WorkerCard.tsx` using Lucide Edit icon
- [ ] T062 [US3] Connect Edit button click to populate WorkerForm with worker data and switch to edit mode (pass worker to form or set workerId)

**Checkpoint**: All user stories 1-3 should now be independently functional - full CRUD except delete

---

## Phase 6: User Story 4 - Soft Delete Worker (Priority: P4)

**Goal**: Enable managers to remove inactive workers while preserving historical SMS logs and access records

**Independent Test**: Soft delete a worker, verify they don't appear in active list but historical data remains accessible

### Implementation for User Story 4

- [ ] T063 [P] [US4] Update WorkerService.deleteWorker in `apps/api/src/services/WorkerService.ts` to call workerRepo.softDelete instead of hard delete
- [ ] T064 [US4] Add verification in WorkerService.deleteWorker that worker exists and belongs to organization before soft deleting
- [ ] T065 [US4] Add structured logging in WorkerService.deleteWorker with fields: operation="delete_worker", duration_ms, success, organization_id, worker_id, error_type (if failed)
- [ ] T066 [US4] Create DELETE /api/v1/workers/:id endpoint in `apps/api/src/routes/workers.routes.ts` that calls WorkerService.deleteWorker with tenant context
- [ ] T067 [US4] Add error handling in DELETE endpoint for not found (404), unauthorized (401), and return success message with 200 OK
- [ ] T068 [P] [US4] Add deleteWorker function to API client in `apps/admin/src/lib/api/workers.ts`
- [ ] T069 [P] [US4] Add deleteWorker mutation to useWorkerMutations hook in `apps/admin/src/hooks/useWorkers.ts` with query invalidation and toast notifications
- [ ] T070 [US4] Create DeleteWorkerDialog component in `apps/admin/src/components/workers/DeleteWorkerDialog.tsx` with shadcn/ui Dialog or AlertDialog
- [ ] T071 [US4] Add warning text to DeleteWorkerDialog: "Delete this worker? Historical data will be preserved." with worker name display
- [ ] T072 [US4] Add Delete button to WorkerCard component using Lucide Trash2 icon with hover state
- [ ] T073 [US4] Connect Delete button to open DeleteWorkerDialog with worker context (id and name)
- [ ] T074 [US4] Connect DeleteWorkerDialog confirm action to deleteWorker mutation with loading state during deletion

**Checkpoint**: All user stories should now be independently functional - complete worker management CRUD with soft delete

---

## Phase 7: Testing (Constitution Requirement)

**Purpose**: Meet constitution testing standards (60-70% overall, 80% business logic, 90% security-critical)

### Unit Tests - Repository Layer

- [ ] T075 [P] Create WorkerRepository unit tests in `packages/database/src/__tests__/WorkerRepository.test.ts` for findByOrganizationId (filters deleted workers), findByPhoneActive (active workers only), softDelete (sets deletedAt), transformFromDB (includes deletedAt field)

### Unit Tests - Service Layer (Business Logic - 80% target)

- [ ] T076 [P] Create WorkerService.createWorker unit tests in `apps/api/src/__tests__/unit/WorkerService.test.ts` for: phone validation (E.164 format), phone normalization (04XX to +614XX), duplicate active worker prevention, name trimming, special character handling, structured logging
- [ ] T077 [P] Create WorkerService.updateWorker unit tests for: phone validation on update, duplicate phone check (different worker), last-write-wins conflict detection (409 when updated_at mismatch), name trimming, structured logging
- [ ] T078 [P] Create WorkerService.deleteWorker unit tests for: soft delete (sets deletedAt), worker existence check, organization ownership verification, structured logging
- [ ] T079 [P] Create WorkerService.getWorkers unit tests for: filters deleted workers (deletedAt IS NULL), tenant scoping, structured logging

### Integration Tests - API Endpoints (70% target)

- [ ] T080 [P] Create POST /api/v1/workers integration tests in `apps/api/src/__tests__/integration/workers.test.ts` for: successful creation (201), phone validation errors (400), duplicate phone (409), unauthorized (401), tenant isolation (cannot create in other org)
- [ ] T081 [P] Create GET /api/v1/workers integration tests for: list active workers (200), exclude deleted workers, tenant isolation (only see own org), empty list handling
- [ ] T082 [P] Create PUT /api/v1/workers/:id integration tests for: successful update (200), phone validation errors (400), duplicate phone (409), not found (404), concurrent edit conflict (409), tenant isolation (cannot update other org)
- [ ] T083 [P] Create DELETE /api/v1/workers/:id integration tests for: successful soft delete (200), not found (404), tenant isolation (cannot delete other org), verify deletedAt set, verify excluded from active queries

### Security-Critical Tests (Multi-tenant Isolation - 90% target)

- [ ] T084 [P] Create multi-tenant isolation tests in `apps/api/src/__tests__/integration/tenant-isolation.test.ts` for: Org A cannot list Org B workers, Org A cannot get Org B worker by ID, Org A cannot create worker in Org B, Org A cannot update Org B worker, Org A cannot delete Org B worker, RLS policy enforcement at database level
- [ ] T085 [P] Create phone validation tests in `packages/shared/src/__tests__/validators/worker.test.ts` for: E.164 format validation, AU mobile type verification, format normalization (spaces, dashes, +61 prefix), invalid formats rejected, international numbers rejected

### Frontend Component Tests

- [ ] T086 [P] Create WorkerForm component tests in `apps/admin/src/__tests__/workers/WorkerForm.test.tsx` for: inline validation errors, input preservation on error, phone format validation, name length validation, successful submission, edit mode population
- [ ] T087 [P] Create WorkerList component tests for: renders worker cards, empty state display, loading state, error state with retry, inactive badge for deleted workers (FR-012)

### End-to-End Validation Tests

- [ ] T088 [P] Test phone number format variations: "0412345678", "0412 345 678", "0412-345-678", "+61412345678" all normalize to +61412345678
- [ ] T089 [P] Test duplicate phone number prevention for active workers across create and update operations (FR-016)
- [ ] T090 [P] Test phone number reuse from soft deleted worker (should allow new worker with same phone, creates new record) (FR-016)
- [ ] T091 [P] Test soft delete preserves historical data: verify SMS logs, access logs, dashboard tokens remain queryable after worker deletion (FR-010)
- [ ] T092 [P] Test name validation: 1-255 characters, special characters (apostrophes, hyphens, unicode), trimming (FR-015, FR-018)
- [ ] T093 [P] Test inline validation errors preserve user input and display field-specific messages (FR-020)
- [ ] T094 [P] Test concurrent edit scenario: two users edit same worker, second update receives 409 Conflict, user sees "Worker was updated by another user. Please refresh and try again." message

**Checkpoint**: All tests passing, coverage targets met (60-70% overall, 80% business logic, 90% security-critical)

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T095 [P] Register workers routes in `apps/api/src/v1.ts` with app.route('/workers', workersRoutes) after auth and tenant middleware
- [ ] T096 [P] Verify database indexes exist and are being used: idx_workers_org_active, idx_workers_phone_org_active (check with EXPLAIN ANALYZE)
- [ ] T097 [P] Verify RLS policy "tenant_isolation" is enabled on workers table and enforces organization_id = current_setting('app.tenant_id')::uuid
- [ ] T098 [P] Add WorkersPage route to admin app router in `apps/admin/src/App.tsx` or routing config file
- [ ] T099 [P] Verify all API endpoints respond within 500ms p95 latency target (NFR-001) using structured logs duration_ms field
- [ ] T100 [P] Add rate limiting middleware (100 req/min per organization) if not already present in API setup (contracts requirement)
- [ ] T101 Code cleanup: Remove any unused imports, ensure consistent error handling across all endpoints, verify all errors follow standard format
- [ ] T102 [P] Verify all API endpoints emit structured JSON logs with required fields: operation, duration_ms, success, error_type, organization_id, worker_id (NFR-003, NFR-004)
- [ ] T103 [P] Verify API endpoints match contracts/api-endpoints.md: response schemas, status codes, error formats, validation rules, rate limits (100 req/min), authentication requirements
- [ ] T104 Verify quickstart.md steps work end-to-end from migration to UI (manual validation)
- [ ] T105 [P] Update documentation if any implementation details differ from plan.md or contracts/api-endpoints.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Testing (Phase 7)**: Can run in parallel with user stories (test-driven development) or after implementation
- **Polish (Phase 8)**: Depends on all user stories and tests being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories (independent)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Reuses components from US1 and US2 but independently testable
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Reuses components from US2 but independently testable

### Within Each User Story

- Backend tasks (service, routes) before frontend tasks (API client, hooks, components)
- API client and hooks can run in parallel (marked [P])
- Components build on each other: Form/Card → List → Page
- Each story should be independently completable and testable

### Parallel Opportunities

- **Phase 1**: T003 and T004 can run in parallel (different packages)
- **Phase 2**: T006, T008 can run in parallel with T007, T009, T010 (different concerns)
- **Within each user story**: Backend and frontend API client/hooks can run in parallel (marked [P])
- **Across user stories**: Once Foundational completes, US1, US2, US3, US4 can all start in parallel (if team capacity allows)
- **Phase 7**: All test tasks marked [P] can run in parallel (unit, integration, security tests)
- **Phase 8**: Most polish tasks marked [P] can run in parallel (verification, cleanup, docs)

---

## Parallel Example: User Story 1

```bash
# After T010 completes, these can run in parallel:
Task T011: "Update WorkerService.createWorker validation"
Task T017: "Create API client function for createWorker"
Task T018: "Create useWorkerMutations hook"

# After T013 completes, these can run in parallel:
Task T014: "Create POST endpoint"
Task T019: "Create WorkerForm component"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T010) - CRITICAL
3. Complete Phase 3: User Story 1 (T011-T023)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

**Estimated Time**: 4-6 hours for MVP (US1 only)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (2 hours)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! - 2-3 hours)
3. Add User Story 2 → Test independently → Deploy/Demo (1.5 hours)
4. Add User Story 3 → Test independently → Deploy/Demo (2 hours)
5. Add User Story 4 → Test independently → Deploy/Demo (1 hour)
6. Polish phase → Final validation (1 hour)

**Total Estimated Time**: 8-10 hours (solo developer)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (2 hours)
2. Once Foundational is done:
   - Developer A: User Story 1 (T011-T023)
   - Developer B: User Story 2 (T024-T034)
   - Developer C: User Story 3 (T035-T048)
   - Developer D: User Story 4 (T049-T060)
3. Stories complete and integrate independently
4. Team completes Polish together (1 hour)

**Total Estimated Time**: 3-4 hours (4 developers working in parallel)

---

## Task Summary

- **Total Tasks**: 105
- **Setup Phase**: 6 tasks (T001-T006)
- **Foundational Phase**: 13 tasks (T007-T019) - BLOCKING
- **User Story 1 (P1)**: 14 tasks (T020-T033) - Add New Worker 🎯 MVP
- **User Story 2 (P2)**: 13 tasks (T034-T046) - View Worker List (includes inactive indicator)
- **User Story 3 (P3)**: 16 tasks (T047-T062) - Edit Worker Details
- **User Story 4 (P4)**: 12 tasks (T063-T074) - Soft Delete Worker
- **Testing Phase**: 20 tasks (T075-T094) - Constitution requirement (60-70% coverage)
- **Polish Phase**: 11 tasks (T095-T105)

### Tasks by Type

- **Database/Migration**: 3 tasks (T001-T002, T096-T097)
- **Type Definitions**: 2 tasks (T003-T004, T009)
- **Repository Layer**: 7 tasks (T010-T013, T035, T048, T075)
- **Service Layer**: 15 tasks (T020-T023, T026, T036, T049-T052, T055, T063-T065)
- **API Routes/Endpoints**: 10 tasks (T024-T025, T034, T047, T053-T054, T066-T067, T095)
- **Validation/Utils**: 3 tasks (T007-T008, T039)
- **Middleware/Infrastructure**: 6 tasks (T014-T019, T100)
- **Environment/Config**: 1 task (T006)
- **Frontend API Client**: 5 tasks (T027, T037, T056, T068)
- **Frontend Hooks**: 4 tasks (T028, T038, T057, T069)
- **Frontend Components**: 20 tasks (T029-T033, T040-T046, T058-T062, T070-T074)
- **Unit Tests**: 5 tasks (T075-T079) - Repository + Service layer
- **Integration Tests**: 4 tasks (T080-T083) - API endpoints
- **Security Tests**: 2 tasks (T084-T085) - Multi-tenant isolation + phone validation
- **Frontend Tests**: 2 tasks (T086-T087) - Component tests
- **E2E Validation**: 7 tasks (T088-T094) - End-to-end scenarios
- **Verification/Polish**: 5 tasks (T098-T099, T101-T103, T105)
- **Documentation**: 2 tasks (T104-T105)

### Parallelizable Tasks

- **Phase 1**: 4 tasks can run in parallel (T003-T006)
- **Phase 2**: 8 tasks can run in parallel (T008-T009, T011, T014-T019)
- **User Story 1**: 4 parallel opportunities (T020, T027-T028)
- **User Story 2**: 5 parallel opportunities (T034, T037-T038, T039-T040)
- **User Story 3**: 6 parallel opportunities (T047-T049, T056-T057)
- **User Story 4**: 4 parallel opportunities (T063, T068-T069)
- **Testing**: 18 tasks can run in parallel (T075-T092 all marked [P])
- **Polish**: 9 tasks can run in parallel (T095-T099, T102-T103, T105)

**Total Parallelizable**: 58 tasks marked [P]

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story] Description with file path`
- **Testing is REQUIRED** per constitution: 60-70% overall, 80% business logic, 90% security-critical
- Phase 7 (Testing) can run in parallel with implementation (TDD) or after
- Focus on implementation tasks that deliver working CRUD functionality
- Structured logging (NFR-003) integrated into service layer tasks
- Phone validation using libphonenumber-js per research.md decisions (validates E.164 compliance)
- Concurrent edit conflicts return 409 with user-friendly message (U1 resolved)
- Inactive worker indicator added to UI (G1 resolved)
- Contract verification task added (G3 resolved)
