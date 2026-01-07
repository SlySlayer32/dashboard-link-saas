# Setup Guide

## System Requirements
- Node.js 18+
- pnpm 9+
- Supabase CLI

## Install Dependencies
```bash
git clone https://github.com/SlySlayer32/dashboard-link-saas.git
cd dashboard-link-saas
pnpm install
```

## Environment
```bash
cp ENV.example .env
```

Create frontend env files:
```bash
cat <<'ENV' > apps/admin/.env
VITE_API_URL=http://localhost:3000
ENV

cat <<'ENV' > apps/worker/.env
VITE_API_URL=http://localhost:3000
ENV
```

## Start Local Services
```bash
pnpm db:start
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Verify:
- Admin: http://localhost:5173
- Worker: http://localhost:5174
- API: http://localhost:3000/health

## Troubleshooting
- If API fails env validation, ensure `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `JWT_SECRET` are set.
- If SMS sending fails, confirm SMS provider envs are configured.
