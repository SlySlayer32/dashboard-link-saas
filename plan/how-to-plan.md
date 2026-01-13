# Playbook Enhancement Guide for Solo Founders

> **Your Goal**: Make playbooks so clear that an AI assistant can complete 80%+ of work without asking questions
> **This Guide**: Shows you exactly how to upgrade each playbook with copy-paste examples

---

## The Problem with Current Playbooks

**Current State** (from `plan/2/PLAYBOOK_USER_FLOWS.md`):
```markdown
### Step A1 — Auth works end-to-end

Goal: admin can log in and all subsequent requests include a valid bearer token.

Implementation notes:
- Admin UI stores auth token under `auth_token`
- API must accept `Authorization: Bearer <token>`

Acceptance checks:
- After login, `GET /auth/me` succeeds
```

**Why This is Hard for AI**:
- ❌ "Must accept" - but HOW? What's the exact code?
- ❌ "Succeeds" - what does success look like? HTTP 200? Specific JSON shape?
- ❌ No file paths - where do I write this code?
- ❌ No error handling guidance - what if token is invalid?

---

## The Enhancement Formula

For EVERY step in your playbooks, add these 5 sections:

### 1. **Exact Files to Touch**
```markdown
**Files to Create/Modify**:
- `apps/api/src/middleware/auth.ts` (MODIFY - add bearer token validation)
- `apps/api/src/routes/auth.ts` (VERIFY - ensure /me route exists)
- `apps/admin/src/utils/authInterceptor.ts` (VERIFY - check token storage)
```

### 2. **Before/After Code Examples**
```markdown
**Before** (placeholder):
```typescript
// apps/api/src/middleware/auth.ts
export const authMiddleware = async (c, next) => {
  // TODO: validate token
  await next();
};
```

**After** (real implementation):
```typescript
// apps/api/src/middleware/auth.ts
import { verifyJWT } from '@/utils/jwt';

export const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({
      success: false,
      error: { code: 'MISSING_TOKEN', message: 'No bearer token' }
    }, 401);
  }

  const token = authHeader.slice(7);
  
  try {
    const payload = await verifyJWT(token);
    c.set('userId', payload.sub);
    c.set('organizationId', payload.org_id);
    await next();
  } catch (error) {
    return c.json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Token verification failed' }
    }, 401);
  }
};
```
```

### 3. **Testable Acceptance Checks**
```markdown
**Acceptance Check** (must pass before proceeding):

```bash
# 1. Get a valid token
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.data.token')

# 2. Test /me endpoint with token
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Expected: HTTP 200 with user data
# {"success":true,"data":{"id":"...","email":"test@example.com"}}

# 3. Test without token (should fail)
curl http://localhost:3000/auth/me

# Expected: HTTP 401
# {"success":false,"error":{"code":"MISSING_TOKEN",...}}
```

- [ ] Test 2 returns HTTP 200 with user data
- [ ] Test 3 returns HTTP 401 with stable error code
```

### 4. **Common Mistakes Section**
```markdown
**Common Mistakes to Avoid**:
- ❌ Forgetting to slice "Bearer " prefix (causes token parse errors)
- ❌ Not setting `organizationId` in context (breaks multi-tenancy)
- ❌ Returning different error shapes (use standard `{ success, error }`)
- ❌ Not handling expired tokens (check JWT exp claim)
```

### 5. **"What to Do When Stuck" Decision Tree**
```markdown
**If This Step Fails**:

1. **Error: "verifyJWT is not defined"**
   - Check: Does `apps/api/src/utils/jwt.ts` exist?
   - Fix: Create it with JWT verification logic (see `packages/auth/src/services/AuthService.ts` for reference)

2. **Error: "organizationId is undefined"**
   - Check: Is auth middleware mounted before routes in `apps/api/src/index.ts`?
   - Fix: Move `app.use(authMiddleware)` before `app.route('/workers', ...)`

3. **Test 2 returns HTTP 401 even with valid token**
   - Check: Is JWT_SECRET the same in `.env` and token generation?
   - Fix: Regenerate token after confirming secret matches
```

