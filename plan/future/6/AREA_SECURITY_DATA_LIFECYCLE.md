# Area - Security hardening and data lifecycle (Folder 6)

This area gate covers security controls, data lifecycle, and QA gates.
For step-by-step instructions, use `plan/6/PLAYBOOK_SECURITY_DATA_LIFECYCLE.md`.

If anything here conflicts with SSOT, update this file to reference the SSOT.

## Single source of truth (SSOT)

- Architecture rules: `docs/ARCHITECTURE_BLUEPRINT.md`
- Repo execution order: `plan/PLAN_INDEX.md`
- Decisions log: `plan/8/NEEDS_DECISIONS.md`
- Migration policy: `packages/database/migrations/AGENTS.md`

---

## Prerequisites (must be true before starting)

- Foundation setup complete (`plan/1/AREA_FOUNDATION_SETUP.md`).
- Core user flows area gate complete (`plan/2/AREA_CORE_USER_FLOWS.md`).
- Connectors/services area gate complete (`plan/3/BACKEND_SERVICES.md`).
- Data infra area gate complete (`plan/4/DATA_INFRA.md`).

---

## Canonical decisions / invariants (prevent drift)

1) Every query is scoped by `organizationId`; RLS is a backstop.
2) Tokens are hashed at rest and never logged.
3) Webhook requests verify signatures and protect against replay.
4) Rate limiting exists on abuse-prone endpoints (webhooks, SMS, token endpoints).
5) Audit logs, quotas, and retention policies are enforced in code and storage.
6) Secrets and integration tokens are stored securely and rotated (Supabase Vault or field-level encryption with KMS).
7) Retention durations follow the blueprint defaults unless legal requirements change.

---

## V1 scope (Folder 6)

- Audit logs for admin actions and security events.
- Tenant quotas for workers, SMS volume, and plugin count.
- Data retention jobs for SMS logs, dashboard data, and manual data.
- GDPR delete/anonymize workflows for workers and admins.
- Secure storage and rotation for integration tokens.
- QA and security test coverage for critical flows.

---

## Definition of done (area gate)

- Audit logs, quotas, and retention jobs are implemented and tested.
- Data export/delete workflows are available and org-scoped.
- RLS and tenant isolation are verified for all new tables.
- Webhook signatures and rate limiting are enforced.
- Secrets storage and rotation are documented and active.
- Security and QA test gates pass for core flows.

---

## Implementation order (do in order)

### 1) Security baseline enforcement

- [ ] Enforce tenant scoping and RLS checks across repositories and services.
- [ ] Ensure tokens are hashed and never logged.
- [ ] Validate RBAC, least privilege, and RLS coverage for protected routes.

### 2) Audit logging and quotas

- [ ] Implement audit logging hooks for admin and security events.
- [ ] Enforce tenant quotas on workers, SMS volume, and plugin count.

### 3) Data lifecycle workflows

- [ ] Implement retention jobs and GDPR delete/anonymize workflows.
- [ ] Add endpoints for audit log listing/export and data export/deletion.
- [ ] Document data handling and retention policies for compliance.
- [ ] Use blueprint default retention for SMS logs and audit logs unless legal requirements change.

### 4) Secrets and token security

- [ ] Implement secure storage and rotation for integration tokens.
- [ ] Configure secrets management for encryption keys.
- [ ] Use Supabase Vault or field-level encryption with KMS and service-role access.
- [ ] Set up automated backups with retention aligned to RTO/RPO targets.
- [ ] Add alerts for quota breaches, backup failures, and audit log anomalies.

### 5) Abuse protection

- [ ] Verify webhook signatures and protect against replay.
- [ ] Add rate limiting for webhook and SMS endpoints.

### 6) QA and security test gates

- [ ] Add smoke tests for admin onboarding and worker dashboard flows.
- [ ] Add unit and integration tests for auth, workers, dashboards, SMS, tokens, and manual data routes.
- [ ] Add unit tests for plugin manager aggregation and token manager integration.
- [ ] Add Google Calendar adapter tests for config validation and data mapping.
- [ ] Add tests for tenant isolation, audit logging, quotas, and retention workflows.
- [ ] Add tests for webhook verification, idempotency, and replay behavior.
- [ ] Add tests for queue processing, retries, and DLQ behavior.
- [ ] Validate API response shapes with tests.

---

## Validation

- Complete `docs/SETUP_CHECKLIST.md` and `docs/V1_IMPLEMENTATION_CHECKLIST.md`.
- Ensure `pnpm --filter @dashboard-link/api test` passes for security-critical routes.
