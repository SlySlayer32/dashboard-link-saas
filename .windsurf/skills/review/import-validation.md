# Import Validation Patterns

This document defines how to validate imports and ensure correct references across the codebase.

---

## Import Order Validation

Per Constitution Section I, imports must follow this order:

```typescript
// 1. External packages (React, third-party libraries)
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// 2. Internal packages (@dashboard-link/*)
import { supabase } from '@dashboard-link/database';
import { validateToken } from '@dashboard-link/auth';
import type { Worker } from '@dashboard-link/shared';

// 3. Relative imports (./* or ../*)
import { Button } from '@/components/ui/button';
import { useAuth } from '../hooks/useAuth';
import type { DashboardProps } from './types';

// 4. Types (if separate from value imports)
import type { FC } from 'react';
```

**Violations to flag**:
- Internal packages imported before external packages
- Relative imports mixed with package imports
- Deep relative imports (`../../../`) instead of `@/` alias

---

## Cross-Package Import Rules

### Allowed Import Directions

```
apps/admin → packages/* ✅
apps/worker → packages/* ✅
apps/api → packages/* ✅

packages/shared → (no app imports) ✅
packages/database → packages/shared ✅
packages/auth → packages/database, packages/shared ✅
packages/plugins → packages/shared ✅

apps/admin → apps/api ❌ (use API calls, not direct imports)
apps/worker → apps/admin ❌ (no cross-app imports)
packages/* → apps/* ❌ (packages cannot depend on apps)
```

### Constitution Violations

**CRITICAL violations** (File Structure Rules):
```typescript
// ❌ WRONG: Vendor SDK in app code
import { google } from 'googleapis'; // in apps/api/src/services/

// ✅ CORRECT: Vendor SDK in adapter
import { google } from 'googleapis'; // in packages/plugins/src/adapters/
```

```typescript
// ❌ WRONG: Business logic in route handler
// apps/api/src/routes/workers.ts
const worker = await supabase.from('workers').select('*').single();

// ✅ CORRECT: Business logic in service, DB access in repository
// apps/api/src/routes/workers.ts
const worker = await WorkerService.getById(workerId);
```

---

## Reference Validation Patterns

### 1. Type References

**Check**: All type imports resolve correctly

```typescript
// ❌ WRONG: Type doesn't exist
import type { WorkerDTO } from '@dashboard-link/shared'; // WorkerDTO not exported

// ✅ CORRECT: Type exists and is exported
import type { Worker } from '@dashboard-link/shared';
```

**Validation**:
- Type is exported from source file
- Import path is correct
- No circular type dependencies

---

### 2. Function References

**Check**: All function imports resolve and match signatures

```typescript
// ❌ WRONG: Function signature mismatch
import { validateToken } from '@dashboard-link/auth';
validateToken(token, workerId); // validateToken only takes 1 arg

// ✅ CORRECT: Signature matches
import { validateToken } from '@dashboard-link/auth';
const isValid = await validateToken(token);
```

**Validation**:
- Function is exported from source
- Call signature matches definition
- Return type is handled correctly

---

### 3. Component References

**Check**: React components imported correctly

```typescript
// ❌ WRONG: Default import of named export
import Button from '@/components/ui/button'; // Button is named export

// ✅ CORRECT: Named import
import { Button } from '@/components/ui/button';
```

**Validation**:
- Component is exported (default or named)
- Props interface matches usage
- No missing required props

---

### 4. Path Alias Validation

**Check**: `@/` alias used correctly within apps

```typescript
// ❌ WRONG: Deep relative import
import { Button } from '../../../components/ui/button';

// ✅ CORRECT: Path alias
import { Button } from '@/components/ui/button';
```

**Validation**:
- `@/` resolves to app's `src/` directory
- No `../../../` chains (max 1 level up)
- Consistent with tsconfig.json paths

---

## Monorepo Boundary Validation

### Package Dependencies

**Check**: `package.json` dependencies match actual imports

```json
// apps/admin/package.json
{
  "dependencies": {
    "@dashboard-link/shared": "workspace:*",
    "@dashboard-link/ui": "workspace:*"
  }
}
```

**Validation**:
- Every `@dashboard-link/*` import has matching dependency
- No imports from packages not in dependencies
- Workspace protocol used for internal packages

---

### Circular Dependency Detection

**Check**: No circular imports between packages

```typescript
// ❌ WRONG: Circular dependency
// packages/auth/src/index.ts
import { supabase } from '@dashboard-link/database';

// packages/database/src/index.ts
import { validateToken } from '@dashboard-link/auth'; // CIRCULAR!

// ✅ CORRECT: One-way dependency
// packages/auth depends on database
// packages/database does NOT depend on auth
```

