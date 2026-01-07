# Dashboard Link SaaS — Root Agent Instructions

## Architecture (Zapier-style)
This repo follows a Zapier-style, layered architecture (see `docs/ARCHITECTURE_BLUEPRINT.md`).
- **Core services** are stable and do not depend on vendors directly.
- **Contracts** (interfaces) define how adapters plug in.
- **Adapters** implement vendor-specific behavior (SMS, plugins, storage).
- **External services** live outside the core and are accessed only through adapters.

## Project Overview
Dashboard Link is a multi-tenant SaaS that delivers worker dashboards via SMS links.
Monorepo layout:
- `apps/admin`: Admin dashboard (React + Vite)
- `apps/worker`: Worker dashboard (React + Vite)
- `apps/api`: Hono API service
- `packages/*`: shared libraries (auth, database, plugins, shared, sms, tokens, ui)
- `packages/database/migrations`: Supabase SQL migrations
- `supabase/`: local Supabase config

## Developer Setup
### Prerequisites
- Node.js 18+
- pnpm 9+
- Supabase CLI (for local database operations)

### Install
```bash
git clone https://github.com/SlySlayer32/dashboard-link-saas.git
cd dashboard-link-saas
pnpm install
```

### Environment Setup
Copy the template and fill required variables:
```bash
cp ENV.example .env
```

Frontend apps also need Vite envs:
- `apps/admin/.env` (at least `VITE_API_URL`)
- `apps/worker/.env` (at least `VITE_API_URL`)

### Run (Development)
```bash
pnpm dev
```

Ports:
- Admin: http://localhost:5173
- Worker: http://localhost:5174
- API: http://localhost:3000

### Run (Individual Apps)
```bash
pnpm --filter @dashboard-link/api dev
pnpm --filter @dashboard-link/admin dev
pnpm --filter @dashboard-link/worker dev
```

### Database Operations (Supabase)
```bash
pnpm db:start
pnpm db:migrate
pnpm db:seed
pnpm db:stop
```

### Testing
```bash
pnpm test
pnpm --filter @dashboard-link/api test
pnpm --filter @dashboard-link/admin test
pnpm --filter @dashboard-link/ui test
```

### Linting & Formatting
```bash
pnpm lint
pnpm format
```

### Build
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

## Global Standards
- TypeScript everywhere.
- ESM (`"type": "module"`).
- Linting: `eslint.config.js` (flat config).
- Formatting: Prettier (`.prettierrc.json`).
- Use pnpm workspaces + Turborepo.

## Global Rules
- Prefer shared types from `@dashboard-link/shared`.
- Keep vendor-specific code in adapters under `packages/*/src`.
- Keep services clean of vendor SDKs—use contracts/registries instead.

## Testing Philosophy
- Unit/integration tests with Vitest.
- React Testing Library for UI components.
- Avoid real external API calls in tests.

## Git Conventions
No explicit convention is defined in-repo. Use clear, imperative commit messages.

## Directory-Specific Agents
See `agents.md` files in subdirectories for scoped rules.
