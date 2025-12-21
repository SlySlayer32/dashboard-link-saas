# API Hints

> **Purpose**: Hono.js backend serving admin dashboard, worker endpoints, and SMS integration

## 🚀 Hono.js Specifics

### Why Hono.js?
- 5x smaller memory footprint than Express
- Fastest cold starts (~120ms)
- TypeScript-first design
- Works on Node.js AND Edge runtimes
- Built-in middleware for common tasks

### Project Structure
```
src/
├── routes/          # API route handlers
│   ├── auth.ts      # Authentication endpoints
│   ├── workers.ts   # Worker CRUD
│   ├── organizations.ts # Org management
│   ├── sms.ts       # SMS sending & logs
│   ├── dashboards.ts # Worker dashboard data
│   └── webhooks.ts  # External system webhooks
├── middleware/      # Reusable middleware
│   ├── auth.ts      # JWT validation
│   ├── cors.ts      # CORS handling
│   └── rateLimit.ts # Rate limiting
├── services/        # Business logic
│   ├── token.service.ts # Token generation
│   ├── sms.service.ts   # MobileMessage integration
│   └── plugin-manager.ts # Plugin orchestration
├── types/           # TypeScript types
└── index.ts         # App entry point
```

## 🔐 Authentication & Security

### JWT Implementation
```typescript
// Use HS256 with environment secret
const token = jwt.sign(
  { 
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role 
  },
  env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

### Middleware Chain
All protected routes follow this pattern:
```typescript
app.use('/protected/*', cors(), authMiddleware, rateLimitMiddleware);
```

### Rate Limiting
- Per organization, not per IP
- SMS endpoints: 10/minute per org
- Auth endpoints: 5/minute per IP
- Dashboard endpoints: 100/minute per org

## 📊 Database Patterns

### Supabase Client
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY
);
```

### Multi-tenancy
Every query MUST include organization_id:
```typescript
// WRONG - exposes all data
const workers = await supabase.from('workers').select('*');

// RIGHT - scoped to organization
const workers = await supabase
  .from('workers')
  .select('*')
  .eq('organization_id', organizationId);
```

### Row Level Security
- RLS policies handle most access control
- Service key bypasses RLS for admin operations
- Always validate organization membership

## 🌐 API Design Principles

### RESTful Conventions
- GET /workers - List workers
- GET /workers/:id - Get specific worker
- POST /workers - Create worker
- PUT /workers/:id - Update worker
- DELETE /workers/:id - Delete worker

### Response Format
```typescript
// Success response
{
  success: true,
  data: T,
  pagination?: {  // For lists
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}

// Error response
{
  success: false,
  error: {
    code: 'WORKER_NOT_FOUND',
    message: 'Worker not found',
    details?: any
  }
}
```

### Validation
- Use Zod schemas for request validation
- Validate all inputs, even from trusted sources
- Return 400 for validation errors
- Never trust client-side validation

## 📱 Worker Dashboard API

### Token-Based Access
Workers don't login - they use tokenized URLs:
```typescript
// Generate dashboard token
const token = await tokenService.create({
  workerId: worker.id,
  organizationId: org.id,
  expiresIn: '1h' | '6h' | '12h' | '24h'
});

// Dashboard URL
const dashboardUrl = `${env.WORKER_URL}/dashboard?token=${token}`;
```

### Data Aggregation
Single endpoint returns all dashboard data:
```typescript
GET /api/dashboard?token=xxx
{
  worker: WorkerInfo,
  schedule: ScheduleItem[],
  tasks: TaskItem[],
  notes: Note[],
  organization: OrganizationInfo
}
```

## 📨 SMS Integration

### MobileMessage.com.au
```typescript
// SMS service configuration
const smsConfig = {
  baseUrl: 'https://api.mobilemessage.com.au/',
  auth: {
    username: env.SMS_USERNAME,
    password: env.SMS_PASSWORD
  }
};

// Send SMS with dashboard link
await smsService.send({
  to: worker.phone,
  message: `Your dashboard: ${dashboardUrl}`,
  organizationId: org.id
});
```

### SMS Logging
All SMS are logged for audit:
```typescript
await supabase.from('sms_logs').insert({
  worker_id: workerId,
  organization_id: orgId,
  phone: to,
  message: message,
  status: 'sent' | 'delivered' | 'failed',
  sent_at: new Date()
});
```

## 🔌 Plugin Architecture

### Plugin Manager
Orchestrates data fetching from multiple sources:
```typescript
const dashboardData = await pluginManager.aggregate({
  workerId,
  organizationId,
  date: today,
  plugins: configuredPlugins
});
```

### Plugin Interface
All plugins implement:
```typescript
interface PluginAdapter {
  name: string;
  fetch(config: PluginConfig, worker: Worker): Promise<PluginData>;
  validate(config: PluginConfig): boolean;
  getSchema(): PluginSchema;
}
```

## 🚨 Error Handling

### Error Types
- **400**: Bad Request (validation)
- **401**: Unauthorized (invalid token)
- **403**: Forbidden (wrong organization)
- **404**: Not Found
- **429**: Too Many Requests
- **500**: Internal Server Error

### Error Logging
```typescript
// Log all errors with context
console.error('API Error', {
  error: error.message,
  stack: error.stack,
  requestId: context.get('requestId'),
  userId: context.get('userId'),
  organizationId: context.get('organizationId')
});
```

## 🔄 Webhook Handling

### Security
- Verify webhook signatures
- Rate limit per source
- Validate payload schema
- Process asynchronously

### Processing
```typescript
// Queue webhook for processing
await queue.push({
  type: 'webhook',
  source: 'google-calendar',
  data: payload,
  organizationId
});
```

## 🧪 Testing Strategy

### Unit Tests
- Test all route handlers
- Mock external services
- Validate error scenarios
- Check RLS policies

### Integration Tests
- Test complete flows
- Use test database
- Verify plugin integration
- Check rate limiting

### Load Testing
- Target: 1000 concurrent orgs
- Test SMS sending limits
- Verify database performance
- Check memory usage

## 🚀 Performance Tips

### Database Optimization
- Use database indexes
- Implement pagination
- Cache frequent queries
- Use connection pooling

### Response Optimization
- Compress responses
- Use HTTP caching headers
- Minimize JSON payload
- Batch related operations

### Scaling Considerations
- Stateless design
- Horizontal scaling ready
- Edge deployment compatible
- Graceful degradation

## 🔧 Common Tasks

### Adding New Route
1. Create route file in `src/routes/`
2. Add middleware as needed
3. Implement handlers with error handling
4. Add validation with Zod
5. Update API documentation

### Creating New Service
1. Add to `src/services/`
2. Export singleton instance
3. Handle errors gracefully
4. Add logging
5. Write tests

## 💡 Pro Tips

1. **Use Context**: Pass request context through all layers
2. **Validate Early**: Fail fast on invalid input
3. **Log Everything**: You'll need it for debugging
4. **Think Multi-tenant**: Never forget organization scoping
5. **Plan for Edge**: Keep functions pure and small

---

**Remember**: This API serves both admin and worker needs. Security and reliability are paramount - every endpoint must be protected and every error handled gracefully.
