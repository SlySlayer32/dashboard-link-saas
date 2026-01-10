# Plugins Package Agent Guide

## Scope
Plugin contracts, adapters, and registry.

## Rules
- Adapters implement the shared plugin contracts and normalize output.
- Validate plugin configs with Zod.
- Register plugins in the registry and export from `src/index.ts`.

## Touchpoints
- Source: `packages/plugins/src`
- Registry: `packages/plugins/src/registry`

## Tests
- Mock external plugin APIs in tests.
