# Developer Quickstart: SMS Dashboard MVP

**Feature**: CleanConnect SMS Dashboard MVP  
**Branch**: `001-sms-dashboard-mvp`  
**Date**: 2026-01-21

## Overview

This guide will help you set up the CleanConnect development environment and start building the SMS Dashboard MVP. Follow these steps in order to get a fully functional local development environment.

## Prerequisites

### Required Software

- **Node.js**: 20.x LTS or higher
- **pnpm**: 8.x or higher (package manager)
- **Git**: Latest version
- **VS Code** (recommended) or your preferred IDE
- **Docker Desktop** (for local Supabase)

### Required Accounts

- **Supabase Account**: https://supabase.com (free tier)
- **MobileMessage.au Account**: https://mobilemessage.com.au (for SMS)
- **Google Cloud Console**: https://console.cloud.google.com (for Calendar OAuth)

### Verify Prerequisites

```bash
# Check Node.js version
node --version  # Should be v20.x.x or higher

# Check pnpm version
pnpm --version  # Should be 8.x.x or higher

# Install pnpm if needed
npm install -g pnpm

# Check Docker
docker --version
```

## Step 1: Clone Repository & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/cleanconnect.git
cd cleanconnect

# Checkout feature branch
git checkout 001-sms-dashboard-mvp

# Install all dependencies (monorepo)
pnpm install

# Verify installation
pnpm --version
```

## Step 2: Set Up Supabase (Local Development)

### Option A: Local Supabase (Recommended for Development)

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in project
supabase init

# Start local Supabase (PostgreSQL + Auth + Storage)
supabase start

# This will output:
# - API URL: http://localhost:54321
# - DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# - Studio URL: http://localhost:54323
# - Anon key: eyJhbGc...
# - Service role key: eyJhbGc...
```

**Save these credentials** - you'll need them for `.env` files.

### Option B: Supabase Cloud (Alternative)

1. Go to https://supabase.com/dashboard
2. Create new project: `cleanconnect-dev`
3. Wait for provisioning (~2 minutes)
4. Go to Settings > API
5. Copy:
   - Project URL
   - Anon (public) key
   - Service role key (secret)

## Step 3: Run Database Migrations

```bash
# Apply initial schema migration
supabase db push

# Or manually run migrations (use actual timestamped filenames)
psql postgresql://postgres:postgres@localhost:54322/postgres < supabase/migrations/20260124231200_mvp_schema.sql
psql postgresql://postgres:postgres@localhost:54322/postgres < supabase/migrations/20260124231201_rls_policies.sql
psql postgresql://postgres:postgres@localhost:54322/postgres < supabase/migrations/20260124231202_indexes.sql
psql postgresql://postgres:postgres@localhost:54322/postgres < supabase/migrations/20260131000000_tenant_context_function.sql

# Verify tables created
supabase db diff

# Seed development data (optional)
psql postgresql://postgres:postgres@localhost:54322/postgres < supabase/seed.sql
```

## Step 4: Configure Environment Variables

### Create `.env` files for each app

**Root `.env`** (shared):
```bash
# Copy example
cp .env.example .env

# Edit .env
NODE_ENV=development
```

**`apps/admin/.env`**:
```bash
# Supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGc...  # From supabase start output

# API
VITE_API_URL=http://localhost:3000/api/v1
```

**`apps/worker/.env`**:
```bash
# Supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# API
VITE_API_URL=http://localhost:3000/api/v1
```

**`apps/api/.env`**:
```bash
# Supabase
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Service role key (has RLS bypass)

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-key-here-min-32-chars

# Google OAuth (see Step 5)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/integrations/google-calendar/callback

# SMS Provider (see Step 6)
MOBILEMESSAGE_USERNAME=your-username
MOBILEMESSAGE_API_KEY=your-api-key
MOBILEMESSAGE_SANDBOX=true  # Use sandbox mode for development

# Encryption Key (for OAuth tokens, generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your-encryption-key-64-hex-chars

# Server
PORT=3000
NODE_ENV=development
```

## Step 5: Set Up Google Calendar OAuth

### Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Create new project: `cleanconnect-dev`
3. Enable Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search "Google Calendar API"
   - Click "Enable"

### Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type
3. Fill in:
   - App name: `CleanConnect Dev`
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
5. Add test users: your Google account email
6. Save

### Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: "Web application"
4. Name: `CleanConnect Dev`
5. Authorized redirect URIs:
   - `http://localhost:3000/api/v1/integrations/google-calendar/callback`
6. Click "Create"
7. Copy **Client ID** and **Client Secret**
8. Add to `apps/api/.env`:
   ```bash
   GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-abc123...
   ```

## Step 6: Set Up MobileMessage.au (SMS Provider)

### Create Account

1. Go to https://mobilemessage.com.au
2. Sign up for free account
3. Verify email and phone number
4. Add $10 credit (2¢/SMS intro rate = 500 SMS)

### Get API Credentials

1. Log in to dashboard
2. Go to "API Settings"
3. Copy:
   - Username
   - API Key
4. Add to `apps/api/.env`:
   ```bash
   MOBILEMESSAGE_USERNAME=your-username
   MOBILEMESSAGE_API_KEY=your-api-key
   ```

### Enable Sandbox Mode (Development)

```bash
# In apps/api/.env
MOBILEMESSAGE_SANDBOX=true
```

**Sandbox mode**: SMS not actually sent, but logged and marked as "delivered" for testing.

## Step 7: Start Development Servers

### Terminal 1: API Server (Hono.js)

```bash
cd apps/api
pnpm dev

# Server starts on http://localhost:3000
# API available at http://localhost:3000/api/v1
```

### Terminal 2: Admin Dashboard (React)

```bash
cd apps/admin
pnpm dev

# Vite dev server starts on http://localhost:5173
```

### Terminal 3: Worker Dashboard (React)

```bash
cd apps/worker
pnpm dev

# Vite dev server starts on http://localhost:5174
```

### Verify All Services Running

Open browser and check:
- ✅ Admin Dashboard: http://localhost:5173
- ✅ Worker Dashboard: http://localhost:5174
- ✅ API Health: http://localhost:3000/api/v1/health
- ✅ Supabase Studio: http://localhost:54323

## Step 8: Verify Setup with Test Flow

### 1. Register Admin User

```bash
# Using curl
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "TestPass123!",
    "organizationName": "Test Cleaning Co",
    "fullName": "Test Admin"
  }'

# Response should include:
# - user object
# - organization object
# - accessToken (JWT)
```

### 2. Create Worker

```bash
# Save JWT from previous response
export TOKEN="eyJhbGc..."

curl -X POST http://localhost:3000/api/v1/workers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "fullName": "John Doe",
    "phoneNumber": "+61412345678",
    "calendarEmail": "john@test.com"
  }'

# Response should include worker object with ID
```

### 3. Send Test SMS

```bash
# Save worker ID from previous response
export WORKER_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X POST http://localhost:3000/api/v1/sms/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "workerId": "'$WORKER_ID'",
    "message": "Hi {name}, here is your test dashboard",
    "expiryHours": 8
  }'

# Response should include:
# - SMS log with status "sent"
# - Dashboard token
```

### 4. Access Worker Dashboard

```bash
# Extract token from SMS log response
export DASHBOARD_TOKEN="eyJhbGc..."

# Open in browser (or curl)
curl "http://localhost:3000/api/v1/dashboard?token=$DASHBOARD_TOKEN"

# Response should include:
# - worker details
# - scheduleItems array (empty if no calendar connected)
# - organization name
```

## Step 9: Development Workflow

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests for specific app
cd apps/api
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Linting & Type Checking

```bash
# Lint all code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type check all TypeScript
pnpm type-check
```

### Database Management

```bash
# View database in Supabase Studio
open http://localhost:54323

# Reset database (WARNING: deletes all data)
supabase db reset

# Create new migration
supabase migration new add_new_feature

# Apply migrations
supabase db push

# Generate TypeScript types from database
supabase gen types typescript --local > packages/shared/src/types/database.ts
```

### Hot Reload & Live Updates

All apps support hot module replacement (HMR):
- **Admin/Worker**: Vite HMR - instant UI updates
- **API**: Node.js watch mode - auto-restart on file changes

## Step 10: Common Development Tasks

