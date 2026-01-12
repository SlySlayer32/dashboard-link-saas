# User flow implementation playbook (Admin + Worker)

This playbook makes the V1 user flows explicit and implementation-driven.

If any checklist item conflicts with this playbook, update the checklist to reference this playbook.

Related SSOT docs:
- Connector setup + registration: `plan/3/PLAYBOOK_CONNECTORS.md`
- End-to-end flow overview + response-shape rules: `plan/2/AREA_CORE_USER_FLOWS.md`
- Local setup: `plan/1/AREA_FOUNDATION_SETUP.md` and `docs/SETUP_CHECKLIST.md`
- Manual smoke test steps: `docs/V1_IMPLEMENTATION_CHECKLIST.md`

---

## V1 thin-slice scope

Admin completes:
1) sign up / sign in
2) org settings
3) worker CRUD
4) connect Google Calendar (OAuth-first)
5) send dashboard link via SMS
6) view SMS logs

Worker completes:
- open dashboard link → see schedule/tasks or a friendly error state

Manual data:
- Backend CRUD is required to remove placeholders; admin UI is deferred for V1.

---

## Part A — Admin flow

### API surfaces used by the admin app (current repo)

Auth:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `GET /auth/me`

Organizations:
- `GET /organizations`
- `POST /organizations`
- `PUT /organizations`

Workers:
- `GET /workers`
- `POST /workers`
- `GET /workers/:id`
- `PUT /workers/:id`
- `DELETE /workers/:id`

Plugins (admin-only):
- `GET /plugins`
- `GET /plugins/:id`
- `PUT /plugins/:id/config`
- `POST /plugins/:id/test`
- `POST /plugins/:id/enable`
- `POST /plugins/:id/disable`

SMS:
- `POST /sms/send-dashboard-link`
- `GET /sms/logs`

Tokens (admin-only):
- `GET /tokens`
- `POST /tokens/revoke`
- `POST /tokens/revoke-sessions`

Rule: keep API response shapes consistent and stable for UI rendering (see `plan/2/AREA_CORE_USER_FLOWS.md`).

---

### Admin app pages/hooks (where to implement)

Pages (existing):
- `apps/admin/src/pages/LoginPage.tsx`
- `apps/admin/src/pages/SettingsPage.tsx` (org settings)
- `apps/admin/src/pages/WorkersPage.tsx` + `WorkerDetailPage.tsx`
- `apps/admin/src/pages/PluginsPage.tsx`
- `apps/admin/src/pages/SMSLogsPage.tsx`
- `apps/admin/src/pages/TokensPage.tsx`

Data hooks (existing):
- `apps/admin/src/hooks/useOrganization.ts`
- `apps/admin/src/hooks/useWorkers.ts`, `useWorkerMutation.ts`, `useWorkerDetail.ts`
- `apps/admin/src/hooks/useSMS.ts`, `useSMSLogs.ts`
- `apps/admin/src/hooks/useTokens.ts`

Auth client + storage (existing):
- `apps/admin/src/utils/authInterceptor.ts`
- `apps/admin/src/store/auth.ts`

---

### Step-by-step implementation requirements

#### Step A1 — Auth works end-to-end

Goal: admin can log in and all subsequent requests include a valid bearer token.

Implementation notes:
- Admin UI stores auth token under `auth_token` (see `apps/admin/src/utils/authInterceptor.ts`).
- API must accept `Authorization: Bearer <token>` for protected routes and set request context.

Acceptance checks:
- After login, `GET /auth/me` succeeds.
- Visiting a protected route in the admin app does not redirect to login.

#### Step A2 — Organization resolution is real (no placeholder)

Goal: the API can reliably derive `organizationId` for the authenticated admin.

Implementation notes:
- Server-side: map `auth_user_id → admins.organization_id` and enforce scoping.
- Client-side: `useOrganization` can fetch and update org settings without any hard-coded org id.

Acceptance checks:
- Two different admins from different orgs cannot see each other’s workers/SMS logs.

