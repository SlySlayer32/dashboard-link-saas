# QA and security plan

See [NEEDS_DECISIONS.md](NEEDS_DECISIONS.md) for open questions.

## Testing and QA
- [ ] Complete all checks in `docs/SETUP_CHECKLIST.md`.
- [ ] Run the manual smoke test in `docs/V1_IMPLEMENTATION_CHECKLIST.md` after major steps.
- [ ] Add smoke tests for admin onboarding (org setup, workers CRUD, plugin config, SMS send).
- [ ] Add worker dashboard render tests for schedule, tasks, and error states.
- [ ] Add unit tests for plugin manager aggregation and error handling.
- [ ] Add unit tests for token manager integration with database provider.
- [ ] Add integration tests for auth, workers, dashboards, SMS, tokens, and manual data routes.
- [ ] Validate API response shapes for all routes with tests.
- [ ] Add Google Calendar adapter tests for config validation and data mapping.
- [ ] Ensure `pnpm --filter @dashboard-link/api test` passes.
- [ ] Add tests for tenant isolation and token expiry handling.
- [ ] Add tests for webhook signature verification, idempotency, and replay.
- [ ] Add queue processing tests for retries and DLQ behavior.
- [ ] Add adapter contract tests for Airtable and Notion.
- [ ] Add tests for quota enforcement, audit logging, and deletion workflows.
- [ ] Add data retention job tests with time-based fixtures.
- [ ] Add end-to-end tests for onboarding, billing, and SMS workflows.
- [ ] Run load tests for dashboard and SMS endpoints.

## Security and compliance
- [ ] Ensure secrets remain local and are not committed.
- [ ] Verify `JWT_SECRET` length is 32+ characters.
- [ ] Enforce tenant scoping in all repository queries and service methods.
- [ ] Ensure tokens are hashed at rest and never logged.
- [ ] Enforce webhook signature verification and reject unsigned payloads.
- [ ] Add rate limiting for webhook endpoints and SMS send routes.
- [ ] Implement secure storage and rotation for integration tokens.
- [ ] Validate defense-in-depth controls (RBAC, least privilege, RLS coverage).
- [ ] Document data handling and retention policies for compliance.
- [ ] Verify payment data handling, webhook security, and PCI considerations.

## Definitions of done (by phase)
- Phase 0: Local dev runs end-to-end and all setup checklist health checks pass.
- Phase 1: Admin can sign up, create org, add workers, connect Google Calendar, send SMS; worker opens link and sees real schedule/tasks; tokens expire correctly; SMS logs are visible.
- Phase 1.5: Core V1 tests pass and the happy path is stable enough for early users.
- Phase 2: SMS and webhook processing run async with retries and DLQ; webhooks are secure and replayable; observability baseline is active.
- Phase 2.5: Tenant quotas, audit logs, and data lifecycle workflows are enforced and tested.
- Phase 3: Production deployment, billing, and operational runbooks are in place and verified.
