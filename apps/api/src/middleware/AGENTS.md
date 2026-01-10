# API Middleware Agent Guide

## Scope
Request middleware for auth, logging, and cross-cutting concerns.

## Rules
- Middleware should be side-effect minimal and fast.
- Auth middleware must set `userId`, `organizationId`, and `userRole` in context.
- Use consistent error handling and avoid leaking sensitive data.

## Touchpoints
- Auth middleware: `apps/api/src/middleware/auth.ts`
- Logger: `apps/api/src/utils/logger.ts`

## Tests
- Test middleware behavior in `apps/api/src/test` when logic is complex.
