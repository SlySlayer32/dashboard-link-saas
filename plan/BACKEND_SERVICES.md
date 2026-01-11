# Backend services plan

See [NEEDS_DECISIONS.md](NEEDS_DECISIONS.md) for open questions.

## Auth and API baseline
- [ ] Populate `.env` with Supabase keys, `JWT_SECRET`, `APP_URL`, `API_URL`, and SMS dev values.
- [ ] Validate `apps/api/src/config/env.ts` requirements and ensure API starts without missing env errors.
- [ ] Implement `createAuthService` in `packages/auth` using Supabase provider.
- [ ] Align auth contract shapes so middleware and routes return the same user/session fields.
- [ ] Update auth middleware to set `userId` and `organizationId` from the auth service.
- [ ] Confirm `GET /health` returns `{ "status": "healthy" }`.
- [ ] Confirm CORS allows local admin and worker origins.
- [ ] Normalize API responses to `{ success, data, error }` across all routes.

## Organization resolution and core repositories
- [ ] Implement repository CRUD in `packages/database/src/repositories/*` for admins, orgs, workers, dashboards, widgets, plugins, manual schedule/tasks, sms logs, and tokens.
- [ ] Implement an organization resolver service that maps `auth_user_id` to `organization_id`.
- [ ] Replace placeholder org resolution in `apps/api/src/routes/workers.ts` with organization resolver.
- [ ] Replace placeholder org resolution in `apps/api/src/routes/organizations.ts`.
- [ ] Replace placeholder CRUD in `apps/api/src/routes/manual-data.ts` with repository-backed logic.

## Tokens and sessions
- [ ] Implement token listing with pagination and per-token revocation in `apps/api/src/routes/tokens.ts`.
- [ ] Implement worker-scoped token revocation for `/tokens/revoke-sessions` and `/tokens/revoke`.

## Dashboards
- [ ] Implement dashboard service to create a default dashboard and widget when a worker is created.
- [ ] Replace placeholder dashboard creation in `apps/api/src/routes/workers.ts` with dashboard service.
- [ ] Ensure `GET /dashboards/:token` returns real plugin manager data and token validation errors.

## Plugins and adapters
- [ ] Implement plugin manager service to aggregate schedule/tasks from the active plugin(s).
- [ ] Implement Google Calendar adapter with config validation, health check, and data mapping.
- [ ] Register Google Calendar adapter in the plugin registry as the only active V1 plugin.
- [ ] Implement Airtable and Notion adapters with OAuth and refresh token handling.
- [ ] Implement circuit breakers around plugin adapter calls and standardized retry rules.
- [ ] Create Google Calendar API key and restrict it to the Calendar API.

## SMS and logging
- [ ] Ensure SMS service uses the SMS provider contract (no direct vendor SDK use in routes).
- [ ] Configure MobileMessage as the default SMS provider for V1.
- [ ] Configure MobileMessage credentials or explicit dev values for local testing.
- [ ] Align SMS routes to use the token manager and log to `sms_logs` via repository/service.
- [ ] Add SMS provider fallback support in the SMS manager.
- [ ] Implement audit logging hooks for admin actions and security events.
- [ ] Add endpoints for audit log listing and export.
- [ ] Implement data retention jobs for SMS logs, dashboard data, and manual data.
- [ ] Add endpoints to request data export and data deletion for a user.
- [ ] Implement GDPR delete/anonymize workflows for workers and admins.
- [ ] Enforce tenant quotas on workers, SMS volume, and plugin count.

## Webhooks and queues
- [ ] Implement BullMQ queue services for SMS and webhook processing with retries and DLQ.
- [ ] Add worker processes for queue consumption with concurrency limits.
- [ ] Implement idempotency helpers for webhook processing.
- [ ] Implement webhook event listing with pagination in `apps/api/src/routes/webhooks.ts`.
- [ ] Implement webhook event retrieval and replay endpoints with org scoping.
- [ ] Add API versioning strategy and RFC 7807 error responses.

## Billing and usage
- [ ] Implement billing service with plan limits and usage metering.
- [ ] Add billing endpoints and payment webhook handling.
- [ ] Add usage reporting endpoints for admins.
- [ ] Implement payment provider adapter and webhook verification.
