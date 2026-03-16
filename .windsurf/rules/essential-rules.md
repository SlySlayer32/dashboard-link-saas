# Essential Rules — Dashboard Link

**Purpose:** Critical non-negotiables only. Everything else is in `/docs/` as reference.

---

## Multi-Tenant Security (Non-Negotiable)

- **Every database query MUST filter by `organization_id`**
- `organization_id` is ALWAYS derived from JWT — never from request body/query params
- Column name is `organization_id` (NOT `org_id`)
- RLS uses custom pattern: `current_setting('app.tenant_id', true)::uuid`
- Never use `auth.uid()` or `auth.jwt()` patterns — wrong for this codebase

```typescript
// ✅ Correct
const workers = await db
  .from('workers')
  .select('*')
  .eq('organization_id', organizationId) // from JWT

// ❌ Wrong - missing org scope
const workers = await db.from('workers').select('*')

// ❌ Wrong - trusting client input
const orgId = c.req.query('org_id')
```

---

## Token Security

- Workers access via time-limited tokens only (1-24 hours)
- SHA-256 hash before storage — never store raw tokens
- `token_hash` column: exactly 64 hex characters
- Validate: expiry, revocation, org ownership, worker match
- Never expose raw tokens in logs/responses

```typescript
// ✅ Always hash before storing
const token = crypto.randomBytes(32).toString('hex')
const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
```

---

## Locked Tech Stack

| Layer | Decision | Version |
|-------|---------|---------|
| Validation | Zod | **3.x** (NOT 4.x) |
| Backend | Hono.js | 4.x |
| Database | Supabase PostgreSQL | 15+ |
| Frontend | React + Vite | 18.x / 5.x |
| Language | TypeScript strict mode | 5.x |

**Do not suggest alternatives. These are final.**

---

## Critical Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Database tables | snake_case | `dashboard_tokens` |
| Database columns | snake_case | `organization_id` |
| React components | PascalCase | `WorkerCard.tsx` |
| Utilities/hooks | camelCase | `useTokenValidation.ts` |

---

## Frontend Rule: No HTML Forms

- **Never use `<form>` tags**
- Use `<button type="button" onClick={handleSubmit(...)}>` with React Hook Form
- This rule applies to ALL form submissions

```typescript
// ✅ Correct
<button type="button" onClick={handleSubmit(onSubmit)}>
  Submit
</button>

// ❌ Wrong
<form onSubmit={handleSubmit(onSubmit)}>
  <button type="submit">Submit</button>
</form>
```

---

## Project Structure

```
apps/
  admin/     # Manager dashboard
  worker/    # Worker dashboard  
  api/       # Hono.js API (NOT packages/api/)
packages/
  shared/    # Types, validators
  ui/        # Shared components
  plugins/   # Plugin adapters
```

**SMS logic:** `apps/api/src/services/sms.ts`  
**Token logic:** `apps/api/src/services/tokens.ts`

---

## When to Stop and Ask

Stop before proceeding if:
- Task requires schema change or new table
- Task touches RLS policies
- Feature is outside current scope (check `/docs/6-product/FEATURES.md`)
- Something conflicts with existing implementation

---

## Reference Documentation

Everything else is in `/docs/`:
- `/docs/CONTEXT.md` — project primer
- `/docs/2-architecture/DATABASE-SCHEMA.md` — schema source of truth
- `/docs/2-architecture/TECH-STACK.md` — full stack details
- `/docs/6-product/FEATURES.md` — build status

**Read these on-demand when needed. They are NOT auto-loaded.**
