# Quickstart: Worker Management Implementation

**Feature**: Worker Management (CRUD Only)  
**Date**: 2026-03-08  
**Estimated Time**: 6-8 hours (solo developer)

## Scope Clarification

**This feature implements CRUD operations only**:
- ✅ Add/edit/delete workers (admin dashboard)
- ✅ Phone validation (AU mobile, E.164 format)
- ✅ Soft delete (preserve historical data)
- ✅ Multi-tenant isolation (RLS)

**NOT included in this feature** (see `@e:\CleanConnect\specs\FEATURE-ROADMAP.md`):
- ❌ SMS sending → Feature 003-sms-delivery
- ❌ Token generation → Feature 002-token-system
- ❌ Worker dashboard → Feature 004-worker-dashboard
- ❌ Access logging → Feature 005-access-logging

## Overview

Step-by-step guide to implement worker CRUD operations with soft delete, phone validation, and multi-tenant isolation. Extends existing patterns—no new abstractions.

---

## Prerequisites

- [x] Supabase project running locally (`pnpm db:start`)
- [x] Node.js 18+ and pnpm installed
- [x] WorkerRepository exists (`packages/database/src/repositories/WorkerRepository.ts`)
- [x] WorkerService exists (`apps/api/src/services/WorkerService.ts`)
- [x] Admin app running (`pnpm dev` from `apps/admin/`)

---

## Phase 1: Database Migration (30 min)

### 1.1 Create Migration File

**File**: `supabase/migrations/20260308000000_add_worker_soft_delete.sql`

```sql
-- Add deleted_at column to workers table
ALTER TABLE workers ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for active worker queries
CREATE INDEX idx_workers_org_active ON workers(organization_id, deleted_at) 
WHERE deleted_at IS NULL;

-- Add unique constraint for phone numbers (active workers only)
CREATE UNIQUE INDEX idx_workers_phone_org_active 
ON workers(phone, organization_id) 
WHERE deleted_at IS NULL;

-- Add check constraint for E.164 phone format
ALTER TABLE workers ADD CONSTRAINT check_phone_e164 
CHECK (phone ~ '^\+[1-9]\d{1,14}$');

-- Add trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workers_updated_at 
BEFORE UPDATE ON workers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 1.2 Run Migration

```bash
# From repo root
pnpm db:migrate

