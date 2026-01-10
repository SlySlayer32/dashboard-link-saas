# SMS Source Agent Guide

## Scope
Provider implementations, registry, and SMS services.

## Rules
- Providers live in `packages/sms/src/providers` and implement the contract.
- Keep provider IDs consistent with registry keys.
- Surface failures as typed errors for callers.

## Touchpoints
- Providers: `packages/sms/src/providers`
- Factory: `packages/sms/src/registry/SMSProviderFactory.ts`

## Tests
- Add provider tests under `packages/sms/src/__tests__` when needed.
