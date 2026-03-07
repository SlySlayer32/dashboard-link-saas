**Dashboard Link SaaS**

Product Requirements Document • v1.0

| **Status** | MVP In Progress |
| --- | --- |
| **Target Market** | Field service businesses, AU |
| **Revenue Target** | \$1,730/month within 12 months |
| **Pricing Model** | \$99-\$199/org/month subscription |

# **1\. Why We're Building This**

## **1.1 The Market Opportunity**

Frontline and field workers represent the largest segment of the global workforce - and the most underserved when it comes to communication tools. The numbers tell the story:

| **Data Point** | **What It Means for Dashboard Link** |
| --- | --- |
| 80%+ of the global workforce is deskless (Axios) | Enormous addressable market that existing platforms ignore |
| Frontline comms software market: \$2B (2025) → \$6B (2033) | Fast-growing category - early positioning matters |
| 60% of frontline workers miss critical updates without mobile tools | The problem is measurable and costs businesses real money |
| 90% of SMS messages are read within 3-5 minutes | SMS is the highest-reliability delivery channel available |
| Only 40% of workers download employer-mandated apps | App-based solutions fail before they start |

| **OPPORTUNITY** | A \$6B market growing 3x by 2033, where the dominant tools all require app downloads that 60% of workers never complete. The gap is not a feature gap - it's a friction gap. |
| --- | --- |

## **1.2 The Problem**

Field workers in industries like cleaning, construction, healthcare, and hospitality face a daily information crisis. Their job-critical information - schedules, client addresses, door codes, task instructions, and emergency contacts - is scattered across WhatsApp threads, SMS chains, and multiple apps. Nothing is organised. Nothing is reliable.

This creates three compounding problems, validated through direct market research:

- Workers start every day uncertain - constantly asking managers the same questions: "What's the code?", "What time?", "Where do I go?"
- Managers are stuck in a reactive loop - resending information that was already sent, answering the same questions, losing hours to unnecessary back-and-forth
- Updates get lost - when a schedule changes or a client adds instructions, workers either don't receive the update or can't find it buried in chat history
- Casual and part-time staff fall through entirely - high-turnover teams mean workers who never set up accounts, never downloaded the app, and start Day 1 with no information

| **INSIGHT** | The root cause is not laziness or bad communication - it's the absence of a single, always-current source of truth that workers can access without friction. |
| --- | --- |

## **1.3 Why Existing Solutions Fail**

Reddit threads and user reviews across competing platforms reveal consistent, recurring failure patterns:

| **Solution Type** | **Examples** | **Validated Failure Pattern** |
| --- | --- | --- |
| Workforce Management Platforms | Connecteam, Deputy, When I Work, Homebase, Tanda | "We paid for it but only 40% downloaded the app." Built for HR/payroll - overkill for daily info delivery. Workers delete after their shift. |
| Team Communication Apps | Slack, Teams, Beekeeper, Crew, Workplace from Meta | "Too many notifications - workers muted everything." Information gets buried in chat history. No structure, no single source of truth. |
| WhatsApp / SMS | WhatsApp Business, standard SMS | "Still texting door codes individually." Simple to use but terrible at organising. Updates require resending. No read confirmation. No audit trail. |

| **THE GAP** | No tool exists that delivers structured, real-time daily information to field workers with zero friction - and proves to managers that workers actually received it. |
| --- | --- |

## **1.4 The Founder's Insight**

This product is built from firsthand experience managing field teams using WhatsApp - watching workers miss locations, arrive without door codes, and call in on the day of a job for information that was sent three days earlier. The pain is real, recurring, and unsolved by anything currently on the market.

| **MISSION** | Give every field worker a single, always-current dashboard they can access in one tap - with zero app installs, zero logins, and zero confusion. |
| --- | --- |

# **2\. What We're Building**

## **2.1 Product Overview**

Dashboard Link is a multi-tenant SaaS platform that delivers personalised, mobile-first daily dashboards to field workers via SMS link. Workers receive a text message each morning containing a secure link. One tap opens a clean, focused view of everything they need for the day - no login, no app, no friction.

Managers configure dashboards once, connect their existing data sources, and the system handles daily delivery automatically.

## **2.2 How It Works - The Core Flow**

| **Step** | **Who** | **What Happens** |
| --- | --- | --- |
| 1   | Manager | Creates worker profiles, connects data sources (Google Calendar, Airtable, Notion, or manual entry) |
| 2   | System | Generates a personalised, secure, time-limited dashboard link for each worker |
| 3   | System | Sends each worker an SMS with their unique dashboard link |
| 4   | Worker | Taps the link - opens their dashboard instantly in their phone browser, no login |
| 5   | Manager | Makes a change (reschedule, new instruction, updated code) - worker refreshes and sees it immediately |

