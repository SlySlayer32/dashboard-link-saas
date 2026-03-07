# Features

## Legend
✅ Built | 🔄 In Progress | 📋 Planned | ❌ Cut

## Core Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Admin Dashboard** | | |
| Worker management (add/edit/delete) | 🔄 | Core admin flow |
| Plugin configuration | 🔄 | Connect Google Calendar, Airtable, Notion, manual |
| SMS delivery (one-click send) | 🔄 | Send to one or all workers |
| Delivery status tracking | 📋 | See sent/delivered/failed status |
| Read confirmation (access logs) | 📋 | Track when workers open dashboard |
| Token controls (custom expiry) | 🔄 | 1-24 hour expiry, configurable |
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
| No login required | 🔄 | Token-based access only |
| **Plugin System** | | |
| Google Calendar integration | 📋 | OAuth, sync events as schedule |
| Airtable integration | 📋 | Pull rows as tasks/schedule |
| Notion integration | 📋 | Fetch database entries |
| Manual entry | 📋 | Managers type directly |
| Plugin health monitoring | 📋 | Track sync status, errors |
| **Security & Access** | | |
| Time-limited tokens (1-24hr) | 🔄 | Configurable per organization |
| Single-use protection | 📋 | Optional one-time access |
| Multi-tenant isolation (RLS) | 🔄 | Database-level org separation |
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

## TODO: Update status as features are completed
## TODO: Add estimated completion dates for planned features
