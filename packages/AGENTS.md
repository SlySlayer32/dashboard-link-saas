# Packages Instructions

This file applies to `packages/*` unless a deeper `AGENTS.md` overrides it.

## Purpose

- Packages are shared code.
- Avoid app-specific assumptions or imports inside packages.

## Rules

- Put shared contracts, schemas, and cross-app types in `packages/shared`.
- Put reusable UI in `packages/ui`.
- Keep package entrypoints intentional; avoid surprise side effects.
- When changing a package public API, update all affected consumers in the same patch.
- For runtime packages consumed by Node or `tsx` (`auth`, `database`, `shared`, `sms`, `tokens`, `plugins`), use explicit `.js` extensions on relative runtime imports/exports in TypeScript source.

## Verification

- Run the changed package build where available.
- If the package is consumed by an app at runtime, also build the consuming app.