## **2.3 Core Features - MVP Scope**

### **Admin Dashboard**

- Worker management - add/edit workers with phone number validation
- Plugin configuration - connect Google Calendar, Airtable, Notion, or manual data entry
- SMS delivery - one-click send with delivery status tracking
- Read confirmation - access log shows exactly when each worker opened their dashboard
- Token controls - generate links with custom expiry (1-24 hours)
- Organisation settings - company name, branding basics
- SMS logs - full history of what was sent, when, and confirmation of opens

### **Worker Dashboard**

- Today-first - always opens to today's view, no date navigation required
- Mobile-first, single-page view of today's schedule and tasks
- All critical info in one place: schedule, location, access codes, instructions, contacts
- One-tap refresh to see latest updates - no re-send required from manager
- Works offline-tolerant - loads fast on 4G, screenshot-able for zero signal areas
- No account, no install, no password - works instantly for casual and rotating staff

### **Plugin System**

- Google Calendar - sync events as schedule items
- Airtable - pull rows as tasks or schedule data
- Notion - fetch database entries
- Manual entry - managers type directly into the dashboard

### **Security & Access**

- Time-limited tokens (1-24 hours, configurable)
- Single-use protection option
- Full multi-tenant isolation (each organisation's data is completely separate)
- Row-Level Security enforced at the database level

## **2.4 What This Is NOT (Non-Goals for MVP)**

These are explicitly out of scope to maintain focus and achieve MVP velocity:

- Payroll, time tracking, or HR features
- Worker logins or accounts
- In-app messaging or team chat
- Native mobile app (iOS or Android)
- Complex scheduling or shift management
- Invoicing or billing management
- Multi-language support (English only for MVP)

# **3\. Target Users**

## **3.1 Primary Target - Phase 1**

| **Attribute** | **Detail** |
| --- | --- |
| Industry | Cleaning services (primary beachhead) |
| Business size | 5-50 field workers |
| Location | Australia (SMS via MobileMessage.com.au) |
| Current tools | WhatsApp groups, manual SMS, basic spreadsheets |
| Technical level | Low - not software-literate, no appetite for complex tools |
| Key pain | Same questions every day, workers showing up to wrong location or without access codes |
| Willingness to pay | Yes - if it saves 1-2 hours/day of manager time |

## **3.2 User Personas**

### **Persona A - The Manager (Primary Buyer)**

"I spend the first two hours of every Monday resending the same information I already sent on Friday."

- Owner-operator of a cleaning company with 8-30 staff
- Not technical - uses iPhone, Google Calendar, and maybe Airtable
- Core need: stop being the information bottleneck
- Measures success by: fewer calls from workers asking basic questions

### **Persona B - The Field Worker (End User)**

"I just need to know where I'm going and what time."

- Mobile, non-desk worker who relies on a basic smartphone
- Doesn't want to install anything or remember passwords
- Core need: see today's jobs without calling the boss
- Measures success by: shows up to the right place with the right information

## **3.3 Expansion Industries - Phase 2+**

| **Industry** | **Primary Use Case** | **Key Dashboard Widgets** |
| --- | --- | --- |
| Hospitality / Events | Event staff daily briefings | Location, dress code, contact, arrival time |
| Construction | Site assignments and safety briefs | Site address, safety checklist, supervisor contacts |
| Healthcare / Home Care | Patient visit schedules | Client name, address, care notes, emergency contacts |
| Property Management | Maintenance crew daily routes | Property addresses, access codes, task priority |
| Delivery Companies | Route and delivery notes | Stop order, delivery notes, customer contacts |

# **4\. Key Differentiators & Retention Advantages**

Dashboard Link competes on simplicity and focus - not features. Below are the differentiators validated through competitor analysis and direct user research (Reddit/review platforms):

| **Differentiator** | **What It Means** | **Why Competitors Miss It** |
| --- | --- | --- |
| Zero friction for workers | No app, no login, no account - just tap a link | Workforce platforms all require app installs. 60% of workers never complete this step. |
| Read confirmation | Access logs show manager exactly when each worker opened their dashboard | "Did you see my message?" is a daily friction point. No competitor solves this for field workers at this price point. |
| Real-time updates (no resend) | Manager changes info → worker refreshes → sees it instantly | WhatsApp/SMS require manual resend. Businesses pay for tools but still use WhatsApp for real-time updates. |
| Today-first UX | Dashboard always opens to today's view, no navigation required | Calendar tools require workers to find the right date. Workers want one thing: what's my day? |
| Casual-worker friendly | No account setup - works perfectly for rotating/part-time staff | High-turnover industries have workers who never set up accounts. App-based tools fail here entirely. |
| Per-org pricing | \$99-\$199/month regardless of worker count | Per-user pricing punishes growth. Businesses go from \$50 to \$200/month as team grows, then churn. |
| Works with existing tools | Connects to Google Calendar, Airtable, Notion - no workflow rebuild | Most platforms force managers into their own scheduling system. Adoption collapses when habits must change. |
| One SMS per day discipline | Single daily notification - no notification fatigue | Competitors spam workers, who mute everything. Then critical updates get missed too. |
| Australian-first SMS | MobileMessage.com.au - 2-3c/SMS, AU-based support | Global platforms don't optimise for Australian SMS rates or local compliance. |

| **CORE INSIGHT** | Competitors are building 'workforce management platforms.' We're building 'a daily info delivery system.' That focus is the moat - and it's what drives referrals. |
| --- | --- |

## **4.1 The Referral Engine - Built Into the Product**

Referral growth is not a Phase 3 afterthought - it must be designed into the product from day one. The mechanism is simple and already inherent in how the product works:

- **Every worker who receives a Dashboard Link SMS sees a clean, professional daily dashboard**
- Workers often work across 2-3 part-time jobs - they will mention it to other managers
- A subtle 'Powered by Dashboard Link' footer on the worker dashboard creates passive organic exposure to every manager whose employee uses the product
- **Referred customers have 37% higher retention and 18% lower churn than non-referred customers (Deloitte)**
- This means the referral flywheel doesn't just grow the customer base - it improves the quality of the customer base
- **Two-sided referral incentive: reward the referring manager AND give the new organisation a discounted first month**
- Industry benchmarks show two-sided programs outperform one-sided by 3x participation

| **Referral Trigger** | **When It Fires** | **Mechanic** |
| --- | --- | --- |
| Post-setup success | Manager sends their first SMS successfully | Prompt: 'Know another business owner who'd love this? Give them a month free.' |
| Worker dashboard footer | Every time a worker opens their dashboard | 'Powered by Dashboard Link' - passive brand exposure to workers employed elsewhere |
| Monthly value reminder | 30 days after signup | Email showing SMS sent, dashboards opened, estimated time saved - natural share moment |
| Milestone celebration | After 10th SMS sent | In-app prompt to share - peak satisfaction moment |

# **5\. Roadmap & Milestones**

## **5.1 Phase 1 - MVP (Months 1-3)**

| **GOAL** | Prove that 3-5 businesses prefer this over WhatsApp for daily worker communication. |
| --- | --- |

| **Feature** | **Status** | **Notes** |
| --- | --- | --- |
| Worker management (add/edit/delete) | **🔄 In Progress** | Core admin flow |
| Secure token generation | **🔄 In Progress** | 1-24hr expiry, single-use option |
| SMS delivery via MobileMessage.com.au | **🔄 In Progress** | AU-only for MVP |
| Mobile worker dashboard | **🔄 In Progress** | Schedule, location, tasks, codes |
| Manual data entry plugin | **📋 Planned** | Managers type directly |
| Google Calendar plugin | **📋 Planned** | OAuth integration |
| Multi-tenant isolation (RLS) | **🔄 In Progress** | Database-level org separation |
| Admin SMS logs | **📋 Planned** | Delivery status tracking |

## **5.2 Phase 2 - Growth (Months 4-6)**

| **GOAL** | Convert beta users to paid customers. Add customisation to expand to other industries. Launch referral engine. |
| --- | --- |

- Airtable and Notion plugin integrations
- Dashboard widget customisation (show/hide sections per organisation)
- Basic branding (company logo and colours on worker dashboard)
- 'Powered by Dashboard Link' footer on worker dashboards - passive referral exposure
- Stripe billing integration - subscription management
- Two-sided referral program - reward referring manager + discount for new org
- Onboarding flow: < 15 minutes from signup to first SMS sent
- Monthly value summary email - SMS count, open rate, estimated time saved - triggers referral sharing
- Analytics: open rates, refresh counts, dashboard open confirmation per worker

## **5.3 Phase 3 - Scale (Months 7-12)**

| **GOAL** | Reach 12-15 paying customers through referrals and targeted outreach. |
| --- | --- |

- Referral mechanics - incentivise word-of-mouth growth
- Industry-specific dashboard templates (cleaning, construction, healthcare)
- Scheduled automatic SMS sending (manager sets time, system sends daily)
- Custom plugin builder - businesses connect their own APIs
- Usage analytics dashboard for managers
- Webhook support for real-time data updates from external tools

# **6\. Success Metrics**

## **6.1 Business Metrics - 12 Month Targets**

| **Metric** | **Target** | **Why It Matters** |
| --- | --- | --- |
| Monthly Recurring Revenue | \$1,730/month | Covers \$800/fortnight personal income target |
| Paying customers | 9-18 organisations | At \$99-\$199/org/month pricing |
| Monthly churn rate | < 10% | Proves lasting value beyond novelty |
| Monthly active orgs | \> 70% | Orgs actively sending dashboards weekly |

## **6.2 Product Metrics - Ongoing**

| **Metric** | **Target** | **Notes** |
| --- | --- | --- |
| Time to first SMS sent (onboarding) | < 15 minutes | Critical for solo operator adoption |
| Dashboard link open rate | \> 80% | Workers actually using it, not ignoring |
| SMS delivery success rate | \> 99% | Via MobileMessage.com.au SLA |
| Dashboard load time (mobile) | < 2 seconds | On 4G in field conditions |
| Beta user conversion to paid | \> 60% | Months 1-3 beta users becoming paying |

## **6.3 Validation Milestones**

| **Timeline** | **Milestone** | **Signal of Success** |
| --- | --- | --- |
| Month 1-3 | 3-5 beta users actively using the product over WhatsApp | They choose Dashboard Link unprompted on working days |
| Month 4-6 | First paid conversions - \$99+/month | Users pay without needing a discount |
| Month 7-12 | 12-15 paying customers via referrals | At least 1 new customer from a referral |

# **7\. Constraints & Key Decisions**

## **7.1 Constraints**

- **Solo developer - scope must remain achievable without a team**
- AI-assisted development (Claude) compensates for velocity
- MVP must be buildable before budget runs out
- **Australian market first - SMS provider (MobileMessage.com.au) is AU-specific**
- Global expansion requires different SMS provider strategy
- **No native app - web-only via SMS link is a deliberate constraint, not a limitation**
- Avoids App Store gatekeeping, approval delays, and update friction
- **Free tier not planned for MVP - paid-only to validate genuine willingness to pay**

## **7.2 Key Decisions Made**

| **Decision** | **Choice Made** | **Rationale** |
| --- | --- | --- |
| SMS provider | MobileMessage.com.au | 2-3c/SMS, AU-based, no monthly fees, free virtual number |
| Backend framework | Hono.js | 5x smaller than Express, TypeScript-first, fast cold starts |
| Database | Supabase (PostgreSQL) | Built-in RLS, Auth, Storage, Realtime - reduces operational complexity |
| Frontend | Vite + React 18 | Fast HMR, modern tooling, team familiarity |
| Monorepo | Turborepo + pnpm | Clean separation of admin app, worker app, and API |
| No app install | Web-only via SMS link | Zero friction for workers - no barrier to adoption |
| Pricing | \$99-\$199/org/month | Subscription aligns with ongoing value; simple for small businesses |

# **8\. Risks & Mitigations**

| **Risk** | **Likelihood** | **Impact** | **Mitigation** |
| --- | --- | --- | --- |
| Competitors add SMS link feature | Medium | High | Win on simplicity & AU-focus; move fast to lock in early customers |
| SMS delivery issues or cost spike | Low | Medium | MobileMessage SLA + monitor delivery rates; evaluate backup providers |
| Low willingness to pay | Medium | High | Beta first - prove value before charging; anchor to time saved |
| Scope creep slows MVP | High | High | Non-goals list is firm; any new feature requires removing another |
| External API changes break plugins | Medium | Medium | Plugin abstraction layer isolates impact; circuit breaker pattern |
| Solo developer burnout | Medium | High | AI-assisted development + strict MVP scope + fortnightly check-ins |

# **9\. Open Questions**

These are unresolved decisions that need answers before or during Phase 2:

| **Question** | **Notes / Context** |
| --- | --- |
| Will \$99/month be the right entry price? | Needs validation with first beta users - may need to start lower to remove friction |
| Should we offer annual billing? | Would improve cash flow; adds complexity to billing system |
| Which industry after cleaning? | Hospitality and construction are frontrunners - needs market research |
| How do we handle SMS replies from workers? | MobileMessage provides a virtual number - do we surface replies in admin? |
| Do managers want a mobile admin view? | Current admin is desktop-first - could be a barrier for owner-operators |

# **Appendix - Document Index**

This PRD is part of a broader documentation structure. Related documents:

| **Document** | **Location** |
| --- | --- |
| Architecture Overview | /docs/2-architecture/ARCHITECTURE.md |
| Tech Stack Decisions | /docs/2-architecture/TECH-STACK.md |
| Feature Status List | /docs/6-product/FEATURES.md |
| API Overview | /docs/3-api/API-OVERVIEW.md |
| Roadmap Detail | /docs/1-overview/ROADMAP.md |
| Vision & North Star | /docs/1-overview/VISION.md |
| ADR - Decision Records | /docs/4-decisions/ADR/ |
| Project Context (AI primer) | /docs/CONTEXT.md |