#### Step A3 — Worker CRUD creates required downstream artifacts

Goal: creating a worker also creates the default dashboard artifacts needed for worker rendering.

Implementation notes:
- API should create:
  - `workers` row scoped to `organization_id`
  - default dashboard row
  - default widget row (Google Calendar widget in V1)

Acceptance checks:
- After creating a worker, the admin can open a preview/dashboard route without server errors.

#### Step A4 — Connect Google Calendar (OAuth-first)

Goal: store org-scoped credentials and config so Google Calendar connector can fetch data.

SSOT: follow `plan/3/PLAYBOOK_CONNECTORS.md`.

Implementation requirements:
- Admin UI should expose “Connect Google Calendar” as a button-driven OAuth flow.
- The API must:
  1) generate an OAuth authorization URL
  2) handle callback (exchange code → tokens)
  3) persist refresh token securely (org-scoped)
  4) support health check/test endpoint that proves the connector can fetch data

Acceptance checks:
- Plugin test/health endpoint returns success.

#### Step A5 — Send dashboard link via SMS

Goal: generate worker-scoped token and send SMS.

API behavior (current repo):
- Request: `POST /sms/send-dashboard-link` with `{ workerId, expiresIn, customMessage? }`
- Response (happy path): includes `dashboardUrl` and `expiresAt`.

Security requirements:
- Tokens are hashed at rest and never logged.
- SMS logs are written and scoped by `organization_id`.

Acceptance checks:
- Admin UI can send a link (or at minimum get a `dashboardUrl` back if SMS fails in dev).
- An SMS log entry exists and is visible on the SMS logs page.

#### Step A6 — View SMS logs

Goal: show searchable, paginated, org-scoped SMS history.

Acceptance checks:
- Filtering and pagination work.
- Resend writes a new log entry.

#### Step A7 — Manual data backend CRUD (no UI)

Goal: remove placeholder logic in manual data endpoints while keeping the UI scope Google-only.

Implementation notes:
- Implement real CRUD in `apps/api/src/routes/manual-data.ts`.
- Enforce `organizationId` scoping in all queries.
- Do not add manual data UI in V1.

Acceptance checks:
- Manual data endpoints return real data and follow the standard response shape.

---

### “Stop-the-line” consistency rules

- Do not introduce new ad-hoc fetch clients; use existing `authFetch` or `apiClient`.
- Do not implement Google Calendar via API key in the UI.
- Do not add manual data UI in V1; keep it backend-only.
- Do not add vendor SDK calls to admin pages; keep them in packages.
- If you add a new step, update `plan/2/AREA_CORE_USER_FLOWS.md` and this playbook.

---

## Implementation examples

### Endpoint group file locations

- Organizations: `apps/api/src/routes/organizations.ts`
- Workers: `apps/api/src/routes/workers.ts`
- SMS: `apps/api/src/routes/sms.ts`
- Manual data: `apps/api/src/routes/manual-data.ts`

### Standard response shape + org scoping (handler sketch)

```ts
import { z } from "zod";

const inputSchema = z.object({
  name: z.string().min(1),
});

app.post("/example", async (c) => {
  const organizationId = c.get("organizationId");
  const parsed = inputSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input.",
          details: parsed.error.flatten(),
        },
      },
      400
    );
  }

  const record = await db.example.create({
    data: {
      organizationId,
      name: parsed.data.name,
    },
  });

  return c.json({ success: true, data: record });
});
```

### Worker creation creates dashboard + widget (service call sketch)

```ts
await db.transaction(async (tx) => {
  const worker = await workerService.createWorker(tx, {
    organizationId,
    name: payload.name,
    phone: payload.phone,
  });

  const dashboard = await dashboardService.createDefaultDashboard(tx, {
    organizationId,
    workerId: worker.id,
  });

  await widgetService.createDefaultWidget(tx, {
    organizationId,
    dashboardId: dashboard.id,
    type: "google_calendar",
  });

  return worker;
});
```

