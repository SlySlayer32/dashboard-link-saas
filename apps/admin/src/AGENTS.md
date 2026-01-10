# Admin App Source Agent Guide

## Scope
React 18 + Vite admin app source. Start with root `AGENTS.md`.

## Rules
- Route screens live in `pages/`; compose `hooks/` + `components/`.
- Keep API access in `services/` and shared client helpers in `lib/` or `utils/`.
- Use `@` alias for `src` and `VITE_API_URL` for API base.
- Forms use React Hook Form + Zod; server state uses TanStack Query; client state uses Zustand.

## Touchpoints
- Components: `apps/admin/src/components`
- Hooks: `apps/admin/src/hooks`
- Services: `apps/admin/src/services`
- Store: `apps/admin/src/store`
- Types: `apps/admin/src/types`

## Tests
- Tests live in `apps/admin/src/test`.
