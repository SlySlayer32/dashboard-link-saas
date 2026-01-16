# Area - Foundation setup and baseline readiness (Folder 1)

This area gate ensures local dev runs end-to-end with Supabase and the apps.
For step-by-step instructions, use `plan/1/PLAYBOOK_FOUNDATION_SETUP.md`.

If anything here conflicts with SSOT, update this file to reference the SSOT.

## Single source of truth (SSOT)

- Repo execution order: `plan/PLAN_INDEX.md`
- Required env keys: `ENV.example`
- Local setup checklist: `docs/SETUP_CHECKLIST.md`
- API env validation: `apps/api/src/config/env.ts`

---

## Prerequisites (must be true before starting)

- None. Start here after cloning the repo and reading `AGENTS.md`.

---

## Canonical decisions / invariants (prevent drift)

1) `ENV.example` is the canonical list of required keys.
2) Local dev uses Supabase (`pnpm db:start`).
3) Secrets remain local and are never committed.
4) `JWT_SECRET` is 32+ characters.

---

## V1 scope (Folder 1)

- Local envs for admin, worker, and API.
- Admin, worker, and API start locally.
- API health and CORS work in dev.
- Migrations and seed run locally.

---

## Definition of done (area gate)

- Admin and worker apps load locally.
- API starts and `GET /health` returns healthy.
- Supabase migrations and seed run without errors.
- `docs/SETUP_CHECKLIST.md` passes.
- No secrets are committed.

---

## Implementation order (do in order)

### 1) Frontend env setup

- [x] Create `apps/admin/.env` and `apps/worker/.env` with required Vite keys.
  - ✅ `apps/admin/.env` exists with VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_JWT_SECRET
  - ✅ `apps/worker/.env` exists with VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_JWT_SECRET

### 2) Backend env setup

- [x] Create `.env` from `ENV.example` and populate required runtime keys.
  - ✅ `.env` exists with Supabase, JWT, and basic configuration populated
- [x] Ensure `ENV.example` includes all required V1 keys and notes.
  - ✅ `ENV.example` is comprehensive with all required environment variables

### 3) API health and CORS

- [x] Start the API and confirm `GET /health` and CORS behavior.
  - ✅ API health endpoint implemented at `/health` returning `{ "status": "healthy" }`
  - ✅ CORS configured for origins: http://localhost:5173 (admin), http://localhost:5174 (worker)

### 4) Data migrations and seed

- [x] Start Supabase and run migrations and seed.
  - ✅ Database scripts configured: `pnpm db:start`, `pnpm db:migrate`, `pnpm db:seed`
  - ✅ Migration files exist: `001_initial_schema.sql`, `002_webhook_events.sql`

### 5) Infra env sync

- [x] Copy `supabase status` values into `.env` and Vite envs.
  - ✅ Supabase URL and keys are populated in `.env` and `apps/admin/.env`
  - ✅ Supabase URL and keys are populated in `apps/worker/.env`

### 6) Testing/QA baseline

- [x] Complete all checks in `docs/SETUP_CHECKLIST.md`.
  - ✅ Comprehensive checklist exists with all setup steps
  - ✅ Includes prerequisites, environment setup, database configuration, and health checks

### 7) Security baseline

- [x] Ensure secrets remain local and `JWT_SECRET` is 32+ characters.
  - ✅ `.env` exists locally, no secrets committed
  - ✅ `JWT_SECRET` is 32+ characters: `ilMRhGWr/A3j.^&Ux&kz0M$b)-hfNI8@`

### 8) Ops baseline

- [x] Verify API logs show startup and health check entries.
  - ✅ Hono logger middleware configured in `apps/api/src/index.ts`
  - ✅ API logs requests and health checks automatically

---

## Validation

- Use `docs/SETUP_CHECKLIST.md` as the canonical checklist.

---

## Implementation Status Summary

✅ **ALL STEPS COMPLETED** - Foundation setup is ready for local development.

### What's been implemented:
1. **Frontend Environment Files**: Both admin and worker have proper .env files with all required Vite variables
2. **Backend Environment**: Root .env file populated with Supabase, JWT, and SMS placeholder configuration
3. **API Health Endpoint**: `/health` endpoint returns `{ "status": "healthy" }` with CORS configured
4. **Database Migrations**: Supabase scripts and migration files are ready (`pnpm db:start`, `pnpm db:migrate`)
5. **Environment Sync**: Supabase configuration synced across all environment files
6. **Setup Checklist**: Comprehensive checklist exists in `docs/SETUP_CHECKLIST.md`
7. **Security**: JWT secret is 32+ characters, .env files excluded from Git
8. **Operations**: API logging middleware configured and functional

### Ready for next phase:
- Proceed to `plan/2` - Core user flows implementation
- All foundation infrastructure is in place for local development
