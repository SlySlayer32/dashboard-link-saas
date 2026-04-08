# API Overview

## Base URL
**Local Development:** `http://localhost:3001/api`  
**Production:** ## TODO: Add production API URL once deployed

## Authentication Method
JWT (JSON Web Tokens) via Supabase Auth

**How it works:**
1. Admin users log in via Supabase Auth (email/password)
2. Supabase returns JWT access token (15 min expiry) + refresh token (7 days)
3. Client includes token in `Authorization: Bearer <token>` header on all API requests
4. API validates JWT signature and extracts user ID + organization ID from payload
5. Refresh token used to obtain new access token when expired

**Worker dashboard access:**
- No JWT required—uses time-limited dashboard tokens in URL
- Token validated via `token_hash` lookup in `dashboard_tokens` table
- Tokens expire after 1-24 hours (configurable per organization)

## Request Format
**Headers required:**
- `Content-Type: application/json` (for POST/PUT/PATCH)
- `Authorization: Bearer <jwt_token>` (for authenticated endpoints)

**Body format:**
- JSON only
- All inputs validated with Zod schemas
- Validation errors return 400 with detailed field-level errors

## Response Format

**✅ VERIFIED:** Response format implemented in `apps/api/src/middleware/error-handler.ts` and used across all route handlers.

**Success response:
```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-03-07T01:30:00Z"
  }
}
```

**Error response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid phone number format",
    "details": {
      "field": "phone_number",
      "issue": "must be E.164 format (+61...)"
    }
  }
}
```

**Standard error codes:**

**✅ VERIFIED:** Error codes implemented in `apps/api/src/utils/errors.ts` and `apps/api/src/middleware/error-handler.ts`.

- `UNAUTHORIZED` (401) — Invalid or expired JWT ✅
- `FORBIDDEN` (403) — Valid JWT but insufficient permissions ✅
- `NOT_FOUND` (404) — Resource does not exist ✅
- `VALIDATION_ERROR` (400) — Request body/query validation failed ✅
- `RATE_LIMITED` (429) — Too many requests ✅ (note: code is `RATE_LIMITED` not `RATE_LIMIT_EXCEEDED`)
- `INTERNAL_ERROR` (500) — Unexpected server error ✅
- `CONFLICT` (409) — Resource already exists ✅
- `BAD_REQUEST` (400) — General bad request ✅

## Rate Limiting

**✅ VERIFIED:** Rate limiting middleware implemented in `apps/api/src/middleware/rate-limit.ts` (in-memory for dev, needs Redis for production).

**Recommended limits (per organization):
- **General API requests:** 100 requests per minute
- **SMS sending:** 10 requests per minute (aligned with `sms_limit_per_hour` in database)
- **Dashboard token generation:** 20 requests per minute
- **Plugin sync operations:** 30 requests per hour (resource-intensive)

**Implementation approach:**
- Use `hono-rate-limiter` middleware with Redis store for distributed rate limiting
- Key generator: `organizationId` from JWT (tenant-scoped limits)
- Window: 60 seconds (1 minute) for most endpoints
- Skip health check endpoints from rate limiting
- Different limits for different endpoint groups (general vs SMS vs plugins)

**Response headers when rate limited:**
- `X-RateLimit-Limit: 100` — Max requests allowed in window
- `X-RateLimit-Remaining: 0` — Requests remaining in current window
- `X-RateLimit-Reset: 1678150800` — Unix timestamp when limit resets
- `Retry-After: 60` — Seconds to wait before retrying

**Error response when rate limited (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetTime": "2026-03-07T01:31:00Z",
      "retryAfter": 60
    }
  }
}
```

## Versioning Strategy
**Current:** No versioning (MVP phase)

**Post-MVP:**
- URL-based versioning: `/api/v1/workers`, `/api/v2/workers`
- Maintain old versions for at least 24 months
- Deprecation notices via response headers:
  - `Deprecation: true`
  - `Sunset: 2028-01-07` (date when version will be removed)
- Breaking changes require new version
- Non-breaking changes (new fields, new endpoints) added to existing version
