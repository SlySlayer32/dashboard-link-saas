# Research: Worker Management Implementation

**Feature**: Worker Management  
**Date**: 2026-03-08  
**Status**: Complete

## Overview

Research findings for implementing worker CRUD operations with soft delete, phone validation, and multi-tenant isolation. All technology choices are pre-determined by constitution and existing codebase patterns.

---

## 1. Soft Delete Pattern in PostgreSQL

### Decision
Use `deleted_at TIMESTAMPTZ` column with `NULL` for active records, timestamp for deleted records.

### Rationale
- **Preserves audit trail**: Historical SMS logs and dashboard access records remain queryable
- **Simple implementation**: Single column, no complex state management
- **Standard pattern**: Widely used in Rails, Django, Laravel ecosystems
- **RLS compatible**: Works seamlessly with existing `app.tenant_id` pattern
- **Reusable phone numbers**: Different workers can have same phone (one active, others deleted)

### Implementation Details
```sql
-- Migration: Add deleted_at column
ALTER TABLE workers ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for fast active worker queries
CREATE INDEX idx_workers_org_active ON workers(organization_id, deleted_at) 
WHERE deleted_at IS NULL;

-- RLS policy (existing pattern)
CREATE POLICY "tenant_isolation" ON workers FOR ALL 
USING (organization_id = current_setting('app.tenant_id')::uuid);
```

### Query Patterns
```typescript
// Active workers only (default)
WHERE deleted_at IS NULL AND organization_id = $1

// Include deleted workers (for admin/audit views)
WHERE organization_id = $1

// Soft delete operation
UPDATE workers SET deleted_at = NOW() WHERE id = $1
```

### Alternatives Considered
- **Hard delete**: Rejected - loses audit trail, violates constitution requirement to preserve SMS logs
- **`active` boolean**: Rejected - doesn't capture deletion timestamp, less semantic
- **Separate `deleted_workers` table**: Rejected - over-engineering for solo developer, complicates queries

---

## 2. Australian Phone Number Validation

### Decision
Use `libphonenumber-js` (already in dependencies) for validation, store in E.164 format (`+614XXXXXXXX`).

### Rationale
- **Already installed**: `libphonenumber-js` in `apps/api/package.json` (line 29)
- **Industry standard**: Google's libphonenumber library, battle-tested
- **E.164 compliance**: International standard format for SMS delivery
- **Flexible input**: Accepts "04XX XXX XXX", "0412-345-678", "0412345678", "+61412345678"
- **Normalization**: Converts all formats to consistent storage format

### Implementation Pattern
```typescript
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

function validateAndFormatAUMobile(input: string): string {
  // Parse with AU country code
  const phoneNumber = parsePhoneNumber(input, 'AU');
  
  // Validate it's a mobile number
  if (!phoneNumber || phoneNumber.getType() !== 'MOBILE') {
    throw new Error('Invalid Australian mobile number');
  }
  
  // Return E.164 format: +614XXXXXXXX
  return phoneNumber.format('E.164');
}
```

### Validation Rules
- **Format**: Must be Australian mobile (04XX XXX XXX)
- **Length**: 10 digits after removing formatting (04XXXXXXXX)
- **Prefix**: Must start with 04 (Australian mobile prefix)
- **Storage**: E.164 format (+614XXXXXXXX)
- **Display**: AU format with spaces (04XX XXX XXX)

### Edge Cases Handled
- **Spaces/dashes**: "0412 345 678", "0412-345-678" → normalized to +61412345678
- **International format**: "+61412345678" → accepted as-is
- **Landlines**: "02 1234 5678" → rejected (not mobile)
- **Invalid length**: "0412 345" → rejected
- **Non-AU numbers**: "+1 555 1234" → rejected (AU only for MVP)

### Alternatives Considered
- **Regex validation**: Rejected - doesn't handle international formats, error-prone
- **Custom validator**: Rejected - reinventing wheel, libphonenumber-js already proven
- **Twilio Lookup API**: Rejected - adds external dependency, costs money, overkill for MVP

---

## 3. Duplicate Phone Number Handling

### Decision
Prevent duplicate phone numbers for **active workers only** within same organization. Allow reuse of phone numbers from soft-deleted workers.

### Rationale
- **Business logic**: One phone number = one active worker per organization
- **Reusable after deletion**: Worker leaves, new worker can have same phone
- **Cross-org isolation**: Different organizations can have workers with same phone
- **Historical data preserved**: Old worker record remains with SMS history

### Implementation
```typescript
// Unique constraint (database level)
CREATE UNIQUE INDEX idx_workers_phone_org_active 
ON workers(phone, organization_id) 
WHERE deleted_at IS NULL;

// Service layer check (before create/update)
async createWorker(data: CreateWorkerRequest, orgId: string): Promise<Worker> {
  const existing = await this.workerRepo.findOne({
    where: { 
      phone: formattedPhone, 
      organizationId: orgId,
      deletedAt: null  // Only check active workers
    }
  });
  
  if (existing) {
    throw new Error('Phone number already in use by an active worker');
  }
  
  // Proceed with creation
}
```

