# Developer Instructions

## Zapier-Style Architecture
This project follows a Zapier-style layered architecture as described in `docs/ARCHITECTURE_BLUEPRINT.md`:
- **Core services** are stable.
- **Contracts** define integration boundaries.
- **Adapters** implement vendor-specific logic.
- **External services** are only accessed via adapters.

Keep UI and API code free of vendor SDKs; use packages (`plugins`, `sms`, `tokens`, `auth`, `database`) to access external services.

## Prerequisites
- Node.js 18+
- pnpm 9+
- Supabase CLI (for local database operations)

## Install
```bash
git clone https://github.com/SlySlayer32/dashboard-link-saas.git
cd dashboard-link-saas
pnpm install
```

## Environment Setup
Copy the template and fill required variables:
```bash
cp ENV.example .env
```

Frontend apps also need Vite envs:
- `apps/admin/.env` (at least `VITE_API_URL`)
- `apps/worker/.env` (at least `VITE_API_URL`)

## Run (Development)
```bash
pnpm dev
```

Ports:
- Admin: http://localhost:5173
- Worker: http://localhost:5174
- API: http://localhost:3000

## Run (Individual Apps)
```bash
pnpm --filter @dashboard-link/api dev
pnpm --filter @dashboard-link/admin dev
pnpm --filter @dashboard-link/worker dev
```

## Database Operations (Supabase)
```bash
pnpm db:start
pnpm db:migrate
pnpm db:seed
pnpm db:stop
```

## Testing
```bash
pnpm test
pnpm --filter @dashboard-link/api test
pnpm --filter @dashboard-link/admin test
pnpm --filter @dashboard-link/ui test
```

## Linting & Formatting
```bash
pnpm lint
pnpm format
```

## Build
```bash
pnpm build
```

## Known Limitations (Documented)
These behaviors are currently placeholders and must be implemented for production:
- `apps/api/src/routes/workers.ts` and `apps/api/src/routes/organizations.ts` contain placeholder organization resolution logic.
- `apps/api/src/routes/manual-data.ts` returns placeholder schedule/task data.
- `apps/api/src/routes/webhooks.ts` has TODOs for event listing and replay behavior.
- `apps/api/src/routes/tokens.ts` notes missing pagination and per-token revocation in token providers.

## Adding Features
- **New API route**: add under `apps/api/src/routes` and use Zod validation.
- **New plugin adapter**: add in `packages/plugins/src` and register in the plugin registry.
- **New SMS provider**: add in `packages/sms/src/providers` and register in `SMSProviderFactory`.

## Scripts & Automation

Root scripts (from `package.json`):
- `pnpm dev` — run all apps via Turbo
- `pnpm build` — build all packages/apps
- `pnpm lint` / `pnpm lint:fix`
- `pnpm format` / `pnpm format:check`
- `pnpm test` — run all tests via Turbo
- `pnpm clean` — clean builds and node_modules
- `pnpm db:start` / `pnpm db:stop` — Supabase local
- `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:reset`

Orchestration scripts (see `scripts/orchestration`):
- `pnpm --dir scripts/orchestration build`
- `pnpm --dir scripts/orchestration orchestrate`
- `pnpm --dir scripts/orchestration run-skill`
- `pnpm --dir scripts/orchestration aggregate`
- `pnpm --dir scripts/orchestration post-comment`
