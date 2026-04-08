# Features

## Legend
✅ Built | 🔄 In Progress | 📋 Planned | ❌ Cut

## Core Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Admin Dashboard** | | |
| Worker management (add/edit/delete) | ✅ | Core admin flow - full CRUD with soft delete and phone validation |
| Plugin configuration | 🔄 | Connect Google Calendar, Airtable, Notion, manual |
| SMS delivery (one-click send) | 🔄 | Send to one or all workers |
| Delivery status tracking | 📋 | See sent/delivered/failed status |
| Read confirmation (access logs) | 📋 | Track when workers open dashboard |
| Token controls (custom expiry) | ✅ | 1-24 hour expiry, configurable per organization with full token management system |
| Organization settings | 🔄 | Company name, branding basics |
| SMS logs (full history) | 📋 | Audit trail of all messages |
| **Worker Dashboard** | | |
| Today-first view | 🔄 | Always opens to today, no navigation |
| Mobile-first design | 🔄 | Optimized for 320px+ screens |
| Schedule display | 🔄 | Time, location, access codes, instructions |
| Task list | 📋 | Daily tasks from plugins |
| Contact information | 📋 | Emergency contacts, manager info |
| One-tap refresh | 📋 | See latest updates without SMS resend |
| Offline-tolerant | 📋 | Loads fast on 4G, screenshot-able |
| No login required | ✅ | Token-based access only with comprehensive validation and error handling |
| **Plugin System** | | |
| Google Calendar integration | 📋 | OAuth, sync events as schedule |
| Airtable integration | 📋 | Pull rows as tasks/schedule |
| Notion integration | 📋 | Fetch database entries |
| Manual entry | 📋 | Managers type directly |
| Plugin health monitoring | 📋 | Track sync status, errors |
| **Security & Access** | | |
| Time-limited tokens (1-24hr) | ✅ | Configurable per organization with SHA-256 hashing and auto-cleanup |
| Single-use protection | 📋 | Optional one-time access |
| Multi-tenant isolation (RLS) | ✅ | Database-level org separation with comprehensive security |
| JWT authentication | 🔄 | Supabase Auth for admin users |
| Access logging | 📋 | Track dashboard opens |

## Nice-to-Haves

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard customization | 📋 | Show/hide sections per org (Phase 2) |
| Basic branding | 📋 | Logo and colors on worker dashboard (Phase 2) |
| Referral program | 📋 | Two-sided incentives (Phase 2) |
| Stripe billing | 📋 | Subscription management (Phase 2) |
| Analytics dashboard | 📋 | Open rates, time saved (Phase 2) |
| Scheduled SMS sending | 📋 | Auto-send at specific time (Phase 3) |
| Industry templates | 📋 | Pre-configured for cleaning, construction, etc. (Phase 3) |
| Custom plugin builder | 📋 | Connect business-specific APIs (Phase 3) |
| Webhook support | 📋 | Real-time updates from external tools (Phase 3) |
| Two-way SMS | 📋 | Workers can reply to messages (Future) |
| Multi-language | 📋 | English only for MVP (Future) |

## Cut Features

| Feature | Why Cut |
|---------|---------|
| Payroll integration | Out of scope — focus is daily info delivery, not HR |
| Time tracking | Out of scope — not a workforce management platform |
| Worker logins/accounts | Defeats zero-friction value proposition |
| In-app messaging | Adds complexity, WhatsApp already exists |
| Native mobile app | 60% never download; web-only is differentiator |
| Shift management | Too complex for MVP, focus on daily dashboards |
| Invoicing/billing | Out of scope — not a business management tool |
| Multi-language support | English only for AU market, defer for global expansion |
| Desktop worker dashboard | Workers are mobile-first, desktop not needed |
| Manager mobile app | Admin dashboard is desktop-focused, defer mobile optimization |

## Full Component Build List (49 Components)

