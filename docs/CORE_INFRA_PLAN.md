# Full Project Plan (V1)

Intent: deliver the V1 SaaS aligned to the architecture blueprint with a tight scope: Google Calendar as the only plugin and synchronous SMS delivery. The plan prioritizes core contracts, end-to-end flow, and launch readiness.

## Working docs
- `docs/SETUP_CHECKLIST.md` (local setup and environment validation)
- `docs/V1_IMPLEMENTATION_CHECKLIST.md` (step-by-step V1 build checklist + manual smoke test)

## Solo founder execution rules
- Keep V1 tiny: Google Calendar only, synchronous SMS only.
- Do not start Phase 2/3 until Phase 1 acceptance criteria pass.
- If you are unsure, implement the contract first, then the adapter.

## Scope
- In: V1 core (auth, data, org/worker, Google Calendar, synchronous SMS, onboarding, worker dashboard, tests, launch ops). Phase 2/3 items are documented here but intended for post-V1.
- Out: marketing site, multi-region DR beyond baseline, ML/anomaly detection, service mesh.

## Action items (checklist)

### Phase 1: Core wiring + happy path (V1)
- [ ] Implement `createAuthService` in `packages/auth` using Supabase client while keeping a clean `AuthProvider` contract for future providers.
- [ ] Align auth contract shapes so `apps/api/src/middleware/auth.ts` and `apps/api/src/routes/auth.ts` use consistent return types.
- [ ] Wire the Supabase database adapter and replace repository CRUD stubs in `packages/database/src/repositories/*`.
- [ ] Add admin/org resolution (repo or service) so `organizationId` is derived from `auth_user_id` and remove placeholder logic in `apps/api/src/routes/workers.ts` and `apps/api/src/routes/organizations.ts`.
- [ ] Implement the Google Calendar adapter end-to-end and make it the single plugin for V1 (config + validation + health checks).
- [ ] Implement a plugin manager service in `apps/api/src/services/plugin-manager.ts` (or update imports) to aggregate schedule/tasks.
- [ ] Wire synchronous SMS delivery: `POST /sms/send-dashboard-link` with token creation and SMS send.
- [ ] Build admin onboarding and core screens: org setup, workers CRUD, Google Calendar config, SMS send/logs.
- [ ] Validate worker dashboard flow: token validation, schedule/tasks display, expired/invalid token UX.
- [ ] Prepare launch checklist: env vars, migrations, seed data, monitoring basics, and deploy verification.

### Phase 1.5: Quality + stability (V1 hardening)
- [ ] Add API tests for auth, workers, dashboards, SMS, and Google Calendar adapter unit tests.

### Phase 2: Async + webhooks + observability
- [ ] Add async queues (BullMQ + Redis), retry/backoff, DLQ, and worker processes for SMS + webhooks.
- [ ] Implement webhook security (HMAC verification + idempotency), event storage, and replay UI.
- [ ] Add observability (structured logs, metrics, tracing), SLI/SLO tracking, and alerting.
- [ ] Security hardening (tenant rate limits, audit logging, app-layer RLS enforcement, secret management).
- [ ] Data lifecycle (retention/archival, GDPR delete/anonymize workflows, backups + RTO/RPO).
- [ ] Deployment pipeline (CI/CD, env promotion, blue/green or canary).
- [ ] External integrations expansion (Airtable/Notion, OAuth refresh/token management).

TODO(phase2-redis): Confirm hosting choice (Upstash/Redis Cloud/ElastiCache/etc), network/TLS, backups,
and where BullMQ workers will run (separate service vs API process).

TODO(observability): Make concrete decisions: Sentry (errors), metrics (Prometheus+Grafana vs managed),
tracing (OpenTelemetry), logging backend, retention, and alert routing.

### Phase 3: Billing + ops
- [ ] Billing/subscriptions and quota enforcement tied to plans.
- [ ] Incident response runbooks aligned to the blueprint and operational drills.

TODO(billing-stripe): Confirm Stripe as provider, pricing tiers, and enforceable limits (workers/org, SMS/month,
plugins enabled, sync frequency). Decide where enforcement lives (API middleware vs DB) and how usage is metered.

## Milestones (4-week path)
- Week 1: Auth + data layer wired; org/worker resolution works; repositories CRUD complete.
- Week 2: Google Calendar adapter + plugin manager working; dashboard API returns real data.
- Week 3: Admin onboarding + worker dashboard flows end-to-end; SMS send working synchronously.
- Week 4: Testing pass, bug fixes, deploy rehearsal, launch checklist complete.

