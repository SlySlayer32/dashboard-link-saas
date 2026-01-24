# Implementation Plan: CleanConnect SMS Dashboard MVP

**Branch**: `001-sms-dashboard-mvp` | **Date**: 2026-01-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-sms-dashboard-mvp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

CleanConnect is a multi-tenant SaaS platform that delivers personalized daily dashboards to frontline workers via SMS links. Admins configure data sources (starting with Google Calendar), manage workers, and send tokenized dashboard links via SMS. Workers access mobile-optimized dashboards without login or app installation. The MVP focuses on five core user stories: organization/worker setup (P1), Google Calendar integration (P2), SMS delivery (P3), worker dashboard access (P4), and delivery monitoring (P5).

**Technical Approach**: Vite + React frontend apps (admin/worker), Hono.js serverless API, Supabase (PostgreSQL + Auth + RLS), MobileMessage.au SMS provider, JWT-based tokenized access, plugin adapter architecture for extensibility.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), Node.js 20+ LTS  
**Primary Dependencies**: 
  - Frontend: Vite 5, React 18, shadcn/ui, Tailwind CSS 3, Zustand, TanStack Query
  - Backend: Hono.js 4.x, Supabase JS Client 2.x
  - Database: Supabase (PostgreSQL 15+)
  - SMS: MobileMessage.au REST API (Basic Auth)
  - OAuth: Google Calendar API v3

**Storage**: Supabase PostgreSQL with Row Level Security (RLS), encrypted OAuth tokens at rest  
**Testing**: Vitest (unit/integration), Playwright (E2E), React Testing Library  
**Target Platform**: 
  - Admin: Modern browsers (Chrome 90+, Safari 14+, Firefox 88+)
  - Worker: Mobile browsers (iOS Safari 14+, Android Chrome 90+)
  - API: Serverless edge runtime (Vercel Edge, Cloudflare Workers compatible)

**Project Type**: Web application (monorepo: 2 frontend apps + 1 API + shared packages)  
**Performance Goals**: 
  - API: p99 <500ms, p50 <200ms
  - Dashboard load: <2s on 3G mobile
  - SMS delivery: 95% within 30 seconds
  - Token validation: <100ms

**Constraints**: 
  - Mobile-first: Worker dashboard must work on phones with intermittent connectivity
  - Security: Multi-tenant isolation via RLS, tokenized access (no worker login)
  - SMS rate limits: 100 SMS/org/hour (configurable)
  - Bundle sizes: Admin <500KB, Worker <300KB (gzipped)

**Scale/Scope**: 
  - MVP: 10-50 organizations, 500-2000 workers total
  - Post-MVP: 1000+ organizations, 50k+ workers
  - MVP Screens: ~8 admin screens, 1 worker dashboard screen

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Alignment

✅ **I. Mobile-First Worker Experience**: Worker dashboard is mobile-optimized, touch-friendly, no desktop dependencies  
✅ **II. Secure Tokenized Access**: Time-limited JWT tokens (1-24hr), RLS tenant isolation, audit logging, rate limiting  
✅ **III. Plugin-Based Extensibility**: Adapter pattern for Google Calendar, extensible to Airtable/Notion post-MVP  
✅ **IV. SMS-First Delivery**: MobileMessage.au integration, delivery tracking, bulk sending, rate limiting  
✅ **V. Simple Admin Experience**: OAuth for Google Calendar, <2min setup target, clear error messages  
✅ **VI. Observable by Default**: Structured logging with tenant context, metrics for core workflows  
✅ **VII. Code Quality**: TypeScript strict mode, <50 line functions, <500 line files, explicit error handling  
✅ **VIII. Testing Standards**: 90% API coverage, 85% React coverage, 95% utils coverage targets  
✅ **IX. UX Consistency**: shadcn/ui + Tailwind, ≥44px touch targets, ≥16px fonts, WCAG AA contrast  
✅ **X. Performance Requirements**: <500ms API p99, <2s dashboard load on 3G, indexed queries, pagination

### Technology Stack Compliance

✅ **Frontend**: Vite + React 18 + shadcn/ui + Tailwind + Zustand + TanStack Query (COMPLIANT)  
✅ **Backend**: Hono.js (NOT Express/Fastify) (COMPLIANT)  
✅ **Database**: Supabase PostgreSQL with RLS (COMPLIANT)  
✅ **SMS**: MobileMessage.com.au (COMPLIANT)  
✅ **Monorepo**: Turborepo (COMPLIANT)  
✅ **Deployment**: Vercel (frontend), Supabase (backend/DB) (COMPLIANT)

### MVP Scope Discipline

✅ **In Scope (V1)**: Auth, Worker CRUD, Google Calendar plugin, SMS sending, Worker dashboard, Manual entry backend  
✅ **Deferred (Post-MVP)**: Airtable/Notion plugins, webhooks, async queues, circuit breakers, advanced observability, billing

### Quality Gates

✅ All API endpoints will have typed error responses  
✅ Structured logging with tenant context for all API flows  
✅ Mobile testing on actual devices (iOS Safari, Android Chrome)  
✅ Token expiry scenarios covered in tests  
✅ SMS test mode for development (MobileMessage.au sandbox)  
✅ Plugin failure handling with graceful degradation  
✅ Test coverage targets enforced in CI/CD

**GATE STATUS**: ✅ PASS - All constitutional requirements satisfied, no violations requiring justification

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
├── admin/                    # Admin dashboard (Vite + React)
│   ├── src/
│   │   ├── components/       # React components (shadcn/ui based)
│   │   ├── pages/            # Route pages (workers, integrations, sms-logs, etc.)
│   │   ├── stores/           # Zustand state management
│   │   ├── services/         # API client, auth service
│   │   ├── hooks/            # Custom React hooks (TanStack Query)
│   │   ├── lib/              # Utilities, constants
│   │   └── main.tsx          # Entry point
│   ├── tests/
│   │   ├── unit/             # Component unit tests
│   │   └── integration/      # Page integration tests
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── worker/                   # Worker dashboard (Vite + React, mobile-optimized)
│   ├── src/
│   │   ├── components/       # Mobile-optimized components
│   │   ├── pages/            # Dashboard page, error pages
│   │   ├── services/         # API client for dashboard data
│   │   ├── lib/              # Utilities
│   │   └── main.tsx
│   ├── tests/
│   │   ├── unit/
│   │   └── e2e/              # Playwright mobile tests
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
└── api/                      # Hono.js API (serverless-ready)
    ├── src/
    │   ├── routes/           # API route handlers
    │   │   ├── auth.ts       # POST /api/v1/auth/login, /register
    │   │   ├── workers.ts    # CRUD /api/v1/workers
    │   │   ├── integrations.ts # Google Calendar OAuth flow
    │   │   ├── sms.ts        # POST /api/v1/sms/send
    │   │   ├── dashboard.ts  # GET /api/v1/dashboard/:token
    │   │   └── logs.ts       # GET /api/v1/logs/sms, /logs/access
    │   ├── middleware/       # Auth, tenant, rate-limit, error handling
    │   ├── services/         # Business logic
    │   │   ├── auth.service.ts
    │   │   ├── worker.service.ts
    │   │   ├── sms.service.ts
    │   │   ├── token.service.ts
    │   │   └── calendar.service.ts
    │   ├── lib/              # Utilities, logger, db client
    │   ├── types/            # TypeScript types
    │   └── index.ts          # Hono app entry
    ├── tests/
    │   ├── unit/             # Service unit tests
    │   ├── integration/      # API route integration tests
    │   └── contract/         # API contract tests (OpenAPI validation)
    └── package.json

