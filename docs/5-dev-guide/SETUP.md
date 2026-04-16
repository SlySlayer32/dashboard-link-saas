# Local Setup

## Prerequisites
- **Node.js:** 18+ LTS (check with `node --version`)
- **pnpm:** 8+ (install with `npm install -g pnpm`)
- **Git:** For cloning repository
- **Supabase CLI:** For database migrations (install with `npm install -g supabase`)
- **Accounts required:**
  - Supabase account (free tier)
  - MobileMessage.com.au account (for SMS testing)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd CleanConnect
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in required values (see ENV-VARIABLES.md)

4. **Start local Supabase:**
   ```bash
   pnpm db:start
   ```

5. **Apply local database migrations:**
   ```bash
   pnpm db:migrate
   ```

6. **(Optional) Seed local database:**
   ```bash
   pnpm db:reset
   ```

### Hosted Supabase Is An Explicit Step, Not The Default

Do not keep the repo persistently linked to a hosted Supabase project during normal development.

Only link intentionally when you are performing a controlled hosted operation such as `db push`, `db pull`, or `db dump`, and prefer passing credentials through environment variables for that one command:

```bash
$env:SUPABASE_DB_PASSWORD='<database-password>'
npx supabase link --project-ref <project-ref>
```

After the hosted task, remove the repo-local link artifacts from `supabase/.temp/` so the local project stays environment-neutral.

## Running the App

### Development mode (all apps):
```bash
pnpm dev
```

This starts:
- Admin dashboard: http://localhost:5173 ✅ (verified in `apps/admin/vite.config.ts`)
- Worker dashboard: http://localhost:5174 ✅ (verified in `apps/worker/vite.config.ts`)
- API server: http://localhost:3001 ✅ (verified in `apps/api/src/index.ts`)

### Run individual apps:
```bash
# Admin dashboard only
pnpm --filter @dashboard-link/admin dev

# Worker dashboard only
pnpm --filter @dashboard-link/worker dev

# API server only
pnpm --filter @dashboard-link/api dev
```

### Build for production:
```bash
pnpm build
```

### Run tests:
```bash
pnpm test
```

### Lint code:
```bash
pnpm lint
```

## Common Setup Issues

### Issue: `pnpm install` fails with "EACCES: permission denied"
**Solution:** Don't use `sudo`. Fix npm permissions:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Issue: Supabase CLI can't connect
**Solution:** If you are working locally, make sure the local stack is running:
```bash
pnpm db:start
```

If you are intentionally working against a hosted project, link only for that task:
```bash
$env:SUPABASE_DB_PASSWORD='<database-password>'
npx supabase link --project-ref <correct-ref>
```

### Issue: Database migrations fail
**Solution:** Reset database and reapply:
```bash
npx supabase db reset
```

### Issue: Port already in use (5173, 5174, or 3000)
**Solution:** Kill process using port:
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5173 | xargs kill -9
```

### Issue: TypeScript errors after pulling latest code
**Solution:** Clean install dependencies:
```bash
pnpm clean
pnpm install
```

### Issue: Supabase Auth not working locally
**Solution:** Check `.env` has the local Supabase URL and anon key:
```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<local-anon-key>
```
