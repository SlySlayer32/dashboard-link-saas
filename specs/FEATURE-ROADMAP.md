# Feature Roadmap: Worker Management Ecosystem

**Created**: 2026-03-11  
**Status**: Active

## Overview

The worker management ecosystem is split into **5 focused features** to maintain clear boundaries, testable increments, and solo developer velocity. Each feature builds on the previous one.

---

## Feature Dependencies

```
001-worker-management (CRUD foundation)
    ↓
002-token-system (token generation/validation)
    ↓
003-sms-delivery (MobileMessage integration) ← depends on 001 + 002
    ↓
004-worker-dashboard (mobile app) ← depends on 002
    ↓
005-access-logging (read confirmation) ← depends on 004
```

---

## 001: Worker Management (CRUD Foundation)

**Status**: 🔄 In Progress  
**Branch**: `001-worker-management`  
**Estimated Time**: 6-8 hours

### Scope
- Add/edit/delete workers (admin dashboard)
- Phone validation (AU mobile, E.164 format)
- Soft delete (preserve historical data)
- Multi-tenant isolation (RLS)
- Admin UI (WorkerList, WorkerForm)

### Deliverables
- ✅ Migration: `workers` table with `deleted_at` column
- ✅ Repository: WorkerRepository with soft delete methods
- ✅ Service: WorkerService with CRUD operations
- ✅ API: `/api/v1/workers` endpoints (GET, POST, PUT, DELETE)
- ✅ UI: WorkersPage, WorkerList, WorkerForm components
- ✅ Tests: 80% business logic coverage

