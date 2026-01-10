# Admin Pages Agent Guide

## Scope
Route-level screens for admin workflows.

## Rules
- Pages orchestrate hooks + components and handle loading/empty/error states.
- Use TanStack Query hooks for server state and Zustand only for UI/client state.
- Keep API calls in `services/` and `hooks/`; avoid direct fetch here unless necessary.

## Touchpoints
- Hooks: `apps/admin/src/hooks`
- Services: `apps/admin/src/services`

## Tests
- Add page-level tests in `apps/admin/src/test` when behavior is complex.