packages/
├── shared/                   # Shared types and utilities
│   ├── src/
│   │   ├── types/            # Shared TypeScript interfaces
│   │   │   ├── worker.ts
│   │   │   ├── organization.ts
│   │   │   ├── sms.ts
│   │   │   ├── token.ts
│   │   │   └── schedule.ts
│   │   ├── constants/        # Shared constants
│   │   ├── validators/       # Zod schemas for validation
│   │   └── utils/            # Shared utility functions
│   ├── tests/
│   └── package.json
│
├── ui/                       # Shared UI components (shadcn/ui)
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/           # shadcn/ui primitives
│   │   │   └── custom/       # Custom shared components
│   │   └── lib/              # UI utilities
│   ├── tests/
│   └── package.json
│
└── plugins/                  # Plugin adapter system
    ├── src/
    │   ├── base/             # Base adapter interface
    │   │   ├── adapter.interface.ts
    │   │   ├── adapter.types.ts
    │   │   └── adapter.registry.ts
    │   ├── google-calendar/  # Google Calendar adapter
    │   │   ├── calendar.adapter.ts
    │   │   ├── calendar.types.ts
    │   │   ├── oauth.handler.ts
    │   │   └── event.mapper.ts
    │   └── manual/           # Manual entry adapter (future)
    ├── tests/
    │   ├── unit/
    │   └── integration/      # Mock external API tests
    └── package.json

supabase/
├── migrations/               # SQL migration files
│   ├── 001_initial_schema.sql
│   ├── 002_rls_policies.sql
│   └── 003_indexes.sql
├── seed.sql                  # Development seed data
└── config.toml               # Supabase configuration

docs/
├── api/                      # API documentation
│   └── openapi.yaml          # OpenAPI 3.0 spec
└── architecture/             # Architecture diagrams

specs/
└── 001-sms-dashboard-mvp/
    ├── spec.md               # Feature specification
    ├── plan.md               # This file
    ├── research.md           # Phase 0 output (to be generated)
    ├── data-model.md         # Phase 1 output (to be generated)
    ├── quickstart.md         # Phase 1 output (to be generated)
    ├── contracts/            # Phase 1 output (to be generated)
    └── tasks.md              # Phase 2 output (/speckit.tasks)
```

**Structure Decision**: Web application monorepo with Turborepo. Three apps (admin, worker, api) and four shared packages (shared, ui, plugins, database). This structure supports:
- Independent deployment of frontend apps and API
- Shared code reuse via packages
- Plugin extensibility via packages/plugins
- Clear separation of concerns (admin vs worker UI, API business logic)
- Testability at all layers (unit, integration, contract, E2E)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations** - All architectural decisions align with constitutional principles after simplification review. The monorepo structure with 3 apps and 4 packages is justified by:
- Separate admin/worker apps for different user experiences (mobile vs desktop)
- API app for serverless deployment flexibility
- Shared packages for code reuse and maintainability
- Plugin package for extensibility without core changes

**Simplifications Applied**: Four over-engineered components removed (plugin registry, DB-based rate limiting, separate data source service, Pino logger) while maintaining all constitutional requirements. See "Constitution-Based Simplifications Applied" section at end of document for details.

---

## Post-Design Constitution Re-Evaluation

*Re-checked after Phase 1 design completion*

### Architecture Decisions Review

✅ **Multi-Tenant Isolation**: Three-layer defense (application, RLS, token scoping) exceeds constitutional requirements  
✅ **Mobile-First Worker Dashboard**: Touch targets ≥44px, fonts ≥16px, no horizontal scroll, <300KB bundle  
✅ **Tokenized Access**: JWT + database hybrid enables both fast validation and revocation capability  
✅ **Plugin Architecture**: Base adapter interface with Google Calendar implementation demonstrates extensibility  
✅ **SMS-First Delivery**: MobileMessage.au integration with delivery tracking and rate limiting  
✅ **Security Defense-in-Depth**: RLS policies, encrypted OAuth tokens, input validation, audit logging  
✅ **Code Quality**: TypeScript strict mode throughout, service layer separation, explicit error handling  
✅ **Testing Strategy**: 90% API, 85% React, 95% utils coverage targets with unit/integration/E2E tests  
✅ **Performance**: Indexed queries, pagination, <500ms API p99, <2s dashboard load targets  
✅ **Observability**: Structured logging with tenant context, request IDs, error tracking

### Technology Stack Verification

✅ **Frontend**: Vite + React 18 + shadcn/ui + Tailwind + Zustand + TanStack Query (COMPLIANT)  
✅ **Backend**: Hono.js serverless API (COMPLIANT)  
✅ **Database**: Supabase PostgreSQL with RLS (COMPLIANT)  
✅ **SMS**: MobileMessage.au (COMPLIANT)  
✅ **Monorepo**: Turborepo (COMPLIANT)

### MVP Scope Verification

✅ **In Scope**: Auth, Worker CRUD, Google Calendar, SMS sending, Worker dashboard, Manual entry backend  
✅ **Deferred**: Airtable/Notion plugins, webhooks, async queues, circuit breakers, advanced observability

### Design Trade-offs Justification

1. **JWT + Database Hybrid Tokens**: Balances performance (fast validation) with security (revocation capability) - APPROVED
2. **Synchronous SMS (MVP)**: Simplifies initial implementation, async queuing deferred to post-MVP - APPROVED
3. **Single Calendar per Org (MVP)**: Reduces OAuth complexity, multi-source support deferred - APPROVED
4. **No Webhook Support (MVP)**: Eliminates webhook security complexity, PUSH integrations deferred - APPROVED
5. **In-Memory Rate Limiting (MVP)**: No Redis dependency, distributed rate limiting deferred - APPROVED

**FINAL GATE STATUS**: ✅ PASS - All design decisions align with constitutional principles. No violations. Ready for implementation.

---

## Implementation Artifacts Generated

### Phase 0: Research & Architecture
- ✅ `research.md` - Comprehensive architecture decisions, data flows, security patterns, trade-offs

### Phase 1: Design & Contracts
- ✅ `data-model.md` - Complete Supabase schema with entities, relationships, RLS policies, indexes
- ✅ `contracts/openapi.yaml` - Full OpenAPI 3.0 specification for all API endpoints
- ✅ `quickstart.md` - Developer setup guide with step-by-step instructions
- ✅ Agent context updated - Technology stack added to `.windsurf/rules/specify-rules.md`

### Next Phase: Task Breakdown
- ⏳ `tasks.md` - Generated by `/speckit.tasks` command (not part of `/speckit.plan`)

---

## Summary

**Branch**: `001-sms-dashboard-mvp`  
**Status**: Design Complete ✅  
**Next Step**: Run `/speckit.tasks` to generate implementation task breakdown

**Key Deliverables**:
1. High-level architecture with clear service boundaries and data flows
2. Complete Supabase database schema with RLS policies and indexes
3. OpenAPI 3.0 API specification with all endpoints, schemas, and error responses
4. Developer quickstart guide for local environment setup
5. Constitutional compliance verification at both pre-design and post-design stages

**Implementation Ready**: All architectural decisions documented, trade-offs justified, and constitutional compliance verified. Proceed to task generation and implementation.

---

## Implementation Roadmap

### Overview

This section provides a **sequential, dependency-aware build order** for implementing the SMS Dashboard MVP. Each phase builds on the previous, with clear references to implementation details in research.md, data-model.md, openapi.yaml, and quickstart.md.

**Total Estimated Time**: 3.5-4.5 weeks (1 developer) - Reduced from 4-5 weeks after constitution-based simplifications

### Dependency Graph

```
Foundation Layer (Week 1)
├── Monorepo setup
├── Database schema + migrations
├── Shared types package
└── Base adapter interface

