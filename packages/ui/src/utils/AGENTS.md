# UI Utils Agent Guide

## Scope
Small utility helpers for the UI package.

## Rules
- Prefer pure functions and explicit inputs/outputs.
- Keep utils isolated from browser globals when possible.

## Touchpoints
- Export from `packages/ui/src/index.ts` if public.

## Tests
- Add unit tests in `packages/ui/src/test` if logic is non-trivial.
