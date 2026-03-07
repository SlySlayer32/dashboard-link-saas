# API Endpoints

## Workers

### GET /api/workers
**Description:** List all workers for the authenticated organization  
**Auth required:** Yes (JWT)  
**Query Params:**
- `limit` (optional, default 20) — Number of workers to return
- `offset` (optional, default 0) — Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "workers": [
      {
        "id": "uuid",
        "full_name": "John Smith",
        "phone_number": "+61412345678",
        "calendar_email": "john@example.com",
        "created_at": "2026-03-01T10:00:00Z"
      }
    ],
    "total": 42
  }
}
```

### POST /api/workers
**Description:** Create a new worker  
**Auth required:** Yes (JWT)  
**Request body:**
```json
{
  "full_name": "Jane Doe",
  "phone_number": "+61412345678",
  "calendar_email": "jane@example.com"
}
```

**Response:** 201 Created with worker object

### PUT /api/workers/:id
**Description:** Update an existing worker  
**Auth required:** Yes (JWT)  
**Request body:** Same as POST (all fields optional)  
**Response:** 200 OK with updated worker object

### DELETE /api/workers/:id
**Description:** Delete a worker  
**Auth required:** Yes (JWT)  
**Response:** 204 No Content

---

## Plugins

### GET /api/plugins
**Description:** List all configured plugins for the organization  
**Auth required:** Yes (JWT)  
**Response:**
```json
{
  "success": true,
  "data": {
    "plugins": [
      {
        "id": "uuid",
        "plugin_id": "google-calendar",
        "status": "active",
        "last_sync_at": "2026-03-07T01:00:00Z",
        "config": { /* plugin-specific config */ }
      }
    ]
  }
}
```

### POST /api/plugins
**Description:** Connect a new plugin  
**Auth required:** Yes (JWT)  
**Request body:**
```json
{
  "plugin_id": "google-calendar",
  "config": { /* plugin-specific config */ }
}
```

### PUT /api/plugins/:id
**Description:** Update plugin configuration  
**Auth required:** Yes (JWT)  
**Request body:** Plugin-specific config object  
**Response:** 200 OK with updated plugin object

### DELETE /api/plugins/:id
**Description:** Disconnect a plugin  
**Auth required:** Yes (JWT)  
**Response:** 204 No Content

### POST /api/plugins/:id/sync
**Description:** Manually trigger data sync for a plugin  
**Auth required:** Yes (JWT)  
**Response:** 200 OK with sync status

---

## SMS

### POST /api/sms/send
**Description:** Send dashboard link to one or more workers  
**Auth required:** Yes (JWT)  
**Request body:**
```json
{
  "worker_ids": ["uuid1", "uuid2"],
  "token_expiry_hours": 24
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sent": 2,
    "failed": 0,
    "results": [
      {
        "worker_id": "uuid1",
        "status": "sent",
        "message_id": "msg_abc123"
      }
    ]
  }
}
```

### GET /api/sms/logs
**Description:** Retrieve SMS delivery logs  
**Auth required:** Yes (JWT)  
**Query Params:**
- `worker_id` (optional) — Filter by worker
- `status` (optional) — Filter by status (sent/delivered/failed)
- `limit` (optional, default 50)
- `offset` (optional, default 0)

**Response:** Array of SMS log objects

---

## Tokens

### POST /api/tokens/generate
**Description:** Generate dashboard token for a worker  
**Auth required:** Yes (JWT)  
**Request body:**
```json
{
  "worker_id": "uuid",
  "expiry_hours": 24
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "tok_abc123...",
    "dashboard_url": "https://worker.dashboardlink.com/d/tok_abc123...",
    "expires_at": "2026-03-08T01:30:00Z"
  }
}
```

### POST /api/tokens/validate
**Description:** Validate a dashboard token (used by worker dashboard)  
**Auth required:** No (public endpoint)  
**Request body:**
```json
{
  "token": "tok_abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "worker_id": "uuid",
    "expires_at": "2026-03-08T01:30:00Z"
  }
}
```

### POST /api/tokens/revoke
**Description:** Manually revoke a token  
**Auth required:** Yes (JWT)  
**Request body:**
```json
{
  "token_id": "uuid"
}
```

**Response:** 204 No Content

---

## Dashboard

### GET /api/dashboard/:token
**Description:** Fetch dashboard data for a worker (used by worker dashboard)  
**Auth required:** No (token-based)  
**Response:**
```json
{
  "success": true,
  "data": {
    "worker": {
      "full_name": "John Smith"
    },
    "schedule": [
      {
        "time": "09:00",
        "location": "123 Main St",
        "access_code": "1234",
        "instructions": "Use side entrance"
      }
    ],
    "tasks": [],
    "contacts": []
  }
}
```

---

## Pagination Format

**✅ VERIFIED:** Offset-based pagination implemented in `apps/api/src/routes/tokens.ts` and `apps/api/src/routes/sms.ts`.

**Offset-based pagination** (MVP implementation):
- Query params: `page` (default 1, min 1) and `limit` (default 20, max 100)
- Calculation: `offset = (page - 1) * limit`
- Supabase query: `.range(offset, offset + limit - 1)`
- Response includes full pagination metadata

**Actual paginated response format:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "pagination": {
      "page": 2,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasMore": true
    },
    "requestId": "uuid",
    "version": "2024-01-01"
  }
}
```

**Endpoints with pagination:**
- `GET /api/tokens` — Token listing with filters
- `GET /api/sms/logs` — SMS logs with filters

**Future consideration:** Cursor-based pagination for large datasets (Phase 2+)
- Better performance for large tables
- Prevents duplicate/missing items during pagination
- Example: `?cursor=eyJpZCI6InV1aWQiLCJ0cyI6MTY3OH0&limit=20`

## Validation Schemas

All request bodies validated with Zod schemas. Common validation rules:

**Worker creation/update:**
```typescript
{
  full_name: string (1-100 chars),
  phone_number: string (E.164 format: /^\+[1-9]\d{1,14}$/),
  calendar_email?: string (valid email format)
}
```

**Plugin configuration:**
```typescript
{
  plugin_id: 'google-calendar' | 'airtable' | 'notion' | 'manual',
  config: object (plugin-specific schema)
}
```

**SMS sending:**
```typescript
{
  worker_ids: string[] (array of UUIDs),
  token_expiry_hours?: number (1-24, default from org settings)
}
```

**Token generation:**
```typescript
{
  worker_id: string (UUID),
  expiry_hours?: number (1-24, default 8)
}
```

## Webhook Endpoints (Phase 3+)

Webhook endpoints for real-time plugin updates deferred to Phase 3. Current MVP uses polling/manual sync.

**Planned webhook endpoints:**
- `POST /api/webhooks/google-calendar` — Google Calendar event changes
- `POST /api/webhooks/airtable` — Airtable record updates
- `POST /api/webhooks/notion` — Notion database changes
- `POST /api/webhooks/sms-delivery` — MobileMessage.com.au delivery status

All webhooks will require signature verification for security.
