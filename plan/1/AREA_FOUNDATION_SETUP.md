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

- [ ] Create `apps/admin/.env` and `apps/worker/.env` with required Vite keys.

### 2) Backend env setup

- [ ] Create `.env` from `ENV.example` and populate required runtime keys.
- [ ] Ensure `ENV.example` includes all required V1 keys and notes.

### 3) API health and CORS

- [ ] Start the API and confirm `GET /health` and CORS behavior.

### 4) Data migrations and seed

- [ ] Start Supabase and run migrations and seed.

### 5) Infra env sync

- [ ] Copy `supabase status` values into `.env` and Vite envs.

### 6) Testing/QA baseline

- [ ] Complete all checks in `docs/SETUP_CHECKLIST.md`.

### 7) Security baseline

- [ ] Ensure secrets remain local and `JWT_SECRET` is 32+ characters.

### 8) Ops baseline

- [ ] Verify API logs show startup and health check entries.

---

## Validation

- Use `docs/SETUP_CHECKLIST.md` as the canonical checklist.
