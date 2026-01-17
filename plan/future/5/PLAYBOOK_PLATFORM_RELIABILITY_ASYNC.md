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
- Current queue placeholders live in:
  - `packages/sms/src/services/SMSQueueService.ts` (SMS send pipeline).
  - `apps/api/src/services/webhookService.ts` (webhook dispatch pipeline).

Acceptance check:
- Workers can connect to Redis and create queues without errors.

---

## Step 2 - Async pipelines and idempotency

- Implement BullMQ queues for SMS and webhook processing.
- Add worker processes with concurrency limits.
- Ensure retries and DLQ are configured for both queues.
- Make side-effect work idempotent (SMS sends, webhook writes, token creation).
- Suggested worker module location: `apps/worker/src/queues/` (e.g. `apps/worker/src/queues/smsQueue.ts` and `apps/worker/src/queues/webhookQueue.ts`).
- Wire queue config from `ENV.example` (see `REDIS_URL`, `QUEUE_CONCURRENCY`, `QUEUE_MAX_ATTEMPTS`, `QUEUE_BACKOFF_MS`, `QUEUE_DLQ_SUFFIX`).

Acceptance check:
- Failed jobs retry and land in DLQ after max attempts.
- Retried jobs do not duplicate side effects.

Minimal BullMQ example (queue + worker + retry/DLQ config):

```ts
import { Queue, Worker } from "bullmq";
import { connection } from "./redisConnection";

const queueName = "sms.send";
const dlqName = `${queueName}${process.env.QUEUE_DLQ_SUFFIX ?? ".dlq"}`;

export const smsQueue = new Queue(queueName, {
  connection,
  defaultJobOptions: {
    attempts: Number(process.env.QUEUE_MAX_ATTEMPTS ?? 5),
    backoff: {
      type: "exponential",
      delay: Number(process.env.QUEUE_BACKOFF_MS ?? 5000),
    },
    removeOnComplete: 1000,
    removeOnFail: 1000,
  },
});

export const smsWorker = new Worker(
  queueName,
  async (job) => {
    await sendSms(job.data);
  },
  {
    connection,
    concurrency: Number(process.env.QUEUE_CONCURRENCY ?? 10),
    // Optional: route exhausted jobs to DLQ
    settings: {
      backoffStrategies: {
        exponential: (attemptsMade, type, err, job) =>
          Number(process.env.QUEUE_BACKOFF_MS ?? 5000),
      },
    },
  }
);

smsWorker.on("failed", async (job, err) => {
  if (job && job.attemptsMade >= (job.opts.attempts ?? 0)) {
    await smsQueue.add(dlqName, job.data, { removeOnComplete: 1000 });
  }
});
```

Before/after (replace in-memory queue):

```ts
// Before: in-memory queue (placeholder)
const pending: SmsPayload[] = [];
export const enqueueSms = (payload: SmsPayload) => pending.push(payload);

// After: BullMQ queue + worker
export const enqueueSms = (payload: SmsPayload) =>
  smsQueue.add("sms.send", payload);
```

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
