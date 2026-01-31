# Maturity-Level Driven Development Guide

## Overview

This directory contains **maturity-level constitution templates** that help non-technical founders and AI development teams build SaaS products with clear, concrete constraints at each stage of development.

## The Problem This Solves

**Before Maturity Levels** ❌:
- Vague requirements like "build a professional app"
- AI agents guess what level of polish you want
- Feature creep and over-engineering
- Unclear what to build vs. what to skip
- Mixed quality across features

**With Maturity Levels** ✅:
- Concrete constraints for each development stage
- AI agents know exactly what to build and skip
- Clear upgrade path from MVP → V1 → V2 → Production
- Consistent quality within each maturity level
- No guessing about tech stack or architecture

---

## The 4 Maturity Levels

### 🟢 MVP (4-6 weeks)
**Goal**: Validate core value proposition  
**Target**: Early adopters, proof of concept  
**Features**: ONE core feature, basic auth, simple UI  
**Tech**: Free tiers (Vercel, Supabase), no integrations  
**Quality**: Working code, manual processes OK  

**Use MVP when**:
- Starting a new product idea
- Testing market fit
- Need to validate ASAP
- Limited budget/time

**Template**: [`mvp-constitution.md`](./mvp-constitution.md)

---

### 🔵 V1 (10-14 weeks)
**Goal**: Professional product for paying customers  
**Target**: 100-500 paying customers  
**Features**: 3-5 complete features, payments, teams  
**Tech**: Pro tiers, monitoring, email, testing  
**Quality**: Production-ready, polished, tested  

**Use V1 when**:
- MVP validated, customers ready to pay
- Need professional quality
- Building real business
- Expanding feature set

**Template**: [`v1-constitution.md`](./v1-constitution.md)

---

### 🟣 V2 (18-24 weeks)
**Goal**: Competitive differentiation and scale  
**Target**: 500-2000 customers  
**Features**: 8-12 features, integrations, API, analytics  
**Tech**: Auto-scaling, advanced monitoring, performance optimization  
**Quality**: Competitive, differentiated, scalable  

**Use V2 when**:
- Growing customer base
- Competing with established players
- Need integrations (Zapier, Slack)
- Performance matters

**Template**: [`v2-constitution.md`](./v2-constitution.md)

---

### 🔴 PRODUCTION (26+ weeks)
**Goal**: Enterprise-ready, compliant, highly available  
**Target**: 2000+ customers including enterprises  
**Features**: Enterprise features (SSO, compliance, white-labeling)  
**Tech**: Multi-region, Kubernetes, SOC2, GDPR tools  
**Quality**: Enterprise-grade, certified, 99.9% SLA  

**Use Production when**:
- Selling to enterprises
- Need compliance (SOC2, GDPR, HIPAA)
- Require high availability SLAs
- White-labeling needed

**Template**: [`production-constitution.md`](./production-constitution.md)

---

## How to Use

### Step 1: Choose Your Maturity Level

**Start with MVP unless**:
- ✅ You already have paying customers → V1
- ✅ You're competing at scale → V2
- ✅ You need enterprise features → Production

**When in doubt, choose MVP**. You can always upgrade later.

### Step 2: Copy the Template

```bash
# Copy the appropriate template to your constitution file
cp .specify/templates/maturity-levels/mvp-constitution.md .specify/memory/constitution.md
```

### Step 3: Customize for Your Project

Edit `.specify/memory/constitution.md` and customize:

```markdown
# Replace PROJECT_NAME throughout
PROJECT_NAME: YourSaaSName

# Add any project-specific constraints
# Example for MVP:
TECH_STACK_ADDITIONS:
- We MUST use React (founder knows it)
- We prefer Shadcn/ui (modern, clean)

FEATURE_EXCLUSIONS:
- NO social media features (not our market)
- NO mobile app (web-only for MVP)
```

### Step 4: Initialize with AI

