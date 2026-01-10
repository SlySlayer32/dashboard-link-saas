# Worker Lib Agent Guide

## Scope
App-specific helpers and config.

## Rules
- Keep helpers small and focused; avoid duplicating shared packages.
- Use this area for config like `API_URL`.

## Touchpoints
- Config: `apps/worker/src/lib/config.ts`

## Tests
- Add tests when helper logic grows.
