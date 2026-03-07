# Security Guide

## Overview

CleanConnect implements multiple layers of security to protect multi-tenant data, ensure secure token-based access, and comply with data privacy regulations.

## Architecture Patterns

### 1. Repository Pattern ✅

**Status:** Fully Implemented

All database access goes through repository classes, preventing direct SQL injection and enforcing consistent data access patterns.

**Implementation:**
- Base repository: `@packages/database/src/base/BaseRepository.ts`
- Concrete repositories: `OrganizationRepository`, `WorkerRepository`, `DashboardRepository`, `SMSLogRepository`
- Route handlers use factory functions: `getOrganizationRepository()`, `getWorkerRepository()`

**Security Benefits:**
- No direct SQL in route handlers
- Centralized query validation
- Easier to audit data access
- Consistent tenant scoping

**Example:**
```typescript
// ✅ Correct: Using repository
const orgRepo = getOrganizationRepository()
const org = await orgRepo.findById(tenant.orgId)

// ❌ Wrong: Direct database access
const { data } = await supabase.from('organizations').select('*')
```

### 2. Service Layer ✅

**Status:** Fully Implemented

Business logic is isolated in dedicated service classes, separating concerns and enabling comprehensive testing.

**Services:**
- `TokenService` - Secure token generation and validation
- `SMSService` - SMS delivery with rate limiting
- `WebhookService` - Webhook signature verification
- `OrganizationService`, `WorkerService` - Business operations

**Security Benefits:**
- Centralized validation logic
- Easier to test security rules
- Clear separation of HTTP and business logic
- Consistent error handling

### 3. Middleware Order ✅

**Status:** Optimized

Middleware executes in security-first order:

```typescript
1. Logger (honoLogger)           // Log all requests
2. CORS                          // Handle preflight requests
3. Tenant Middleware             // Extract and validate tenant context
4. Cache (route-specific)        // Cache authenticated requests
5. Route Handlers                // Execute business logic
6. Error Handler (onError)       // Sanitize error responses
```

**Security Benefits:**
- Authentication happens before business logic
- Tenant context set before any data access
- Errors sanitized before returning to client

## Data Deletion Policy

### Hard Deletes ✅

**Decision:** CleanConnect uses **hard deletes** (no soft deletes with `deleted_at` columns)

**Rationale:**
1. **GDPR Compliance** - Right to erasure requires permanent deletion
2. **Simplified Queries** - No `WHERE deleted_at IS NULL` on every query
3. **Audit Trail Preserved** - Logs use `ON DELETE SET NULL` to preserve history
4. **Performance** - Smaller database, faster queries

**Implementation:**
```sql
-- Cascade deletes (dependent data removed)
CREATE TABLE workers (
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE
);

-- Preserve audit trail (set to NULL)
CREATE TABLE sms_logs (
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL
);
```

**Mitigations:**
- Daily automated backups with point-in-time recovery
- Confirmation dialogs on all delete operations
- Audit logging of who deleted what and when
- Comprehensive cascade behavior tests

**See:** [ADR 002: Hard Deletes Over Soft Deletes](../4-decisions/ADR/002-hard-deletes-over-soft-deletes.md)

## Database Security

### 1. Row-Level Security (RLS)

**Status:** Enabled on all tenant-scoped tables

All tables use RLS policies with custom session variable:

```sql
-- RLS policy pattern
CREATE POLICY "tenant_isolation" ON workers
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id', true)::uuid);
```

**IMPORTANT:** This is a **custom RLS pattern**, not standard Supabase. The API must explicitly set the tenant context:

```typescript
// Set tenant context per request
await supabase.rpc('set_config', {
  setting: 'app.tenant_id',
  value: tenant.orgId,
  is_local: true
})
```

**Security Benefits:**
- Database-level tenant isolation
- Protection against SQL injection
- Defense in depth (even if app logic fails)

### 2. UUID Primary Keys ✅

**Status:** All tables use UUIDs

All primary keys use `UUID DEFAULT gen_random_uuid()`:

**Security Benefits:**
- Non-sequential, unpredictable IDs
- No ID enumeration attacks
- Safe for multi-tenant systems
- No ID collisions in distributed systems

### 3. Timestamps ✅

**Status:** Consistent across all tables

All mutable tables have `created_at` and `updated_at` with auto-update triggers:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Security Benefits:**
- Audit trail of when records were modified
- Detect unauthorized modifications
- Support forensic analysis

## API Security

### 1. Input Validation ✅

**Status:** Zod validation on all endpoints