↓ (Foundation must be complete)

Service Layer (Week 2)
├── Auth service → uses Supabase Auth
├── Token service → uses database schema
├── Worker service → uses database schema
└── SMS service → uses worker service + token service

↓ (Services must be complete)

Integration Layer (Week 2-3)
├── Google Calendar adapter → uses token service
└── Plugin registry → uses base adapter

↓ (Integrations can run parallel with API)

API Layer (Week 3)
├── Auth routes → uses auth service
├── Worker routes → uses worker service + auth middleware
├── Integration routes → uses Google Calendar adapter
├── SMS routes → uses SMS service + auth middleware
└── Dashboard routes → uses token service + calendar service

↓ (API must be complete)

Frontend Layer (Week 4-5)
├── Admin dashboard → uses all API routes
└── Worker dashboard → uses dashboard route only
```

---

### Phase 0: Project Setup (Days 1-2)

**Goal**: Initialize monorepo, database, and development environment

#### Step 0.1: Initialize Turborepo Monorepo
**Reference**: `quickstart.md` Step 1  
**Files to Create**:
- `package.json` (root)
- `turbo.json`
- `pnpm-workspace.yaml`
- `.gitignore`
- `tsconfig.base.json`

**Commands**:
```bash
pnpm init
pnpm add -D turbo
pnpm add -D typescript @types/node
```

**Deliverable**: ✅ `pnpm install` works across monorepo

---

#### Step 0.2: Set Up Supabase Local Instance
**Reference**: `quickstart.md` Step 2  
**Reference**: `data-model.md` lines 1-50 (overview)

**Commands**:
```bash
npm install -g supabase
supabase init
supabase start
```

**Deliverable**: ✅ Supabase Studio accessible at http://localhost:54323

---

#### Step 0.3: Run Database Migrations
**Reference**: `data-model.md` lines 420-520 (Migration 001: Initial Schema)  
**Reference**: `data-model.md` lines 522-570 (Migration 002: RLS Policies)  
**Reference**: `data-model.md` lines 572-620 (Migration 003: Triggers & Functions)

**Files to Create**:
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_rls_policies.sql`
- `supabase/migrations/003_indexes.sql`
- `supabase/seed.sql`

**Commands**:
```bash
supabase db push
supabase db seed
```

**Verification**:
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- Should show: organizations, users, workers, data_sources, dashboard_tokens, sms_logs, access_logs
```

**Deliverable**: ✅ All 7 tables created with RLS policies and indexes

---

#### Step 0.4: Create Shared Types Package
**Reference**: `plan.md` lines 174-186 (packages/shared structure)  
**Reference**: `data-model.md` lines 53-400 (entity definitions)

**Files to Create**:
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/types/organization.ts`
- `packages/shared/src/types/user.ts`
- `packages/shared/src/types/worker.ts`
- `packages/shared/src/types/data-source.ts`
- `packages/shared/src/types/token.ts`
- `packages/shared/src/types/sms.ts`
- `packages/shared/src/types/schedule.ts`
- `packages/shared/src/constants/index.ts`
- `packages/shared/src/validators/worker.validator.ts` (Zod schemas)

**Example** (`packages/shared/src/types/worker.ts`):
```typescript
export interface Worker {
  id: string;
  organizationId: string;
  fullName: string;
  phoneNumber: string;
  calendarEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkerDTO {
  fullName: string;
  phoneNumber: string;
  calendarEmail?: string;
}
```

**Deliverable**: ✅ Shared types package builds and exports all types

---

#### Step 0.5: Create Base Adapter Interface
**Reference**: `research.md` lines 350-400 (Plugin Adapter Pattern)  
**Reference**: `plan.md` lines 197-212 (packages/plugins structure)

**Files to Create**:
- `packages/plugins/package.json`
- `packages/plugins/tsconfig.json`
- `packages/plugins/src/base/adapter.interface.ts`
- `packages/plugins/src/base/adapter.types.ts`

**Example** (`packages/plugins/src/base/adapter.interface.ts`):
```typescript
export interface IAdapter {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  
  initialize(config: AdapterConfig): Promise<void>;
  healthCheck(): Promise<HealthStatus>;
  validateConfig(config: unknown): config is AdapterConfig;
}

export interface IScheduleProvider extends IAdapter {
  getSchedule(req: ScheduleRequest): Promise<ScheduleItem[]>;
  getAuthUrl?(scopes: string[]): string;
  exchangeToken?(code: string): Promise<TokenSet>;
  refreshToken?(refreshToken: string): Promise<TokenSet>;
}
```