### Add New API Endpoint

1. Create route handler in `apps/api/src/routes/`
2. Add route to `apps/api/src/index.ts`
3. Update OpenAPI spec in `specs/001-sms-dashboard-mvp/contracts/openapi.yaml`
4. Add tests in `apps/api/tests/integration/`
5. Update TypeScript types in `packages/shared/src/types/`

### Add New React Component

1. Create component in `apps/admin/src/components/` or `packages/ui/src/components/`
2. Add Storybook story (future)
3. Add tests in `apps/admin/tests/unit/`
4. Export from package if shared

### Add New Database Table

1. Create migration: `supabase migration new add_table_name`
2. Write SQL in `supabase/migrations/XXX_add_table_name.sql`
3. Add RLS policies in same migration
4. Apply migration: `supabase db push`
5. Update TypeScript types: `supabase gen types typescript --local`
6. Add to data model documentation

### Connect Google Calendar (Manual Test)

1. Start all servers
2. Open Admin Dashboard: http://localhost:5173
3. Log in with test admin account
4. Go to "Integrations" page
5. Click "Connect Google Calendar"
6. Authorize with your Google account
7. Verify connection shows "Active" status
8. Create test event in Google Calendar
9. Send SMS to worker
10. Open worker dashboard link
11. Verify calendar event appears in schedule

## Troubleshooting

### Supabase Connection Issues

```bash
# Check if Supabase is running
supabase status

# Restart Supabase
supabase stop
supabase start

# Check logs
supabase logs
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or change port in .env
PORT=3001
```

### TypeScript Errors

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache

# Rebuild all packages
pnpm clean
pnpm install
pnpm build

# Restart TypeScript server in VS Code
Cmd+Shift+P > "TypeScript: Restart TS Server"
```

### Database Migration Errors

```bash
# Check current migration status
supabase migration list

# Rollback last migration
supabase migration down

# Reset database and reapply all migrations
supabase db reset
```

### Google OAuth Errors

**Error**: `redirect_uri_mismatch`
- **Fix**: Verify redirect URI in Google Console matches exactly:
  - `http://localhost:3000/api/v1/integrations/google-calendar/callback`

**Error**: `invalid_client`
- **Fix**: Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

**Error**: `access_denied`
- **Fix**: Add your Google account as test user in OAuth consent screen

### SMS Sending Errors

**Error**: `RATE_LIMIT_EXCEEDED`
- **Fix**: Wait 1 hour or increase `sms_limit_per_hour` in organizations table

**Error**: `Invalid phone number`
- **Fix**: Ensure phone number is in E.164 format: `+61412345678`

**Sandbox mode not working**
- **Fix**: Set `MOBILEMESSAGE_SANDBOX=true` in `apps/api/.env`

## Development Tools

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "Prisma.prisma",
    "ms-vscode.vscode-typescript-next",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

### Useful Scripts

```bash
# Clean all build artifacts
pnpm clean

# Build all apps for production
pnpm build

# Run production build locally
pnpm start

# Generate TypeScript types from database
pnpm db:types

# Format all code
pnpm format

# Check for outdated dependencies
pnpm outdated

# Update dependencies
pnpm update
```

## Next Steps

1. **Read the Architecture**: Review `specs/001-sms-dashboard-mvp/research.md`
2. **Understand Data Model**: Review `specs/001-sms-dashboard-mvp/data-model.md`
3. **API Reference**: Review `specs/001-sms-dashboard-mvp/contracts/openapi.yaml`
4. **Start Building**: Follow task breakdown in `specs/001-sms-dashboard-mvp/tasks.md` (generated by `/speckit.tasks`)

## Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **Hono.js Docs**: https://hono.dev
- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev
- **shadcn/ui**: https://ui.shadcn.com
- **TanStack Query**: https://tanstack.com/query
- **Zustand**: https://zustand-demo.pmnd.rs

## Support

- **GitHub Issues**: https://github.com/your-org/cleanconnect/issues
- **Team Slack**: #cleanconnect-dev
- **Documentation**: `docs/` folder in repository

---

**Setup Complete!** 🎉

You now have a fully functional development environment. Start building by following the task breakdown in `tasks.md`.
