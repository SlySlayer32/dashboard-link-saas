# Worker App Agent Guide

## Scope
Mobile-first worker dashboard delivered via SMS links. Start with root `AGENTS.md`.

## Rules
- Worker UI only talks to API; never embed vendor integrations.
- Keep UX optimized for small screens and intermittent connectivity.
- Use shared types from `@dashboard-link/shared` where possible.

## Touchpoints
- Source: `apps/worker/src`
- API base URL: `VITE_API_URL` in `apps/worker/.env`

## Tests
- Add Vitest/RTL tests in `apps/worker/src/test` if/when added.