**Simplification Note**: Plugin registry deferred to post-MVP. With only one plugin (Google Calendar) in MVP, registry pattern is over-engineering. Adapter will be instantiated directly in calendar service. Registry will be added when 2nd plugin is implemented.

**Deliverable**: ✅ Base adapter interface defined and exportable

---

**Phase 0 Exit Criteria**: 
- ✅ Database running with all tables
- ✅ Shared types package builds
- ✅ Base adapter interface defined
- ✅ All apps scaffolded (empty but buildable)

---

### Phase 1: Core API - Authentication (Days 3-4)

**Goal**: Admin users can register, login, and access protected routes

**Dependencies**: Phase 0 complete

#### Step 1.1: Implement Auth Service
**Reference**: `research.md` lines 600-650 (Authentication Flow)  
**Reference**: `openapi.yaml` lines 42-120 (auth endpoints)

**File to Create**: `apps/api/src/services/auth.service.ts`

**Implementation**:
```typescript
import { createClient } from '@supabase/supabase-js';

export class AuthService {
  private supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  async register(email: string, password: string, orgName: string, fullName?: string) {
    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email,
      password,
    });
    
    // 2. Create organization
    const org = await this.createOrganization(orgName);
    
    // 3. Create user record
    const user = await this.createUser(authData.user.id, org.id, email, fullName);
    
    // 4. Generate JWT
    const token = await this.generateJWT({ userId: user.id, orgId: org.id });
    
    return { user, organization: org, accessToken: token };
  }
  
  async login(email: string, password: string) {
    // Reference: research.md lines 600-650
    // Implementation details...
  }
}
```

**Deliverable**: ✅ Auth service with register, login, getCurrentUser methods

---

#### Step 1.2: Implement Auth Middleware
**Reference**: `research.md` lines 130-160 (Tenant Middleware)  
**Reference**: `research.md` lines 900-950 (Security Considerations)

**File to Create**: `apps/api/src/middleware/auth.middleware.ts`

**Implementation**:
```typescript
import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } }, 401);
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = await verify(token, JWT_SECRET);
    
    // Set context for downstream handlers
    c.set('userId', payload.userId);
    c.set('orgId', payload.orgId);
    
    await next();
  } catch (error) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401);
  }
}
```

**Deliverable**: ✅ Auth middleware validates JWT and sets context

---

#### Step 1.3: Implement Tenant Middleware
**Reference**: `research.md` lines 130-160 (Tenant Context Flow)  
**Reference**: `data-model.md` lines 522-570 (RLS Policies)

**File to Create**: `apps/api/src/middleware/tenant.middleware.ts`

**Implementation**:
```typescript
export async function tenantMiddleware(c: Context, next: Next) {
  const orgId = c.get('orgId'); // Set by authMiddleware
  
  if (!orgId) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'No organization context' } }, 403);
  }
  
  // Set PostgreSQL session variable for RLS
  await db.query('SET app.tenant_id = $1', [orgId]);
  
  await next();
}
```

**Deliverable**: ✅ Tenant middleware sets RLS context

---

#### Step 1.4: Implement Auth Routes
**Reference**: `openapi.yaml` lines 42-120  
**Reference**: `plan.md` lines 151 (route structure)

**File to Create**: `apps/api/src/routes/auth.ts`

**Implementation**:
```typescript
import { Hono } from 'hono';
import { AuthService } from '../services/auth.service';

const auth = new Hono();
const authService = new AuthService();

auth.post('/register', async (c) => {
  const { email, password, organizationName, fullName } = await c.req.json();
  
  // Validate input
  // Call authService.register()
  // Return response per OpenAPI spec
});

auth.post('/login', async (c) => {
  // Reference: openapi.yaml lines 80-120
});

auth.get('/me', authMiddleware, async (c) => {
  // Reference: openapi.yaml lines 122-140
});

export default auth;
```

**Deliverable**: ✅ Auth routes implemented per OpenAPI spec

---

#### Step 1.5: Write Auth Tests
**Reference**: `research.md` section 10.2 (Integration Tests)

**File to Create**: `apps/api/tests/integration/auth.test.ts`

**Tests to Implement**:
- ✅ POST /auth/register - success case
- ✅ POST /auth/register - duplicate email
- ✅ POST /auth/login - success case
- ✅ POST /auth/login - invalid credentials
- ✅ GET /auth/me - with valid token
- ✅ GET /auth/me - with invalid token

**Deliverable**: ✅ All auth tests pass

---

**Phase 1 Exit Criteria**:
- ✅ Admin can register and create organization
- ✅ Admin can login and receive JWT
- ✅ Protected routes require valid JWT
- ✅ Tenant context set correctly
- ✅ All tests pass (90%+ coverage)

---

### Phase 2: Core API - Worker Management (Days 5-6)

**Goal**: Admins can CRUD workers with tenant isolation

**Dependencies**: Phase 1 complete (auth required)

#### Step 2.1: Implement Worker Service
**Reference**: `research.md` lines 700-750 (Worker CRUD)  
**Reference**: `data-model.md` lines 130-180 (Worker entity)

**File to Create**: `apps/api/src/services/worker.service.ts`

**Key Methods**:
```typescript
export class WorkerService {
  async getWorkers(orgId: string, pagination: PaginationParams) {
    // Reference: research.md section 8.2 (Query Patterns)
    // Reference: data-model.md lines 750-780 (Common Queries)
    // Uses RLS - query automatically filtered by orgId
  }
  
  async createWorker(orgId: string, data: CreateWorkerDTO) {
    // Reference: data-model.md lines 130-180 (validation rules)
    // Validate phone number using libphonenumber-js
  }
  
  async updateWorker(orgId: string, workerId: string, data: UpdateWorkerDTO) {
    // RLS ensures worker belongs to orgId
  }
  
  async deleteWorker(orgId: string, workerId: string) {
    // Cascade deletes dashboard_tokens, sets sms_logs.worker_id to NULL
  }
}
```

**Deliverable**: ✅ Worker service with full CRUD

---

#### Step 2.2: Implement Phone Number Validation
**Reference**: `research.md` section 9.2 (Input Validation)  
**Reference**: `data-model.md` lines 650-680 (Phone Number Validation)

**File to Create**: `packages/shared/src/validators/worker.validator.ts`

**Implementation**:
```typescript
import { z } from 'zod';
import { parsePhoneNumber } from 'libphonenumber-js';

export const CreateWorkerSchema = z.object({
  fullName: z.string().min(1).max(100),
  phoneNumber: z.string().refine((phone) => {
    try {
      const parsed = parsePhoneNumber(phone, 'AU');
      return parsed.isValid();
    } catch {
      return false;
    }
  }, { message: 'Invalid phone number format' }),
  calendarEmail: z.string().email().optional(),
});
```

