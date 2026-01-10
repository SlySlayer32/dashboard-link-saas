# Worker Hooks Agent Guide

## Scope
Data fetching and UI behavior hooks for the worker app.

## Rules
- Use TanStack Query and `API_URL` for fetches.
- Normalize errors into user-friendly messages (see `DashboardError`).
- Avoid direct DOM or navigation side effects in hooks.

## Touchpoints
- `apps/worker/src/hooks/useDashboardData.ts`
- Config: `apps/worker/src/lib/config.ts`

## Tests
- Mock fetch and timeouts in hook tests.
