# Foundation setup playbook (Folder 1)

This playbook provides step-by-step instructions for `plan/1/AREA_FOUNDATION_SETUP.md`.
If a checklist conflicts with this playbook, update the checklist to reference this playbook.

Related SSOT docs:
- `ENV.example`
- `docs/SETUP_CHECKLIST.md`
- `apps/api/src/config/env.ts`

---

## Step 1 - Frontend env setup ✅

Create `apps/admin/.env` and `apps/worker/.env` with the required Vite keys:

- `VITE_API_URL=http://localhost:3000`
- `VITE_SUPABASE_URL=http://localhost:54321`
- `VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyODc4MDAsImV4cCI6MjA1OTg2MzQwMH0.F8jtGp8vQJQ3A0YnVTaFZ2z3Qh0l2W4uR1X3K7wY8Z0`

Where to get Supabase values:
- Local Supabase: run `pnpm db:start`, then `supabase status`.
- Hosted Supabase: copy from your Supabase project settings.

Acceptance check:
- ✅ Admin loads at `http://localhost:5173`.
- ✅ Worker loads at `http://localhost:5174`.

---

## Step 2 - Backend env setup ✅

Create `.env` from the template and populate required runtime keys:

```bash
cp ENV.example .env
```

Required keys (minimum):
- `SUPABASE_URL=http://localhost:54321`
- `SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyODc4MDAsImV4cCI6MjA1OTg2MzQwMH0.F8jtGp8vQJQ3A0YnVTaFZ2z3Qh0l2W4uR1X3K7wY8Z0`
- `SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDI4NzgwMCwiZXhwIjoyMDU5ODYzNDAwfQ.C_Vm1v8tE5B2TgKaJ3a3JnZQbJhG-WfGcVnYzBvDz7k`
- `APP_URL=http://localhost:5173`
- `API_URL=http://localhost:3000`
- `JWT_SECRET` (32+ characters)

Make sure `ENV.example` includes all required V1 keys and notes.

SMS baseline (local dev):
- The SMS service in `apps/api/src/services/sms.service.ts` is a **placeholder implementation**.
- Full SMS provider abstraction will be implemented in plan/3.
- For development: Use mock credentials like `MOBILE_MESSAGE_USERNAME=test_user` and `MOBILE_MESSAGE_PASSWORD=test_pass`.
- Set `DEFAULT_SMS_PROVIDER=mobile-message` to match the default provider.
- The placeholder service logs SMS attempts instead of sending real messages.

IMPORTANT: All external services that cost money (SMS, plugins, etc.) use placeholder implementations during foundation setup. This allows development without real costs.

If the API complains about missing env vars, the canonical list is enforced in `apps/api/src/config/env.ts`.

Acceptance check:
- ✅ API starts without missing-env errors.

---

## Step 3 - API health and CORS ✅

Start the API:

```bash
pnpm dev
```

Or API-only:

```bash
pnpm --filter @dashboard-link/api dev
```

Verify:
- ✅ `GET /health` returns `{ "status": "healthy" }`.
- ✅ CORS allows local admin and worker origins.

---

## Step 4 - Data migrations and seed ✅

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
- ✅ Migrations complete without errors.

---

## Step 5 - Infra env sync ✅

Copy `supabase status` values into:
- `.env`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- Vite envs: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Acceptance check:
- ✅ API and apps can connect to Supabase.

---

## Step 6 - Testing/QA baseline ✅

Complete all checks in `docs/SETUP_CHECKLIST.md`.

---

## Step 7 - Security baseline ✅

- ✅ Ensure secrets remain local and are not committed.
- ✅ Verify `JWT_SECRET` is 32+ characters.

---

## Step 8 - Ops baseline ✅

- ✅ Verify API logs show startup and health check entries.

---

## Implementation Status Guide

Current state of features during foundation setup (plan/1):

### Placeholder Services (will be fully implemented in later plans):
- **SMS Service** (`apps/api/src/services/sms.service.ts`): Logs instead of sending
  - Full implementation in plan/3
- **Plugin Connectors**: Mock implementations only
  - Full implementations in plan/3
- **Worker Tokens**: Basic database storage
  - Full queue system in plan/5

### Production-Ready Services:
- Authentication and authorization
- Organization management
- Dashboard data retrieval
- Basic API routing and middleware

### Build Process Notes:
- This is a monorepo with packages and apps
- Packages must be built before apps can use them: `pnpm --filter @dashboard-link/shared build`
- During development, TypeScript paths point to source files for faster iteration
- For production deployment, use the built dist files

---

## Development Best Practices

### Working with External Services:
1. Always use mock/placeholders during foundation setup
2. Design interfaces to match the real service
3. Use factory patterns for easy switching later
4. Log what would be sent instead of actually sending

Example pattern for paid services:
```typescript
// In development: log and return success
if (env.NODE_ENV === 'development') {
  console.log('Would send SMS:', { to, message });
  return { success: true, messageId: `mock-${Date.now()}` };
}
// In production: use real service
return await realProvider.send({ to, message });
```

---

## Troubleshooting Common Issues

### SMS Service Not Working:
- **Expected behavior**: SMS service logs messages instead of sending them
- **Check**: Look for "SMS Service: Would send SMS" in API logs
- **Remember**: Full SMS implementation is in plan/3

### Module Import Errors:
- **Issue**: Can't import from @dashboard-link/shared
- **Fix**: Ensure you're importing from source, not dist
- **Check**: tsconfig.json paths should point to ../package/src

### Environment Variable Errors:
- **Check**: .env file exists in root (not apps/api)
- **Verify**: All required vars from Step 2 are set
- **Remember**: SMS credentials can be placeholders for development

### Build/Start Order:
1. Start Supabase: `pnpm db:start`
2. Run migrations: `pnpm db:migrate`
3. Start API: `pnpm dev`
4. Start frontend: `pnpm --filter @dashboard-link/admin dev`

### Common AI Confusion Points:
- The SMS service is intentionally a placeholder - don't try to "fix" it
- Phone utilities exist in packages/shared but may have resolution issues
- External services use mocks during foundation setup
- Check if a feature is marked as "placeholder" before debugging
