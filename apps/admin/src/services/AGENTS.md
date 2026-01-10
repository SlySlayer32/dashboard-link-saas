# Admin Services Agent Guide

## Scope
API wrappers and auth helpers for the admin app.

## Rules
- Centralize HTTP calls here using `apiClient` and `authFetch`.
- Return typed results and normalize API error shapes.
- Keep services pure; no direct DOM or component concerns.

## Touchpoints
- API client: `apps/admin/src/services/api.ts`
- Auth interceptor: `apps/admin/src/utils/authInterceptor.ts`

## Tests
- Mock fetch in service tests.
