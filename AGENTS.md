# CleanConnect Codex Instructions

This file applies to the entire repository unless a deeper `AGENTS.md` overrides part of it.

## Repository Shape

- `apps/admin`: manager-facing React/Vite app
- `apps/worker`: worker-facing React/Vite app
- `apps/api`: Hono + Node TypeScript API
- `packages/*`: shared libraries reused by the apps
- `supabase`: schema, migrations, seed data
- `docs`: operating, product, and architecture documentation

## Working Rules

- Use `pnpm` workspace commands from the repo root unless a nested file gives a narrower command.
- Prefer extending existing patterns over creating parallel ones.
- Shared logic belongs in `packages/*`, not duplicated across apps.
- Never hardcode secrets, tokens, org IDs, or environment-specific credentials.
- Keep local development assumptions aligned with the current verified setup:
  - Admin: `http://localhost:5173`
  - Worker: `http://localhost:5174`
  - API: `http://localhost:3001`
- If you change startup commands, ports, env keys, or operator workflow, update the docs in the same patch.

## Monorepo Invariants

- Cross-app types and schemas belong in `packages/shared`.
- Reusable UI used by more than one app belongs in `packages/ui`.
- Auth logic belongs in `packages/auth` and API middleware.
- SMS provider logic belongs in `packages/sms`.
- Database access and repository logic belong in `packages/database` or `supabase`, not frontend code.

## Verification

- For cross-cutting changes, run:
  - `pnpm build`
  - `pnpm test`
  - `pnpm lint`
- For scoped changes, also run the nearest package or app build/test commands described by the deeper `AGENTS.md`.