**Validation**:
- Build dependency graph
- Flag any cycles
- Suggest breaking cycle (extract to shared, invert dependency)

---

## Import Validation Workflow

### Step 1: Scan Changed Files
```bash
# Get all import statements
grep -r "^import" apps/admin/src/components/WorkerList.tsx
```

### Step 2: Validate Each Import
- Check import order (external → internal → relative → types)
- Verify source file exists
- Confirm export exists in source
- Check package.json dependencies

### Step 3: Check Cross-Package Rules
- No app → app imports
- No package → app imports
- Vendor SDKs only in adapters

### Step 4: Validate References
- Function signatures match
- Type definitions exist
- Component props correct
- No circular dependencies

### Step 5: Report Findings

```markdown
| ID | Type | Severity | Location | Issue | Fix |
|----|------|----------|----------|-------|-----|
| I01 | Import Order | MEDIUM | `apps/admin/src/components/WorkerList.tsx:3` | Internal package imported before external | Move `@dashboard-link/shared` import after `react` |
| I02 | Boundary Violation | CRITICAL | `apps/api/src/services/CalendarService.ts:5` | Direct googleapis import in service layer | Move to `packages/plugins/src/adapters/google-calendar.ts` |
| I03 | Missing Export | HIGH | `packages/shared/src/types/index.ts` | `WorkerDTO` imported but not exported | Export `WorkerDTO` or use `Worker` instead |
| I04 | Deep Relative | LOW | `apps/admin/src/pages/Dashboard.tsx:8` | `../../../components/ui/button` | Use `@/components/ui/button` |
```

---

## Common Import Anti-Patterns

### Anti-Pattern 1: Barrel File Overuse
**Problem**: Re-exporting everything creates large bundles
```typescript
// ❌ WRONG: Barrel exports everything
export * from './WorkerService';
export * from './TokenService';
export * from './SMSService';
// Imports everything even if only need one

// ✅ CORRECT: Named exports
export { WorkerService } from './WorkerService';
export { TokenService } from './TokenService';
```

### Anti-Pattern 2: Index File Confusion
**Problem**: Importing from directory vs file
```typescript
// ❌ AMBIGUOUS: Could be index.ts or Button.tsx
import { Button } from '@/components/ui/button';

// ✅ EXPLICIT: Clear which file
import { Button } from '@/components/ui/button/Button';
// OR ensure button/index.ts exists and exports Button
```

### Anti-Pattern 3: Type-Only Imports Not Marked
**Problem**: Runtime imports for types increase bundle size
```typescript
// ❌ WRONG: Runtime import for type
import { Worker } from '@dashboard-link/shared';
const worker: Worker = { ... };

// ✅ CORRECT: Type-only import
import type { Worker } from '@dashboard-link/shared';
const worker: Worker = { ... };
```

### Anti-Pattern 4: Vendor SDK Leakage
**Problem**: External APIs imported outside adapters
```typescript
// ❌ CRITICAL: googleapis in service
// apps/api/src/services/CalendarService.ts
import { google } from 'googleapis';

// ✅ CORRECT: googleapis in adapter
// packages/plugins/src/adapters/google-calendar.ts
import { google } from 'googleapis';
```

---

## Integration with Constitution

### File Structure Rules (Section I)
- **Vendor SDK calls ONLY in adapters** → Flag any googleapis/airtable/notion imports outside `packages/plugins/src/adapters/`
- **Business logic in services** → Flag any business logic imports in route handlers
- **UI components in components** → Flag any component imports from non-component directories

### Import Order (Section I)
- External → Internal → Relative → Types
- Use `@/` for relative imports within app
- Use `@dashboard-link/*` for cross-package imports
- Avoid `../../../` deep relative imports

### Monorepo Boundaries (Section V)
- Apps can import from packages
- Packages cannot import from apps
- No cross-app imports (admin ↔ worker)

---

## Severity Guidelines

| Severity | Condition |
|----------|-----------|
| **CRITICAL** | Vendor SDK imported outside adapter (violates File Structure Rules) |
| **CRITICAL** | Circular dependency between packages (breaks build) |
| **HIGH** | Missing export causes runtime error |
| **HIGH** | Cross-app import (violates monorepo boundaries) |
| **MEDIUM** | Import order violation (style issue) |
| **MEDIUM** | Deep relative import instead of alias |
| **LOW** | Type-only import not marked with `type` keyword |

---

**Reference**: Used by `.windsurf/workflows/review.md` Pass 1 (Constitution) and Pass 5 (Code Quality)
