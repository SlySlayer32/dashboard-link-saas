# Implementation Plan: Worker Management

**Branch**: `001-worker-management` | **Date**: 2026-03-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-worker-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Worker management CRUD feature enabling managers to add, edit, view, and soft delete field workers with name and Australian mobile phone validation. Implements multi-tenant isolation via RLS, repository pattern for data access, and service layer for business logic. Phone numbers validated against E.164 format and stored normalized. Soft delete preserves historical data (SMS logs, access logs, dashboard tokens) while excluding inactive workers from active queries.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x (strict mode), Node.js 18+ LTS  
**Primary Dependencies**: Hono.js 4.x (API), React 18.x + Vite 5.x (admin UI), Supabase client, Zod 3.x (validation)  
**Storage**: PostgreSQL 15+ via Supabase with custom RLS pattern (`app.tenant_id` session variable)  
**Testing**: Vitest (unit + integration), MSW (API mocking), 60-70% overall coverage target  
**Target Platform**: Web application (desktop-focused admin dashboard, API hosted on Railway)
**Project Type**: Full-stack web service (monorepo: `apps/admin`, `apps/api`, `packages/database`, `packages/shared`)  
**Performance Goals**: 500ms p95 for CRUD operations, <30s to add worker, <5s to view worker list  
**Constraints**: Multi-tenant isolation (RLS enforced), E.164 phone validation, 255 char name limit, inline validation errors  
**Scale/Scope**: Solo operator MVP, 1-10 workers per organization, ~5 API endpoints, 3-4 UI screens

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Architecture Compliance
- **Repository Pattern**: All database access through `BaseRepository` in `packages/database/src/base/` ✅
- **Service Layer**: Business logic in `apps/api/src/services/WorkerService.ts` ✅
- **RLS Enforcement**: Custom `app.tenant_id` pattern on `workers` table ✅
- **Vendor SDK Isolation**: N/A (no external vendor SDKs for this feature) ✅
- **Monorepo Boundaries**: API in `apps/api`, UI in `apps/admin`, shared types in `packages/shared` ✅

### ✅ Testing Standards
- **Multi-tenant isolation tests**: Verify workers scoped to organization ✅
- **Phone validation tests**: E.164 format enforced ✅
- **Soft delete tests**: Historical data preserved, active queries exclude deleted ✅
- **Coverage targets**: Security-critical 90%, business logic 80%, overall 60-70% ✅

### ✅ Technology Stack
- **Backend**: Hono.js 4.x + Node.js 18+ ✅
- **Frontend**: React 18.x + Vite 5.x + TypeScript 5.x ✅
- **Database**: Supabase (PostgreSQL 15+) with custom RLS ✅
- **Validation**: Zod 3.x for input validation ✅
- **State Management**: TanStack Query 5.x for server state ✅

### ✅ MVP Scope
- **In scope**: Worker CRUD, phone validation, soft delete, multi-tenant isolation ✅
- **Out of scope**: Worker logins, bulk import, worker groups, shift management ✅
- **Scope gate**: Feature is in FEATURES.md (001-worker-management) ✅

### ⚠️ Performance Targets
- **New requirement**: 500ms p95 for CRUD operations (from clarifications)
- **Requires**: Database indexes on `organization_id`, `deleted_at`, `phone_number`
- **Monitoring**: Structured JSON logs with `duration_ms` field (NFR-003)

### ⚠️ Observability
- **New requirement**: Structured logging for all CRUD operations (NFR-003, NFR-004)
- **Log fields**: `operation`, `duration_ms`, `success`, `error_type`, `organization_id`, `worker_id`
- **Implementation**: Service layer emits JSON logs

**Gate Status**: ✅ PASS (with 2 new requirements from clarifications integrated)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
apps/
├── admin/                    # Desktop-focused admin dashboard
│   └── src/
│       ├── components/
│       │   └── workers/      # Worker management UI components
│       │       ├── WorkerList.tsx
│       │       ├── WorkerForm.tsx
│       │       ├── WorkerCard.tsx
│       │       └── DeleteWorkerDialog.tsx
│       ├── pages/
│       │   └── WorkersPage.tsx
│       ├── lib/
│       │   └── api/
│       │       └── workers.ts  # API client for worker endpoints
│       └── __tests__/
│           └── workers/
│
├── api/                      # Hono.js backend
│   └── src/
│       ├── routes/
│       │   └── workers.ts    # Worker CRUD endpoints
│       ├── services/
│       │   └── WorkerService.ts  # Business logic
│       ├── middleware/
│       │   └── tenant.ts     # Sets app.tenant_id from JWT
│       └── __tests__/
│           ├── integration/
│           │   └── workers.test.ts
│           └── unit/
│               └── WorkerService.test.ts
│
packages/
├── database/
│   └── src/
│       ├── repositories/
│       │   └── WorkerRepository.ts  # Data access layer
│       ├── base/
│       │   └── BaseRepository.ts    # Existing base class
│       └── __tests__/
│           └── WorkerRepository.test.ts
│
├── shared/
│   └── src/
│       ├── types/
│       │   └── worker.ts     # Worker type definitions
│       └── validators/
│           └── worker.ts     # Zod schemas for validation
│
supabase/
└── migrations/
    └── 20260311_workers_table.sql  # Workers table + RLS policies
```

**Structure Decision**: Monorepo web application (Option 2 variant). Admin UI in `apps/admin`, API in `apps/api`, shared database logic in `packages/database`, shared types/validators in `packages/shared`. Follows established architecture with repository pattern, service layer, and multi-tenant RLS enforcement.

## Complexity Tracking

> **No violations detected** — All architectural decisions align with constitution.

**Justifications for existing patterns (not violations, but worth documenting):**

| Pattern | Why Needed | Simpler Alternative Rejected Because |
|---------|------------|--------------------------------------|
| Repository Pattern | Multi-tenant isolation + testability | Direct SQL in routes bypasses RLS enforcement, harder to test, violates separation of concerns |
| Service Layer | Business logic reusability + testing | Logic in routes creates duplication, harder to test, violates single responsibility |
| Custom RLS (`app.tenant_id`) | Explicit tenant context control | Standard Supabase JWT claims require encoding `organization_id` in JWT, less flexible for service role queries |
| Soft Delete | Preserve audit trail + legal compliance | Hard delete loses SMS logs/access logs, violates data retention requirements |
| Structured Logging | Performance monitoring + debugging | No logging creates blind spots, can't diagnose production issues or measure p95 latency |