### Manual data CRUD (create/list) with Zod + org scoping

```ts
const createSchema = z.object({
  title: z.string().min(1),
  payload: z.record(z.unknown()),
});

app.post("/manual-data", async (c) => {
  const organizationId = c.get("organizationId");
  const parsed = createSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input.",
          details: parsed.error.flatten(),
        },
      },
      400
    );
  }

  const record = await manualDataService.create(c, {
    organizationId,
    ...parsed.data,
  });

  return c.json({ success: true, data: record });
});

app.get("/manual-data", async (c) => {
  const organizationId = c.get("organizationId");
  const items = await manualDataService.list(c, { organizationId });

  return c.json({ success: true, data: items });
});
```

## Part B — Worker flow

### Current repo surfaces

Worker app:
- Route: `/dashboard/:token` (see `apps/worker/src/App.tsx`)
- Data hook: `apps/worker/src/hooks/useDashboardData.ts`

API:
- Public endpoint: `GET /dashboards/:token` (see `apps/api/src/routes/dashboards.ts`)

---

### Expected behavior (user-visible)

Happy path:
- Worker sees:
  - header with their name
  - today’s schedule list
  - today’s tasks list
  - friendly empty state if both are empty

Error states (must be stable):
- Invalid token → “invalid link” UI
- Expired token → “expired link” UI + CTA to request a new link
- Network error → retry UI
- Upstream connector failure → degraded UI (can still show partial data)

Rule: error handling should be keyed on stable error codes/reasons (not string matching).

---

### Step-by-step implementation requirements

#### Step B1 — Token validation returns stable error information

Goal: `GET /dashboards/:token` distinguishes invalid vs expired tokens.

Implementation requirements:
- If token is invalid/expired:
  - return HTTP 401
  - include a machine-readable reason/code, e.g. `reason: 'expired' | 'not_found'`

Client behavior (existing):
- `useDashboardData` maps `response.status === 401` + `reason` into:
  - `expired-token` if `reason === 'expired'`
  - otherwise `invalid-token`

Acceptance checks:
- Expired tokens reliably navigate to the expired-token error screen.
- Invalid tokens reliably navigate to the invalid-token screen.

#### Step B2 — Dashboard response shape matches the worker UI needs

Goal: the endpoint returns the worker profile + schedule/tasks arrays.

Current shape (existing code):
- `{ worker, schedule, tasks }`

Target shape (recommended, consistent with other routes):
- `{ success: true, data: { worker, schedule, tasks } }`
- `{ success: false, error: { code, message, ... } }`

Rule: whichever shape you choose, keep it stable and update both API and UI together.

#### Step B3 — Tenant scoping remains enforced even for public token endpoints

Goal: public token endpoints cannot leak data across organizations.

Implementation requirements:
- token payload must contain enough information to derive tenant scope safely:
  - either embed `organizationId` in the token payload, or
  - resolve `organizationId` from `workerId` via the database

Acceptance checks:
- A token generated for worker A cannot fetch worker B.

#### Step B4 — Connector aggregation produces “today” data

Goal: worker sees schedule/tasks from the active connector(s).

Implementation requirements:
- `PluginManagerService.getDashboardData(workerId)` returns normalized schedule/tasks.
- Google Calendar connector is registered and configured.

Acceptance checks:
- With a connected Google Calendar, today’s events appear in schedule.

---

### UI implementation notes (current repo)

- `DashboardPage.tsx` already supports:
  - initial access screen (`WorkerAccess`) when no data yet
  - pull-to-refresh
  - loading spinner
  - empty state

Recommended fix to avoid brittle error handling:
- Use `DashboardError.code` (from `useDashboardData`) rather than checking `error.message.includes(...)`.

---

### “Stop-the-line” consistency rules

- Do not do any authenticated admin logic in the worker app.
- Do not add vendor SDK calls to the worker app.
- Keep public token endpoints minimal, validated, and rate-limited.
