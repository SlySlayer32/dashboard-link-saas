# 🔴 PRODUCTION Constitution Template (26+ weeks)

**MATURITY_LEVEL**: PRODUCTION  
**GOAL**: Enterprise-ready, compliant, scalable  
**TIMELINE**: 26+ weeks  
**TARGET**: 2000+ customers including enterprises

## Philosophy

> **Production = Enterprise-Grade, Compliant, Highly Available**

Production level is about **enterprise readiness**. You have a mature product (V2) serving hundreds of customers. Now you're adding enterprise features that large organizations require: SSO, compliance certifications, SLAs, dedicated support, and advanced security. You're building a platform that enterprises trust with their critical business data.

---

## Core Constraints

### 🎯 Scope Limitations

**MUST INCLUDE**:
- ✅ All V2 features plus enterprise requirements
- ✅ SSO/SAML authentication
- ✅ GDPR/CCPA/SOC2 compliance tools
- ✅ Advanced security (penetration testing, bug bounty)
- ✅ White-labeling and multi-tenancy
- ✅ Enterprise SLAs (99.9%+ uptime)
- ✅ Dedicated support (24/7 for enterprise)
- ✅ Advanced admin controls (audit logs, data retention policies)
- ✅ Data residency options (EU, US, etc.)
- ✅ Advanced disaster recovery (RTO <1hr, RPO <5min)
- ✅ Custom contracts and pricing
- ✅ Professional services (onboarding, training)

**PRODUCTION-SPECIFIC**:
- ✅ Auto-scaling infrastructure
- ✅ Multi-region deployment
- ✅ Advanced monitoring and alerting
- ✅ Incident response procedures
- ✅ Security certifications
- ✅ Legal and compliance documentation
- ✅ Enterprise sales process

### 💻 Technology Stack

**Frontend**:
- Framework: Next.js 14 + TypeScript (strict, no compromises)
- UI Library: Custom design system built on shadcn/ui
- State Management: Advanced patterns (Zustand + Jotai + TanStack Query)
- Testing: Comprehensive (Vitest + Playwright + Visual regression)
- Performance: Edge optimization, advanced caching

**Backend**:
- API: Versioned GraphQL + REST (v1, v2, v3)
- Database: PostgreSQL with multi-region replication
- ORM: Prisma with advanced optimizations
- Auth: NextAuth.js + SAML/SSO provider (WorkOS, Auth0 Enterprise)
- Payments: Stripe Advanced (invoicing, contracts, metered billing)
- Queue: Advanced queue system (BullMQ, SQS, or Temporal)
- Cache: Multi-layer caching (Redis, CDN, edge)

**Deployment**:
- Multi-region deployment (AWS, GCP, or Azure)
- Kubernetes (EKS, GKE, or AKS)
- Infrastructure as Code (Terraform, Pulumi)
- CI/CD: GitHub Actions + advanced testing
- Blue-green deployments
- Canary releases

**Infrastructure**:
- Auto-scaling (horizontal and vertical)
- Load balancing (global, regional)
- CDN: Cloudflare Enterprise or AWS CloudFront
- Database: Aurora Global or CockroachDB (multi-region)
- Monitoring: DataDog Enterprise or New Relic
- Logging: ELK stack or Splunk
- Security: WAF, DDoS protection, SIEM

### 🎨 User Experience

**UI Requirements**:
- Enterprise-grade design
- Full white-labeling support
- Custom branding per tenant
- Advanced accessibility (WCAG AAA)
- Multi-language support (i18n)
- Right-to-left (RTL) support
- High-contrast mode
- Screen reader optimization

**Enterprise UX**:
- Admin dashboards for enterprise customers
- Detailed usage analytics per department
- Custom reporting and data exports
- Bulk operations and imports
- Advanced permissions and delegations
- Compliance reporting interfaces

### ⚡ Performance

**REQUIRED Performance Targets**:
- Page load: <1s on 3G (Lighthouse score >98)
- API responses: <100ms p50, <300ms p99
- Global CDN: <50ms for static assets
- Database queries: <50ms p99
- Time to Interactive (TTI): <1.5s
- First Contentful Paint (FCP): <0.8s

**Performance Infrastructure**:
- Multi-region edge caching
- Global load balancing
- Database read replicas in each region
- Redis cluster for caching
- CDN with edge compute
- Query optimization and monitoring

### 🔒 Security

**MUST HAVE** (Non-negotiable):
- ✅ SSO/SAML (Okta, Azure AD, OneLogin)
- ✅ MFA/2FA enforcement options
- ✅ Advanced encryption (at rest, in transit, in use)
- ✅ SOC2 Type II certification
- ✅ GDPR compliance tools (data export, deletion, consent)
- ✅ CCPA compliance
- ✅ HIPAA compliance (if applicable)
- ✅ Penetration testing (annual)
- ✅ Bug bounty program
- ✅ Security incident response plan
- ✅ Advanced audit logging (all actions, immutable)
- ✅ Data retention policies
- ✅ Advanced DLP (Data Loss Prevention)
- ✅ IP whitelisting options
- ✅ Custom security policies per tenant