Tell your AI team about the maturity level:

```bash
/speckit.constitution Use MVP maturity level for this project. Follow constraints strictly.
```

### Step 5: Specify Features with Context

Now when you specify features, reference the constitution:

```bash
/speckit.specify Build user authentication following our MVP constitution constraints
```

The AI will know:
- ✅ Email/password only (NO social login)
- ✅ Use NextAuth.js or Supabase Auth
- ✅ Password reset required but simple
- ❌ NO 2FA (that's V1+)
- ❌ NO role-based access (that's V1+)

---

## Upgrading Between Levels

### MVP → V1 Upgrade

**When to upgrade**:
- MVP validated with real users
- Have paying customers or commitments
- Need professional quality
- Budget for pro-tier services

**How to upgrade**:

1. **Copy V1 template**:
```bash
cp .specify/templates/maturity-levels/v1-constitution.md .specify/memory/constitution.md
```

2. **Update AI context**:
```bash
/speckit.constitution Use V1 maturity level. Follow V1 constraints strictly.
```

3. **Specify new features**:
```bash
/speckit.specify Add Stripe payment integration following our V1 constitution
/speckit.specify Add role-based access control following our V1 constitution
```

4. **Your MVP code stays as-is** (unless it blocks V1 features)

---

### V1 → V2 Upgrade

**When to upgrade**:
- 100+ paying customers
- Need competitive differentiation
- Want integrations (Zapier, Slack)
- Performance optimization needed

**How to upgrade**:

1. **Copy V2 template**:
```bash
cp .specify/templates/maturity-levels/v2-constitution.md .specify/memory/constitution.md
```

2. **Update AI context**:
```bash
/speckit.constitution Use V2 maturity level. Follow V2 constraints strictly.
```

3. **Specify advanced features**:
```bash
/speckit.specify Add Zapier integration following our V2 constitution
/speckit.specify Build custom analytics dashboard following our V2 constitution
```

---

### V2 → Production Upgrade

**When to upgrade**:
- 500+ customers
- Selling to enterprises
- Need compliance (SOC2, GDPR)
- Require SLA commitments

**How to upgrade**:

1. **Copy Production template**:
```bash
cp .specify/templates/maturity-levels/production-constitution.md .specify/memory/constitution.md
```

2. **Update AI context**:
```bash
/speckit.constitution Use Production maturity level. Follow Production constraints strictly.
```

3. **Specify enterprise features**:
```bash
/speckit.specify Add SSO/SAML following our Production constitution
/speckit.specify Implement SOC2 compliance controls following our Production constitution
```

---

## Communication Patterns

### ✅ Good: Explicit Maturity Reference

```bash
# Specification
/speckit.specify Build task management following our MVP constitution

# Planning
/speckit.plan Design authentication using NextAuth, max 3 tables, per MVP constitution

# Clarification
/speckit.clarify What authentication methods are allowed under MVP constraints?

# Implementation
/speckit.implement Build the task CRUD following MVP tech stack and constraints
```

### ❌ Bad: Vague or Maturity-Agnostic

```bash
# Too vague - AI will guess
/speckit.specify Build a professional authentication system

# Contradicts MVP - will get pushback
/speckit.specify Build authentication with SSO and 2FA

# No context - AI won't know limits
/speckit.plan Design the task management feature
```

---

## Decision Framework

### Should I include this feature?

Use this flowchart for ANY feature decision:

```
Is this feature in my current maturity level template?
├─ YES → Build it according to template constraints
└─ NO → Ask: Is this critical for my current goal?
   ├─ YES → Ask: Can I build a simpler version that fits?
   │  ├─ YES → Build the simplified version
   │  └─ NO → Defer to next maturity level
   └─ NO → Defer to next maturity level
```

### Examples

**Feature**: "Add file uploads"
- **MVP**: Is this core to value prop? If NO → Skip. If YES → Basic upload only (no preview, no processing)
- **V1**: Include with preview, validation, size limits
- **V2**: Add image processing, CDN, multiple formats
- **Production**: Add virus scanning, compliance controls, audit logging

**Feature**: "Add notifications"
- **MVP**: Skip (manual processes OK)
- **V1**: Email notifications for key events
- **V2**: Email + in-app + Slack integration
- **Production**: Add SMS, custom channels, notification preferences

---

## Tips for Success

### 1. Always Start with MVP
You can upgrade later, but you can't un-build complexity. Start small.

### 2. Be Ruthlessly Specific
❌ "Professional UI" → Vague  
✅ "shadcn/ui components with Tailwind" → Specific

### 3. Reference Constitution in EVERY Command
The AI needs constant reminders about constraints.

### 4. Update Constitution as You Learn
After building 5 features, you'll spot patterns. Add them to your constitution.

### 5. One Maturity Level at a Time
Don't mix MVP auth with V2 analytics. Keep it consistent.

### 6. Document Deviations
If you MUST violate a constraint, document why in your constitution.

### 7. Validate Before Upgrading
Don't move to V1 until MVP is validated. Don't move to V2 until V1 has customers.

---

## Common Questions

### Q: Can I mix maturity levels?
**A**: No. Pick one level and stick to it for all new features. Mixed maturity leads to inconsistent quality.

### Q: What if my project doesn't fit these templates?
**A**: These are starting points. Customize them for your needs, but keep the core philosophy (concrete constraints, clear boundaries).

### Q: Do I have to follow every constraint?
**A**: The constraints are designed to prevent common pitfalls. If you deviate, document WHY in your constitution and accept the risk.

### Q: Can I skip levels (MVP → V2)?
**A**: Not recommended. Each level builds on the previous. Skipping means you'll miss important foundations.

### Q: How do I know when to upgrade?
**A**: 
- MVP → V1: When you have paying customers or commitments
- V1 → V2: When you have 100+ customers and need differentiation
- V2 → Production: When enterprises are asking for SSO/compliance

### Q: What if AI suggests features outside my maturity level?
**A**: Remind it: "That feature is in V1/V2/Production, but we're at MVP. Follow MVP constraints."

---

## Examples by Industry

### SaaS Project Management (like Asana, Linear)
- **MVP**: Create tasks, mark complete, view list
- **V1**: Projects, teams, assignments, billing
- **V2**: Gantt charts, automation, integrations (Slack, GitHub)
- **Production**: SSO, white-labeling, SOC2

### SaaS CRM (like HubSpot, Salesforce)
- **MVP**: Add contacts, log interactions, view history
- **V1**: Deals, pipeline, team collaboration, email integration
- **V2**: Custom fields, automation, Zapier, reporting
- **Production**: SSO, GDPR tools, custom objects, API

### SaaS Scheduling (like Calendly)
- **MVP**: Set availability, book meetings, send email confirmation
- **V1**: Team scheduling, payments, integrations (Google/Outlook Calendar)
- **V2**: Custom branding, workflows, Zapier, analytics
- **Production**: SSO, white-labeling, enterprise team features

---

## Related Documentation

- **Constitution Guide**: [`.specify/memory/constitution.md`](../memory/constitution.md) - Your active constitution
- **Spec Template**: [`.specify/templates/spec-template.md`](../spec-template.md) - How to write feature specs
- **Plan Template**: [`.specify/templates/plan-template.md`](../plan-template.md) - How to plan implementations
- **Tasks Template**: [`.specify/templates/tasks-template.md`](../tasks-template.md) - How to break down work

---

## Support

If you have questions about maturity levels:
1. Read the specific template for your level
2. Check the examples in this README
3. Ask your AI team: "What does our [MVP/V1/V2/Production] constitution say about [topic]?"

---

**Remember**: These maturity levels exist to help you build the RIGHT product at the RIGHT time. Start small, validate, then grow. 🚀
