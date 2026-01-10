# SMS Package Agent Guide

## Scope
SMS provider abstraction, registry, and services.

## Rules
- Providers implement the SMS contract and return normalized responses.
- Register new providers in the SMS registry/factory.
- Do not log full message bodies or PII.

## Touchpoints
- Source: `packages/sms/src`
- Registry: `packages/sms/src/registry`

## Tests
- Mock provider clients in tests.
