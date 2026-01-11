# Deployment and billing playbook (Folder 7)

This playbook provides step-by-step instructions for `plan/7/AREA_DEPLOYMENT_BILLING_OPS.md`.
If a checklist conflicts with this playbook, update the checklist to reference this playbook.

Related SSOT docs:
- `docs/ARCHITECTURE_BLUEPRINT.md`
- `plan/8/NEEDS_DECISIONS.md`

---

## Step 1 - Billing data model

- Add migrations for billing plans, subscriptions, and usage metering tables.
- Ensure tables are org-scoped with RLS policies.

Acceptance check:
- Billing tables exist and RLS blocks cross-tenant access.

---

## Step 2 - Billing service and APIs

- Implement billing service enforcing plan limits and usage tracking.
- Add billing endpoints and payment webhook handling.
- Make webhook processing idempotent.

Acceptance check:
- Billing API returns org-scoped usage and plan data.

---

## Step 3 - Billing UI

- Add billing and plan management UI with usage visibility.

Acceptance check:
- Admins can view current plan and usage.

---

## Step 4 - Payment provider adapter

- Implement the payment provider adapter under `packages/*/src`.
- Verify webhook signatures and enforce idempotency.
- Integrate Stripe with metered usage (SMS count + active workers).

Acceptance check:
- Webhook verification rejects invalid signatures.

---

## Step 5 - Deployment pipelines

- Set up CI/CD pipelines with staging and production environments.
- Implement blue/green or canary deployment strategy and rollback.
- Add connector rollout playbook and promotion criteria.
- Gate connector releases on contract tests and a minimal live smoke test in staging.

Acceptance check:
- Staging deploys succeed and production can roll back cleanly.

---

## Step 6 - Ops readiness

- Create incident runbooks and disaster recovery drills.
- Add alerts for billing failures and deployment regressions.

Acceptance check:
- On-call can follow runbooks to resolve billing and deployment incidents.

---

## Step 7 - Testing/QA gates

- Add end-to-end tests for onboarding, billing, and SMS workflows.
- Run load tests for dashboard and SMS endpoints.
- Validate payment data handling and PCI considerations.

Acceptance check:
- Staging smoke tests pass before production release.
