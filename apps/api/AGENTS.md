# API Instructions

This file applies to `apps/api`.

## Runtime Rules

- This is Node ESM code that must run in both `tsx` dev mode and the built server entrypoint.
- Use explicit `.js` extensions for relative runtime imports in TypeScript source.
- Keep the package `start` path and the emitted `dist` layout aligned.

## API Rules

- Mount app routes under `/api/v1` unless there is a deliberate public exception.
- Validate request inputs with Zod.
- Preserve the Hono middleware chain and keep auth/tenant logic explicit.
- Never trust client-supplied organization scope when server-side context already exists.
- Prefer repository and service layers over putting database logic directly in route handlers.

## Multi-Tenant Safety

- Keep tenant scoping enforced for protected data.
- Do not introduce routes that bypass auth or tenant checks unless they are intentionally public.
- Public token-based worker flows must stay isolated from admin auth flows.

## Verification

- Run `pnpm --filter @dashboard-link/api build`.
- If startup, imports, or runtime wiring changed, also run `pnpm --filter @dashboard-link/api start` and verify `/health`.

