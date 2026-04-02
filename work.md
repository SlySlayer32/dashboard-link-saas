Here are copy-paste prompts, one per area. Run them in separate Cascade sessions in this order — each one is self-contained.

---

**PROMPT 1 — Frontend Audit**
```


---

**PROMPT 2 — Backend Audit**
```
Read .windsurf/rules/project-context.md, .windsurf/rules/backend.md, and .windsurf/rules/conflicts.md before doing anything.

Audit the entire backend codebase for duplicates and dead code. Check these areas in order:

1. apps/api/src/services/ — find any service files that overlap in responsibility. Pay special attention to:
   - webhookService.ts vs webhook-service.ts (confirmed duplicate — webhook-service.ts should be deleted)
   - Any other service with two versions or two files doing the same job
2. apps/api/src/routes/ — find any endpoint registered in more than one place. Check v1.ts specifically for routes that are already handled by dedicated route files.
3. apps/api/src/middleware/ — find any middleware that duplicates logic from another middleware file.
4. apps/api/src/lib/ — find any utility functions duplicated across files.
5. packages/plugins/src/adapters/ — check if any adapter duplicates logic that should be in a shared utility.
6. Cross-package duplication — check if any logic in apps/api/src/ duplicates something in packages/shared/, packages/auth/, or packages/database/.
7. Direct Supabase calls — flag every place in route handlers (not repositories) that calls supabase directly instead of going through a repository.
8. console.log — flag every occurrence (should use apps/api/src/lib/logger.ts).
9. Any type: any — flag every occurrence.
10. organization_id sourced from request body or query params — flag every occurrence (must come from JWT only).

For each duplicate found, tell me:
- File A (path + function name)
- File B (path + function name)
- Which one to keep and why
- What needs to be updated

Do not make any changes yet. Give me the full audit report first.
```

---

**PROMPT 3 — Database & Schema Audit**
```
Read .windsurf/rules/database.md, .windsurf/rules/security.md, and .windsurf/rules/conflicts.md before doing anything.

Audit the database layer for inconsistencies and duplicates:

1. supabase/migrations/ — list all migration files in order. Check for:
   - Any table created more than once
   - Any column altered or renamed across migrations (flag the current canonical name)
   - Any migration that edits a previous migration file instead of adding a new one
   
2. Column name consistency — search the entire codebase (apps/ and packages/) for any use of org_id as a column name or query filter. It must be organization_id everywhere.

3. RLS pattern consistency — search for any use of auth.uid() or auth.jwt() in RLS policies or application code. Our pattern is current_setting('app.tenant_id', true)::uuid only.

4. packages/database/src/ — check if any types or utilities here duplicate things already handled by the Supabase generated types.

5. Direct SQL — flag any raw SQL strings in application code outside of migration files and Supabase RPC calls.

6. Repository pattern — flag any route handler in apps/api/src/routes/ that queries the database directly instead of using a repository from packages/database/.

For each issue found, tell me:
- Location (file + line if possible)
- What the problem is
- What the fix should be

Do not make any changes yet. Give me the full audit report first.
```

---

**PROMPT 4 — API & Types Audit**
```
Read .windsurf/rules/api.md, .windsurf/rules/backend.md, and .windsurf/rules/conflicts.md before doing anything.

Audit the API layer and shared types for duplicates and inconsistencies:

1. Response shape — search all route handlers for any response that does NOT follow { success: true/false, data, meta } shape. List every non-conforming response.

2. Error codes — search for any use of RATE_LIMIT_EXCEEDED (wrong) instead of RATE_LIMITED (correct).

3. Pagination — find any endpoint that accepts a raw ?offset= param instead of ?page= + ?limit=.

4. Zod schemas — check if any Zod schema is defined more than once for the same resource (e.g. worker creation schema defined in both a route file and a separate schema file).

5. Shared types — check packages/shared/src/types/ for any TypeScript types that duplicate Supabase generated types in packages/database/src/types.ts.

6. API client duplication — check apps/admin/src/api/ and apps/worker/src/api/ for any fetch functions that call the same endpoint from both apps. These should be in packages/shared/.

7. Zod version — search for any import from 'zod' that uses v4-only APIs (e.g. z.email() as a standalone, z.url() standalone — these changed between versions). Flag them.

8. Endpoint registration — check apps/api/src/routes/v1.ts (or index.ts) and confirm every route file is registered exactly once.

For each issue found, tell me:
- Location
- What the problem is
- What the correct version should be

Do not make any changes yet. Give me the full audit report first.
```

---

**PROMPT 5 — Execute Fixes (run after reviewing all 4 audit reports)**
```
Read .windsurf/rules/conflicts.md before starting.

I have reviewed the audit reports from the frontend, backend, database, and API audits. Now make the fixes. Work through them in this order:

1. Deletions first — delete any confirmed dead files (starting with webhook-service.ts)
2. Route deduplication — fix any routes registered in multiple places
3. Column name fixes — replace any org_id with organization_id in application code
4. Response shape fixes — update any non-conforming API responses
5. console.log replacements — replace with logger calls
6. TanStack Query v4 syntax — update to v5 object syntax
7. any types — replace with proper types
8. HTML form tags — replace with React Hook Form pattern

After completing each category, tell me:
- What was changed
- What files were affected
- Whether any tests need to be updated as a result

If you hit something ambiguous — stop and ask before proceeding.
```

---

The key is running prompts 1–4 first as **read-only audits** before prompt 5 touches anything. That way you see the full picture and can catch anything unexpected before files get changed.