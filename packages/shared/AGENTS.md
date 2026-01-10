# Shared Package Agent Guide

## Scope
Shared contracts, types, and utilities used across the monorepo.

## Rules
- Treat contracts as stable public APIs.
- Avoid runtime logic that depends on app environment.
- Keep naming consistent and explicit.

## Touchpoints
- Source: `packages/shared/src`

## Tests
- Add tests only for non-trivial utilities.
