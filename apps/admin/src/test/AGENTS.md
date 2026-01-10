# Admin Tests Agent Guide

## Scope
Tests for admin app components, hooks, and utilities.

## Rules
- Use Vitest + Testing Library.
- Mock network and external dependencies.
- Favor behavior-focused tests over snapshots.

## Touchpoints
- Components: `apps/admin/src/components`
- Hooks: `apps/admin/src/hooks`
- Services: `apps/admin/src/services`

## Tests
- Run with `pnpm --filter @dashboard-link/admin test`.
