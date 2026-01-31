# Example Workflows: Using Maturity Levels with Spec Kit

This document shows real-world examples of using maturity-level driven development with the Spec Kit workflow.

---

## Table of Contents

1. [MVP Workflow: Simple Task Manager](#mvp-workflow-simple-task-manager)
2. [V1 Workflow: Adding Payments & Teams](#v1-workflow-adding-payments--teams)
3. [V2 Workflow: Adding Integrations](#v2-workflow-adding-integrations)
4. [Production Workflow: Adding Enterprise SSO](#production-workflow-adding-enterprise-sso)
5. [Upgrading Between Levels](#upgrading-between-levels)

---

## MVP Workflow: Simple Task Manager

**Scenario**: You're a non-technical founder with an idea for a task management app. You want to validate the idea ASAP.

### Step 1: Set Up Constitution

```bash
# Copy MVP template
cp .specify/templates/maturity-levels/mvp-constitution.md .specify/memory/constitution.md

# Customize for your project (edit the file)
# Set PROJECT_NAME: TaskFlow
# Set CORE_VALUE_PROPOSITION: Help individuals track and complete their tasks
```

### Step 2: Initialize with AI

```bash
/speckit.constitution Use MVP maturity level for this project. 
Follow MVP constraints strictly: 1 core feature, basic auth, max 5 tables, free tiers only.
```

### Step 3: Specify Your Core Feature

```bash
/speckit.specify Build task management feature following our MVP constitution constraints.

Context: MVP level - focus on ONE core feature only

Core Feature: Users need to create tasks, mark them complete, and see their list

Scope:
- User signup/login (email + password only)
- Create task (title + description fields only)
- Mark task complete/incomplete
- View list of all tasks
- Delete task

Explicitly Excluded (defer to V1):
- NO projects or categories
- NO due dates or priorities
- NO task assignments (single user only)
- NO comments or attachments
- NO search or filtering
- NO email notifications
- NO team features

Tech Stack (per MVP constitution):
- Next.js 14 + Supabase Auth (free tier)
- Tailwind CSS + shadcn/ui
- PostgreSQL via Supabase
- Deploy to Vercel free tier

Database: Max 3 tables (users, tasks, sessions)

Success: User can create, complete, view, and delete their own tasks
```

### Step 4: Plan the Implementation

```bash
/speckit.plan Design the task management feature per MVP constitution:
- Max 3 database tables
- Use Supabase for backend
- shadcn/ui for components  
- NO advanced features
- NO automated tests (manual testing only)
- Deploy to free tiers
```

### Step 5: Generate Tasks

```bash
/speckit.tasks Break down the task management feature following MVP constraints.
Skip test tasks. Focus on core CRUD operations only. Keep it simple.
```

### Step 6: Implement

```bash
/speckit.implement Build the task management system per MVP constitution and tasks.md
```

**Result**: Working MVP in 1 week, deployed, ready for user validation.

---

## V1 Workflow: Adding Payments & Teams

**Scenario**: Your MVP is validated. 20 users love it and want to pay. Time to upgrade to V1.

### Step 1: Upgrade Constitution

```bash
# Backup current constitution
cp .specify/memory/constitution.md .specify/memory/constitution-mvp-backup.md

# Copy V1 template
cp .specify/templates/maturity-levels/v1-constitution.md .specify/memory/constitution.md

# Customize for your project (merge your PROJECT_NAME and learnings)
```

### Step 2: Update AI Context

```bash
/speckit.constitution Use V1 maturity level for this project. 
We're upgrading from MVP. Follow V1 constraints: professional quality, 
testing required, payments integration, team features allowed.
```

### Step 3: Specify Payment Feature

```bash
/speckit.specify Build Stripe payment integration following our V1 constitution.

Context: V1 level - professional product for paying customers

Feature: Subscription billing

Scope:
- Stripe integration (Checkout + Customer Portal)
- Free tier: 5 tasks, single user
- Pro tier: $9/month, unlimited tasks, team features
- Subscription management (upgrade, cancel, update payment)
- Webhook handling (subscription events)
- Role-based access (owner, member)

Tech Stack (per V1 constitution):
- Stripe (payments)
- Supabase (database + RLS for access control)
- Email notifications (Resend for receipts)
- Testing (Vitest for critical payment flows)

Success: Users can subscribe, get charged monthly, and access pro features
```

### Step 4: Specify Team Feature

```bash
/speckit.specify Build team collaboration following our V1 constitution.

Context: V1 level - enabling team workflows

Feature: Team task management

Scope:
- Create organization/team
- Invite team members (email invite)
- Assign tasks to team members
- Role-based permissions (owner, admin, member)
- See team members' tasks
- Activity feed (who did what)

Excluded (defer to V2):
- NO departments or hierarchy
- NO custom roles (just owner, admin, member)
- NO Slack integration
- NO advanced permissions

Tech Stack:
- PostgreSQL (organizations, members, task_assignments tables)
- Resend (invitation emails)
- Tests (Vitest + integration tests for invite flow)

Success: Teams can collaborate on tasks with proper permissions
```

### Step 5: Plan & Implement

```bash
# Plan payments
/speckit.plan Design Stripe integration per V1 constitution with 
comprehensive error handling, webhook verification, and testing

# Generate tasks
/speckit.tasks Break down payment implementation. Include test tasks 
(unit tests for business logic, integration tests for Stripe webhooks)

# Implement
/speckit.implement Build payment system per V1 constitution and tasks.md

# Repeat for teams
/speckit.plan Design team collaboration per V1 constitution
/speckit.tasks Break down team feature with tests
/speckit.implement Build team system per tasks.md
```

**Result**: Professional V1 product with payments and teams in 10-12 weeks. 50 paying customers.

---

## V2 Workflow: Adding Integrations

**Scenario**: You have 200 paying customers. Competitors have Zapier and Slack. Time for V2.

### Step 1: Upgrade to V2 Constitution

```bash
# Backup V1 constitution
cp .specify/memory/constitution.md .specify/memory/constitution-v1-backup.md

# Copy V2 template
cp .specify/templates/maturity-levels/v2-constitution.md .specify/memory/constitution.md
```

### Step 2: Update AI Context

```bash
/speckit.constitution Use V2 maturity level for this project.
We're at scale (200+ customers). Follow V2 constraints: integrations allowed,
API required, performance optimization needed, advanced features encouraged.
```

### Step 3: Specify Zapier Integration

```bash
/speckit.specify Build Zapier integration following our V2 constitution.

Context: V2 level - differentiation through ecosystem integration

Feature: Zapier integration for task automation

Scope:
- Zapier app with triggers and actions
- Triggers: New task created, Task completed, Task assigned
- Actions: Create task, Update task, Complete task
- OAuth 2.0 authentication
- Webhook system for real-time triggers
- Rate limiting (per organization)
- API endpoints for Zapier to consume
- Comprehensive error handling

Tech Stack (per V2 constitution):
- REST API v2 (versioned endpoints)
- Webhook delivery system (Inngest for reliability)
- OAuth 2.0 (NextAuth.js)
- Redis (rate limiting)
- Monitoring (DataDog for webhook delivery tracking)

Testing:
- Integration tests for all triggers/actions
- Webhook delivery tests
- Rate limiting tests
- OAuth flow tests

Success: Users can connect TaskFlow to 200+ apps via Zapier
```

### Step 4: Specify Analytics Dashboard

```bash
/speckit.specify Build analytics dashboard following our V2 constitution.

Context: V2 level - competitive intelligence and insights

Feature: Team productivity analytics

Scope:
- Custom dashboard builder (drag-drop widgets)
- Metrics: Tasks completed, team velocity, burndown charts
- Date range filtering
- Export reports (PDF, CSV)
- Saved dashboard configurations
- Real-time updates (optional)

Tech Stack:
- Recharts (data visualization)
- PostgreSQL (optimized queries with indexes)
- Redis (caching for metrics)
- Background jobs (Inngest for report generation)

Performance:
- Dashboard loads <2s
- Metrics calculations cached (1-hour TTL)
- Export generation async (email when ready)

Success: Teams get actionable insights into productivity
```

### Step 5: Plan & Implement

```bash
/speckit.plan Design Zapier integration per V2 constitution with 
webhook system, OAuth, rate limiting, and comprehensive monitoring

/speckit.tasks Break down Zapier integration. Include extensive tests
and performance benchmarks.

/speckit.implement Build Zapier integration per V2 constitution
```

**Result**: V2 product with integrations and analytics. 500+ customers, competitive differentiation.

---

## Production Workflow: Adding Enterprise SSO

**Scenario**: Fortune 500 companies asking for SSO. Need SOC2 compliance. Time for Production level.

### Step 1: Upgrade to Production Constitution

```bash
cp .specify/memory/constitution.md .specify/memory/constitution-v2-backup.md
cp .specify/templates/maturity-levels/production-constitution.md .specify/memory/constitution.md
```

### Step 2: Update AI Context

```bash
/speckit.constitution Use Production maturity level for this project.
We're enterprise-ready. Follow Production constraints: SSO/SAML required,
SOC2 compliance mandatory, 99.9% SLA commitment, multi-region deployment.
```

### Step 3: Specify SSO Feature

```bash
/speckit.specify Build SSO/SAML integration following our Production constitution.

Context: Production level - enterprise authentication requirements

Feature: Enterprise SSO (SAML 2.0)

Scope:
- SAML 2.0 authentication
- Support for Okta, Azure AD, OneLogin
- SCIM provisioning (auto-create users from IdP)
- JIT (Just-in-Time) provisioning
- Custom claim mapping
- Multi-domain support (multiple IdPs per organization)
- SSO enforcement options (require SSO for organization)
- Audit logging (all SSO events)
- Admin dashboard for SSO configuration

Security:
- Certificate rotation support
- Encrypted SAML assertions
- Signed requests/responses
- IP whitelisting per IdP
- Comprehensive audit trail (immutable logs)

Tech Stack (per Production constitution):
- WorkOS (enterprise auth platform) OR Auth0 Enterprise
- Multi-region database (audit logs in all regions)
- Advanced monitoring (track SSO success/failure rates)

Compliance:
- SOC2 controls: Authentication, access control
- GDPR: Consent management for SSO data
- Documentation: Security policies, procedures

Testing:
- Integration tests with Okta test tenant
- Security tests (certificate validation, assertion verification)
- Performance tests (handle 1000 concurrent SSO logins)
- Disaster recovery tests (failover scenarios)

Success: Enterprises can authenticate via their IdP, meeting security requirements
```

### Step 4: Specify GDPR Compliance

```bash
/speckit.specify Build GDPR compliance dashboard following our Production constitution.

Context: Production level - legal and compliance requirements

Feature: GDPR compliance tools

Scope:
- Data export (user requests full data export)
- Data deletion (right to be forgotten workflows)
- Consent management (track and update consents)
- Data processing agreements (DPA signing flow)
- Privacy policy management
- Breach notification system
- Data retention policies (automated deletion)
- Audit logs (all data access logged)

Admin Features:
- GDPR dashboard (pending requests, SLA tracking)
- Automated workflows (export/deletion)
- Compliance reporting
- Legal documentation generation

Tech Stack:
- Automated workflows (Temporal for long-running processes)
- Immutable audit logs (write-only database)
- Email notifications (legal team alerts)
- Multi-region support (EU data stays in EU)

Compliance:
- SOC2: Data lifecycle management
- GDPR: All requirements met
- Legal review: All templates approved

Success: Full GDPR compliance, enterprise customers satisfied
```

### Step 5: Plan & Implement

```bash
/speckit.plan Design SSO integration per Production constitution with 
multi-IdP support, security hardening, compliance documentation, and DR testing

/speckit.tasks Break down SSO implementation. Include security tests,
compliance verification, and multi-region deployment tasks.

/speckit.implement Build SSO system per Production constitution
```

**Result**: Production-grade enterprise platform. 2000+ customers including Fortune 500. $500K+ MRR.

---

## Upgrading Between Levels

### Pattern for All Upgrades

1. **Backup current constitution**
   ```bash
   cp .specify/memory/constitution.md .specify/memory/constitution-[old-level]-backup.md
   ```

2. **Copy new level template**
   ```bash
   cp .specify/templates/maturity-levels/[new-level]-constitution.md .specify/memory/constitution.md
   ```

3. **Merge customizations** (edit file manually)
   - Keep your PROJECT_NAME
   - Keep your learnings/deviations
   - Keep project-specific constraints

4. **Update AI**
   ```bash
   /speckit.constitution Use [new-level] maturity level for this project.
   We're upgrading from [old-level]. Follow [new-level] constraints.
   ```

5. **Specify new features**
   ```bash
   /speckit.specify Build [feature] following our [new-level] constitution
   ```

---

## Best Practices Across All Levels

### Always Be Explicit

```bash
# Good ✅
/speckit.specify Build authentication following our MVP constitution: 
email/password only, NextAuth.js, max 3 tables, NO social login, NO 2FA

# Bad ❌
/speckit.specify Build authentication
```

### Reference Constitution Every Time

Even if you think the AI "should remember," reference it:

```bash
/speckit.plan Design [feature] per [level] constitution
/speckit.tasks Break down [feature] following [level] constraints  
/speckit.implement Build [feature] per [level] constitution and tasks.md
```

### Check Before Changing Levels

Don't upgrade prematurely:

- **MVP → V1**: Get 10+ users willing to pay
- **V1 → V2**: Get 100+ paying customers
- **V2 → Production**: Get enterprise customers asking for SSO/compliance

### Document Deviations

If you must break a constraint, document it in your constitution:

```markdown
## Project-Specific Deviations

### File Uploads in MVP
Standard MVP excludes file uploads, but our product is a document 
collaboration tool, so uploads are core to validation.

Modified constraint: Include basic file uploads in MVP (PDF/DOCX only, <5MB).
```

---

## Troubleshooting Common Issues

### Issue: AI Still Over-Engineers

**Problem**: Even with constitution, AI suggests complex solutions.

**Solution**: Be even more explicit:

```bash
/speckit.specify Build simple task list following MVP constitution.
SIMPLE means: 
- Just title and description fields (NO priorities, tags, dates)
- Just create, complete, delete (NO edit, NO archive, NO restore)
- Just one flat list (NO projects, NO categories, NO filters)
- NO integrations, NO automation, NO advanced features
Keep it minimal.
```

### Issue: Not Sure What Level to Use

**Problem**: Between MVP and V1? Between V1 and V2?

**Solution**: Use this decision tree:

```
Do you have paying customers?
├─ NO → MVP
└─ YES → How many?
   ├─ <100 → V1
   ├─ 100-500 → V2
   └─ 500+ → Need enterprise features?
      ├─ NO → Stay V2
      └─ YES → Production
```

### Issue: Features Don't Fit One Level

**Problem**: Want "basic notifications" but you're at MVP.

**Solution**: Build MVP version of the feature:

**MVP Notifications**: In-app toasts only (no email)  
**V1 Notifications**: Email notifications for key events  
**V2 Notifications**: Email + in-app + Slack + custom rules

---

## Summary

Maturity-level driven development with Spec Kit gives you:

1. **Clear Constraints**: No more guessing what to build
2. **Consistent Quality**: All features at same maturity level
3. **Efficient Development**: Build exactly what you need, nothing more
4. **Easy Upgrades**: Clear path from MVP → V1 → V2 → Production

**Key Takeaway**: Always reference your maturity level constitution in every Spec Kit command. Your AI team will build exactly what you need. 🚀

---

## Resources

- **Constitution Templates**: `.specify/templates/maturity-levels/`
- **Complete Guide**: `.specify/docs/MATURITY_LEVELS_GUIDE.md`
- **Your Constitution**: `.specify/memory/constitution.md`
