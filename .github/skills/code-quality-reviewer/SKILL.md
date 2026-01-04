---
name: code-quality-reviewer
description: Comprehensive code quality review and missing logic detection for Dashboard Link SaaS. Use when the user asks to "find missing logic", "review code quality", "check for issues", "ensure quality", "validate code", "find bugs", or any similar vague quality-focused prompts. Also use for PR reviews, pre-deployment checks, and systematic code audits.
---

# Code Quality Reviewer

## Overview

Performs systematic code quality reviews for the Dashboard Link SaaS monorepo, checking for missing logic, TypeScript errors, React patterns, architecture adherence, security issues, and more.

## Systematic Review Process

### 1. Understand the Context
- Identify what code is being reviewed (specific files, PR, entire feature)
- Check git status to see what files have changed
- Read related documentation and architecture patterns

### 2. Run Automated Checks

**Linting:**
```bash
pnpm lint
```

**Type Checking:**
```bash
# For specific apps/packages
pnpm --filter admin typecheck
pnpm --filter api typecheck
pnpm --filter @dashboard-link/database typecheck
```

**Tests:**
```bash
pnpm test
```

**Build:**
```bash
pnpm build
```

### 3. Manual Code Review Checklist

Use the comprehensive checklist in `references/review-checklist.md` to systematically review:

- ✅ **TypeScript Quality**
  - No `any` types
  - Explicit return types on functions
  - Proper interface/type definitions
  - Correct generic usage

- ✅ **React Patterns**
  - Loading states handled
  - Error states handled
  - Proper hook dependencies
  - Key props on lists
  - Accessibility attributes

- ✅ **Architecture Adherence**
  - Follows Zapier-style layering (Service → Contract → Adapter)
  - Organization isolation (RLS enforcement)
  - No business logic in UI components
  - Proper separation of concerns

- ✅ **Security**
  - No hardcoded secrets
  - Input validation
  - Proper authentication/authorization
  - RLS policies enforced

- ✅ **Performance**
  - Efficient queries (no N+1)
  - Proper memoization
  - Lazy loading where appropriate
  - Bundle size considerations

- ✅ **Testing**
  - Critical paths covered
  - Edge cases tested
  - Error cases tested

### 4. Check for Missing Logic

**Common Missing Logic Patterns:**

1. **No Error Handling**
   ```typescript
   // ❌ Missing error handling
   const result = await apiCall();
   
   // ✅ Proper error handling
   try {
     const result = await apiCall();
   } catch (error) {
     console.error('API call failed:', error);
     toast.error('Failed to load data');
   }
   ```

2. **Missing Loading States**
   ```typescript
   // ❌ No loading state
   const { data } = useQuery();
   return <div>{data.map(...)}</div>;
   
   // ✅ With loading state
   const { data, isLoading } = useQuery();
   if (isLoading) return <LoadingSpinner />;
   return <div>{data.map(...)}</div>;
   ```

3. **Missing Validation**
   ```typescript
   // ❌ No validation
   router.post('/workers', async (c) => {
     const body = await c.req.json();
     return await service.create(body);
   });
   
   // ✅ With validation
   router.post('/workers', validateBody(CreateWorkerSchema), async (c) => {
     const body = c.req.valid('json');
     return await service.create(body);
   });
   ```

4. **Missing Organization Isolation**
   ```typescript
   // ❌ No org isolation
   const workers = await db.from('workers').select();
   
   // ✅ With org isolation
   const organizationId = c.get('organizationId');
   const workers = await db
     .from('workers')
     .select()
     .eq('organization_id', organizationId);
   ```

### 5. Report Findings

Structure your findings clearly:

```
## Code Quality Review Report

### ✅ Passing Checks
- TypeScript compilation: OK
- Linting: OK
- Tests: 25/25 passing

### ⚠️ Issues Found

#### High Priority
1. Missing error handling in WorkerService.create()
   - Location: packages/workers/src/service.ts:45
   - Fix: Add try/catch block

#### Medium Priority
2. Missing loading state in WorkerList component
   - Location: apps/admin/src/components/WorkerList.tsx:12
   - Fix: Add isLoading check

#### Low Priority
3. Console.log statement left in code
   - Location: apps/api/src/routes/workers.ts:23
   - Fix: Remove or replace with proper logging

### 🎯 Recommendations
- Add integration tests for worker CRUD operations
- Consider extracting validation schemas to shared package
- Update documentation to reflect new API endpoints
```

## For Vague Prompts

When user says "find missing logic" or "check quality":

1. **Ask clarifying questions** (if context isn't clear):
   - "What specific area should I focus on? (entire codebase, recent changes, specific feature)"
   - "Are there specific concerns? (bugs, performance, security)"

2. **Default to recent changes** if unclear:
   ```bash
   git diff main...HEAD --name-only
   ```

3. **Run full systematic review** on identified scope

4. **Prioritize findings** by severity and impact

## Resources

- **References**: 
  - See `references/review-checklist.md` for detailed checklist
  - See `references/common-issues.md` for common antipatterns
  - See `references/architecture-patterns.md` for Zapier-style patterns

## Common Pitfalls

- Don't just run linters - they miss logical issues
- Don't review too broadly - focus on changed/relevant code
- Don't report style issues as critical - use severity levels
- Don't forget to check documentation updates
- Don't skip testing the code yourself

## Best Practices

- Always run automated tools first (lint, typecheck, test, build)
- Review in small, focused chunks
- Test manually when possible
- Provide actionable feedback with file/line numbers
- Explain WHY something is an issue, not just WHAT
- Prioritize: Critical > High > Medium > Low > Style
- Link to documentation/examples for fixes
