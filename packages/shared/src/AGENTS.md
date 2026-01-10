# Shared Source Agent Guide

## Scope
Type definitions, contracts, and shared utilities.

## Rules
- Prefer types and interfaces over concrete implementations.
- Maintain backward compatibility for shared contracts.
- Avoid app-specific assumptions.

## Touchpoints
- Consumers: `apps/*`, `packages/*`

## Tests
- Types are checked by TypeScript; utilities can be unit-tested.
