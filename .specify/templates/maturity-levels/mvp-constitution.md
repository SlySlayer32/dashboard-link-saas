# 🟢 MVP Constitution Template (4-6 weeks)

**MATURITY_LEVEL**: MVP  
**GOAL**: Validate core value proposition with minimal scope  
**TIMELINE**: 4-6 weeks  
**TARGET**: Early adopters, proof of concept

## Philosophy

> **MVP = Fewer Features with Production Quality, NOT Incomplete Implementations**

The MVP level prioritizes **speed to validation** over completeness. Build ONE core feature exceptionally well rather than five features poorly. Manual processes are acceptable. Basic UI is sufficient. The goal is to validate your core value proposition with real users as quickly as possible.

---

## Core Constraints

### 🎯 Scope Limitations

**MUST INCLUDE**:
- ✅ ONE core feature only (the minimum to validate your value proposition)
- ✅ Basic authentication (email/password only, NO social login, NO 2FA)
- ✅ Simple CRUD operations for core entities
- ✅ Mobile-responsive UI (must work on phones)
- ✅ Basic error handling and validation

**MUST EXCLUDE** (These come in V1+):
- ❌ NO advanced features (dashboards, analytics, reports)
- ❌ NO integrations with third-party services
- ❌ NO payment/billing systems
- ❌ NO role-based access control (single user type only)
- ❌ NO real-time features (webhooks, websockets, notifications)
- ❌ NO email notifications (except password reset)
- ❌ NO advanced search or filtering
- ❌ NO file uploads (unless core to value prop)
- ❌ NO team/multi-user features

### 💻 Technology Stack

**Frontend**:
- Framework: Next.js 14 OR React + Vite
- UI Library: Tailwind CSS + shadcn/ui (NO custom component library)
- State Management: Zustand OR React Query (keep it simple)
- Forms: React Hook Form + Zod validation

**Backend**:
- API: Next.js API routes OR Hono.js (NO Express/Fastify for greenfield)
- Database: Supabase (PostgreSQL + Auth + Storage) OR PlanetScale
- ORM: Prisma OR Drizzle (NO raw SQL for MVP)
- Auth: NextAuth.js OR Supabase Auth (NO custom JWT implementation)

**Deployment**:
- Frontend: Vercel free tier
- Backend/Database: Supabase free tier OR Vercel + PlanetScale
- NO Docker, NO Kubernetes, NO self-hosting

**Data Storage**:
- Database: PostgreSQL (via Supabase/PlanetScale)
- Max 5 database tables
- NO Redis, NO caching layers
- NO background jobs/queues

### 🎨 User Experience

**UI Requirements**:
- Use shadcn/ui components ONLY (NO custom styling beyond Tailwind utilities)
- Mobile-first responsive design (must work on 375px width)
- Touch targets ≥44px
- Font size ≥16px (prevents mobile zoom)
- Basic loading states (spinner acceptable)
- Simple error messages ("Something went wrong" is OK for MVP)

**UX Simplicity**:
- Linear workflows (NO complex multi-step wizards)
- Manual data entry is OK
- Basic forms (NO advanced features like drag-drop)
- Standard browser navigation (NO custom navigation patterns)

### ⚡ Performance

