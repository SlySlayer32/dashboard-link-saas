---
trigger: always_on
description: Security model, multi-tenancy rules, and token handling for Dashboard Link
---

# Dashboard Link — Security Rules

These rules are non-negotiable. They apply to every database query, every API endpoint, and every new feature without exception.

## Multi-Tenancy — Absolute Rules

- Every database query MUST be scoped to `org_id`
- Never query across organisations — one org must never see another org's data
- Always filter by `org_id` in application code, even when RLS is active
- RLS is the last line of defence, not the only one
- Before writing any query, ask: "Is this scoped to an org?"

```ts
// ✅ Correct
const workers = await db
  .from('workers')
  .select('*')
  .eq('org_id', orgId)

// ❌ Wrong — missing org scope
const workers = await db
  .from('workers')
  .select('*')
```

## Token Rules

- Workers access dashboards via time-limited tokens only — never via login
- Token expiry: 1–24 hours, configurable per organisation
- Never issue permanent tokens
- Single-use protection must be available as an option
- Token validation must check: expiry, org ownership, and worker match
- Never expose raw token secrets in logs or API responses

## Worker Access Rules

- Workers have NO accounts, NO passwords, NO sessions
- Never create a worker authentication flow
- Never store worker credentials of any kind
- The only worker identity is: valid token → worker record → org record

## API Endpoint Rules

- Every protected endpoint must validate `org_id` from the authenticated session
- Never trust `org_id` from request body or query params — always derive from session
- Validate token ownership before returning any dashboard data

## New Tables Checklist

Before using any new database table in production:
- [ ] RLS policies are configured
- [ ] `org_id` column exists and is indexed
- [ ] Application-level `org_id` filter is applied in all queries
- [ ] No query returns data without an org scope

## If Unsure

If you are unsure whether a query is correctly org-scoped — stop and ask before proceeding. Do not guess on security.
