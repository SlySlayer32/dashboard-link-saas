# API Types Agent Guide

## Scope
API-specific types and context definitions.

## Rules
- Prefer shared contracts from `@dashboard-link/shared`.
- Keep Hono context types here (e.g., auth context).
- Avoid duplicate domain models.

## Touchpoints
- Shared types: `packages/shared`
- Auth context: `apps/api/src/middleware/auth.ts`

## Tests
- Types are checked by TypeScript; no direct tests.
