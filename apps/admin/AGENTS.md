# Admin App Instructions

This file applies to `apps/admin`.

## Stack

- React 18
- Vite
- TanStack Query
- Tailwind CSS
- Zustand

## Rules

- Prefer existing hook and API-client patterns before introducing new fetch logic.
- If a component or pattern will be shared with the worker app, move it to `packages/ui`.
- Keep API fallbacks env-driven; prefer `VITE_API_URL` or `/api` proxy fallback over hardcoded local hosts.
- Preserve clear loading, error, empty, and success states for manager workflows.
- Keep manager actions safe and reversible where practical.

## Verification

- Run `pnpm --filter @dashboard-link/admin build`.
- If you changed maintained tests or critical manager flows, run `pnpm --filter @dashboard-link/admin test`.

