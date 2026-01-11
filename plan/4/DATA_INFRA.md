# Area - Data infra foundations (Folder 4)

This area gate covers schema correctness, tenant isolation, and repeatable migrations.
For step-by-step implementation details, use `plan/4/PLAYBOOK_DATA_INFRA.md`.

If anything here conflicts with SSOT, update this file to reference the SSOT.

## Single source of truth (SSOT)

- Architecture rules (multi-tenant + layers): `docs/ARCHITECTURE_BLUEPRINT.md`
- Repo execution order: `plan/PLAN_INDEX.md`
- Decisions log: `plan/8/NEEDS_DECISIONS.md`
- Migration policy: `packages/database/migrations/AGENTS.md`

---

## Prerequisites (must be true before starting)

- Foundation setup complete (`plan/1/AREA_FOUNDATION_SETUP.md`).
- Core user flows area gate complete (`plan/2/AREA_CORE_USER_FLOWS.md`).
- Connectors/services area gate complete (`plan/3/BACKEND_SERVICES.md`).

---

## Canonical decisions / invariants (prevent drift)

1) Migrations are append-only and follow expand/contract.
2) Canonical SQL lives in `packages/database/migrations`; Supabase wrappers include it.
3) RLS is enabled for all org-scoped tables; services still scope by `organizationId`.
4) Service-role access is limited to worker token flows and must be documented.
5) Plugin configs store `settings` (non-secret) and `credentials` (secret), and track `config_schema_version`.
6) Token storage uses hashed tokens with `tokens` and `refresh_tokens` tables; `worker_tokens` is legacy-only if needed.
7) Plugin config secrets use Supabase Vault or field-level encryption with KMS and service-role access.

---

## V1 scope (Folder 4)

- Migrations and seed run on a clean machine.
- Core tables exist for the thin slice:
  - `organizations`, `admins`, `workers`
  - `dashboards`, `dashboard_widgets`
  - `plugin_configs`
  - `manual_schedule_items`, `manual_task_items`
  - `sms_logs`
  - `tokens`, `refresh_tokens` (database token provider)
  - `worker_tokens` (legacy links only, if required)
  - `webhook_events`, `webhook_configs`
- RLS is enabled and validated for admin-scoped access.
- Plugin config storage is ready for versioning and secret handling with Vault or KMS encryption.

---

## Definition of done (area gate)

- `pnpm db:start`, `pnpm db:migrate`, and `pnpm db:seed` work on a clean machine.
- Core tables and required indexes exist for V1 flows.
- RLS blocks cross-tenant access in repeatable tests.
- Token storage schema matches the database provider (`tokens` + `refresh_tokens`) and hashes tokens at rest.
- Plugin config storage respects settings vs credentials and never returns secrets to the UI.
- SMS logs fields match service usage and are indexed for org/worker lookups.
- Webhook events support idempotency and replay tracking.

---

## Implementation order (do in order)

### 1) Migration workflow baseline

- [ ] Confirm canonical migrations and Supabase wrappers are in place.

Acceptance check:
- Running `pnpm db:migrate` applies the canonical SQL via wrappers.

### 2) Baseline schema verification

- [ ] Confirm core tables exist in the local Supabase instance.

Acceptance check:
- All V1 tables listed in this plan are present.

### 3) Tenant isolation validation

- [ ] Verify RLS prevents cross-tenant reads and writes.

Acceptance check:
- Org A cannot access Org B data across workers, dashboards, plugin configs, or SMS logs.

### 4) Token storage alignment

- [ ] Add `tokens` and `refresh_tokens` tables matching DatabaseTokenProvider.
- [ ] Update token provider usage to target the new tables.
- [ ] Keep `worker_tokens` only for legacy links if required.
- [ ] Ensure tokens are hashed and raw tokens are never logged.

Acceptance check:
- Token lookups use hashes and respect tenant scope.

### 5) Plugin config storage shape

- [ ] Store non-secrets in `settings`, secrets in `credentials`.
- [ ] Track `config_schema_version` and enforce updates via migrators.
- [ ] Encrypt `credentials` with Supabase Vault or field-level encryption with KMS.
- [ ] Keep `plugin_configs.config` service-role-only and never return `credentials` to the browser.
- [ ] If rollback/versioning is needed later, add `plugin_version` and `contract_version` fields in a later migration.

Acceptance check:
- Admin APIs never return `credentials` to the browser.

### 6) SMS logs alignment

- [ ] Align `sms_logs` fields with actual service writes and add required indexes.

Acceptance check:
- Org/worker queries are indexed and return expected fields.

### 7) Webhook event storage sanity

- [ ] Confirm webhook tables and indexes support idempotency and replay.

Acceptance check:
- `webhook_events` includes `idempotency_key` and status fields.

### 8) Practical sanity checks

- [ ] Run `pnpm db:reset` and confirm seeded data exists.
- [ ] Start the API and confirm it can read the core tables.

Acceptance check:
- Seed data is present and API starts without schema errors.

---

## Validation

- Run the manual DB verification steps in `plan/4/PLAYBOOK_DATA_INFRA.md`.