**Deliverable**: ✅ Phone validation with Zod + libphonenumber-js

---

#### Step 2.3: Implement Worker Routes
**Reference**: `openapi.yaml` lines 122-250  
**Reference**: `plan.md` lines 152 (route structure)

**File to Create**: `apps/api/src/routes/workers.ts`

**Routes to Implement**:
- GET /workers (with pagination)
- POST /workers
- GET /workers/:id
- PATCH /workers/:id
- DELETE /workers/:id

**Deliverable**: ✅ All worker routes per OpenAPI spec

---

#### Step 2.4: Write Worker Tests
**Reference**: `research.md` section 10.2

**File to Create**: `apps/api/tests/integration/workers.test.ts`

**Tests to Implement**:
- ✅ Create worker - success
- ✅ Create worker - invalid phone
- ✅ List workers - pagination works
- ✅ Update worker - success
- ✅ Delete worker - cascades to tokens
- ✅ **Tenant isolation** - org A cannot access org B workers

**Deliverable**: ✅ All worker tests pass

---

**Phase 2 Exit Criteria**:
- ✅ Worker CRUD fully functional
- ✅ Phone number validation works
- ✅ Tenant isolation enforced (critical test)
- ✅ Pagination works correctly
- ✅ All tests pass (90%+ coverage)

---

### Phase 3: Token Service & Dashboard API (Days 7-8)

**Goal**: Generate secure dashboard tokens and validate them

**Dependencies**: Phase 2 complete (worker service required)

#### Step 3.1: Implement Token Service
**Reference**: `research.md` section 3 (Dashboard Token Security)  
**Reference**: `research.md` lines 170-220 (Token Generation Strategy)  
**Reference**: `data-model.md` lines 250-280 (Dashboard Token entity)

**File to Create**: `apps/api/src/services/token.service.ts`

**Key Methods**:
```typescript
export class TokenService {
  async generateDashboardToken(workerId: string, orgId: string, expiryHours: number) {
    // Reference: research.md lines 170-220
    // 1. Create JWT with { sub: workerId, orgId, exp }
    // 2. Hash JWT with SHA-256
    // 3. Store hash in dashboard_tokens table
    // 4. Return JWT
  }
  
  async validateDashboardToken(token: string) {
    // Reference: research.md lines 200-250 (Token Validation Flow)
    // 1. Verify JWT signature and expiry
    // 2. Check database for revocation
    // 3. Verify worker still exists
    // 4. Return { workerId, orgId }
  }
  
  async revokeToken(tokenId: string) {
    // Set revoked_at = NOW()
  }
}
```

**Deliverable**: ✅ Token service with generate, validate, revoke

---

#### Step 3.2: Implement Dashboard Route
**Reference**: `openapi.yaml` lines 450-500  
**Reference**: `research.md` lines 88-120 (Data Flow: Worker Views Dashboard)

**File to Create**: `apps/api/src/routes/dashboard.ts`

**Implementation**:
```typescript
dashboard.get('/', async (c) => {
  const token = c.req.query('token');
  
  // 1. Validate token (no auth middleware - token-based access)
  const { workerId, orgId } = await tokenService.validateDashboardToken(token);
  
  // 2. Get worker details
  const worker = await workerService.getWorker(orgId, workerId);
  
  // 3. Get organization's data sources
  const dataSources = await dataSourceService.getActive(orgId);
  
  // 4. Fetch schedule from plugins
  const scheduleItems = await calendarService.getSchedule(orgId, workerId, new Date());
  
  // 5. Log access
  await accessLogService.log(orgId, workerId, token, 'success');
  
  return c.json({
    data: {
      worker: { fullName: worker.fullName, phoneNumber: worker.phoneNumber },
      scheduleItems,
      organization: { name: org.name }
    }
  });
});
```

**Deliverable**: ✅ Dashboard route returns worker data + schedule

---

#### Step 3.3: Write Token Tests
**Reference**: `research.md` section 10.2

**File to Create**: `apps/api/tests/unit/token.service.test.ts`

**Tests to Implement**:
- ✅ Generate token - creates JWT and DB record
- ✅ Validate token - success case
- ✅ Validate token - expired token
- ✅ Validate token - revoked token
- ✅ Validate token - invalid signature
- ✅ Revoke token - sets revoked_at

**Deliverable**: ✅ All token tests pass

---

**Phase 3 Exit Criteria**:
- ✅ Dashboard tokens generate correctly
- ✅ Token validation works (JWT + DB check)
- ✅ Expired/revoked tokens rejected
- ✅ Dashboard route returns correct data
- ✅ All tests pass (95%+ coverage for token service)

---

### Phase 4: SMS Integration (Days 9-10)

**Goal**: Send dashboard links via SMS with delivery tracking

**Dependencies**: Phase 3 complete (token service required)

#### Step 4.1: Implement SMS Service
**Reference**: `research.md` section 4 (SMS Integration Architecture)  
**Reference**: `research.md` lines 280-320 (MobileMessage.au Integration)

**File to Create**: `apps/api/src/services/sms.service.ts`

**Implementation**:
```typescript
export class SMSService {
  async sendDashboardLink(workerId: string, orgId: string, message: string, expiryHours: number) {
    // Reference: research.md lines 62-86 (Data Flow: Admin Sends Dashboard Link)
    
    // 1. Get worker details
    const worker = await workerService.getWorker(orgId, workerId);
    
    // 2. Generate dashboard token
    const token = await tokenService.generateDashboardToken(workerId, orgId, expiryHours);
    
    // 3. Construct SMS message
    const dashboardUrl = `${WORKER_DASHBOARD_URL}/dashboard?token=${token}`;
    const fullMessage = message.replace('{name}', worker.fullName) + ` ${dashboardUrl}`;
    
    // 4. Send via MobileMessage.au
    const result = await this.sendSMS(worker.phoneNumber, fullMessage);
    
    // 5. Log SMS
    await smsLogService.create({
      organizationId: orgId,
      workerId,
      phoneNumber: worker.phoneNumber,
      messageContent: fullMessage,
      tokenId: token.id,
      status: result.status,
      providerMessageId: result.messageId,
    });
    
    return result;
  }
  
  private async sendSMS(phoneNumber: string, message: string) {
    // Reference: research.md lines 280-320
    // POST to MobileMessage.au API with Basic Auth
  }
}
```

**Deliverable**: ✅ SMS service sends messages and logs delivery

---

#### Step 4.2: Implement Rate Limiting
**Reference**: `research.md` section 4.3 (Rate Limiting Strategy)  
**Reference**: `research.md` lines 960-1000 (Rate Limiting Implementation)

