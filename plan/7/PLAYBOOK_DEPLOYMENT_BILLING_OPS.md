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

Suggested Stripe webhook handler placement:
- Route entrypoint: `apps/api/src/routes/stripe-webhooks.ts` (register in `apps/api/src/routes/index.ts`).
- Service logic: `apps/api/src/services/billing/stripeWebhookService.ts`.
- Stripe SDK usage belongs in a payment adapter under `packages/*/src` (e.g., `packages/plugins/src/stripe/stripeAdapter.ts`); the route/service should call the adapter and avoid direct SDK calls.

Stripe webhook handler example (signature verification + idempotency):
```ts
// apps/api/src/routes/stripe-webhooks.ts
import { Hono } from "hono";
import { stripeWebhookService } from "@/services/billing/stripeWebhookService";

const stripeWebhooks = new Hono();

stripeWebhooks.post("/stripe", async (c) => {
  const signature = c.req.header("stripe-signature") ?? "";
  const rawBody = await c.req.text(); // raw body needed for signature verification

  const result = await stripeWebhookService.handleStripeEvent({
    rawBody,
    signature,
    requestId: c.get("requestId"),
  });

  if (!result.success) {
    return c.json(
      { success: false, error: result.error },
      result.error.code === "stripe_signature_invalid" ? 400 : 500,
    );
  }

  return c.json({ success: true, data: { received: true } });
});

export default stripeWebhooks;
```
```ts
// apps/api/src/services/billing/stripeWebhookService.ts
import { stripeAdapter } from "@dashboard-link/plugins/stripe";
import { billingEvents } from "@/services/billing/billingEvents";
import { webhookIdempotencyStore } from "@/services/billing/webhookIdempotencyStore";

export const stripeWebhookService = {
  async handleStripeEvent({ rawBody, signature, requestId }) {
    const eventResult = await stripeAdapter.verifyWebhook({
      rawBody,
      signature,
    });
    if (!eventResult.success) {
      return { success: false, error: eventResult.error };
    }

    const event = eventResult.data;
    const idempotencyKey = `stripe:${event.id}`;
    const alreadyProcessed = await webhookIdempotencyStore.has(idempotencyKey);
    if (alreadyProcessed) {
      return { success: true, data: { deduped: true } };
    }

    await billingEvents.applyStripeEvent({ event, requestId });
    await webhookIdempotencyStore.record(idempotencyKey, {
      eventId: event.id,
      createdAt: event.created,
    });

    return { success: true, data: { processed: true } };
  },
};
```

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

Stripe environment variables (see `ENV.example`):
- `STRIPE_SECRET_KEY` (server-side API key).
- `STRIPE_WEBHOOK_SECRET` (endpoint signing secret for webhook verification).

Acceptance check:
- Webhook verification rejects invalid signatures.

---

## Step 5 - Deployment pipelines

- Set up CI/CD pipelines with staging and production environments.
- Implement blue/green or canary deployment strategy and rollback.
- Add connector rollout playbook and promotion criteria.
- Gate connector releases on contract tests and a minimal live smoke test in staging.

Suggested CI/CD config locations + minimal pipeline outline:
- `.github/workflows/ci.yml` for lint/test/build validation on pull requests.
  - Steps: install deps, typecheck/lint, run focused tests (`pnpm --filter @dashboard-link/api test`, etc.), build packages/apps.
- `.github/workflows/deploy.yml` for deploys on `main` and tagged releases.
  - Steps: build artifacts, run migrations in staging, deploy staging, smoke tests, promote to production, run post-deploy checks.
- Optional `.github/workflows/preview.yml` for per-PR preview deployments.

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
