# 🟣 V2 Constitution Template (18-24 weeks)

**MATURITY_LEVEL**: V2  
**GOAL**: Competitive differentiation and scale  
**TIMELINE**: 18-24 weeks  
**TARGET**: 500-2000 customers

## Philosophy

> **V2 = Competitive Advantages + Advanced Features + Scale**

V2 is about **differentiation and growth**. You have a solid product (V1) with paying customers. Now you're adding features that competitors don't have, building integrations that expand your reach, and optimizing for scale. You're becoming a mature product that can compete in your market.

---

## Core Constraints

### 🎯 Scope Limitations

**MUST INCLUDE**:
- ✅ 8-12 complete features (expanded from V1's 3-5)
- ✅ Advanced integrations (Zapier, Slack, Google Workspace, etc.)
- ✅ Custom dashboards and analytics
- ✅ Advanced automation and workflows
- ✅ Public API for third-party developers
- ✅ Advanced search (full-text, filters, saved searches)
- ✅ Data import/export (multiple formats)
- ✅ Customization options (themes, preferences, layouts)
- ✅ Advanced team features (departments, groups, hierarchies)
- ✅ Performance optimization for scale
- ✅ Advanced reporting and insights

**MUST EXCLUDE** (These come in Production):
- ❌ NO SSO/SAML (OAuth still OK)
- ❌ NO SOC2/GDPR compliance tools (manual compliance OK)
- ❌ NO enterprise-grade SLA guarantees
- ❌ NO dedicated infrastructure per customer
- ❌ NO white-labeling/multi-tenancy
- ❌ NO advanced security features (penetration testing, bug bounty)
- ❌ NO 24/7 dedicated support (business hours OK)

### 💻 Technology Stack

**Frontend**:
- Framework: Next.js 14 + TypeScript (strict mode)
- UI Library: Tailwind CSS + shadcn/ui + custom components
- State Management: Zustand + TanStack Query + Jotai (for complex state)
- Forms: React Hook Form + Zod validation
- Charts: Recharts OR Tremor
- Testing: Vitest + React Testing Library + Playwright (E2E)

**Backend**:
- API: Versioned REST API (v1, v2) + GraphQL (optional)
- Database: PostgreSQL with read replicas
- ORM: Prisma with advanced features (transactions, middleware)
- Auth: NextAuth.js + OAuth + API keys (for developers)
- Payments: Stripe (advanced features: metered billing, usage-based pricing)
- Email: Resend OR SendGrid (templates, tracking, analytics)
- Queue: Inngest OR BullMQ (for background jobs)
- Cache: Redis (Upstash OR self-hosted)

**Deployment**:
- Frontend: Vercel Pro with Edge Functions
- Backend: Vercel OR Railway OR Fly.io (scalable)
- Database: Supabase Pro + read replicas OR RDS + Aurora
- CDN: Cloudflare (assets, API protection)
- Monitoring: Sentry + DataDog OR New Relic
- Analytics: PostHog Pro (feature flags, A/B testing)

**Infrastructure**:
- Auto-scaling enabled
- Load balancing
- Database connection pooling (PgBouncer)
- Redis caching layer
- Background job processing
- Scheduled tasks (cron jobs)
- Webhook delivery system

### 🎨 User Experience

**UI Requirements**:
- Polished, competitive design
- Full theme customization (light/dark + custom colors)
- Advanced layouts (resizable panels, drag-drop)
- Keyboard shortcuts for power users
- Command palette (Cmd+K search)
- Progressive disclosure (advanced features hidden by default)
- Professional animations and micro-interactions
- Accessibility: WCAG AA (aiming for AAA)

**UX Polish**:
- Smooth, app-like experience
- Instant feedback for all actions
- Smart defaults and AI-powered suggestions
- Contextual help and onboarding
- In-app tutorials and walkthroughs
- Customizable dashboards
- Saved views and filters

### ⚡ Performance

**REQUIRED Performance Targets**:
- Page load: <1.5s on 3G (Lighthouse score >95)
- API responses: <200ms p99 for CRUD, <500ms for complex queries
- Time to Interactive (TTI): <2s
- First Contentful Paint (FCP): <1s
- Bundle size: Admin <400KB, mobile <250KB (gzipped)
- Database queries: All optimized, aggressive caching

**Performance Features**:
- ✅ Edge caching for static content
- ✅ Database query optimization (EXPLAIN ANALYZE all queries)
- ✅ Redis caching for hot data
- ✅ Background jobs for heavy operations
- ✅ Lazy loading and code splitting
- ✅ Image optimization (WebP, AVIF, responsive)
- ✅ Service worker for offline support (optional)

### 🔒 Security

**MUST HAVE** (Non-negotiable):
- ✅ All V1 security requirements
- ✅ API key management for developers
- ✅ Rate limiting per user/organization
- ✅ Advanced audit logging (all actions)
- ✅ Data encryption at rest
- ✅ Backup and disaster recovery (automated)
- ✅ Security headers (CSP, HSTS, etc.)
- ✅ Dependency scanning (Snyk, Dependabot)
- ✅ Secrets management (Vault or equivalent)

**CAN DEFER** (Add in Production):
- ❌ SSO/SAML
- ❌ SOC2 compliance
- ❌ Penetration testing
- ❌ Bug bounty program
- ❌ Advanced threat detection

### 🧪 Testing

**MUST HAVE**:
- ✅ Comprehensive unit tests (85%+ coverage)
- ✅ Integration tests for all API endpoints
- ✅ E2E tests for all critical flows
- ✅ Performance tests (load testing)
- ✅ Security tests (OWASP top 10)
- ✅ Contract tests for API (Pact, Postman)
- ✅ Visual regression tests (Percy, Chromatic)

**Testing Infrastructure**:
- CI/CD pipeline with test gates
- Automated testing on every PR
- Preview deployments for testing
- Staging environment mirrors production
- Test data generation and management

### 📊 Observability

**MUST HAVE**:
- ✅ Comprehensive structured logging
- ✅ Advanced error tracking (Sentry with custom tags)
- ✅ Performance monitoring (APM)
- ✅ Uptime monitoring (multi-region)
- ✅ User analytics with funnels
- ✅ Custom dashboards for metrics
- ✅ Alerting for critical issues
- ✅ Log aggregation and search

**Metrics to Track**:
- Business: MRR, churn, activation, engagement
- Technical: Response times, error rates, uptime
- User: Feature adoption, user flows, drop-off points

---

## Development Workflow

### Feature Specification

When specifying features at V2 level:

```bash
/speckit.specify Build [advanced feature] following our V2 constitution. 
Include integration points, API endpoints, analytics, and performance optimization.
```

The AI will know to:
- Build advanced, differentiated features
- Add integration capabilities
- Include analytics and insights
- Optimize for performance at scale
- Add extensive testing

### Planning Checklist

Before implementing ANY feature, verify:

- [ ] Does this differentiate us from competitors?
- [ ] Does this help us scale to 500-2000 customers?
- [ ] Have we designed the API endpoints?
- [ ] Are we adding proper analytics?
- [ ] Have we considered performance at scale?
- [ ] Are we adding comprehensive tests?
- [ ] Does this integrate with our ecosystem?

### Implementation Discipline

**DO**:
- ✅ Design for scale (caching, queues, optimization)
- ✅ Build comprehensive APIs
- ✅ Add detailed analytics
- ✅ Test performance under load
- ✅ Document extensively
- ✅ Consider backward compatibility

**DON'T**:
- ❌ Add features without considering scale
- ❌ Skip performance testing
- ❌ Ignore API design best practices
- ❌ Deploy without load testing
- ❌ Skip monitoring setup

---

## Example: Task Management SaaS (V2 Scope)

### ✅ V2 INCLUDES:

**Core Features** (12 features total):

**V1 Features Enhanced**:
1. Tasks (now with recurring tasks, templates, bulk actions)
2. Projects (now with Gantt charts, dependencies, milestones)
3. Teams (now with departments, custom roles, permissions)
4. Notifications (now with digest emails, Slack integration)
5. Billing (now with usage-based pricing, team plans)

**New V2 Features**:
6. **Advanced Analytics**
   - Custom dashboards
   - Team productivity metrics
   - Project insights and forecasting
   - Exportable reports

7. **Integrations**
   - Zapier (200+ apps)
   - Slack (commands, notifications)
   - Google Workspace (Calendar, Drive)
   - GitHub (issue sync)
   - API for developers

8. **Automation & Workflows**
   - Custom automation rules
   - Workflow templates
   - Conditional logic
   - Scheduled tasks

9. **Advanced Search**
   - Full-text search
   - Advanced filters
   - Saved searches
   - Search suggestions

10. **Time Tracking**
    - Manual time entry
    - Timer
    - Timesheet reports
    - Billing integration

11. **Templates & Forms**
    - Project templates
    - Task templates
    - Custom forms
    - Template marketplace

12. **Mobile Apps** (Optional)
    - iOS app (React Native)
    - Android app (React Native)
    - Offline support
    - Push notifications

**Tech Stack**:
- Next.js 14 + TypeScript
- PostgreSQL + read replicas
- Redis (caching)
- Inngest (background jobs)
- Stripe (advanced billing)
- API with versioning (v1, v2)
- DataDog (monitoring)

**Timeline**: 18-20 weeks

### ❌ V2 EXCLUDES (Save for Production):

- NO SSO/SAML
- NO SOC2 compliance
- NO white-labeling
- NO dedicated infrastructure
- NO 24/7 support
- NO enterprise SLAs

---

## Decision Framework

### Is This V2-Appropriate?

**ASK**: Does this differentiate us from competitors?

- ✅ **YES** → Build it if it fits our roadmap
- ❌ **NO** → Consider if it's essential for scale

**ASK**: Will this help us grow from 500 to 2000 customers?

- ✅ **YES** → Prioritize it
- ❌ **NO** → Defer to later

**ASK**: Does this require enterprise features (SSO, compliance)?

- ✅ **YES** → Defer to Production level
- ❌ **NO** → OK for V2

**ASK**: Can we build this professionally in 2-3 weeks?

- ✅ **YES** → Include if it's high priority
- ❌ **NO** → Break into smaller pieces or defer

---

## Communication Guidelines

### When Working with AI Agents

**ALWAYS reference the constitution:**

```bash
# Good ✅
/speckit.specify Build Zapier integration following our V2 constitution. 
Include webhook system, OAuth flow, rate limiting, and comprehensive API docs.

# Bad ❌
/speckit.specify Add Zapier integration
```

**Be explicit about V2 requirements:**

```bash
# Good ✅
/speckit.plan Design analytics dashboard with custom metrics, 
date ranges, exportable reports, caching layer, and performance optimization per V2 constitution

# Bad ❌
/speckit.plan Design analytics dashboard
```

### Feature Request Template

When specifying a feature:

```markdown
Feature: [Feature Name]

Constitution: V2

Competitive Analysis: [How competitors handle this]

User Stories: [5-8 detailed user journeys]

Scope:
- [Detailed functionality]
- [Integration requirements]
- [API endpoints needed]
- [Performance targets]
- [Analytics to track]

Tech Stack: [Reference V2 stack from constitution]

Testing Requirements:
- Unit tests: [coverage targets]
- Integration tests: [critical flows]
- E2E tests: [user journeys]
- Performance tests: [load scenarios]

Monitoring: [Metrics and alerts to add]

Success Criteria: [Measurable business outcomes]
```

---

## Upgrade Path to Production

When you're ready to move from V2 to Production:

### Step 1: Copy Production Constitution Section

Replace the V2 section in `.specify/memory/constitution.md` with the Production template from `.specify/templates/maturity-levels/production-constitution.md`

### Step 2: Update Maturity Level

```bash
/speckit.constitution Use Production maturity level for this project. 
Follow Production constraints strictly.
```

### Step 3: Specify Enterprise Features

```bash
/speckit.specify Add SSO/SAML following our Production constitution
/speckit.specify Implement SOC2 compliance controls following our Production constitution
```

### Step 4: Infrastructure Migration

Production level often requires infrastructure changes:
- Set up dedicated environments
- Implement advanced monitoring
- Add compliance tooling
- Scale infrastructure

---

## Constitution Version

**Version**: 1.0.0-v2  
**Maturity Level**: V2  
**Created**: 2026-01-31  
**For**: Growing SaaS companies competing at scale
