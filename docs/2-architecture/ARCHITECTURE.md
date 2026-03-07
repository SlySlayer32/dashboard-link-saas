# System Architecture

## Overview
High-level description of how the system works — multi-tenant SaaS with SMS-delivered dashboard links, plugin-based data aggregation, and token-based authentication for workers.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐      │
│  │  Admin Dashboard │    │ Worker Dashboard │    │   SMS Provider   │      │
│  │   (React/Vite)   │    │   (React/Vite)   │    │ MobileMessage.au │      │
│  │   Desktop-first  │    │   Mobile-first   │    │  (sends links)   │      │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘      │
│           │                       │                       │                  │
│           │ JWT Auth              │ Token Auth            │ API calls        │
│           ▼                       ▼                       ▼                  │
└───────────────────────────────────────────────────────────────────────────────┘
            │                       │                       │
            └───────────────────────┼───────────────────────┘
                                    │
┌───────────────────────────────────▼───────────────────────────────────────────┐
│                          API GATEWAY LAYER                                    │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Hono.js API Server                           │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │ Auth         │  │ Tenant       │  │ Validation   │              │    │
│  │  │ Middleware   │→ │ Middleware   │→ │ Middleware   │→ Routes      │    │
│  │  │ (JWT verify) │  │ (SET tenant) │  │ (Zod schema) │              │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                          │
└────────────────────────────────────┼──────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼──────────────────────────────────────────┐
│                        APPLICATION LAYER                                      │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Dashboard  │  │    Token     │  │     SMS      │  │    Plugin    │    │
│  │   Service    │  │   Service    │  │   Service    │  │    Engine    │    │
│  │              │  │              │  │              │  │              │    │
│  │ - Aggregate  │  │ - Generate   │  │ - Send SMS   │  │ - Registry   │    │
│  │   data       │  │   tokens     │  │ - Track      │  │ - Adapters   │    │
│  │ - Transform  │  │ - Validate   │  │   delivery   │  │ - OAuth      │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │                 │              │
└─────────┼─────────────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │                 │
          └─────────────────┴─────────────────┴─────────────────┘
                                     │
┌────────────────────────────────────▼──────────────────────────────────────────┐
│                           DATA LAYER                                          │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Supabase PostgreSQL + RLS                         │    │
│  │                                                                       │    │
│  │  Organizations │ Users │ Workers │ Data Sources │ Tokens │ Logs     │    │
│  │                                                                       │    │
│  │  RLS Policies: current_setting('app.tenant_id')::uuid                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Redis (Post-MVP)                                  │    │
│  │  - Rate limiting state                                               │    │
│  │  - Plugin data cache                                                 │    │
│  │  - BullMQ job queues                                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼──────────────────────────────────────────┐
│                        INTEGRATION LAYER                                      │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Google     │  │   Airtable   │  │    Notion    │  │    Manual    │    │
│  │   Calendar   │  │     API      │  │     API      │  │     Entry    │    │
│  │              │  │              │  │              │  │              │    │
│  │ OAuth 2.0    │  │ API Token    │  │ OAuth 2.0    │  │ Direct input │    │
│  │ Read events  │  │ Read records │  │ Read DB      │  │ via API      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Key architectural patterns:**
- **Multi-tenant isolation:** RLS at database level + tenant middleware at API level
- **Token-based worker access:** No login required, time-limited secure links
- **## Plugin Architecture

**✅ VERIFIED:** Plugin adapter pattern implemented in `packages/plugins/src/base/adapter.interface.ts`.

**Adapter pattern: Vendor SDKs isolated in adapters, services use contracts
- **Synchronous MVP:** Async processing (queues, webhooks) deferred to Phase 2+

## Key Components

### Admin Dashboard (React + Vite)
Desktop-focused interface for managers to configure workers, connect plugins, send SMS, and view analytics.

### Worker Dashboard (React + Vite)
Mobile-first, single-page view of today's schedule and tasks. No login required—accessed via time-limited token link.

### API Gateway (Hono.js)
TypeScript-first API server handling authentication, request validation (Zod), rate limiting, and routing to services.

### Auth Service (Supabase Auth + JWT)
Manages admin user authentication, JWT token generation for API access, and session management.

### Dashboard Service
Orchestrates data aggregation from plugins, generates personalized worker dashboards, and manages token lifecycle.

### Plugin Engine
Adapter registry for external API integrations (Google Calendar, Airtable, Notion). Handles OAuth flows and data transformation.

### Token Service
Generates secure, time-limited dashboard links (1-24 hours). Tracks token usage and expiry.

### SMS Service
Wraps MobileMessage.com.au API for sending dashboard links to workers. Logs delivery status.

### Database (PostgreSQL + RLS)
Multi-tenant data storage with Row-Level Security enforcing organization-level isolation.

## Data Flow

### Main Use Case: Manager Sends Daily Dashboard
1. Manager clicks "Send Dashboard" in admin panel
2. API validates request, extracts organization ID from JWT
3. Dashboard Service fetches worker list for organization
4. For each worker:
   - Plugin Engine aggregates data from connected sources (Calendar, Airtable, etc.)
   - Dashboard Service generates personalized dashboard data
   - Token Service creates secure, time-limited link
   - SMS Service sends link to worker's phone
5. Worker taps link → Token validated → Dashboard loads instantly
6. Worker refreshes dashboard → Latest data fetched from plugins (no SMS resend needed)

## Scalability Considerations

### What Will Break First Under Load
- **Database connections:** PostgreSQL connection pool exhaustion with many concurrent requests
- **SMS rate limits:** MobileMessage.com.au has provider-level rate limits (100 SMS/min)
- **Plugin API rate limits:** External APIs (Google Calendar, Airtable) have per-app quotas

### Intentionally Deferred (Post-MVP)
- Queue-based async processing (BullMQ) for SMS delivery and data sync
- Circuit breakers for external API failures
- Redis caching layer for plugin data
- Horizontal scaling of API servers
- CDN for static assets