All API inputs validated with Zod schemas:

```typescript
app.post('/workers',
  zValidator('json', z.object({
    name: z.string().min(1, 'Name is required'),
    phone_e164: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  })),
  async (c) => {
    const validated = c.req.valid('json') // Type-safe, validated data
  }
)
```

**Security Benefits:**
- Prevent injection attacks
- Type safety
- Consistent error messages
- Automatic validation before handler execution

### 2. Tenant Isolation ✅

**Status:** Enforced at middleware and query level

Every request extracts tenant context from JWT and scopes all queries:

```typescript
// Middleware extracts tenant
const tenant = c.get('tenant')

// All queries scoped by organizationId
const workers = await workerRepo.findMany({
  where: { organizationId: tenant.orgId }
})
```

**Security Benefits:**
- No cross-tenant data leakage
- Enforced at multiple layers (middleware + RLS)
- Cannot be bypassed by client

### 3. Token Security ✅

**Status:** SHA-256 hashed tokens with expiry

Dashboard tokens are:
- Hashed with SHA-256 before storage
- Time-limited (1-24 hours)
- Single-use recommended
- Auto-cleaned after expiry + 24h

```typescript
// Token generation
const token = crypto.randomBytes(32).toString('hex')
const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

// Store only hash
await db.insert({ token_hash: tokenHash, expires_at: expiryDate })
```

**Security Benefits:**
- Tokens not stored in plaintext
- Limited blast radius if database compromised
- Automatic expiry reduces attack window

## Testing Security

### 1. Test Coverage Thresholds ✅

**Status:** Configured with security-first priorities

Coverage thresholds prioritize critical security paths:

```typescript
// apps/api/vitest.config.ts
coverage: {
  thresholds: {
    // Critical security - 90-95% coverage
    'src/middleware/tenant*.ts': { functions: 95, branches: 90 },
    'src/services/token*.ts': { functions: 90, branches: 85 },
    
    // Business logic - 80% coverage
    'src/services/**': { functions: 80, branches: 70 },
    
    // Overall - 75% coverage
    functions: 75,
    branches: 65,
  }
}
```

**Security Benefits:**
- High confidence in auth/tenant logic
- Catch security regressions early
- Enforce testing of edge cases

### 2. Mock Strategy ✅

**Status:** MSW for integration tests, Vitest mocks for unit tests

**Unit Tests:** Manual mocks with `vi.fn()` for isolated testing
**Integration Tests:** MSW for realistic HTTP mocking

```typescript
// MSW handler for SMS provider
http.post('https://api.mobilemessage.com.au/v1/send', async ({ request }) => {
  const body = await request.json()
  
  // Validate phone format (security test)
  if (!body.to.match(/^\+61\d{9}$/)) {
    return HttpResponse.json({ error: 'Invalid phone' }, { status: 400 })
  }
  
  return HttpResponse.json({ success: true })
})
```

**Security Benefits:**
- Test external API error handling
- Simulate rate limiting, timeouts
- Verify input validation
- No real API calls in tests

**See:** [MSW Setup Guide](./MSW-SETUP.md)

## React Security

### 1. Error Boundaries ✅

**Status:** Implemented in admin and worker apps

React Error Boundaries prevent sensitive error details from leaking:

```typescript
export class ErrorBoundary extends Component {
  render() {
    if (this.state.hasError) {
      return process.env.NODE_ENV === 'development' 
        ? <pre>{this.state.error?.toString()}</pre>  // Dev: Show details
        : 'An error occurred. Please try again.'    // Prod: Generic message
    }
    return this.props.children
  }
}
```

**Security Benefits:**
- No stack traces in production
- Graceful degradation
- User-friendly error messages
- Prevent information disclosure

### 2. Form Handling ✅

**Status:** React Hook Form with validation

All forms use React Hook Form with validation:

```typescript
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(workerSchema)
})
```

**Security Benefits:**
- Client-side validation (UX)
- Server-side validation (security)
- Type-safe form data
- CSRF protection via JWT

## Compliance

### GDPR Right to Erasure ✅

**Implementation:**
- Hard deletes permanently remove personal data
- Audit logs preserved with `ON DELETE SET NULL`
- Backup retention policy: 30 days
- Data export available on request

### Data Minimization ✅

**Implementation:**
- Only collect necessary fields (name, phone, email)
- No PII in logs (phone numbers hashed in analytics)
- Token-based access (no passwords for workers)
- Automatic token cleanup

### Audit Trail ✅

