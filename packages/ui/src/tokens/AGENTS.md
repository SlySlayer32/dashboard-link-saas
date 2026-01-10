# UI Tokens Agent Guide

## Scope
Design tokens and theme constants.

## Rules
- Keep tokens framework-agnostic and descriptive.
- Do not embed component logic here.
- Export tokens via `packages/ui/src/index.ts`.

## Touchpoints
- Theme provider: `packages/ui/src/components/ThemeProvider`.

## Tests
- No direct tests; validated via TypeScript.
