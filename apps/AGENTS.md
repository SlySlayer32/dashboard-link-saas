# Apps Agent Guide

## Scope
Deployable applications: admin, worker, api. Start with root `AGENTS.md` for global rules.

## Rules
- Apps orchestrate UI or API but should stay thin; business logic lives in services and packages.
- Do not call vendor SDKs inside apps; use contracts/adapters from packages.
- Use shared types from `@dashboard-link/shared` and shared UI from `@dashboard-link/ui` where possible.

## Touchpoints
- Admin: `apps/admin`
- Worker: `apps/worker`
- API: `apps/api`

## Tests
- Use app-specific test commands in the root guide.
