# Tasks: CleanConnect SMS Dashboard MVP

**Input**: Design documents from `/specs/001-sms-dashboard-mvp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Tests**: Not explicitly requested in specification - tests will be added during implementation phases per constitutional requirements (90% API, 85% React, 95% utils coverage).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

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
- [ ] T041 [P] [US1] Create apps/api/src/services/organization.service.ts with get, update methods (Note: Organization creation happens in auth.service.ts during registration - T040)
- [ ] T042 [P] [US1] Create apps/api/src/services/worker.service.ts with CRUD methods (getWorkers, createWorker, updateWorker, deleteWorker). Implementation: Use direct Supabase queries for MVP. Repository pattern is post-MVP optimization.
- [ ] T043 [US1] Create apps/api/src/routes/auth.ts with POST /api/v1/auth/register, POST /api/v1/auth/login, GET /api/v1/auth/me
- [ ] T044 [US1] Create apps/api/src/routes/workers.ts with GET /api/v1/workers (paginated), POST /api/v1/workers, GET /api/v1/workers/:id, PATCH /api/v1/workers/:id, DELETE /api/v1/workers/:id
- [ ] T045 [US1] Implement phone number validation in worker.service.ts using libphonenumber-js to E.164 format
- [ ] T046 [US1] Add tenant isolation verification in worker.service.ts - ensure all queries filtered by orgId
- [ ] T047 [US1] Wire auth and workers routes into apps/api/src/index.ts with appropriate middleware. Mount all routes under /api/v1/ prefix for consistency. Do NOT mount routes at root level (/, /auth, /workers). Exception: Health check endpoints can remain at root.
- [ ] T048 [P] [US1] Create apps/admin/src/services/api-client.ts with fetch wrapper and auth token handling
- [ ] T049 [P] [US1] Create apps/admin/src/stores/auth.store.ts using Zustand for auth state (user, token, login, logout)
- [ ] T050 [US1] Create apps/admin/src/pages/LoginPage.tsx with email/password form using shadcn/ui components
- [X] T051 [US1] Create apps/admin/src/pages/RegisterPage.tsx with registration form including organization name
- [ ] T052 [US1] Create apps/admin/src/pages/WorkersPage.tsx with worker list, add button, pagination
- [ ] T053 [US1] Create apps/admin/src/components/WorkerForm.tsx with name, phone number fields and validation
- [ ] T054 [US1] Create apps/admin/src/hooks/useWorkers.ts using TanStack Query for worker CRUD operations
- [ ] T055 [US1] Configure apps/admin routing with React Router for login, register, workers pages
- [ ] T056 [US1] Add shadcn/ui components (Button, Input, Form, Table) to packages/ui/ for reuse
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
- [ ] T109 [P] Create apps/api/tests/integration/workers.test.ts with CRUD tests and tenant isolation verification
- [ ] T110 [P] Create apps/api/tests/integration/integrations.test.ts with OAuth flow and token refresh tests
- [ ] T111 [P] Create apps/api/tests/integration/sms.test.ts with send, bulk send, rate limiting tests
- [ ] T112 [P] Create apps/api/tests/integration/dashboard.test.ts with token validation and data fetching tests
- [ ] T113 [P] Create apps/api/tests/integration/logs.test.ts with filtering and pagination tests
- [ ] T114 [P] Create apps/api/tests/unit/token.service.test.ts with generate, validate, revoke tests
- [ ] T115 [P] Create apps/api/tests/unit/sms.service.test.ts with MobileMessage.au API mocking
- [ ] T116 [P] Create apps/api/tests/unit/calendar.service.test.ts with encryption and OAuth tests
- [ ] T117 Run test coverage report and ensure 90%+ API coverage

### Frontend Tests (Target: 85% React coverage)

- [ ] T118 [P] Create apps/admin/tests/unit/LoginPage.test.tsx with form validation tests
- [ ] T119 [P] Create apps/admin/tests/unit/WorkersPage.test.tsx with list rendering and CRUD tests
- [ ] T120 [P] Create apps/admin/tests/unit/IntegrationsPage.test.tsx with OAuth flow tests
- [ ] T121 [P] Create apps/admin/tests/unit/SMSLogsPage.test.tsx with filtering tests
- [ ] T122 [P] Create apps/worker/tests/unit/DashboardPage.test.tsx with schedule rendering tests
- [ ] T123 [P] Create apps/worker/tests/unit/ErrorPages.test.tsx with error message tests
- [ ] T124 Run test coverage report and ensure 85%+ React coverage

### E2E Tests (Critical paths)

- [ ] T125 Create apps/worker/tests/e2e/dashboard.spec.ts with Playwright mobile viewport tests (iOS Safari, Android Chrome)
- [ ] T126 [P] Test expired token error message in E2E
- [ ] T127 [P] Test invalid token error message in E2E
- [ ] T128 [P] Test mobile responsiveness (no horizontal scroll, touch targets ≥44px) in E2E

### Utility Tests (Target: 95% coverage)

- [ ] T129 [P] Create packages/shared/tests/validators/worker.validator.test.ts with phone number validation tests
- [ ] T130 [P] Create packages/shared/tests/utils tests for any utility functions
- [ ] T131 Run test coverage report and ensure 95%+ utils coverage

### Performance & Security Validation

- [ ] T132 Run Lighthouse audit on apps/worker - verify Performance >90, Accessibility >95
- [ ] T133 Verify apps/admin bundle size <500KB gzipped
- [ ] T134 Verify apps/worker bundle size <300KB gzipped
- [ ] T135 Test API p99 response time <500ms with load testing tool
- [ ] T136 Test dashboard load time <2s on 3G throttled connection
- [ ] T137 Verify all database queries use indexes (EXPLAIN ANALYZE)
- [ ] T138 Security audit: verify RLS policies prevent cross-tenant access
- [ ] T139 Security audit: verify OAuth tokens encrypted at rest
- [ ] T140 Security audit: verify rate limiting prevents abuse

**Checkpoint**: All test coverage targets met (90% API, 85% React, 95% utils), performance validated, security audited

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, documentation, and production readiness

- [ ] T141 [P] Update README.md with project overview, setup instructions, architecture diagram
- [ ] T142 [P] Verify quickstart.md instructions work end-to-end on clean environment
- [ ] T143 [P] Add API documentation comments (JSDoc) to all public service methods
- [ ] T144 [P] Add inline code comments for complex business logic
- [ ] T145 [P] Code cleanup: remove console.logs, unused imports, commented code
- [ ] T146 [P] Verify all functions <50 lines and files <500 lines per constitution
- [ ] T147 [P] Verify TypeScript strict mode enabled with no `any` types
- [ ] T148 [P] Add structured logging with tenant context to all critical API flows
- [ ] T149 [P] Verify error messages are user-friendly (not technical stack traces)
- [ ] T150 [P] Add loading states for all operations >200ms in admin and worker apps
- [ ] T151 [P] Verify WCAG AA color contrast (4.5:1) in all UI components
- [ ] T152 [P] Test keyboard navigation and screen reader support
- [ ] T153 Configure CI/CD pipeline with test coverage enforcement
- [ ] T154 Setup environment variables validation at startup
- [ ] T155 Create .env.example files for all apps with required variables
- [ ] T156 Final security review: HTTPS enforcement, CORS policies, input sanitization

**Checkpoint**: Production-ready codebase with documentation, tests, performance, and security validated

---

## Phase 10: Deployment

**Purpose**: Deploy to production environment

- [ ] T157 Create production Supabase project
- [ ] T158 Run database migrations on production Supabase
- [ ] T159 Configure production environment variables in Vercel
- [ ] T160 Deploy apps/api to Vercel as serverless function
- [ ] T161 Deploy apps/admin to Vercel
- [ ] T162 Deploy apps/worker to Vercel
- [ ] T163 Configure custom domains for admin and worker apps
- [ ] T164 Setup MobileMessage.au production account and API credentials
- [ ] T165 Configure Google OAuth production credentials
- [ ] T166 Test end-to-end flow in production environment
- [ ] T167 Setup monitoring and error tracking (Sentry or similar)
- [ ] T168 Configure database backups (daily, 30-day retention)
- [ ] T169 Document production deployment process
- [ ] T170 Create runbook for common operational tasks

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
- Tests written during implementation per constitutional requirements (not before)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Constitution-based simplifications applied: in-memory rate limiting, simple JSON logger, no plugin registry, data source CRUD in calendar service
- All file paths are absolute from repository root
- Mobile-first: Worker app optimized for phones (≥44px touch targets, ≥16px fonts, <300KB bundle)
- Security: RLS policies, encrypted OAuth tokens, rate limiting, audit logging
- Performance: <500ms API p99, <2s dashboard load on 3G, indexed queries
