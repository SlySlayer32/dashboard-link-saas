# Admin App Agent Guide

## Scope
Admin dashboard for managing orgs, workers, plugins, tokens, and SMS. Start with root `AGENTS.md`.

## Rules
- Admin UI calls API routes only; never embed vendor integrations in the UI.
- Keep tenant boundaries in mind when building admin flows.
- Use shared UI from `@dashboard-link/ui` and shared types from `@dashboard-link/shared`.

## Touchpoints
- Source: `apps/admin/src`
- API base URL: `VITE_API_URL` in `apps/admin/.env`
- Auth helpers and API client: `apps/admin/src/services`, `apps/admin/src/utils`

## Tests
- Use Vitest + Testing Library under `apps/admin/src/test`.