# Verify migration applied
psql -h localhost -U postgres -d postgres -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'workers' AND column_name = 'deleted_at';"
```

**Expected Output**: `deleted_at` column exists

---

## Phase 2: Update Repository Layer (1 hour)

### 2.1 Update Worker Type

**File**: `packages/shared/src/types/worker.ts`

```typescript
export interface Worker {
  id: string;
  name: string;
  phone: string;
  email?: string;
  organizationId: string;
  active: boolean;
  deletedAt: string | null;  // ADD THIS LINE
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

### 2.2 Extend WorkerRepository

**File**: `packages/database/src/repositories/WorkerRepository.ts`

Add these methods to existing `WorkerRepository` class:

```typescript
// Soft delete worker
async softDelete(id: string): Promise<void> {
  this.validateId(id);
  
  try {
    await this.update(id, { 
      deletedAt: new Date().toISOString() 
    });
  } catch (error) {
    throw this.handleError(error, 'softDelete');
  }
}

// Find active workers only (override existing method)
async findByOrganizationId(organizationId: string): Promise<Worker[]> {
  return this.findMany({
    where: { 
      organizationId,
      deletedAt: null  // ADD THIS LINE
    },
    orderBy: [{ field: 'createdAt', direction: 'desc' }]
  });
}

// Find by phone (active workers only)
async findByPhoneActive(phone: string, organizationId: string): Promise<Worker | null> {
  return this.findOne({
    where: { 
      phone, 
      organizationId,
      deletedAt: null  // ADD THIS LINE
    }
  });
}
```

### 2.3 Update Transform Methods

Update `transformFromDB` to include `deletedAt`:

```typescript
protected transformFromDB(row: unknown): Worker {
  if (!row) {
    throw new Error('Cannot transform null or undefined row to Worker');
  }
  
  const data = row as Record<string, unknown>;
  return {
    id: data.id as string,
    name: data.name as string,
    phone: data.phone as string,
    email: data.email as string | undefined,
    organizationId: data.organization_id as string,
    active: data.active as boolean,
    deletedAt: data.deleted_at as string | null,  // ADD THIS LINE
    metadata: data.metadata as Record<string, unknown>,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}
```

---

## Phase 3: Update Service Layer (1 hour)

### 3.1 Update WorkerService

**File**: `apps/api/src/services/WorkerService.ts`

Replace `deleteWorker` method with soft delete:

```typescript
async deleteWorker(id: string, organizationId: string): Promise<void> {
  // Verify worker belongs to organization
  const worker = await this.getWorkerById(id, organizationId);
  if (!worker) {
    throw new Error('Worker not found');
  }

  // Soft delete instead of hard delete
  await this.workerRepo.softDelete(id);
}
```

Update `createWorker` to check for duplicate active workers:

```typescript
async createWorker(data: CreateWorkerRequest, organizationId: string): Promise<Worker> {
  // Validate and format phone number
  const formattedPhone = formatAustralianPhone(data.phone);

  // Check for duplicate phone (active workers only)
  const existing = await this.workerRepo.findByPhoneActive(formattedPhone, organizationId);
  if (existing) {
    throw new Error('Phone number already in use by an active worker');
  }

  const workerData = {
    name: data.name.trim(),
    phone: formattedPhone,
    email: data.email?.trim() || undefined,
    organizationId,
    active: true,
    metadata: data.metadata || {},
  };

  return this.workerRepo.create(workerData);
}
```

---

## Phase 4: Add API Routes (1.5 hours)

### 4.1 Create Workers Routes

**File**: `apps/api/src/routes/workers.routes.ts`

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { WorkerService } from '../services/WorkerService.js';
import { WorkerRepository } from '@dashboard-link/database';
import { getDatabaseAdapter } from '../lib/database.js';

const app = new Hono();

// Validation schemas
const createWorkerSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().regex(/^(04\d{2}\s?\d{3}\s?\d{3}|\+614\d{8})$/, 'Invalid AU mobile format'),
});

const updateWorkerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^(04\d{2}\s?\d{3}\s?\d{3}|\+614\d{8})$/, 'Invalid AU mobile format').optional(),
});

// Initialize service
const adapter = getDatabaseAdapter();
const workerRepo = new WorkerRepository(adapter);
const workerService = new WorkerService(workerRepo);

// GET /workers - List active workers
app.get('/', async (c) => {
  const orgId = c.get('orgId'); // From tenant middleware
  const workers = await workerService.getWorkers(orgId);
  return c.json({ workers, total: workers.length });
});

// GET /workers/:id - Get worker by ID
app.get('/:id', async (c) => {
  const orgId = c.get('orgId');
  const { id } = c.req.param();
  
  const worker = await workerService.getWorkerById(id, orgId);
  if (!worker) {
    return c.json({ error: 'Worker not found' }, 404);
  }
  
  return c.json({ worker });
});

// POST /workers - Create worker
app.post('/', zValidator('json', createWorkerSchema), async (c) => {
  const orgId = c.get('orgId');
  const data = c.req.valid('json');
  
  try {
    const worker = await workerService.createWorker(data, orgId);
    return c.json({ worker }, 201);
  } catch (error) {
    if (error.message.includes('already in use')) {
      return c.json({ error: error.message }, 409);
    }
    throw error;
  }
});

// PUT /workers/:id - Update worker
app.put('/:id', zValidator('json', updateWorkerSchema), async (c) => {
  const orgId = c.get('orgId');
  const { id } = c.req.param();
  const data = c.req.valid('json');
  
  try {
    const worker = await workerService.updateWorker(id, data, orgId);
    return c.json({ worker });
  } catch (error) {
    if (error.message === 'Worker not found') {
      return c.json({ error: error.message }, 404);
    }
    if (error.message.includes('already in use')) {
      return c.json({ error: error.message }, 409);
    }
    throw error;
  }
});

// DELETE /workers/:id - Soft delete worker
app.delete('/:id', async (c) => {
  const orgId = c.get('orgId');
  const { id } = c.req.param();
  
  try {
    await workerService.deleteWorker(id, orgId);
    return c.json({ success: true, message: 'Worker deleted successfully' });
  } catch (error) {
    if (error.message === 'Worker not found') {
      return c.json({ error: error.message }, 404);
    }
    throw error;
  }
});

