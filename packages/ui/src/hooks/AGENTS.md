# UI Hooks Agent Guide

## Scope
Shared hooks for UI behavior.

## Rules
- Hooks must be app-agnostic and UI-focused.
- Avoid direct API calls; accept dependencies via parameters.
- Keep hooks stable and well-typed.

## Touchpoints
- Export in `packages/ui/src/index.ts`.

## Tests
- Add hook tests in `packages/ui/src/test`.
