# System Architecture - CleanConnect

> Detailed technical architecture of the CleanConnect SaaS platform.
> **Product:** CleanConnect - "98% open. Zero downloads."

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Data Flow](#data-flow)
4. [Components](#components)
5. [Database Schema](#database-schema)
6. [Security](#security)
7. [Scalability](#scalability)

---

## System Overview

**CleanConnect** is a multi-tenant SaaS platform that delivers personalized daily dashboards to workers via SMS. The system follows a modern, edge-optimized architecture with clear separation of concerns.

The platform solves a real business problem: enabling field service workers to access their daily schedules without app downloads or password management. Workers receive an SMS with a secure, tokenized link to their personalized dashboard.

### Key Architectural Principles

1. **Multi-tenant by Design** - Complete data isolation via Row Level Security
2. **Edge-First** - API runs on edge runtime for global performance
3. **Plugin-Based** - Extensible adapter system for data sources
4. **Mobile-Optimized** - Worker dashboards designed for mobile-first experience
5. **Token-Based Access** - Secure, time-limited access without passwords

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         ADMIN PORTAL                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Vite + React App (Port 5173)                            │   │
│  │  - Worker Management                                     │   │
│  │  - Plugin Configuration                                  │   │
│  │  - SMS Link Generation                                   │   │
│  └────────────────┬─────────────────────────────────────────┘   │
│                   │                                              │
│                   │ HTTP/REST                                    │
│                   ▼                                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              HONO.JS API (Port 3000)                     │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ Routes:                                            │  │   │
│  │  │  - /auth (Login, Signup)                          │  │   │
│  │  │  - /workers (CRUD operations)                     │  │   │
│  │  │  - /organizations (Settings)                      │  │   │
│  │  │  - /sms (Send dashboard links)                    │  │   │
│  │  │  - /dashboards/:token (Public access)            │  │   │
│  │  │  - /webhooks/:pluginId                           │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ Services:                                          │  │   │
│  │  │  - TokenService (Generate/validate tokens)        │  │   │
│  │  │  - SMSService (MobileMessage.com.au integration)  │  │   │
│  │  │  - PluginManager (Orchestrate data fetching)      │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────┬───────────────────────────┬───────────────────┘   │
│             │                           │                        │
└─────────────┼───────────────────────────┼────────────────────────┘
              │                           │
              │                           │ SMS with Link
              │                           ▼
              │              ┌──────────────────────────┐
              │              │ MobileMessage.com.au     │
              │              │ SMS Gateway              │
              │              └────────────┬─────────────┘
              │                           │
              │                           │ SMS Delivered
              │                           ▼
              │              ┌──────────────────────────┐
              │              │   Worker's Mobile Phone  │
              │              │   "Your dashboard: ..."  │
              │              └────────────┬─────────────┘
              │                           │
              │                           │ Opens Link
              ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE (Backend)                          │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  PostgreSQL Database                                   │     │
│  │  - Organizations, Admins, Workers                      │     │
│  │  - Dashboards, Widgets, Tokens                         │     │
│  │  - Plugin Configs, Manual Entries                      │     │
│  │  - Row Level Security (RLS) enabled                    │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Supabase Auth                                         │     │
│  │  - Admin authentication (email/password)               │     │
│  │  - JWT token generation                                │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Fetch Data
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PLUGIN ADAPTERS                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Manual     │  │   Google     │  │  Airtable    │          │
│  │   Adapter    │  │   Calendar   │  │   Adapter    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐                                               │
│  │   Notion     │  ... extensible ...                           │
│  │   Adapter    │                                               │
│  └──────────────┘                                               │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Return: ScheduleItem[], TaskItem[]
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     WORKER DASHBOARD                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Vite + React App (Port 5174)                            │   │
│  │  - Route: /dashboard/:token                              │   │
│  │  - Display Today's Schedule                              │   │
│  │  - Display Today's Tasks                                 │   │
│  │  - Mobile-optimized UI                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Admin Creates Dashboard Link

```
1. Admin logs into Admin Portal
2. Admin selects worker and clicks "Send Dashboard Link"
3. Admin App → API: POST /sms/send-dashboard-link { workerId }
4. API validates admin authorization
5. TokenService generates secure token with expiry
6. Token stored in database (worker_tokens table)
7. SMSService formats phone number (+61 format)
8. SMSService calls MobileMessage API
9. SMS sent with link: https://app.com/dashboard/{token}
10. Response returned to Admin
```

### 2. Worker Opens Dashboard

```
1. Worker receives SMS on phone
2. Worker taps link → https://app.com/dashboard/{token}
3. Browser loads Worker App
4. Worker App → API: GET /dashboards/{token}
5. API validates token:
   - Check expiry
   - Check if revoked
   - Mark as used (first time)
6. API fetches worker data
7. API queries active dashboard widgets
8. For each widget:
   - Get plugin adapter from registry
   - Get plugin config from database
   - Call adapter.getTodaySchedule() & getTodayTasks()
9. API aggregates results from all plugins
10. API returns: { worker, schedule[], tasks[] }
11. Worker App renders dashboard
```

### 3. Plugin Data Fetching (Manual Example)

```
1. PluginManager calls ManualAdapter.getTodaySchedule(workerId)
2. ManualAdapter queries database:
   SELECT * FROM manual_schedule_items 
   WHERE worker_id = ? 
   AND start_time >= today 
   AND start_time < tomorrow
3. Results transformed to ScheduleItem[] format
4. Returned to PluginManager
5. Combined with other plugin results
```

### 4. Real-time Updates (Webhook Flow)

```
1. External system (e.g., Airtable) changes data
2. Webhook configured to POST to /webhooks/airtable
3. API receives webhook payload
4. PluginRegistry.get('airtable').handleWebhook(payload)
5. Adapter processes update
6. (Future: notify connected clients via WebSocket/SSE)
```

---

## Components

### Frontend Apps

#### Admin Portal (`apps/admin`)
**Purpose:** Management interface for organization admins

**Tech Stack:**
- Vite + React 18
- TanStack Query (data fetching)
- React Router (navigation)
- Tailwind CSS (styling)
- Zustand (state management)

**Key Features:**
- Worker CRUD operations
- Plugin configuration
- SMS link generation
- Organization settings
- Dashboard preview

**Routes:**
- `/` - Dashboard overview
- `/workers` - Worker management
- `/workers/:id` - Worker details
- `/settings` - Organization settings
- `/plugins` - Plugin configuration

---

#### Worker Dashboard (`apps/worker`)
**Purpose:** Mobile-optimized dashboard for workers

**Tech Stack:**
- Vite + React 18
- TanStack Query (data fetching)
- Tailwind CSS (mobile-first)

**Key Features:**
- Token-based access (no login required)
- Today's schedule display
- Tasks with priority indicators
- Mobile-optimized layout
- Auto-refresh capability

**Routes:**
- `/` - Landing page
- `/dashboard/:token` - Worker dashboard view

---

### Backend API (`apps/api`)

**Purpose:** RESTful API for all backend operations

**Tech Stack:**
- Hono.js (web framework)
- Node.js runtime (can deploy to edge)
- Supabase client (database + auth)

**Architecture:**
```
src/
├── routes/          # HTTP route handlers
│   ├── auth.ts      # Login, signup, logout
│   ├── workers.ts   # Worker CRUD
│   ├── organizations.ts
│   ├── dashboards.ts
│   ├── sms.ts
│   └── webhooks.ts
├── services/        # Business logic
│   ├── token.service.ts
│   ├── sms.service.ts
│   └── plugin-manager.ts
├── middleware/      # Request processing
│   ├── auth.ts      # JWT validation
│   └── rateLimit.ts # DDoS protection
└── index.ts         # App entry point
```

**Key Services:**

**TokenService:**
- Generate secure tokens (crypto.randomBytes)
- Store with expiry in database
- Validate tokens (check expiry, revoked status)
- Generate short dashboard URLs

**SMSService:**
- Australian phone formatting (+61)
- MobileMessage.com.au API integration
- SMS logging (audit trail)
- Rate limiting (prevent abuse)

**PluginManager:**
- Orchestrate data from multiple plugins
- Parallel plugin execution
- Error handling (graceful degradation)
- Result aggregation and sorting

---

### Shared Packages

#### `@dashboard-link/shared`
**Purpose:** Common types and utilities

**Exports:**
- TypeScript types (Worker, Organization, Dashboard, etc.)
- Phone number utilities (AU formatting/validation)
- Date utilities (today range, formatting)

#### `@dashboard-link/plugins`
**Purpose:** Plugin adapter system

**Structure:**
```typescript
BaseAdapter (abstract class)
  ↓ extends
GoogleCalendarAdapter
AirtableAdapter
NotionAdapter
ManualAdapter

PluginRegistry (singleton)
  - register(plugin)
  - get(id)
  - getAll()
```

**Plugin Interface:**
```typescript
interface PluginAdapter {
  id: string;
  name: string;
  description: string;
  version: string;
  
  getTodaySchedule(workerId, config): Promise<ScheduleItem[]>
  getTodayTasks(workerId, config): Promise<TaskItem[]>
  validateConfig(config): Promise<boolean>
  handleWebhook?(payload, config): Promise<void>
}
```

#### `@dashboard-link/ui`
**Purpose:** Shared React components

**Components:**
- Button
- (Future: Form, Input, Card, etc. - shadcn/ui based)

#### `@dashboard-link/database`
**Purpose:** Database schema and migrations

**Contents:**
- SQL migration files
- Seed data for development
- RLS policies
- Database documentation

---

## Database Schema

### Core Tables

**organizations**
```sql
id               UUID PRIMARY KEY
name             TEXT NOT NULL
settings         JSONB (sms_sender_id, default_token_expiry)
created_at       TIMESTAMP
updated_at       TIMESTAMP
```

**admins**
```sql
id               UUID PRIMARY KEY
organization_id  UUID → organizations
auth_user_id     UUID → auth.users (Supabase)
email            TEXT UNIQUE
name             TEXT
created_at       TIMESTAMP
```

**workers**
```sql
id               UUID PRIMARY KEY
organization_id  UUID → organizations
name             TEXT
phone            TEXT (E.164 format)
email            TEXT NULLABLE
active           BOOLEAN
metadata         JSONB
created_at       TIMESTAMP
updated_at       TIMESTAMP

UNIQUE(organization_id, phone)
```

**worker_tokens**
```sql
id               UUID PRIMARY KEY
worker_id        UUID → workers
token            TEXT UNIQUE
expires_at       TIMESTAMP
created_at       TIMESTAMP
used_at          TIMESTAMP NULLABLE
revoked          BOOLEAN

INDEX(token)
INDEX(expires_at)
```

**dashboards**
```sql
id               UUID PRIMARY KEY
organization_id  UUID → organizations
worker_id        UUID → workers
name             TEXT
active           BOOLEAN
created_at       TIMESTAMP
updated_at       TIMESTAMP

UNIQUE(worker_id)  -- One dashboard per worker
```

**dashboard_widgets**
```sql
id               UUID PRIMARY KEY
dashboard_id     UUID → dashboards
plugin_id        TEXT (e.g., 'google-calendar')
config           JSONB
order            INTEGER
active           BOOLEAN
created_at       TIMESTAMP
updated_at       TIMESTAMP
```

### Plugin Data Tables

**manual_schedule_items**
```sql
id               UUID PRIMARY KEY
organization_id  UUID → organizations
worker_id        UUID → workers
title            TEXT
start_time       TIMESTAMP
end_time         TIMESTAMP
location         TEXT NULLABLE
description      TEXT NULLABLE
metadata         JSONB
created_at       TIMESTAMP
updated_at       TIMESTAMP

INDEX(worker_id, start_time)
```

**manual_task_items**
```sql
id               UUID PRIMARY KEY
organization_id  UUID → organizations
worker_id        UUID → workers
title            TEXT
description      TEXT NULLABLE
due_date         TIMESTAMP NULLABLE
priority         ENUM('low', 'medium', 'high')
status           ENUM('pending', 'in_progress', 'completed')
metadata         JSONB
created_at       TIMESTAMP
updated_at       TIMESTAMP

INDEX(worker_id, due_date)
```

### Audit Tables

**sms_logs**
```sql
id                 UUID PRIMARY KEY
organization_id    UUID → organizations
worker_id          UUID → workers NULLABLE
phone              TEXT
message            TEXT
status             TEXT ('sent', 'failed', 'delivered')
provider_response  JSONB
created_at         TIMESTAMP

INDEX(worker_id)
INDEX(created_at)
```

---

## Security

### Multi-Tenancy

**Row Level Security (RLS):**
Every table has RLS enabled with policies ensuring:
- Admins only see data from their organization
- Workers can't access admin functions
- Complete data isolation between organizations

**Helper Function:**
```sql
get_user_organization_id()
  Returns organization_id for current auth.uid()
```

**Example Policy:**
```sql
CREATE POLICY worker_policy ON workers
  FOR ALL
  USING (organization_id = get_user_organization_id());
```

### Authentication

**Admin Auth:**
- Supabase Auth (email/password)
- JWT tokens in Authorization header
- Validated by auth middleware

**Worker Auth:**
- Token-based (no password required)
- Time-limited (1hr-1day configurable)
- Single-use or multi-use (configurable)
- Auto-expiry cleanup (TODO: cron job)

### Rate Limiting

**In-Memory Limiter:**
- 100 requests/min for general API
- 5 requests/min for SMS endpoints
- IP-based tracking
- (Production: Use Redis)

### Data Security

**Sensitive Data:**
- All passwords hashed (Supabase Auth)
- SMS credentials in environment variables
- Plugin API keys in encrypted config (JSONB)
- HTTPS only in production

**Token Generation:**
```typescript
crypto.randomBytes(32).toString('hex')
// 64-character hex string = 256 bits entropy
```

---

## Scalability

### Horizontal Scaling

**API Servers:**
- Stateless design (no session storage)
- Can run multiple instances
- Edge deployment for global latency
- Hono.js compatible with:
  - Node.js clusters
  - Cloudflare Workers
  - Vercel Edge Functions

**Database:**
- Supabase auto-scales read replicas
- Connection pooling built-in
- Can upgrade to dedicated instance

### Performance Optimizations

**Caching:**
- TanStack Query caches API responses (client-side)
- Supabase PostgREST has built-in caching
- (Future: Redis for plugin data caching)

**Database Indexes:**
- All foreign keys indexed
- worker_tokens.token (for fast lookups)
- manual_schedule_items(worker_id, start_time)
- manual_task_items(worker_id, due_date)

**Query Optimization:**
- Single query for dashboard data (JOIN widgets)
- Parallel plugin execution (Promise.allSettled)
- Pagination for large lists

### Load Estimates

**For 1000 workers:**
- SMS: 1000/day = ~$30/month
- API requests: ~10,000/day (manageable on free tier)
- Database: <1GB storage (Supabase free tier)
- Bandwidth: Minimal (JSON responses)

**Growth Path:**
- 0-5K workers: Free/Hobby tiers
- 5K-50K workers: Supabase Pro ($25/mo)
- 50K+ workers: Dedicated instances, CDN

---

## Future Enhancements

### Planned Features

1. **Real-time Updates**
   - WebSocket connection for live updates
   - Server-Sent Events for dashboard refresh
   - Webhook → notify connected clients

2. **Advanced Plugins**
   - Microsoft Outlook Calendar
   - Salesforce integration
   - Custom API connector (generic REST/GraphQL)

3. **Analytics**
   - Dashboard view tracking
   - SMS delivery rates
   - Worker engagement metrics

4. **Mobile Apps**
   - Native iOS/Android apps
   - Push notifications instead of SMS
   - Offline-first with sync

5. **White-labeling**
   - Custom branding per organization
   - Custom domains
   - Email delivery option

---

## Monitoring & Observability

### Planned Instrumentation

**Logging:**
- Structured logging (JSON)
- Log levels (debug, info, warn, error)
- Request tracing (correlation IDs)

**Metrics:**
- API response times
- SMS delivery success rate
- Plugin fetch duration
- Token validation rate

**Alerting:**
- SMS failures > threshold
- API errors > threshold
- Database connection issues

**Tools:**
- Vercel Analytics (built-in)
- Supabase Dashboard (metrics included)
- (Future: Sentry for error tracking)

---

**Architecture Version:** 1.0  
**Last Updated:** December 2025  
**Next Review:** March 2026
