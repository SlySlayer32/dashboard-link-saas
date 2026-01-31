# Research & Architecture Decisions: SMS Dashboard MVP

**Feature**: CleanConnect SMS Dashboard MVP  
**Branch**: `001-sms-dashboard-mvp`  
**Date**: 2026-01-21

## Executive Summary

This document consolidates architectural research and design decisions for the CleanConnect MVP. All decisions align with the project constitution and prioritize simplicity, security, and mobile-first worker experience.

## 1. High-Level System Architecture

### 1.1 Architecture Pattern: Multi-Tenant SaaS with Plugin System

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Admin Dashboard          Worker Dashboard         SMS Gateway   │
│  (React/Vite)            (React/Vite Mobile)    (MobileMessage)  │
│  Desktop Browser          Mobile Browser           SMS Delivery  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                    Hono.js API (Serverless)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Middleware: Auth │ Tenant │ Rate Limit │ Error Handler  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Routes: /auth, /workers, /integrations, /sms, /dashboard, /logs│
└─────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ↓             ↓             ↓
┌──────────────────────┐  ┌──────────────┐  ┌──────────────────┐
│  SERVICE LAYER       │  │ PLUGIN ENGINE│  │  EXTERNAL APIs   │
├──────────────────────┤  ├──────────────┤  ├──────────────────┤
│ • Auth Service       │  │ Adapter      │  │ • Google Calendar│
│ • Worker Service     │  │ Registry     │  │ • MobileMessage  │
│ • SMS Service        │  │              │  │   (SMS Provider) │
│ • Token Service      │  │ Google Cal   │  │                  │
│ • Calendar Service   │  │ Adapter      │  │                  │
└──────────────────────┘  └──────────────┘  └──────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│              Supabase PostgreSQL (with RLS)                      │
│  Tables: organizations, users, workers, data_sources,            │
│          dashboard_tokens, sms_logs, access_logs                 │
│                                                                   │
│  Security: Row Level Security (RLS) on all tenant-scoped tables  │
│  Auth: Supabase Auth (JWT tokens)                                │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow: Admin Sends Dashboard Link

```
1. Admin clicks "Send Dashboard" for Worker
   ↓
2. Admin Dashboard → POST /api/v1/sms/send
   Payload: { workerId, message, expiryHours }
   ↓
3. API validates admin JWT + tenant isolation
   ↓
4. Token Service generates dashboard token
   - Creates JWT with { workerId, orgId, exp }
   - Stores token hash in dashboard_tokens table
   ↓
5. SMS Service constructs message
   - Message: "{custom_message} {dashboard_url}?token={jwt}"
   - URL: https://worker.cleanconnect.com/dashboard?token=eyJ...
   ↓
6. SMS Service calls MobileMessage.au API
   - POST https://api.mobilemessage.com.au/send
   - Basic Auth with API credentials
   ↓
7. SMS Log created with delivery status
   ↓
8. Response returned to Admin Dashboard
```

### 1.3 Data Flow: Worker Views Dashboard

```
1. Worker taps SMS link on mobile phone
   ↓
2. Browser opens: https://worker.cleanconnect.com/dashboard?token=eyJ...
   ↓
3. Worker Dashboard app extracts token from URL
   ↓
4. Worker Dashboard → GET /api/v1/dashboard?token={jwt}
   ↓
5. API validates token:
   - Verify JWT signature
   - Check expiry (1-24 hours)
   - Verify token exists in dashboard_tokens (not revoked)
   - Extract workerId and orgId from JWT
   ↓
6. Dashboard Service fetches worker data:
   - Get worker details from workers table
   - Get organization's data sources
   ↓
7. Plugin Engine fetches schedule data:
   - Google Calendar Adapter called
   - Adapter uses stored OAuth tokens
   - Fetches today's events for worker
   - Maps events to ScheduleItem format
   ↓
8. Access Log created (workerId, timestamp, token)
   ↓
9. Response: { worker, scheduleItems[] }
   ↓
10. Worker Dashboard renders mobile-optimized view
```

## 2. Multi-Tenant Isolation Strategy

### 2.1 Three-Layer Defense

**Layer 1: Application-Level Isolation**
- JWT contains `orgId` claim
- Tenant middleware extracts `orgId` from JWT on every request
- All service methods require `orgId` parameter
- Queries always include `WHERE organization_id = {orgId}`

