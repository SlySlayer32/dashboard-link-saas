# UI Tests Agent Guide

## Scope
Tests for shared UI components and hooks.

## Rules
- Use Vitest + Testing Library.
- Prefer behavior-driven tests; avoid fragile snapshots.

## Touchpoints
- Components: `packages/ui/src/components`
- Hooks: `packages/ui/src/hooks`

## Tests
- Run with `pnpm --filter @dashboard-link/ui test`.