---

## Template for Upgrading a Step

Copy this template for each step in your playbooks:

```markdown
### Step X: [Task Name]

**Goal**: [One sentence outcome]

**Files to Create/Modify**:
- `path/to/file.ts` (NEW/MODIFY - what you're doing)

**Before** (current state):
```typescript
// Placeholder code or "what exists now"
```

**After** (target state):
```typescript
// Complete, runnable code
// Include imports, types, error handling
// Add comments explaining non-obvious parts
```

**Where to Register/Wire** (if applicable):
```typescript
// Show how this connects to the rest of the system
// Example: Adding route to main router
```

**Common Mistakes to Avoid**:
- ❌ [Specific mistake]
- ❌ [Another mistake]

**How to Test**:
```bash
# Exact commands to verify this works
```

**Acceptance Check** (mechanical, testable):
- [ ] Command X returns expected output Y
- [ ] File Z contains no TypeScript errors

**If This Step Fails**:
1. **Symptom**: [Error message or behavior]
   - **Diagnosis**: [How to check what's wrong]
   - **Fix**: [Exact steps to resolve]
```

---

## Priority Areas to Enhance

Based on your current playbooks, enhance these in this order:

### 🔥 Priority 1: Foundation Setup (plan/1)
**Why**: If local dev doesn't work, nothing works
**Focus On**:
- Add exact curl commands to verify each env var is correct
- Add troubleshooting tree for common Supabase issues
- Show before/after for `.env` files with real examples

### 🔥 Priority 2: User Flows (plan/2)
**Why**: This is your thin slice - must be bulletproof
**Focus On**:
- Add complete code examples for every placeholder removal
- Add exact test commands for each acceptance check
- Show file tree before/after for new features

### 🔥 Priority 3: Connectors (plan/3)
**Why**: Most complex, highest chance of confusion
**Focus On**:
- Add complete OAuth flow with exact Google Console screenshots
- Add decision tree: "Should this be in adapter or service?"
- Add examples of good vs bad adapter implementations

### Priority 4-8: Follow same pattern
After top 3 are solid, apply same enhancements to reliability, security, deployment, etc.

---

## Quick Wins You Can Do Today

### 1. Add File Path Maps to Each Playbook

At the top of each playbook, add:
```markdown
## File Path Quick Reference

When playbook says...     | You edit this file...
------------------------- | ---------------------
"Auth middleware"         | `apps/api/src/middleware/auth.ts`
"Worker service"          | `apps/api/src/services/workerService.ts`
"Plugin adapter"          | `packages/plugins/src/adapters/[Name]Adapter.ts`
"Shared types"            | `packages/shared/src/types/[domain].ts`
```

### 2. Add "Success Looks Like This" Section

After each step, add:
```markdown
**Success Looks Like This**:
- Terminal shows: `✅ Server started on port 3000`
- Browser shows: Login page loads with no console errors
- Database has: 1 organization, 1 admin user (check with SQL)
```

### 3. Add Common Error Messages & Fixes

End of each playbook, add:
```markdown
## Common Errors & Solutions

### "Cannot find module '@dashboard-link/shared'"
**Cause**: Turborepo cache issue
**Fix**: `pnpm clean && pnpm install`

### "Supabase client not initialized"
**Cause**: Missing env vars
**Fix**: Run `supabase status` and copy values to `.env`
```

---

## Measuring Success

After enhancing a playbook, test it:

### The "Fresh AI Test"
1. Start a new Claude conversation
2. Give it ONLY the enhanced playbook
3. Ask it to complete the task
4. Count how many clarifying questions it asks

**Target**: ≤ 2 questions per major step

### The "Copy-Paste Test"
1. Can you copy code examples directly without modification?
2. Do curl commands run without tweaking?
3. Do acceptance checks pass on first try?

**Target**: 90%+ of examples work as-is

---

## Example: Enhanced Step from Real Playbook

Here's how to upgrade your current Step A1 from `plan/2/PLAYBOOK_USER_FLOWS.md`:

