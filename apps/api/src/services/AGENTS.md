# API Services Agent Guide

## Scope
Business logic and integration orchestration.

## Rules
- Use repositories from `@dashboard-link/database`; never query Supabase directly here.
- Use adapters/registries for external vendors (SMS, plugins, tokens).
- Enforce organization scoping in every method.
- Map external errors to domain errors and log with context.

## Touchpoints
- Repositories: `packages/database/src`
- Adapters: `packages/sms`, `packages/plugins`, `packages/tokens`

## Tests
- Add unit tests for service logic in `apps/api/src/test`.
