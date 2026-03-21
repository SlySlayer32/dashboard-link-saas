# Deduplication Detection Patterns

This document defines how to detect and resolve code duplication across the codebase.

---

## Detection Strategies

### 1. Functional Duplication

**Pattern**: Two or more functions/methods that accomplish the same goal with different implementations.

**Detection**:
- Same input/output signatures
- Similar function names (e.g., `validateToken` vs `checkTokenValidity`)
- Identical business logic with different variable names
- Same external API calls with different wrappers

**Example**:
```typescript
// File A: packages/auth/src/token-utils.ts
export function validateToken(token: string): boolean {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return db.tokens.exists(hash);
}

// File B: apps/api/src/services/TokenService.ts
export async function checkTokenValidity(tokenString: string): Promise<boolean> {
  const tokenHash = crypto.createHash('sha256').update(tokenString).digest('hex');
  return await db.query('SELECT * FROM tokens WHERE hash = $1', [tokenHash]);
}
```

**Resolution**: Keep the version in the correct layer per constitution (services over utils, repositories over services for DB access).

---

### 2. Type/Interface Duplication

**Pattern**: Same data structure defined in multiple locations.

**Detection**:
- Identical or near-identical field names and types
- Same domain concept (Worker, Organization, Token) in different files
- Overlapping but not extending types

**Example**:
```typescript
// File A: apps/admin/src/types/worker.ts
interface Worker {
  id: string;
  name: string;
  phone: string;
  organizationId: string;
}

// File B: packages/shared/src/types/index.ts
export type WorkerData = {
  id: string;
  name: string;
  phone: string;
  organizationId: string;
}
```

**Resolution**: Consolidate in `packages/shared/src/types/` and import everywhere.

---

### 3. Component Duplication

**Pattern**: UI components that render the same thing with minor variations.

**Detection**:
- Similar JSX structure
- Same props but different names
- Identical styling patterns
- Same event handlers

**Example**:
```typescript
// File A: apps/admin/src/components/WorkerCard.tsx
export function WorkerCard({ worker }: { worker: Worker }) {
  return <div className="rounded-lg border p-4">{worker.name}</div>
}

// File B: apps/admin/src/components/WorkerListItem.tsx
export function WorkerListItem({ data }: { data: Worker }) {
  return <div className="rounded-lg border p-4">{data.name}</div>
}
```

**Resolution**: Keep one, make it configurable with props if variations needed.

---

### 4. Validation Logic Duplication

**Pattern**: Same validation rules in multiple places.

**Detection**:
- Identical regex patterns
- Same error messages
- Duplicate Zod schemas
- Repeated validation functions

**Example**:
```typescript
// File A: apps/api/src/routes/workers.ts
const phoneRegex = /^\+[1-9]\d{1,14}$/;

// File B: packages/shared/src/validators/phone.ts
const E164_PATTERN = /^\+[1-9]\d{1,14}$/;

// File C: apps/admin/src/lib/validation.ts
const PHONE_FORMAT = /^\+[1-9]\d{1,14}$/;
```

**Resolution**: Single source in `packages/shared/src/validators/`, export and import everywhere.

---

### 5. Data Transformation Duplication

**Pattern**: Same data mapping/transformation logic in multiple layers.

**Detection**:
- Converting between API response and UI model
- Database row to domain object mapping
- Same field renaming (camelCase ↔ snake_case)

**Example**:
```typescript
// File A: apps/api/src/services/WorkerService.ts
function toWorkerDTO(dbRow: any) {
  return {
    id: dbRow.id,
    name: dbRow.name,
    phoneNumber: dbRow.phone_number,
    orgId: dbRow.organization_id
  };
}

// File B: apps/admin/src/lib/api-client.ts
function mapWorkerResponse(data: any) {
  return {
    id: data.id,
    name: data.name,
    phoneNumber: data.phone_number,
    orgId: data.organization_id
  };
}
```