### Success Criteria
- Manager can add worker in <30 seconds
- Phone validation catches 100% invalid AU mobile formats
- Soft-deleted workers excluded from active lists
- Multi-tenant isolation tested (Org A can't see Org B workers)

### Out of Scope
- SMS sending
- Token generation
- Worker dashboard
- Access logging

---

## 002: Token System

**Status**: 📋 Planned  
**Branch**: `002-token-system`  
**Estimated Time**: 8-10 hours

### Scope
- Token generation service (SHA-256 hashing)
- Configurable expiry (1-24 hours per organization)
- Token validation middleware
- Expired token UX (error page + resend flow)
- Token cleanup job (auto-delete expired tokens)
- Single-use protection (optional)

### Database Schema
```sql
CREATE TABLE dashboard_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  single_use BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tokens_hash ON dashboard_tokens(token_hash);
CREATE INDEX idx_tokens_worker ON dashboard_tokens(worker_id);
CREATE INDEX idx_tokens_expiry ON dashboard_tokens(expires_at) WHERE revoked_at IS NULL;
```

### API Endpoints
- `POST /api/v1/tokens/generate` - Generate token for worker
- `GET /api/v1/tokens/validate/:token` - Validate token (worker dashboard)
- `POST /api/v1/tokens/revoke/:id` - Revoke token (admin)
- `GET /api/v1/tokens/worker/:workerId` - List tokens for worker (admin)

### UI Components
- TokenSettings (configure expiry per org)
- TokenList (view active tokens per worker)
- ExpiredTokenPage (worker-facing error page)

### Success Criteria
- Tokens expire after configured duration (1-24 hours)
- Expired tokens show user-friendly error page
- Revoked tokens cannot be used
- Token cleanup job runs daily
- Single-use tokens can only be accessed once

### Dependencies
- 001-worker-management (needs workers to exist)

---

## 003: SMS Delivery

**Status**: 📋 Planned  
**Branch**: `003-sms-delivery`  
**Estimated Time**: 10-12 hours

### Scope
- MobileMessage.com.au adapter (vendor SDK isolation)
- SMS sending service
- Delivery webhook handling
- Delivery status tracking (sent/delivered/failed)
- SMS logs (full history)
- Admin UI: "Send to one worker" button
- Admin UI: "Send to all workers" button
- SMS link composition (token + worker dashboard URL)

### Database Schema
```sql
CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  token_id UUID REFERENCES dashboard_tokens(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sms_logs_org ON sms_logs(organization_id, created_at DESC);
CREATE INDEX idx_sms_logs_worker ON sms_logs(worker_id);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_provider ON sms_logs(provider_message_id);
```

### MobileMessage Adapter
```typescript
// packages/plugins/src/adapters/mobile-message.ts
export class MobileMessageAdapter {
  async sendSMS(phone: string, message: string): Promise<{ messageId: string }>;
  async getDeliveryStatus(messageId: string): Promise<DeliveryStatus>;
  async handleWebhook(payload: WebhookPayload): Promise<void>;
}
```

### API Endpoints
- `POST /api/v1/sms/send` - Send SMS to one worker
- `POST /api/v1/sms/send-all` - Send SMS to all active workers
- `POST /api/v1/sms/webhook` - MobileMessage delivery webhook
- `GET /api/v1/sms/logs` - List SMS logs (admin)
- `GET /api/v1/sms/logs/worker/:workerId` - SMS logs for worker

### UI Components
- SendSMSButton (single worker)
- SendAllButton (all active workers)
- SMSLogsList (delivery history)
- DeliveryStatusBadge (sent/delivered/failed)

### Success Criteria
- SMS delivered in <5 seconds (99th percentile)
- Delivery status tracked via webhooks
- Failed deliveries logged with error messages
- SMS logs preserved even after worker deletion
- Rate limiting prevents spam (10 SMS/min per org)

### Dependencies
- 001-worker-management (needs workers)
- 002-token-system (needs tokens to embed in SMS links)

---

## 004: Worker Dashboard

**Status**: 📋 Planned  
**Branch**: `004-worker-dashboard`  
**Estimated Time**: 12-16 hours

### Scope
- Separate app (`apps/worker/`)
- Token-based authentication (no login)
- Today-first schedule view
- Mobile-first UI (<2s load on 4G)
- Schedule display (time, location, access codes, instructions)
- Task list display
- Contact information display
- One-tap refresh
- Offline-tolerant (screenshot-able)
- Performance optimization (4G target)

### App Structure
```
apps/worker/
├── src/
│   ├── pages/
│   │   ├── DashboardPage.tsx (main view)
│   │   ├── ExpiredTokenPage.tsx (error state)
│   │   └── LoadingPage.tsx (initial load)
│   ├── components/
│   │   ├── ScheduleCard.tsx
│   │   ├── TaskList.tsx
│   │   ├── ContactCard.tsx
│   │   └── RefreshButton.tsx
│   ├── hooks/
│   │   ├── useTokenValidation.ts
│   │   └── useDashboardData.ts
│   └── lib/
│       ├── token-auth.ts
│       └── performance.ts
```

### Performance Targets
- **First Contentful Paint**: <1.5s on 4G
- **Time to Interactive**: <2s on 4G
- **Bundle size**: <150KB gzipped
- **Lighthouse score**: >90 (mobile)

### Authentication Flow
1. Worker taps SMS link with token
2. App validates token via API
3. If valid: Load dashboard data
4. If expired: Show ExpiredTokenPage with resend option
5. If revoked: Show error message

### UI Requirements
- Mobile-first (320px+ screens)
- Touch-friendly tap targets (44x44px min)
- Screenshot-able (all info in viewport)
- No infinite scroll (all data visible)
- Today-first (no date navigation)

### Success Criteria
- Dashboard loads in <2s on 4G (80th percentile)
- Works on 320px screens
- All critical info visible without scrolling
- Expired token shows user-friendly error
- Refresh button updates data without SMS resend

### Dependencies
- 002-token-system (needs token validation)

---

## 005: Access Logging

**Status**: 📋 Planned  
**Branch**: `005-access-logging`  
**Estimated Time**: 4-6 hours

### Scope
- Track when workers open dashboards
- Capture: IP address, user agent, timestamp, token ID
- Admin UI: "Last opened" indicator
- Admin UI: Read confirmation badge
- Analytics: Open rate tracking

### Database Schema
```sql
CREATE TABLE access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  token_id UUID REFERENCES dashboard_tokens(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_access_logs_org ON access_logs(organization_id, accessed_at DESC);
CREATE INDEX idx_access_logs_worker ON access_logs(worker_id, accessed_at DESC);
CREATE INDEX idx_access_logs_token ON access_logs(token_id);
```

### Logging Middleware
```typescript
// apps/api/src/middleware/access-logger.ts
export async function logDashboardAccess(
  workerId: string,
  tokenId: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await accessLogRepo.create({
    workerId,
    tokenId,
    ipAddress,
    userAgent,
    accessedAt: new Date().toISOString()
  });
}
```

### API Endpoints
- `GET /api/v1/access-logs` - List all access logs (admin)
- `GET /api/v1/access-logs/worker/:workerId` - Logs for specific worker
- `GET /api/v1/access-logs/stats` - Open rate analytics

### UI Components
- LastOpenedBadge (shows "Opened 2 hours ago")
- ReadConfirmationIcon (green checkmark if opened)
- AccessLogsList (full history)
- OpenRateChart (analytics dashboard)

### Success Criteria
- Every dashboard open logged with IP + user agent
- "Last opened" updates in real-time
- Read confirmation visible in worker list
- Access logs preserved after worker deletion
- Analytics show open rate per organization

### Dependencies
- 004-worker-dashboard (needs dashboard to log access)

---

## Implementation Order

### Phase 1: Foundation (Week 1)
1. ✅ 001-worker-management (6-8 hours)

### Phase 2: Core Workflow (Week 2-3)
2. 002-token-system (8-10 hours)
3. 003-sms-delivery (10-12 hours)

### Phase 3: Worker Experience (Week 4)
4. 004-worker-dashboard (12-16 hours)

### Phase 4: Analytics (Week 5)
5. 005-access-logging (4-6 hours)

**Total Estimated Time**: 40-52 hours (5-7 weeks solo developer)

---

## Testing Strategy

### Per-Feature Testing
- **Unit tests**: 80% coverage on business logic
- **Integration tests**: 70% coverage on API routes
- **E2E tests**: Critical user flows only (deferred to Phase 2+)

### Cross-Feature Integration Tests
- **Token + SMS**: Generate token → Send SMS → Validate link
- **SMS + Dashboard**: Send SMS → Worker taps link → Dashboard loads
- **Dashboard + Logging**: Dashboard opens → Access logged → Admin sees confirmation

### Multi-Tenant Isolation Tests
- **Every feature**: Verify Org A cannot access Org B data
- **RLS enforcement**: Test database-level isolation
- **Token validation**: Tokens scoped to organization

---

## Rollout Strategy

### Feature Flags
Each feature can be enabled/disabled per organization:
- `feature_worker_management` (always on)
- `feature_token_system`
- `feature_sms_delivery`
- `feature_worker_dashboard`
- `feature_access_logging`

### Beta Testing
- Feature 001: Internal testing only
- Feature 002-003: Beta with 3-5 friendly customers
- Feature 004: Beta with 10-15 customers (mobile testing critical)
- Feature 005: General availability

### Rollback Plan
Each feature has independent migration rollback:
- Database migrations reversible
- API endpoints versioned (`/api/v1/`)
- Feature flags allow instant disable

---

## Success Metrics

### Feature 001 (Worker Management)
- ✅ Managers can add worker in <30 seconds
- ✅ 100% phone validation accuracy
- ✅ Zero cross-tenant data leaks

### Feature 002 (Token System)
- ✅ Token generation <100ms
- ✅ Expired tokens show error page (not 404)
- ✅ Zero unauthorized access

### Feature 003 (SMS Delivery)
- ✅ >99% delivery rate (MobileMessage SLA)
- ✅ Delivery status tracked within 30 seconds
- ✅ SMS logs preserved indefinitely

### Feature 004 (Worker Dashboard)
- ✅ <2s load time on 4G (80th percentile)
- ✅ >80% open rate (workers actually use it)
- ✅ Works on 320px screens

### Feature 005 (Access Logging)
- ✅ 100% dashboard opens logged
- ✅ "Last opened" updates in real-time
- ✅ Open rate analytics accurate

---

## Next Steps

1. **Complete Feature 001** - Worker management CRUD
2. **Run `/speckit.tasks`** - Generate task breakdown for 001
3. **Run `/speckit.implement`** - Execute tasks for 001
4. **Deploy Feature 001** - Verify in staging
5. **Create spec for Feature 002** - Token system
6. **Repeat** for features 003-005

**Current Focus**: Feature 001 (worker-management)  
**Next Feature**: Feature 002 (token-system)
