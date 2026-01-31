# Tasks: CleanConnect SMS Dashboard MVP

**Input**: Design documents from `/specs/001-sms-dashboard-mvp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Tests**: Not explicitly requested in specification - tests will be added during implementation phases per constitutional requirements (90% API, 85% React, 95% utils coverage).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions
- **Acceptance**: Specific, verifiable criteria that define "done"

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and monorepo structure

- [X] T001 Initialize Turborepo monorepo with pnpm workspaces in root directory (Package namespace: @dashboard-link/* not @repo/*)
- [X] T002 [P] Create root package.json with Turborepo and TypeScript dependencies
- [X] T003 [P] Create turbo.json with pipeline configuration for build, dev, test, lint
- [X] T004 [P] Create pnpm-workspace.yaml defining apps/* and packages/* workspaces
- [X] T005 [P] Create tsconfig.base.json with strict mode and shared compiler options
- [X] T006 [P] Create .gitignore for node_modules, dist, .env, and build artifacts
- [X] T007 [P] Setup Prettier and ESLint configurations in root with simple-git-hooks
- [X] T008 Initialize Supabase CLI and create supabase/ directory structure
- [X] T009 [P] Create apps/admin/ directory with Vite + React + TypeScript scaffold
- [X] T010 [P] Create apps/worker/ directory with Vite + React + TypeScript scaffold
- [X] T011 [P] Create apps/api/ directory with Hono.js + TypeScript scaffold
- [X] T012 [P] Create packages/shared/ directory for shared types and utilities
- [X] T013 [P] Create packages/ui/ directory for shadcn/ui components
- [X] T014 [P] Create packages/plugins/ directory for adapter system

**Checkpoint**: Monorepo structure complete, all apps and packages scaffold in place

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Foundation

- [X] T015 Create migration 001_initial_schema.sql in supabase/migrations/ with organizations, users, workers, data_sources, dashboard_tokens, sms_logs, access_logs tables
- [X] T016 Create migration 002_rls_policies.sql in supabase/migrations/ with Row Level Security policies for tenant isolation
- [X] T017 Create migration 003_indexes.sql in supabase/migrations/ with performance indexes on foreign keys and query columns
- [X] T018 Create seed.sql in supabase/ with development test data (1 org, 2 users, 5 workers)
- [X] T019 Run supabase db push to apply migrations to local Supabase instance

### Shared Types Package

- [X] T020 [P] Create packages/shared/src/types/organization.ts with Organization interface
- [X] T021 [P] Create packages/shared/src/types/user.ts with User (admin) interface
- [X] T022 [P] Create packages/shared/src/types/worker.ts with Worker and CreateWorkerDTO interfaces
- [X] T023 [P] Create packages/shared/src/types/data-source.ts with DataSource interface
- [X] T024 [P] Create packages/shared/src/types/token.ts with DashboardToken interface
- [X] T025 [P] Create packages/shared/src/types/sms.ts with SMSLog interface
- [X] T026 [P] Create packages/shared/src/types/schedule.ts with ScheduleItem interface
- [X] T027 [P] Create packages/shared/src/constants/index.ts with SMS limits, token expiry defaults
- [X] T028 [P] Create packages/shared/src/validators/worker.validator.ts with Zod schemas for worker validation
- [X] T029 Create packages/shared/package.json and configure build/exports

### Plugin Adapter Base

- [X] T030 [P] Create packages/plugins/src/base/adapter.interface.ts with IAdapter and IScheduleProvider interfaces
- [X] T031 [P] Create packages/plugins/src/base/adapter.types.ts with AdapterConfig, HealthStatus, TokenSet types
- [X] T032 Create packages/plugins/package.json and configure build/exports

### API Core Infrastructure

- [X] T033 Create apps/api/src/lib/db.ts with Supabase client initialization
- [X] T034 [P] Create apps/api/src/lib/logger.ts with JSON structured logging
- [X] T035 [P] Create apps/api/src/middleware/error-handler.ts with standardized error responses
- [X] T036 Create apps/api/src/middleware/auth.middleware.ts with JWT validation via Supabase Auth
- [X] T037 Create apps/api/src/middleware/tenant.middleware.ts with RLS context setting (FIXED: Added setTenantContext/clearTenantContext calls)
- [X] T038 Update apps/api/src/index.ts to use new middleware stack
- [X] T039 Update apps/api/package.json with @supabase/supabase-js dependency, and development scripts

**Checkpoint**: Foundation ready - database schema deployed, shared types available, API infrastructure configured. User story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Admin Onboards Organization and Workers (Priority: P1) 🎯 MVP

**Goal**: Enable admin registration, organization setup, and worker management with full tenant isolation

**Independent Test**: Create admin account, set up organization, add multiple workers with phone numbers, verify workers are stored with proper organization isolation (RLS verification)

### Implementation for User Story 1

- [X] T040 [P] [US1] Create apps/api/src/services/auth.service.ts with register, login, getCurrentUser methods using Supabase Auth

- [X] T041 [P] [US1] Create apps/api/src/services/organization.service.ts with get, update methods (Note: Organization creation happens in auth.service.ts during registration - T040)
  - Acceptance:
    - [X] File exists at apps/api/src/services/organization.service.ts
    - [X] getOrganization(orgId) method implemented with real Supabase query
    - [X] updateOrganization(orgId, data) method implemented with real Supabase query
    - [X] Methods use Supabase client from apps/api/src/lib/db.ts
    - [X] Error handling with typed errors (no empty catch blocks)
    - [X] TypeScript strict mode (no `any` types)
    - [X] Exported and importable by routes

- [X] T042 [P] [US1] Create apps/api/src/services/worker.service.ts with CRUD methods (getWorkers, createWorker, updateWorker, deleteWorker). Implementation: Use direct Supabase queries for MVP. Repository pattern is post-MVP optimization.
  - Acceptance:
    - [X] File exists at apps/api/src/services/worker.service.ts
    - [X] getWorkers(orgId, pagination) method implemented with real Supabase query
    - [X] createWorker(orgId, workerData) method implemented with real Supabase insert
    - [X] updateWorker(workerId, orgId, data) method implemented with real Supabase update
    - [X] deleteWorker(workerId, orgId) method implemented with real Supabase delete
    - [X] All queries filtered by organization_id for tenant isolation
    - [X] Phone number validation integrated (E.164 format)
    - [X] Error handling with typed errors
    - [X] TypeScript strict mode (no `any` types)
    - [X] Exported and used by routes/workers.ts

- [X] T043 [US1] Create apps/api/src/routes/auth.ts with POST /api/v1/auth/register, POST /api/v1/auth/login, GET /api/v1/auth/me
  - Acceptance:
    - [X] File exists at apps/api/src/routes/auth.ts
    - [X] POST /api/v1/auth/register endpoint implemented
    - [X] POST /api/v1/auth/login endpoint implemented
    - [X] GET /api/v1/auth/me endpoint implemented
    - [X] All endpoints call auth.service.ts methods (not direct DB access)
    - [X] Request validation with Zod schemas
    - [X] Returns standard response format { success, data } or { success, error }
    - [X] Error responses follow standard format
    - [X] Exported router ready to wire into index.ts

- [X] T044 [US1] Create apps/api/src/routes/workers.ts with GET /api/v1/workers (paginated), POST /api/v1/workers, GET /api/v1/workers/:id, PATCH /api/v1/workers/:id, DELETE /api/v1/workers/:id
  - Acceptance:
    - [X] File exists at apps/api/src/routes/workers.ts
    - [X] GET /api/v1/workers endpoint with pagination implemented
    - [X] POST /api/v1/workers endpoint implemented
    - [X] GET /api/v1/workers/:id endpoint implemented
    - [X] PATCH /api/v1/workers/:id endpoint implemented
    - [X] DELETE /api/v1/workers/:id endpoint implemented
    - [X] All endpoints call worker.service.ts methods
    - [X] Request validation with Zod schemas
    - [X] Auth middleware applied (requires valid JWT)
    - [X] Tenant middleware applied (sets RLS context)
    - [X] Returns standard response format
    - [X] Exported router ready to wire into index.ts

- [X] T045 [US1] Implement phone number validation in worker.service.ts using libphonenumber-js to E.164 format
  - Acceptance:
    - [X] libphonenumber-js dependency added to apps/api/package.json
    - [X] Phone validation function implemented in worker.service.ts
    - [X] Validates Australian phone numbers (primary market)
    - [X] Converts to E.164 format (+61...)
    - [X] Throws clear error for invalid phone numbers
    - [X] Integrated into createWorker and updateWorker methods
    - [X] No placeholder validation (e.g., simple regex)

- [X] T046 [US1] Add tenant isolation verification in worker.service.ts - ensure all queries filtered by orgId
  - Acceptance:
    - [X] All Supabase queries include .eq('organization_id', orgId) filter
    - [X] No queries can access workers from other organizations
    - [X] RLS policies enforced at database level
    - [X] Service layer adds additional orgId filtering
    - [X] Tests verify cross-tenant access blocked (if tests written)

- [X] T047 [US1] Wire auth and workers routes into apps/api/src/index.ts with appropriate middleware. Mount all routes under /api/v1/ prefix for consistency. Do NOT mount routes at root level (/, /auth, /workers). Exception: Health check endpoints can remain at root.
  - Acceptance:
    - [X] Auth routes mounted at /api/v1/auth
    - [X] Workers routes mounted at /api/v1/workers
    - [X] Auth middleware applied to workers routes
    - [X] Tenant middleware applied to workers routes
    - [X] Error handler middleware registered
    - [X] Routes accessible and functional
    - [X] No routes mounted at root level (except health check)

- [ ] T048 [P] [US1] Create apps/admin/src/services/api-client.ts with fetch wrapper and auth token handling
  - Acceptance:
    - [ ] File exists at apps/admin/src/services/api-client.ts
    - [ ] Fetch wrapper function implemented
    - [ ] Automatically adds Authorization header with JWT token
    - [ ] Reads token from auth store or localStorage
    - [ ] Handles 401 responses (token expired/invalid)
    - [ ] Handles network errors gracefully
    - [ ] Returns typed responses
    - [ ] TypeScript strict mode (no `any` types)
    - [ ] Exported and used by hooks

- [ ] T049 [P] [US1] Create apps/admin/src/stores/auth.store.ts using Zustand for auth state (user, token, login, logout)
  - Acceptance:
    - [ ] File exists at apps/admin/src/stores/auth.store.ts
    - [ ] Zustand store created with auth state
    - [ ] State includes: user, token, refreshToken, isAuthenticated, isLoading, error
    - [ ] login(credentials) action calls REAL API (not mock)
    - [ ] register(userData) action calls REAL API (not mock)
    - [ ] logout() action clears state and token
    - [ ] checkAuth() action validates token with server
    - [ ] State persisted to localStorage
    - [ ] NO mock authentication service
    - [ ] TypeScript strict mode (no `any` types)
    - [ ] Exported and used by pages/components

- [ ] T050 [US1] Create apps/admin/src/pages/LoginPage.tsx with email/password form using shadcn/ui components
  - Acceptance:
    - [ ] File exists at apps/admin/src/pages/LoginPage.tsx
    - [ ] Email and password input fields using shadcn/ui Form components
    - [ ] Form validation (email format, password required)
    - [ ] Submit button calls auth.store login action
    - [ ] Loading state shown during login
    - [ ] Error messages displayed for failed login
    - [ ] Link to register page
    - [ ] Redirects to dashboard on successful login
    - [ ] Mobile responsive (≥44px touch targets, ≥16px fonts)
    - [ ] TypeScript strict mode (no `any` types)

- [X] T051 [US1] Create apps/admin/src/pages/RegisterPage.tsx with registration form including organization name

- [ ] T052 [US1] Create apps/admin/src/pages/WorkersPage.tsx with worker list, add button, pagination
  - Acceptance:
    - [ ] File exists at apps/admin/src/pages/WorkersPage.tsx
    - [ ] Worker list table using shadcn/ui Table component
    - [ ] Displays worker name, phone, created date
    - [ ] "Add Worker" button opens WorkerForm modal/dialog
    - [ ] Edit and delete buttons for each worker
    - [ ] Pagination controls (next/prev, page numbers)
    - [ ] Loading state while fetching workers
    - [ ] Empty state for no workers
    - [ ] Uses useWorkers hook for data fetching
    - [ ] Mobile responsive
    - [ ] TypeScript strict mode (no `any` types)

- [ ] T053 [US1] Create apps/admin/src/components/WorkerForm.tsx with name, phone number fields and validation
  - Acceptance:
    - [ ] File exists at apps/admin/src/components/WorkerForm.tsx
    - [ ] Name input field with validation (required, 1-100 chars)
    - [ ] Phone number input field with validation (E.164 format)
    - [ ] Form validation using Zod schema
    - [ ] Submit button calls createWorker or updateWorker
    - [ ] Loading state during submission
    - [ ] Error messages for validation failures
    - [ ] Success feedback on save
    - [ ] Cancel button to close form
    - [ ] Works for both create and edit modes
    - [ ] TypeScript strict mode (no `any` types)

- [ ] T054 [US1] Create apps/admin/src/hooks/useWorkers.ts using TanStack Query for worker CRUD operations
  - Acceptance:
    - [ ] File exists at apps/admin/src/hooks/useWorkers.ts
    - [ ] useWorkers() hook fetches worker list with pagination
    - [ ] useCreateWorker() mutation for creating workers
    - [ ] useUpdateWorker() mutation for updating workers
    - [ ] useDeleteWorker() mutation for deleting workers
    - [ ] All hooks use api-client.ts for API calls
    - [ ] Query invalidation on mutations (refetch list after create/update/delete)
    - [ ] Error handling with user-friendly messages
    - [ ] TypeScript strict mode (no `any` types)
    - [ ] Exported and used by WorkersPage

- [ ] T055 [US1] Configure apps/admin routing with React Router for login, register, workers pages
  - Acceptance:
    - [ ] React Router configured in apps/admin/src/main.tsx or App.tsx
    - [ ] Route for /login → LoginPage
    - [ ] Route for /register → RegisterPage
    - [ ] Route for /workers → WorkersPage (protected)
    - [ ] Protected routes redirect to /login if not authenticated
    - [ ] Default route (/) redirects to /workers or /login
    - [ ] 404 page for unknown routes
    - [ ] Navigation works correctly

- [ ] T056 [US1] Add shadcn/ui components (Button, Input, Form, Table) to packages/ui/ for reuse
  - Acceptance:
    - [ ] Button component added to packages/ui/
    - [ ] Input component added to packages/ui/
    - [ ] Form component added to packages/ui/
    - [ ] Table component added to packages/ui/
    - [ ] All components follow shadcn/ui patterns
    - [ ] Components exported from packages/ui/src/index.ts
    - [ ] Components importable by apps/admin and apps/worker
    - [ ] TypeScript types included
    - [ ] Tailwind CSS classes work correctly

- [X] T057 [US1] Configure Tailwind CSS in apps/admin/tailwind.config.ts with shadcn/ui theme

**Checkpoint**: Admin can register, create organization, add/edit/delete workers. Tenant isolation verified through RLS. User Story 1 fully functional and testable independently.

---

## Phase 4: User Story 2 - Admin Connects Calendar Data Source (Priority: P2)

**Goal**: Enable Google Calendar OAuth connection, token storage with encryption, and event fetching

**Independent Test**: Admin initiates OAuth, grants permissions, verifies connection saved, confirms system can fetch calendar events with stored tokens

### Implementation for User Story 2

- [X] T058 [P] [US2] Create packages/plugins/src/google-calendar/calendar.types.ts with GoogleCalendarConfig, CalendarEvent types
- [X] T059 [P] [US2] Create packages/plugins/src/google-calendar/oauth.handler.ts with getAuthUrl, exchangeToken, refreshToken methods
- [X] T060 [P] [US2] Create packages/plugins/src/google-calendar/event.mapper.ts to map Google Calendar events to ScheduleItem format
- [X] T061 [US2] Create packages/plugins/src/google-calendar/calendar.adapter.ts implementing IScheduleProvider with getSchedule method
- [X] T062 [US2] Create apps/api/src/services/calendar.service.ts with saveConnection, getConnection, disconnect, getSchedule methods (includes data source CRUD)
- [X] T063 [US2] Implement OAuth token encryption in calendar.service.ts using Supabase pgcrypto for access_token_encrypted and refresh_token_encrypted
- [X] T064 [US2] Create apps/api/src/routes/integrations.ts with GET /api/v1/integrations, GET /api/v1/integrations/google-calendar/auth-url, POST /api/v1/integrations/google-calendar/callback, DELETE /api/v1/integrations/:id
- [X] T065 [US2] Implement automatic token refresh logic in calendar.adapter.ts when access token expires
- [X] T066 [US2] Wire integrations routes into apps/api/src/index.ts
- [X] T067 [P] [US2] Create apps/admin/src/pages/IntegrationsPage.tsx showing connection status, connect button, last sync time
- [X] T068 [US2] Create apps/admin/src/components/GoogleCalendarConnect.tsx with OAuth flow initiation and callback handling
- [X] T069 [US2] Create apps/admin/src/hooks/useIntegrations.ts using TanStack Query for integration operations
- [X] T070 [US2] Add IntegrationsPage to admin routing

**Checkpoint**: Admin can connect Google Calendar via OAuth, tokens stored encrypted, system can fetch calendar events. Token refresh works automatically. User Story 2 fully functional and testable independently.

---

## Phase 5: User Story 3 - Admin Sends Dashboard Link via SMS (Priority: P3)

**Goal**: Enable SMS sending with tokenized dashboard links, delivery tracking, and bulk operations

**Independent Test**: Admin selects worker, customizes SMS message, sends link, verifies SMS delivery logs show status

### Implementation for User Story 3

- [X] T071 [P] [US3] Create apps/api/src/services/token.service.ts with generateDashboardToken, validateDashboardToken, revokeToken methods
- [X] T072 [US3] Implement JWT + database hybrid token generation in token.service.ts (JWT with hash stored in dashboard_tokens table)
- [X] T073 [P] [US3] Create apps/api/src/services/sms.service.ts with sendDashboardLink, sendBulkDashboardLinks methods
- [X] T074 [US3] Implement MobileMessage.au API integration in sms.service.ts with Basic Auth and SMS sending
- [X] T075 [US3] Create apps/api/src/middleware/rate-limit.middleware.ts with in-memory Map-based SMS rate limiting (100/org/hour)
- [X] T076 [US3] Create apps/api/src/services/sms-log.service.ts with create, getCountLastHour, getByOrganization methods
- [X] T077 [US3] Create apps/api/src/routes/sms.ts with POST /api/v1/sms/send (single), POST /api/v1/sms/send-bulk (multiple workers)
- [X] T078 [US3] Wire sms routes into apps/api/src/index.ts with rate limiting middleware
- [X] T079 [P] [US3] Create apps/admin/src/components/SendSMSModal.tsx with message customization, token expiry selection, preview
- [X] T080 [US3] Add "Send Dashboard Link" button to WorkerDetailPage with SendSMSModal integration
- [X] T081 [US3] Create apps/admin/src/hooks/useSMS.ts using TanStack Query for SMS sending operations
- [X] T082 [US3] Add bulk send functionality to WorkersPage with worker selection checkboxes

**Checkpoint**: Admin can send SMS with dashboard links (single and bulk), rate limiting enforced, delivery logged. User Story 3 fully functional and testable independently.

---

## Phase 6: User Story 4 - Worker Views Dashboard via SMS Link (Priority: P4)

**Goal**: Enable workers to access mobile-optimized dashboard via tokenized SMS link without login

**Independent Test**: Open tokenized SMS link on mobile device, verify token validation, view personalized dashboard with schedule, confirm mobile-optimized UI

### Implementation for User Story 4

- [X] T083 [P] [US4] Create apps/api/src/services/access-log.service.ts with create, getByOrganization methods
- [X] T084 [US4] Create apps/api/src/routes/dashboard.ts with GET /api/v1/dashboard (query param: token)
- [X] T085 [US4] Implement dashboard route logic: validate token, get worker, fetch data sources, call calendar adapter, log access, return dashboard data
- [X] T086 [US4] Wire dashboard route into apps/api/src/index.ts (no auth middleware - token-based access)
- [X] T087 [P] [US4] Create apps/worker/src/services/dashboard-client.ts with getDashboardData method
- [X] T088 [P] [US4] Create apps/worker/src/pages/DashboardPage.tsx with mobile-optimized layout, schedule list, worker header
- [X] T089 [P] [US4] Create apps/worker/src/components/ScheduleList.tsx displaying schedule items with time, location, description
- [X] T090 [P] [US4] Create apps/worker/src/components/WorkerHeader.tsx showing worker name and organization
- [X] T091 [P] [US4] Create apps/worker/src/pages/TokenExpiredPage.tsx with user-friendly error message
- [X] T092 [P] [US4] Create apps/worker/src/pages/TokenInvalidPage.tsx with security error message
- [X] T093 [P] [US4] Create apps/worker/src/pages/ErrorPage.tsx for general errors
- [X] T094 [US4] Create apps/worker/src/hooks/useDashboard.ts using TanStack Query to fetch dashboard data from token
- [X] T095 [US4] Configure apps/worker routing with token extraction from URL query params
- [X] T096 [US4] Configure apps/worker/tailwind.config.ts with mobile-first breakpoints, ≥44px touch targets, ≥16px fonts
- [X] T097 [US4] Optimize apps/worker bundle size to <300KB gzipped (code splitting, tree shaking)
- [X] T098 [US4] Add empty state component for "No tasks scheduled for today" in DashboardPage

**Checkpoint**: Workers can access dashboard via SMS link, token validation works, mobile UI optimized (no horizontal scroll, readable text), error pages functional. User Story 4 fully functional and testable independently.

---

## Phase 7: User Story 5 - Admin Monitors SMS Delivery and Worker Access (Priority: P5)

**Goal**: Provide admins with SMS delivery logs and dashboard access logs for operational visibility

**Independent Test**: Send SMS to multiple workers, view delivery logs with status indicators, check dashboard access logs, filter/search logs by date or worker

### Implementation for User Story 5

- [X] T099 [P] [US5] Create apps/api/src/routes/logs.ts with GET /api/v1/logs/sms (filters: workerId, status, dateRange), GET /api/v1/logs/access (filters: workerId, validationStatus, dateRange)
- [X] T100 [US5] Implement pagination and filtering logic in sms-log.service.ts and access-log.service.ts
- [X] T101 [US5] Wire logs routes into apps/api/src/index.ts
- [X] T102 [P] [US5] Create apps/admin/src/pages/SMSLogsPage.tsx with log table, status badges, filters, search
- [X] T103 [P] [US5] Create apps/admin/src/pages/AccessLogsPage.tsx with access log table, worker name, timestamp, validation result
- [X] T104 [P] [US5] Create apps/admin/src/components/LogFilters.tsx with date range picker, worker selector, status filter
- [X] T105 [US5] Create apps/admin/src/hooks/useLogs.ts using TanStack Query for log fetching with filters
- [X] T106 [US5] Add "Resend" button to failed SMS entries in SMSLogsPage
- [X] T107 [US5] Add SMSLogsPage and AccessLogsPage to admin routing and navigation menu

**Checkpoint**: Admin can view SMS delivery logs and access logs, filter by date/worker/status, resend failed SMS. User Story 5 fully functional and testable independently.

---

## Phase 8: Testing & Quality Assurance

**Purpose**: Achieve constitutional test coverage targets and validate all user stories

### API Tests (Target: 90% coverage)

- [ ] T108 [P] Create apps/api/tests/integration/auth.test.ts with register, login, getCurrentUser tests
  - Acceptance:
    - [ ] File exists at apps/api/tests/integration/auth.test.ts
    - [ ] Test for POST /api/v1/auth/register (success case)
    - [ ] Test for POST /api/v1/auth/register (validation errors)
    - [ ] Test for POST /api/v1/auth/login (success case)
    - [ ] Test for POST /api/v1/auth/login (invalid credentials)
    - [ ] Test for GET /api/v1/auth/me (authenticated)
    - [ ] Test for GET /api/v1/auth/me (unauthenticated)
    - [ ] All tests pass
    - [ ] Uses test database (not production)

- [ ] T109 [P] Create apps/api/tests/integration/workers.test.ts with CRUD tests and tenant isolation verification
  - Acceptance:
    - [ ] File exists at apps/api/tests/integration/workers.test.ts
    - [ ] Test for GET /api/v1/workers (list with pagination)
    - [ ] Test for POST /api/v1/workers (create worker)
    - [ ] Test for GET /api/v1/workers/:id (get single worker)
    - [ ] Test for PATCH /api/v1/workers/:id (update worker)
    - [ ] Test for DELETE /api/v1/workers/:id (delete worker)
    - [ ] Test for tenant isolation (org A cannot access org B workers)
    - [ ] Test for phone number validation
    - [ ] All tests pass

- [ ] T110 [P] Create apps/api/tests/integration/integrations.test.ts with OAuth flow and token refresh tests
  - Acceptance:
    - [ ] File exists at apps/api/tests/integration/integrations.test.ts
    - [ ] Test for GET /api/v1/integrations/google-calendar/auth-url
    - [ ] Test for POST /api/v1/integrations/google-calendar/callback
    - [ ] Test for GET /api/v1/integrations (list connections)
    - [ ] Test for DELETE /api/v1/integrations/:id
    - [ ] Test for token encryption (tokens stored encrypted)
    - [ ] Test for token refresh (expired token auto-refreshed)
    - [ ] All tests pass
    - [ ] Mocks Google Calendar API

- [ ] T111 [P] Create apps/api/tests/integration/sms.test.ts with send, bulk send, rate limiting tests
  - Acceptance:
    - [ ] File exists at apps/api/tests/integration/sms.test.ts
    - [ ] Test for POST /api/v1/sms/send (single SMS)
    - [ ] Test for POST /api/v1/sms/send-bulk (multiple SMS)
    - [ ] Test for rate limiting (100/org/hour enforced)
    - [ ] Test for SMS logging (delivery logged to database)
    - [ ] Test for invalid phone numbers
    - [ ] All tests pass
    - [ ] Mocks MobileMessage.au API

- [ ] T112 [P] Create apps/api/tests/integration/dashboard.test.ts with token validation and data fetching tests
  - Acceptance:
    - [ ] File exists at apps/api/tests/integration/dashboard.test.ts
    - [ ] Test for GET /api/v1/dashboard (valid token)
    - [ ] Test for GET /api/v1/dashboard (expired token)
    - [ ] Test for GET /api/v1/dashboard (invalid token)
    - [ ] Test for dashboard data fetching (calendar events)
    - [ ] Test for access logging
    - [ ] All tests pass

- [ ] T113 [P] Create apps/api/tests/integration/logs.test.ts with filtering and pagination tests
  - Acceptance:
    - [ ] File exists at apps/api/tests/integration/logs.test.ts
    - [ ] Test for GET /api/v1/logs/sms (list SMS logs)
    - [ ] Test for GET /api/v1/logs/access (list access logs)
    - [ ] Test for filtering by worker, status, date range
    - [ ] Test for pagination
    - [ ] All tests pass

- [ ] T114 [P] Create apps/api/tests/unit/token.service.test.ts with generate, validate, revoke tests
  - Acceptance:
    - [ ] File exists at apps/api/tests/unit/token.service.test.ts
    - [ ] Test for generateDashboardToken (creates valid token)
    - [ ] Test for validateDashboardToken (validates valid token)
    - [ ] Test for validateDashboardToken (rejects expired token)
    - [ ] Test for validateDashboardToken (rejects invalid token)
    - [ ] Test for revokeToken (marks token as used)
    - [ ] All tests pass
    - [ ] Mocks database

- [ ] T115 [P] Create apps/api/tests/unit/sms.service.test.ts with MobileMessage.au API mocking
  - Acceptance:
    - [ ] File exists at apps/api/tests/unit/sms.service.test.ts
    - [ ] Test for sendDashboardLink (success case)
    - [ ] Test for sendDashboardLink (API failure)
    - [ ] Test for sendBulkDashboardLinks (multiple workers)
    - [ ] Test for phone number formatting
    - [ ] All tests pass
    - [ ] Mocks MobileMessage.au API

- [ ] T116 [P] Create apps/api/tests/unit/calendar.service.test.ts with encryption and OAuth tests
  - Acceptance:
    - [ ] File exists at apps/api/tests/unit/calendar.service.test.ts
    - [ ] Test for saveConnection (encrypts tokens)
    - [ ] Test for getConnection (decrypts tokens)
    - [ ] Test for getSchedule (fetches calendar events)
    - [ ] Test for disconnect (deletes connection)
    - [ ] All tests pass
    - [ ] Mocks Google Calendar API

- [ ] T117 Run test coverage report and ensure 90%+ API coverage
  - Acceptance:
    - [ ] Test coverage command runs successfully
    - [ ] API coverage ≥90% (lines, branches, functions)
    - [ ] Coverage report generated (HTML or terminal)
    - [ ] All critical paths covered

### Frontend Tests (Target: 85% React coverage)

- [ ] T118 [P] Create apps/admin/tests/unit/LoginPage.test.tsx with form validation tests
  - Acceptance:
    - [ ] File exists at apps/admin/tests/unit/LoginPage.test.tsx
    - [ ] Test for form rendering
    - [ ] Test for email validation (invalid format)
    - [ ] Test for password required validation
    - [ ] Test for successful login flow
    - [ ] Test for failed login (error message displayed)
    - [ ] All tests pass
    - [ ] Uses React Testing Library

- [ ] T119 [P] Create apps/admin/tests/unit/WorkersPage.test.tsx with list rendering and CRUD tests
  - Acceptance:
    - [ ] File exists at apps/admin/tests/unit/WorkersPage.test.tsx
    - [ ] Test for worker list rendering
    - [ ] Test for "Add Worker" button click
    - [ ] Test for edit worker flow
    - [ ] Test for delete worker flow
    - [ ] Test for pagination
    - [ ] Test for empty state
    - [ ] All tests pass

- [ ] T120 [P] Create apps/admin/tests/unit/IntegrationsPage.test.tsx with OAuth flow tests
  - Acceptance:
    - [ ] File exists at apps/admin/tests/unit/IntegrationsPage.test.tsx
    - [ ] Test for connection status display
    - [ ] Test for "Connect Google Calendar" button
    - [ ] Test for disconnect flow
    - [ ] Test for last sync time display
    - [ ] All tests pass

- [ ] T121 [P] Create apps/admin/tests/unit/SMSLogsPage.test.tsx with filtering tests
  - Acceptance:
    - [ ] File exists at apps/admin/tests/unit/SMSLogsPage.test.tsx
    - [ ] Test for log list rendering
    - [ ] Test for status badge display
    - [ ] Test for filtering by worker
    - [ ] Test for filtering by status
    - [ ] Test for filtering by date range
    - [ ] Test for "Resend" button
    - [ ] All tests pass

- [ ] T122 [P] Create apps/worker/tests/unit/DashboardPage.test.tsx with schedule rendering tests
  - Acceptance:
    - [ ] File exists at apps/worker/tests/unit/DashboardPage.test.tsx
    - [ ] Test for dashboard loading state
    - [ ] Test for schedule list rendering
    - [ ] Test for worker header display
    - [ ] Test for empty state (no tasks)
    - [ ] Test for error states (expired/invalid token)
    - [ ] All tests pass

- [ ] T123 [P] Create apps/worker/tests/unit/ErrorPages.test.tsx with error message tests
  - Acceptance:
    - [ ] File exists at apps/worker/tests/unit/ErrorPages.test.tsx
    - [ ] Test for TokenExpiredPage rendering
    - [ ] Test for TokenInvalidPage rendering
    - [ ] Test for ErrorPage rendering
    - [ ] Test for user-friendly error messages
    - [ ] All tests pass

- [ ] T124 Run test coverage report and ensure 85%+ React coverage
  - Acceptance:
    - [ ] Test coverage command runs successfully
    - [ ] React coverage ≥85% (lines, branches, functions)
    - [ ] Coverage report generated
    - [ ] All critical components covered

### E2E Tests (Critical paths)

- [ ] T125 Create apps/worker/tests/e2e/dashboard.spec.ts with Playwright mobile viewport tests (iOS Safari, Android Chrome)
  - Acceptance:
    - [ ] File exists at apps/worker/tests/e2e/dashboard.spec.ts
    - [ ] Test for dashboard access with valid token
    - [ ] Test for mobile viewport (375x667 iPhone, 360x640 Android)
    - [ ] Test for schedule rendering
    - [ ] Test for touch interactions
    - [ ] All tests pass on both iOS Safari and Android Chrome viewports

- [ ] T126 [P] Test expired token error message in E2E
  - Acceptance:
    - [ ] E2E test for expired token scenario
    - [ ] Verifies "This link has expired" message displayed
    - [ ] Verifies user-friendly error page
    - [ ] Test passes

- [ ] T127 [P] Test invalid token error message in E2E
  - Acceptance:
    - [ ] E2E test for invalid token scenario
    - [ ] Verifies security error message displayed
    - [ ] Verifies error page rendering
    - [ ] Test passes

- [ ] T128 [P] Test mobile responsiveness (no horizontal scroll, touch targets ≥44px) in E2E
  - Acceptance:
    - [ ] E2E test for mobile responsiveness
    - [ ] Verifies no horizontal scroll on mobile viewports
    - [ ] Verifies touch targets ≥44px
    - [ ] Verifies font sizes ≥16px
    - [ ] Test passes

### Utility Tests (Target: 95% coverage)

- [ ] T129 [P] Create packages/shared/tests/validators/worker.validator.test.ts with phone number validation tests
  - Acceptance:
    - [ ] File exists at packages/shared/tests/validators/worker.validator.test.ts
    - [ ] Test for valid phone numbers (various formats)
    - [ ] Test for invalid phone numbers
    - [ ] Test for E.164 formatting
    - [ ] Test for Australian phone numbers
    - [ ] All tests pass

- [ ] T130 [P] Create packages/shared/tests/utils tests for any utility functions
  - Acceptance:
    - [ ] Test files created for all utility functions
    - [ ] All utility functions have test coverage
    - [ ] Edge cases tested
    - [ ] All tests pass

- [ ] T131 Run test coverage report and ensure 95%+ utils coverage
  - Acceptance:
    - [ ] Test coverage command runs successfully
    - [ ] Utils coverage ≥95% (lines, branches, functions)
    - [ ] Coverage report generated
    - [ ] All utility functions covered

### Performance & Security Validation

- [ ] T132 Run Lighthouse audit on apps/worker - verify Performance >90, Accessibility >95
  - Acceptance:
    - [ ] Lighthouse audit run on apps/worker
    - [ ] Performance score ≥90
    - [ ] Accessibility score ≥95
    - [ ] Best Practices score ≥90
    - [ ] SEO score ≥90
    - [ ] Report generated and reviewed

- [ ] T133 Verify apps/admin bundle size <500KB gzipped
  - Acceptance:
    - [ ] Build command run for apps/admin
    - [ ] Bundle size measured (gzipped)
    - [ ] Bundle size <500KB gzipped
    - [ ] Report generated

- [ ] T134 Verify apps/worker bundle size <300KB gzipped
  - Acceptance:
    - [ ] Build command run for apps/worker
    - [ ] Bundle size measured (gzipped)
    - [ ] Bundle size <300KB gzipped
    - [ ] Report generated

- [ ] T135 Test API p99 response time <500ms with load testing tool
  - Acceptance:
    - [ ] Load testing tool configured (k6, Artillery, etc.)
    - [ ] Load test run with realistic traffic
    - [ ] p99 response time <500ms for all endpoints
    - [ ] Report generated

- [ ] T136 Test dashboard load time <2s on 3G throttled connection
  - Acceptance:
    - [ ] Network throttling configured (3G speed)
    - [ ] Dashboard load time measured
    - [ ] Load time <2s on 3G
    - [ ] Report generated

- [ ] T137 Verify all database queries use indexes (EXPLAIN ANALYZE)
  - Acceptance:
    - [ ] EXPLAIN ANALYZE run on all critical queries
    - [ ] All queries use indexes (no sequential scans on large tables)
    - [ ] Query performance acceptable (<100ms for most queries)
    - [ ] Report generated

- [ ] T138 Security audit: verify RLS policies prevent cross-tenant access
  - Acceptance:
    - [ ] RLS policies tested with multiple organizations
    - [ ] Org A cannot access org B data
    - [ ] All tables have RLS policies enabled
    - [ ] Audit report generated

- [ ] T139 Security audit: verify OAuth tokens encrypted at rest
  - Acceptance:
    - [ ] Database inspected for token storage
    - [ ] OAuth tokens stored encrypted (not plaintext)
    - [ ] Encryption uses Supabase pgcrypto
    - [ ] Audit report generated

- [ ] T140 Security audit: verify rate limiting prevents abuse
  - Acceptance:
    - [ ] Rate limiting tested (SMS sending)
    - [ ] 100 SMS/org/hour limit enforced
    - [ ] Excess requests rejected with 429 status
    - [ ] Audit report generated

**Checkpoint**: All test coverage targets met (90% API, 85% React, 95% utils), performance validated, security audited

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, documentation, and production readiness

- [ ] T141 [P] Update README.md with project overview, setup instructions, architecture diagram
  - Acceptance:
    - [ ] README.md updated with project overview
    - [ ] Setup instructions (prerequisites, installation, running locally)
    - [ ] Architecture diagram included
    - [ ] Tech stack documented
    - [ ] Environment variables documented
    - [ ] Contributing guidelines (if applicable)

- [ ] T142 [P] Verify quickstart.md instructions work end-to-end on clean environment
  - Acceptance:
    - [ ] Fresh environment setup (new machine or VM)
    - [ ] Follow quickstart.md instructions exactly
    - [ ] All steps work without errors
    - [ ] Application runs successfully
    - [ ] Update quickstart.md if any issues found

- [ ] T143 [P] Add API documentation comments (JSDoc) to all public service methods
  - Acceptance:
    - [ ] All public methods have JSDoc comments
    - [ ] JSDoc includes @param, @returns, @throws
    - [ ] Examples provided for complex methods
    - [ ] No undocumented public APIs

- [ ] T144 [P] Add inline code comments for complex business logic
  - Acceptance:
    - [ ] Complex algorithms have explanatory comments
    - [ ] Non-obvious code has clarifying comments
    - [ ] Business rules documented in code
    - [ ] No excessive/redundant comments

- [ ] T145 [P] Code cleanup: remove console.logs, unused imports, commented code
  - Acceptance:
    - [ ] No console.log statements in production code
    - [ ] No unused imports
    - [ ] No commented-out code
    - [ ] No TODO/FIXME comments in production paths
    - [ ] Linter passes with no warnings

- [ ] T146 [P] Verify all functions <50 lines and files <500 lines per constitution
  - Acceptance:
    - [ ] All functions <50 lines (or justified exceptions)
    - [ ] All files <500 lines (or justified exceptions)
    - [ ] Report generated with any violations
    - [ ] Violations addressed or justified

- [ ] T147 [P] Verify TypeScript strict mode enabled with no `any` types
  - Acceptance:
    - [ ] TypeScript strict mode enabled in all tsconfig files
    - [ ] No `any` types (or justified exceptions with comments)
    - [ ] TypeScript compilation passes with no errors
    - [ ] Report generated

- [ ] T148 [P] Add structured logging with tenant context to all critical API flows
  - Acceptance:
    - [ ] All critical API flows have structured logging
    - [ ] Logs include tenant context (organization_id)
    - [ ] Logs include request context (user_id, request_id)
    - [ ] Log levels appropriate (info, warn, error)
    - [ ] No sensitive data in logs

- [ ] T149 [P] Verify error messages are user-friendly (not technical stack traces)
  - Acceptance:
    - [ ] All user-facing error messages are friendly
    - [ ] No stack traces exposed to users
    - [ ] Error messages provide actionable guidance
    - [ ] Technical errors logged server-side only

- [ ] T150 [P] Add loading states for all operations >200ms in admin and worker apps
  - Acceptance:
    - [ ] All API calls show loading states
    - [ ] Loading spinners or skeletons displayed
    - [ ] Loading states clear on completion/error
    - [ ] User experience smooth during loading

- [ ] T151 [P] Verify WCAG AA color contrast (4.5:1) in all UI components
  - Acceptance:
    - [ ] Color contrast tool run on all pages
    - [ ] All text meets WCAG AA contrast (4.5:1)
    - [ ] Report generated
    - [ ] Violations fixed

- [ ] T152 [P] Test keyboard navigation and screen reader support
  - Acceptance:
    - [ ] All interactive elements accessible via keyboard
    - [ ] Tab order logical
    - [ ] Screen reader tested (NVDA, JAWS, or VoiceOver)
    - [ ] ARIA labels present where needed
    - [ ] Report generated

- [ ] T153 Configure CI/CD pipeline with test coverage enforcement
  - Acceptance:
    - [ ] CI/CD pipeline configured (GitHub Actions, etc.)
    - [ ] Tests run on every commit
    - [ ] Coverage thresholds enforced (90% API, 85% React, 95% utils)
    - [ ] Build fails if tests fail or coverage below threshold
    - [ ] Pipeline documented

- [ ] T154 Setup environment variables validation at startup
  - Acceptance:
    - [ ] Environment variables validated at application startup
    - [ ] Missing required variables cause startup failure
    - [ ] Clear error messages for missing variables
    - [ ] Validation uses Zod or similar

- [ ] T155 Create .env.example files for all apps with required variables
  - Acceptance:
    - [ ] .env.example created for apps/api
    - [ ] .env.example created for apps/admin
    - [ ] .env.example created for apps/worker
    - [ ] All required variables documented
    - [ ] Example values provided (not real secrets)

- [ ] T156 Final security review: HTTPS enforcement, CORS policies, input sanitization
  - Acceptance:
    - [ ] HTTPS enforced in production
    - [ ] CORS policies configured correctly
    - [ ] All user inputs sanitized
    - [ ] SQL injection prevention verified
    - [ ] XSS prevention verified
    - [ ] CSRF protection implemented
    - [ ] Security audit report generated

**Checkpoint**: Production-ready codebase with documentation, tests, performance, and security validated

---

## Phase 10: Deployment

**Purpose**: Deploy to production environment

- [ ] T157 Create production Supabase project
  - Acceptance:
    - [ ] Production Supabase project created
    - [ ] Project URL and keys saved securely
    - [ ] Database configured
    - [ ] RLS enabled

- [ ] T158 Run database migrations on production Supabase
  - Acceptance:
    - [ ] All migrations run successfully
    - [ ] Database schema matches development
    - [ ] Seed data NOT run in production
    - [ ] Migration log verified

- [ ] T159 Configure production environment variables in Vercel
  - Acceptance:
    - [ ] All environment variables configured in Vercel
    - [ ] Supabase URLs and keys set
    - [ ] MobileMessage.au credentials set
    - [ ] Google OAuth credentials set
    - [ ] No secrets in code or git

- [ ] T160 Deploy apps/api to Vercel as serverless function
  - Acceptance:
    - [ ] apps/api deployed to Vercel
    - [ ] Deployment successful
    - [ ] Health check endpoint responds
    - [ ] API accessible via production URL

- [ ] T161 Deploy apps/admin to Vercel
  - Acceptance:
    - [ ] apps/admin deployed to Vercel
    - [ ] Deployment successful
    - [ ] Admin app accessible via production URL
    - [ ] Login works correctly

- [ ] T162 Deploy apps/worker to Vercel
  - Acceptance:
    - [ ] apps/worker deployed to Vercel
    - [ ] Deployment successful
    - [ ] Worker app accessible via production URL
    - [ ] Dashboard loads correctly

- [ ] T163 Configure custom domains for admin and worker apps
  - Acceptance:
    - [ ] Custom domain configured for admin app
    - [ ] Custom domain configured for worker app
    - [ ] SSL certificates configured
    - [ ] Domains resolve correctly

- [ ] T164 Setup MobileMessage.au production account and API credentials
  - Acceptance:
    - [ ] MobileMessage.au production account created
    - [ ] API credentials obtained
    - [ ] Credentials configured in Vercel
    - [ ] Test SMS sent successfully

- [ ] T165 Configure Google OAuth production credentials
  - Acceptance:
    - [ ] Google OAuth production credentials created
    - [ ] Redirect URIs configured
    - [ ] Credentials configured in Vercel
    - [ ] OAuth flow tested in production

- [ ] T166 Test end-to-end flow in production environment
  - Acceptance:
    - [ ] Admin registration works
    - [ ] Worker creation works
    - [ ] Google Calendar connection works
    - [ ] SMS sending works
    - [ ] Worker dashboard access works
    - [ ] All user stories functional in production

- [ ] T167 Setup monitoring and error tracking (Sentry or similar)
  - Acceptance:
    - [ ] Error tracking service configured (Sentry, etc.)
    - [ ] All apps integrated with error tracking
    - [ ] Error notifications configured
    - [ ] Dashboard accessible

- [ ] T168 Configure database backups (daily, 30-day retention)
  - Acceptance:
    - [ ] Supabase backups configured
    - [ ] Daily backup schedule set
    - [ ] 30-day retention configured
    - [ ] Backup restoration tested

- [ ] T169 Document production deployment process
  - Acceptance:
    - [ ] Deployment runbook created
    - [ ] Step-by-step deployment instructions
    - [ ] Rollback procedures documented
    - [ ] Emergency contacts listed

- [ ] T170 Create runbook for common operational tasks
  - Acceptance:
    - [ ] Runbook created with common tasks
    - [ ] How to add new organization
    - [ ] How to troubleshoot SMS delivery
    - [ ] How to reset user password
    - [ ] How to check logs
    - [ ] How to scale resources

**Checkpoint**: All apps deployed to production, end-to-end flow validated, monitoring configured

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion - Can run parallel with US1
- **User Story 3 (Phase 5)**: Depends on Foundational + US1 (needs worker service) + US2 (needs calendar service)
- **User Story 4 (Phase 6)**: Depends on Foundational + US3 (needs token service and SMS)
- **User Story 5 (Phase 7)**: Depends on Foundational + US3 (needs SMS logs) + US4 (needs access logs)
- **Testing (Phase 8)**: Depends on all user stories being complete
- **Polish (Phase 9)**: Depends on Testing completion
- **Deployment (Phase 10)**: Depends on Polish completion

### User Story Dependencies

- **US1 (P1)**: Independent - only needs Foundational
- **US2 (P2)**: Independent - only needs Foundational (can run parallel with US1)
- **US3 (P3)**: Depends on US1 (worker service) + US2 (calendar service)
- **US4 (P4)**: Depends on US3 (token service, SMS)
- **US5 (P5)**: Depends on US3 (SMS logs) + US4 (access logs)

### Parallel Opportunities

- **Phase 1**: All tasks marked [P] can run in parallel (T002-T007, T009-T014)
- **Phase 2**: Database tasks (T015-T019) sequential, but Shared Types (T020-T029), Plugin Base (T030-T032), and API Infrastructure (T033-T039) can run in parallel after database
- **User Stories**: US1 and US2 can be developed in parallel by different developers
- **Within Each Story**: Tasks marked [P] can run in parallel (e.g., service layer files, frontend components)
- **Testing Phase**: All test files marked [P] can be written in parallel

---

## Parallel Example: User Story 1

```bash
# These tasks can run simultaneously (different files):
T040: Create auth.service.ts
T041: Create organization.service.ts
T042: Create worker.service.ts

