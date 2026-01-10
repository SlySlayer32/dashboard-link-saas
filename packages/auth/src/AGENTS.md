# Auth Source Agent Guide

## Scope
Auth implementation details and providers.

## Rules
- Keep public exports in `packages/auth/src/index.ts`.
- Validate provider config and throw clear errors.
- Avoid app-specific dependencies.

## Touchpoints
- Providers: `packages/auth/src/providers`
- Contracts: `packages/shared`

## Tests
- Mock external auth providers in tests.
