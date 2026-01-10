# UI Source Agent Guide

## Scope
Shared UI source code structure.

## Rules
- Keep components in `components/`, hooks in `hooks/`, and tokens in `tokens/`.
- Avoid app-specific data fetching or routing.
- Update `packages/ui/src/index.ts` for new exports.

## Touchpoints
- Components: `packages/ui/src/components`
- Hooks: `packages/ui/src/hooks`
- Tokens: `packages/ui/src/tokens`
- Tests: `packages/ui/src/test`

## Tests
- Use Vitest + Testing Library.
