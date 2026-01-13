# [Area Name] Playbook - Enhanced for Solo AI Implementation

> **Purpose**: Provide step-by-step, copy-paste-ready instructions with zero guesswork
> **For**: AI assistants working with non-technical solo founders
> **Success Metric**: AI can complete 80%+ of work without asking clarifying questions

---

## 🎯 Quick Start Checklist

Before starting any step in this playbook:

- [ ] Run `pnpm install` (if dependencies changed)
- [ ] Verify `.env` has all required keys from `ENV.example`
- [ ] Start Supabase: `pnpm db:start`
- [ ] Run migrations: `pnpm db:migrate`
- [ ] Confirm API health: `curl http://localhost:3000/health`

**If any check fails**: Stop and fix it before proceeding. See `docs/SETUP_CHECKLIST.md`.

---

## 📋 Step-by-Step Implementation

### Step 1: [Specific Task Name]

**Goal**: [One sentence: what outcome this achieves]

**Files to Create/Modify**:
```
apps/api/src/routes/example.ts          (NEW)
apps/api/src/services/exampleService.ts (NEW)
packages/shared/src/types/example.ts    (MODIFY - add ExampleType)
```

**Exact Code Pattern**:

```typescript
// File: apps/api/src/routes/example.ts
import { Hono } from "hono";
import { z } from "zod";

const exampleRouter = new Hono();

// Input validation schema
const createExampleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  value: z.number().positive(),
});

// Route implementation
exampleRouter.post("/", async (c) => {
  // 1. Get organization from auth context (NEVER from client input)
  const organizationId = c.get("organizationId");
  if (!organizationId) {
    return c.json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Organization context required",
      }
    }, 401);
  }

  // 2. Validate input
  const parsed = createExampleSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: parsed.error.flatten(),
      }
    }, 400);
  }

  // 3. Call service (keep business logic out of routes)
  try {
    const result = await exampleService.create({
      organizationId,
      ...parsed.data,
    });

    return c.json({ success: true, data: result });
  } catch (error) {
    // 4. Handle errors with stable codes
    if (error instanceof NotFoundError) {
      return c.json({
        success: false,
        error: { code: "NOT_FOUND", message: error.message }
      }, 404);
    }
    
    throw error; // Let global error handler catch unknown errors
  }
});

export default exampleRouter;
```

**Where to Register**:
```typescript
// File: apps/api/src/routes/index.ts
import exampleRouter from "./example";

// Add to main router
app.route("/api/example", exampleRouter);
```

**Common Mistakes to Avoid**:
- ❌ Accepting `organizationId` from request body
- ❌ Returning different error shapes (always use `{ success, error }`)
- ❌ Putting business logic in routes (use services)
- ❌ Forgetting to validate input with Zod

**How to Test**:
```bash
# 1. Start dev server
pnpm dev

# 2. Create example (should succeed)
curl -X POST http://localhost:3000/api/example \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"test","value":123}'

# Expected: {"success":true,"data":{...}}

# 3. Test validation (should fail)
curl -X POST http://localhost:3000/api/example \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"","value":-1}'

# Expected: {"success":false,"error":{"code":"VALIDATION_ERROR",...}}
```

**Acceptance Check** (must be true to proceed):
- [ ] Route returns `{ success: true, data }` on valid input
- [ ] Route returns `{ success: false, error }` on invalid input
- [ ] `organizationId` is derived from auth, never from client
- [ ] Curl tests above pass

---

### Step 2: [Next Task]

[Follow same structure: Goal, Files, Code Pattern, Registration, Mistakes, Tests, Acceptance]

---

## 🚨 What to Do When Stuck

### "I don't know where to put this file"

**Decision Tree**:
1. **Is it a vendor SDK call?** → `packages/plugins/src/adapters/[Vendor]Adapter.ts`
2. **Is it a shared type?** → `packages/shared/src/types/[domain].ts`
3. **Is it API business logic?** → `apps/api/src/services/[domain]Service.ts`
4. **Is it an API route?** → `apps/api/src/routes/[domain].ts`
5. **Is it UI logic?** → `apps/admin/src/pages/[Feature]Page.tsx`
6. **Is it database access?** → `packages/database/src/repositories/[domain]Repository.ts`

