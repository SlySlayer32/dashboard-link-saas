# Area - Connectors and backend service boundaries (Folder 3)

This area gate defines the outcomes and invariants for connector boundaries and service orchestration.
For step-by-step implementation details, use `plan/3/PLAYBOOK_CONNECTORS.md`.

If anything here conflicts with SSOT, update this file to reference the SSOT.

## Single source of truth (SSOT)

- Architecture rules + layering: `docs/ARCHITECTURE_BLUEPRINT.md`
- Connector contract + how-to: `plan/3/PLAYBOOK_CONNECTORS.md` (canonical)
- Core flow prerequisites: `plan/2/AREA_CORE_USER_FLOWS.md`
- Plugin data shape + RLS: `plan/4/DATA_INFRA.md`
- Required env keys: `ENV.example` (canonical)
- Decisions log: `plan/8/NEEDS_DECISIONS.md`
- Plugin code structure: `packages/plugins/src/AGENTS.md`

---

## Prerequisites (must be true before starting)

- Foundation setup complete (`plan/1/AREA_FOUNDATION_SETUP.md`).
- Core user flows area gate complete (`plan/2/AREA_CORE_USER_FLOWS.md`).
- API boots with required env vars and auth middleware sets `organizationId`.
- `plugin_configs` table exists (see `plan/4/DATA_INFRA.md`); if missing, complete that step first.

---

## Canonical decisions / invariants (prevent drift)

1) Zapier-style layering: routes -> services -> contracts -> adapters -> vendors.
2) Vendor SDKs only live in adapters under `packages/plugins/src/adapters`.
3) Organization scope is derived from auth/session; never accept `organizationId` from the client.
4) Connector config is split: `settings` (non-secret) vs `credentials` (secret).
5) Config schema changes require explicit migrators and a `config_schema_version`.
6) Connector safety is required: versioning, per-org pinning, canary rollout, and kill switch.
7) Google Calendar is OAuth-first for V1.
8) API responses follow `{ success, data, error }` with stable error codes.
9) External adapter calls must set timeouts, retries with backoff, and circuit breaker behavior.

---

## V1 scope (Folder 3)

- One connector end-to-end: Google Calendar (OAuth-first).
- A single registration point for connectors at API startup.
- A plugin manager/service boundary that routes call instead of vendor APIs.

---

## Definition of done (area gate)

- Connectors register once at startup; routes never create their own registries.
- Plugin manager service loads org-scoped configs, enforces enabled/version pinning, and calls adapters.
- Google Calendar adapter runs via the plugin manager and returns normalized schedule/task items.
- Plugin config storage respects settings vs credentials and never returns secrets to the UI.
- Dashboards endpoint uses plugin manager output and returns stable error codes.
- Connector kill switch works without redeploy (disable by config/DB toggle).
- Connector contract tests exist and pass.
- Adapter calls enforce timeouts/retries/backoff and circuit breaker baseline.

---

## Implementation order (do in order)

### 1) Auth + API baseline

- [ ] Populate `.env` using `ENV.example` and ensure API starts.
- [ ] Confirm health, CORS, and standardized response shape are stable.

Acceptance check:
- `GET /health` returns `{ "status": "healthy" }`.
- Protected routes return `{ success, data, error }` consistently.

### 2) Organization resolution (required for all connector work)

- [ ] Implement a resolver that maps `auth_user_id` -> `organization_id`.
- [ ] Ensure middleware stores `organizationId` on the request context.

Acceptance check:
- Every repository query includes `organizationId` in its filter.

### 3) Plugin config access boundary

- [ ] Create or update a repository/service to read and update plugin configs by `organizationId`.
- [ ] Validate config payloads with Zod; enforce `config_schema_version`.
- [ ] Never return `credentials` to the browser.

Acceptance check:
- A config update from the admin UI only changes `settings` unless explicitly allowed.
- Attempting to read configs from another org returns zero rows.

### 4) Connector runtime boundary (registry + manager)

- [ ] Create a single registration module and call it at API startup.
- [ ] Use one shared registry instance for API and workers.
- [ ] Add a plugin manager service that:
  - loads enabled/pinned configs for an org
  - calls adapters through the plugin manager in `@dashboard-link/plugins`
  - normalizes errors to stable codes
  - never logs secrets

Acceptance check:
- Routes call the service, not adapters or vendor SDKs.

### 5) Google Calendar connector (OAuth-first)

- [ ] Set up Google OAuth credentials and env vars (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
- [ ] Implement or update the adapter under `packages/plugins/src/adapters/`.
- [ ] Store refresh tokens in `credentials` and keep non-secrets in `settings`.

Acceptance check:
- Plugin test/health endpoint succeeds for a connected org.

### 6) Dashboards endpoint uses plugin manager output

- [ ] Ensure `GET /dashboards/:token` calls the plugin manager service.
- [ ] Return stable error codes for invalid or expired tokens.

Acceptance check:
- Worker dashboard renders schedule data for a connected org.

---

## Validation

- Run the manual smoke test in `docs/V1_IMPLEMENTATION_CHECKLIST.md` after connector changes.
- Run plugin adapter tests in `packages/plugins/src/__tests__` as needed.