**File to Create**: `apps/api/src/middleware/rate-limit.middleware.ts`

**Implementation**:
```typescript
// In-memory rate limiting with sliding window (MVP)
// Distributed rate limiting with Redis deferred to post-MVP
const rateLimits = new Map<string, { count: number; resetAt: Date }>();

export async function smsRateLimitMiddleware(c: Context, next: Next) {
  const orgId = c.get('orgId');
  const now = new Date();
  const limit = 100; // Default: 100 SMS/org/hour
  
  // Get or initialize rate limit entry
  let entry = rateLimits.get(orgId);
  
  // Reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: new Date(now.getTime() + 60 * 60 * 1000) };
    rateLimits.set(orgId, entry);
  }
  
  // Check limit
  if (entry.count >= limit) {
    return c.json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `SMS limit exceeded: ${entry.count}/${limit} per hour`,
      }
    }, 429);
  }
  
  // Increment counter
  entry.count++;
  
  await next();
}
```

**Simplification Note**: Using in-memory rate limiting as per approved trade-off #5. This eliminates database queries on every SMS request and avoids Redis dependency for MVP. Distributed rate limiting will be added post-MVP when scaling to multiple instances.

**Deliverable**: ✅ Rate limiting enforces SMS quota

---

#### Step 4.3: Implement SMS Routes
**Reference**: `openapi.yaml` lines 350-420

**File to Create**: `apps/api/src/routes/sms.ts`

**Routes to Implement**:
- POST /sms/send (single worker)
- POST /sms/send-bulk (multiple workers)

**Deliverable**: ✅ SMS routes per OpenAPI spec

---

#### Step 4.4: Write SMS Tests
**File to Create**: `apps/api/tests/integration/sms.test.ts`

**Tests to Implement**:
- ✅ Send SMS - success (sandbox mode)
- ✅ Send SMS - rate limit exceeded
- ✅ Send SMS - invalid phone number
- ✅ Send bulk SMS - partial success
- ✅ SMS log created with correct status

**Deliverable**: ✅ All SMS tests pass

---

**Phase 4 Exit Criteria**:
- ✅ SMS sends successfully via MobileMessage.au
- ✅ Dashboard links included in SMS
- ✅ Rate limiting enforced
- ✅ SMS logs track delivery status
- ✅ All tests pass

---

### Phase 5: Google Calendar Integration (Days 11-13)

**Goal**: Connect Google Calendar and fetch worker schedules

**Dependencies**: Phase 0 (base adapter), Phase 3 (token service for OAuth)

#### Step 5.1: Implement Google Calendar Adapter
**Reference**: `research.md` section 5 (Google Calendar Plugin Architecture)  
**Reference**: `research.md` lines 400-500 (Google Calendar Adapter)

**File to Create**: `packages/plugins/src/google-calendar/calendar.adapter.ts`

**Implementation**: See research.md lines 400-500 for full implementation

**Deliverable**: ✅ Google Calendar adapter implements IScheduleProvider

---

#### Step 5.2: Implement OAuth Handler
**Reference**: `research.md` section 5.2 (OAuth Flow)  
**Reference**: `research.md` lines 520-580 (OAuth Flow diagram)

**File to Create**: `packages/plugins/src/google-calendar/oauth.handler.ts`

**Methods**:
- getAuthUrl() - Generate Google OAuth consent URL
- exchangeToken() - Exchange code for access/refresh tokens
- refreshToken() - Refresh expired access token

**Deliverable**: ✅ OAuth flow complete

---

#### Step 5.3: Implement Integration Routes
**Reference**: `openapi.yaml` lines 252-348

**File to Create**: `apps/api/src/routes/integrations.ts`

**Routes to Implement**:
- GET /integrations (list connections)
- GET /integrations/google-calendar/auth-url
- POST /integrations/google-calendar/callback
- DELETE /integrations/:id

**Deliverable**: ✅ Integration routes per OpenAPI spec

---

#### Step 5.4: Implement Calendar Service with Data Source Management
**Reference**: `data-model.md` lines 180-220 (Data Source entity)

**File to Create**: `apps/api/src/services/calendar.service.ts`

**Methods**:
- saveConnection() - Store OAuth tokens (encrypted) in data_sources table
- getConnection() - Get active Google Calendar connection for org
- disconnect() - Remove connection and tokens
- getSchedule() - Fetch calendar events using Google Calendar adapter

**Simplification Note**: Data source CRUD merged into calendar service for MVP. With only one plugin (Google Calendar), a separate data source service adds unnecessary abstraction. Service layer will be extracted when 2nd plugin is added post-MVP.

**Deliverable**: ✅ Calendar service manages connections and fetches schedules

---

#### Step 5.5: Write Integration Tests
**File to Create**: `apps/api/tests/integration/integrations.test.ts`

**Tests to Implement**:
- ✅ Get auth URL - returns valid Google OAuth URL
- ✅ OAuth callback - exchanges code for tokens
- ✅ OAuth callback - stores encrypted tokens
- ✅ Fetch calendar events - returns schedule items
- ✅ Token refresh - auto-refreshes expired tokens
- ✅ Disconnect - removes tokens

**Deliverable**: ✅ All integration tests pass

---

**Phase 5 Exit Criteria**:
- ✅ Google Calendar OAuth flow works
- ✅ Calendar events fetched successfully
- ✅ OAuth tokens stored encrypted
- ✅ Token refresh works automatically
- ✅ All tests pass

---

### Phase 6: Logging & Monitoring (Days 14-15)

**Goal**: Implement SMS logs and access logs retrieval

**Dependencies**: Phase 4 (SMS service), Phase 3 (dashboard route)

#### Step 6.1: Implement Log Routes
**Reference**: `openapi.yaml` lines 502-600

**File to Create**: `apps/api/src/routes/logs.ts`

**Routes to Implement**:
- GET /logs/sms (with filters: workerId, status, dateRange)
- GET /logs/access (with filters: workerId, validationStatus, dateRange)

**Deliverable**: ✅ Log routes with pagination and filtering

---

#### Step 6.2: Implement Structured Logging
**Reference**: `research.md` section 14.1 (Structured Logging)

**File to Create**: `apps/api/src/lib/logger.ts`

**Implementation**:
```typescript
// Simple structured JSON logger (MVP)
// Advanced logging library (Pino/Winston) deferred to post-MVP
type LogContext = Record<string, unknown>;

export const logger = {
  info: (context: LogContext, message: string) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...context,
    }));
  },
  
  error: (context: LogContext, message: string, error?: Error) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      error: error?.message,
      stack: error?.stack,
      ...context,
    }));
  },
  
  warn: (context: LogContext, message: string) => {
    console.warn(JSON.stringify({
      level: 'warn',
      timestamp: new Date().toISOString(),
      message,
      ...context,
    }));
  },
};

// Usage:
logger.info({
  requestId: 'req_abc123',
  orgId: 'org-456',
  userId: 'user-789',
  action: 'send_sms',
  workerId: 'worker-123',
  duration: 234,
}, 'SMS sent successfully');
```

