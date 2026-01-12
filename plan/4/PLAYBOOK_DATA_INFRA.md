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

## Migration examples (canonical + wrapper pattern)

Use these as reference snippets when adding new migrations. The canonical SQL belongs in
`packages/database/migrations/00X_some_change.sql`, and the Supabase wrapper in
`supabase/migrations/00X_some_change.sql` should include it (follow the wrapper pattern used in
existing files).

```sql
-- supabase/migrations/00X_some_change.sql
\ir ../../packages/database/migrations/00X_some_change.sql
```

### Tokens + refresh tokens (sample canonical SQL)

```sql
-- packages/database/migrations/00X_tokens.sql
create table if not exists tokens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  user_id uuid references admins(id),
  session_id text,
  token_hash text not null,
  payload jsonb,
  expires_at timestamptz not null,
  last_used_at timestamptz,
  revoked boolean not null default false,
  revoked_at timestamptz,
  revoked_by uuid references admins(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tokens_token_hash_uq on tokens(token_hash);
create index if not exists tokens_org_expires_idx on tokens(organization_id, expires_at);

create table if not exists refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  access_token_id uuid not null references tokens(id),
  token_hash text not null,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists refresh_tokens_token_hash_uq on refresh_tokens(token_hash);
create index if not exists refresh_tokens_access_token_idx on refresh_tokens(access_token_id);
```

### Plugin configs (settings + credentials + config schema version)

```sql
-- packages/database/migrations/00X_plugin_configs.sql
create table if not exists plugin_configs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  plugin_id text not null,
  settings jsonb not null default '{}'::jsonb,
  credentials jsonb not null default '{}'::jsonb,
  config_schema_version integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists plugin_configs_org_plugin_uq
  on plugin_configs(organization_id, plugin_id);
```

### SMS logs + webhook idempotency indexes

```sql
-- packages/database/migrations/00X_sms_webhook_indexes.sql
create index if not exists sms_logs_org_created_idx
  on sms_logs(organization_id, created_at);
create index if not exists sms_logs_worker_created_idx
  on sms_logs(worker_id, created_at);

-- webhook idempotency is typically defined on the events table
create unique index if not exists webhook_events_idempotency_uq
  on webhook_events(idempotency_key);
```

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
