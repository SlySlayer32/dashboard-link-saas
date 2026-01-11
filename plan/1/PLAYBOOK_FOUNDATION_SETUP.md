# Foundation setup playbook (Folder 1)

This playbook provides step-by-step instructions for `plan/1/AREA_FOUNDATION_SETUP.md`.
If a checklist conflicts with this playbook, update the checklist to reference this playbook.

Related SSOT docs:
- `ENV.example`
- `docs/SETUP_CHECKLIST.md`
- `apps/api/src/config/env.ts`

---

## Step 1 - Frontend env setup

Create `apps/admin/.env` and `apps/worker/.env` with the required Vite keys:

- `VITE_API_URL=http://localhost:3000`
- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_ANON_KEY=...`

Where to get Supabase values:
- Local Supabase: run `pnpm db:start`, then `supabase status`.
- Hosted Supabase: copy from your Supabase project settings.

Acceptance check:
- Admin loads at `http://localhost:5173`.
- Worker loads at `http://localhost:5174`.

---

## Step 2 - Backend env setup

Create `.env` from the template and populate required runtime keys:

```bash
cp ENV.example .env
```

Required keys (minimum):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `APP_URL=http://localhost:5173`
- `API_URL=http://localhost:3000`
- `JWT_SECRET` (32+ characters)

Make sure `ENV.example` includes all required V1 keys and notes.

SMS baseline (local dev):
- You can use placeholders for `MOBILE_MESSAGE_USERNAME` and `MOBILE_MESSAGE_PASSWORD`.
- Set `DEFAULT_SMS_PROVIDER=mobile-message` to match the default provider.

If the API complains about missing env vars, the canonical list is enforced in `apps/api/src/config/env.ts`.

Acceptance check:
- API starts without missing-env errors.

---

## Step 3 - API health and CORS

Start the API:

```bash
pnpm dev
```

Or API-only:

```bash
pnpm --filter @dashboard-link/api dev
```

Verify:
- `GET /health` returns `{ "status": "healthy" }`.
- CORS allows local admin and worker origins.

---

## Step 4 - Data migrations and seed

Run local Supabase and apply migrations:

```bash
pnpm db:start
pnpm db:migrate
```

Optional seed/reset (this resets the DB):

```bash
pnpm db:seed
```

Acceptance check:
- Migrations complete without errors.

---

## Step 5 - Infra env sync

Copy `supabase status` values into:
- `.env`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- Vite envs: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Acceptance check:
- API and apps can connect to Supabase.

---

## Step 6 - Testing/QA baseline

Complete all checks in `docs/SETUP_CHECKLIST.md`.

---

## Step 7 - Security baseline

- Ensure secrets remain local and are not committed.
- Verify `JWT_SECRET` is 32+ characters.

---

## Step 8 - Ops baseline

- Verify API logs show startup and health check entries.
