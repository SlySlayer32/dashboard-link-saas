# API Routes Agent Guide

## Scope
HTTP endpoints for the API.

## Rules
- Use Hono route modules; validate input with Zod + `zValidator`.
- Read `userId` and `organizationId` from context after auth; do not re-resolve unless required by TODOs.
- Keep handlers thin; delegate to services/repositories.
- Follow existing response shapes in the route file; do not change payloads without updating clients.

## Touchpoints
- Middleware: `apps/api/src/middleware/auth.ts`
- Services: `apps/api/src/services`

## Tests
- Add route tests under `apps/api/src/test` when adding new endpoints.