**Implementation:**
- All SMS sends logged with timestamp and sender
- Dashboard access logged with IP and user agent
- Token validation status tracked
- Delete operations logged

## Security Checklist

### Pre-Deployment

- [ ] All environment variables set (no hardcoded secrets)
- [ ] RLS policies enabled on all tenant tables
- [ ] JWT secret rotated from default
- [ ] CORS origins restricted to production domains
- [ ] Rate limiting configured
- [ ] Backup schedule verified
- [ ] SSL/TLS certificates valid
- [ ] Test coverage thresholds met

### Post-Deployment

- [ ] Monitor failed authentication attempts
- [ ] Review access logs for anomalies
- [ ] Check token expiry cleanup job
- [ ] Verify RLS policies active
- [ ] Test GDPR deletion flow
- [ ] Audit third-party API keys

## Incident Response

### Suspected Data Breach

1. **Immediate:** Rotate all API keys and JWT secrets
2. **Investigate:** Check access logs for unauthorized access
3. **Notify:** Inform affected organizations within 72 hours (GDPR)
4. **Remediate:** Patch vulnerability, force password resets
5. **Document:** Create incident report

### Token Compromise

1. **Revoke:** Set `revoked_at` on compromised token
2. **Investigate:** Check access logs for token usage
3. **Notify:** Inform organization if data accessed
4. **Regenerate:** Issue new token to worker

### SQL Injection Attempt

1. **Block:** Rate limit offending IP
2. **Investigate:** Review logs for attack pattern
3. **Verify:** Confirm RLS and input validation working
4. **Update:** Add additional validation if needed

## References

- [ADR 002: Hard Deletes](../4-decisions/ADR/002-hard-deletes-over-soft-deletes.md)
- [Database Schema](../2-architecture/DATABASE-SCHEMA.md)
- [MSW Setup](./MSW-SETUP.md)
- [Test Coverage](../../apps/api/vitest.config.ts)

## Authentication & Authorization

### How Identity Is Verified

**Admin Users (JWT):**
1. User logs in via Supabase Auth (email/password)
2. Supabase returns JWT access token + refresh token
3. Client stores tokens securely (httpOnly cookies or secure storage)
4. Client includes JWT in `Authorization: Bearer <token>` header on API requests
5. API validates JWT signature using Supabase JWT secret
6. API extracts `user_id` and `organization_id` from JWT payload

**Note:** JWT expiry durations are configured in Supabase Auth settings (not in ENV.example). Default Supabase values: 1 hour access token, 7 days refresh token.

**Workers (Token-based):**
1. Manager generates time-limited dashboard token (1-24 hours) ✅ Verified in database schema
2. Token sent to worker via SMS link
3. Worker taps link → token validated via database lookup
4. No login required, no password, no account

### How Access Is Controlled

**Role-Based Access Control (RBAC):**
- **Admin role:** Full access to organization data (workers, plugins, SMS, analytics)
- **User role:** Read-only access to organization data
- **Worker role:** Access only to own dashboard (via token)

**Resource-Level Checks:**
- All API endpoints validate `organization_id` from JWT matches resource being accessed
- Database RLS policies enforce organization-level isolation
- Workers can only access their own dashboard (token tied to specific worker)

## Data Access Rules

### Who Can See What

**Admin users can see:**
- All workers in their organization
- All plugins configured for their organization
- All SMS logs for their organization
- All dashboard tokens for their organization
- Analytics for their organization

**Workers can see:**
- Only their own dashboard data
- Only when accessing via valid token
- No access to other workers' data
- No access to organization settings

### Row-Level Security (RLS)

**PostgreSQL RLS enforces tenant isolation:**
```sql
-- Example policy: users can only see their organization's workers
CREATE POLICY tenant_isolation_policy ON workers
  FOR ALL
  USING (organization_id = current_setting('app.tenant_id')::uuid);
```

**How it works:**
1. API middleware extracts `organization_id` from JWT
2. API sets PostgreSQL session variable: `SET LOCAL app.tenant_id = <org_id>`
3. All queries automatically filtered by RLS policies
4. Even SQL injection can't cross tenant boundaries

**IMPORTANT:** This is a **CUSTOM RLS pattern**, not standard Supabase. Standard Supabase RLS uses JWT claims (`auth.uid()`, `auth.jwt() ->> 'organization_id'`). Our custom pattern requires explicit session variable setting in the API middleware but provides better control for service role operations. See `@e:\CleanConnect\docs\2-architecture\DATABASE-SCHEMA.md` for details and alternative approaches.