**CURRENT VERSION**:
```markdown
### Step A1 — Auth works end-to-end
Goal: admin can log in and all subsequent requests include a valid bearer token.
Implementation notes:
- Admin UI stores auth token under `auth_token`
Acceptance checks:
- After login, `GET /auth/me` succeeds
```

**ENHANCED VERSION**:
```markdown
### Step A1 — Auth Works End-to-End

**Goal**: Admin can log in via UI, and all API requests include a valid bearer token

**Files to Verify/Modify**:
- `apps/admin/src/pages/LoginPage.tsx` (VERIFY - already implemented)
- `apps/admin/src/utils/authInterceptor.ts` (VERIFY - token storage)
- `apps/api/src/middleware/auth.ts` (MODIFY - add JWT validation)
- `apps/api/src/routes/auth.ts` (VERIFY - /me route exists)

**Current State Check**:
```bash
# Check if login already works
pnpm dev
# Visit http://localhost:5173/login
# Try logging in with test@example.com / password
# Does it redirect to dashboard? ✅ Already working
# Does it show error? ❌ Need to fix
```

**What Needs to Happen**:
1. Login form captures credentials
2. Calls `POST /auth/login`
3. Receives JWT token
4. Stores token in localStorage
5. All subsequent API calls include `Authorization: Bearer <token>`
6. Protected routes verify token and set user context

**Implementation**: JWT Validation Middleware

```typescript
// File: apps/api/src/middleware/auth.ts
import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';

export const authMiddleware = async (c: Context, next: Next) => {
  // 1. Extract bearer token
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({
      success: false,
      error: {
        code: 'MISSING_AUTH_HEADER',
        message: 'Authorization header required',
      }
    }, 401);
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  // 2. Verify JWT
  try {
    const payload = await verify(token, process.env.JWT_SECRET!);
    
    // 3. Set context for downstream routes
    c.set('userId', payload.sub as string);
    c.set('organizationId', payload.org_id as string);
    c.set('userRole', payload.role as string);
    
    await next();
  } catch (error) {
    return c.json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token verification failed',
        details: error instanceof Error ? error.message : undefined,
      }
    }, 401);
  }
};

// Mount in main app
// File: apps/api/src/index.ts
import { authMiddleware } from './middleware/auth';

// Apply to protected routes only
app.use('/workers/*', authMiddleware);
app.use('/organizations/*', authMiddleware);
app.use('/dashboards/*', authMiddleware);
// etc.
```

**How to Test**:
```bash
# Terminal 1: Start API
pnpm --filter @dashboard-link/api dev

# Terminal 2: Test auth flow
# Step 1: Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq -r '.data.token')

echo "Token: $TOKEN"

# Step 2: Test protected endpoint WITH token (should succeed)
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Expected output:
# {"success":true,"data":{"id":"...","email":"test@example.com",...}}

# Step 3: Test WITHOUT token (should fail with MISSING_AUTH_HEADER)
curl -X GET http://localhost:3000/auth/me

# Expected output:
# {"success":false,"error":{"code":"MISSING_AUTH_HEADER",...}}

# Step 4: Test with INVALID token (should fail with INVALID_TOKEN)
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer invalid.token.here"

