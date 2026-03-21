# Data Model: API Route Cleanup

**Feature**: 002-api-route-cleanup  
**Date**: 2026-03-20  
**Scope**: No new data entities - cleanup of existing routes only

---

## Overview

This feature does not introduce new data entities. It cleans up existing API route definitions and ensures proper service layer usage. The data model remains unchanged from the existing schema.

---

## Existing Entities Referenced

### Workers
**Source**: `workers` table in Supabase  
**Usage**: Worker management endpoints  
**Service**: `WorkerService`  
**Repository**: `WorkerRepository`

```typescript
interface Worker {
  id: string
  organization_id: string
  name: string
  phone: string
  email?: string
  active: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
}
```

### Dashboard Tokens
**Source**: `dashboard_tokens` table in Supabase  
**Usage**: Token-based dashboard access  
**Service**: `TokenService` (stub)  
**Status**: Future implementation

```typescript
interface DashboardToken {
  id: string
  worker_id: string
  organization_id: string
  token_hash: string
  expires_at: string
  created_at: string
  accessed_at?: string
  revoked_at?: string
}
```

### SMS Logs
**Source**: `sms_logs` table in Supabase  
**Usage**: SMS delivery tracking  
**Service**: `SMSService` (stub)  
**Status**: Future implementation

```typescript
interface SMSLog {
  id: string
  organization_id: string
  worker_id: string
  phone: string
  message: string
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  provider: string
  external_id?: string
  sent_at?: string
  delivered_at?: string
  error_message?: string
  created_at: string
}
```

---

## Service Layer Contracts

### TokenService (Stub)
```typescript
export class TokenService {
  async redeemToken(token: string): Promise<any> {
    throw new Error('TokenService not implemented');
  }

  async createToken(options: any): Promise<string> {
    throw new Error('TokenService not implemented');
  }
}
```

### SMSService (Stub)
```typescript
export class SMSService {
  async enqueueSMS(options: any): Promise<{ id: string }> {
    throw new Error('SMSService not implemented');
  }
}
```

### WorkerService (Implemented)
```typescript
export class WorkerService {
  constructor(private repository: WorkerRepository) {}

  async listWorkers(filters: ListWorkersFilters): Promise<Worker[]>
  async createWorker(data: CreateWorkerData): Promise<Worker>
  async updateWorker(id: string, data: UpdateWorkerData): Promise<Worker>
  async deleteWorker(id: string): Promise<void>
  async activateWorker(id: string): Promise<Worker>
  async deactivateWorker(id: string): Promise<Worker>
  // ... other methods
}
```

---

## API Route Structure

### Before Cleanup (Hypothetical)
```typescript
// v1.ts had duplicate routes:
v1.get('/workers', ...) // Inline - REMOVED
v1.post('/workers', ...) // Inline - REMOVED
v1.route('/workers', workers) // Mounted - KEPT
```

### After Cleanup (Current State)
```typescript
// v1.ts has single route definition:
v1.route('/workers', workers) // Only mounted route
```

---

## Validation Schemas

### Worker Operations
```typescript
const createWorkerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number'),
  email: z.string().email().optional(),
  active: z.boolean().default(true),
})

const updateWorkerSchema = createWorkerSchema.partial()

const listWorkersQuerySchema = z.object({
  include_deleted: z.coerce.boolean().optional().default(false),
  active: z.coerce.boolean().optional(),
  search: z.string().trim().optional(),
  limit: z.coerce.number().min(1).max(1000).optional().default(100),
})
```

### Token Operations
```typescript
const redeemTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})
```

---

## Error Handling Patterns

### Service Layer Errors
```typescript
// Stub services throw descriptive errors
throw new Error('TokenService not implemented')
throw new Error('SMSService not implemented')
```

### API Layer Error Handling
```typescript
// Endpoints catch and convert to HTTP responses
if (error instanceof Error && error.message.includes('not implemented')) {
  return c.json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Service not yet available',
    },
  }, 501)
}
```

---

## Data Flow

### Worker Management Flow
```
Client Request → v1.ts → workers Route → WorkerService → WorkerRepository → Database
```

### Token Redemption Flow
```
Client Request → v1.ts → TokenService (stub) → 501 Error Response
```

### SMS Sending Flow
```
Client Request → v1.ts → SMSService (stub) → 501 Error Response
```

---

## Security Considerations

### Multi-Tenant Isolation
- All database queries filtered by `organization_id`
- Tenant middleware sets context before route handlers
- Repository pattern enforces tenant scoping

### Input Validation
- All endpoints use Zod schemas
- Phone numbers validated in E.164 format
- UUID validation for entity IDs

### Error Information Leakage
- Generic error messages for 501 responses
- No internal implementation details exposed
- Consistent error format across all endpoints

---

## Migration Impact

### No Schema Changes
- This feature does not modify database schema
- No migration scripts required
- Existing data untouched

### API Contract Changes
- No breaking changes to existing endpoints
- Internal implementation cleanup only
- Response formats remain consistent

---

**Conclusion**: The data model for this cleanup feature is minimal, focusing on service layer contracts and API route organization rather than new data entities.