## Acceptance criteria
- Admin can sign up, create org, add workers, connect Google Calendar, and send a dashboard SMS.
- Worker can open SMS link and see today's schedule/tasks from Google Calendar.
- Tokens expire as configured; expired and invalid links show correct error states.
- SMS logs are recorded per organization and visible in admin.
- Core API routes and repositories have passing tests.

## Notes
- V1 scope: Google Calendar only; synchronous SMS only.
- Phase 2/3 align to blueprint hardening and scale-up requirements.

## Phased roadmap (repo-specific)

### Phase 1: Core wiring + happy path (V1)
Goal: Admin can send a Google Calendar-backed dashboard SMS; worker can view it.

**Key files to touch**
- `packages/auth/src/index.ts` (export `createAuthService`)
- `packages/auth/src/services/AuthService.ts` (align return shapes)
- `apps/api/src/middleware/auth.ts`
- `apps/api/src/routes/auth.ts`
- `packages/database/src/adapters/DatabaseAdapter.ts`
- `packages/database/src/adapters/SupabaseAdapter.ts`
- `packages/database/src/repositories/*`
- `apps/api/src/routes/workers.ts`
- `apps/api/src/routes/organizations.ts`
- `packages/plugins/src/adapters/GoogleCalendarAdapter.ts`
- `apps/api/src/services/plugin-manager.ts` (new)
- `apps/api/src/routes/dashboards.ts`
- `apps/api/src/routes/sms.ts`
- `apps/admin/src/pages/*` (Workers, Plugins, Settings, SMS Logs)
- `apps/worker/src/pages/DashboardPage.tsx`

**Acceptance criteria**
- Admin can register/login, create org, and see org settings populated from DB.
- Admin can create/update/delete workers; org scoping enforced.
- Google Calendar adapter can fetch today's events and return schedule/tasks.
- `GET /dashboards/:token` returns real data (not placeholders).
- `POST /sms/send-dashboard-link` sends SMS synchronously and logs to `sms_logs`.
- Worker link renders schedule/tasks or correct invalid/expired states.

### Phase 1.5: Quality + stability (V1 hardening)
Goal: Make V1 reliable enough for early customers.

**Key files to touch**
- `apps/api/src/test/*` (integration tests)
- `packages/plugins/src/__tests__/google-calendar.test.ts`
- `packages/sms/src/__tests__/*`
- `apps/admin/src/test/*`
- `ENV.example`

**Acceptance criteria**
- API tests cover auth, workers, dashboards, SMS, and token validation.
- Google Calendar adapter tests cover validation + data mapping.
- Admin UI smoke test passes; worker UI renders sample dashboard.
- ENV examples include all required keys for V1.

### Phase 2: Async + webhooks + observability
Goal: Improve reliability and enable growth.

**Key files to touch**
- `packages/sms/src/services/SMSQueueService.ts`
- `apps/api/src/services/webhookService.ts`
- `apps/api/src/routes/webhooks.ts`
- `packages/database/migrations/002_webhook_events.sql`
- `apps/api/src/middleware/rateLimit.ts`
- `apps/api/src/utils/logger.ts`

**Acceptance criteria**
- SMS and webhook processing can run async with retries and DLQ.
- Webhook signatures verified; idempotency enforced.
- Webhook events stored and replayable from admin.
- Structured logs include request ID and org ID; basic metrics emitted.

### Phase 2.5: Security + data lifecycle
Goal: Align with blueprint security and compliance posture.

**Key files to touch**
- `apps/api/src/middleware/auth.ts` (tenant enforcement)
- `apps/api/src/middleware/rateLimit.ts`
- `packages/database/migrations/*` (audit logs, retention support)
- `apps/api/src/services/*` (audit logging hooks)

**Acceptance criteria**
- Tenant quotas enforced (workers, SMS monthly caps).
- Audit logs recorded for admin actions.
- Data retention and deletion jobs defined.
- RLS policies validated with service role usage documented.

### Phase 3: Deployment + billing + ops
Goal: Production readiness at scale.

**Key files to touch**
- `.github/workflows/*` (CI/CD)
- `docs/DEPLOYMENT.md`
- `docs/RUNBOOKS.md` (new)
- `packages/shared/src/contracts/payment.contracts.ts`

**Acceptance criteria**
- CI/CD builds, tests, and deploys to staging/production.
- Blue/green or canary strategy documented and rehearsed.
- Billing enabled with plan-based limits and webhooks.
- Incident runbooks written and tested.
