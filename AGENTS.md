# CleanConnect Codex Instructions

This file applies to the entire repository unless a deeper `AGENTS.md` overrides it.

## Repository Shape

- `apps/admin`: manager-facing React/Vite app
- `apps/worker`: worker-facing React/Vite app
- `apps/api`: Hono + Node TypeScript API
- `packages/*`: shared libraries reused by the apps
- `supabase`: schema, migrations, seed data
- `docs`: product, architecture, and operating documentation

## Where to Look First

- Product and workflow context: `docs/CONTEXT.md`, `docs/PROJECT-MAP.md`, `docs/5-dev-guide/CONFLICTS-RESOLUTION.md`
- Admin UI: `apps/admin/src/pages/*`, `apps/admin/src/components/Navigation.tsx`, `apps/admin/src/components/WorkspacePreferencesProvider.tsx`, `apps/admin/src/lib/workspace.ts`
- Worker UI: `apps/worker/src/pages/DashboardPage.tsx`, `apps/worker/src/components/*`, `apps/worker/src/components/widgets/*`
- Shared frontend primitives: `packages/ui/src/components/*`, `packages/ui/src/index.ts`
- API composition: `apps/api/src/v1.ts`, `apps/api/src/routes/*`, `apps/api/src/services/*`
- Shared contracts and data access: `packages/shared/src/*`, `packages/database/src/repositories/*`
- Schema and tenant rules: `supabase/migrations/*`

## Working Rules

- Optimize for a stable working product, not a shallow MVP slice. Get the real components working together reliably first; then add regression tests, edge cases, and production hardening.
- Keep diffs small and extend the canonical implementation before creating new files. If `docs/5-dev-guide/CONFLICTS-RESOLUTION.md` names a winner, use it and remove the duplicate in the same patch when practical.
- Do not treat stubs, placeholder returns, mock-only branches, or `TODO` logic as complete behavior for any real user flow unless the fallback is explicitly isolated and documented as temporary.
- Use `pnpm` workspace commands from the repo root unless a deeper file gives a narrower command.
- Never hardcode secrets, tokens, org IDs, or environment-specific credentials.
- Keep local development assumptions aligned with the current verified setup:
  - Admin: `http://localhost:5173`
  - Worker: `http://localhost:5174`
  - API: `http://localhost:3001`
- If you change routes, contracts, env keys, ports, migrations, or operator workflow, update the relevant docs in the same patch.

## Architecture Boundaries

- `apps/*` are delivery surfaces. Keep app-specific composition there.
- Cross-app types, schemas, and contracts belong in `packages/shared`.
- Reusable UI used by both apps belongs in `packages/ui`. Do not create a second shared UI layer under `apps/*`.
- Auth logic belongs in `packages/auth` and API middleware.
- SMS provider logic belongs in `packages/sms`.
- Reusable database access belongs in `packages/database/src/repositories/*`; keep route handlers thin and put orchestration in `apps/api/src/services/*`.
- `supabase/migrations/*` is the canonical schema, RLS, and index source of truth. Treat legacy migration paths as non-canonical unless a deeper file explicitly says otherwise.

## Product and UX Rules

- Preserve the product split: admin is the operator workspace, worker is the mobile, token-based, no-login surface.
- For admin layout, navigation, theme, density, or landing behavior, check `Navigation.tsx`, `WorkspacePreferencesProvider.tsx`, and `lib/workspace.ts` before inventing a new pattern.
- Reuse the existing hook/query/store patterns. Pages orchestrate, hooks fetch or mutate, components render.
- Preserve explicit loading, error, empty, and skeleton states for every async UI path.
- Worker flows must remain resilient across invalid-token, expired-token, and network or offline scenarios.

## Backend, Data, and Security Rules

- Validate request inputs at the route boundary with Zod and pass validated data into services.
- Preserve strict tenant isolation. Never trust client-supplied org scope when auth, token, or server context already provides it.
- Keep public worker, token, and webhook flows isolated from authenticated admin flows; verify tokens or signatures before side effects.
- For schema or data-model changes, ship the matching migration, RLS or index updates, repository or service changes, shared types, tests, and docs together.
- When docs disagree with live code, treat `supabase/migrations/*` plus the current runtime code as the source of truth, then update stale docs.
- Do not change deletion behavior, token behavior, or SMS delivery behavior in only one layer; update the full flow together.

## Verification and Definition of Done

- Default workspace gate:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`
  - `pnpm typecheck`
- For cross-cutting work, run the workspace gate plus the nearest touched app or package checks from the deeper `AGENTS.md` files.
- For API, auth, tenant, or migration changes, also run `pnpm --filter @dashboard-link/api start` and verify `/health`; run `pnpm --filter @dashboard-link/api run test:integration:db` when the required Supabase environment is available.
- For schema or release-sensitive changes, run `pnpm db:migrate` and verify the affected runtime or deployment assumptions.
- A task is not done when code merely compiles. It is done when the affected product flow works end-to-end, the relevant regression coverage is added or updated, and the supporting docs are current.
- In this repo, the normal order is: make the real flow work, then add tests, then harden edge cases and release verification. Do not stop at "MVP complete."

## Planning Rule

- For work that spans more than one app or package, touches `supabase`, changes architecture or workflow, or will land in multiple steps, write a short plan before editing code and keep it updated as you work.
- If this repo adds a top-level `PLANS.md`, store those multi-step plans there; otherwise keep the plan in the task or PR context.