# These frontend tasks can run simultaneously:
T048: Create api-client.ts
T049: Create auth.store.ts

# These page components can run simultaneously:
T050: Create LoginPage.tsx
T051: Create RegisterPage.tsx
T052: Create WorkersPage.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T014)
2. Complete Phase 2: Foundational (T015-T039) - CRITICAL
3. Complete Phase 3: User Story 1 (T040-T057)
4. **STOP and VALIDATE**: Test US1 independently - admin can register, manage workers
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready (2-3 days)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! - 3-4 days)
3. Add User Story 2 → Test independently → Deploy/Demo (2-3 days)
4. Add User Story 3 → Test independently → Deploy/Demo (2-3 days)
5. Add User Story 4 → Test independently → Deploy/Demo (2-3 days)
6. Add User Story 5 → Test independently → Deploy/Demo (1-2 days)
7. Testing + Polish + Deploy (3-5 days)

**Total Estimated Time**: 3.5-4.5 weeks (1 developer)

### Parallel Team Strategy

With 2-3 developers:

1. Team completes Setup + Foundational together (2-3 days)
2. Once Foundational is done:
   - Developer A: User Story 1 (P1)
   - Developer B: User Story 2 (P2)
3. After US1 + US2 complete:
   - Developer A: User Story 3 (P3)
   - Developer B: User Story 4 (P4)
4. After US3 + US4 complete:
   - Developer A: User Story 5 (P5)
   - Developer B: Testing (Phase 8)
5. Team completes Polish + Deployment together

**Total Estimated Time with 2-3 developers**: 2-3 weeks

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **Acceptance criteria** define specific, verifiable conditions for task completion
- Tests written during implementation per constitutional requirements (not before)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Constitution-based simplifications applied: in-memory rate limiting, simple JSON logger, no plugin registry, data source CRUD in calendar service
- All file paths are absolute from repository root
- Mobile-first: Worker app optimized for phones (≥44px touch targets, ≥16px fonts, <300KB bundle)
- Security: RLS policies, encrypted OAuth tokens, rate limiting, audit logging
- Performance: <500ms API p99, <2s dashboard load on 3G, indexed queries
