# Dashboard Link

Dashboard Link is a multi-tenant SaaS product for sending workers a secure SMS link to a mobile dashboard with their schedule, tasks, and day-of instructions.

## Current Status

Verified on April 3, 2026:

- `pnpm build` passes for the full workspace.
- `pnpm lint` runs successfully across the workspace.
- `pnpm test` passes using the maintained local test suites.
- Admin, API, and worker apps all compile successfully.
- Manual entry is the launch path for MVP delivery.

## MVP Scope

The current MVP path is:

1. Manager creates or updates workers in the admin app.
2. Manager adds schedule items and task items through Manual Data.
3. Manager sends a dashboard link by SMS.
4. Worker opens the public dashboard link with no account required.
5. Admin can review SMS delivery activity and dashboard-open history.

Plugin integrations remain in the repo, but they are not required for MVP launch readiness.

## Apps

- Admin app: `apps/admin`
- API: `apps/api`
- Worker app: `apps/worker`

## Core Commands

```bash
pnpm install
pnpm build
pnpm lint
pnpm test
pnpm dev
```

Windows-friendly maintenance scripts:

```bash
pnpm dev:check
pnpm lint:report
```

These now run PowerShell wrappers in `scripts/dev-check.ps1` and `scripts/lint-report.ps1`.

## Local Development

1. Install dependencies:

```bash
pnpm install
```

2. Start local Supabase if you are running against local infrastructure:

```bash
pnpm db:start
```

3. Start the apps:

```bash
pnpm dev
```

Default local URLs:

- Admin: `http://localhost:5173`
- Worker: `http://localhost:5174`
- API: `http://localhost:3001`

## Quality Gates

- `pnpm build` is the full workspace compile/build gate.
- `pnpm lint` is the workspace lint gate.
- `pnpm test` runs the maintained local suites that are safe in standard CI.
- The real-database API soft-delete suite remains opt-in via `pnpm --filter @dashboard-link/api run test:integration:db`.

See [QUICK-START.md](/E:/CleanConnect/QUICK-START.md), [TESTING.md](/E:/CleanConnect/docs/5-dev-guide/TESTING.md), [DEPLOYMENT.md](/E:/CleanConnect/docs/5-dev-guide/DEPLOYMENT.md), and [ENV-VARIABLES.md](/E:/CleanConnect/docs/5-dev-guide/ENV-VARIABLES.md) for operational details.
