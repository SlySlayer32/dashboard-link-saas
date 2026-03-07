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

4. **Link Supabase project:**
   ```bash
   npx supabase link --project-ref <your-project-ref>
   ```

5. **Apply database migrations:**
   ```bash
   npx supabase db push
   ```

6. **(Optional) Seed database:**
   ```bash
   npx supabase db reset
   ```

## Running the App

### Development mode (all apps):
```bash
pnpm dev
```

This starts:
- Admin dashboard: http://localhost:5173 ✅ (verified in `apps/admin/vite.config.ts`)
- Worker dashboard: http://localhost:5174 ✅ (verified in `apps/worker/vite.config.ts`)
- API server: http://localhost:3000 ✅ (verified in `apps/api/src/index.ts`)

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
**Solution:** Check project ref is correct:
```bash
npx supabase projects list
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
**Solution:** Check `.env` has correct Supabase URL and anon key:
```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```
