---
trigger: glob
globs: "**/*.sql, **/db/**, **/supabase/**, **/migrations/**"
description: Database patterns, RLS requirements, and query rules for Dashboard Link
---

# Dashboard Link — Database Rules

## Stack
- Supabase (PostgreSQL)
- Row-Level Security (RLS) enforced at database level
- Application-level org scoping enforced in code as well

## Every Query Must Be Org-Scoped

```ts
// ✅ Always filter by org_id
const { data } = await supabase
  .from('workers')
  .select('*')
  .eq('org_id', orgId)

// ❌ Never query without org scope
const { data } = await supabase
  .from('workers')
  .select('*')
```

## New Table Requirements

Every new table must have:
- `id` — uuid, primary key, default gen_random_uuid()
- `org_id` — uuid, not null, foreign key to organisations.id
- `created_at` — timestamptz, default now()
- RLS policy: users can only access rows where org_id matches their session org
- Index on `org_id`

```sql
-- Template for every new table
create table public.table_name (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  created_at timestamptz default now() not null
  -- add columns here
);

alter table public.table_name enable row level security;

create policy "org_isolation" on public.table_name
  for all using (org_id = (select org_id from sessions where user_id = auth.uid()));

create index on public.table_name(org_id);
```

## Key Tables Reference

| Table | Purpose |
|-------|---------|
| `organisations` | Top-level tenant — every record belongs to one |
| `workers` | Field workers — always scoped to org_id |
| `dashboard_tokens` | Time-limited access tokens — scoped to org + worker |
| `sms_logs` | SMS delivery history — scoped to org_id |
| `plugins` | Data source configs — scoped to org_id |

## Migration Rules

- All schema changes go through migration files — never edit schema directly in Supabase UI
- Migration files live in `/supabase/migrations/`
- Name format: `YYYYMMDDHHMMSS_description.sql`
- Every migration must be reversible where possible

## Supabase Client Rules

- Always use the server-side Supabase client for API routes — never the anon client
- Never expose the service role key client-side
- Use typed Supabase client — always reference generated types from `/packages/db/types.ts`
