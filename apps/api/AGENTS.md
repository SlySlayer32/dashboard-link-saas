# API App Agent Guide

## Scope
Hono API service backing admin and worker apps. Start with root `AGENTS.md`.

## Rules
- Route handlers stay thin; use services and repositories from packages.
- Use adapters/registries for external vendors (SMS, plugins, tokens).
- Enforce tenant scoping and return appropriate HTTP status codes.

## Touchpoints
- Source: `apps/api/src`
- Env config: `apps/api/src/config/env.ts`

## Tests
- Use Vitest tests under `apps/api/src/test`.