**Layer 2: Database Row-Level Security (RLS)**
- PostgreSQL RLS policies on all tenant-scoped tables
- Policy: `organization_id = current_setting('app.tenant_id')::uuid`
- API sets `app.tenant_id` context variable before queries
- Even if application code fails, RLS prevents cross-tenant access

**Layer 3: Token Scoping**
- Dashboard tokens include `orgId` in JWT payload
- Token validation checks `orgId` matches worker's organization
- Prevents token reuse across organizations

### 2.2 RLS Policy Example

```sql
-- Enable RLS on workers table
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see workers in their organization
CREATE POLICY tenant_isolation ON workers
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id')::uuid);

-- Set tenant context before queries (in API middleware)
SET app.tenant_id = '{orgId from JWT}';
```

### 2.3 Tenant Context Flow

```typescript
// Middleware sets tenant context
async function tenantMiddleware(c: Context, next: Next) {
  const jwt = await verifyJWT(c.req.header('Authorization'));
  const orgId = jwt.payload.orgId;
  
  // Set PostgreSQL session variable
  await db.query('SET app.tenant_id = $1', [orgId]);
  
  // Store in context for application use
  c.set('orgId', orgId);
  
  await next();
}

// Service methods always use orgId
async function getWorkers(orgId: string) {
  // RLS automatically filters by orgId
  return db.query('SELECT * FROM workers');
}
```

## 3. Dashboard Token Security

### 3.1 Token Generation Strategy

**Decision**: Use JWT with database-backed revocation list

**Rationale**:
- JWTs are stateless and fast to validate (no DB lookup on every request)
- Database storage enables revocation (worker deletion, security incidents)
- Expiry enforced at both JWT level (exp claim) and database level (expires_at)

**Token Structure**:
```json
{
  "sub": "worker-uuid",
  "orgId": "org-uuid",
  "type": "dashboard",
  "exp": 1737504000,
  "iat": 1737417600
}
```

**Database Record**:
```sql
CREATE TABLE dashboard_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,  -- SHA-256 hash of JWT
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);
```

### 3.2 Token Validation Flow

```typescript
async function validateDashboardToken(token: string): Promise<TokenPayload> {
  // Step 1: Verify JWT signature and expiry
  const payload = await verifyJWT(token, JWT_SECRET);
  
  if (payload.exp < Date.now() / 1000) {
    throw new TokenExpiredError('Dashboard link has expired');
  }
  
  // Step 2: Check database for revocation
  const tokenHash = sha256(token);
  const dbToken = await db.query(
    'SELECT * FROM dashboard_tokens WHERE token_hash = $1',
    [tokenHash]
  );
  
  if (!dbToken) {
    throw new TokenInvalidError('Invalid dashboard link');
  }
  
  if (dbToken.revoked_at) {
    throw new TokenRevokedError('Dashboard link has been revoked');
  }
  
  if (dbToken.expires_at < new Date()) {
    throw new TokenExpiredError('Dashboard link has expired');
  }
  
  // Step 3: Verify worker still exists and belongs to org
  const worker = await db.query(
    'SELECT * FROM workers WHERE id = $1 AND organization_id = $2',
    [payload.sub, payload.orgId]
  );
  
  if (!worker) {
    throw new TokenInvalidError('Worker not found');
  }
  
  return { workerId: payload.sub, orgId: payload.orgId };
}
```

### 3.3 Token Expiry & Revocation

**Configurable Expiry**:
- Admin selects expiry when sending SMS: 1hr, 4hr, 8hr, 12hr, 24hr
- Default: 8 hours (covers typical work shift)
- JWT `exp` claim and `dashboard_tokens.expires_at` both set

**Automatic Revocation Triggers**:
- Worker deleted → CASCADE DELETE on `dashboard_tokens`
- Organization deleted → CASCADE DELETE on `dashboard_tokens`
- Manual revocation → SET `revoked_at = NOW()`

**Cleanup Strategy**:
- Daily cron job deletes expired tokens (>24 hours old)
- Prevents database bloat

## 4. SMS Integration Architecture

### 4.1 MobileMessage.au Integration

