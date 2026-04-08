# Apps Instructions

This file applies to `apps/*` unless a deeper `AGENTS.md` overrides it.

## Purpose

- `apps/*` are delivery surfaces.
- Keep app-specific composition here.
- Move reusable business logic, contracts, and shared UI down into `packages/*`.

## Rules

- Do not duplicate domain logic across `admin`, `worker`, and `api`.
- If a frontend needs a new contract, update the API and shared types in the same change.
- Frontend fallbacks should prefer env-driven URLs and local proxy paths over hardcoded hosts.
- Preserve loading, error, and empty states for user-visible async flows.

## Verification

- If you change one app, run that app's scoped build.
- If you change an API contract consumed by an app, build both sides.

