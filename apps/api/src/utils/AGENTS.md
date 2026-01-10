# API Utils Agent Guide

## Scope
Shared helpers like logging.

## Rules
- Keep utilities stateless and reusable.
- Use `logger` for structured messages and include request/tenant context.
- Avoid business logic here.

## Touchpoints
- Logger: `apps/api/src/utils/logger.ts`

## Tests
- Add unit tests for non-trivial utilities.
