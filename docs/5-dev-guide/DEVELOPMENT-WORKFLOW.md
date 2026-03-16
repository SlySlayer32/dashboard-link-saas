# Development Workflow — Dashboard Link

## Session Start Checklist

At the start of every session, before writing any code:

1. Read `/docs/CONTEXT.md` — project primer
2. Read `/docs/6-product/FEATURES.md` — know what is built, in progress, and planned
3. Read `/docs/5-dev-guide/CONFLICTS-RESOLUTION.md` — know which duplicate files exist and which wins
4. Scan `/apps` and `/packages` to understand current structure
5. If the task touches architecture or the DB — check `/docs/4-decisions/ADR/` first

## Examine Before You Create

Before building anything, run a silent audit and report findings:

- Does this feature already exist, even partially?
- Is there an existing pattern, component, or utility to extend instead of recreate?
- Does this touch the database? Is RLS already configured for this table?
- Does this touch SMS? Check `apps/api/src/services/sms.ts` before writing new logic
- Does this touch tokens? Check `apps/api/src/services/tokens.ts` before writing new logic
- Does this touch plugins? Check `packages/plugins/src/adapters/` before writing new logic

**Always report before proceeding:**
> "I found X already exists at Y — I will extend it."
> "No existing implementation found — I will create X at Y."

## When to Stop and Ask

Stop and ask before proceeding if:

- The task requires a schema change or new database table
- The task touches RLS policies or multi-tenant security
- The feature is outside current MVP scope (check `/docs/6-product/FEATURES.md`)
- Two valid approaches have meaningfully different tradeoffs
- Something already exists that conflicts with the request

Do not silently make architectural decisions.

## How to Communicate

This project is run by a solo non-technical founder. Always:

- Use plain English — no jargon without explanation
- Give a recommendation when presenting options — don't just list choices
- Explain the *why*, not just the *what*, for complex decisions
- Ask one clarifying question before building if the task is ambiguous
- Keep responses focused — don't over-explain things that are working

## Code Principles

- Simple over clever — this is a solo build, maintainability matters most
- Extend existing patterns before creating new ones
- TypeScript strict mode — no `any` types, no suppressed errors
- Functional patterns — avoid classes (exception: Error subclasses only)
- No hardcoded org IDs, user IDs, tokens, or credentials anywhere in code
- If a solution feels complex, it probably is — flag it and propose a simpler path

## Definition of Done

A task is complete when:
1. TypeScript compiles with no errors (strict mode)
2. Multi-tenant scoping applied — all queries include `organization_id`
3. Input validation added — Zod schemas on API endpoints
4. Error handling implemented — graceful failures, no silent swallowing
5. No `console.log` left in code — use structured logger at `apps/api/src/lib/logger.ts`
6. No `any` types
7. Manual test confirms the feature works as expected
