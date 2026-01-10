# Database Source Agent Guide

## Scope
Repository implementations, adapters, and DI container.

## Rules
- Use repository pattern; keep query logic encapsulated.
- Use adapter interfaces for DB operations; no direct Supabase usage outside adapters.
- Pass `organizationId` through repository calls to enforce tenant scope.
- Use transactions for multi-step writes.

## Touchpoints
- Adapters: `packages/database/src/adapters`
- Repositories: `packages/database/src/repositories`
- DI container: `packages/database/src/di`

## Tests
- Mock adapters in repository tests.
