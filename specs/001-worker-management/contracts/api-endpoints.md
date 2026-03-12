# API Contracts: Worker Management

**Feature**: Worker Management  
**Date**: 2026-03-08  
**Base URL**: `/api/v1/workers`

## Overview

RESTful API endpoints for worker CRUD operations with soft delete, phone validation, and multi-tenant isolation.

---

## Authentication

All endpoints require authentication via JWT token in `Authorization` header.

```http
Authorization: Bearer <jwt_token>
```

**JWT Claims Required**:
- `sub`: User ID
- `organization_id`: Organization ID (used for tenant context)

**Middleware Chain**:
1. Auth middleware: Validates JWT, extracts user ID
2. Tenant middleware: Sets `app.tenant_id` from JWT claims
3. Route handler: Executes business logic

---

## Endpoints

### 1. List Workers

Get all active workers for the authenticated user's organization.

**Endpoint**: `GET /api/v1/workers`

**Query Parameters**:
- `include_deleted` (optional): `true` | `false` (default: `false`)
- `search` (optional): Search query for name
- `limit` (optional): Max results (default: 100, max: 1000)

**Request Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Success Response** (200 OK):
```json
{
  "workers": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Smith",
      "phone": "+61412345678",
      "email": "john@example.com",
      "organizationId": "660e8400-e29b-41d4-a716-446655440000",
      "active": true,
      "deletedAt": null,
      "metadata": {},
      "createdAt": "2026-03-08T10:30:00Z",
      "updatedAt": "2026-03-08T10:30:00Z"
    }
  ],
  "total": 1
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Database error

---

### 2. Get Worker by ID

Get a single worker by ID (must belong to user's organization).

**Endpoint**: `GET /api/v1/workers/:id`

**Path Parameters**:
- `id`: Worker UUID

**Request Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Success Response** (200 OK):
```json
{
  "worker": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Smith",
    "phone": "+61412345678",
    "email": "john@example.com",
    "organizationId": "660e8400-e29b-41d4-a716-446655440000",
    "active": true,
    "deletedAt": null,
    "metadata": {},
    "createdAt": "2026-03-08T10:30:00Z",
    "updatedAt": "2026-03-08T10:30:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Worker not found or doesn't belong to organization
- `500 Internal Server Error`: Database error

---

### 3. Create Worker

Create a new worker for the authenticated user's organization.

**Endpoint**: `POST /api/v1/workers`

**Request Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "John Smith",
  "phone": "0412 345 678"
}
```

**Field Validation**:
- `name`: Required, 1-255 characters, trimmed
- `phone`: Required, AU mobile format (04XX XXX XXX), converted to E.164

**Success Response** (201 Created):
```json
{
  "worker": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Smith",
    "phone": "+61412345678",
    "email": null,
    "organizationId": "660e8400-e29b-41d4-a716-446655440000",
    "active": true,
    "deletedAt": null,
    "metadata": {},
    "createdAt": "2026-03-08T10:30:00Z",
    "updatedAt": "2026-03-08T10:30:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
  ```json
  {
    "error": "Validation failed",
    "details": [
      {
        "field": "phone",
        "message": "Invalid Australian mobile number"
      }
    ]
  }
  ```
- `409 Conflict`: Phone number already in use by active worker
  ```json
  {
    "error": "Phone number already in use by an active worker"
  }
  ```
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Database error

---

### 4. Update Worker

Update an existing worker (must belong to user's organization).

**Endpoint**: `PUT /api/v1/workers/:id`

**Path Parameters**:
- `id`: Worker UUID

**Request Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body** (all fields optional):
```json
{
  "name": "Jonathan Smith",
  "phone": "0423 456 789"
}
```

**Field Validation**:
- `name`: Optional, 1-255 characters, trimmed
- `phone`: Optional, AU mobile format, converted to E.164

**Success Response** (200 OK):
```json
{
  "worker": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Jonathan Smith",
    "phone": "+61423456789",
    "email": null,
    "organizationId": "660e8400-e29b-41d4-a716-446655440000",
    "active": true,
    "deletedAt": null,
    "metadata": {},
    "createdAt": "2026-03-08T10:30:00Z",
    "updatedAt": "2026-03-08T11:45:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `404 Not Found`: Worker not found or doesn't belong to organization
- `409 Conflict`: Phone number already in use by another active worker
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Database error

---

### 5. Delete Worker (Soft Delete)

Soft delete a worker (sets `deleted_at` timestamp, preserves historical data).

**Endpoint**: `DELETE /api/v1/workers/:id`

**Path Parameters**:
- `id`: Worker UUID

**Request Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Worker deleted successfully"
}
```

**Error Responses**:
- `404 Not Found`: Worker not found or doesn't belong to organization
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Database error

**Side Effects**:
- Worker's `deleted_at` set to current timestamp
- Worker excluded from active worker queries
- SMS sending to this worker blocked
- Historical SMS logs and access logs preserved
- Dashboard tokens remain valid until expiry (but worker shown as inactive)

---

## Validation Rules

### Phone Number Validation

**Accepted Input Formats**:
- `0412 345 678` (spaces)
- `0412-345-678` (dashes)
- `0412345678` (no formatting)
- `+61412345678` (E.164 format)

**Storage Format**: E.164 (`+614XXXXXXXX`)

**Validation Logic**:
1. Parse with libphonenumber-js (country: AU)
2. Verify type is MOBILE (not landline)
3. Convert to E.164 format
4. Check uniqueness (active workers only)

**Error Messages**:
- "Invalid Australian mobile number" - Not a valid AU mobile
- "Phone number already in use by an active worker" - Duplicate active worker
- "Phone number is required" - Missing phone field

### Name Validation

**Rules**:
- Required (cannot be empty)
- Min length: 1 character
- Max length: 255 characters
- Trimmed before storage
- Supports Unicode (apostrophes, hyphens, accents)

**Error Messages**:
- "Name is required" - Missing name field
- "Name cannot be empty" - Empty string after trimming
- "Name must be 255 characters or less" - Exceeds max length

---

## Multi-Tenant Isolation

All endpoints automatically scoped to authenticated user's organization via RLS.

**Tenant Context Flow**:
1. JWT validated, `organization_id` extracted from claims
2. Tenant middleware sets `app.tenant_id` session variable
3. All database queries inherit tenant context
4. RLS policies enforce `organization_id = current_setting('app.tenant_id')::uuid`

**Security Guarantees**:
- User from Org A cannot see workers from Org B
- User from Org A cannot create workers in Org B
- User from Org A cannot update/delete workers in Org B
- Even SQL injection cannot cross tenant boundaries (database-level isolation)

---

## Rate Limiting

**General API Requests**: 100 requests per minute per organization  
**Worker Operations**: No additional limits (covered by general limit)

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1709884800
```

**Rate Limit Exceeded** (429 Too Many Requests):
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

---

## Error Response Format

All error responses follow consistent format:

```json
{
  "error": "Human-readable error message",
  "details": [
    {
      "field": "phone",
      "message": "Invalid Australian mobile number"
    }
  ]
}
```

**Common HTTP Status Codes**:
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Examples

### Create Worker with Phone Validation

**Request**:
```bash
curl -X POST https://api.cleanconnect.com/api/v1/workers \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "phone": "0412 345 678"
  }'
```

**Response** (201 Created):
```json
{
  "worker": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Smith",
    "phone": "+61412345678",
    "organizationId": "660e8400-e29b-41d4-a716-446655440000",
    "active": true,
    "deletedAt": null,
    "createdAt": "2026-03-08T10:30:00Z",
    "updatedAt": "2026-03-08T10:30:00Z"
  }
}
```

### Soft Delete Worker

**Request**:
```bash
curl -X DELETE https://api.cleanconnect.com/api/v1/workers/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <jwt_token>"
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Worker deleted successfully"
}
```

### List Active Workers

**Request**:
```bash
curl -X GET https://api.cleanconnect.com/api/v1/workers \
  -H "Authorization: Bearer <jwt_token>"
```

**Response** (200 OK):
```json
{
  "workers": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Smith",
      "phone": "+61412345678",
      "organizationId": "660e8400-e29b-41d4-a716-446655440000",
      "active": true,
      "deletedAt": null,
      "createdAt": "2026-03-08T10:30:00Z",
      "updatedAt": "2026-03-08T10:30:00Z"
    }
  ],
  "total": 1
}
```

---

## Summary

**Base URL**: `/api/v1/workers`  
**Endpoints**: 5 (list, get, create, update, delete)  
**Authentication**: JWT with `organization_id` claim  
**Tenant Isolation**: RLS via `app.tenant_id` session variable  
**Phone Validation**: libphonenumber-js, E.164 storage  
**Soft Delete**: `deleted_at` timestamp, preserves history  
**Rate Limit**: 100 req/min per organization
