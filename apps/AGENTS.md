# Apps Directory

## Scope
Contains deployable applications: `admin`, `worker`, `api`.

## Zapier-style Guidance
- App layers must talk to core services via contracts and registries.
- Avoid embedding vendor SDK logic in app code; use `packages/*` adapters.

## Common Commands
- `pnpm --filter @dashboard-link/admin dev`
- `pnpm --filter @dashboard-link/worker dev`
- `pnpm --filter @dashboard-link/api dev`
