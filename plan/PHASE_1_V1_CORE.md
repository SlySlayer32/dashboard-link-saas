# Phase 1 - V1 core wiring and happy path (Google Calendar + synchronous SMS)

## Frontend
- [ ] Implement admin onboarding: org settings, workers CRUD, Google Calendar config, SMS send, SMS logs.
- [ ] Add form validation with React Hook Form + Zod and surface API errors clearly.
- [ ] Implement worker dashboard UI for schedule and tasks with friendly expired/invalid token states.

## Backend
- [ ] Implement `createAuthService` in `packages/auth` using Supabase provider.
- [ ] Align auth contract shapes so middleware and routes return the same user/session fields.
- [ ] Implement repository CRUD in `packages/database/src/repositories/*` for admins, orgs, workers, dashboards, widgets, plugins, manual schedule/tasks, sms logs, and tokens.
- [ ] Implement an organization resolver service that maps `auth_user_id` to `organization_id`.
- [ ] Implement dashboard service to create a default dashboard and widget when a worker is created.
- [ ] Implement plugin manager service to aggregate schedule/tasks from the active plugin(s).
- [ ] Ensure SMS service uses the SMS provider contract (no direct vendor SDK use in routes).

## API
- [ ] Update auth middleware to set `userId` and `organizationId` from the auth service.
- [ ] Replace placeholder org resolution in `apps/api/src/routes/workers.ts` with organization resolver.
- [ ] Replace placeholder dashboard creation in `apps/api/src/routes/workers.ts` with dashboard service.
- [ ] Replace placeholder org resolution in `apps/api/src/routes/organizations.ts`.
- [ ] Replace placeholder CRUD in `apps/api/src/routes/manual-data.ts` with repository-backed logic.
- [ ] Ensure `GET /dashboards/:token` returns real plugin manager data and token validation errors.
- [ ] Align SMS routes to use the token manager and log to `sms_logs` via repository/service.
- [ ] Implement token listing with pagination and per-token revocation in `apps/api/src/routes/tokens.ts`.
- [ ] Implement worker-scoped token revocation for `/tokens/revoke-sessions` and `/tokens/revoke`.
- [ ] Normalize API responses to `{ success, data, error }` across all routes.

## Third-party
- [ ] Implement Google Calendar adapter with config validation, health check, and data mapping.
- [ ] Register Google Calendar adapter in the plugin registry as the only active V1 plugin.
- [ ] Configure MobileMessage as the default SMS provider for V1.

## Data
- [ ] Align token storage schema with DatabaseTokenProvider (hash, payload, metadata, refresh tokens).
- [ ] Update `sms_logs` schema to include fields used by the SMS service (provider and error details).
- [ ] Add indexes for token lookups, sms log queries, and manual data filters.
- [ ] Validate RLS policies for dashboards, widgets, manual data, and sms logs.

## Infra
- [ ] Ensure `.env` includes Supabase keys, Google API key, SMS provider credentials, and `JWT_SECRET`.
- [ ] Update `ENV.example` with all required V1 keys.

## Testing/QA
- [ ] Run the manual smoke test in `docs/V1_IMPLEMENTATION_CHECKLIST.md` after major steps.

## Security/Compliance
- [ ] Enforce tenant scoping in all repository queries and service methods.
- [ ] Ensure tokens are hashed at rest and never logged.

## Ops/Monitoring
- [ ] Add structured logs for auth, dashboard fetch, and SMS send flows.

**Definition of done:** Admin can sign up, create org, add workers, connect Google Calendar, send SMS; worker opens link and sees real schedule/tasks; tokens expire correctly; SMS logs are visible.

## Needs decision (with suggestions)
- Needs decision: V1 plugin scope (Google Calendar only vs include Manual data UI). Suggestion: keep UI Google-only for V1, but implement manual data backend CRUD now to remove placeholders and enable later UI.
- Needs decision: Token storage schema (expand `worker_tokens` vs add new tables). Suggestion: add new `tokens` and `refresh_tokens` tables matching DatabaseTokenProvider and migrate token manager to them; keep `worker_tokens` only if required for legacy links.
- Needs decision: Google Calendar auth method (API key vs OAuth). Suggestion: V1 uses API key for shared/public calendars; Phase 2 adds OAuth for private calendars.
- Needs decision: Default dashboard contents. Suggestion: create one dashboard per worker with a single Google Calendar widget and a simple config payload.
