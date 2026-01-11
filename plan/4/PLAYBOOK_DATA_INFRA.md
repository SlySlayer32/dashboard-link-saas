# Data infra implementation playbook (Folder 4)

This playbook provides step-by-step instructions for `plan/4/DATA_INFRA.md`.
If a checklist conflicts with this playbook, update the checklist to reference this playbook and keep SSOT aligned.

Related SSOT docs:
- Architecture rules: `docs/ARCHITECTURE_BLUEPRINT.md`
- Migration policy: `packages/database/migrations/AGENTS.md`
- Decisions log: `plan/8/NEEDS_DECISIONS.md`

---

## Step 1 - Migration workflow baseline

This repo keeps canonical SQL in `packages/database/migrations`, while Supabase expects `supabase/migrations`.
Supabase migrations are wrappers that include the canonical SQL.

Canonical migrations (do not move):
- `packages/database/migrations/001_initial_schema.sql`
- `packages/database/migrations/002_webhook_events.sql`

Supabase wrappers (used by CLI):
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_webhook_events.sql`

Seed source of truth:
- `packages/database/seed.sql`

Supabase seed wrapper:
- `supabase/seed.sql`

How to add a new migration without conflicts:
1) Create the real migration in `packages/database/migrations/00X_some_change.sql`.
2) Create a wrapper with the same filename in `supabase/migrations/00X_some_change.sql` that includes it.
3) Never edit applied migrations; add a new migration file instead.

Acceptance check:
- `pnpm db:migrate` applies the canonical SQL via wrappers.

---

## Step 2 - Baseline schema verification

Confirm these tables exist in Supabase (Studio or SQL editor):

- `organizations`, `admins`, `workers`
- `dashboards`, `dashboard_widgets`
- `plugin_configs`
- `manual_schedule_items`, `manual_task_items`
- `sms_logs`
- `tokens`, `refresh_tokens`
- `worker_tokens` (legacy links only, if required)
- `webhook_events`, `webhook_configs`

Acceptance check:
- All V1 tables listed above are present.

---

## Step 3 - Tenant isolation validation (RLS)

Goal: prove an admin from Org A cannot read or write Org B data.

Recommended manual verification loop:
1) Create two organizations.
2) Create two admin users via Supabase Auth (one per org).
3) Insert a row for each into `admins` with `auth_user_id` pointing at the Auth UUID.
4) In Supabase Studio, impersonate each user and run simple selects/updates.

What to test (minimum):
- Org A admin cannot see Org B workers/dashboards/plugin configs/SMS logs.
- Org A admin cannot update Org B rows.
- Org scoping works through joins (for example `dashboard_widgets` must scope through `dashboards`).

Note: Worker dashboard token validation is typically done with the Supabase service role key in the API layer, because workers do not have `auth.uid()`. That is acceptable, but it must be intentional and documented.

Acceptance check:
- Cross-tenant access is blocked in all tested paths.

---

## Step 4 - Token storage alignment

Decision:
- Use `tokens` and `refresh_tokens` tables aligned to `DatabaseTokenProvider`.
- Keep `worker_tokens` only for legacy links if required.

Action:
1) Add `tokens` and `refresh_tokens` tables matching the provider shape:

   - `token_hash`, `user_id`, `organization_id`, `session_id`, `payload`, `expires_at`, `last_used_at`, `revoked`, `revoked_at`, `revoked_by`, `metadata`
2) Migrate token manager usage to the new tables (do not log raw tokens).
3) Retain `worker_tokens` only if required for legacy links.

Indexes you will need (minimum):
- `tokens(token_hash)` unique
- `tokens(organization_id, expires_at)`
- refresh tokens table: `token_hash` unique, `access_token_id` index

Acceptance check:
- Token lookups use hashes and are scoped by `organization_id`.

---

## Step 5 - Plugin config storage shape

Current table:
- `plugin_configs(organization_id, plugin_id, config jsonb, active)`

Minimum V1 requirements:
- Store non-secrets in `config.settings`.
- Store secrets in `config.credentials`.
- Track `config_schema_version` in the config payload or a column if available.

Important:
- Use Supabase Vault or field-level encryption with KMS and service-role access.
- Keep `plugin_configs.config` service-role-only and never return `credentials` to the browser.

If you want rollback/versioning later:
- Add `plugin_version`, `contract_version`, and `config_schema_version` fields in a later migration.

Acceptance check:
- Admin APIs never return `credentials` to the UI.

---

## Step 6 - SMS logs alignment

Align `sms_logs` with what the SMS service writes. Typical fields:

- `provider` (for example `mobile-message`)
- `provider_message_id` (if available)
- `error_code`, `error_message`
- `delivered_at` (if you track delivery status)

Indexes you will likely need:
- `sms_logs(organization_id, created_at)`
- `sms_logs(worker_id, created_at)`

Acceptance check:
- Org/worker queries are indexed and return the expected fields.

---

## Step 7 - Webhook event storage sanity

Webhook tables are created by `002_webhook_events.sql` and already include:
- `idempotency_key` with a unique index
- org-scoped RLS
- status/retry fields

Acceptance check:
- `webhook_events` includes `idempotency_key` and status fields.

---

## Step 8 - Practical sanity checks

- Run `pnpm db:reset` and confirm the API can start and read/write core tables.
- Verify seeded data exists after reset (organization + workers + dashboards + manual items).

Acceptance check:
- Seed data is present and API starts without schema errors.
