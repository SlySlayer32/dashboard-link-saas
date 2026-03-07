# Deployment

## Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Local | `http://localhost:5173` (admin) ✅<br>`http://localhost:5174` (worker) ✅<br>`http://localhost:3000` (api) ✅ | Development (verified in config files) |
| Staging | ## TODO: Add staging URLs once deployed | Pre-production testing |
| Production | ## TODO: Add production URLs once deployed | Live |

## Deploy Process

## TODO: Deployment Configuration — UNVERIFIED ASSUMPTION REMOVED. Needs confirming against actual deployment before next coding session.

**Status:** Not yet deployed. The following are planned approaches.

### Frontend (Admin + Worker) — Vercel (Planned)

1. **Connect repository to Vercel:**
   - Link GitHub repository to Vercel project
   - Configure build settings:
     - Build command: `pnpm build`
     - Output directory: `dist`
     - Install command: `pnpm install`

2. **Set environment variables in Vercel:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL`

3. **Deploy:**
   - Push to `main` branch → Vercel auto-deploys
   - Or manual deploy: `vercel --prod`

4. **Verify deployment:**
   - Check Vercel deployment logs
   - Test admin dashboard login
   - Test worker dashboard with sample token

### Backend (API) — Supabase Edge Functions or Railway

#### Option A: Supabase Edge Functions
```bash
# Deploy API as Supabase Edge Function
npx supabase functions deploy api --project-ref <project-ref>
```

#### Option B: Railway (Recommended for MVP)
1. **Connect repository to Railway:**
   - Link GitHub repository to Railway project
   - Configure build settings:
     - Build command: `pnpm --filter @dashboard-link/api build`
     - Start command: `pnpm --filter @dashboard-link/api start`

2. **Set environment variables in Railway:**
   - All variables from ENV-VARIABLES.md

3. **Deploy:**
   - Push to `main` branch → Railway auto-deploys
   - Or manual deploy via Railway CLI

### Database — Supabase

**Migrations are applied automatically via Supabase CLI:**
```bash
# Apply migrations to production
npx supabase db push --project-ref <production-project-ref>
```

**Or use Supabase Dashboard:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy migration SQL from `supabase/migrations/`
3. Run manually (not recommended for production)

## Rollback Plan

### Frontend Rollback (Vercel)
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "Promote to Production"
4. Verify rollback successful

### Backend Rollback (Railway)
1. Go to Railway Dashboard → Deployments
2. Find previous working deployment
3. Click "Redeploy"
4. Verify rollback successful

### Database Rollback (Supabase)
**WARNING:** Database rollbacks are risky. Prefer forward-fixing migrations.

1. **If migration just applied (< 5 minutes):**
   - Use Supabase Dashboard → Database → Backups
   - Restore to point-in-time before migration

2. **If migration applied longer ago:**
   - Write reverse migration (expand-contract pattern)
   - Apply reverse migration via `npx supabase db push`

## Hosting Provider

### Vercel (Frontend)
- **Why:** Zero-config deployment, edge network, preview deployments, generous free tier
- **Cost:** Free for hobby projects, $20/month for team
- **Docs:** https://vercel.com/docs

### Railway (Backend)
- **Why:** Simple deployment, environment variables, logs, generous free tier
- **Cost:** $5/month for hobby projects, usage-based pricing
- **Docs:** https://docs.railway.app

### Supabase (Database + Auth)
- **Why:** Managed PostgreSQL, built-in auth, RLS, generous free tier
- **Cost:** Free for hobby projects, $25/month for pro
- **Docs:** https://supabase.com/docs

## CI/CD Setup

## TODO: CI/CD Implementation — UNVERIFIED ASSUMPTION REMOVED. Needs confirming against codebase before next coding session.

**Status:** `.github/workflows/` directory does not exist. CI/CD is not yet implemented.

### GitHub Actions (Planned)

**Planned `.github/workflows/deploy.yml`:**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: api
```

## Database Backup Strategy

