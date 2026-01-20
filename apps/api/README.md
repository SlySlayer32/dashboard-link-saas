# CleanConnect API Gateway

A Hono.js-based API gateway implementing multi-tenant architecture with JWT authentication, Redis-based quota enforcement, and comprehensive endpoint coverage.

## Features

### 🔐 Authentication & Authorization
- **JWT Authentication** via Supabase
- **Tenant Isolation** with Row Level Security (RLS)
- **Role-based Access Control** (admin, worker)
- **Token-based Dashboard Access** for workers

### 📊 Quota Management
- **Redis-based Rate Limiting** per tenant
- **Plan-specific Quotas** (Free, Pro, Enterprise)
- **API Rate Limiting** (requests per minute)
- **SMS Quotas** (daily limits)
- **Resource Quotas** (workers, adapters)

### 📡 Endpoints

#### Admin Endpoints
- `POST /api/v1/workers` - Create worker
- `POST /api/v1/dashboards` - Create dashboard
- `POST /api/v1/dashboards/:id/send-link` - Send dashboard via SMS
- `POST /api/v1/adapters/configs` - Configure adapter

#### Worker Endpoints
- `POST /api/v1/dashboard/redeem` - Redeem dashboard token

#### Webhook Endpoints
- `POST /api/v1/webhooks/:provider` - Receive webhook with signature verification

### 🛡️ Security
- **Signature Verification** for webhooks
- **Idempotency Keys** for webhook processing
- **Structured Logging** with tenant context
- **CORS Configuration** for cross-origin requests

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Admin App     │     │   Worker App    │     │   External      │
│                 │     │                 │     │   Services      │
└─────────┬───────┘     └─────────┬───────┘     └─────────┬───────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway (Hono.js)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Auth      │  │   Tenant     │  │    Quota             │  │
│  │ Middleware  │  │ Middleware   │  │  Middleware          │  │
│  └─────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Supabase      │     │     Redis       │     │   MobileMessage │
│  (PostgreSQL)   │     │   (Quotas)      │     │     (SMS)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Environment Variables

Create a `.env` file in the API root:

```env
# API Configuration
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:5173

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_JWT_SECRET=your_jwt_secret
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=dashboard-link:

# SMS Configuration (MobileMessage.au)
MOBILEMESSAGE_USERNAME=your_username
MOBILEMESSAGE_PASSWORD=your_password
MOBILEMESSAGE_SENDER_ID=Dashboard

# Webhook Secrets
WEBHOOK_SECRET_GOOGLE=your_google_webhook_secret
WEBHOOK_SECRET_AIRTABLE=your_airtable_webhook_secret
WEBHOOK_SECRET_NOTION=your_notion_webhook_secret
WEBHOOK_SECRET_CUSTOM=your_custom_webhook_secret

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

## Installation

```bash
# Install dependencies
pnpm install

# Run in development
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## API Usage Examples

### Create a Worker

```bash
curl -X POST http://localhost:3000/api/v1/workers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone_e164": "+1234567890",
    "status": "active"
  }'
```

### Create a Dashboard

```bash
curl -X POST http://localhost:3000/api/v1/dashboards \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "worker_id": "worker-uuid",
    "name": "Daily Schedule",
    "config": {
      "widgets": [
        {
          "type": "schedule",
          "source": "google_calendar"
        }
      ]
    }
  }'
```

### Send Dashboard Link

```bash
curl -X POST http://localhost:3000/api/v1/dashboards/dashboard-uuid/send-link \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Your daily dashboard is ready!",
    "expires_in_hours": 24
  }'
```

### Redeem Dashboard Token (Worker)

```bash
curl -X POST http://localhost:3000/api/v1/dashboard/redeem \
  -H "Content-Type: application/json" \
  -d '{
    "token": "dashboard-token-here"
  }'
```

### Receive Webhook

```bash
curl -X POST http://localhost:3000/api/v1/webhooks/google_calendar \
  -H "X-Signature: webhook-signature" \
  -H "X-Idempotency-Key: unique-key" \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "channel-123",
    "resourceId": "resource-456"
  }'
```

## Response Format

All API responses follow a consistent format:

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    requestId: string;
    version: string;
    pagination?: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
    };
  };
}
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

Rate limited responses include quota headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
X-Quota-Plan: pro
```

## Testing

```bash
# Run unit tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tenant isolation tests
pnpm test:isolation
```

## Database Schema

The API uses the following key tables:

- `organizations` - Tenant organizations
- `workers` - Worker accounts
- `dashboards` - Dashboard configurations
- `dashboard_tokens` - Secure access tokens
- `adapter_configs` - Plugin configurations
- `sms_jobs` - SMS delivery tracking
- `webhook_jobs` - Async webhook processing

See migrations in `/supabase/migrations/` for full schema.

## Security Considerations

1. **JWT Tokens**: Always use HTTPS, validate expiration
2. **Tenant Isolation**: RLS policies enforce data isolation
3. **Rate Limiting**: Prevent abuse with Redis-based limits
4. **Input Validation**: Zod schemas validate all inputs
5. **Webhook Security**: Signature verification prevents spoofing

## Performance

- Request logging with structured JSON
- Redis caching for quota checks
- Connection pooling for database
- Efficient query patterns with indexes

## Deployment

### Environment Setup

1. Set all required environment variables
2. Configure Redis instance
3. Set up Supabase database
4. Configure SMS provider credentials

### Production Considerations

- Use HTTPS everywhere
- Configure proper CORS origins
- Set up monitoring and alerting
- Enable query logging for debugging
- Configure backup strategies

## Future Enhancements

- [ ] GraphQL API support
- [ ] WebSocket for real-time updates
- [ ] API versioning strategy
- [ ] OpenAPI documentation
- [ ] Circuit breaker pattern
- [ ] Distributed tracing
- [ ] Metrics collection (Prometheus)

## Contributing

1. Follow the existing code style
2. Add tests for new endpoints
3. Update documentation
4. Use semantic versioning
5. Create PRs for review
