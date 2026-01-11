# Area - Platform reliability and async operations (Folder 5)

This area gate covers async processing, retries, and observability so the platform is resilient under load.
For step-by-step instructions, use `plan/5/PLAYBOOK_PLATFORM_RELIABILITY_ASYNC.md`.

If anything here conflicts with SSOT, update this file to reference the SSOT.

## Single source of truth (SSOT)

- Architecture rules: `docs/ARCHITECTURE_BLUEPRINT.md`
- Repo execution order: `plan/PLAN_INDEX.md`
- Connector playbook: `plan/3/PLAYBOOK_CONNECTORS.md`
- Data infra plan: `plan/4/DATA_INFRA.md`

---

## Prerequisites (must be true before starting)

- Foundation setup complete (`plan/1/AREA_FOUNDATION_SETUP.md`).
- Core user flows area gate complete (`plan/2/AREA_CORE_USER_FLOWS.md`).
- Connectors/services area gate complete (`plan/3/BACKEND_SERVICES.md`).
- Data infra area gate complete (`plan/4/DATA_INFRA.md`).

---

## Canonical decisions / invariants (prevent drift)

1) Async processing uses BullMQ + Redis.
2) Redis is managed (Upstash or Redis Cloud) with TLS and per-environment databases.
3) External API calls use explicit timeouts, retries with backoff, and circuit breaker behavior.
4) Side-effect work is idempotent under retries (SMS sends, webhooks, writes).
5) Webhook events use idempotency keys and replay protection.
6) Observability starts with Sentry + JSON logs; add Grafana Cloud for metrics/tracing.
7) Metrics are split by organization and connector/version where relevant.
8) Connector rollouts use version pinning, canary promotion, and kill switch.

---

## V1 scope (Folder 5)

- Queue-backed processing for SMS and webhooks with retries and DLQ.
- Circuit breaker and retry wrappers for connector calls.
- Webhook event storage and replay support.
- Structured logs and metrics for core async paths.
- Connector rollout controls enforced in config and runtime.

---

## Definition of done (area gate)

- Redis is provisioned and BullMQ queues run with retries and DLQ.
- SMS and webhook workloads run async and are idempotent under retries.
- Connector calls enforce timeouts, retries with backoff, and circuit breaker behavior.
- Webhook events are stored with idempotency keys and can be replayed safely.
- Logs include correlation IDs and org/connector/version context.
- Metrics track queue depth, failure rates, SMS delivery rates, and connector latency/error rates.
- Connector version pinning, canary rollout, and kill switch are active.

---

## Implementation order (do in order)

### 1) Queue infrastructure readiness

- [ ] Provision managed Redis (Upstash or Redis Cloud) and configure BullMQ env settings.
- [ ] Add worker processes with concurrency limits.
- [ ] Configure TLS and per-environment isolation for Redis.

### 2) Async pipelines and idempotency

- [ ] Implement queue-backed SMS and webhook processing with retries and DLQ.
- [ ] Ensure idempotency for side-effect work.

### 3) Connector resilience wrappers

- [ ] Add timeouts, retries with backoff, and circuit breaker behavior around adapter calls.

### 4) Webhook replay tooling

- [ ] Implement webhook event listing and replay endpoints.
- [ ] Ensure replay respects idempotency keys.
- [ ] Add admin UI for webhook event listing, filtering, and replay.

### 5) Observability baseline

- [ ] Add structured logs with correlation IDs for async jobs.
- [ ] Add structured logs for auth, dashboard fetch, and SMS send flows.
- [ ] Add metrics for queue depth, failures, SMS delivery rates, and connector latency/error rates.
- [ ] Implement tracing for request -> queue -> worker flows.
- [ ] Add plugin health and delivery status views for operators.
- [ ] Add Sentry error tracking and plan for Grafana Cloud metrics/tracing.

### 6) Connector rollout safety

- [ ] Enforce per-org version pinning, canary promotion, and kill switch in runtime config.

---

## Validation

- Add tests for queue processing, retries, and DLQ behavior.
- Add tests for webhook idempotency and replay behavior.
