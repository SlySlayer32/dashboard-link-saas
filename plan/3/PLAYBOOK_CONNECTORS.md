# Connector / plugin implementation playbook (repo source of truth)

This repo follows a Zapier-inspired layering:

1) **Core services** (apps/api + packages/* service logic)
2) **Contracts** (types + Zod schemas; prefer `@dashboard-link/shared`)
3) **Adapters / connectors** (`packages/plugins` and other vendor packages)
4) **External services** (Google, Notion, Airtable, SMS vendors)

Goal: core services never call vendor APIs directly. They call a connector through a stable contract.

This playbook is intentionally explicit. When a checklist says something like “set up Google credentials”, it means “follow the exact steps below and wire the result into the connector config + env exactly as described”.

---

## When to use this playbook

Use this any time you:

- add a new connector (Google, Airtable, Notion, Custom API)
- change a connector auth strategy (API key → OAuth)
- change connector configuration shape
- add connector versioning / rollout features

If this playbook conflicts with a checklist item, update the checklist to reference this playbook and treat this as canonical.

---

## Connector contract (what every connector must provide)

Connectors implement the `PluginAdapter` interface (via `BasePluginAdapter`) and must:

- normalize data to `StandardScheduleItem` and/or `StandardTaskItem`
- validate config with `validateConfig()`
- provide a config schema with `getConfigSchema()` (used by UI + validation)
- return `PluginResponse<T>` with consistent error shape

Where to look:

- `PluginAdapter` + schemas: `packages/plugins/src/contracts/index.ts`
- Base implementation: `packages/plugins/src/base/BasePluginAdapter.ts`

---

## Connector runtime flow (end-to-end)

1) Route resolves `organizationId` and `workerId` (derived from auth/token, never client input).
2) Plugin config repository loads enabled configs for the org.
3) Plugin manager service validates config (schema + migrator) and enforces kill switch/version pinning.
4) Plugin manager executes adapters and returns `PluginResponse<T>`.
5) Service aggregates schedule/tasks and maps errors to stable API codes.

Boundary rule: routes -> services -> contracts -> adapters -> vendors.

---

## Minimal working example

### 1) Adapter stub (`packages/plugins/src/adapters/<Example>Adapter.ts`)

```ts
import { z } from "zod";
import { BasePluginAdapter } from "../base/BasePluginAdapter";
import type {
  PluginConfig,
  PluginResponse,
  StandardScheduleItem,
} from "../contracts";

const ExampleConfigSchema = z.object({
  settings: z.object({
    calendarId: z.string().min(1),
    timezone: z.string().min(1),
  }),
  credentials: z.object({
    apiKey: z.string().min(1),
  }),
});

export class ExampleAdapter extends BasePluginAdapter {
  constructor() {
    super({
      id: "example",
      name: "Example",
      version: "0.1.0",
    });
  }

  getConfigSchema() {
    return ExampleConfigSchema;
  }

  validateConfig(config: PluginConfig) {
    return ExampleConfigSchema.parse(config);
  }

  async fetchExternalSchedule(
    config: PluginConfig
  ): Promise<PluginResponse<StandardScheduleItem[]>> {
    const { settings, credentials } = this.validateConfig(config);

    // Vendor SDK calls live here (adapters only).
    // Use settings + credentials to fetch data from the external service.
    const items: StandardScheduleItem[] = [
      {
        id: "example-1",
        title: "Example Item",
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        metadata: {
          calendarId: settings.calendarId,
        },
      },
    ];

    return { success: true, data: items };
  }
}
```

### 2) Registry setup (`apps/api/src/plugins/register-builtins.ts`)

```ts
import { pluginRegistry } from "@dashboard-link/plugins";
import { ExampleAdapter } from "@dashboard-link/plugins/adapters";

export const registerBuiltins = () => {
  // Single registry setup module: call once at API startup.
  pluginRegistry.register(new ExampleAdapter());
};
```

### 3) Service boundary in a route (`apps/api/src/routes/dashboards.ts`)

```ts
import { pluginManagerService } from "../services/plugin-manager";

// ...inside a route handler
const organizationId = authContext.organizationId; // derive from auth, never client input
const scheduleResponse = await pluginManagerService.fetchSchedule({
  organizationId,
  // error normalization happens in the service so routes return stable error codes
});

if (!scheduleResponse.success) {
  return c.json(
    {
      success: false,
      error: scheduleResponse.error,
    },
    400
  );
}

return c.json({ success: true, data: scheduleResponse.data });
```

---

## Non-negotiable rules (prevents drift/conflicts)

1. **Vendor SDKs only live in adapters.**

    - Only `packages/*/src` adapter code may call Google/Airtable/Notion SDKs or REST APIs.
    - `apps/api` routes and core services must call the adapter through the plugin contract.

1. **Config is split into non-secret settings vs secret credentials.**

    - `PluginConfig.settings`: non-secret values (IDs, flags, calendarId, timezone).
    - `PluginConfig.credentials`: secrets (refresh tokens, client secrets, API keys) if needed.
    - If you put secrets into `settings`, they will end up in logs/analytics/UI sooner or later.

1. **Everything is organization-scoped.**

    - Any stored plugin config/credential must be keyed by `organizationId`.
    - RLS is a backstop; services still scope queries by `organizationId`.

1. **Google Calendar is OAuth-first.**

    - Private calendars require OAuth.
    - If you want API-key support, make it a separate connector with its own `plugin.id`.

1. **Config schemas are versioned and migrated explicitly.**

    - Store `config_schema_version` and bump it when the schema changes.
    - Provide idempotent migrators; do not rely on best-effort parsing.

1. **Kill switch and version pinning are enforced before execution.**

    - Disabled configs must never execute.
    - Canary rollouts happen by pinning orgs to specific connector versions.

---

## Add a new connector: step-by-step

### 1) Choose the connector identity

Decide:

- `id` (stable, kebab-case, never change once published)
- `name` (display name)
- `version` (SemVer)

Rule: treat `id` as a database key and URL key; do not rename without a migration.

### 2) Define the config schema (UI + validation)

Implement `getConfigSchema()` with:

- required fields
- field types and descriptions

Rule: config lives under `config.settings[...]` and must be Zod-validated.

Additional rules (to avoid implementation conflicts):

- `settings` is UI-editable, non-secret.
- `credentials` is secret and should not be editable as raw JSON.
- `validateConfig()` must validate both: required `settings` fields and required `credentials` fields.

### 2a) Store config versions and define migrators

- Every saved config must include `config_schema_version`.
- When the schema changes, add an explicit migrator (idempotent) and run it before `validateConfig()` and before saving updates.
- Do not best-effort parse missing fields; fail closed with a stable error code.
- If the DB schema does not yet have version columns, keep version metadata inside the config JSON and plan the migration in `plan/4/DATA_INFRA.md`.

### 3) Implement the adapter

Create a file under `packages/plugins/src/adapters/`:

- Example: `packages/plugins/src/adapters/AirtableAdapter.ts`

Implementation guidelines:

- extend `BasePluginAdapter`
- implement `fetchExternalSchedule()` and/or `fetchExternalTasks()`
- implement `transformScheduleItem()` and/or `transformTaskItem()`
- keep vendor-specific fields inside `metadata`
- handle rate limits and timeouts explicitly

### 4) Export it from the plugins package

Update `packages/plugins/src/index.ts`:

- export the adapter class

Rule: keep exports stable; avoid changing existing export names.

### 5) Register the connector at runtime (single source of truth)

Expected pattern:

- register built-in connectors once during API startup
- call `pluginRegistry.register(new MyAdapter())`

Create/maintain a single registration module and use it everywhere (API + workers):

- Suggested file: `apps/api/src/plugins/register-builtins.ts`
- Export a `registerBuiltins()` function and call it from API startup before routes are mounted.
- If you must instantiate a registry, do it in one module and re-export the instance.

Rules:

- do not register in random routes
- do not create multiple registries in different places
- registration should happen before any request handlers execute

### 5a) Wire the plugin manager service (API boundary)

Create or update a service in `apps/api/src/services/` (for example `plugin-manager.ts`) that:

- loads org-scoped plugin configs
- filters to enabled/pinned versions (kill switch)
- calls the plugin manager from `@dashboard-link/plugins`
- aggregates schedule/tasks and maps errors to stable API codes
- never logs secrets

Rule: routes call this service, not adapters or vendor SDKs directly.

### 6) Add contract tests

Add a test in `packages/plugins/src/__tests__/`:

- Example: `packages/plugins/src/__tests__/airtable.test.ts`

Minimum tests:

- `validateConfig()` rejects missing required fields
- mapping produces items that pass Zod schemas
- error responses conform to `PluginResponse` shape

### 7) Add env + documentation

If the connector requires environment variables:

- add them to `ENV.example`
- document them in the relevant plan file and/or README

---

## Google Calendar (OAuth-first) – expected setup

This repo should treat Google Calendar as **OAuth-first** so private/primary calendars work in V1.

Expected credentials:

- OAuth client id/secret (not API key)
- per-organization (or per-admin) refresh token stored securely

Expected admin flow:

1. Admin clicks “Connect Google Calendar”
1. Redirect to Google OAuth consent
1. Exchange code → tokens
1. Store refresh token securely
1. Use access token for API calls; refresh automatically

### Google Cloud Console – step-by-step (OAuth client)

Do this once per environment (dev/staging/prod) or once per project if you’re comfortable reusing credentials.

1. Create/select a Google Cloud Project

    - Go to Google Cloud Console → project selector → “New Project”.
    - Name it something like `CleanConnect Dev`.

1. Enable the Calendar API

    - APIs & Services → Library → search “Google Calendar API” → Enable.

1. Configure OAuth consent screen

    - APIs & Services → OAuth consent screen.
    - User type: typically “External” for SaaS.
    - App name: `CleanConnect`.
    - Add a support email.
    - Scopes: keep minimal for V1. Recommended:

      - `.../auth/calendar.readonly`

    - Test users: add your dev Google account(s) so you can complete the flow while the app is in testing.

1. Create OAuth client credentials

    - APIs & Services → Credentials → Create Credentials → OAuth client ID.
    - Application type: “Web application”.
    - Authorized redirect URIs:

      - Use your API callback endpoint.
      - Recommended convention (pick one and keep it stable):
        - `http://localhost:3000/auth/google/callback` (local)
        - `https://<your-api-domain>/auth/google/callback` (hosted)

    - Save and copy:
      - Client ID → set as `GOOGLE_CLIENT_ID` in `.env`
      - Client secret → set as `GOOGLE_CLIENT_SECRET` in `.env`

1. Make sure you request a refresh token

    - In your OAuth “start” URL, request offline access and force consent when needed.
    - In practice, this means (implementation detail): `access_type=offline` and, when debugging missing refresh tokens, `prompt=consent`.
    - You usually only receive a refresh token the first time a user authorizes; if you lose it, revoke access in the Google Account permissions and re-consent.

### What to store (so the adapter can run)

For Google Calendar OAuth, store these org-scoped values:

- `settings` (non-secret):

  - `calendarId` (often `primary`, or a shared calendar ID)
  - `timeZone` (optional; defaults to org setting)
  - flags like `includeCancelled` if needed

- `credentials` (secret):

  - `refreshToken`
  - (optional) `accessToken` + `accessTokenExpiresAt` if you cache tokens
  - (optional) `scope` and token metadata

Storage rule: secrets should be encrypted at rest using Supabase Vault or field-level encryption with KMS.

If you still want API-key support:

- treat it as a separate connector (public/shared calendars only)
- do not mix API-key and OAuth fields in one connector config schema

### API key (optional) – step-by-step (public calendars only)

Only do this if you intentionally ship a separate connector (example `plugin.id = google-calendar-public`).

1. Google Cloud Console → APIs & Services → Credentials → Create Credentials → API key
1. Restrict the key

    - API restrictions: restrict to “Google Calendar API”
    - Application restrictions (pick the best fit):
      - If calls originate from your server in production: restrict by server IP(s)
      - Do not restrict by HTTP referrer unless calls originate from a browser

1. Store the API key as a secret

    - Put it in `PluginConfig.credentials.apiKey` (not `settings`)
    - Never send it to the browser

---

## Versioning + rollback (how to prevent breakage)

Minimum viable safety model:

- store `{ organization_id, plugin_id, plugin_version, contract_version, config_schema_version, settings, credentials, enabled }`
- pin each organization to a specific connector version
- upgrades are opt-in (canary) and reversible by switching the pinned version

Rules:

- never change behavior of an already-shipped `{plugin_id, version}`; publish a new version
- if the config schema changes, bump a schema version and provide a migration path

---

## Kill switch + canary rollout (required)

- Every config must have an `enabled` flag (default false until configured).
- Plugin manager must skip disabled configs; this is the kill switch.
- Canary rollout: pin a small set of orgs to the new version; others stay on the last known good.
- When error rate spikes, disable the version globally and fall back to the previous pinned version.

Note: the toggle must be DB-driven so it works without redeploy.

---

## Operational safety requirements (minimum)

- External API calls must set explicit timeouts and retries with backoff.
- Wrap adapter calls with circuit breaker behavior.
- Structured logs include `organizationId`, `pluginId`, and `pluginVersion`, and never include secrets.

---

## Common failure modes (avoid these)

- Two different adapters for the same `plugin.id` (creates conflicts and unclear auth)
- Registering plugins in a route handler (registry differs per request)
- Creating a new registry instance inside a route or service
- Mixing vendor SDK calls into API routes/services
- Returning non-standard error shapes from connectors
- Storing tokens/secrets in plaintext JSON
- Running a connector with `enabled=false` or without enforcing version pinning
- Skipping config migrations after a schema change

---

## Connector acceptance checks (minimum bar)

Use this checklist when you finish a connector so it’s obvious what “done” means:

- `validateConfig()` fails closed on missing required `settings`/`credentials`.
- `getConfigSchema()` matches what the UI needs to render (field names/types/required list).
- Adapter never throws raw errors across the boundary; it returns `PluginResponse` with `errors[].code`.
- Adapter output items pass `standardScheduleItemSchema` / `standardTaskItemSchema`.
- No connector call path logs secrets (tokens, apiKey, clientSecret).
- `config_schema_version` is stored and migrators are idempotent.
- Disabled configs never execute (kill switch is enforced).
- External calls have explicit timeouts and retries with backoff.