**Simplification Note**: Using simple JSON console logger for MVP. This meets constitutional requirement for structured logging with tenant context while avoiding external dependencies. Advanced logging libraries (Pino, Winston) with features like log rotation, transports, and sampling will be added post-MVP when needed.

**Deliverable**: ✅ Structured logging with tenant context

---

**Phase 6 Exit Criteria**:
- ✅ Admins can view SMS delivery logs
- ✅ Admins can view dashboard access logs
- ✅ Logs filterable by worker, date, status
- ✅ Structured logging implemented
- ✅ All tests pass

---

### Phase 7: Admin Frontend (Days 16-20)

**Goal**: Build admin dashboard UI

**Dependencies**: All API phases complete

#### Step 7.1: Set Up Admin App Structure
**Reference**: `plan.md` lines 116-131 (admin app structure)  
**Reference**: `research.md` section 7.1 (Admin Dashboard)

**Files to Create**:
- `apps/admin/src/main.tsx`
- `apps/admin/src/App.tsx`
- `apps/admin/vite.config.ts`
- `apps/admin/tailwind.config.ts`
- `apps/admin/package.json`

**Install Dependencies**:
```bash
cd apps/admin
pnpm add react react-dom react-router-dom
pnpm add @tanstack/react-query zustand
pnpm add -D vite @vitejs/plugin-react typescript
```

**Deliverable**: ✅ Admin app builds and runs

---

#### Step 7.2: Implement Auth Pages
**Reference**: `research.md` lines 800-850 (Frontend Architecture)

**Files to Create**:
- `apps/admin/src/pages/LoginPage.tsx`
- `apps/admin/src/pages/RegisterPage.tsx`
- `apps/admin/src/stores/auth.store.ts` (Zustand)
- `apps/admin/src/services/api-client.ts`

**Deliverable**: ✅ Login and register pages functional

---

#### Step 7.3: Implement Worker Management Pages
**Reference**: `research.md` lines 850-900

**Files to Create**:
- `apps/admin/src/pages/WorkersPage.tsx` (list)
- `apps/admin/src/pages/WorkerDetailPage.tsx` (view/edit)
- `apps/admin/src/components/WorkerForm.tsx`
- `apps/admin/src/hooks/useWorkers.ts` (TanStack Query)

**Deliverable**: ✅ Worker CRUD UI complete

---

#### Step 7.4: Implement Integration Pages
**Files to Create**:
- `apps/admin/src/pages/IntegrationsPage.tsx`
- `apps/admin/src/components/GoogleCalendarConnect.tsx`

**Deliverable**: ✅ Google Calendar connection UI

---

#### Step 7.5: Implement SMS & Logs Pages
**Files to Create**:
- `apps/admin/src/pages/SMSLogsPage.tsx`
- `apps/admin/src/pages/AccessLogsPage.tsx`
- `apps/admin/src/components/SendSMSModal.tsx`

**Deliverable**: ✅ SMS sending and log viewing UI

---

**Phase 7 Exit Criteria**:
- ✅ Admin can login/register
- ✅ Admin can manage workers
- ✅ Admin can connect Google Calendar
- ✅ Admin can send SMS
- ✅ Admin can view logs
- ✅ UI is responsive and uses shadcn/ui

---

### Phase 8: Worker Frontend (Days 21-22)

**Goal**: Build mobile-optimized worker dashboard

**Dependencies**: Phase 3 (dashboard API)

#### Step 8.1: Set Up Worker App
**Reference**: `plan.md` lines 133-146 (worker app structure)  
**Reference**: `research.md` section 7.2 (Worker Dashboard)

**Files to Create**:
- `apps/worker/src/main.tsx`
- `apps/worker/src/App.tsx`
- `apps/worker/vite.config.ts`
- `apps/worker/tailwind.config.ts`

**Deliverable**: ✅ Worker app builds and runs

---

#### Step 8.2: Implement Dashboard Page
**Reference**: `research.md` lines 900-950 (Mobile Optimizations)

**File to Create**: `apps/worker/src/pages/DashboardPage.tsx`

**Implementation**:
```typescript
function DashboardPage() {
  const token = useTokenFromURL();
  const { data, isLoading, error } = useDashboardData(token);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <WorkerHeader worker={data.worker} />
      <ScheduleList items={data.scheduleItems} />
    </div>
  );
}
```

**Mobile Optimizations**:
- Touch targets ≥44px
- Font sizes ≥16px
- No horizontal scroll
- Bundle size <300KB

**Deliverable**: ✅ Worker dashboard displays schedule

---

#### Step 8.3: Implement Error Pages
**Files to Create**:
- `apps/worker/src/pages/TokenExpiredPage.tsx`
- `apps/worker/src/pages/TokenInvalidPage.tsx`
- `apps/worker/src/pages/ErrorPage.tsx`

**Deliverable**: ✅ User-friendly error messages

---

**Phase 8 Exit Criteria**:
- ✅ Worker can access dashboard via SMS link
- ✅ Schedule displays correctly on mobile
- ✅ Error messages are user-friendly
- ✅ UI is mobile-optimized
- ✅ Bundle size <300KB

---

### Phase 9: Testing & Polish (Days 23-25)

**Goal**: Achieve test coverage targets and fix bugs

#### Step 9.1: Complete Test Coverage
**Reference**: `research.md` section 10 (Testing Strategy)

**Coverage Targets**:
- API routes: 90%+
- React components: 85%+
- Utility functions: 95%+

**Commands**:
```bash
pnpm test:coverage
```

**Deliverable**: ✅ All coverage targets met

---

#### Step 9.2: E2E Testing
**Reference**: `research.md` section 10.2 (E2E Tests)

**File to Create**: `apps/worker/tests/e2e/dashboard.spec.ts`

**Tests to Implement**:
- ✅ Worker opens SMS link and views dashboard
- ✅ Dashboard displays schedule items
- ✅ Mobile viewport works correctly
- ✅ Expired token shows error message

**Deliverable**: ✅ E2E tests pass

---

#### Step 9.3: Performance Testing
**Reference**: `research.md` section 13 (Performance Optimization)

**Tests**:
- ✅ API p99 <500ms
- ✅ Dashboard load <2s on 3G
- ✅ Bundle sizes: Admin <500KB, Worker <300KB

**Deliverable**: ✅ Performance targets met