### Supabase Automatic Backups

**Free Tier:**
- **Frequency:** Daily automatic backups
- **Retention:** 7 days
- **Type:** Full database snapshot
- **Location:** Stored in Supabase infrastructure (same region as database)
- **Recovery:** Point-in-time restore via Supabase Dashboard

**Pro Tier ($25/month):**
- **Frequency:** Daily automatic backups
- **Retention:** 30 days
- **Type:** Full database snapshot + point-in-time recovery (PITR)
- **PITR window:** Up to 7 days (can restore to any second within window)
- **Location:** Stored in Supabase infrastructure with redundancy

### Manual Backup Process

**Using Supabase CLI:**
```bash
# Export database schema
npx supabase db dump --schema public > backup_schema_$(date +%Y%m%d).sql

# Export database data
npx supabase db dump --data-only > backup_data_$(date +%Y%m%d).sql

# Full backup (schema + data)
npx supabase db dump > backup_full_$(date +%Y%m%d).sql
```

**Using pg_dump (direct PostgreSQL connection):**
```bash
# Get connection string from Supabase Dashboard → Settings → Database
pg_dump "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" \
  --clean --if-exists --no-owner --no-privileges \
  > backup_$(date +%Y%m%d).sql
```

### Backup Schedule Recommendations

| Environment | Frequency | Retention | Method |
|-------------|-----------|-----------|--------|
| **Production** | Daily (automatic) + Weekly (manual) | 30 days (automatic), 90 days (manual offsite) | Supabase Pro + S3 storage |
| **Staging** | Daily (automatic) | 7 days | Supabase Free |
| **Development** | On-demand | N/A | Local dumps |

### Restore Process

**From Supabase Dashboard (easiest):**
1. Go to Supabase Dashboard → Database → Backups
2. Select backup date/time
3. Click "Restore"
4. Confirm restoration (WARNING: overwrites current data)
5. Wait for restoration to complete (5-30 minutes depending on size)

**From SQL dump file:**
```bash
# Restore from backup file
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" \
  < backup_20260307.sql

# Or using Supabase CLI
npx supabase db reset --db-url "postgresql://..."
```

**Point-in-Time Recovery (Pro tier only):**
1. Go to Supabase Dashboard → Database → Backups → PITR
2. Select exact timestamp to restore to
3. Confirm restoration
4. Database restored to that exact second

### Backup Verification

**Monthly backup test (recommended):**
1. Create test Supabase project
2. Restore latest production backup to test project
3. Verify data integrity (row counts, critical records)
4. Test application against restored database
5. Delete test project after verification

### Offsite Backup Storage

**For critical production data:**
```bash
# Weekly automated backup to S3
#!/bin/bash
BACKUP_FILE="backup_$(date +%Y%m%d).sql"
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
aws s3 cp "$BACKUP_FILE" "s3://cleanconnect-backups/$(date +%Y)/$(date +%m)/"
rm "$BACKUP_FILE"
```

**Retention policy:**
- Daily backups: 30 days
- Weekly backups: 90 days
- Monthly backups: 1 year
- Yearly backups: 7 years (compliance)

---

## Monitoring and Alerting

### Error Tracking (Sentry)

## TODO: Sentry Integration — UNVERIFIED ASSUMPTION REMOVED. Needs confirming against codebase before next coding session.

**Status:** Sentry SDK not installed. Error tracking not yet implemented.

**Planned setup:**
```bash
# Install Sentry SDK
pnpm add @sentry/node @sentry/react
```

