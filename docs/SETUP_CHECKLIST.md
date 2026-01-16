# Dashboard Link SaaS - Setup Checklist

Purpose: Get local development running end-to-end with minimal friction.

## Prerequisites
- [ ] Install Node.js 18+ and pnpm 9+
- [ ] Install the Supabase CLI
- [ ] Verify versions: `node -v`, `pnpm -v`, `supabase -v`

## Repository Setup
- [ ] Run `pnpm install` to install all dependencies
- [ ] Copy env template: `cp ENV.example .env`
- [ ] Create `apps/admin/.env` with required Vite keys
- [ ] Create `apps/worker/.env` with required Vite keys

## Database Setup
- [ ] Start Supabase: `pnpm db:start`
- [ ] Run migrations: `pnpm db:migrate`
- [ ] Optional: Seed data: `pnpm db:seed`
- [ ] Run `supabase status` and copy values to:
  - `.env`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
  - Frontend envs: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Environment Variables (V1 Required)
- [ ] `JWT_SECRET` is set to a 32+ character string
- [ ] `APP_URL=http://localhost:5173`
- [ ] `API_URL=http://localhost:3000`
- [ ] `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` are set
- [ ] SMS provider config (placeholders OK for local dev):
  - `DEFAULT_SMS_PROVIDER=mobile-message`
  - `MOBILE_MESSAGE_USERNAME` and `MOBILE_MESSAGE_PASSWORD`

## Frontend Environment Files

### apps/admin/.env
```
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### apps/worker/.env
```
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Plugin Connectors (Optional)
- [ ] Google Calendar: Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] Airtable: Set `AIRTABLE_API_KEY`
- [ ] Notion: Set `NOTION_INTEGRATION_SECRET`

Note: Google Calendar is OAuth-first. Use API keys only for separate public calendar connectors.

## Run Applications
- [ ] Start API: `pnpm dev` or `pnpm --filter @dashboard-link/api dev`
- [ ] Start Admin: `pnpm --filter @dashboard-link/admin dev`
- [ ] Start Worker: `pnpm --filter @dashboard-link/worker dev`
- [ ] Admin loads at `http://localhost:5173`
- [ ] Worker loads at `http://localhost:5174`
- [ ] API responds at `http://localhost:3000/health`

## Health Checks
- [ ] `GET http://localhost:3000/health` returns `{ "status": "healthy" }`
- [ ] CORS allows requests from both admin (5173) and worker (5174)
- [ ] Admin app loads without console errors
- [ ] Worker app loads and shows dashboard shell
- [ ] No missing environment variable warnings
- [ ] API logs show startup and health check entries

## Security Verification
- [ ] `.env` files are excluded from Git (check `.gitignore`)
- [ ] JWT_SECRET is 32+ characters
- [ ] No secrets committed to repository

## Troubleshooting

### API won't start
- Check all required environment variables in `.env`
- Ensure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` are set
- Verify `JWT_SECRET` is 32+ characters
- Check port 3000 is not in use

### Frontend can't connect to API
- Verify API is running on port 3000
- Check CORS configuration in `apps/api/src/index.ts`
- Ensure Vite env files have correct `VITE_API_URL`

### Database connection issues
- Ensure Supabase is running (`pnpm db:start`)
- Verify Supabase URL and keys are correct
- Check migrations have been applied (`pnpm db:migrate`)

### Port conflicts
- API: Default port 3000 (change with `PORT` env var)
- Admin: Default port 5173
- Worker: Default port 5174

## Next Steps
Once all checks pass:
1. Review `docs/ARCHITECTURE_BLUEPRINT.md`
2. Follow `plan/PLAN_INDEX.md` for implementation order
3. Continue with `plan/2/PLAYBOOK_USER_FLOWS.md`