**Acceptable Performance** (Good enough for MVP):
- Page load: <3s on 3G
- API responses: <1s for CRUD operations
- NO performance optimization required
- NO bundle size concerns (as long as it's reasonable)
- NO image optimization (basic compression OK)

### 🔒 Security

**MUST HAVE** (Non-negotiable):
- ✅ HTTPS only (enforced by Vercel/Supabase)
- ✅ Authentication on all protected routes
- ✅ Input validation (prevent XSS, SQL injection)
- ✅ Environment variables for secrets (NO hardcoded keys)
- ✅ Password reset flow

**CAN SKIP** (Add in V1):
- ❌ NO rate limiting
- ❌ NO 2FA/MFA
- ❌ NO audit logging
- ❌ NO advanced permission systems
- ❌ NO GDPR compliance tools (but don't violate GDPR)

### 🧪 Testing

**MUST HAVE**:
- ✅ Manual testing of happy paths
- ✅ Test authentication flow manually
- ✅ Test core feature on mobile device

**CAN SKIP** (Add in V1):
- ❌ NO automated tests (unit/integration/E2E)
- ❌ NO test coverage requirements
- ❌ NO CI/CD testing pipelines

### 📊 Observability

**MUST HAVE**:
- ✅ Console.log for debugging (acceptable for MVP)
- ✅ Basic error boundaries in React
- ✅ Unhandled error logging (Sentry free tier optional)

**CAN SKIP**:
- ❌ NO structured logging
- ❌ NO metrics/dashboards
- ❌ NO performance monitoring
- ❌ NO uptime monitoring

---

## Development Workflow

### Feature Specification

When specifying features at MVP level:

```bash
/speckit.specify Build [core feature] following our MVP constitution constraints
```

The AI will know to:
- Focus on ONE feature only
- Use basic auth patterns
- Skip advanced features
- Use shadcn/ui components
- Deploy to free tiers

### Planning Checklist

Before implementing ANY feature, verify:

- [ ] Is this the ONE core feature that validates our value prop?
- [ ] Can users complete the core workflow without this? (If yes, skip it)
- [ ] Can this be done manually instead? (If yes, do it manually)
- [ ] Does this require >5 database tables? (If yes, simplify)
- [ ] Does this add a new integration? (If yes, skip it for MVP)

### Implementation Discipline

**DO**:
- ✅ Copy-paste code if it ships faster
- ✅ Use manual processes (admin can do things manually)
- ✅ Use basic UI (professional is NOT required)
- ✅ Deploy early and often (every 2-3 days)
- ✅ Get feedback from real users ASAP

**DON'T**:
- ❌ Build "nice to have" features
- ❌ Spend >1 day on any single feature
- ❌ Optimize prematurely
- ❌ Create custom abstractions
- ❌ Build for scale you don't have

---

## Example: Task Management SaaS (MVP Scope)

### ✅ MVP INCLUDES:

**Core Feature**: Create and complete tasks

**Entities** (3 tables max):
- `users` (id, email, password_hash, created_at)
- `tasks` (id, user_id, title, description, completed, created_at)
- `sessions` (handled by Supabase Auth)

**Functionality**:
- User can sign up (email + password)
- User can sign in
- User can create a task (title + description)
- User can mark task as complete
- User can see list of all their tasks
- User can delete a task

**Tech Stack**:
- Next.js 14 + TypeScript
- Supabase (PostgreSQL + Auth)
- Tailwind CSS + shadcn/ui
- Deploy to Vercel

**Timeline**: 1 week

### ❌ MVP EXCLUDES (Save for V1):

- NO projects/categories (just a flat list)
- NO due dates or priorities
- NO task assignments (single user only)
- NO task comments or attachments
- NO email notifications
- NO task sharing or collaboration
- NO search or filters (just show all tasks)
- NO analytics or dashboards
- NO mobile app (mobile web is fine)
- NO integrations (Google Calendar, Slack, etc.)

---

## Decision Framework

### Is This MVP-Appropriate?

**ASK**: Does this feature directly validate our core value proposition?

- ✅ **YES** → Include if it can be built in <2 days
- ❌ **NO** → Defer to V1

**ASK**: Can users achieve their goal without this?

- ✅ **YES** → Defer to V1
- ❌ **NO** → Simplify and include

**ASK**: Can this be done manually by an admin?

- ✅ **YES** → Do it manually (no code needed)
- ❌ **NO** → Build the simplest version

**ASK**: Does this add meaningful complexity?

- ✅ **YES** → Find a simpler alternative or skip
- ❌ **NO** → OK to include

---

## Communication Guidelines

### When Working with AI Agents

**ALWAYS reference the constitution:**

```bash
# Good ✅
/speckit.specify Build user authentication following our MVP constitution constraints

# Bad ❌
/speckit.specify Build a professional authentication system
```

**Be explicit about constraints:**

```bash
# Good ✅
/speckit.plan Design the task management feature with max 3 database tables, 
using Supabase, shadcn/ui, and NO advanced features per MVP constitution

# Bad ❌
/speckit.plan Design the task management feature professionally
```

### Feature Request Template

When specifying a feature:

```markdown
Feature: [Feature Name]

Constitution: MVP

Core Value: [What user problem does this solve?]

Scope: [List specific functionality - keep minimal]

Explicitly Excluded: [List what NOT to build]

Tech Stack: [Reference MVP stack from constitution]

Success Criteria: [How will you know this validates your idea?]
```

---

## Upgrade Path to V1

When you're ready to move from MVP to V1:

### Step 1: Copy V1 Constitution Section

Replace the MVP section in `.specify/memory/constitution.md` with the V1 template from `.specify/templates/maturity-levels/v1-constitution.md`

### Step 2: Update Maturity Level

```bash
/speckit.constitution Use V1 maturity level for this project. Follow V1 constraints strictly.
```

### Step 3: Specify New Features

```bash
/speckit.specify Add Stripe payment integration following our V1 constitution
/speckit.specify Add role-based access control following our V1 constitution
```

### Step 4: Your MVP Features Stay As-Is

You DON'T need to refactor existing MVP code unless it's blocking V1 features. The constitution guides NEW development.

---

## Constitution Version

**Version**: 1.0.0-mvp  
**Maturity Level**: MVP  
**Created**: 2026-01-31  
**For**: Non-technical founders building their first SaaS