**API Endpoint**: `https://api.mobilemessage.com.au/send`  
**Authentication**: Basic Auth (username + API key)  
**Rate Limits**: 100 SMS/org/hour (enforced at application level)

**Request Format**:
```typescript
interface SMSRequest {
  to: string;        // E.164 format: +61412345678
  message: string;   // Max 160 chars (single SMS)
  from?: string;     // Optional sender ID
}

// Example
POST https://api.mobilemessage.com.au/send
Authorization: Basic base64(username:apikey)
Content-Type: application/json

{
  "to": "+61412345678",
  "message": "Hi John, here's your schedule for today: https://worker.cleanconnect.com/dashboard?token=eyJ...",
  "from": "CleanCo"
}
```

**Response Format**:
```json
{
  "status": "sent",
  "messageId": "msg_abc123",
  "cost": 0.03,
  "parts": 1
}
```

### 4.2 SMS Logging Strategy

**Log Every Send Attempt**:
```sql
CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,  -- E.164 format
  message_content TEXT NOT NULL,
  token_id UUID REFERENCES dashboard_tokens(id) ON DELETE SET NULL,
  
  -- Delivery tracking
  status TEXT NOT NULL,  -- 'sent', 'delivered', 'failed'
  provider_message_id TEXT,
  error_reason TEXT,
  
  -- Metadata
  sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sms_logs_org_sent_at ON sms_logs(organization_id, sent_at DESC);
CREATE INDEX idx_sms_logs_worker ON sms_logs(worker_id);
```

**Status Lifecycle**:
1. `sent` - SMS sent to provider, awaiting delivery confirmation
2. `delivered` - Provider confirmed delivery (if webhook available)
3. `failed` - Delivery failed (invalid number, carrier rejection, etc.)

### 4.3 Rate Limiting Strategy

**Per-Organization Limits**:
- 100 SMS per hour (configurable per plan)
- Sliding window algorithm
- Redis-backed counter (future) or in-memory for MVP

**Implementation**:
```typescript
async function checkSMSRateLimit(orgId: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const count = await db.query(
    'SELECT COUNT(*) FROM sms_logs WHERE organization_id = $1 AND sent_at > $2',
    [orgId, oneHourAgo]
  );
  
  const limit = 100; // TODO: Get from organization.sms_limit
  
  if (count >= limit) {
    throw new RateLimitError(`SMS limit exceeded: ${count}/${limit} per hour`);
  }
  
  return true;
}
```

## 5. Google Calendar Plugin Architecture

### 5.1 Plugin Adapter Pattern

**Base Interface**:
```typescript
interface IAdapter {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  
  // Lifecycle
  initialize(config: AdapterConfig): Promise<void>;
  healthCheck(): Promise<HealthStatus>;
  
  // Configuration
  validateConfig(config: unknown): config is AdapterConfig;
  getConfigSchema(): JSONSchema;
}

interface IScheduleProvider extends IAdapter {
  // Data fetching
  getSchedule(req: ScheduleRequest): Promise<ScheduleItem[]>;
  
  // OAuth (if applicable)
  getAuthUrl?(scopes: string[]): string;
  exchangeToken?(code: string): Promise<TokenSet>;
  refreshToken?(refreshToken: string): Promise<TokenSet>;
}
```

**Google Calendar Adapter**:
```typescript
class GoogleCalendarAdapter implements IScheduleProvider {
  readonly id = 'google-calendar';
  readonly name = 'Google Calendar';
  readonly version = '1.0.0';
  
  async getSchedule(req: ScheduleRequest): Promise<ScheduleItem[]> {
    // 1. Get OAuth tokens from database
    const connection = await this.getConnection(req.orgId);
    
    // 2. Refresh tokens if expired
    if (this.isTokenExpired(connection.accessToken)) {
      connection.accessToken = await this.refreshToken(connection.refreshToken);
    }
    
    // 3. Fetch events from Google Calendar API
    const events = await this.fetchEvents(
      connection.accessToken,
      req.workerId,
      req.date
    );
    
    // 4. Map to standard ScheduleItem format
    return events.map(this.mapEventToScheduleItem);
  }
  
  async getAuthUrl(scopes: string[]): string {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    });
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }
  
  async exchangeToken(code: string): Promise<TokenSet> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });
    
    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000)
    };
  }
}
```

### 5.2 OAuth Flow

