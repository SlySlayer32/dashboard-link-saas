# Tokens Package Agent Guide

## Scope
Token generation, validation, and provider abstraction.

## Rules
- Providers must conform to shared token contracts.
- Never log raw tokens or secrets.
- Ensure expirations and revocation are handled consistently.

## Touchpoints
- Source: `packages/tokens/src`
- Shared types: `packages/shared`

## Tests
- Add unit tests for token providers and validators.