export default app;
```

### 4.2 Register Routes

**File**: `apps/api/src/v1.ts`

Add workers routes to existing v1 router:

```typescript
import workersRoutes from './routes/workers.routes.js';

// ... existing imports and setup ...

app.route('/workers', workersRoutes);
```

---

## Phase 5: Frontend Implementation (2-3 hours)

### 5.1 Create API Client

**File**: `apps/admin/src/services/workers.api.ts`

```typescript
import axios from 'axios';
import type { Worker } from '@dashboard-link/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface CreateWorkerRequest {
  name: string;
  phone: string;
}

export interface UpdateWorkerRequest {
  name?: string;
  phone?: string;
}

export const workersApi = {
  list: () => 
    axios.get<{ workers: Worker[]; total: number }>(`${API_BASE}/api/v1/workers`),
  
  get: (id: string) => 
    axios.get<{ worker: Worker }>(`${API_BASE}/api/v1/workers/${id}`),
  
  create: (data: CreateWorkerRequest) => 
    axios.post<{ worker: Worker }>(`${API_BASE}/api/v1/workers`, data),
  
  update: (id: string, data: UpdateWorkerRequest) => 
    axios.put<{ worker: Worker }>(`${API_BASE}/api/v1/workers/${id}`, data),
  
  delete: (id: string) => 
    axios.delete<{ success: boolean }>(`${API_BASE}/api/v1/workers/${id}`),
};
```

### 5.2 Create React Hooks

**File**: `apps/admin/src/hooks/useWorkers.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workersApi } from '../services/workers.api';
import toast from 'react-hot-toast';

export function useWorkers() {
  return useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const response = await workersApi.list();
      return response.data.workers;
    },
  });
}

export function useWorkerMutations() {
  const queryClient = useQueryClient();
  
  const createWorker = useMutation({
    mutationFn: workersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success('Worker created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create worker');
    },
  });
  
  const updateWorker = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      workersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success('Worker updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update worker');
    },
  });
  
  const deleteWorker = useMutation({
    mutationFn: workersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success('Worker deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete worker');
    },
  });
  
  return { createWorker, updateWorker, deleteWorker };
}
```

### 5.3 Create UI Components

**File**: `apps/admin/src/components/WorkerList.tsx`

```typescript
import { useWorkers, useWorkerMutations } from '../hooks/useWorkers';
import { Button } from '@dashboard-link/ui';
import { Trash2, Edit } from 'lucide-react';