```
1. Admin clicks "Connect Google Calendar"
   ↓
2. Admin Dashboard → GET /api/v1/integrations/google-calendar/auth-url
   ↓
3. API returns Google OAuth URL with scopes
   ↓
4. Admin redirected to Google consent screen
   ↓
5. Admin grants permissions
   ↓
6. Google redirects to: {REDIRECT_URI}?code=abc123
   ↓
7. Admin Dashboard → POST /api/v1/integrations/google-calendar/callback
   Payload: { code: 'abc123' }
   ↓
8. API exchanges code for tokens
   ↓
9. Tokens encrypted and stored in data_sources table
   ↓
10. Connection status set to "active"
```

### 5.3 Data Source Storage

```sql
CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Plugin identification
  plugin_id TEXT NOT NULL,  -- 'google-calendar', 'airtable', etc.
  plugin_version TEXT NOT NULL,
  
  -- Configuration
  config JSONB NOT NULL,  -- Plugin-specific config
  
  -- OAuth tokens (encrypted at rest)
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active',  -- 'active', 'error', 'disconnected'
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_sources_org ON data_sources(organization_id);
CREATE INDEX idx_data_sources_plugin ON data_sources(plugin_id);
```

**Token Encryption**:
- Use Supabase Vault or application-level encryption (AES-256-GCM)
- Encryption key stored in environment variable
- Never log decrypted tokens

## 6. API Route Design

### 6.1 REST API Structure

**Base URL**: `https://api.cleanconnect.com/api/v1`

**Authentication Routes**:
- `POST /auth/register` - Admin signup
- `POST /auth/login` - Admin login
- `POST /auth/logout` - Admin logout
- `GET /auth/me` - Get current admin user

**Worker Management Routes**:
- `GET /workers` - List workers (paginated)
- `POST /workers` - Create worker
- `GET /workers/:id` - Get worker details
- `PATCH /workers/:id` - Update worker
- `DELETE /workers/:id` - Delete worker

**Integration Routes**:
- `GET /integrations` - List all data source connections
- `GET /integrations/google-calendar/auth-url` - Get OAuth URL
- `POST /integrations/google-calendar/callback` - OAuth callback
- `DELETE /integrations/:id` - Disconnect data source
- `POST /integrations/:id/sync` - Trigger manual sync

**SMS Routes**:
- `POST /sms/send` - Send dashboard link to worker(s)
- `POST /sms/send-bulk` - Send to multiple workers
- `GET /sms/logs` - Get SMS delivery logs (paginated)

**Dashboard Routes** (no auth required, token-based):
- `GET /dashboard` - Get dashboard data for token
  - Query param: `token={jwt}`
  - Returns: worker info + schedule items

**Logging Routes**:
- `GET /logs/sms` - SMS delivery logs
- `GET /logs/access` - Dashboard access logs

### 6.2 Standard Response Format

**Success Response**:
```typescript
interface APIResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      hasMore: boolean;
    };
    requestId: string;
  };
}

// Example
{
  "data": [
    { "id": "uuid", "name": "John Doe", "phone": "+61412345678" }
  ],
  "meta": {
    "pagination": { "page": 1, "pageSize": 20, "total": 45, "hasMore": true },
    "requestId": "req_abc123"
  }
}
```

**Error Response**:
```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId: string;
  };
}

// Example
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid phone number format",
    "details": { "field": "phone", "expected": "+61XXXXXXXXX" },
    "requestId": "req_abc123"
  }
}
```

**Error Codes**:
- `UNAUTHORIZED` - Invalid or missing JWT
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `EXTERNAL_API_ERROR` - Third-party API failure
- `TOKEN_EXPIRED` - Dashboard token expired
- `TOKEN_INVALID` - Dashboard token invalid/revoked

## 7. Frontend Architecture

### 7.1 Admin Dashboard (Desktop)

**Tech Stack**:
- Vite + React 18 + TypeScript
- shadcn/ui + Tailwind CSS
- Zustand (state management)
- TanStack Query (data fetching)
- React Router (routing)

**Pages**:
1. `/login` - Admin login
2. `/register` - Admin signup
3. `/dashboard` - Overview (stats, recent activity)
4. `/workers` - Worker list + CRUD
5. `/workers/:id` - Worker details + send SMS
6. `/integrations` - Data source connections
7. `/sms-logs` - SMS delivery logs
8. `/access-logs` - Dashboard access logs
9. `/settings` - Organization settings

