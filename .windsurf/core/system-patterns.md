# System Patterns - CleanConnect Architecture

## Core Architectural Principles

### 1. Zapier-Style Layering (Mandatory)
```
Apps (admin/worker/api) 
    ↓
Core Services
    ↓
Contracts/Types (@dashboard-link/shared)
    ↓
Adapters/Connectors (packages/*/src)
    ↓
External Services (Supabase, Twilio, etc.)
```

**Key Rules**:
- Vendor SDK calls ONLY in adapters under `packages/*/src`
- Apps and core services MUST NOT call vendor SDKs directly
- All external communication goes through adapters
- Use types from `@dashboard-link/shared` for contracts

### 2. Multi-Tenant Architecture
- **Tenant Isolation**: Every query scoped by `organizationId`
- **Data Security**: RLS policies as backstop, not primary control
- **Session Management**: Derive tenant from auth token, never trust client
- **Resource Isolation**: Per-tenant data separation at all levels

### 3. Service Boundaries
```
apps/api (HTTP endpoints)
    ↓
services/ (business logic)
    ↓
packages/database (data access)
    ↓
supabase/ (storage & auth)
```

## Database Patterns

### 1. Schema Design
- All tables include `organizationId` (except system tables)
- Standard columns: `id`, `created_at`, `updated_at`, `organizationId`
- UUID primary keys for all tables
- Foreign key relationships maintained within tenant scope

### 2. Migration Strategy
- **Expand/Contract Pattern**: 
  1. Expand: Add new columns/tables
  2. Backfill: Migrate data safely
  3. Contract: Remove old columns (in future release)
- **Append-Only**: Never destructive migrations
- **Version Tracking**: All migrations numbered and ordered

### 3. Query Patterns
```typescript
// Always scope by organization
const data = await db
  .select()
  .from(employees)
  .where(eq(employees.organizationId, organizationId));
```

## API Patterns

### 1. Standard Response Format
```typescript
// Success
{
  success: true,
  data: { ... }
}

// Error
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input",
    requestId: "uuid",
    details: { ... }
  }
}
```

### 2. Validation Pattern
```typescript
// Always validate with Zod
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  organizationId: z.string().uuid()
});

const result = schema.safeParse(input);
if (!result.success) {
  return { success: false, error: { code: "VALIDATION_ERROR", ... } };
}
```

### 3. Error Handling
- Use stable error codes (no string matching)
- Log with correlation IDs
- Never expose internal errors to clients
- Rate limit on error-prone endpoints

## Connector Patterns

### 1. Version Strategy
- SemVer versioning for all connectors
- Per-organization pinning capability
- Canary rollout support
- Kill switch for emergency disable

### 2. Implementation Structure
```
packages/sms/
├── src/
│   ├── adapter.ts      # Vendor SDK calls here
│   ├── types.ts        # TypeScript types
│   ├── client.ts       # Public interface
│   └── errors.ts       # Error handling
└── package.json
```

### 3. Safety Features
- Circuit breaker for external calls
- Retry with exponential backoff
- Timeout handling
- Request/response logging (no PII)

## Frontend Patterns

### 1. Component Architecture
- Use shadcn/ui for base components
- Custom components in `packages/ui`
- Page components in app folders
- Shared logic in hooks and stores

### 2. State Management
```typescript
// Zustand for global state
interface AppState {
  organization: Organization | null;
  user: User | null;
  // ... other state
}

// TanStack Query for server state
const { data, error, isLoading } = useQuery({
  queryKey: ['employees', organizationId],
  queryFn: () => fetchEmployees(organizationId)
});
```

### 3. Form Handling
```typescript
// React Hook Form + Zod
const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});
```

## Security Patterns

### 1. Authentication Flow
1. User signs in with Supabase Auth
2. JWT token returned to client
3. Token sent with API requests
4. Server validates token, extracts organizationId
5. All operations scoped to organization

### 2. Authorization Checks
```typescript
// Never trust client-provided organizationId
const organizationId = await getOrganizationFromToken(token);
if (!organizationId) {
  throw new UnauthorizedError();
}
```

### 3. Data Protection
- PII encrypted at rest
- API endpoints enforce HTTPS
- Sensitive data in logs masked
- Regular security audits

## Performance Patterns

### 1. Database Optimization
- Index on frequently queried columns
- Use Supabase Edge Functions for compute
- Implement proper pagination
- Cache reference data

### 2. API Optimization
- Request batching where possible
- Compression for large payloads
- CDN for static assets
- Lazy loading in frontend

### 3. Monitoring
- Structured logs with correlation IDs
- Metrics by organization and feature
- Error tracking and alerting
- Performance budgets

## Development Patterns

### 1. Package Structure
```
packages/
├── shared/      # Types and utilities
├── database/    # DB schemas and migrations
├── auth/        # Authentication logic
├── sms/         # SMS connector
├── tokens/      # Token management
└── ui/          # Shared UI components
```

### 2. Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical flows
- Performance tests for scaling

### 3. Code Quality
- TypeScript strict mode
- ESLint + Prettier
- Pre-commit hooks
- Regular dependency updates
