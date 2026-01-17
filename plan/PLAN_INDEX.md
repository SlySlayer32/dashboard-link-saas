# CleanConnect Plan Index

> **For MVP builders**: Focus on plan/1 and plan/2 only. Plans 3-8 are post-MVP.

## How to use
- **Start with**: [docs/MVP_QUICKSTART.md](../docs/MVP_QUICKSTART.md) for the big picture
- **Then follow**: plan/1 → plan/2 (Foundation + Core Flows = MVP)
- **Defer**: plan/future/* until after revenue/traction
- Follow Zapier-style layering (core → contracts → adapters) and shared types
- Keep vendor SDKs in adapters only; routes call services and contracts

---

## 🚀 MVP SCOPE (Build This First)

### 1) Foundation Setup (Local Dev Works)
**Time**: 30-60 minutes  
**Goal**: Get all apps running locally with Supabase

- [plan/1/AREA_FOUNDATION_SETUP.md](1/AREA_FOUNDATION_SETUP.md)
- [plan/1/PLAYBOOK_FOUNDATION_SETUP.md](1/PLAYBOOK_FOUNDATION_SETUP.md)
- [docs/SETUP_CHECKLIST.md](../docs/SETUP_CHECKLIST.md)
- [ENV.example](../ENV.example)

**Success**: Admin/Worker/API all boot, Supabase connected, migrations run

---

### 2) Core User Flows (Build the Thin Slice)
**Time**: 2-3 weeks  
**Goal**: Admin → Google Calendar → SMS → Worker dashboard

- [plan/2/AREA_CORE_USER_FLOWS.md](2/AREA_CORE_USER_FLOWS.md)
- [plan/2/PLAYBOOK_USER_FLOWS.md](2/PLAYBOOK_USER_FLOWS.md)
- [docs/V1_IMPLEMENTATION_CHECKLIST.md](../docs/V1_IMPLEMENTATION_CHECKLIST.md)

**Features**:
- Admin UI: login, workers CRUD, Google Calendar OAuth, send SMS
- API: auth, workers, organizations, plugin-manager, tokens, SMS
- Worker UI: mobile dashboard with today's schedule
- Google Calendar adapter (OAuth-based, read-only)

**Success**: End-to-end flow works - admin sends SMS, worker sees schedule

---

## 🔮 POST-MVP (Defer Until Revenue)

### 3) Connectors & Service Boundaries
**When**: After 10+ paying organizations  
**What**: Airtable, Notion, custom API connectors

- [plan/future/3/BACKEND_SERVICES.md](future/3/BACKEND_SERVICES.md)
- [plan/future/3/PLAYBOOK_CONNECTORS.md](future/3/PLAYBOOK_CONNECTORS.md)

---

### 4) Data Infrastructure Foundations
**When**: Data quality issues surface  
**What**: Schema versioning, invariants, replay safety

- [plan/future/4/DATA_INFRA.md](future/4/DATA_INFRA.md)
- [plan/future/4/PLAYBOOK_DATA_INFRA.md](future/4/PLAYBOOK_DATA_INFRA.md)

---

### 5) Reliability + Async Processing
**When**: SMS delivery becomes bottleneck (>1000/day)  
**What**: BullMQ queues, retries, dead letter queues, circuit breakers

- [plan/future/5/AREA_PLATFORM_RELIABILITY_ASYNC.md](future/5/AREA_PLATFORM_RELIABILITY_ASYNC.md)
- [plan/future/5/PLAYBOOK_PLATFORM_RELIABILITY_ASYNC.md](future/5/PLAYBOOK_PLATFORM_RELIABILITY_ASYNC.md)

**See also**: [docs/ARCHITECTURE_FUTURE_STATE.md](../docs/ARCHITECTURE_FUTURE_STATE.md) for enterprise patterns

---

### 6) Security + QA
**When**: Preparing for SOC2/compliance  
**What**: Enhanced RLS policies, audit logging, GDPR compliance

- [plan/future/6/AREA_SECURITY_DATA_LIFECYCLE.md](future/6/AREA_SECURITY_DATA_LIFECYCLE.md)
- [plan/future/6/PLAYBOOK_SECURITY_DATA_LIFECYCLE.md](future/6/PLAYBOOK_SECURITY_DATA_LIFECYCLE.md)

---

### 7) Deployment, Billing, Ops
**When**: First paying customer ready  
**What**: Production deployment, Stripe integration, usage quotas

- [plan/future/7/AREA_DEPLOYMENT_BILLING_OPS.md](future/7/AREA_DEPLOYMENT_BILLING_OPS.md)
- [plan/future/7/PLAYBOOK_DEPLOYMENT_BILLING_OPS.md](future/7/PLAYBOOK_DEPLOYMENT_BILLING_OPS.md)

---

### 8) Decisions Log
**When**: Facing architectural ambiguity  
**What**: Document tradeoffs and decisions

- [plan/future/8/NEEDS_DECISIONS.md](future/8/NEEDS_DECISIONS.md)
- [plan/future/8/PLAYBOOK_DECISIONS.md](future/8/PLAYBOOK_DECISIONS.md)

---

## Global Constraints (All Plans)

- **TypeScript everywhere**: ESM modules, strict mode enabled
- **Validation**: Zod for all inputs (API routes, forms, adapters)
- **Shared types**: Prefer types from `@dashboard-link/shared`
- **Vendor isolation**: SDK calls ONLY in `packages/*/src` adapters, never in routes/UI
- **API response shape**: Always return `{ success, data, error }` with stable error codes
- **Multi-tenant**: Every query/service method scoped by `organizationId`
- **Security**: Token expiry enforced, RLS policies as backstop

---

## V1 Acceptance Criteria (Definition of Done)

**Functional**:
- ✅ Admin can log in, manage workers, connect Google Calendar
- ✅ Admin can send SMS link to worker
- ✅ Worker receives SMS, clicks link, sees today's schedule
- ✅ Expired/invalid tokens show friendly error message
- ✅ No placeholder logic in critical paths (no TODOs blocking MVP)

**Quality**:
- ✅ API tests pass: `pnpm --filter @dashboard-link/api test`
- ✅ No TypeScript errors: `pnpm typecheck`
- ✅ Manual smoke test completes successfully

**Deployment**:
- ✅ Environment variables documented in `ENV.example`
- ✅ Database migrations run cleanly on fresh database
- ✅ Supabase RLS policies deployed

---

## Migration Notes

### 2026-01-17: MVP Focus Reorganization
- Moved plan/3-8 to plan/future/ to clarify MVP vs post-MVP scope
- Consolidated PROJECT_FOUNDATION + V1_CHECKLIST into MVP_QUICKSTART.md
- Reduced AGENTS.md files from 53 to 8 (deleted deeply nested ones)
- Archived legacy docs (ARCHITECTURE_BLUEPRINT_OLD, CORE_INFRA_PLAN, RESEARCH_SUMMARY)

### 2026-01-10: Phase → Area Migration  
- Phase-based plan files in `plan/PHASE_*.md` were superseded by area-based plans and removed
