# Platform reliability and async playbook (Folder 5)

This playbook provides step-by-step instructions for `plan/5/AREA_PLATFORM_RELIABILITY_ASYNC.md`.
If a checklist conflicts with this playbook, update the checklist to reference this playbook.

Related SSOT docs:
- `docs/ARCHITECTURE_BLUEPRINT.md`
- `plan/3/PLAYBOOK_CONNECTORS.md`
- `plan/4/DATA_INFRA.md`

---

## Step 1 - Queue infrastructure readiness

- Provision managed Redis (Upstash or Redis Cloud) for BullMQ.
- Configure TLS and per-environment isolation.
- Add env configs for queue concurrency, retry policies, and backoff.

Acceptance check:
- Workers can connect to Redis and create queues without errors.

---

## Step 2 - Async pipelines and idempotency

- Implement BullMQ queues for SMS and webhook processing.
- Add worker processes with concurrency limits.
- Ensure retries and DLQ are configured for both queues.
- Make side-effect work idempotent (SMS sends, webhook writes, token creation).

Acceptance check:
- Failed jobs retry and land in DLQ after max attempts.
- Retried jobs do not duplicate side effects.

---

## Step 3 - Connector resilience wrappers

- Add explicit timeouts and retries with backoff around adapter calls.
- Wrap adapter calls with circuit breaker behavior.

Acceptance check:
- Circuit breaker opens after repeated failures and recovers after cooldown.

---

## Step 4 - Webhook replay tooling

- Implement webhook event listing with pagination.
- Add replay endpoints that re-enqueue events.
- Enforce idempotency keys for replayed events.
- Add admin UI for webhook event listing, filtering, and replay actions.

Acceptance check:
- Replay does not create duplicate downstream effects.

---

## Step 5 - Observability baseline

- Add structured logs with correlation IDs for async jobs.
- Add structured logs for auth, dashboard fetch, and SMS send flows.
- Include `organizationId`, `pluginId`, and `pluginVersion` where relevant.
- Emit metrics for queue depth, failure rates, SMS delivery rates, and connector latency/error rates.
- Implement tracing for request -> queue -> worker flows.
- Add plugin health and delivery status views for operators.
- Add Sentry error tracking and plan Grafana Cloud metrics/tracing.

Acceptance check:
- Logs and metrics are emitted for SMS and webhook job paths.

---

## Step 6 - Connector rollout safety

- Enforce per-org version pinning in runtime config.
- Implement canary promotion by pinning a small org set first.
- Add a DB-driven kill switch that disables a connector version globally.

Acceptance check:
- Disabling a connector version stops execution without redeploy.