**Security Team**:
- Dedicated security engineer(s)
- Regular security audits
- Threat modeling
- Security training for all engineers

### 🧪 Testing

**MUST HAVE**:
- ✅ Comprehensive test coverage (90%+ unit, 85%+ integration)
- ✅ E2E tests for all critical flows
- ✅ Performance tests (load, stress, spike)
- ✅ Security tests (penetration, vulnerability scanning)
- ✅ Chaos engineering (failure testing)
- ✅ Compliance tests (GDPR, CCPA workflows)
- ✅ Accessibility tests (automated + manual)
- ✅ Cross-browser and device testing
- ✅ API contract tests
- ✅ Disaster recovery drills

**Testing Infrastructure**:
- Automated testing pipeline
- Staging environment identical to production
- Pre-production environment for final validation
- Test data management system
- Performance testing environment

### 📊 Observability

**MUST HAVE**:
- ✅ Advanced APM (Application Performance Monitoring)
- ✅ Distributed tracing
- ✅ Real User Monitoring (RUM)
- ✅ Synthetic monitoring (global probes)
- ✅ Log aggregation and analysis
- ✅ Custom dashboards for different roles
- ✅ Alerting with on-call rotation
- ✅ Incident management (PagerDuty, Opsgenie)
- ✅ SLI/SLO tracking and error budgets
- ✅ Capacity planning and forecasting

**Metrics Categories**:
- Business: ARR, NRR, CAC, LTV, churn by segment
- Technical: Uptime, latency, error rates, throughput
- Security: Failed logins, API abuse, anomalies
- Compliance: Access logs, data operations, consents

---

## Development Workflow

### Feature Specification

When specifying features at Production level:

```bash
/speckit.specify Build [enterprise feature] following our PRODUCTION constitution. 
Include SSO integration, compliance controls, audit logging, multi-region support, 
and comprehensive security testing.
```

The AI will know to:
- Build enterprise-grade features
- Include compliance requirements
- Add extensive security controls
- Support multi-tenancy and white-labeling
- Optimize for global scale

### Planning Checklist

Before implementing ANY feature, verify:

- [ ] Does this meet enterprise security requirements?
- [ ] Have we considered compliance implications?
- [ ] Is this designed for multi-region deployment?
- [ ] Have we planned for disaster recovery?
- [ ] Does this support white-labeling?
- [ ] Are we adding proper audit logging?
- [ ] Have we tested under enterprise load?
- [ ] Does this meet our SLA commitments?

### Implementation Discipline

**DO**:
- ✅ Design for multi-tenancy from day one
- ✅ Add comprehensive audit logging
- ✅ Test for compliance requirements
- ✅ Document security controls
- ✅ Plan for global deployment
- ✅ Include disaster recovery procedures

**DON'T**:
- ❌ Skip security reviews
- ❌ Ignore compliance requirements
- ❌ Deploy without testing at scale
- ❌ Add features without audit logging
- ❌ Compromise on security for speed

---

## Example: Task Management SaaS (Production Scope)

### ✅ PRODUCTION INCLUDES:

**All V2 Features Plus Enterprise Requirements**:

**New Production Features**:

1. **SSO/SAML**
   - Okta, Azure AD, OneLogin, Google Workspace
   - SCIM provisioning
   - Just-in-time (JIT) provisioning
   - Custom claims and attributes

2. **Compliance Tools**
   - GDPR dashboard (data export, deletion, consent)
   - CCPA compliance workflows
   - SOC2 controls implementation
   - HIPAA compliance (optional)
   - Audit log viewer and exports
   - Data retention policy management

3. **White-Labeling**
   - Custom domain per customer
   - Custom branding (logo, colors, fonts)
   - Custom email templates
   - Custom login pages
   - Remove product branding

4. **Advanced Admin**
   - Multi-level organization hierarchy
   - Custom roles and permissions
   - Delegated administration
   - Usage analytics per department
   - Cost allocation and chargeback
   - License management

5. **Enterprise Security**
   - IP whitelisting
   - Advanced audit logging (immutable)
   - Data encryption keys management
   - Security policy enforcement
   - Custom password policies
   - Session management controls

6. **Professional Services**
   - Dedicated onboarding
   - Custom training programs
   - Migration assistance
   - Custom integrations development
   - Dedicated account manager
   - 24/7 priority support