**State Management**:
```typescript
// Zustand store
interface AuthStore {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

interface WorkerStore {
  workers: Worker[];
  selectedWorker: Worker | null;
  fetchWorkers: () => Promise<void>;
  createWorker: (data: CreateWorkerDTO) => Promise<void>;
  updateWorker: (id: string, data: UpdateWorkerDTO) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
}
```

**Data Fetching with TanStack Query**:
```typescript
// Custom hook
function useWorkers() {
  return useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const response = await apiClient.get('/workers');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation
function useCreateWorker() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateWorkerDTO) => apiClient.post('/workers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}
```

### 7.2 Worker Dashboard (Mobile)

**Tech Stack**:
- Vite + React 18 + TypeScript
- shadcn/ui + Tailwind CSS (mobile-optimized)
- No state management needed (single page, token-based)

**Single Page App**:
- Route: `/dashboard?token={jwt}`
- No navigation, no login
- Displays schedule for today
- Auto-refreshes data on pull-to-refresh

**Mobile Optimizations**:
- Touch targets ≥44px
- Font sizes ≥16px (prevent zoom)
- No horizontal scrolling
- Offline-friendly (show cached data if available)
- Fast initial load (<2s on 3G)

**Component Structure**:
```typescript
// Main dashboard component
function DashboardPage() {
  const token = useTokenFromURL();
  const { data, isLoading, error } = useDashboardData(token);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <WorkerHeader worker={data.worker} />
      <ScheduleList items={data.scheduleItems} />
    </div>
  );
}

// Schedule item card (mobile-optimized)
function ScheduleItemCard({ item }: { item: ScheduleItem }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-3 min-h-[88px]">
      <div className="flex items-start gap-3">
        <div className="text-sm font-medium text-gray-500 min-w-[60px]">
          {formatTime(item.startTime)}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900">
            {item.title}
          </h3>
          {item.location && (
            <p className="text-sm text-gray-600 mt-1">
              📍 {item.location}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

## 8. Database Schema Design

### 8.1 Core Tables

**organizations**:
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  
  -- Settings
  sms_limit_per_hour INTEGER DEFAULT 100,
  default_token_expiry_hours INTEGER DEFAULT 8,
  
  -- Subscription (future)
  plan TEXT DEFAULT 'free',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
```

**users** (admin users):
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Auth (managed by Supabase Auth)
  email TEXT UNIQUE NOT NULL,
  
  -- Profile
  full_name TEXT,
  role TEXT DEFAULT 'admin',  -- 'admin', 'owner'
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
```

**workers**:
```sql
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Identity
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,  -- E.164 format: +61412345678
  
  -- Calendar mapping (future: support multiple calendars)
  calendar_email TEXT,  -- Email for Google Calendar lookup
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workers_org ON workers(organization_id);
CREATE INDEX idx_workers_phone ON workers(phone_number);

-- RLS Policy
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON workers
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id')::uuid);
```

**data_sources** (see section 5.3):
```sql
-- Already defined in section 5.3
```

**dashboard_tokens** (see section 3.1):
```sql
-- Already defined in section 3.1
```

**sms_logs** (see section 4.2):
```sql
-- Already defined in section 4.2
```

**access_logs**:
```sql
CREATE TABLE access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  token_id UUID REFERENCES dashboard_tokens(id) ON DELETE SET NULL,
  
  -- Access details
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  
  -- Validation result
  validation_status TEXT NOT NULL,  -- 'success', 'expired', 'invalid'
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_logs_org_time ON access_logs(organization_id, accessed_at DESC);
CREATE INDEX idx_access_logs_worker ON access_logs(worker_id);
```

### 8.2 Indexes Strategy

**Query Patterns**:
1. List workers by organization (frequent)
2. Get SMS logs by organization + date range (frequent)
3. Get access logs by worker (moderate)
4. Validate dashboard token by hash (very frequent)
5. Check SMS rate limit (frequent)

**Indexes**:
```sql
-- Workers
CREATE INDEX idx_workers_org ON workers(organization_id);
CREATE INDEX idx_workers_phone ON workers(phone_number);

