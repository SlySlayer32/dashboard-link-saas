# Plugins Source Agent Guide

## Scope
Plugin contracts, adapters, and registry implementations.

## Rules
- Keep contract interfaces in `contracts/` and adapters in `adapters/`.
- Normalize provider data to standard schedule/task shapes.
- Validate config and credentials using Zod schemas.

## Touchpoints
- Registry: `packages/plugins/src/registry`
- Contracts: `packages/plugins/src/contracts`

## Tests
- Add adapter tests in `packages/plugins/src/__tests__` if needed.
