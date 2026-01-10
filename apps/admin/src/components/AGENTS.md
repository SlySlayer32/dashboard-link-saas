# Admin Components Agent Guide

## Scope
Presentational UI components for the admin app.

## Rules
- Keep components UI-focused; data fetching belongs in hooks or pages.
- Prefer reusable components from `@dashboard-link/ui`; add new shared components there when generic.
- Support accessibility and consistent Tailwind styling; accept `className` for styling hooks.

## Touchpoints
- Page composition happens in `apps/admin/src/pages`.

## Tests
- Component tests go in `apps/admin/src/test`.