-- SMS Logs
CREATE INDEX idx_sms_logs_org_sent_at ON sms_logs(organization_id, sent_at DESC);
CREATE INDEX idx_sms_logs_worker ON sms_logs(worker_id);

-- Access Logs
CREATE INDEX idx_access_logs_org_time ON access_logs(organization_id, accessed_at DESC);
CREATE INDEX idx_access_logs_worker ON access_logs(worker_id);

-- Dashboard Tokens
CREATE UNIQUE INDEX idx_dashboard_tokens_hash ON dashboard_tokens(token_hash);
CREATE INDEX idx_dashboard_tokens_worker ON dashboard_tokens(worker_id);
CREATE INDEX idx_dashboard_tokens_expires ON dashboard_tokens(expires_at);

-- Data Sources
CREATE INDEX idx_data_sources_org ON data_sources(organization_id);
CREATE INDEX idx_data_sources_plugin ON data_sources(plugin_id);
```

## 9. Security Considerations

### 9.1 Secrets Management

**Environment Variables** (never in source code):
```bash
# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# JWT
JWT_SECRET=xxx  # For dashboard tokens

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=https://api.cleanconnect.com/api/v1/integrations/google-calendar/callback

# SMS Provider
MOBILEMESSAGE_USERNAME=xxx
MOBILEMESSAGE_API_KEY=xxx

# Encryption
ENCRYPTION_KEY=xxx  # For OAuth token encryption (AES-256)
```

### 9.2 Input Validation

**Phone Number Validation**:
```typescript
import { parsePhoneNumber } from 'libphonenumber-js';

function validatePhoneNumber(phone: string): string {
  try {
    const parsed = parsePhoneNumber(phone, 'AU');
    
    if (!parsed.isValid()) {
      throw new ValidationError('Invalid phone number');
    }
    
    return parsed.format('E.164');  // Returns +61412345678
  } catch (error) {
    throw new ValidationError('Invalid phone number format');
  }
}
```

**Zod Schemas**:
```typescript
import { z } from 'zod';

const CreateWorkerSchema = z.object({
  fullName: z.string().min(1).max(100),
  phoneNumber: z.string().regex(/^\+61[0-9]{9}$/),
  calendarEmail: z.string().email().optional(),
});

const SendSMSSchema = z.object({
  workerId: z.string().uuid(),
  message: z.string().min(1).max(160),
  expiryHours: z.number().int().min(1).max(24).default(8),
});
```

### 9.3 Rate Limiting

**API Rate Limits**:
- 100 requests/minute per IP (global)
- 1000 requests/hour per organization (authenticated)
- 100 SMS/hour per organization

**Implementation** (Hono middleware):
```typescript
import { rateLimiter } from 'hono-rate-limiter';

// Global rate limit
app.use('*', rateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || 'unknown',
}));

