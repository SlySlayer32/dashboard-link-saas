# Phase 1 - Core Platform Skeleton

## Definition of Done ✅

- [x] Hono API gateway with Zod validation
- [x] Tenant middleware extracting org_id from JWT
- [x] `SET LOCAL app.tenant_id` for all tenant queries
- [x] RLS policies on all tenant-scoped tables
- [x] API versioning (`/api/v1` + header versioning)
- [x] Cross-tenant queries blocked by RLS
- [x] `GET /api/v1/health` works (public)
- [x] `GET /api/v1/me` works (authenticated)

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  API Gateway │────▶│ Supabase DB │
│             │     │   (Hono)     │     │  (Postgres) │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                   ┌──────────────┐
                   │ Tenant Mdw   │
                   │ (extract org)│
                   └──────────────┘
```

## Key Components

### 1. API Gateway (`apps/api/src/index.ts`)
- Hono.js framework with TypeScript
- CORS support for multiple origins
- Request/response logging
- Error handling
- API versioning support

### 2. Versioned API (`apps/api/src/v1.ts`)
- `/api/v1` routes with tenant isolation
- Zod validation for request/response
- Standardized response format
- Pagination support

### 3. Tenant Middleware (`packages/shared/src/tenant-middleware.ts`)
- Extracts `org_id` from JWT claims
- Sets `app.tenant_id` context for RLS
- Resource quota enforcement
- Token-based auth for workers

### 4. Database Schema (`supabase/migrations/003_tenant_schema.sql`)
- All tables have `org_id` column
- RLS enabled on tenant tables
- Policies use `current_setting('app.tenant_id')`
- Automatic updated_at triggers

## API Endpoints

### Public Endpoints
```http
GET /health                    # Health check
GET /api/v1/auth/login         # Login (placeholder)
```

### Protected Endpoints (require JWT)
```http
GET /api/v1/me                 # Current user info
GET /api/v1/organizations      # Org details (RLS filtered)
GET /api/v1/workers            # List workers (RLS filtered)
POST /api/v1/workers           # Create worker
```

## Testing Tenant Isolation

Run the isolation test:
```bash
cd apps/api
npm run test:isolation
```

This test:
1. Creates two organizations
2. Creates users for each org
3. Adds workers to each org
4. Verifies each user can only see their own data
5. Attempts SQL injection (should fail)
6. Cleans up test data

## Security Features

### Row Level Security (RLS)
- Automatic tenant isolation at DB level
- Policies use `current_setting('app.tenant_id')`
- Cannot be bypassed by application code

### JWT Authentication
- Admin users: Full JWT with org_id
- Workers: Opaque tokens via dashboard links
- Token expiry and refresh support

### Resource Quotas
- Enforced per plan (free/pro/enterprise)
- SMS limits per day
- Worker limits per org
- Rate limiting headers

## Versioning Strategy

### URL Versioning
```http
GET /api/v1/workers
```

### Header Versioning
```http
GET /api/workers
API-Version: 2024-01-01
```

Both methods route to the same handlers internally.

## Response Format

Standardized API response:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "uuid",
    "version": "2024-01-01",
    "pagination": { ... }
  }
}
```

## Next Steps

Phase 1 is complete. Ready for Phase 2:
- Plugin system implementation
- SMS integration
- Worker dashboard
- Real-time updates

## Troubleshooting

### RLS Not Working?
1. Check `app.tenant_id` is set: `SHOW app.tenant_id;`
2. Verify JWT contains `org_id` claim
3. Check RLS policies are enabled

### Cross-Tenant Data Leak?
1. Run `npm run test:isolation`
2. Check all queries use tenant context
3. Verify no raw SQL bypasses RLS

### Versioning Issues?
1. Check header version mapping
2. Verify URL version precedence
3. Test both versioning methods