# Expected output:
# {"success":false,"error":{"code":"INVALID_TOKEN",...}}
```

**Acceptance Checks** (all must pass):
- [ ] Step 2 returns HTTP 200 with user data
- [ ] Step 3 returns HTTP 401 with code "MISSING_AUTH_HEADER"
- [ ] Step 4 returns HTTP 401 with code "INVALID_TOKEN"
- [ ] Admin UI login redirects to dashboard (manual test)
- [ ] Admin UI makes authenticated requests (check Network tab)

**Common Mistakes to Avoid**:
- ❌ Forgetting to remove "Bearer " prefix → JWT parse fails
- ❌ Not setting `organizationId` in context → multi-tenancy breaks
- ❌ Mounting middleware AFTER routes → middleware never runs
- ❌ Using different JWT secret in `.env` vs token generation

**If This Step Fails**:

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| All requests return 401 even with valid token | JWT secret mismatch | Run `echo $JWT_SECRET` and compare with token generation. Regenerate token. |
| "organizationId is undefined" in routes | Middleware not setting context | Check `c.set('organizationId', ...)` is present and middleware runs before routes |
| Token verification throws error | Invalid JWT format | Check token in jwt.io - should have 3 parts (header.payload.signature) |
| Login succeeds but /me fails | Middleware not mounted on /auth routes | Check `apps/api/src/index.ts` - is auth middleware applied to /auth/* ? |

**Browser Test** (manual):
1. Open http://localhost:5173/login
2. Open DevTools → Network tab
3. Log in with test@example.com / password123
4. Check request to `/auth/login`
   - ✅ Status: 200
   - ✅ Response has `data.token`
5. Check localStorage
   - ✅ Key `auth_token` exists
   - ✅ Value starts with `ey...` (JWT format)
6. Navigate to /workers (or any protected page)
7. Check request to `/workers`
   - ✅ Has header `Authorization: Bearer ey...`
   - ✅ Status: 200 (not 401)

**Files Changed Checklist**:
- [ ] `apps/api/src/middleware/auth.ts` - JWT validation added
- [ ] `apps/api/src/index.ts` - Middleware mounted before routes
- [ ] `apps/admin/src/utils/authInterceptor.ts` - Verified token storage (no changes needed)

**Next Step**: Only proceed to Step A2 if all acceptance checks pass.
```

---

## Action Plan for You

### Week 1: Foundation
- [ ] Enhance `plan/1/PLAYBOOK_FOUNDATION_SETUP.md` with exact commands
- [ ] Add troubleshooting tree for Supabase connection issues
- [ ] Test with fresh AI conversation

### Week 2: Core Flows
- [ ] Enhance `plan/2/PLAYBOOK_USER_FLOWS.md` Step A1-A3
- [ ] Add complete code examples for all placeholders
- [ ] Test with AI completing worker CRUD

### Week 3: Connectors
- [ ] Enhance `plan/3/PLAYBOOK_CONNECTORS.md` Google OAuth section
- [ ] Add decision tree for adapter vs service logic
- [ ] Test with AI implementing a new connector

### Week 4: Polish
- [ ] Add file path maps to all playbooks
- [ ] Add common errors sections
- [ ] Run full "Fresh AI Test" on all playbooks

---

## Template: Converting Your Current Steps

For EACH step in your existing playbooks, run this upgrade:

**Find**: Lines that say "implement X" or "ensure Y works"
**Replace With**:
1. Exact file paths
2. Before/after code
3. Testable commands
4. Error troubleshooting
5. Mechanical acceptance checks

**Example Conversion**:

**BEFORE**:
> Implement the Google Calendar adapter end-to-end

**AFTER**:
> **File**: `packages/plugins/src/adapters/GoogleCalendarAdapter.ts`
>
> **Code**: [Complete 100-line adapter with OAuth, error handling, normalization]
>
> **Test**: 
> ```bash
> curl -X POST http://localhost:3000/api/plugins/google-calendar/test \
>   -H "Authorization: Bearer $TOKEN" \
>   -d '{"calendarId":"primary"}'
> ```
>
> **Expected**: `{"success":true,"data":{"events":[...]}}`
>
> **If fails**: Check GOOGLE_CLIENT_ID is set in .env

---

## Final Checklist

Before considering a playbook "AI-ready":

- [ ] Every step has exact file paths
- [ ] Every step has before/after code examples
- [ ] Every acceptance check is a runnable command
- [ ] Common mistakes are listed with fixes
- [ ] "If stuck" decision trees are provided
- [ ] File path map exists at top of document
- [ ] Success metrics are measurable (not subjective)
- [ ] Fresh AI test shows ≤2 questions per step

**Remember**: The goal is not perfection on first try. Start with your most critical path (Foundation → User Flows → Connectors) and iterate based on what causes AI confusion.