**Backend configuration (`apps/api/src/index.ts`):**
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  beforeSend(event) {
    // Remove sensitive data from error reports
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.authorization;
    }
    return event;
  },
});
```

**Frontend configuration (`apps/admin/src/main.tsx`):**
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**Alert rules in Sentry:**
- **Critical:** >10 errors in 5 minutes → Immediate notification
- **High:** >50 errors in 1 hour → Notification within 15 minutes
- **Medium:** New error type detected → Daily digest

### Uptime Monitoring

## TODO: Uptime Monitoring — UNVERIFIED ASSUMPTION REMOVED. Needs confirming against actual deployment before next coding session.

**Status:** Not yet configured. No uptime monitoring in place.

**Planned Option 1: UptimeRobot (Free tier)**
- Monitor: `https://api.dashboardlink.com/health`
- Interval: 5 minutes
- Alert: Email + SMS on downtime
- Status page: Public status page for users

**Option 2: Better Uptime (Paid, $10/month)**
- Monitor: API endpoints, database, frontend
- Interval: 30 seconds
- Alert: Email, SMS, Slack, PagerDuty
- Incident management: Built-in

**Health check endpoint (`apps/api/src/routes/health.ts`):**
```typescript
app.get('/health', async (c) => {
  try {
    // Check database connection
    await supabase.from('organizations').select('count').limit(1);
    
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        api: 'up',
      },
    });
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      error: 'Database connection failed',
    }, 503);
  }
});
```

### Performance Monitoring

**Supabase Dashboard Metrics:**
- Database size and growth rate
- Connection pool usage
- Query performance (slow queries)
- API request rate and latency

**Custom metrics (future):**
```typescript
// Track SMS delivery success rate
const smsSuccessRate = (
  successfulSMS / totalSMS
) * 100;

// Track dashboard load time
const avgDashboardLoadTime = (
  totalLoadTime / dashboardViews
);

// Track plugin sync failures
const pluginFailureRate = (
  failedSyncs / totalSyncs
) * 100;
```

### Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| **API Error Rate** | >1% | >5% | Check logs, rollback if needed |
| **API Response Time** | >500ms | >2s | Investigate slow queries, scale resources |
| **Database CPU** | >70% | >90% | Optimize queries, upgrade plan |
| **Database Connections** | >40 | >55 | Check connection leaks, add pooling |
| **SMS Failure Rate** | >5% | >20% | Check provider status, verify credentials |
| **Disk Usage** | >70% | >90% | Clean up old data, upgrade storage |
| **Uptime** | <99.5% | <99% | Investigate outages, improve reliability |

### Logging Strategy

**✅ VERIFIED:** Structured JSON logging implemented in `apps/api/src/lib/logger.ts`.

**Structured logging format:**
```typescript
logger.info('Worker dashboard accessed', {
  requestId: 'req_abc123',
  workerId: 'uuid',
  organizationId: 'uuid',
  tokenId: 'uuid',
  ipAddress: '1.2.3.4',
  userAgent: 'Mozilla/5.0...',
  validationStatus: 'success',
  timestamp: '2026-03-07T01:30:00Z',
});
```

**Log levels:**
- **ERROR:** Application errors, exceptions (always logged)
- **WARN:** Degraded performance, retries (always logged)
- **INFO:** Important business events (SMS sent, worker created)
- **DEBUG:** Detailed debugging info (only in development)

**Log retention:**
- Production: 90 days (GDPR compliance)
- Staging: 30 days
- Development: 7 days

### Notification Channels

**Email:**
- All alerts (low priority)
- Daily digest of warnings
- Weekly summary report

**Slack:**
- Critical alerts (immediate)
- High-priority alerts (within 15 min)
- Deployment notifications

**SMS/Phone:**
- Critical alerts only (data breach, complete outage)
- Escalation if Slack alerts not acknowledged within 30 min

**PagerDuty (future):**
- On-call rotation
- Escalation policies
- Incident management

---

## Deployment Commands

**Frontend (Vercel):**
```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy to production
vercel --prod

# Deploy preview (PR)
vercel
```

**Backend (Railway):**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy to production
railway up

# View logs
railway logs
```

**Database migrations (Supabase):**
```bash
# Apply migrations to production
npx supabase db push --project-ref <production-project-ref>

# Check migration status
npx supabase migration list

# Create new migration
npx supabase migration new <migration_name>
```
