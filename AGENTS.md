# Dashboard Link/CleanConnect Agent Guide

## Scope

Global instructions for the repo. Read this first, then the closest AGENTS.md for the area you are editing.

## Source of truth (read order)

1) This file
2) The closest folder-specific AGENTS.md
3) The plan execution order in `plan/PLAN_INDEX.md` (and numbered folders 1 → 8)

If a checklist conflicts with an SSOT document, update the checklist to reference the SSOT document (do not create competing docs).

## Development order

Follow `plan/PLAN_INDEX.md` and the numbered plan folders. Do not skip prerequisites.

## Plan and playbook conventions (anti-drift)

The `plan/` directory is organized into numbered folders that reflect execution order. Continue this structure.

- `plan/1` — Foundation setup (local dev, env, Supabase baseline)
- `plan/2` — Core user flows + implementation playbooks
- `plan/3` — Connectors + backend service boundaries
- `plan/4` — Data infra (schemas, invariants)
- `plan/5` — Reliability/async + ops/observability
- `plan/6` — Security + QA
- `plan/7` — Deployment/billing/ops
- `plan/8` — Decisions log (when something is ambiguous)

Rules when creating/updating plans:

- Keep `plan/PLAN_INDEX.md` as the entrypoint.
- When adding a new plan/playbook file:
  - put it in the correct numbered folder
  - add it to `plan/PLAN_INDEX.md` under the right step
  - update existing checklists to *reference* the new SSOT instead of duplicating instructions
- Prefer “area gates” for outcomes/invariants and “playbooks” for step-by-step how-to.
- If a playbook gets too big, split it into multiple playbooks but keep a single canonical index/entrypoint.
- When moving/renaming plan files, update references across the repo (plans + docs) to avoid broken links.

## Copy/paste task prompt (use for any AI/dev task)

Build changes following CleanConnect’s SSOT and rules:

- Read `AGENTS.md`, then the closest folder-specific `AGENTS.md`.
- Follow `plan/PLAN_INDEX.md` (and numbered plan folders 1→8); don’t skip prerequisites.
- Keep Zapier-style layering; vendor SDK calls only in adapters under `packages/*/src`.
- Enforce tenant scoping by `organizationId` everywhere; don’t trust tenant IDs from the client.
- Validate inputs with Zod; return `{ success, data, error }` with stable error codes.
- Use expand/contract DB migrations; config schema changes require explicit migrators.
- Add connector safety: versioning + per-org pinning + canary rollouts + kill switch.
- Update docs affected by the change and run the most relevant tests; avoid unrelated refactors.

## Architecture rules (mandatory)

- Zapier-style layering is required:

  - core services → contracts/types → adapters/connectors → external services

- Vendor SDK calls ONLY belong in adapters under `packages/*/src`.

  - Apps (`apps/*`) and core services MUST NOT call vendor SDKs directly.

- Prefer types and contracts from `@dashboard-link/shared`.

## Multi-tenant isolation (mandatory)

- Every repository query and service method must be scoped by `organizationId`.
- Treat RLS as a backstop, not a substitute.
- Never accept tenant identifiers from the client without validation; derive tenant scope from auth/session/token.

## Connector stability strategy (how we avoid breakage)

- Connectors are versioned (SemVer) and can be pinned per-organization.
- Rollouts use canary orgs first, then gradual promotion.
- Contract tests must pass for connector changes; add minimal live smoke test gating in staging.

### Kill switch (required)

- There must be a way to disable a connector (or connector version) quickly without redeploying.
- When error rate spikes, disable the version globally and fall back to the last known-good version (or degrade output gracefully).

## Data migration policy (expand/contract)

- Migrations are append-only in `packages/database/migrations`.
- Avoid destructive schema changes.
- Use an expand/contract approach:

  1) expand: add new columns/tables, write both old+new (or migrate in background)
  2) backfill + verify
  3) contract later: remove old columns only after all readers are migrated (ideally in a later release)

## Connector config migrations (required)

- Plugin/connector configs must be versioned.
- Store a `config_schema_version` (and if applicable `plugin_version` / `contract_version`).
- When the schema changes, provide explicit migrators (idempotent, repeatable) instead of “best effort” parsing.

## API conventions

- Validate all inputs with Zod.
- API responses must use the standard shape:

  - Success: `{ success: true, data: ... }`
  - Error: `{ success: false, error: { code, message, requestId?, details? } }`

- Use stable error codes for UIs; avoid string-matching in clients.

## Documentation policy

- When code changes behavior, update the relevant docs/plans/playbooks so SSOT stays accurate.
- Do not document placeholders as production-ready.

## Operational best practices (required)

These standards are defined in:

- `docs/ARCHITECTURE_BLUEPRINT.md` (canonical)
- `docs/ARCHITECTURE_RESEARCH_SUMMARY.md` (research context)

Non-negotiables to prevent “nothing breaks” drift:

- External API calls (connectors/adapters) must have: retries with backoff, timeouts, and circuit breaker behavior.
- Side-effect work must be idempotent under retries (SMS sends, webhooks, token creation, writes).
- Webhook endpoints must verify signatures (HMAC) and protect against replay.
- Async processing uses queues with retry policy + DLQ (BullMQ + Redis) for failure isolation.
- Observability: structured logs + correlation/request IDs; metrics split by org + connector/version where relevant.
- Rate limiting + quotas must exist on abuse-prone endpoints (webhooks, SMS, token endpoints).
- API evolution must be survivable: document versioning and pagination strategy; avoid breaking changes without a migration path.

## Fixed stack (do not introduce alternatives)

- Backend: Hono + Supabase
- Frontend: Vite + React 18
- UI: Tailwind + shadcn/ui
- State/data: Zustand, TanStack Query
- Forms/validation: React Hook Form + Zod
- Async: BullMQ + Redis
- SMS: MobileMessage

## Known placeholders (expected work)

Known placeholders exist in:

- `apps/api/src/routes/workers.ts`
- `apps/api/src/routes/organizations.ts`
- `apps/api/src/routes/manual-data.ts`
- `apps/api/src/routes/webhooks.ts`
- `apps/api/src/routes/tokens.ts`

## Touchpoints

- Architecture: `docs/ARCHITECTURE_BLUEPRINT.md`.
- Plans: `plan/PLAN_INDEX.md` (numbered execution order).
- App entry points: `apps/admin`, `apps/worker`, `apps/api`.
- Shared packages: `packages/*` (auth, database, plugins, shared, sms, tokens, ui).
- Env templates: `ENV.example`, `apps/admin/.env`, `apps/worker/.env`.

## Tests

- Run the most relevant tests for the code you changed:

  - `pnpm --filter @dashboard-link/api test`
  - `pnpm --filter @dashboard-link/admin test`
  - `pnpm --filter @dashboard-link/ui test`

Avoid “fix unrelated stuff” drive-bys; keep changes scoped.
