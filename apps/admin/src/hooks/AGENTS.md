# Admin Hooks Agent Guide

## Scope
Custom hooks for data fetching and UI behavior.

## Rules
- Use TanStack Query for server data; keep stable query keys.
- Use the API client in `apps/admin/src/services/api.ts`; avoid raw fetch.
- Normalize API errors and surface user-friendly messages.

## Touchpoints
- API client: `apps/admin/src/services/api.ts`
- Shared auth helpers: `apps/admin/src/utils`

## Tests
- Mock network calls in hook tests (`apps/admin/src/test`).
