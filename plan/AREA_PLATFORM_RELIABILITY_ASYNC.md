# Area - Platform reliability and async operations

## V1 hardening (quality + stability)

### Frontend
- [ ] Add smoke tests for admin onboarding (org setup, workers CRUD, plugin config, SMS send).
- [ ] Add worker dashboard render tests for schedule, tasks, and error states.

### Backend
- [ ] Add unit tests for plugin manager aggregation and error handling.
- [ ] Add unit tests for token manager integration with database provider.

### API
- [ ] Add integration tests for auth, workers, dashboards, SMS, tokens, and manual data routes.
- [ ] Validate API response shapes for all routes with tests.

### Third-party
- [ ] Add Google Calendar adapter tests for config validation and data mapping.

### Data
- [ ] Add test fixtures and seed data for workers, dashboards, and manual items.
- [ ] Validate migrations for tokens and sms logs align with service usage.

### Infra
- [ ] Ensure `ENV.example` includes all required V1 keys and notes.

### Testing/QA
- [ ] Ensure `pnpm --filter @dashboard-link/api test` passes.

### Security/Compliance
- [ ] Add tests for tenant isolation and token expiry handling.

### Ops/Monitoring
- [ ] Verify logs include request and organization identifiers in core routes.

**Definition of done:** Core V1 tests pass and the happy path is stable enough for early users.

## Async processing, webhooks, and observability

### Frontend
- [ ] Add admin UI for webhook event listing, filtering, and replay actions.
- [ ] Add plugin health and delivery status views for operators.

### Backend
- [ ] Implement BullMQ queue services for SMS and webhook processing with retries and DLQ.
- [ ] Add worker processes for queue consumption with concurrency limits.
- [ ] Implement circuit breakers around plugin adapter calls and standardized retry rules.
- [ ] Implement idempotency helpers for webhook processing.

### API
- [ ] Implement webhook event listing with pagination in `apps/api/src/routes/webhooks.ts`.
- [ ] Implement webhook event retrieval and replay endpoints with org scoping.
- [ ] Add API versioning strategy and RFC 7807 error responses.

### Third-party
- [ ] Implement Airtable and Notion adapters with OAuth and refresh token handling.
- [ ] Add SMS provider fallback support in the SMS manager.

### Data
- [ ] Use `packages/database/migrations/002_webhook_events.sql` for event storage and add indexes as needed.
- [ ] Add queue status tables to support DLQ inspection and replay.

### Infra
- [ ] Provision Redis for BullMQ and configure TLS and per-environment isolation.
- [ ] Add env configs for queue concurrency and retry policies.

### Testing/QA
- [ ] Add tests for webhook signature verification, idempotency, and replay.
- [ ] Add queue processing tests for retries and DLQ behavior.
- [ ] Add adapter contract tests for Airtable and Notion.

### Security/Compliance
- [ ] Enforce webhook signature verification and reject unsigned payloads.
- [ ] Add rate limiting for webhook endpoints and SMS send routes.

### Ops/Monitoring
- [ ] Add structured logs with correlation IDs for async jobs.
- [ ] Add metrics for queue depth, failure rates, and SMS delivery rates.
- [ ] Implement tracing for request -> queue -> worker flows.

**Definition of done:** SMS and webhook processing run async with retries and DLQ; webhooks are secure and replayable; observability baseline is active.

## Needs decision (with suggestions)
- Needs decision: Redis hosting provider. Suggestion: use managed Redis (Upstash or Redis Cloud) with TLS and per-environment databases.
- Needs decision: Observability stack. Suggestion: start with Sentry plus JSON logs and add Grafana Cloud for metrics/tracing.
