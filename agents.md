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
