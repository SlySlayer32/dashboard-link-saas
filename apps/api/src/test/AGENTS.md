# API Tests Agent Guide

## Scope
Tests for API routes, services, and utilities.

## Rules
- Use Vitest and mock external dependencies (Supabase, SMS, plugins).
- Favor integration tests for route + service flows when possible.
- Avoid network calls.

## Touchpoints
- Routes: `apps/api/src/routes`
- Services: `apps/api/src/services`

## Tests
- Run with `pnpm --filter @dashboard-link/api test`.
