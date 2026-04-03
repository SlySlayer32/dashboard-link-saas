# Testing

## Default Gate

The standard local and CI verification commands are:

```bash
pnpm lint
pnpm test
pnpm build
```

`pnpm test` is intentionally scoped to the maintained suites that run without external secrets or manual infrastructure.

## What `pnpm test` Covers

- API integration and unit suites that run locally
- SMS package unit suites
- Admin maintained component and worker-flow suites
- UI maintained auth component suites
- Packages with no maintained tests exit cleanly with `--passWithNoTests`

## What Is Not In The Default Gate

- Secret-backed integration tests that require real Supabase environment variables

That infrastructure-backed suite is intentionally kept out of standard CI. Run it only when you have a real Supabase environment available.

## Package-Level Commands

```bash
pnpm --filter @dashboard-link/api test
pnpm --filter @dashboard-link/api run test:integration:db
pnpm --filter @dashboard-link/admin test
pnpm --filter @dashboard-link/sms test
pnpm --filter @dashboard-link/ui test
```

## Manual MVP Regression Checklist

1. Log in to admin and confirm the real dashboard loads.
2. Navigate to Workers, Manual Data, Tokens, SMS Logs, Plugins, and Settings.
3. Create a worker.
4. Add schedule items and task items through Manual Data.
5. Send a dashboard link from worker detail.
6. Open the worker dashboard on the public link.
7. Confirm the worker dashboard shows schedule, tasks, and refresh.
8. Confirm SMS history and dashboard access history appear in admin.

## Notes

- `pnpm test` now reflects the repo's real, maintainable verification path.
- If you add or restore a test suite, make sure it runs without hidden environment assumptions before moving it into the default gate.
