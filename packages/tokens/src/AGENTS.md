# Tokens Source Agent Guide

## Scope
Token provider implementations and helpers.

## Rules
- Keep provider logic in `providers/` and export via `index.ts`.
- Avoid logging secrets; log only token IDs or hashes.
- Validate inputs and return clear error types.

## Touchpoints
- Providers: `packages/tokens/src/providers`

## Tests
- Mock crypto/time when testing token expiry.
