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

Implementation notes (examples for `apps/api/src/routes/webhooks.ts` and `apps/api/src/routes/sms.ts`):

1) Webhook signature verification (middleware + HMAC check)

```ts
// apps/api/src/routes/webhooks.ts
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const webhookSignatureSchema = z.object({
  "x-webhook-signature": z.string().min(1),
  "x-webhook-timestamp": z.string().min(1),
});

const WEBHOOK_SIGNATURE_SECRET = process.env.WEBHOOK_SIGNATURE_SECRET;

function verifyWebhookSignature(body: string, signature: string, timestamp: string) {
  if (!WEBHOOK_SIGNATURE_SECRET) {
    throw new Error("WEBHOOK_SIGNATURE_SECRET is not configured");
  }

  const payload = `${timestamp}.${body}`;
  const expected = createHmac("sha256", WEBHOOK_SIGNATURE_SECRET)
    .update(payload)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return false;
  }

  return true;
}

// Mount early in the route handler before any side effects.
router.post("/", async (c) => {
  const rawBody = await c.req.text();
  const headers = webhookSignatureSchema.safeParse(c.req.header());

  if (!headers.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "WEBHOOK_SIGNATURE_MISSING",
          message: "Missing webhook signature headers.",
        },
      },
      400,
    );
  }

  const signature = headers.data["x-webhook-signature"];
  const timestamp = headers.data["x-webhook-timestamp"];

  if (!verifyWebhookSignature(rawBody, signature, timestamp)) {
    return c.json(
      {
        success: false,
        error: {
          code: "WEBHOOK_SIGNATURE_INVALID",
          message: "Invalid webhook signature.",
        },
      },
      401,
    );
  }

  // Continue with existing webhook handler...
});
```

2) Rate-limit middleware for webhook and SMS endpoints

```ts
// apps/api/src/routes/webhooks.ts
import { rateLimiter } from "@/middleware/rateLimiter";

// Mount on the webhooks router before defining routes.
router.use(
  rateLimiter({
    keyPrefix: "rate:webhook",
    windowSeconds: 60,
    maxRequests: 60,
  }),
);
```

```ts
// apps/api/src/routes/sms.ts
import { rateLimiter } from "@/middleware/rateLimiter";

// Mount on the SMS router before defining routes (e.g., before POST /send).
router.use(
  rateLimiter({
    keyPrefix: "rate:sms",
    windowSeconds: 60,
    maxRequests: 20,
  }),
);
```

Required env vars and failure response shape:

- `WEBHOOK_SIGNATURE_SECRET` is required for HMAC signature verification.
- If `WEBHOOK_SIGNATURE_SECRET` is missing, return `{ success: false, error: { code: "WEBHOOK_SIGNATURE_SECRET_MISSING", message } }` with a 500 status.
- Missing/invalid signature or timestamp headers should return `{ success: false, error: { code, message } }` with 400 (missing) or 401 (invalid) status.
- Rate-limit responses should return `{ success: false, error: { code: "RATE_LIMITED", message, details? } }` with 429 status.

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
