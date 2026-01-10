# Dashboard Link/CleanConnect Agent Guide

## Scope
Global instructions for the repo. Read this first, then the closest AGENTS.md for the area you are editing.

## Rules
- Architecture is Zapier-style: core services -> contracts -> adapters -> external services.
- Multi-tenant isolation is required: always scope by organizationId and respect RLS.
- Use the fixed stack only (Hono + Supabase, Vite/React 18, Tailwind + shadcn/ui, Zustand, TanStack Query, React Hook Form + Zod, BullMQ + Redis, MobileMessage).
- Prefer types and contracts from `@dashboard-link/shared`.
- Vendor SDKs belong in adapters under `packages/*/src`; apps and core services must not call vendors directly.
- Validate inputs with Zod and return consistent error shapes used by existing routes.
- Supabase SQL migrations live in `packages/database/migrations` and are append-only.
- Known placeholders exist in `apps/api/src/routes/workers.ts`, `apps/api/src/routes/organizations.ts`, `apps/api/src/routes/manual-data.ts`, `apps/api/src/routes/webhooks.ts`, `apps/api/src/routes/tokens.ts`.

## Touchpoints
- Architecture: `docs/ARCHITECTURE_BLUEPRINT.md`.
- Plans: `plan/PHASE_*.md`.
- App entry points: `apps/admin`, `apps/worker`, `apps/api`.
- Shared packages: `packages/*` (auth, database, plugins, shared, sms, tokens, ui).
- Env templates: `ENV.example`, `apps/admin/.env`, `apps/worker/.env`.

## Tests
- `pnpm test` (all)
- `pnpm --filter @dashboard-link/api test`
- `pnpm --filter @dashboard-link/admin test`
- `pnpm --filter @dashboard-link/ui test`
