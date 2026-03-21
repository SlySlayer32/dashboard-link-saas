# Worker API Contract

**Feature**: 001-schema-alignment  
**API Version**: v1  
**Base Path**: `/api/v1/workers`  

---

## Endpoints

### 1. List Workers

**GET** `/api/v1/workers`

Retrieves all active workers for the authenticated organization.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| active | boolean | No | true | Filter by active status |
| include_deleted | boolean | No | false | Include soft-deleted workers |

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "workers": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "organization_id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "John Smith",
        "phone": "+61412345678",
        "email": "john@example.com",
        "active": true,
        "deleted_at": null,
        "metadata": {"department": "field_ops"},
        "created_at": "2026-03-01T10:00:00Z",
        "updated_at": "2026-03-19T08:30:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "per_page": 50
  }
}
```

#### Error Responses

- **401 Unauthorized**: Invalid or missing authentication token
- **403 Forbidden**: User does not have access to this organization

---

### 2. Get Worker by ID

**GET** `/api/v1/workers/:id`

Retrieves a specific worker by ID.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Worker ID |

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "organization_id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "John Smith",
    "phone": "+61412345678",
    "email": "john@example.com",
    "active": true,
    "deleted_at": null,
    "metadata": {},
    "created_at": "2026-03-01T10:00:00Z",
    "updated_at": "2026-03-19T08:30:00Z"
  }
}
```

#### Error Responses

- **401 Unauthorized**: Invalid or missing authentication token
- **403 Forbidden**: Worker belongs to different organization
- **404 Not Found**: Worker does not exist or has been soft-deleted

---

### 3. Create Worker

**POST** `/api/v1/workers`

Creates a new worker for the authenticated organization.

#### Request Body

```json
{
  "name": "John Smith",
  "phone": "+61412345678",
  "email": "john@example.com",
  "active": true,
  "metadata": {"department": "field_ops", "employee_id": "EMP-001"}
}
```

#### Field Specifications

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | Yes | 1-255 characters |
| phone | string | Yes | E.164 format (`^\+[1-9]\d{1,14}$`) |
| email | string | No | Valid email format |
| active | boolean | No | Default: `true` |
| metadata | object | No | Default: `{}` |

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "organization_id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "John Smith",
    "phone": "+61412345678",
    "email": "john@example.com",
    "active": true,
    "deleted_at": null,
    "metadata": {"department": "field_ops", "employee_id": "EMP-001"},
    "created_at": "2026-03-19T10:00:00Z",
    "updated_at": "2026-03-19T10:00:00Z"
  }
}
```

#### Error Responses

- **400 Bad Request**: Validation error (invalid phone format, missing name, etc.)
- **401 Unauthorized**: Invalid or missing authentication token
- **409 Conflict**: Phone number already exists for this organization

---

### 4. Update Worker

**PATCH** `/api/v1/workers/:id`

Updates an existing worker. All fields are optional - only provided fields are updated.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Worker ID |

#### Request Body

```json
{
  "name": "John Smith Updated",
  "phone": "+61412345679",
  "email": "john.new@example.com",
  "active": false,
  "metadata": {"department": "management"}
}
```

#### Field Specifications

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | No | 1-255 characters |
| phone | string | No | E.164 format |
| email | string | No | Valid email format or null |
| active | boolean | No | - |
| metadata | object | No | Merges with existing (shallow merge) |

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "organization_id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "John Smith Updated",
    "phone": "+61412345679",
    "email": "john.new@example.com",
    "active": false,
    "deleted_at": null,
    "metadata": {"department": "management"},
    "created_at": "2026-03-01T10:00:00Z",
    "updated_at": "2026-03-19T11:00:00Z"
  }
}
```

#### Error Responses

- **400 Bad Request**: Validation error
- **401 Unauthorized**: Invalid or missing authentication token
- **403 Forbidden**: Worker belongs to different organization
- **404 Not Found**: Worker does not exist
- **409 Conflict**: Phone number already exists for this organization

---

### 5. Soft Delete Worker

**DELETE** `/api/v1/workers/:id`

Soft-deletes a worker by setting `deleted_at` timestamp. Worker data is preserved.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Worker ID |

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "deleted_at": "2026-03-19T12:00:00Z",
    "message": "Worker soft-deleted successfully"
  }
}
```

#### Error Responses

- **401 Unauthorized**: Invalid or missing authentication token
- **403 Forbidden**: Worker belongs to different organization
- **404 Not Found**: Worker does not exist or already deleted

---

### 6. Restore Worker (Undelete)

**POST** `/api/v1/workers/:id/restore`

Restores a soft-deleted worker by clearing `deleted_at` timestamp.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Worker ID |

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "deleted_at": null,
    "message": "Worker restored successfully"
  }
}
```

#### Error Responses

- **400 Bad Request**: Worker is not deleted
- **401 Unauthorized**: Invalid or missing authentication token
- **403 Forbidden**: Worker belongs to different organization
- **404 Not Found**: Worker does not exist

---

## Schema Alignment Changes

This contract reflects the new column names after schema alignment:

| Old Column Name | New Column Name | API Field |
|-----------------|-----------------|-----------|
| `full_name` | `name` | `name` |
| `phone_number` | `phone` | `phone` |
| `calendar_email` | `email` | `email` |
| *(new)* | `active` | `active` |
| *(new)* | `deleted_at` | `deleted_at` |
| *(new)* | `metadata` | `metadata` |

---

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

The JWT must contain a valid `organization_id` claim for RLS tenant isolation.
