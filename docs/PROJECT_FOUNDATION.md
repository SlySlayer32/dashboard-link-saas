# CleanConnect - Project Foundation Document

> **Created**: 2025-12-21  
> **Purpose**: Preserve the core vision and requirements for AI assistants working on this project

## Project Overview

CleanConnect is a SaaS platform where organizations create personalized daily dashboards for their workers, delivered via SMS link. The platform enables admins to configure dashboard widgets powered by plugins that pull data from external systems.

## Core Use Cases

1. **Cleaning company** → sends cleaners their daily jobs/locations
2. **Construction firm** → sends workers their site assignments  
3. **Healthcare agency** → sends carers their patient visit schedule
4. **Delivery company** → sends drivers their daily routes

## Architecture Flow

1. **Admin Setup**: Add worker contacts, configure plugins, generate SMS link
2. **Authentication**: Token service creates secure tokens (1hr-1day expiry), SMS service sends link
3. **Worker Receives Link**: Opens tokenized URL on mobile
4. **Backend Validates**: API Gateway validates token, Dashboard API orchestrates data
5. **Plugin Adapters (PULL)**: Calendar, Scheduling, Task adapters fetch from external APIs
6. **External Systems**: Google Calendar, Scheduling tools, Task management APIs
7. **Display Dashboard**: Today's schedule, tasks, important notes
8. **Webhooks (PUSH)**: Real-time updates from external systems

## Technology Stack (Fixed Decisions)

### Frontend
- **Framework**: Vite + React 18
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query

### Backend API
- **Framework**: Hono.js (not Express/Fastify)
- **Why**: 5x smaller memory footprint, fastest cold starts, TypeScript-first

### Database & Backend Services
- **Database**: Supabase (PostgreSQL)
- **Why**: All-in-one (DB, Auth, Storage, Realtime), Row Level Security built-in

### SMS Provider (Australia)
- **Provider**: MobileMessage.com.au
- **Why**: 2¢/SMS intro, 3¢ ongoing, no monthly fees, free virtual number
- **API**: https://api.mobilemessage.com.au/ (Basic Auth)

### Monorepo
- **Tool**: Turborepo (not Nx)
- **Why**: Simpler config, faster setup, better for small-medium teams

### Deployment
- **Frontend**: Vercel
- **Backend/DB**: Supabase
- **Edge Functions**: Vercel Edge or Cloudflare Workers

## Repository Structure (Fixed)

```
dashboard-link-saas/
├── apps/
│   ├── admin/          # Admin dashboard (Vite + React)
│   ├── worker/         # Worker mobile dashboard (Vite + React)
│   └── api/           # Hono.js API
├── packages/
│   ├── plugins/       # Plugin adapter system
│   ├── shared/        # Shared types and utilities
│   └── ui/           # Shared UI components
```

## Key Business Rules

1. **Security**: All dashboard links must be tokenized with expiry (1hr-24hr)
2. **Mobile-First**: Worker dashboard must work perfectly on mobile phones
3. **Plugin System**: Must support both PULL (fetch) and PUSH (webhook) data sources
4. **SMS Limits**: Organizations should have configurable SMS limits
5. **Data Privacy**: Workers only see their own data, admins see organization data
6. **Real-time**: Dashboard should update when external data changes

## Plugin Requirements

### Core Plugins (Must Have)
1. **Manual Entry** - Admin enters tasks/schedule directly
2. **Google Calendar** - Pull events from worker's calendar
3. **Airtable** - Pull from custom Airtable bases
4. **Notion** - Pull from Notion databases

### Plugin Architecture
- Base adapter interface for consistency
- Each plugin handles authentication to external service
- Plugins can fetch data (PULL) or receive webhooks (PUSH)
- Error handling for failed connections
- Rate limiting per plugin

## SMS Integration Requirements

- Send dashboard links via SMS
- Include custom message option
- Track delivery status
- Log all SMS for audit
- Support bulk sending to multiple workers
- Handle international numbers if needed

## Authentication Flow

1. **Admin**: Email/password login → JWT token
2. **Worker**: Tokenized URL → No login required
3. **Token Service**: Generates secure, expiring tokens
4. **Middleware**: Validates tokens on all protected routes

## Data Model Core

- **Organizations**: Top-level tenant
- **Users**: Admin users belonging to organizations
- **Workers**: Non-admin recipients of dashboards
- **Plugins**: Configured data sources per organization
- **SMS Logs**: Audit trail of all messages
- **Dashboard Data**: Cached/fetched data for display

## Development Priorities

1. **Phase 1**: Core backend and admin dashboard
   - Auth system
   - Worker management
   - SMS sending
   - Manual plugin
   
2. **Phase 2**: Worker dashboard
   - Mobile-optimized view
   - Token validation
   - Dashboard widgets
   
3. **Phase 3**: External plugins
   - Google Calendar
   - Airtable
   - Notion
   
4. **Phase 4**: Advanced features
   - Webhooks
   - Analytics
   - Performance optimization

## Critical Success Factors

1. **Simplicity**: Easy for non-technical admins to set up
2. **Reliability**: SMS must deliver, dashboard must load fast
3. **Security**: Tokenized access, data isolation
4. **Mobile Experience**: Workers use phones, not desktops
5. **Plugin Flexibility**: Easy to add new data sources

## Common Pitfalls to Avoid

1. Don't build desktop-first - this is mobile for workers
2. Don't forget SMS delivery tracking
3. Don't make plugin authentication complex
4. Don't skip rate limiting on SMS endpoints
5. Don't store sensitive external API keys insecurely

## Testing Requirements

- All API endpoints must have proper error responses
- SMS service must have test mode for development
- Plugin connections should handle failures gracefully
- Mobile view must be tested on actual phones
- Token expiry must work correctly

---

**Note to AI Assistants**: This document captures the core vision. When implementing features, always refer back to ensure alignment with these requirements. The technology choices are fixed - do not suggest alternatives unless absolutely necessary.
