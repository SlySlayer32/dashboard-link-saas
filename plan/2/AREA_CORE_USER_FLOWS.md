# Area - Core user flows (admin + worker)

This document is the area gate for the V1 “thin slice” user flows (overview + invariants).

For step-by-step implementation requirements (UI, endpoints, acceptance checks), use `plan/2/PLAYBOOK_USER_FLOWS.md`.

V1 flows:
- Admin: onboard org → create workers → connect Google Calendar → send dashboard link via SMS → view SMS logs.
- Worker: open dashboard link → see schedule/tasks or a friendly error state.

If a checklist item elsewhere conflicts with this area gate, update the checklist to reference this file.

---

## Single source of truth (SSOT)

- Connector implementation + registration: `plan/3/PLAYBOOK_CONNECTORS.md` (canonical)
- Detailed UI + endpoint flow requirements: `plan/2/PLAYBOOK_USER_FLOWS.md` (canonical)
- Required env keys: `ENV.example` (canonical)
- Manual smoke test steps: `docs/V1_IMPLEMENTATION_CHECKLIST.md` (canonical)
- Architecture rules (Zapier-style layers + multi-tenant): `docs/ARCHITECTURE_BLUEPRINT.md` (canonical)

---

## Canonical decisions (to prevent drift)

1) Google Calendar is **OAuth-first**.
	 - Do not build V1 around API keys.
	 - If API-key support is still desired later, treat it as a separate “public calendars” connector with a separate config schema (see `plan/3/PLAYBOOK_CONNECTORS.md`).

2) V1 UI is Google-only; manual data UI is deferred.
	 - Manual data backend CRUD is required to remove placeholders and unblock later UI.

3) Multi-tenant isolation is non-negotiable.
	 - Every repository query and service method must be scoped by `organizationId`.
	 - Treat RLS as a backstop, not a substitute.

4) Response normalization target is consistent across routes.
	 - Success: `{ success: true, data: ... }`
	 - Error: `{ success: false, error: { code, message, requestId?, details? } }`
	 - Note: parts of the API currently return `error: string`; this area should converge on the standardized error object used by the global error handler.

---

## Prerequisites (assumed completed)

Foundation setup is complete (Supabase configured, apps run locally). This playbook assumes:
- API can start with required env vars present (see `ENV.example`).
- Supabase RLS policies exist and are enabled for multi-tenant tables.

---

## Required inputs (env + configuration)

Minimum required env values for V1 flow execution (see `ENV.example` for the full list):

### API runtime
- `APP_URL`, `API_URL` / `API_BASE_URL`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- `JWT_SECRET`
- Token settings (database token provider uses `tokens` + `refresh_tokens`):
	- `TOKEN_PROVIDER=database`
	- `TOKEN_TABLE_NAME=tokens`
	- `TOKEN_HASH=true`

### Google Calendar (OAuth-first)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Expected OAuth outcomes (stored server-side, org-scoped):
- refresh token and related metadata required to obtain access tokens

### SMS
- `DEFAULT_SMS_PROVIDER=mobile-message` (V1)
- `MOBILE_MESSAGE_USERNAME`, `MOBILE_MESSAGE_PASSWORD`, `MOBILE_MESSAGE_SENDER_ID`

---

## Flow outline (what must exist)

Implementation details live in `plan/2/PLAYBOOK_USER_FLOWS.md`. This section only lists the non-negotiable outcomes.

Admin must be able to:
- sign in
- resolve tenant (`organizationId`) reliably
- create/update org settings
- create workers (and required downstream dashboard artifacts)
- connect Google Calendar (OAuth-first)
- send dashboard link via SMS
- view SMS logs (org-scoped)
- manual data backend CRUD exists (UI deferred)

Worker must be able to:
- open dashboard link and fetch data via the public token endpoint
- see schedule/tasks (or clear empty/error states)
- distinguish invalid vs expired links using stable error reasons/codes

---

## Placeholder removal checklist (core-flow blockers)

These are the known “stop the line” placeholders that must be removed for V1 correctness:

- Organization resolution placeholders in worker/auth flows (must derive real `organizationId`).
- Manual data route placeholders must be removed (backend CRUD only; UI deferred).
- Worker dashboard token validation must produce stable error codes (not only strings).
- Any route returning `error: string` should migrate to the standardized error object shape.

---

## Validation (how to prove the flows work)

Run the canonical manual smoke test in `docs/V1_IMPLEMENTATION_CHECKLIST.md` after any major change.

**Definition of done (area gate):**
- Admin can sign up, create org, create a worker, connect Google Calendar (OAuth), send an SMS, and view SMS logs.
- Worker can open the dashboard link and see schedule/tasks; expired/invalid links show correct error states.
- Tokens are hashed at rest; nothing logs raw tokens.
- Manual data backend CRUD endpoints are real (no placeholder logic).
- Every query is scoped by `organizationId` and respects RLS.
