# Backend Architecture

## Framework & Version

> See `@e:\CleanConnect\docs\2-architecture\TECH-STACK.md` for backend framework details — documented there as the single source of truth.

**Quick reference:** Hono.js 4.x + Node.js 18+ LTS + TypeScript 5.x (strict mode)

## Folder Structure

```
apps/api/
├── src/
│   ├── routes/             # API route handlers
│   │   ├── workers.ts      # /api/workers endpoints
│   │   ├── plugins.ts      # /api/plugins endpoints
│   │   ├── sms.ts          # /api/sms endpoints
│   │   └── tokens.ts       # /api/tokens endpoints
│   ├── middleware/         # Request middleware
│   │   ├── auth.ts         # JWT validation
│   │   ├── tenant.ts       # Multi-tenant context
│   │   └── validation.ts   # Zod schema validation
│   ├── services/           # Business logic
│   │   ├── dashboard.ts    # Dashboard generation
│   │   ├── sms.ts          # SMS sending
│   │   └── tokens.ts       # Token generation/validation
│   ├── lib/                # Utilities
│   │   ├── db.ts           # Supabase client
│   │   ├── errors.ts       # Custom error classes
│   │   └── logger.ts       # Structured logging
│   └── index.ts            # App entry point

packages/plugins/           # Plugin adapters
├── src/
│   ├── adapters/           # Concrete plugin implementations
│   │   ├── google-calendar.ts
│   │   ├── airtable.ts
│   │   ├── notion.ts
│   │   └── manual.ts
│   ├── registry.ts         # Plugin registry
│   └── types.ts            # Plugin contracts/interfaces
```

## Request Lifecycle

1. **Request arrives** → Hono.js router matches path
2. **Auth middleware** → Validates JWT, extracts user/org ID
3. **Tenant middleware** → Sets PostgreSQL RLS context (`SET app.tenant_id`)
4. **Validation middleware** → Validates request body/query with Zod
5. **Route handler** → Calls service layer for business logic
6. **Service layer** → Interacts with database, plugins, external APIs
7. **Response** → Standardized JSON format (`{ success: true, data }` or `{ success: false, error }`)
8. **Error handler** → Catches errors, formats response, logs

## Request Data Access

**Hono.js provides multiple methods to access request data:**

```typescript
// JSON body
const body = await c.req.json();

// Query parameters
const page = c.req.query('page'); // Single value
const filters = c.req.queries('filter'); // Multiple values (array)

// URL parameters
const workerId = c.req.param('id'); // From /workers/:id

// Headers
const auth = c.req.header('Authorization');

// Form data
const formData = await c.req.formData();

// Validated data (after zValidator middleware)
const validated = c.req.valid('json'); // Type-safe!
```

## Middleware

### Auth Middleware (`middleware/auth.ts`)
- Validates JWT from `Authorization: Bearer <token>` header
- Extracts user ID and organization ID from JWT payload
- Sets `c.set('userId', ...)` and `c.set('orgId', ...)` for downstream handlers
- Returns 401 if token invalid/expired

### Tenant Middleware (`middleware/tenant.ts`)
- Runs after auth middleware
- Executes `SET LOCAL app.tenant_id = $1` on PostgreSQL connection
- Ensures all queries are automatically scoped to organization via RLS
- Adds `tenantId` to logging context

**Context variables for passing data between middleware:**
```typescript
// In auth middleware - set context variables
app.use('/api/*', async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  const payload = await verifyJWT(token);
  
  c.set('userId', payload.sub);
  c.set('orgId', payload.organization_id);
  
  await next();
});

// In tenant middleware - get context variables
app.use('/api/*', async (c, next) => {
  const orgId = c.get('orgId'); // Type-safe access
  await db.execute(`SET LOCAL app.tenant_id = '${orgId}'`);
  await next();
});

// In route handler - access context variables
app.get('/api/workers', async (c) => {
  const orgId = c.get('orgId');
  const userId = c.get('userId');
  // ... use orgId and userId
});
```

### Validation Middleware (`middleware/validation.ts`)
- Uses `@hono/zod-validator` package for Zod integration
- Validates request body/query/params against Zod schema
- Returns 400 with detailed validation errors if invalid
- Attaches validated data to context for type-safe access in handlers

