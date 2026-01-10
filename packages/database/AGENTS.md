# Database Package Agent Guide

## Scope
Database adapters, repositories, DI container, and migrations. Start with root `AGENTS.md`.

## Rules
- Apps should use repositories and DI container from this package.
- Adapters encapsulate Supabase or mock implementations.
- Keep queries tenant-scoped and RLS-compatible.
- Migrations are SQL and append-only.

## Touchpoints
- Source: `packages/database/src`
- Migrations: `packages/database/migrations`

## Tests
- Add repository tests under `packages/database/src/__tests__` if present.