### Scenarios
1. **Add worker with new phone**: ✅ Allowed
2. **Add worker with existing active worker's phone**: ❌ Blocked - "Phone number already in use"
3. **Add worker with soft-deleted worker's phone**: ✅ Allowed - creates new worker record
4. **Edit worker to duplicate phone**: ❌ Blocked - same validation as create
5. **Different org, same phone**: ✅ Allowed - multi-tenant isolation

### Alternatives Considered
- **Global uniqueness**: Rejected - breaks multi-tenancy, different orgs can't have same phone
- **No uniqueness check**: Rejected - creates confusion, which worker gets SMS?
- **Block reuse of deleted phones**: Rejected - limits phone number pool, unnecessary constraint

---

## 4. Repository Pattern Extension

### Decision
Extend existing `WorkerRepository` (already exists at `packages/database/src/repositories/WorkerRepository.ts`) to add soft delete methods.

### Rationale
- **Pattern already established**: WorkerRepository extends BaseRepository (line 15)
- **No new abstractions**: Constitution requirement - extend, don't create new patterns
- **Consistent with codebase**: OrganizationRepository, SMSLogRepository follow same pattern
- **Testable**: Repository layer can be mocked for service tests

### Methods to Add
```typescript
// WorkerRepository additions
async softDelete(id: string): Promise<void> {
  await this.update(id, { deletedAt: new Date().toISOString() });
}

async findActiveByOrganization(orgId: string): Promise<Worker[]> {
  return this.findMany({
    where: { organizationId: orgId, deletedAt: null },
    orderBy: [{ field: 'name', direction: 'asc' }]
  });
}

async findByPhoneActive(phone: string, orgId: string): Promise<Worker | null> {
  return this.findOne({
    where: { phone, organizationId: orgId, deletedAt: null }
  });
}
```

### Service Layer Usage
```typescript
// WorkerService (already exists at apps/api/src/services/WorkerService.ts)
async deleteWorker(id: string, orgId: string): Promise<void> {
  const worker = await this.getWorkerById(id, orgId);
  if (!worker) throw new Error('Worker not found');
  
  // Soft delete instead of hard delete
  await this.workerRepo.softDelete(id);
}
```

### Alternatives Considered
- **Direct SQL in routes**: Rejected - violates repository pattern, breaks abstraction
- **New SoftDeleteRepository**: Rejected - over-engineering, WorkerRepository sufficient
- **Separate DeletedWorkerRepository**: Rejected - complicates queries, unnecessary split

---

## 5. API Route Design

### Decision
RESTful routes under `/api/v1/workers` with standard CRUD operations.

### Rationale
- **Existing pattern**: Other routes follow `/api/v1/{resource}` pattern (see `apps/api/src/v1.ts`)
- **RESTful conventions**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **Hono.js routing**: Matches existing route structure in codebase
- **Middleware chain**: Auth → Tenant → Validation → Handler (established pattern)

### Endpoints
```typescript
// GET /api/v1/workers - List active workers for organization
// GET /api/v1/workers/:id - Get single worker
// POST /api/v1/workers - Create new worker
// PUT /api/v1/workers/:id - Update worker
// DELETE /api/v1/workers/:id - Soft delete worker
```

### Middleware Stack (per constitution)
```typescript
app.use('*', logger());           // 1. Logger
app.use('*', cors());             // 2. CORS
app.use('/api/*', authMiddleware); // 3. Auth (JWT validation)
app.use('/api/*', tenantMiddleware); // 4. Tenant (set app.tenant_id)
app.route('/api/v1', workersRoutes); // 5. Routes
app.onError(errorHandler);        // 6. Error handler
```

### Request/Response Contracts
```typescript
// POST /api/v1/workers
Request: { name: string, phone: string }
Response: { id: string, name: string, phone: string, organizationId: string, ... }

// PUT /api/v1/workers/:id
Request: { name?: string, phone?: string }
Response: { id: string, name: string, phone: string, ... }

// DELETE /api/v1/workers/:id
Response: { success: true, message: "Worker deleted" }
```

### Alternatives Considered
- **GraphQL**: Rejected - REST already established, no need for query flexibility
- **RPC-style routes**: Rejected - `/workers/create`, `/workers/update` less conventional
- **Nested routes**: Rejected - `/organizations/:id/workers` adds unnecessary nesting

---

## 6. Frontend State Management

### Decision
Use TanStack Query (React Query) for server state, following existing admin app pattern.

### Rationale
- **Already in use**: `@tanstack/react-query` in `apps/admin/package.json` (line 22)
- **Server state management**: Automatic caching, refetching, optimistic updates
- **Existing pattern**: Other admin features use TanStack Query
- **No additional dependencies**: Already installed and configured

