# API Source Agent Guide

## Scope
API service source code.

## Rules
- Routes in `routes/` should validate input with Zod + `zValidator`.
- Use `authMiddleware` to set `userId`, `organizationId`, and `userRole` in context.
- Keep business logic in `services/` and DB access in repositories (`@dashboard-link/database`).
- Log with `logger` and include tenant or request context when available.

## Touchpoints
- Routes: `apps/api/src/routes`
- Services: `apps/api/src/services`
- Middleware: `apps/api/src/middleware`
- Config: `apps/api/src/config`

## Tests
- Tests live in `apps/api/src/test`.
