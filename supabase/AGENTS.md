# Supabase Agent Guide

## Scope
Local Supabase configuration and tooling.

## Rules
- Keep `supabase/config.toml` aligned with local dev needs.
- Do not commit secrets or service keys.
- Use Supabase CLI commands via `pnpm db:*`.

## Touchpoints
- Migrations: `packages/database/migrations`
- Env template: `ENV.example`

## Tests
- Validate locally with `pnpm db:start` and `pnpm db:migrate`.