## What Never Gets Exposed

### Fields That Must Stay Private
- **Service role key** — Bypasses RLS, server-side only
- **JWT secret** — Used to sign/verify tokens, server-side only
- **SMS API key** — MobileMessage.com.au credentials, server-side only
- **Raw tokens** — Only store hashed tokens in database
- **Refresh tokens** — Never expose in API responses
- **Other organizations' data** — Enforced by RLS

### Endpoints That Must Stay Private
- **Service role endpoints** — No public access to admin operations
- **Internal health checks** — Only accessible from internal network
- **Database connection strings** — Never expose in client code

## Input Validation

### Where Inputs Are Sanitized

**API Layer (Zod validation):**
- All request bodies validated with Zod schemas
- All query params validated with Zod schemas
- Validation errors return 400 with field-level details

**Database Layer (PostgreSQL constraints):**
- NOT NULL constraints on required fields
- UNIQUE constraints on email, phone_number, token_hash
- CHECK constraints on phone_number format (E.164)
- Foreign key constraints enforce referential integrity

**Example Zod schema:**
```typescript
const createWorkerSchema = z.object({
  full_name: z.string().min(1).max(100),
  phone_number: z.string().regex(/^\+[1-9]\d{1,14}$/), // E.164 format
  calendar_email: z.string().email().optional(),
});
```

### What Gets Validated
- **Phone numbers:** E.164 format (+61412345678)
- **Email addresses:** Valid email format
- **Token expiry:** 1-24 hours range
- **Organization ID:** Valid UUID format
- **SMS message length:** Max 160 characters (standard SMS)

## Known Risks / Accepted Tradeoffs

### Risk: Token-based worker access (no password)
**Why accepted:** Zero friction is core value proposition. Workers don't want passwords. Time-limited tokens (1-24 hours) + SMS delivery to verified phone number provides sufficient security for use case (viewing daily schedule).

**Mitigation:**
- Tokens expire after 1-24 hours (configurable)
- Tokens can be manually revoked
- Access logs track when/where tokens are used
- SMS delivery to verified phone number (not email)

### Risk: SMS provider single point of failure
**Why accepted:** MVP phase, cost optimization. MobileMessage.com.au is reliable and cost-effective for Australian market.

**Mitigation:**
- Monitor SMS delivery success rate
- Alert on delivery failures
- Plan multi-provider fallback for Phase 2+

### Risk: No MFA for admin users (MVP)
**Why accepted:** MVP phase, solo developer. Supabase Auth supports MFA but not implemented yet.

**Mitigation:**
- Strong password requirements enforced by Supabase Auth
- JWT tokens expire after 15 minutes
- Plan to add MFA in Phase 2

### Risk: Service role key bypasses RLS
**Why accepted:** Necessary for admin operations that need cross-tenant access (e.g., cleanup jobs).

**Mitigation:**
- Service role key never exposed to client
- API explicitly sets tenant context before queries
- All service role usage logged and audited
- Separate service role key for production vs development

---

## OWASP Top 10 2021 Compliance Checklist

### A01:2021 – Broken Access Control
**Status:** ✅ Mitigated
- ✅ RLS policies enforce tenant isolation at database level
- ✅ JWT validation on all protected endpoints
- ✅ Organization ID derived from JWT, never from client input
- ✅ Token-based access for workers (time-limited, revocable)
- ✅ Access logs track all dashboard access attempts
- ⚠️ **Action needed:** Add automated tests for cross-tenant access attempts

### A02:2021 – Cryptographic Failures
**Status:** ✅ Mitigated
- ✅ HTTPS enforced for all connections (production)
- ✅ JWT tokens signed with strong secret (HS256)
- ✅ Dashboard tokens hashed with SHA-256 before storage (verified in `apps/api/src/services/token.service.ts:72` and `apps/api/src/routes/tokens.ts:248`)
- ✅ OAuth tokens encrypted at rest (Supabase encryption)
- ✅ No sensitive data in logs or error messages
- ✅ Passwords managed by Supabase Auth (bcrypt hashing)

### A03:2021 – Injection
**Status:** ✅ Mitigated
- ✅ All database queries use parameterized queries (Supabase client)
- ✅ RLS policies prevent SQL injection from crossing tenant boundaries
- ✅ Input validation with Zod schemas (regex for phone, email)
- ✅ PostgreSQL CHECK constraints enforce data format
- ✅ No raw SQL concatenation in application code

