# V1 Implementation Checklist (Solo Founder)

Purpose: build the V1 thin slice (Google Calendar + synchronous SMS), grouped by area so work can run in parallel.

How to use:
- Work Phase 1 in dependency order: backend/data/API before UI.
- Keep core services vendor-agnostic; put vendor SDKs in adapters only.
- If you get stuck, reduce scope instead of adding features.

## Phase 0: Setup
- [ ] Complete `docs/SETUP_CHECKLIST.md`.

## Phase 1: V1 build by area

### Backend - core contracts and services
- [ ] Implement `createAuthService` in `packages/auth/src/index.ts` using Supabase client.
- [ ] Align return shapes in `packages/auth/src/services/AuthService.ts`.
- [ ] Implement `apps/api/src/services/plugin-manager.ts` to aggregate schedule/tasks.
- [ ] Ensure `packages/tokens` uses `tokens` + `refresh_tokens` tables (keep `worker_tokens` only for legacy links if required).

Done when:
- Auth middleware and auth routes return the same user/session shape.
- `GET /dashboards/:token` can call the plugin manager and returns real data.

### Backend - data layer
- [ ] Implement `packages/database/src/adapters/SupabaseAdapter.ts` to satisfy `DatabaseAdapter`.
- [ ] Replace CRUD stubs in `packages/database/src/repositories/*`.
- [ ] Derive `organizationId` from `auth_user_id` (repo or service).

Done when:
- Workers and orgs CRUD work without placeholder logic.
- An admin only sees their org data.

### API - routes and middleware
- [ ] Update `apps/api/src/middleware/auth.ts` and `apps/api/src/routes/auth.ts` to match auth contract shapes.
- [ ] Remove placeholder logic in `apps/api/src/routes/workers.ts` and `apps/api/src/routes/organizations.ts`.
- [ ] Remove placeholder logic in `apps/api/src/routes/manual-data.ts` (backend CRUD only; UI deferred).
- [ ] Ensure `GET /dashboards/:token` returns plugin manager output.
- [ ] Ensure `POST /sms/send-dashboard-link` creates token -> sends SMS -> logs to `sms_logs`.

Done when:
- Dashboard and SMS routes return real data and log correctly.
- API responses use the same auth/session shape.

### Third-party integrations
- [ ] Implement `packages/plugins/src/adapters/GoogleCalendarAdapter.ts`.
- [ ] Validate config in `validateConfig` and add health checks.
- [ ] Configure the admin UI to run an OAuth-first Google Calendar connect flow (store refresh token securely, org-scoped).
- [ ] Follow the canonical connector contract + registration guidance in `plan/3/PLAYBOOK_CONNECTORS.md`.
- [ ] Configure SMS provider credentials in `.env` or accept failed sends in dev.

Done when:
- Adapter returns today's schedule and tasks from Google Calendar.
- SMS send returns a `dashboardUrl` and logs an entry.

### Frontend - admin app
- [ ] Org setup and settings.
- [ ] Workers CRUD.
- [ ] Google Calendar config screen.
- [ ] SMS send + SMS logs.

Done when:
- Admin can complete the full setup without touching the database directly.

### Frontend - worker app
- [ ] `apps/worker/src/pages/DashboardPage.tsx` renders schedule/tasks.
- [ ] Expired/invalid token states render a friendly message.

Done when:
- Worker link renders valid data or a clear error state.

## Phase 1.5: Minimal tests (only essentials)
- [ ] API integration tests for auth, workers, dashboards, and SMS.
- [ ] Google Calendar adapter unit tests for mapping.

Done when:
- `pnpm --filter @dashboard-link/api test` passes.

## Manual smoke test (run after each major step)
1) Start Supabase: `pnpm db:start` and `pnpm db:migrate`.
2) Run dev: `pnpm dev`.
3) Create an admin account in the admin UI.
4) Create an org and add at least one worker.
5) Connect Google Calendar via OAuth (see `plan/3/PLAYBOOK_CONNECTORS.md`).
6) Send a dashboard SMS (or use the response `dashboardUrl` if SMS fails).
7) Open the dashboard link and verify schedule/tasks.
8) Check the SMS logs screen for the new entry.
