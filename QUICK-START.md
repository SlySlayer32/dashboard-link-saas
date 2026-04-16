# Quick Start

## Prerequisites

- Node.js 18+
- pnpm 9+
- Supabase project
- MobileMessage account for SMS delivery

## Install

```bash
pnpm install
```

## Configure Environment Variables

Create local environment files from [.env.example](/E:/CleanConnect/.env.example) and the documented keys in [ENV-VARIABLES.md](/E:/CleanConnect/docs/5-dev-guide/ENV-VARIABLES.md).

At minimum you need:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET`
- `MOBILE_MESSAGE_USERNAME`
- `MOBILE_MESSAGE_PASSWORD`
- `CORS_ORIGIN`

## Start Local Infrastructure

For normal development, use local Supabase:

```bash
pnpm db:start
pnpm db:migrate
```

Do not keep the repo linked to a hosted Supabase project by default. Only link intentionally for hosted admin tasks.

## Start the Workspace

```bash
pnpm dev
```

Local app URLs:

- Admin: `http://localhost:5173`
- Worker: `http://localhost:5174`
- API: `http://localhost:3001`

## Daily Developer Workflow

```bash
pnpm build
pnpm lint
pnpm test
```

Helpful repo-level checks:

```bash
pnpm dev:check
pnpm lint:report
```

## MVP Verification Flow

Use this as the minimum manual verification path after local changes:

1. Sign in to the admin app.
2. Create a worker.
3. Open Manual Data and add schedule/task content.
4. Send a dashboard link from worker detail.
5. Open the worker dashboard link.
6. Confirm dashboard-open history appears in admin.