**Infrastructure**:
- Multi-region deployment (US, EU, Asia)
- 99.9% SLA with credits
- Auto-scaling to handle spikes
- Disaster recovery tested quarterly
- SOC2 Type II certified
- GDPR compliant

**Timeline**: 26+ weeks (ongoing)

### ❌ PRODUCTION EXCLUDES:

At this level, very few things are excluded. The focus is on:
- Continuous improvement
- New compliance requirements as they emerge
- Industry-specific certifications as needed
- Geographic expansion as required

---

## Decision Framework

### Is This Production-Appropriate?

**ASK**: Is this required by enterprise customers?

- ✅ **YES** → Build it with full enterprise requirements
- ❌ **NO** → Evaluate if it's needed for growth

**ASK**: Does this have compliance implications?

- ✅ **YES** → Involve legal/compliance team early
- ❌ **NO** → Proceed with normal process

**ASK**: Does this affect our SLA commitments?

- ✅ **YES** → Plan for high availability and testing
- ❌ **NO** → Standard deployment process

**ASK**: Can we support this at enterprise scale (2000+ customers)?

- ✅ **YES** → Proceed with implementation
- ❌ **NO** → Redesign for scale first

---

## Compliance Requirements

### GDPR Compliance

**MUST HAVE**:
- [ ] Data mapping (what data, where stored, how used)
- [ ] Consent management
- [ ] Right to access (data export)
- [ ] Right to deletion (data deletion workflows)
- [ ] Right to portability (data export in standard formats)
- [ ] Data processing agreements (DPAs)
- [ ] Privacy policy and notices
- [ ] Breach notification procedures
- [ ] Data protection impact assessments (DPIAs)

### SOC2 Type II

**MUST HAVE**:
- [ ] Security policies documented
- [ ] Access controls implemented and tested
- [ ] Change management procedures
- [ ] Incident response procedures
- [ ] Vendor management
- [ ] Employee background checks
- [ ] Security awareness training
- [ ] Continuous monitoring
- [ ] Annual audit

### CCPA Compliance

**MUST HAVE**:
- [ ] Privacy notice
- [ ] Do Not Sell option
- [ ] Data disclosure (what data collected)
- [ ] Data deletion on request
- [ ] Non-discrimination for exercising rights

---

## Communication Guidelines

### When Working with AI Agents

**ALWAYS reference the constitution:**

```bash
# Good ✅
/speckit.specify Build SSO/SAML integration following our Production constitution. 
Include Okta, Azure AD, SCIM provisioning, JIT provisioning, comprehensive audit logging,
security testing, and compliance documentation.

# Bad ❌
/speckit.specify Add SSO feature
```

**Be explicit about Production requirements:**

```bash
# Good ✅
/speckit.plan Design GDPR compliance dashboard with data export, deletion workflows,
consent management, audit logging, legal documentation, and multi-region support
per Production constitution

# Bad ❌
/speckit.plan Design GDPR compliance feature
```

### Feature Request Template

When specifying a feature:

```markdown
Feature: [Feature Name]

Constitution: PRODUCTION

Enterprise Requirements: [Why enterprises need this]

Compliance Impact: [GDPR, SOC2, CCPA, HIPAA considerations]

User Stories: [10+ detailed journeys including admin/compliance roles]

Scope:
- [Detailed functionality with enterprise scenarios]
- [Multi-tenancy considerations]
- [White-labeling requirements]
- [Audit logging requirements]
- [Performance at enterprise scale]

Security Requirements:
- [Authentication/authorization]
- [Data encryption]
- [Audit logging]
- [Compliance controls]

Tech Stack: [Reference Production stack from constitution]

Testing Requirements:
- Unit tests: [comprehensive coverage]
- Integration tests: [all scenarios]
- E2E tests: [complete workflows]
- Security tests: [penetration, vulnerability]
- Performance tests: [enterprise load scenarios]
- Compliance tests: [GDPR, SOC2 workflows]

SLA Impact: [How this affects uptime commitments]

Documentation: [Legal, compliance, technical, user]

Success Criteria: [Enterprise customer adoption, compliance certification]
```

---

## Disaster Recovery

### RTO (Recovery Time Objective): <1 hour

**Procedures**:
- Automated failover to backup region
- Load balancer redirects traffic
- Database promotion (read replica → primary)
- Monitoring alerts confirm recovery
- Incident communication to customers

### RPO (Recovery Point Objective): <5 minutes

**Backup Strategy**:
- Continuous replication to backup region
- Point-in-time recovery (PITR) enabled
- Transaction logs replicated every minute
- Automated backup verification
- Quarterly disaster recovery drills

---

## Constitution Version

**Version**: 1.0.0-production  
**Maturity Level**: PRODUCTION  
**Created**: 2026-01-31  
**For**: Enterprise SaaS companies serving large organizations
