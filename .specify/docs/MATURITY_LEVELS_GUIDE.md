# Maturity-Level Driven Development: Complete Guide

**For**: Non-technical founders building SaaS products with AI development teams

---

## Table of Contents

1. [Introduction](#introduction)
2. [The Problem We're Solving](#the-problem-were-solving)
3. [The Solution: Maturity Keywords](#the-solution-maturity-keywords)
4. [Quick Start (5 Minutes)](#quick-start-5-minutes)
5. [Deep Dive: The 4 Maturity Levels](#deep-dive-the-4-maturity-levels)
6. [Real-World Example: TaskFlow SaaS](#real-world-example-taskflow-saas)
7. [How to Use with AI Teams](#how-to-use-with-ai-teams)
8. [Upgrading Between Levels](#upgrading-between-levels)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

If you're a non-technical founder working with AI development teams (GitHub Copilot, Windsurf, Claude), you've likely experienced this frustration:

**You**: "Build authentication for the app"  
**AI**: *Builds enterprise SSO with 2FA, SAML, OAuth, audit logging, and 15 database tables*

You wanted simple email/password login. The AI gave you NASA-level security.

**This guide solves that problem.**

---

## The Problem We're Solving

### Before: Vague Specifications Lead to Wrong Solutions

When you tell AI to build something "professionally" or "with good UX," the AI must guess:
- How polished should it be?
- What features to include vs. skip?
- What tech stack to use?
- How much testing is needed?
- What's "good enough" vs. over-engineered?

**Result**: Inconsistent quality, feature creep, and wasted time.

### After: Concrete Constraints Lead to Exact Solutions

With maturity-level constitutions, you say:

**You**: "Build authentication following our MVP constitution"  
**AI Knows**:
- ✅ Email/password only
- ✅ Use NextAuth.js or Supabase Auth
- ✅ Simple password reset
- ❌ NO social login (that's V1)
- ❌ NO 2FA (that's V1)
- ❌ NO role-based access (that's V1)

**Result**: Exactly what you need, nothing you don't.

---

## The Solution: Maturity Keywords

We've created **4 keyword-based maturity levels** that act as your AI project manager:

| Level | Timeline | Goal | Example Features |
|-------|----------|------|------------------|
| 🟢 **MVP** | 4-6 weeks | Validate idea | 1 core feature, basic auth, simple UI |
| 🔵 **V1** | 10-14 weeks | Get paying customers | 3-5 features, payments, teams, polish |
| 🟣 **V2** | 18-24 weeks | Compete at scale | 8-12 features, integrations, analytics |
| 🔴 **PRODUCTION** | 26+ weeks | Enterprise-ready | SSO, compliance, SLA, white-labeling |

Each level has a **constitution template** with concrete constraints that AI teams understand and follow.

---

## Quick Start (5 Minutes)

### Step 1: Choose Your Maturity Level

**Are you just starting?** → Choose **MVP**  
**Have paying customers?** → Choose **V1**  
**Competing with established players?** → Choose **V2**  
**Selling to enterprises?** → Choose **PRODUCTION**

**When in doubt, start with MVP.**

### Step 2: Copy the Constitution Template

```bash
# Navigate to your project
cd your-saas-project

# Copy the MVP template (adjust for your level)
cp .specify/templates/maturity-levels/mvp-constitution.md .specify/memory/constitution.md
```

### Step 3: Customize for Your Project

Edit `.specify/memory/constitution.md` and add:

```markdown
PROJECT_NAME: YourSaaSName

CORE_VALUE_PROPOSITION: [One sentence: what problem you solve]

TECH_STACK_PREFERENCES:
- [Any specific technologies you want/need]

FEATURE_EXCLUSIONS:
- [Features you definitely DON'T want]
```

### Step 4: Initialize with Your AI Team

```bash
# Tell your AI about the constitution
/speckit.constitution Use MVP maturity level for this project. Follow constraints strictly.
```

### Step 5: Start Specifying Features

```bash
# Now specify features with context
/speckit.specify Build user authentication following our MVP constitution constraints
```

**Done!** Your AI team now knows exactly what to build.

---

## Deep Dive: The 4 Maturity Levels

### 🟢 MVP: Minimum Viable Product

**Philosophy**: Speed to validation over completeness

**When to Use**:
- Starting a new product
- Testing market fit
- Limited budget (<$1000/mo)
- Need to validate ASAP

**What You Build**:
- ✅ ONE core feature
- ✅ Basic email/password auth
- ✅ Simple CRUD operations
- ✅ Mobile-responsive UI (basic)
- ✅ Deploy to free tiers

**What You Skip**:
- ❌ Advanced features
- ❌ Integrations
- ❌ Payments (unless core to validation)
- ❌ Teams/collaboration
- ❌ Email notifications
- ❌ Automated tests

**Tech Stack**:
- Frontend: Next.js + Tailwind + shadcn/ui
- Backend: Supabase (free tier)
- Deploy: Vercel (free tier)
- Max 5 database tables

**Example**: Task management app where users can create tasks, mark them complete, and see a list. That's it.

**Timeline**: 4-6 weeks

**Cost**: ~$0-100/month

**Template**: [`.specify/templates/maturity-levels/mvp-constitution.md`](../templates/maturity-levels/mvp-constitution.md)

---

### 🔵 V1: Version 1 (Professional Product)

**Philosophy**: Complete, polished product ready for paying customers

**When to Use**:
- MVP validated with users
- Ready to charge money
- Need professional quality
- Budget for pro services ($50-100/mo)

**What You Build**:
- ✅ 3-5 complete features
- ✅ Professional UI/UX
- ✅ Stripe payment integration
- ✅ Role-based access (admin, user)
- ✅ Email notifications
- ✅ Team collaboration
- ✅ Search and filtering
- ✅ Automated tests

**What You Skip**:
- ❌ Advanced integrations (Zapier, Slack)
- ❌ Custom dashboards
- ❌ White-labeling
- ❌ SSO/SAML
- ❌ Mobile apps (web is responsive)

**Tech Stack**:
- Frontend: Next.js + TypeScript + Tailwind
- Backend: Supabase Pro ($25/mo)
- Payments: Stripe
- Email: Resend
- Testing: Vitest + Playwright
- Deploy: Vercel Pro ($20/mo)

**Example**: Task management with projects, team members, assignments, due dates, Stripe billing.

**Timeline**: 10-14 weeks

**Cost**: ~$50-150/month

**Template**: [`.specify/templates/maturity-levels/v1-constitution.md`](../templates/maturity-levels/v1-constitution.md)

---

### 🟣 V2: Competitive & Scalable

**Philosophy**: Differentiation and scale

**When to Use**:
- 100+ paying customers
- Need competitive features
- Integrations critical
- Performance matters

**What You Build**:
- ✅ 8-12 features
- ✅ Zapier, Slack integrations
- ✅ Custom analytics
- ✅ Public API
- ✅ Advanced automation
- ✅ Performance optimization
- ✅ Advanced search

**What You Skip**:
- ❌ SSO/SAML
- ❌ SOC2 compliance
- ❌ White-labeling
- ❌ Enterprise SLAs

**Tech Stack**:
- Frontend: Next.js + advanced patterns
- Backend: PostgreSQL + read replicas
- Cache: Redis (Upstash)
- Queue: Inngest or BullMQ
- Monitoring: DataDog or New Relic
- Infrastructure: Auto-scaling enabled

**Example**: Task management + Gantt charts + time tracking + Zapier + Slack + GitHub integration + custom reports.

**Timeline**: 18-24 weeks

**Cost**: ~$200-500/month

**Template**: [`.specify/templates/maturity-levels/v2-constitution.md`](../templates/maturity-levels/v2-constitution.md)

---

### 🔴 PRODUCTION: Enterprise-Ready

**Philosophy**: Enterprise-grade, compliant, highly available

**When to Use**:
- 500+ customers
- Selling to enterprises
- Need SOC2/GDPR compliance
- SLA requirements

**What You Build**:
- ✅ All V2 features +
- ✅ SSO/SAML (Okta, Azure AD)
- ✅ SOC2 Type II compliance
- ✅ GDPR/CCPA tools
- ✅ White-labeling
- ✅ 99.9% SLA
- ✅ Multi-region deployment
- ✅ Advanced security
- ✅ 24/7 support

**Tech Stack**:
- Infrastructure: Kubernetes (AWS/GCP)
- Database: Multi-region PostgreSQL
- Monitoring: Enterprise APM
- Security: WAF, DDoS protection
- Compliance: SOC2, GDPR tooling

**Example**: Full enterprise task management with SSO, compliance dashboard, audit logs, white-labeling, dedicated infrastructure.

**Timeline**: 26+ weeks (ongoing)

**Cost**: ~$1000-5000+/month

**Template**: [`.specify/templates/maturity-levels/production-constitution.md`](../templates/maturity-levels/production-constitution.md)

---

## Real-World Example: TaskFlow SaaS

Let's see how you'd build a task management SaaS at each level.

### 🟢 MVP TaskFlow (4-6 weeks)

**Goal**: Validate that people want a simple task manager

**Features**:
1. User signup/login (email + password)
2. Create a task (title + description)
3. Mark task complete/incomplete
4. View list of all tasks
5. Delete task

**Tech**:
- Next.js 14 + Supabase (free tier)
- shadcn/ui components
- Deploy to Vercel

**Database** (3 tables):
```
users: id, email, password_hash, created_at
tasks: id, user_id, title, description, completed, created_at
```

**What We Skip**:
- NO projects or categories
- NO due dates or priorities
- NO team features
- NO search or filters
- NO payment (it's free to validate)

**Result**: Working product in 1 week, validated with 10 users.

---

### 🔵 V1 TaskFlow (10-14 weeks)

**Goal**: Build a professional product people pay for

**Features** (5 complete features):
1. **Tasks** (enhanced): Due dates, priorities, subtasks, attachments
2. **Projects**: Organize tasks into projects
3. **Teams**: Invite members, assign tasks, permissions
4. **Notifications**: Email alerts for assignments, deadlines
5. **Billing**: Stripe integration, $9/user/month

**Tech**:
- Next.js 14 + TypeScript
- Supabase Pro
- Stripe (payments)
- Resend (emails)
- Vitest (testing)

**Database** (12 tables):
```
users, tasks, projects, project_members, 
task_assignments, comments, attachments,
organizations, organization_members,
subscriptions, invoices, notifications
```

**Result**: Professional product with 50 paying customers in 3 months.

---

### 🟣 V2 TaskFlow (18-24 weeks)

**Goal**: Compete with Asana and Linear

**Features** (12 features):
- All V1 features enhanced +
- Gantt charts
- Time tracking
- Automation rules
- Zapier integration (sync with 200+ apps)
- Slack integration
- GitHub issue sync
- Advanced analytics
- Custom dashboards
- Public API
- Mobile apps (iOS + Android)

**Tech**:
- PostgreSQL + read replicas
- Redis caching
- Inngest (background jobs)
- DataDog (monitoring)
- Auto-scaling infrastructure

**Result**: 500 customers, $45K MRR, competing with established players.

---

### 🔴 PRODUCTION TaskFlow (26+ weeks)

**Goal**: Win enterprise customers (Fortune 500)

**Features**:
- All V2 features +
- SSO/SAML (Okta, Azure AD)
- SCIM provisioning
- SOC2 Type II certified
- GDPR compliance dashboard
- White-labeling (custom domain per customer)
- 99.9% SLA with credits
- Multi-region deployment
- Advanced audit logging
- 24/7 dedicated support

**Tech**:
- Kubernetes on AWS (multi-region)
- Enterprise monitoring stack
- SIEM for security
- Compliance automation

**Result**: 2000+ customers including enterprises, $500K+ MRR.

---

## How to Use with AI Teams

### Command Patterns

#### ✅ Good: Always Reference Constitution

```bash
# Specification
/speckit.specify Build user authentication following our MVP constitution constraints

# Planning
/speckit.plan Design the task management feature per MVP constitution: 
max 3 tables, Supabase, shadcn/ui, NO advanced features

# Clarification
/speckit.clarify What authentication methods are allowed under MVP constraints?

# Tasks
/speckit.tasks Break down auth implementation following MVP tech stack

# Implementation
/speckit.implement Build the auth system per MVP constitution
```

#### ❌ Bad: Vague or No Context

```bash
# Too vague - AI will guess
/speckit.specify Build authentication

# Contradicts maturity level
/speckit.specify Build auth with SSO and 2FA  # This is Production, not MVP!

# No constraints
/speckit.plan Design authentication system  # What level? What tech?
```

### Feature Request Template

Use this template every time:

```markdown
Feature: [Name]

Maturity Level: [MVP/V1/V2/PRODUCTION]

Context: Following our [level] constitution

Core Value: [What problem this solves]

Scope:
- [Specific functionality]
- [Explicitly what NOT to build]

Tech Stack: [From constitution]

Success: [How to know it works]
```

---

## Best Practices

### 1. ✅ Start with MVP, Always

Even if you "know" you'll need V1 features eventually, start with MVP to:
- Validate your idea faster
- Learn what users actually need
- Avoid building features nobody wants

**Exception**: You already have paying customers waiting.

### 2. ✅ Be Ruthlessly Specific

Vague constraints don't help. Compare:

❌ **Vague**: "Build a professional UI"  
✅ **Specific**: "Use shadcn/ui components with Tailwind CSS"

### 3. ✅ Reference Constitution in EVERY Command

AI needs constant reminders. Don't assume it remembers.

### 4. ✅ Update Constitution as You Learn

After building 5-10 features, add patterns to your constitution.

### 5. ✅ One Maturity Level at a Time

Don't mix levels. If you're at MVP, ALL features should be MVP-level.

---

## Troubleshooting

### Problem: AI Suggests Features Outside My Maturity Level

**Solution**: Remind it explicitly:

```
Zapier integration is a V2 feature, but we're at MVP maturity level. 
Follow MVP constraints from our constitution. Skip integrations for now.
```

### Problem: AI Builds Over-Engineered Solutions

**Solution**: Be more specific about constraints in your request.

### Problem: Not Sure What Maturity Level to Choose

Use the decision tree in the templates README.

---

## Next Steps

1. Choose Your Maturity Level
2. Read the Full Template
3. Copy and Customize
4. Initialize with AI
5. Start Building

---

## Resources

- **Templates**: [`.specify/templates/maturity-levels/`](../templates/maturity-levels/)
- **Quick Reference**: [`.specify/templates/maturity-levels/README.md`](../templates/maturity-levels/README.md)
- **Your Constitution**: [`.specify/memory/constitution.md`](../memory/constitution.md)
