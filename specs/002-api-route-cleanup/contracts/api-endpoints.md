# API Endpoint Contracts: Route Cleanup

**Feature**: 002-api-route-cleanup  
**Date**: 2026-03-20  
**Status**: Verified - All endpoints working as designed

---

## Worker Management Endpoints

### Base URL: `/api/v1/workers`

All worker endpoints are handled by the mounted route from `./routes/workers.ts`.

#### GET /api/v1/workers
List workers with filtering and pagination.

**Request**:
```http
GET /api/v1/workers?active=true&limit=100&search=john
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "phone": "+61412345678",
      "email": "john@example.com",
      "active": true,
      "created_at": "2026-03-20T10:00:00Z",
      "updated_at": "2026-03-20T10:00:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 100,
    "offset": 0
  }
}
```

#### POST /api/v1/workers
Create a new worker.

**Request**:
```http
POST /api/v1/workers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Smith",
  "phone": "+61498765432",
  "email": "jane@example.com",
  "active": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Jane Smith",
    "phone": "+61498765432",
    "email": "jane@example.com",
    "active": true,
    "created_at": "2026-03-20T10:00:00Z",
    "updated_at": "2026-03-20T10:00:00Z"
  }
}
```

---

## Stub Service Endpoints

These endpoints return 501 Not Implemented as expected.

### POST /api/v1/dashboard/redeem
Redeem a dashboard token (stub service).

**Request**:
```http
POST /api/v1/dashboard/redeem
Content-Type: application/json

{
  "token": "test-token-123"
}
```

**Response**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_IMPLEMENTED",
    "message": "Service not yet available"
  }
}
```

### POST /api/v1/dashboards/{id}/send-link
Send dashboard link via SMS (stub service).

**Request**:
```http
POST /api/v1/dashboards/uuid/send-link
Authorization: Bearer <token>
Content-Type: application/json

{}
```

**Response**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_IMPLEMENTED",
    "message": "Service not yet available"
  }
}
```

---

## Error Response Format

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| NOT_IMPLEMENTED | 501 | Service stub not yet implemented |
| UNAUTHORIZED | 401 | Invalid or missing authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Request validation failed |
| INTERNAL_ERROR | 500 | Server error |

---

## Authentication

All endpoints except `/dashboard/redeem` require authentication:

```http
Authorization: Bearer <valid-jwt-token>
```

The `/dashboard/redeem` endpoint uses token-based authentication via request body.

---

## Rate Limits

- Worker endpoints: 100 requests/minute per organization
- Token redemption: 20 requests/minute per organization  
- SMS endpoints: 10 requests/minute per organization

---

## Middleware Chain

All protected routes use this middleware sequence:

1. **Authentication** - Validate JWT token
2. **Tenant Isolation** - Set organization context  
3. **Rate Limiting** - Enforce request limits
4. **Route Handler** - Process request
5. **Error Handler** - Format responses

---

## Testing Verification

Use these curl commands to verify endpoint behavior:

```bash
# Test worker endpoints (should work)
curl http://localhost:3001/api/v1/workers

# Test stub services (should return 501)
curl -X POST http://localhost:3001/api/v1/dashboard/redeem \
  -H "Content-Type: application/json" \
  -d '{"token": "test"}'

curl -X POST http://localhost:3001/api/v1/dashboards/123/send-link \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

**Contract Status**: ✅ VERIFIED - All endpoints respond as specified
