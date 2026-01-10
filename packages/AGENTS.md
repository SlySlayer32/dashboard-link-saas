# Packages Agent Guide

## Scope
Shared libraries used by all apps. Start with root `AGENTS.md`.

## Rules
- Packages must be app-agnostic and stable.
- Export public APIs from each package `src/index.ts`.
- Prefer shared contracts in `@dashboard-link/shared` and keep adapters in dedicated packages.

## Touchpoints
- `packages/auth`, `packages/database`, `packages/plugins`, `packages/shared`, `packages/sms`, `packages/tokens`, `packages/ui`

## Tests
- Run package tests with `pnpm --filter @dashboard-link/<package> test` where applicable.
