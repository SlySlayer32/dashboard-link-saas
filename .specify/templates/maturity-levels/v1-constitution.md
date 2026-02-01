# 🔵 V1 Constitution Template (10-14 weeks)

**MATURITY_LEVEL**: V1  
**GOAL**: Professional product ready for paying customers  
**TIMELINE**: 10-14 weeks  
**TARGET**: 100-500 paying customers

## Philosophy

> **V1 = Complete, Professional Product with 3-5 Core Features**

V1 is about creating a **complete, polished product** that customers will pay for. You've validated your core idea in MVP. Now you're building a professional solution that can support a real business with paying customers. Quality matters. User experience matters. Reliability matters.

---

## Core Constraints

### 🎯 Scope Limitations

**MUST INCLUDE**:
- ✅ 3-5 complete, polished features (expanded from MVP's single feature)
- ✅ Professional UI/UX with consistent design system
- ✅ Payment integration (Stripe or similar)
- ✅ Role-based access control (admin, user, etc.)
- ✅ Email notifications for key events
- ✅ Basic team collaboration features
- ✅ Search and filtering capabilities
- ✅ Data export (CSV, PDF)
- ✅ Professional error handling and messaging
- ✅ Automated testing (unit + integration)

**MUST EXCLUDE** (These come in V2+):
- ❌ NO advanced integrations (Zapier, Slack beyond webhooks)
- ❌ NO custom dashboards/analytics (basic metrics OK)
- ❌ NO white-labeling or multi-tenancy
- ❌ NO advanced automation/workflows
- ❌ NO mobile native apps (mobile web must be excellent)
- ❌ NO API for third-party developers
- ❌ NO SSO/SAML (OAuth for Google/GitHub OK)
- ❌ NO advanced security features (SOC2, GDPR tools)

### 💻 Technology Stack

**Frontend**:
- Framework: Next.js 14 + TypeScript (MUST use TypeScript)
- UI Library: Tailwind CSS + shadcn/ui (consistent component usage)
- State Management: Zustand + TanStack Query
- Forms: React Hook Form + Zod validation
- Testing: Vitest + React Testing Library

**Backend**:
- API: Next.js API routes OR Hono.js + Serverless
- Database: Supabase (PostgreSQL + RLS) OR PlanetScale + Auth
- ORM: Prisma (with proper schema design)
- Auth: NextAuth.js + OAuth providers OR Supabase Auth
- Payments: Stripe (customer portal, webhooks, subscriptions)
- Email: Resend OR SendGrid (transactional emails)

**Deployment**:
- Frontend: Vercel Pro ($20/mo)
- Backend/Database: Supabase Pro ($25/mo) OR PlanetScale Scaler ($29/mo)
- Monitoring: Sentry (error tracking)
- Analytics: PostHog OR Plausible (privacy-friendly)
- Uptime: BetterUptime OR UptimeRobot

**Data Storage**:
- PostgreSQL with proper indexes
- Max 20 database tables (well-designed schema)
- Redis for caching (Upstash serverless Redis)
- File storage: Supabase Storage OR Cloudflare R2
- Background jobs: Inngest OR Trigger.dev

### 🎨 User Experience

**UI Requirements**:
- Professional design using shadcn/ui components
- Consistent design system with theme (light/dark mode)
- Mobile-responsive on ALL screens (tested on real devices)
- Touch targets ≥44px, font size ≥16px
- Professional loading states (skeletons, not just spinners)
- User-friendly error messages with recovery actions
- Empty states guide users to next actions
- Keyboard navigation works everywhere
- WCAG AA accessibility compliance

**UX Polish**:
- Smooth transitions and animations (Framer Motion)
- Optimistic updates for fast perceived performance
- Toast notifications for user actions
- Confirmation dialogs for destructive actions
- Form validation with inline error messages
- Tooltips and help text where needed
- Onboarding flow for new users (3-5 steps max)

### ⚡ Performance

**REQUIRED Performance Targets**:
- Page load: <2s on 3G (Lighthouse score >90)
- API responses: <500ms p99 for CRUD operations
- Time to Interactive (TTI): <3s
- First Contentful Paint (FCP): <1.5s
- Bundle size: Admin <500KB, mobile <300KB (gzipped)
- Database queries: All indexed, no N+1 queries

**Optimization Requirements**:
- ✅ Image optimization (next/image or Cloudflare Images)
- ✅ Code splitting and lazy loading
- ✅ API response caching (stale-while-revalidate)
- ✅ Database connection pooling
- ✅ React component memoization for expensive renders

### 🔒 Security

**MUST HAVE** (Non-negotiable):
- ✅ HTTPS everywhere (HSTS headers)
- ✅ Authentication + authorization on all routes
- ✅ Input validation and sanitization (prevent XSS, SQL injection)
- ✅ Rate limiting (API endpoints + login attempts)
- ✅ CSRF protection
- ✅ Secure password requirements (min 8 chars, complexity)
- ✅ Password reset + email verification
- ✅ Audit logging for sensitive actions
- ✅ Role-based access control (RBAC)
- ✅ Webhook signature verification (Stripe, etc.)

**CAN DEFER** (Add in V2/Production):
- ❌ 2FA/MFA (nice to have, not required)
- ❌ SSO/SAML
- ❌ SOC2 compliance
- ❌ Penetration testing
- ❌ Advanced threat detection

### 🧪 Testing

**MUST HAVE**:
- ✅ Unit tests for business logic (80%+ coverage)
- ✅ Integration tests for API endpoints (critical paths)
- ✅ Component tests for key UI components
- ✅ E2E tests for critical user flows (auth, payment)
- ✅ Manual testing on real mobile devices
- ✅ Payment flow testing (Stripe test mode)

**Testing Strategy**:
- Unit tests: Fast (<100ms), isolated, no DB
- Integration tests: Test DB, mock external APIs
- E2E tests: Playwright/Cypress for critical flows only
- All tests must pass before deploy (CI/CD gate)

### 📊 Observability

**MUST HAVE**:
- ✅ Structured logging (Pino, Winston)
- ✅ Error tracking (Sentry with source maps)
- ✅ Performance monitoring (Core Web Vitals)
- ✅ Uptime monitoring (BetterUptime)
- ✅ User analytics (PostHog, Plausible)
- ✅ Basic metrics (API response times, error rates)

**Logging Requirements**:
- All errors logged with context (user, request, tenant)
- Key user actions logged (sign up, payment, data changes)
- NO sensitive data in logs (passwords, credit cards)
- Log retention: 30 days minimum

---

## Development Workflow

### Feature Specification

When specifying features at V1 level:

```bash
/speckit.specify Build [feature] following our V1 constitution constraints. 
Include professional UI, testing, and error handling.
```

The AI will know to:
- Build complete, polished features
- Include role-based access
- Add proper error handling
- Write tests
- Use professional UI patterns

### Planning Checklist

Before implementing ANY feature, verify:

- [ ] Does this complete one of our 3-5 core features?
- [ ] Is the UI professional and accessible?
- [ ] Are we writing tests for this?
- [ ] Does this work well on mobile?
- [ ] Is error handling comprehensive?
- [ ] Are we adding proper logging?
- [ ] Does this integrate with our payment system (if relevant)?

### Implementation Discipline

**DO**:
- ✅ Write tests BEFORE or WITH feature code
- ✅ Use TypeScript strictly (no `any` types)
- ✅ Follow existing design patterns
- ✅ Add comprehensive error handling
- ✅ Test on mobile devices
- ✅ Optimize for performance
- ✅ Document complex logic

**DON'T**:
- ❌ Skip tests for "quick fixes"
- ❌ Add features outside the 3-5 core set
- ❌ Ignore performance metrics
- ❌ Deploy without testing payment flows
- ❌ Use quick hacks instead of proper solutions

---

## Example: Task Management SaaS (V1 Scope)

### ✅ V1 INCLUDES:

**Core Features** (5 complete features):

1. **Task Management** (Enhanced from MVP)
   - Create/edit/delete tasks
   - Due dates and priorities
   - Task assignments
   - Subtasks and checklists
   - File attachments

2. **Projects** (New in V1)
   - Organize tasks into projects
   - Project templates
   - Project progress tracking
   - Project archiving

3. **Team Collaboration** (New in V1)
   - Invite team members
   - Role-based permissions (Owner, Admin, Member)
   - Task comments and mentions
   - Activity feed

4. **Notifications** (New in V1)
   - Email notifications (task assignments, mentions, deadlines)
   - In-app notification center
   - Notification preferences

5. **Billing & Subscriptions** (New in V1)
   - Stripe integration
   - Free tier (5 users, 100 tasks)
   - Pro tier ($9/user/mo, unlimited)
   - Customer portal (manage subscription)

**Tech Stack**:
- Next.js 14 + TypeScript + Tailwind + shadcn/ui
- Supabase (PostgreSQL + Auth + Storage)
- Stripe (payments)
- Resend (emails)
- Sentry (errors)
- Vercel (hosting)

**Timeline**: 10-12 weeks

### ❌ V1 EXCLUDES (Save for V2):

- NO Zapier/Slack integrations
- NO custom dashboards/reports
- NO time tracking
- NO recurring tasks/automation
- NO API for developers
- NO mobile apps (web is mobile-responsive)
- NO advanced security (SOC2, SSO)
- NO white-labeling

---

## Decision Framework

### Is This V1-Appropriate?

**ASK**: Is this one of our 3-5 core features?

- ✅ **YES** → Build it professionally and completely
- ❌ **NO** → Defer to V2

**ASK**: Would customers pay for our product without this?

- ✅ **YES** → Defer to V2
- ❌ **NO** → Include and build well

**ASK**: Does this require >1 week to build professionally?

- ✅ **YES** → Simplify or defer to V2
- ❌ **NO** → Include if it's a core feature

**ASK**: Can this be a basic version vs. advanced?

- ✅ **YES** → Build basic version in V1, enhance in V2
- ❌ **NO** → Build the complete version

---

## Communication Guidelines

### When Working with AI Agents

**ALWAYS reference the constitution:**

```bash
# Good ✅
/speckit.specify Build project management following our V1 constitution. 
Include CRUD operations, team permissions, professional UI, and tests.

# Bad ❌
/speckit.specify Build a quick project management feature
```

**Be explicit about V1 requirements:**

```bash
# Good ✅
/speckit.plan Design the billing feature with Stripe integration, 
customer portal, role checks, and comprehensive error handling per V1 constitution

# Bad ❌
/speckit.plan Design basic billing
```

### Feature Request Template

When specifying a feature:

```markdown
Feature: [Feature Name]

Constitution: V1

Business Value: [Why customers need this]

User Stories: [3-5 key user journeys]

Scope:
- [Specific functionality with details]
- [Integration points]
- [Permission requirements]

Tech Stack: [Reference V1 stack from constitution]

Testing Requirements:
- Unit tests for [components]
- Integration tests for [flows]
- E2E tests for [critical paths]

Performance Targets: [Specific metrics]

Success Criteria: [Measurable outcomes]
```

---

## Upgrade Path to V2

When you're ready to move from V1 to V2:

### Step 1: Copy V2 Constitution Section

Replace the V1 section in `.specify/memory/constitution.md` with the V2 template from `.specify/templates/maturity-levels/v2-constitution.md`

### Step 2: Update Maturity Level

```bash
/speckit.constitution Use V2 maturity level for this project. Follow V2 constraints strictly.
```

### Step 3: Specify New V2 Features

```bash
/speckit.specify Add Zapier integration following our V2 constitution
/speckit.specify Add advanced analytics dashboard following our V2 constitution
```

### Step 4: Your V1 Features Stay As-Is

You DON'T need to refactor V1 code unless:
- It's blocking V2 features
- It has performance issues affecting scale
- It needs security hardening for larger customer base

---

## Constitution Version

**Version**: 1.0.0-v1  
**Maturity Level**: V1  
**Created**: 2026-01-31  
**For**: Startups building professional SaaS products
