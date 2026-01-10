# Worker App Source Agent Guide

## Scope
React 18 + Vite worker app source.

## Rules
- Keep UI minimal and mobile-first; large touch targets.
- Use `API_URL` from `apps/worker/src/lib/config.ts` for fetches.
- Use TanStack Query for server data and handle offline/low-connectivity errors.

## Touchpoints
- Hooks: `apps/worker/src/hooks`
- Components: `apps/worker/src/components`
- Pages: `apps/worker/src/pages`
- Lib: `apps/worker/src/lib`

## Tests
- If adding tests, use Vitest + Testing Library.
