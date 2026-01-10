# Phase 0 - Setup and baseline readiness

## Frontend
- [ ] Create `apps/admin/.env` and `apps/worker/.env` with `VITE_API_URL` and Supabase Vite keys.
- [ ] Start admin and worker apps and confirm shells load at `http://localhost:5173` and `http://localhost:5174`.

## Backend
- [ ] Populate `.env` with Supabase keys, `JWT_SECRET`, `APP_URL`, `API_URL`, and SMS dev values.
- [ ] Validate `apps/api/src/config/env.ts` requirements and ensure API starts without missing env errors.

## API
- [ ] Confirm `GET /health` returns `{ "status": "healthy" }`.
- [ ] Confirm CORS allows local admin and worker origins.

## Third-party
- [ ] Create Google Calendar API key and restrict it to the Calendar API.
- [ ] Configure MobileMessage credentials or explicit dev values for local testing.

## Data
- [ ] Run migrations and optional seed data to validate schema and RLS policies.

## Infra
- [ ] Start local Supabase and copy `supabase status` values into `.env` and Vite envs.

## Testing/QA
- [ ] Complete all checks in `docs/SETUP_CHECKLIST.md`.

## Security/Compliance
- [ ] Ensure secrets remain local and are not committed.
- [ ] Verify `JWT_SECRET` length is 32+ characters.

## Ops/Monitoring
- [ ] Verify API logs show startup and health check entries.

**Definition of done:** Local dev runs end-to-end and all setup checklist health checks pass.
