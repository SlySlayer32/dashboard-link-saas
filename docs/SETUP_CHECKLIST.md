# Setup Checklist (Solo Founder)

Purpose: get local dev running end-to-end with the smallest amount of friction.

## 1) Prereqs
- [ ] Install Node.js 18+ and pnpm 9+.
- [ ] Install the Supabase CLI.
- [ ] Verify versions: `node -v`, `pnpm -v`, `supabase -v`.

## 2) Repo bootstrap
- [ ] Run `pnpm install`.
- [ ] Copy env template: `cp ENV.example .env`.
- [ ] Create `apps/admin/.env` with `VITE_API_URL=http://localhost:3000`.
- [ ] Create `apps/worker/.env` with `VITE_API_URL=http://localhost:3000`.

## 3) Supabase local
- [ ] Start Supabase: `pnpm db:start`.
- [ ] Run migrations: `pnpm db:migrate`.
- [ ] (Optional) Seed data: `pnpm db:seed`.
- [ ] Run `supabase status` and copy local `API URL`, `anon key`, and `service_role key` into:
  - `.env` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`)
  - `apps/admin/.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
  - `apps/worker/.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

## 4) Required env vars (V1)
- [ ] `JWT_SECRET` is set to a 32+ char string.
- [ ] `APP_URL=http://localhost:5173`.
- [ ] `SMS_API_KEY` is set (can be a placeholder for local dev).
- [ ] SMS credentials are set if you want real SMS delivery:
  - `MOBILE_MESSAGE_USERNAME` + `MOBILE_MESSAGE_PASSWORD` or `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN`.

## 5) Google Calendar API key (V1)
- [ ] Create a Google Cloud project.
- [ ] Enable the Google Calendar API.
- [ ] Create an API key and restrict it to the Calendar API.
- [ ] Paste the API key into the admin Google Calendar plugin config.

## 6) Run apps
- [ ] `pnpm dev`.
- [ ] Admin loads at `http://localhost:5173`.
- [ ] Worker loads at `http://localhost:5174`.
- [ ] API responds at `http://localhost:3000/health`.

## 7) Quick health checks
- [ ] `GET http://localhost:3000/health` returns `{ "status": "healthy" }`.
- [ ] Admin app loads without console errors.
- [ ] Worker app loads and shows the dashboard shell (even if no data yet).

## Troubleshooting
- If the API logs env warnings, open `apps/api/src/config/env.ts` to see required keys.
- If the database calls fail, re-run `pnpm db:migrate` and confirm `.env` has Supabase keys.