**Example usage:**
```typescript
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const workerSchema = z.object({
  full_name: z.string().min(1).max(100),
  phone_number: z.string().regex(/^\+[1-9]\d{1,14}$/),
});

app.post('/api/workers', 
  zValidator('json', workerSchema),
  async (c) => {
    const validated = c.req.valid('json'); // Type-safe validated data
    // ... handler logic
  }
);
```

### Rate Limiting Middleware (TODO: Not yet implemented)
- Per-organization rate limits (e.g., 100 requests/minute)
- Per-endpoint rate limits (e.g., 10 SMS sends/minute)
- Returns 429 with `Retry-After` header if limit exceeded

## Error Handling

**Hono.js HTTPException (recommended):**
```typescript
import { HTTPException } from 'hono/http-exception';

// Throw HTTP errors directly
throw new HTTPException(401, { message: 'Invalid credentials' });
throw new HTTPException(404, { message: 'Worker not found' });
```

**Custom error classes (alternative):**
```typescript
class UnauthorizedError extends Error { statusCode = 401; }
class ForbiddenError extends Error { statusCode = 403; }
class NotFoundError extends Error { statusCode = 404; }
class ValidationError extends Error { statusCode = 400; }
class RateLimitError extends Error { statusCode = 429; }
```

**Global error handler:**
```typescript
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({
      success: false,
      error: {
        code: err.status === 401 ? 'UNAUTHORIZED' : 'ERROR',
        message: err.message,
      }
    }, err.status);
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', err);
  
  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    }
  }, 500);
});
```

**Error response format:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid phone number format",
    "details": { "field": "phone_number", "issue": "must be E.164 format" }
  }
}
```

**Error response format:**
- `code`: Stable error code for client handling (e.g., `VALIDATION_ERROR`, `UNAUTHORIZED`)
- `message`: Human-readable error message
- `details`: Optional object with additional context (validation errors, field names)

## Background Jobs / Queues

**MVP approach (synchronous):**
- SMS sending is synchronous (blocks HTTP response)
- Plugin data sync is on-demand (when dashboard is requested)
- Token cleanup runs via scheduled Supabase function

**Post-MVP (BullMQ + Redis):**

## TODO: BullMQ Implementation — UNVERIFIED ASSUMPTION REMOVED. Needs confirming against codebase before next coding session.

**Planned approach (not yet implemented):**
```typescript
import { Queue, Worker } from 'bullmq';

// Define queue
const smsQueue = new Queue('sms', {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// Add job to queue
await smsQueue.add('send-sms', {
  workerId: '123',
  phoneNumber: '+61412345678',
  message: 'Your dashboard is ready',
}, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // Start with 2 seconds
  },
  priority: 1, // High priority
});

// Process jobs
const worker = new Worker('sms', async (job) => {
  const { workerId, phoneNumber, message } = job.data;
  await sendSMS(phoneNumber, message);
}, {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// Handle failures
worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
```

**Planned queues:**
- SMS delivery queue (high priority, 3 retries, exponential backoff)
- Plugin sync queue (medium priority, 5 retries)
- Webhook processing queue (high priority, idempotency checks)
- Dead letter queue for failed jobs

## API Response Schemas

All API responses follow a standardized format for consistency:

**Success response:**
```typescript
{
  success: true,
  data: T,  // Response data (type varies by endpoint)
  meta?: {
    requestId: string,
    timestamp: string (ISO 8601),
    pagination?: {
      total: number,
      limit: number,
      offset: number,
      hasMore: boolean
    }
  }
}
```

**Error response:**
```typescript
{
  success: false,
  error: {
    code: string,  // Stable error code (VALIDATION_ERROR, UNAUTHORIZED, etc.)
    message: string,  // Human-readable error message
    details?: object  // Optional context (validation errors, field names)
  }
}
```

**Standard error codes:**
- `VALIDATION_ERROR` (400) — Request validation failed (Zod schema)
- `UNAUTHORIZED` (401) — Invalid or expired JWT
- `FORBIDDEN` (403) — Valid JWT but insufficient permissions
- `NOT_FOUND` (404) — Resource does not exist
- `CONFLICT` (409) — Resource already exists (e.g., duplicate phone number)
- `RATE_LIMIT_EXCEEDED` (429) — Too many requests
- `INTERNAL_ERROR` (500) — Unexpected server error

**Validation error details format:**
```typescript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Request validation failed",
    details: {
      issues: [
        {
          field: "phone_number",
          message: "Invalid phone number format",
          expected: "E.164 format (+61...)"
        }
      ]
    }
  }
}
```