**Still unsure?** Look for existing files with similar names. Follow the pattern.

### "The code isn't working"

**Debugging Checklist**:
1. [ ] Check API logs: `pnpm --filter @dashboard-link/api dev` (look for errors)
2. [ ] Check browser console (for UI issues)
3. [ ] Verify env vars: Compare `.env` against `ENV.example`
4. [ ] Check database: `supabase status` (is it running?)
5. [ ] Check migrations: `pnpm db:migrate` (any failures?)
6. [ ] Check TypeScript: `pnpm typecheck` (any errors?)

**Still broken?** Revert changes and try again with smaller steps.

### "I don't understand the acceptance check"

**Make it Mechanical**:

Bad: "Auth works"
Good: "Running `curl http://localhost:3000/auth/me` with a valid token returns HTTP 200"

Bad: "Database is set up"
Good: "Running `psql` and selecting from `organizations` returns at least 1 row"

**Pattern**: Every acceptance check should be a command you can run that returns success/failure.

---

## 🔄 Before/After Examples

### Example: Converting Placeholder Logic to Real Implementation

**Before** (placeholder in `apps/api/src/routes/workers.ts`):
```typescript
app.get("/workers", async (c) => {
  const organizationId = "hardcoded-org-123"; // ❌ PLACEHOLDER
  const workers = await db.workers.findMany({
    where: { organizationId }
  });
  return c.json(workers); // ❌ Wrong shape
});
```

**After** (real implementation):
```typescript
app.get("/workers", async (c) => {
  // ✅ Get org from auth context
  const organizationId = c.get("organizationId");
  
  if (!organizationId) {
    return c.json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "No org context" }
    }, 401);
  }

  const workers = await workerService.list({ organizationId });
  
  // ✅ Standard response shape
  return c.json({ success: true, data: workers });
});
```

**What Changed**:
1. Removed hardcoded org ID
2. Got org from auth middleware
3. Added error handling
4. Used standard response shape
5. Called service instead of direct DB access

---

## 📊 Progress Tracking

Use this table to track completion:

| Step | Status | Blocker | Date Completed |
|------|--------|---------|----------------|
| 1. [Task] | ⏳ In Progress | Missing env var | - |
| 2. [Task] | ✅ Done | - | 2024-01-10 |
| 3. [Task] | ❌ Blocked | Need decision on X | - |

**Status Legend**:
- ⏳ In Progress
- ✅ Done (acceptance checks pass)
- ❌ Blocked (cannot proceed without external input)
- 🔄 Needs Revision (acceptance checks failed)

---

## 🎓 Learning Resources

**First Time Implementing This?**

Read these in order:
1. `docs/ARCHITECTURE_BLUEPRINT.md` - Understand the layers
2. `plan/3/PLAYBOOK_CONNECTORS.md` - Understand adapter pattern
3. This playbook - Follow step-by-step

**Quick Reference**:
- Standard error codes: `packages/shared/src/types/errors.ts`
- Example routes: `apps/api/src/routes/auth.ts`
- Example service: `apps/api/src/services/auth/authService.ts`
- Example adapter: `packages/plugins/src/adapters/GoogleCalendarAdapter.ts`

---

## ✅ Final Acceptance Criteria

Before marking this area as "done", verify:

- [ ] All steps have status "✅ Done"
- [ ] All curl tests in this playbook pass
- [ ] Manual smoke test in `docs/V1_IMPLEMENTATION_CHECKLIST.md` passes
- [ ] TypeScript has no errors: `pnpm typecheck`
- [ ] No placeholder logic remains (search codebase for "TODO", "FIXME", "placeholder")
- [ ] Supabase RLS blocks cross-tenant access (tested manually)

**If any check fails**: Do not proceed to next area. Fix issues first.

---

## 📝 Notes for Future Improvements

As you work through this playbook, note:
- Patterns that worked well
- Confusing parts (to improve for next AI)
- Additional examples needed
- Missing decision trees

Add notes here:
```
[Your notes]
```