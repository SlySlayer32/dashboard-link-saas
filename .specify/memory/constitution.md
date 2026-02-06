# CleanConnect — Development Constitution v2.0.0

> Non-negotiable rules guiding all code, design, and AI-agent decisions.
> Detailed implementation examples live in `docs/` and feature `plan.md` files — not here.

---

## 1. Core Principles

1. **Multi-Tenant Isolation** — Every DB query MUST be scoped by `organization_id`. Enforced via Supabase RLS + application-layer checks.
2. **Mobile-First** — Worker dashboards MUST be optimised for phone screens (touch targets ≥44px, base font ≥16px).
3. **Plugin Extensibility** — All external integrations MUST implement the `IAdapter` interface and be registered in the `PluginRegistry`.
4. **Security by Default** — Secrets in env vars only; JWT validated on every request; never expose internal errors to clients.
5. **Type Safety** — TypeScript `strict: true` everywhere; no `any` without `@ts-expect-error` + justification.
6. **Explicit Error Handling** — No empty catch blocks; categorise errors as transient vs permanent; use structured error responses (RFC 7807).

---

## 2. Code Quality

- **TypeScript strict mode** (`strict`, `noUncheckedIndexedAccess`, `noImplicitReturns`) in all `tsconfig.json`.
- **Explicit return types** on all exported functions.
- **Functions ≤50 lines**; files ≤500 lines.
- **Named exports** only (no default exports except Vite entry points).
- **SOLID principles**; dependency injection for DB, cache, and queue clients.
- **JSDoc** on all public functions with `@param`, `@returns`, `@throws`.
- **Zod validation** on every API endpoint (body, query, path params).

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Component | `PascalCase.tsx` | `WorkerDashboard.tsx` |
| Utility | `camelCase.ts` | `formatPhoneNumber.ts` |
| Types | `PascalCase.types.ts` | `Worker.types.ts` |
| Test | `*.test.ts` / `*.spec.ts` | `auth.test.ts` |

---

## 3. Security & Multi-Tenancy

### Tenant Isolation (CRITICAL)

- **Database**: Supabase RLS on ALL tenant-scoped tables with `organization_id` filter.
- **Application**: Extract `org_id` from JWT; pass as query filter (defense-in-depth).
- **Cache**: Namespace Redis keys as `{entity}:{tenantId}:{id}`.

### Authentication

- **Admin**: Email/password → Supabase Auth → JWT (access 15min, refresh 7d).
- **Worker**: Tokenised URL → no login (dashboard token 1–24hr, configurable per org).
- JWT MUST contain `sub`, `org_id`, `role`, `exp`, `jti` (revocation).
- Validate signature, expiry, and tenant match on every request.

### Secrets

- All secrets in environment variables; `.env` files never committed.
- `.env.example` with dummy values for documentation.
- Never log secrets, full phone numbers, or raw JWTs.

---

## 4. Architecture

### Tech Stack (Fixed)

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React 18 + shadcn/ui + Tailwind + Zustand + TanStack Query |
| API | Hono.js (TypeScript) |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| SMS | MobileMessage.com.au (Basic Auth) |
| Monorepo | Turborepo + pnpm |

### Repo Structure

```
apps/admin/    — Admin dashboard (Vite + React)
apps/worker/   — Worker mobile dashboard (Vite + React)
apps/api/      — Hono.js API
packages/shared/   — Shared types & utilities
packages/plugins/  — Plugin adapter system
packages/auth/     — Auth helpers
packages/database/ — DB client & migrations
```

### Plugin Contract (Minimal)

Every adapter MUST implement: `initialize`, `healthCheck`, `shutdown`, `validateConfig`, `getConfigSchema`.
Schedule providers additionally implement `getSchedule`.
Adapters MUST return standardised `AdapterError` with `code`, `message`, `retryable`.

### API Design

- RESTful: `GET/POST/PUT/PATCH/DELETE /api/v1/{resource}`.
- Standard envelope: `{ data, meta?: { pagination, requestId }, links? }`.
- Error format: RFC 7807 (`type`, `title`, `status`, `detail`, `instance`).
- Cursor-based pagination (never offset-based).
- HTTP status codes: 200/201/204/400/401/403/404/429/500/503.

---

## 5. Error Handling

- External API calls MUST have timeouts (30s default) and retry with exponential backoff (max 3–5 attempts).
- Categorise errors: network/429/5xx → transient (retry); 400/401/403 → permanent (fail fast).
- When external service is unavailable, return cached data with `stale: true` flag, or queue for later.
- Never expose stack traces or internal messages to API consumers.

---

## 6. Testing

| Scope | Coverage Target | What to Test |
|-------|----------------|-------------|
| Unit | 80% minimum | Business logic, validation schemas, utilities, adapters (mocked) |
| Integration | Key flows | API endpoints, DB operations (test DB) |
| E2E | Critical paths | Sign up → create worker → send SMS → view dashboard |

- Use Vitest (configured in `vitest.workspace.ts`).
- Test files co-located or in `tests/` per package.

---

## 7. Database

- Supabase migrations in `supabase/migrations/` (SQL, timestamped).
- RLS policies on: `organizations`, `workers`, `plugins`, `sms_logs`, `dashboards`.
- Indexes on `organization_id`, `created_at`, `status` for all tenant-scoped tables.
- Avoid N+1 queries; use joins or batch fetches.
- Result set limits: default 20, max 100.
- GDPR: soft-delete with 30-day retention, then anonymise/hard-delete.

---

## 8. Observability

- Structured JSON logs with: `timestamp`, `level`, `message`, `service`, `requestId`, `tenantId`.
- Log all HTTP requests, errors (with stack), external API calls, and security events.
- Never log: passwords, API keys, full phone numbers, raw JWTs.

---

## 9. Forbidden Patterns

1. DB query without `organization_id` scope.
2. `any` type without `@ts-expect-error` justification.
3. Hardcoded secrets or credentials.
4. Exposing internal error messages to API consumers.
5. Offset-based pagination.
6. Empty catch blocks.
7. `console.log` in production code paths (use structured logger).

---

## 10. MVP vs Future Scope

Rules above apply at **all phases**. The following are **deferred until post-MVP** (do NOT implement for V1):

- BullMQ job queues (MVP uses synchronous SMS sending)
- Circuit breakers (MVP uses simple try/catch + timeout)
- Prometheus metrics & SLO monitoring
- Redis caching layers
- Blue/green & canary deployments
- S3/Glacier log archival
- Distributed tracing (OpenTelemetry)
- Webhook push processing
- Resource quota enforcement per plan tier

When these are needed, add them as feature specs via `/speckit.specify` — not by expanding this constitution.

---

## Pre-Commit Checklist

- [ ] TypeScript strict, no untyped code
- [ ] All queries scoped by `organization_id`
- [ ] All endpoints validated with Zod
- [ ] Secrets in env vars only
- [ ] Structured logging, no `console.log`
- [ ] Tests passing
- [ ] No forbidden patterns

---

*Living document. Propose changes via PR. For implementation details, see `docs/` and feature plan files.*
