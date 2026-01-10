# Phase 1.5 - Minimal tests and V1 hardening

## Frontend
- [ ] Add smoke tests for admin onboarding (org setup, workers CRUD, plugin config, SMS send).
- [ ] Add worker dashboard render tests for schedule, tasks, and error states.

## Backend
- [ ] Add unit tests for plugin manager aggregation and error handling.
- [ ] Add unit tests for token manager integration with database provider.

## API
- [ ] Add integration tests for auth, workers, dashboards, SMS, tokens, and manual data routes.
- [ ] Validate API response shapes for all routes with tests.

## Third-party
- [ ] Add Google Calendar adapter tests for config validation and data mapping.

## Data
- [ ] Add test fixtures and seed data for workers, dashboards, and manual items.
- [ ] Validate migrations for tokens and sms logs align with service usage.

## Infra
- [ ] Ensure `ENV.example` includes all required V1 keys and notes.

## Testing/QA
- [ ] Ensure `pnpm --filter @dashboard-link/api test` passes.

## Security/Compliance
- [ ] Add tests for tenant isolation and token expiry handling.

## Ops/Monitoring
- [ ] Verify logs include request and organization identifiers in core routes.

**Definition of done:** Core V1 tests pass and the happy path is stable enough for early users.