### A04:2021 – Insecure Design
**Status:** ✅ Mitigated
- ✅ Multi-tenant architecture designed with isolation as core principle
- ✅ Token expiry enforced (1-24 hours, configurable)
- ✅ Rate limiting planned (per organization, per endpoint)
- ✅ Audit logging for security events (access logs, SMS logs)
- ⚠️ **Action needed:** Add rate limiting middleware before production

### A05:2021 – Security Misconfiguration
**Status:** ⚠️ Partial
- ✅ TypeScript strict mode enabled
- ✅ Environment variables for secrets (never hardcoded)
- ✅ CORS configured for specific origins only
- ✅ Error messages don't expose stack traces in production
- ⚠️ **Action needed:** Security headers (CSP, HSTS, X-Frame-Options)
- ⚠️ **Action needed:** Disable directory listing on static assets

### A06:2021 – Vulnerable and Outdated Components
**Status:** ✅ Mitigated
- ✅ Dependencies managed via pnpm with lock file
- ✅ Regular dependency updates via Dependabot (GitHub)
- ✅ No known critical vulnerabilities in dependencies
- ⚠️ **Action needed:** Add `pnpm audit` to CI/CD pipeline

### A07:2021 – Identification and Authentication Failures
**Status:** ✅ Mitigated
- ✅ Authentication handled by Supabase Auth (battle-tested)
- ✅ JWT tokens expire after 15 minutes (short-lived)
- ✅ Refresh tokens expire after 7 days
- ✅ Strong password requirements enforced
- ✅ Account lockout after failed login attempts (Supabase default)
- ⚠️ **Action needed:** Add MFA support (Phase 2)

### A08:2021 – Software and Data Integrity Failures
**Status:** ✅ Mitigated
- ✅ Dependencies verified via lock file (pnpm-lock.yaml)
- ✅ Code review required for all changes (GitHub PRs)
- ✅ CI/CD pipeline runs tests before deployment
- ✅ Database migrations append-only (no destructive edits)
- ✅ Webhook signature verification planned (Phase 3)

### A09:2021 – Security Logging and Monitoring Failures
**Status:** ⚠️ Partial
- ✅ Access logs track dashboard access (success/failure)
- ✅ SMS logs track all message delivery
- ✅ Structured logging with request IDs
- ⚠️ **Action needed:** Centralized logging (Sentry, Datadog)
- ⚠️ **Action needed:** Alerting for security events (failed auth, rate limits)
- ⚠️ **Action needed:** Log retention policy (GDPR compliance)

### A10:2021 – Server-Side Request Forgery (SSRF)
**Status:** ✅ Mitigated
- ✅ No user-controlled URLs in server-side requests
- ✅ Plugin adapters use hardcoded API endpoints only
- ✅ Webhook URLs validated and allowlisted (Phase 3)
- ✅ No file upload functionality (SSRF vector eliminated)

---

## Pre-Production Security Audit Checklist

### Authentication & Authorization
- [ ] JWT secret is strong (256+ bits) and rotated regularly
- [ ] Service role key stored securely (environment variable, never committed)
- [ ] All protected endpoints require valid JWT
- [ ] Organization ID always derived from JWT, never from request body
- [ ] Token expiry enforced (dashboard tokens expire after configured hours)
- [ ] Revoked tokens cannot be used (database check on every request)

### Multi-Tenant Isolation
- [ ] RLS policies enabled on all tenant-scoped tables
- [ ] Tenant isolation test passes (cross-tenant access blocked)
- [ ] Service role queries explicitly set `app.tenant_id` context
- [ ] No raw SQL queries bypass RLS
- [ ] Database connection uses least-privilege credentials

### Input Validation
- [ ] All API endpoints validate input with Zod schemas
- [ ] Phone numbers validated against E.164 format
- [ ] Email addresses validated with regex
- [ ] UUID format validated for all ID parameters
- [ ] SQL injection attempts blocked by RLS and parameterized queries
- [ ] XSS attempts blocked by React's built-in escaping

### Secrets Management
- [ ] No secrets in git repository (check with `git log -S "secret"`)
- [ ] `.env` files in `.gitignore`
- [ ] Production secrets stored in hosting provider (Vercel, Railway)
- [ ] Different secrets for development, staging, production
- [ ] API keys rotated after any exposure

### Network Security
- [ ] HTTPS enforced for all connections (production)
- [ ] CORS configured for specific origins only (no `*` wildcard)
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- [ ] Rate limiting enabled (per organization, per endpoint)
- [ ] DDoS protection via hosting provider (Vercel, Cloudflare)

