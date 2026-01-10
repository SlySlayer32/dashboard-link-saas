# API Config Agent Guide

## Scope
Environment validation and runtime configuration.

## Rules
- `env.ts` is the source of truth for required variables.
- Validate with Zod and fail fast for missing required values.
- When adding env vars, update `ENV.example` and app `.env` docs.

## Touchpoints
- Env config: `apps/api/src/config/env.ts`
- Template: `ENV.example`

## Tests
- Config is validated at startup; add unit tests if parsing logic grows.
