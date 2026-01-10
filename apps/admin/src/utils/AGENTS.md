# Admin Utils Agent Guide

## Scope
Pure helpers and cross-cutting utilities for the admin app.

## Rules
- Keep functions side-effect free; push IO to services.
- Prefer shared utilities from `@dashboard-link/shared` or `@dashboard-link/ui` when applicable.
- Keep helpers small and well-typed.

## Touchpoints
- Auth helper: `apps/admin/src/utils/authInterceptor.ts`
- Phone formatting: `apps/admin/src/utils/phoneUtils.ts`

## Tests
- Utility tests can live in `apps/admin/src/test`.
