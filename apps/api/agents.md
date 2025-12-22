# API Backend Guidelines

When working with files in this directory:

## Purpose
RESTful API for all backend operations, handling authentication, data management, SMS delivery, and plugin orchestration.

## Tech Stack
- Hono.js (web framework)
- Node.js/Edge runtime
- Supabase client (database + auth)
- TypeScript

## Architecture
```
src/
├── routes/          # HTTP route handlers
│   ├── auth.ts      # Login, signup, logout
│   ├── workers.ts   # Worker CRUD
│   ├── organizations.ts
│   ├── dashboards.ts
│   ├── sms.ts
│   └── webhooks.ts
├── services/        # Business logic
│   ├── token.service.ts
│   ├── sms.service.ts
│   └── plugin-manager.ts
├── middleware/      # Request processing
│   ├── auth.ts      # JWT validation
│   └── rateLimit.ts # DDoS protection
└── index.ts         # App entry point
```

## File Naming Conventions
- Routes: kebab-case (e.g., `auth.ts`, `worker-management.ts`)
- Services: camelCase with "service" suffix (e.g., `tokenService.ts`)
- Middleware: camelCase (e.g., `authMiddleware.ts`)
- Types: camelCase (e.g., `apiTypes.ts`)

## Code Patterns

### Route Handler Structure
```typescript
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createSuccessResponse, createErrorResponse } from '../utils/response';

const router = new Hono<{ Variables: ContextVariables }>();

// Apply middleware
router.use(authMiddleware);

// GET endpoint
router.get('/', async (c) => {
  try {
    const data = await service.getData(c.get('organizationId'));
    return c.json(createSuccessResponse(data));
  } catch (error) {
    return c.json(createErrorResponse(error.message), 500);
  }
});

// POST endpoint with validation
router.post('/', validateBody(CreateSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const data = await service.createData(body, c.get('organizationId'));
    return c.json(createSuccessResponse(data), 201);
  } catch (error) {
    return c.json(createErrorResponse(error.message), 500);
  }
});
```

### Service Layer Pattern
```typescript
export class WorkerService {
  async getWorkers(organizationId: string): Promise<Worker[]> {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('organization_id', organizationId);
    
    if (error) throw new Error(error.message);
    return data;
  }
  
  async createWorker(worker: CreateWorkerRequest, organizationId: string): Promise<Worker> {
    const { data, error } = await supabase
      .from('workers')
      .insert({ ...worker, organization_id: organizationId })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }
}
```

## API Endpoints
- `POST /auth/login` - Admin authentication
- `POST /auth/signup` - New organization registration
- `GET/POST /workers` - Worker management
- `GET/PUT /organizations/:id` - Organization settings
- `POST /sms/send-dashboard-link` - Generate and send SMS
- `GET /dashboards/:token` - Public dashboard access
- `POST /webhooks/:pluginId` - Plugin webhook handlers

## Response Format
Always use the standardized response envelope:
```typescript
// Success
{
  success: true,
  data: T,
  message?: string
}

// Error
{
  success: false,
  error: string,
  code?: string
}
```

## Security Requirements

### Authentication
- Admin routes: JWT validation via middleware
- Public routes: Token validation for dashboard access
- Always extract organization_id from JWT

### Multi-Tenancy
- EVERY database query MUST filter by organization_id
- Use RLS policies as additional protection
- Never allow cross-organization data access

### Rate Limiting
- 100 requests/minute for general API
- 5 requests/minute for SMS endpoints
- Implement IP-based tracking

## Key Services

### TokenService
- Generate secure tokens (crypto.randomBytes)
- Store with expiry in database
- Validate tokens (check expiry, revoked status)
- Generate short dashboard URLs

### SMSService
- Australian phone formatting (+61)
- MobileMessage.com.au API integration
- SMS logging for audit trail
- Rate limiting to prevent abuse

### PluginManager
- Orchestrate data from multiple plugins
- Parallel plugin execution
- Error handling with graceful degradation
- Result aggregation and sorting

## Error Handling
- Use try-catch blocks in all route handlers
- Return appropriate HTTP status codes
- Never expose internal error details
- Log errors for debugging

## Validation
- Use Zod schemas for request validation
- Validate all input data
- Sanitize phone numbers
- Check required fields

## Database Patterns
- Use Supabase client for all DB operations
- Implement proper error handling
- Use transactions for multi-table operations
- Always include organization_id filter

## Testing
- Unit tests for services
- Integration tests for routes
- Mock external APIs (SMS gateway)
- Test authentication flows
- Verify RLS policies

## Deployment
- Can deploy to edge runtime
- Stateless design (no session storage)
- Environment variables for secrets
- Health check endpoint at `/health`
