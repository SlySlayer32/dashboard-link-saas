# CleanConnect Development Setup Guide

This guide will help you set up the CleanConnect project for local development.

## Prerequisites

- Node.js 18+ 
- pnpm 8+
- Supabase CLI
- Git

## 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd CleanConnect
pnpm install
```

## 2. Set up Supabase

### Install Supabase CLI
```bash
# macOS
brew install supabase/tap/supabase

# Windows
winget install Supabase.CLI

# Linux
curl -L https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar xz
sudo mv supabase /usr/local/bin/
```

### Start Supabase locally
```bash
# Start the local Supabase stack
pnpm db:start

# This will start:
# - PostgreSQL on port 54322
# - Supabase API on port 54321
# - Supabase Studio on port 54323
```

### Run migrations
```bash
# Apply all database migrations
pnpm db:migrate

# Verify migrations
pnpm db:diff
```

### Seed the database (optional)
```bash
# Load seed data
pnpm db:seed
```

## 3. Environment Configuration

### Create environment file
```bash
# Copy the example environment file
cp .env.example .env
```

### Update .env with local Supabase values
```env
# === App URLs ===
APP_URL=http://localhost:5173
API_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000

# === Node/Runtime ===
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info

# === Supabase (Local) ===
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_KEY=your-local-service-key
SUPABASE_JWT_SECRET=your-local-jwt-secret

# Get these values from:
# 1. Supabase Studio: http://localhost:54323
# 2. Or run: supabase status
```

### Get Supabase keys
```bash
# Check Supabase status to get keys
supabase status

# Look for these values:
# - API URL (already set above)
# - anon key (public)
# - service_role key (secret)
# - JWT secret (for token verification)
```

## 4. Start Development Servers

### Start all applications
```bash
# Start all apps in development mode
pnpm dev
```

This will start:
- Admin Dashboard: http://localhost:5173
- Worker Dashboard: http://localhost:5174
- API Server: http://localhost:3000
- API Documentation: http://localhost:3000/docs

### Or start individual apps
```bash
# API only
pnpm --filter @dashboard-link/api dev

# Admin only
pnpm --filter @dashboard-link/admin dev

# Worker only
pnpm --filter @dashboard-link/worker dev
```

## 5. Verify Setup

### Check API health
```bash
curl http://localhost:3000/health
```

### Access Supabase Studio
- Open http://localhost:54323
- Sign in with any email/password (local mode accepts all)
- Explore the database tables

### Test API endpoints
```bash
# Get API status
curl http://localhost:3000/

# Check v1 API
curl http://localhost:3000/api/v1
```

## 6. SMS Provider Setup (Optional)

For SMS functionality, you'll need to configure an SMS provider:

### MobileMessage.au (Recommended for Australia)
```env
MOBILEMESSAGE_USERNAME=your-username
MOBILEMESSAGE_PASSWORD=your-password
MOBILEMESSAGE_SENDER_ID=DashLink
```

### Twilio (Alternative)
```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_DEFAULT_FROM=+1234567890
```

## 7. Plugin Configuration (Optional)

### Google Calendar
1. Go to Google Cloud Console
2. Create a new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:54321/auth/v1/callback`

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 8. Common Issues

### Supabase won't start
```bash
# Check if ports are available
netstat -an | grep 5432[0-9]

# Reset Supabase if needed
pnpm db:reset
```

### Migration errors
```bash
# Check migration status
supabase migration list

# Re-run migrations
supabase db push
```

### Permission errors
```bash
# Ensure proper file permissions
chmod -R 755 supabase/
```

## 9. Development Workflow

### Making database changes
1. Create new migration: `supabase migration new new_feature`
2. Write SQL in the created file
3. Apply migration: `supabase db push`

### Running tests
```bash
# Run all tests
pnpm test

# Run API tests
pnpm --filter @dashboard-link/api test

# Type checking
pnpm typecheck
```

### Linting
```bash
# Lint all packages
pnpm lint

# Fix lint issues
pnpm lint:fix
```

## 10. Next Steps

Once setup is complete:

1. **Create an organization** in the Admin Dashboard
2. **Add workers** to your organization
3. **Configure plugins** (Google Calendar, etc.)
4. **Send test SMS** to workers
5. **View worker dashboard** via SMS link

## Helpful Commands

```bash
# Database operations
pnpm db:start          # Start Supabase
pnpm db:stop           # Stop Supabase
pnpm db:reset          # Reset database
pnpm db:migrate        # Run migrations
pnpm db:seed           # Seed database
pnpm db:diff           # Show schema changes

# Development
pnpm dev               # Start all apps
pnpm build             # Build all apps
pnpm test              # Run tests
pnpm typecheck         # Check types
pnpm lint              # Lint code

# Supabase CLI
supabase status        # Check status
supabase logs          # View logs
supabase db shell      # Database shell
```

## Troubleshooting

For more help:

1. Check the [documentation](../docs/)
2. Review the [implementation checklist](../docs/V1_IMPLEMENTATION_CHECKLIST.md)
3. Check the [project plan](../plan/PLAN_INDEX.md)
4. Review existing issues in the repository

## Architecture Overview

- **API Gateway**: Hono.js with TypeScript
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Auth**: Supabase Auth with JWT
- **Frontend**: React + Vite + Tailwind CSS
- **SMS**: MobileMessage.au (primary) with Twilio fallback
- **Plugins**: Adapter pattern for external integrations

Remember: This is an MVP focused on the core flow - Admin → Google Calendar → SMS → Worker Dashboard.
