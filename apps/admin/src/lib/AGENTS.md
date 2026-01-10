# Admin Lib Agent Guide

## Scope
App-specific helpers that do not belong in shared packages.

## Rules
- Keep utilities small and focused; avoid duplicating `packages/shared`.
- Do not place secrets or environment values here.

## Touchpoints
- Config or helper modules used by hooks/services.

## Tests
- Add tests in `apps/admin/src/test` when needed.
