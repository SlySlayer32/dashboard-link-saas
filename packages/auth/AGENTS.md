# Auth Package Agent Guide

## Scope
Authentication services and provider abstraction.

## Rules
- Provider-specific logic lives in `packages/auth/src/providers`.
- Do not log secrets or raw tokens.
- Keep APIs consistent for apps and API service.

## Touchpoints
- Source: `packages/auth/src`
- Shared types: `packages/shared`

## Tests
- Add provider and service tests under `packages/auth/src/__tests__` if needed.