### Hook Structure
```typescript
// apps/admin/src/hooks/useWorkers.ts
export function useWorkers() {
  return useQuery({
    queryKey: ['workers'],
    queryFn: () => api.get('/workers').then(r => r.data)
  });
}

export function useWorkerMutations() {
  const queryClient = useQueryClient();
  
  const createWorker = useMutation({
    mutationFn: (data: CreateWorkerRequest) => api.post('/workers', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workers'] })
  });
  
  const deleteWorker = useMutation({
    mutationFn: (id: string) => api.delete(`/workers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workers'] })
  });
  
  return { createWorker, deleteWorker };
}
```

### Component Pattern
```typescript
// apps/admin/src/pages/WorkersPage.tsx
function WorkersPage() {
  const { data: workers, isLoading } = useWorkers();
  const { createWorker, deleteWorker } = useWorkerMutations();
  
  // Render WorkerList and WorkerForm components
}
```

### Alternatives Considered
- **Zustand**: Rejected - TanStack Query better for server state, Zustand for client state
- **Redux**: Rejected - overkill for simple CRUD, TanStack Query sufficient
- **Local state only**: Rejected - no caching, manual refetch logic, more code

---

## 7. UI Component Structure

### Decision
Reusable components following shadcn/ui patterns (already in use).

### Rationale
- **Existing pattern**: Admin app uses shadcn/ui components (`packages/ui/`)
- **Accessible**: ARIA-compliant, keyboard navigation built-in
- **Consistent design**: Matches existing admin UI
- **Form handling**: React Hook Form + Zod validation (already in use)

### Component Hierarchy
```
WorkersPage (page)
├── WorkerList (list view)
│   ├── WorkerCard (individual worker)
│   │   ├── WorkerActions (edit/delete buttons)
│   │   └── WorkerStatus (active/deleted indicator)
│   └── EmptyState (no workers yet)
└── WorkerForm (create/edit form)
    ├── Input (name field)
    ├── PhoneInput (phone field with validation)
    └── Button (submit)
```

### Form Validation (Zod)
```typescript
const workerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().regex(/^04\d{2}\s?\d{3}\s?\d{3}$/, 'Invalid AU mobile format')
});

type WorkerFormData = z.infer<typeof workerSchema>;
```

### Alternatives Considered
- **Custom components**: Rejected - shadcn/ui already provides accessible components
- **Material-UI**: Rejected - shadcn/ui already in use, no need to add another library
- **Formik**: Rejected - React Hook Form already in use, better performance

---

## 8. Testing Strategy

### Decision
Three-layer testing: Unit (services/utils), Integration (API routes), E2E (deferred to Phase 2+).

### Rationale
- **Constitution requirement**: 80% business logic, 70% API routes, 60% overall
- **Vitest already configured**: `vitest.workspace.ts` at repo root
- **MSW for API mocking**: Already configured for integration tests
- **Multi-tenant isolation**: Critical to test (constitution requirement)

### Test Coverage Plan

**Unit Tests** (packages/database, apps/api/src/services)
- Phone validation: E.164 format, AU mobile only, error cases
- Soft delete logic: `deletedAt` timestamp, active worker queries
- Duplicate phone check: Active workers only, cross-org isolation
- Worker service methods: Create, update, delete, list

**Integration Tests** (apps/api/src/test)
- Multi-tenant isolation: Org A can't see Org B's workers
- RLS policy enforcement: Database-level isolation works
- API endpoints: Full request/response cycle
- Error handling: Validation errors, not found, duplicate phone

**Test Files to Create**
```
packages/database/src/repositories/WorkerRepository.test.ts
apps/api/src/services/WorkerService.test.ts
apps/api/src/routes/workers.routes.test.ts
apps/api/src/test/workers-integration.test.ts
```

### Critical Test Cases (Constitution Requirements)
1. **Multi-tenant isolation**: User from Org A cannot access workers from Org B
2. **Phone validation**: Invalid formats rejected, E.164 format enforced
3. **Soft delete**: Deleted workers excluded from active queries, historical data preserved
4. **Duplicate phone**: Active workers can't share phone, deleted workers don't block reuse
5. **RLS enforcement**: Even SQL injection can't cross tenant boundaries

### Alternatives Considered
- **E2E tests first**: Rejected - slower, harder to debug, deferred to Phase 2+
- **Manual testing only**: Rejected - violates constitution coverage requirements
- **Snapshot tests**: Rejected - brittle for API responses, prefer explicit assertions

---

## Summary

All research complete. No unknowns remain. Tech stack is pre-determined by constitution and existing codebase. Implementation follows established patterns:

1. **Soft delete**: `deleted_at TIMESTAMPTZ` column
2. **Phone validation**: libphonenumber-js (already installed)
3. **Duplicate handling**: Unique constraint on active workers only
4. **Repository pattern**: Extend WorkerRepository (already exists)
5. **API routes**: RESTful under `/api/v1/workers`
6. **Frontend state**: TanStack Query (already in use)
7. **UI components**: shadcn/ui (already in use)
8. **Testing**: Vitest + MSW (already configured)

**Next Phase**: Generate data-model.md and contracts/