// SMS-specific rate limit (in SMS service)
async function checkSMSRateLimit(orgId: string) {
  const count = await getSMSCountLastHour(orgId);
  const limit = await getOrgSMSLimit(orgId);
  
  if (count >= limit) {
    throw new RateLimitError(`SMS limit exceeded: ${count}/${limit} per hour`);
  }
}
```

## 10. Testing Strategy

### 10.1 Test Coverage Targets

- **API Routes**: 90%+ coverage
- **React Components**: 85%+ coverage
- **Utility Functions**: 95%+ coverage
- **Services**: 90%+ coverage

### 10.2 Test Types

**Unit Tests** (Vitest):
```typescript
// Service unit test
describe('TokenService', () => {
  it('should generate valid dashboard token', async () => {
    const token = await tokenService.generateDashboardToken({
      workerId: 'worker-123',
      orgId: 'org-456',
      expiryHours: 8,
    });
    
    expect(token).toBeDefined();
    
    const payload = await tokenService.validateToken(token);
    expect(payload.workerId).toBe('worker-123');
    expect(payload.orgId).toBe('org-456');
  });
  
  it('should reject expired token', async () => {
    const token = await tokenService.generateDashboardToken({
      workerId: 'worker-123',
      orgId: 'org-456',
      expiryHours: -1,  // Already expired
    });
    
    await expect(tokenService.validateToken(token))
      .rejects.toThrow(TokenExpiredError);
  });
});
```

**Integration Tests** (Vitest + Supabase Test DB):
```typescript
// API route integration test
describe('POST /api/v1/workers', () => {
  it('should create worker with valid data', async () => {
    const response = await apiClient.post('/workers', {
      fullName: 'John Doe',
      phoneNumber: '+61412345678',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    
    expect(response.status).toBe(201);
    expect(response.data.data.fullName).toBe('John Doe');
    
    // Verify in database
    const worker = await db.query('SELECT * FROM workers WHERE id = $1', [
      response.data.data.id
    ]);
    expect(worker).toBeDefined();
  });
  
  it('should enforce tenant isolation', async () => {
    // Create worker in org A
    const workerA = await createWorker(orgAToken, { fullName: 'Worker A' });
    
    // Try to access from org B
    const response = await apiClient.get(`/workers/${workerA.id}`, {
      headers: { Authorization: `Bearer ${orgBToken}` },
    });
    
    expect(response.status).toBe(404);  // RLS prevents access
  });
});
```

**Contract Tests** (OpenAPI validation):
```typescript
import { validateAgainstSchema } from 'openapi-validator';

describe('API Contract Tests', () => {
  it('should match OpenAPI schema for GET /workers', async () => {
    const response = await apiClient.get('/workers');
    
    const validation = validateAgainstSchema(
      openAPISpec,
      '/workers',
      'get',
      response
    );
    
    expect(validation.valid).toBe(true);
  });
});
```

**E2E Tests** (Playwright):
```typescript
// Worker dashboard E2E test
test('worker can view dashboard via SMS link', async ({ page }) => {
  // Setup: Admin sends SMS
  const token = await sendDashboardSMS(workerId);
  
  // Worker opens link on mobile
  await page.goto(`/dashboard?token=${token}`);
  
  // Verify dashboard loads
  await expect(page.locator('h1')).toContainText('Today\'s Schedule');
  
  // Verify schedule items
  const items = page.locator('[data-testid="schedule-item"]');
  await expect(items).toHaveCount(3);
  
  // Verify mobile-optimized
  const viewport = page.viewportSize();
  expect(viewport.width).toBe(375);  // iPhone viewport
  
  // No horizontal scroll
  const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(viewport.width);
});
```

## 11. Deployment Strategy

### 11.1 Environment Setup

**Development**:
- Local Supabase instance (Docker)
- Local Vite dev servers (admin, worker)
- Local Hono API (Vite dev server)
- MobileMessage.au sandbox mode

**Staging**:
- Supabase staging project
- Vercel preview deployments (admin, worker)
- Vercel serverless functions (API)
- MobileMessage.au sandbox mode

**Production**:
- Supabase production project
- Vercel production deployments
- MobileMessage.au production mode

### 11.2 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run linter
        run: pnpm lint
      
      - name: Run type check
        run: pnpm type-check
      
      - name: Run unit tests
        run: pnpm test:unit
      
      - name: Run integration tests
        run: pnpm test:integration
      
      - name: Check test coverage
        run: pnpm test:coverage
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        run: vercel deploy --prod
```

## 12. Trade-offs & Assumptions

### 12.1 Key Trade-offs

**1. JWT + Database Hybrid for Tokens**
- **Pro**: Fast validation (no DB lookup), revocable (DB check)
- **Con**: Requires two-step validation (JWT + DB)
- **Alternative Rejected**: Pure JWT (no revocation) or pure DB (slow)

**2. Synchronous SMS Sending (MVP)**
- **Pro**: Simple implementation, immediate feedback
- **Con**: Blocks API request, no retry on failure
- **Alternative (Post-MVP)**: Queue-based async processing

**3. Single Calendar per Organization**
- **Pro**: Simplifies MVP, easier OAuth flow
- **Con**: Can't support per-worker calendars initially
- **Alternative (Post-MVP)**: Multiple data sources per org

**4. No Webhook Support (MVP)**
- **Pro**: Reduces complexity, no webhook security needed
- **Con**: No real-time updates, must refresh dashboard
- **Alternative (Post-MVP)**: Webhook receivers for PUSH updates

**5. In-Memory Rate Limiting (MVP)**
- **Pro**: No Redis dependency, simple to implement
- **Con**: Doesn't work across multiple API instances
- **Alternative (Post-MVP)**: Redis-backed distributed rate limiting

### 12.2 Key Assumptions

1. **Australian Market**: Phone numbers in E.164 format (+61), MobileMessage.au coverage
2. **Google Calendar Primary**: Most organizations use Google Workspace
3. **Mobile Workers**: Workers have smartphones with modern browsers (iOS 14+, Android 10+)
4. **Single Admin per Org (MVP)**: No role-based access control initially
5. **English Language**: No i18n/l10n in MVP
6. **SMS Delivery**: 95%+ delivery rate assumed (MobileMessage.au SLA)
7. **Token Expiry**: 8-hour default covers typical work shift
8. **No Offline Mode**: Workers need internet to view dashboard (cached data future)

## 13. Performance Optimization

### 13.1 Database Optimizations

**Connection Pooling**:
```typescript
// Supabase client with connection pooling
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: {
    pool: {
      min: 2,
      max: 10,
    },
  },
});
```

**Query Optimization**:
- All foreign keys indexed
- Composite indexes for common queries (org_id + timestamp)
- EXPLAIN ANALYZE for all queries >100ms
- Pagination for all list endpoints (limit 20-100)

**Caching Strategy** (Post-MVP):
- Redis cache for frequently accessed data (organizations, workers)
- TTL: 5 minutes for worker lists, 1 hour for organization settings
- Invalidate on write operations

### 13.2 Frontend Optimizations

**Code Splitting**:
```typescript
// Lazy load pages
const WorkersPage = lazy(() => import('./pages/WorkersPage'));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage'));

// Route-based code splitting
<Routes>
  <Route path="/workers" element={<Suspense fallback={<Loading />}><WorkersPage /></Suspense>} />
</Routes>
```

**Bundle Size**:
- Tree-shaking enabled (Vite default)
- Dynamic imports for heavy libraries
- Target: Admin <500KB, Worker <300KB (gzipped)

**Image Optimization**:
- No images in MVP (icon fonts only)
- Future: WebP format, lazy loading, CDN delivery

### 13.3 API Optimizations

**Response Compression**:
```typescript
import { compress } from 'hono/compress';

app.use('*', compress());
```

**Pagination**:
```typescript
interface PaginationParams {
  page?: number;
  pageSize?: number;  // Default 20, max 100
}

async function getWorkers(orgId: string, params: PaginationParams) {
  const page = params.page || 1;
  const pageSize = Math.min(params.pageSize || 20, 100);
  const offset = (page - 1) * pageSize;
  
  const [workers, total] = await Promise.all([
    db.query('SELECT * FROM workers WHERE organization_id = $1 LIMIT $2 OFFSET $3', [
      orgId, pageSize, offset
    ]),
    db.query('SELECT COUNT(*) FROM workers WHERE organization_id = $1', [orgId]),
  ]);
  
  return {
    data: workers,
    meta: {
      pagination: {
        page,
        pageSize,
        total: total.count,
        hasMore: offset + pageSize < total.count,
      },
    },
  };
}
```

## 14. Monitoring & Observability (MVP Baseline)

### 14.1 Structured Logging

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// Log with context
logger.info({
  requestId: 'req_abc123',
  orgId: 'org-456',
  userId: 'user-789',
  action: 'send_sms',
  workerId: 'worker-123',
  duration: 234,
}, 'SMS sent successfully');
```

### 14.2 Error Tracking

**Sentry Integration** (Post-MVP):
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Capture errors
app.onError((err, c) => {
  Sentry.captureException(err, {
    tags: {
      orgId: c.get('orgId'),
      requestId: c.get('requestId'),
    },
  });
  
  return c.json({ error: 'Internal server error' }, 500);
});
```

### 14.3 Metrics (Post-MVP)

**Key Metrics**:
- API request count by endpoint
- API response time (p50, p95, p99)
- SMS delivery success rate
- Dashboard token validation time
- Database query duration
- Error rate by type

## 15. Next Steps (Phase 1)

1. **Generate data-model.md**: Detailed entity definitions with relationships
2. **Generate API contracts**: OpenAPI 3.0 specification in `/contracts/`
3. **Generate quickstart.md**: Developer setup guide
4. **Update agent context**: Add technology stack to agent files

---

**Document Status**: ✅ Complete  
**Next Phase**: Phase 1 - Data Model & Contracts