### Data Protection
- [ ] Sensitive data encrypted at rest (OAuth tokens, API keys)
- [ ] Sensitive data encrypted in transit (HTTPS)
- [ ] Dashboard tokens hashed before storage (SHA-256)
- [ ] No sensitive data in logs or error messages
- [ ] GDPR compliance: data retention policy, right to deletion

### Monitoring & Logging
- [ ] Error tracking configured (Sentry)
- [ ] Access logs capture IP, user agent, timestamp
- [ ] Failed authentication attempts logged
- [ ] Rate limit violations logged
- [ ] Alerts configured for security events
- [ ] Log retention complies with GDPR (max 90 days for access logs)

### Dependency Security
- [ ] `pnpm audit` shows no critical vulnerabilities
- [ ] Dependabot enabled for automatic security updates
- [ ] Dependencies updated within 30 days of security patches
- [ ] No deprecated or unmaintained dependencies

---

## Incident Response Plan

### Phase 1: Detection & Assessment (0-15 minutes)

**Trigger events:**
- Automated alert (Sentry, uptime monitor, rate limit spike)
- User report (support ticket, email)
- Suspicious activity in logs (failed auth spike, cross-tenant access attempt)

**Immediate actions:**
1. **Acknowledge incident** — Assign incident commander (solo dev = you)
2. **Assess severity** — Critical (data breach), High (service down), Medium (degraded), Low (isolated issue)
3. **Create incident channel** — Slack/Discord channel for coordination
4. **Notify stakeholders** — If critical/high, notify affected customers

### Phase 2: Containment (15-60 minutes)

**For data breach / unauthorized access:**
1. **Revoke compromised credentials** — Rotate JWT secret, API keys, service role key
2. **Block attacker** — IP ban, rate limit to zero, disable compromised account
3. **Preserve evidence** — Export logs, database snapshots, access logs
4. **Isolate affected systems** — Take affected services offline if necessary

**For service outage:**
1. **Identify root cause** — Check logs, metrics, recent deployments
2. **Rollback if needed** — Revert to last known good deployment
3. **Scale resources** — Increase database connections, API instances
4. **Enable maintenance mode** — Display status page to users

### Phase 3: Eradication (1-4 hours)

1. **Fix vulnerability** — Patch code, update dependencies, fix configuration
2. **Deploy fix** — Test in staging, deploy to production
3. **Verify fix** — Confirm vulnerability no longer exploitable
4. **Scan for other instances** — Check if same vulnerability exists elsewhere

### Phase 4: Recovery (4-24 hours)

1. **Restore normal operations** — Re-enable services, remove IP bans
2. **Monitor closely** — Watch for recurrence, anomalies
3. **Verify data integrity** — Check for data corruption, unauthorized changes
4. **Communicate with users** — Send all-clear notification

### Phase 5: Post-Incident Review (24-72 hours)

1. **Document timeline** — What happened, when, who was affected
2. **Root cause analysis** — Why did this happen? What failed?
3. **Action items** — Prevent recurrence (code changes, process improvements)
4. **Update runbooks** — Document new procedures, update incident response plan
5. **Notify authorities if required** — GDPR breach notification (72 hours), law enforcement

### Severity Levels

| Level | Definition | Response Time | Example |
|-------|------------|---------------|----------|
| **Critical** | Data breach, complete service outage | Immediate (< 15 min) | Database exposed, JWT secret leaked |
| **High** | Partial outage, security vulnerability | < 1 hour | API down, RLS bypass discovered |
| **Medium** | Degraded performance, isolated issue | < 4 hours | Slow queries, single plugin failing |
| **Low** | Minor bug, cosmetic issue | < 24 hours | UI glitch, typo in email |

### Contact Information

**Internal:**
- Incident Commander: [Your contact]
- Technical Lead: [Your contact]
- On-call rotation: [PagerDuty/OpsGenie]

**External:**
- Hosting Provider Support: Vercel, Railway, Supabase
- Security Vendor: Sentry, Cloudflare
- Legal Counsel: [If data breach requires notification]

### GDPR Breach Notification

**Required if:**
- Personal data exposed (names, emails, phone numbers)
- Breach likely to result in risk to individuals

**Timeline:**
- Notify supervisory authority within **72 hours** of becoming aware
- Notify affected individuals **without undue delay** if high risk

**Information to include:**
- Nature of breach (what data, how many individuals)
- Contact point for more information
- Likely consequences of breach
- Measures taken to address breach