### Phase 1: MVP (5 components)
| # | Component | Status |
|---|-----------|--------|
| 1 | `worker-management` | ✅ Complete |
| 2 | `token-system` | 🔄 In Progress |
| 3 | `sms-delivery` | 📋 Planned |
| 4 | `worker-dashboard` | 📋 Planned |
| 5 | `access-logging` | 📋 Planned |

### Phase 2: Core Features (11 components)
| # | Component | Status |
|---|-----------|--------|
| 6 | `admin-authentication` | 📋 Planned |
| 7 | `user-onboarding-wizard` | 📋 Planned |
| 8 | `google-calendar-plugin` | 📋 Planned |
| 9 | `manual-entry-plugin` | 📋 Planned |
| 10 | `billing-stripe-integration` | 📋 Planned |
| 11 | `referral-system` | 📋 Planned |
| 12 | `analytics-dashboard` | 📋 Planned |
| 13 | `monthly-value-emails` | 📋 Planned |
| 14 | `powered-by-footer` | 📋 Planned |
| 15 | `dashboard-widget-customisation` | 📋 Planned |
| 16 | `basic-branding` | 📋 Planned |

### Phase 3: Automation (2 components)
| # | Component | Status |
|---|-----------|--------|
| 17 | `scheduled-sms-automation` | 📋 Planned |
| 18 | `queue-processing-bullmq` | 📋 Planned |

### Infrastructure & Deployment (8 components)
| # | Component | Status |
|---|-----------|--------|
| 19 | `local-development-setup` | 🔄 In Progress |
| 20 | `vercel-frontend-deployment` | 📋 Planned |
| 21 | `railway-backend-deployment` | 📋 Planned |
| 22 | `supabase-production-setup` | 📋 Planned |
| 23 | `ci-cd-github-actions` | 📋 Planned |
| 24 | `environment-management` | 📋 Planned |
| 25 | `domain-dns-configuration` | 📋 Planned |
| 26 | `cdn-static-assets` | 📋 Planned |

### Monitoring & Observability (6 components)
| # | Component | Status |
|---|-----------|--------|
| 27 | `sentry-error-tracking` | 📋 Planned |
| 28 | `uptime-monitoring` | 📋 Planned |
| 29 | `performance-monitoring` | 📋 Planned |
| 30 | `logging-infrastructure` | 📋 Planned |
| 31 | `alerting-notifications` | 📋 Planned |
| 32 | `business-analytics-tracking` | 📋 Planned |

### Security & Compliance (5 components)
| # | Component | Status |
|---|-----------|--------|
| 33 | `multi-tenant-isolation` | 🔄 In Progress |
| 34 | `authentication-security` | 📋 Planned |
| 35 | `api-security-hardening` | 📋 Planned |
| 36 | `gdpr-compliance` | 📋 Planned |
| 37 | `incident-response-plan` | 📋 Planned |

### Database & Data Management (4 components)
| # | Component | Status |
|---|-----------|--------|
| 38 | `database-schema-management` | ✅ Complete |
| 39 | `backup-recovery-strategy` | 📋 Planned |
| 40 | `data-seeding` | 📋 Planned |
| 41 | `database-optimization` | 📋 Planned |

### Third-Party Integrations (5 components)
| # | Component | Status |
|---|-----------|--------|
| 42 | `mobilemessage-sms-setup` | 📋 Planned |
| 43 | `stripe-billing-setup` | 📋 Planned |
| 44 | `google-oauth-setup` | 📋 Planned |
| 45 | `notion-oauth-setup` | 📋 Planned |
| 46 | `email-service-setup` | 📋 Planned |

### Testing & Quality (3 components)
| # | Component | Status |
|---|-----------|--------|
| 47 | `testing-strategy` | 📋 Planned |
| 48 | `code-quality-standards` | 📋 Planned |
| 49 | `performance-testing` | 📋 Planned |

## Scope Gate Rule

**Before building anything new:**
1. Check the component list above for current status
2. If the feature is not listed — stop and flag it before proceeding
3. Never silently build out-of-scope features

## TODO: Update status as features are completed
