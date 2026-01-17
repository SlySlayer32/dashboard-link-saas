# Area - Deployment, billing, and operational readiness (Folder 7)

This area gate covers production deployment, billing, and ops readiness.
For step-by-step instructions, use `plan/7/PLAYBOOK_DEPLOYMENT_BILLING_OPS.md`.

If anything here conflicts with SSOT, update this file to reference the SSOT.

## Single source of truth (SSOT)

- Architecture rules: `docs/ARCHITECTURE_BLUEPRINT.md`
- Repo execution order: `plan/PLAN_INDEX.md`
- Decisions log: `plan/8/NEEDS_DECISIONS.md`

---

## Prerequisites (must be true before starting)

- Foundation setup complete (`plan/1/AREA_FOUNDATION_SETUP.md`).
- Core user flows area gate complete (`plan/2/AREA_CORE_USER_FLOWS.md`).
- Connectors/services area gate complete (`plan/3/BACKEND_SERVICES.md`).
- Data infra area gate complete (`plan/4/DATA_INFRA.md`).
- Reliability/async area gate complete (`plan/5/AREA_PLATFORM_RELIABILITY_ASYNC.md`).
- Security/QA area gate complete (`plan/6/AREA_SECURITY_DATA_LIFECYCLE.md`).

---

## Canonical decisions / invariants (prevent drift)

1) Payment provider integration lives in adapters under `packages/*/src`.
2) Stripe is the payment provider with metered usage (SMS count + active workers).
3) Billing logic enforces plan limits and usage metering in the API.
4) Payment webhooks are verified and idempotent.
5) Deployments support rollback and are gated by staging smoke tests.
6) Ops runbooks exist for incidents and billing failures.

---

## V1 scope (Folder 7)

- Billing UI with usage visibility.
- Billing service with plan limits and usage metering.
- Billing endpoints and payment webhook handling.
- Data migrations for plans, subscriptions, and usage metering.
- CI/CD pipelines with staging and production environments.
- Deployment strategy with rollback.
- Ops runbooks and alerts for billing and deployment.

---

## Definition of done (area gate)

- Billing UI, service, and APIs are live and org-scoped.
- Payment webhooks are verified, idempotent, and tested.
- CI/CD pipelines deploy to staging and production with rollback.
- Staging smoke tests gate production releases.
- Ops runbooks and alerts cover billing failures and deployment regressions.
- End-to-end and load tests pass for billing and core flows.

---

## Implementation order (do in order)

### 1) Billing data model

- [ ] Add migrations for billing plans, subscriptions, and usage metering tables.

### 2) Billing service and APIs

- [ ] Implement billing service with plan limits and usage tracking.
- [ ] Add billing endpoints and payment webhook handling.

### 3) Billing UI

- [ ] Add billing and plan management UI with usage visibility.

### 4) Payment provider adapter

- [ ] Implement payment provider adapter under `packages/*/src`.
- [ ] Verify webhook signatures and enforce idempotency.
- [ ] Integrate Stripe and enforce metered usage (SMS count + active workers).

### 5) Deployment pipelines

- [ ] Set up CI/CD with staging and production environments.
- [ ] Implement blue/green or canary deployment strategy and rollback.
- [ ] Add connector rollout playbook and promotion criteria.
- [ ] Gate connector releases on contract tests and a minimal live smoke test in staging.

### 6) Ops readiness

- [ ] Create incident runbooks and disaster recovery drills.
- [ ] Add alerts for billing failures and deployment regressions.

### 7) Testing/QA gates

- [ ] Add end-to-end tests for onboarding, billing, and SMS workflows.
- [ ] Run load tests for dashboard and SMS endpoints.
- [ ] Validate payment data handling and PCI considerations.

---

## Validation

- Run staging smoke tests before production release.
- Ensure billing webhooks are verified in staging.