export function WorkerList() {
  const { data: workers, isLoading } = useWorkers();
  const { deleteWorker } = useWorkerMutations();
  
  if (isLoading) return <div>Loading...</div>;
  
  if (!workers || workers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No workers yet. Add your first worker to get started.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {workers.map((worker) => (
        <div key={worker.id} className="border rounded-lg p-4 flex justify-between items-center">
          <div>
            <h3 className="font-semibold">{worker.name}</h3>
            <p className="text-sm text-gray-600">{formatPhone(worker.phone)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                if (confirm('Delete this worker? Historical data will be preserved.')) {
                  deleteWorker.mutate(worker.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatPhone(phone: string): string {
  // Convert +614XXXXXXXX to 04XX XXX XXX
  if (phone.startsWith('+61')) {
    const digits = phone.slice(3);
    return `0${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return phone;
}
```

**File**: `apps/admin/src/components/WorkerForm.tsx`

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWorkerMutations } from '../hooks/useWorkers';
import { Button, Input } from '@dashboard-link/ui';

const workerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().regex(/^04\d{2}\s?\d{3}\s?\d{3}$/, 'Invalid AU mobile format (04XX XXX XXX)'),
});

type WorkerFormData = z.infer<typeof workerSchema>;

export function WorkerForm() {
  const { createWorker } = useWorkerMutations();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
  });
  
  const onSubmit = (data: WorkerFormData) => {
    createWorker.mutate({ data: data }, {
      onSuccess: () => reset(),
    });
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <Input {...register('name')} placeholder="John Smith" />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <Input {...register('phone')} placeholder="0412 345 678" />
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
      </div>
      
      <Button type="submit" disabled={createWorker.isPending}>
        {createWorker.isPending ? 'Creating...' : 'Add Worker'}
      </Button>
    </form>
  );
}
```

### 5.4 Create Workers Page

**File**: `apps/admin/src/pages/WorkersPage.tsx`

```typescript
import { WorkerList } from '../components/WorkerList';
import { WorkerForm } from '../components/WorkerForm';

export function WorkersPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Workers</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Add Worker</h2>
          <WorkerForm />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Workers</h2>
          <WorkerList />
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 6: Testing (2 hours)

### 6.1 Unit Tests

**File**: `packages/database/src/repositories/WorkerRepository.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { WorkerRepository } from './WorkerRepository';
import { MockDatabaseAdapter } from '../test/MockDatabaseAdapter';

describe('WorkerRepository', () => {
  let repo: WorkerRepository;
  let adapter: MockDatabaseAdapter;
  
  beforeEach(() => {
    adapter = new MockDatabaseAdapter();
    repo = new WorkerRepository(adapter);
  });
  
  it('should soft delete worker', async () => {
    const workerId = 'test-id';
    await repo.softDelete(workerId);
    
    const updated = await repo.findById(workerId);
    expect(updated?.deletedAt).not.toBeNull();
  });
  
  it('should exclude deleted workers from active queries', async () => {
    const orgId = 'org-1';
    const workers = await repo.findByOrganizationId(orgId);
    
    expect(workers.every(w => w.deletedAt === null)).toBe(true);
  });
});
```

### 6.2 Integration Tests

**File**: `apps/api/src/test/workers-integration.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { app } from '../index';

describe('Workers API', () => {
  it('should create worker with valid phone', async () => {
    const res = await app.request('/api/v1/workers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John Smith', phone: '0412 345 678' }),
    });
    
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.worker.phone).toBe('+61412345678');
  });
  
  it('should reject duplicate phone numbers', async () => {
    // Create first worker
    await app.request('/api/v1/workers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Worker 1', phone: '0412 345 678' }),
    });
    
    // Attempt duplicate
    const res = await app.request('/api/v1/workers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Worker 2', phone: '0412 345 678' }),
    });
    
    expect(res.status).toBe(409);
  });
  
  it('should soft delete worker', async () => {
    const createRes = await app.request('/api/v1/workers', {
      method: 'POST',
      body: JSON.stringify({ name: 'John', phone: '0412 345 678' }),
    });
    const { worker } = await createRes.json();
    
    const deleteRes = await app.request(`/api/v1/workers/${worker.id}`, {
      method: 'DELETE',
    });
    
    expect(deleteRes.status).toBe(200);
    
    // Verify excluded from list
    const listRes = await app.request('/api/v1/workers');
    const { workers } = await listRes.json();
    expect(workers.find(w => w.id === worker.id)).toBeUndefined();
  });
});
```

### 6.3 Run Tests

```bash
# From repo root
pnpm test

# With coverage
pnpm test:coverage
```

---

## Verification Checklist

- [ ] Migration applied successfully
- [ ] `deleted_at` column exists in `workers` table
- [ ] Unique index on `(phone, organization_id)` WHERE `deleted_at IS NULL`
- [ ] WorkerRepository has `softDelete` method
- [ ] WorkerService uses soft delete instead of hard delete
- [ ] API routes return 201 for create, 200 for update/delete
- [ ] Phone validation rejects invalid formats
- [ ] Duplicate phone numbers blocked for active workers
- [ ] Deleted workers excluded from list queries
- [ ] Frontend displays workers and handles create/delete
- [ ] Tests pass with >80% coverage on business logic

---

## Troubleshooting

**Issue**: Migration fails with "column already exists"  
**Solution**: Drop column manually: `ALTER TABLE workers DROP COLUMN deleted_at;`

**Issue**: Phone validation fails for valid numbers  
**Solution**: Check libphonenumber-js is installed: `pnpm add libphonenumber-js`

**Issue**: RLS blocks all queries  
**Solution**: Verify tenant middleware sets `app.tenant_id` correctly

**Issue**: Frontend can't reach API  
**Solution**: Check VITE_API_URL in `.env` file

---

## Next Steps

After implementation complete:
1. Run `/speckit.tasks` to generate task breakdown
2. Run `/speckit.implement` to execute tasks
3. Deploy to staging environment
4. User acceptance testing
5. Deploy to production

**Estimated Total Time**: 6-8 hours (solo developer)
