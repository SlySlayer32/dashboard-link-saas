# Security and data lifecycle playbook (Folder 6)

This playbook provides step-by-step instructions for `plan/6/AREA_SECURITY_DATA_LIFECYCLE.md`.
If a checklist conflicts with this playbook, update the checklist to reference this playbook.

Related SSOT docs:
- `docs/ARCHITECTURE_BLUEPRINT.md`
- `plan/8/NEEDS_DECISIONS.md`

---

## Step 1 - Security baseline enforcement

- Enforce tenant scoping in every repository query and service method.
- Validate RLS coverage for new tables and joins.
- Ensure tokens are hashed at rest and never logged.
- Validate RBAC and least-privilege access for protected routes.

Acceptance check:
- Cross-tenant access is blocked under RLS and service-layer scoping.

---

## Step 2 - Audit logging and quotas

- Implement audit logging for admin actions and security events.
- Add quota enforcement for workers, SMS volume, and plugin count.

Acceptance check:
- Audit logs and quota checks are org-scoped and visible to admins.

---

## Step 3 - Data lifecycle workflows

- Implement retention jobs for SMS logs, dashboard data, and manual data.
- Implement GDPR delete/anonymize workflows for workers and admins.
- Add endpoints for audit log listing/export and data export/deletion.
- Update RLS policies to cover new tables.
- Document data handling and retention policies for compliance.
- Use blueprint default retention for SMS logs and audit logs unless legal requirements change.

Acceptance check:
- Deletion and retention jobs are repeatable and org-scoped.

---

## Step 4 - Secrets and token security

- Implement secure storage and rotation for integration tokens.
- Configure secrets management for encryption keys.
- Use Supabase Vault or field-level encryption with KMS and service-role access.
- Set up automated backups with retention aligned to RTO/RPO targets.
- Add alerts for quota breaches, backup failures, and audit log anomalies.

Acceptance check:
- Secrets are encrypted at rest and never returned to clients.

---

## Step 5 - Abuse protection

- Verify webhook signatures and protect against replay.
- Add rate limiting for webhook and SMS endpoints.

Acceptance check:
- Unsigned or replayed webhooks are rejected.

---

## Step 6 - QA and security test gates

- Add smoke tests for admin onboarding and worker dashboard flows.
- Add unit and integration tests for auth, workers, dashboards, SMS, tokens, and manual data routes.
- Add unit tests for plugin manager aggregation and token manager integration.
- Add Google Calendar adapter tests for config validation and data mapping.
- Add tests for tenant isolation, audit logging, quotas, and retention workflows.
- Add tests for webhook verification, idempotency, and replay behavior.
- Add tests for queue processing, retries, and DLQ behavior.
- Validate API response shapes with tests.
- Ensure `pnpm --filter @dashboard-link/api test` passes.

Acceptance check:
- Security and QA test suites pass for core flows.
