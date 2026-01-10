# Admin Store Agent Guide

## Scope
Zustand stores for client-side state.

## Rules
- Keep stores small and focused; prefer TanStack Query for server state.
- Persist only necessary fields and avoid storing secrets.
- Provide selectors to minimize re-renders.

## Touchpoints
- Store hooks are used in pages/components as needed.

## Tests
- Add store tests in `apps/admin/src/test` if logic is non-trivial.