---

**Phase 9 Exit Criteria**:
- ✅ All tests pass
- ✅ Coverage targets met
- ✅ Performance targets met
- ✅ No critical bugs

---

### Phase 10: Deployment (Days 26-28)

**Goal**: Deploy to production

#### Step 10.1: Set Up Production Supabase
**Reference**: `quickstart.md` Step 2 (Option B)

**Tasks**:
- Create production Supabase project
- Run migrations
- Configure RLS policies
- Set up backups

**Deliverable**: ✅ Production database ready

---

#### Step 10.2: Deploy API to Vercel
**Reference**: `research.md` section 11 (Deployment Strategy)

**Tasks**:
- Configure environment variables
- Deploy Hono API as Vercel serverless function
- Test API endpoints

**Deliverable**: ✅ API deployed and accessible

---

#### Step 10.3: Deploy Frontends to Vercel
**Tasks**:
- Deploy admin dashboard
- Deploy worker dashboard
- Configure custom domains

**Deliverable**: ✅ Frontends deployed

---

#### Step 10.4: Configure Production Services
**Tasks**:
- Set up MobileMessage.au production account
- Configure Google OAuth production credentials
- Set up monitoring and alerts

**Deliverable**: ✅ All services configured

---

**Phase 10 Exit Criteria**:
- ✅ All apps deployed to production
- ✅ End-to-end flow works in production
- ✅ Monitoring and alerts configured
- ✅ Documentation updated

---

## Quick Reference: Where to Find Implementation Details

| What You're Building | Primary Reference | Supporting References |
|----------------------|-------------------|----------------------|
| **Database Schema** | `data-model.md` lines 420-620 | `research.md` section 8 |
| **Auth System** | `research.md` lines 600-650 | `openapi.yaml` lines 42-120 |
| **Worker CRUD** | `research.md` lines 700-750 | `openapi.yaml` lines 122-250, `data-model.md` lines 130-180 |
| **Token Service** | `research.md` section 3 (lines 90-250) | `data-model.md` lines 250-280 |
| **SMS Integration** | `research.md` section 4 (lines 260-380) | `openapi.yaml` lines 350-420 |
| **Google Calendar** | `research.md` section 5 (lines 390-580) | `openapi.yaml` lines 252-348, `data-model.md` lines 180-220 |
| **Dashboard API** | `research.md` lines 88-120 | `openapi.yaml` lines 450-500 |
| **Admin Frontend** | `research.md` section 7.1 (lines 750-850) | `plan.md` lines 116-131 |
| **Worker Frontend** | `research.md` section 7.2 (lines 850-950) | `plan.md` lines 133-146 |
| **Testing** | `research.md` section 10 (lines 1050-1200) | All sections have test examples |
| **Deployment** | `research.md` section 11 (lines 1250-1350) | `quickstart.md` all steps |

---

## Implementation Checklist

Use this checklist to track progress:

### Foundation
- [ ] Monorepo initialized
- [ ] Database migrations run
- [ ] Shared types package created
- [ ] Base adapter interface defined

### API - Core
- [ ] Auth service implemented
- [ ] Auth routes implemented
- [ ] Worker service implemented
- [ ] Worker routes implemented
- [ ] Token service implemented
- [ ] Dashboard route implemented

### API - Integrations
- [ ] SMS service implemented
- [ ] SMS routes implemented
- [ ] Google Calendar adapter implemented
- [ ] Integration routes implemented
- [ ] Log routes implemented

### Frontend
- [ ] Admin app - Auth pages
- [ ] Admin app - Worker pages
- [ ] Admin app - Integration pages
- [ ] Admin app - SMS & logs pages
- [ ] Worker app - Dashboard page
- [ ] Worker app - Error pages

### Testing & Deployment
- [ ] Unit tests (90%+ API, 95%+ utils)
- [ ] Integration tests (85%+ React)
- [ ] E2E tests (critical paths)
- [ ] Performance tests (targets met)
- [ ] Production deployment
- [ ] Monitoring configured

---

**Total Estimated Time**: 3.5-4.5 weeks for 1 developer (reduced from 4-5 weeks)  
**Critical Path**: Foundation → Auth → Workers → Tokens → SMS → Calendar → Dashboard API → Frontends

---

## Constitution-Based Simplifications Applied

This plan was reviewed against `.specify/memory/constitution.md` and simplified to remove over-engineered components while maintaining all constitutional requirements:

### Simplifications Made

1. **Plugin Registry Removed (Phase 0.5)**
   - **Before**: Full adapter registry system with registration, lookup, and lifecycle management
   - **After**: Base adapter interface only, direct instantiation in calendar service
   - **Rationale**: MVP has only 1 plugin (Google Calendar). Registry is YAGNI until 2nd plugin.
   - **Time Saved**: ~0.5 days

2. **In-Memory Rate Limiting (Phase 4.2)**
   - **Before**: Database-based rate limiting with queries on every SMS request
   - **After**: In-memory Map with sliding window
   - **Rationale**: Aligns with approved trade-off #5. Eliminates DB queries and Redis dependency.
   - **Time Saved**: ~0.5 days

3. **Data Source Service Merged (Phase 5.4)**
   - **Before**: Separate data source service layer for connection management
   - **After**: Data source CRUD merged into calendar service
   - **Rationale**: With 1 plugin, separate service adds unnecessary abstraction. Extract when 2nd plugin added.
   - **Time Saved**: ~0.5 days

4. **Simple JSON Logger (Phase 6.2)**
   - **Before**: Pino logging library with advanced features
   - **After**: Simple JSON console logger
   - **Rationale**: Meets structured logging requirement without external dependencies. Advanced features deferred.
   - **Time Saved**: ~0.5 days

### Constitutional Compliance Maintained

✅ **All 10 Core Principles**: Mobile-first, secure tokens, plugin architecture, SMS-first, simple admin UX, observability, code quality, testing, UX consistency, performance  
✅ **Technology Stack**: No changes to fixed stack (Vite, React, Hono, Supabase, Turborepo)  
✅ **MVP Scope Discipline**: All simplifications defer complexity to post-MVP  
✅ **Quality Gates**: Test coverage targets, mobile testing, security requirements unchanged

### Post-MVP Migration Path

- **Plugin Registry**: Add when implementing 2nd plugin (Airtable/Notion)
- **Distributed Rate Limiting**: Add Redis-based rate limiting when scaling to multiple instances
- **Data Source Service**: Extract service layer when 2nd plugin requires abstraction
- **Advanced Logging**: Add Pino/Winston when log rotation, transports, or sampling needed

**Net Result**: Simpler, faster MVP implementation with clear upgrade path for production scale.