**Resolution**: Transformation should happen once at the boundary (repository → service or API → client).

---

## Canonical Path Decision Matrix

When multiple implementations exist, choose the canonical version using this priority:

| Priority | Location | Reason |
|----------|----------|--------|
| 1 | `packages/database/src/repositories/` | Database access must be centralized |
| 2 | `apps/api/src/services/` | Business logic belongs in services |
| 3 | `packages/shared/src/` | Shared code for cross-app reuse |
| 4 | `packages/*/src/adapters/` | Vendor SDK isolation |
| 5 | `apps/*/src/lib/` | App-specific utilities (last resort) |

**Constitution alignment**: Always prefer the location that matches File Structure Rules (Section I).

---

## Deduplication Workflow

### Step 1: Identify Duplicates
- Scan changed files and their dependencies
- Look for functions/types/components with >80% similarity
- Check for same external API calls or database queries

### Step 2: Determine Canonical Version
- Use decision matrix above
- Check which version matches spec/plan requirements
- Verify which follows constitution patterns

### Step 3: Plan Migration
- List all import sites that need updating
- Identify tests that need modification
- Check for breaking changes

### Step 4: Document in Report
```markdown
### [Conflict Title — e.g. Token Validation]

**Keep**: `packages/auth/src/TokenService.ts:validateToken()` — matches spec §3.2, follows Repository Pattern
**Remove**: `apps/api/src/utils/token-helpers.ts:checkToken()` — duplicate, violates File Structure Rules
**Remove**: `apps/admin/src/lib/auth.ts:isTokenValid()` — duplicate, should import from TokenService

**Migration**:
1. Update 3 import sites in `apps/api/src/routes/`
2. Update 1 import site in `apps/admin/src/components/`
3. Remove `token-helpers.ts` entirely
4. Update tests in `apps/api/src/utils/__tests__/`

**Update docs**: `plan.md §Services` — add note that TokenService is canonical for all token operations
```

---

## Integration with Speckit

### Before Implementation (via /speckit.analyze)
- Check if spec defines canonical locations for features
- Verify plan doesn't create duplicate responsibilities
- Ensure tasks don't implement same thing twice

### During Review (via /review)
- Detect duplicates created during implementation
- Flag violations of canonical paths from spec/plan
- Recommend consolidation before merge

### After Review
- Update spec/plan if canonical path changed
- Document architectural decisions in ADRs if needed
- Add to constitution if pattern should be enforced project-wide

---

## Common Duplication Anti-Patterns

### Anti-Pattern 1: Copy-Paste Across Apps
**Problem**: Same utility copied to `apps/admin/src/lib/` and `apps/worker/src/lib/`
**Solution**: Move to `packages/shared/src/utils/`

### Anti-Pattern 2: Vendor SDK Called Directly
**Problem**: Google Calendar API called from service AND from route handler
**Solution**: Consolidate in `packages/plugins/src/adapters/google-calendar.ts`

### Anti-Pattern 3: Validation in Multiple Layers
**Problem**: Phone validation in frontend form, API route, and service
**Solution**: Single Zod schema in `packages/shared/src/validators/`, imported everywhere

### Anti-Pattern 4: Type Definitions Scattered
**Problem**: `Worker` type defined in 3 different files with slight variations
**Solution**: Single source in `packages/shared/src/types/`, use type extensions if needed

---

## Severity Guidelines

| Severity | Condition |
|----------|-----------|
| **CRITICAL** | Duplicate violates constitution File Structure Rules (e.g., vendor SDK in app code) |
| **HIGH** | Duplicate creates conflicting canonical paths (unclear which to use) |
| **MEDIUM** | Duplicate exists but both versions work (consolidation improves maintainability) |
| **LOW** | Minor duplication in non-critical code (e.g., similar helper functions) |

---

**Reference**: Used by `.windsurf/workflows/review.md` Pass 3 — Duplicates and Conflicting Paths
