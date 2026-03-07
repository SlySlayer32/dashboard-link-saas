# Code Standards

## Naming Conventions

### Files
- **React components:** PascalCase filenames (e.g., `UserProfile.tsx`)
- **Utility/modules:** kebab-case filenames (e.g., `user-utils.ts`)
- **Test files:** Same name as file being tested with `.test.ts` suffix (e.g., `user-utils.test.ts`)

### Variables and Functions
- **Variables/functions:** camelCase (e.g., `getUserById`, `isActive`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_WORKERS`, `DEFAULT_TOKEN_EXPIRY`)
- **Boolean variables:** Prefix with `is`, `has`, `should` (e.g., `isLoading`, `hasPermission`)

### Types and Interfaces
- **Types/interfaces:** PascalCase (e.g., `Worker`, `PluginConfig`)
- **Props interfaces:** Use `*Props` suffix (e.g., `ButtonProps`, `WorkerCardProps`)
- **Enum values:** PascalCase (e.g., `enum Status { Active, Inactive }`)

## Folder / Import Rules

### Where Things Live
- **Vendor SDK calls ONLY inside adapters** under `packages/*/src` (not in `apps/`)
- **Business logic in services** (`apps/api/src/services/`)
- **UI components in components** (`apps/*/src/components/`)
- **Reusable utilities in lib** (`apps/*/src/lib/` or `packages/shared/src/utils/`)

### Import Order
1. External packages (React, third-party libraries)
2. Internal packages (`@dashboard-link/*`)
3. Relative imports (`./*`, `../*`)
4. Types (if separate from value imports)

```typescript
// Good
import { useState } from 'react';
import { Button } from '@dashboard-link/ui';
import { getUserById } from '@/lib/api';
import type { Worker } from '@/types';

// Bad - mixed order
import { getUserById } from '@/lib/api';
import { useState } from 'react';
import type { Worker } from '@/types';
import { Button } from '@dashboard-link/ui';
```

### Import Aliases
- Use `@/` for relative imports within app/package
- Use `@dashboard-link/*` for cross-package imports
- Avoid `../../../` deep relative imports

## Error Handling Rules

### How Errors Are Caught
- **API routes:** Use try-catch, return standardized error response
- **Services:** Throw custom error classes (e.g., `UnauthorizedError`, `ValidationError`)
- **React components:** Use error boundaries for component tree errors
- **Async operations:** Always handle promise rejections

### Error Response Format
```typescript
// Success
{ success: true, data: { /* ... */ } }

// Error
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid phone number format",
    details: { field: "phone_number", issue: "must be E.164 format" }
  }
}
```

### Custom Error Classes
```typescript
class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
}

class UnauthorizedError extends Error {
  statusCode = 401;
  code = 'UNAUTHORIZED';
}
```

## Comment Style

### When to Comment
- **Complex business logic** that isn't obvious from code
- **Why, not what** — explain reasoning, not what code does
- **TODOs** — use `// TODO: specific thing needed` format
- **Security considerations** — explain security decisions

### When NOT to Comment
- **Obvious code** — don't comment self-explanatory code
- **Redundant comments** — don't repeat what code already says
- **Outdated comments** — delete comments when code changes

### Format
```typescript
// Good - explains WHY
// Use SHA-256 hash instead of storing raw token for security
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

// Bad - explains WHAT (obvious from code)
// Hash the token
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

// Good - TODO with specifics
// TODO: Add rate limiting - max 10 SMS per minute per organization

// Bad - TODO without specifics
// TODO: improve this
```

## Definition of Done

A feature/task is considered complete when:

1. **Code written** and follows standards above
2. **TypeScript compiles** with no errors (strict mode)
3. **Tests pass** (if tests exist for this area)
4. **Manual testing** completed (feature works as expected)
5. **Error handling** implemented (handles failures gracefully)
6. **Multi-tenant scoped** (all queries include `organization_id` where applicable)
7. **Input validation** added (Zod schemas for API endpoints)
8. **Code reviewed** (self-review or peer review)
9. **Documentation updated** (if public API or complex logic)
10. **No console.log** left in code (use proper logging)

## Explicitly Banned Patterns

### Never Do This
1. **Trust tenant IDs from client input** — always derive from JWT/session/token
2. **Hardcode secrets** — use environment variables
3. **Use `any` type** — use `unknown` or proper types
4. **Bypass RLS with service role** — without explicitly setting tenant context
5. **Commit `.env` files** — add to `.gitignore`
6. **Use `var`** — use `const` or `let`
7. **Mutate props** — props are immutable in React
8. **Use `index` as key** in React lists — use stable IDs
9. **Ignore TypeScript errors** — fix them, don't suppress
10. **Leave TODO comments** without specifics — explain what needs to be done

### Why These Are Banned
- **Trust tenant IDs from client:** Security vulnerability (tenant data leakage)
- **Hardcode secrets:** Security vulnerability (exposed credentials)
- **Use `any`:** Defeats purpose of TypeScript (no type safety)
- **Bypass RLS without context:** Security vulnerability (cross-tenant data access)
- **Commit `.env`:** Security vulnerability (exposed secrets)
- **Use `var`:** Confusing scoping rules (use modern `const`/`let`)
- **Mutate props:** React anti-pattern (causes bugs)
- **Use `index` as key:** React anti-pattern (causes rendering bugs)
- **Ignore TypeScript errors:** Defeats purpose of TypeScript
- **Generic TODOs:** Not actionable (no one knows what to do)
