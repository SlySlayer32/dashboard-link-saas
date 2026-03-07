# Roadmap

## Phase 1 — MVP
**Goal:** Prove that 3-5 businesses prefer this over WhatsApp for daily worker communication.

- [ ] Worker management (add/edit/delete)
- [ ] Secure token generation (1-24hr expiry, single-use option)
- [ ] SMS delivery via MobileMessage.com.au
- [ ] Mobile worker dashboard (schedule, location, tasks, codes)
- [ ] Manual data entry plugin
- [ ] Google Calendar plugin
- [ ] Multi-tenant isolation (RLS)
- [ ] Admin SMS logs (delivery status tracking)

## Phase 2 (Months 4-6): Retention & Growth

**Retention Features:**
- Monthly value summary email (engagement)
- 'Powered by Dashboard Link' footer (free tier branding)
- Referral program with triggers:
  - After 30 days active use
  - After sending 100+ SMS
  - When adding 10+ workers
  - When connecting 2+ plugins
**Goal:** Convert beta users to paid customers. Add customization to expand to other industries. Launch referral engine.

- [ ] Airtable and Notion plugin integrations
- [ ] Dashboard widget customization (show/hide sections per organization)
- [ ] Basic branding (company logo and colors on worker dashboard)
- [ ] Stripe billing integration
- [ ] Two-sided referral program
- [ ] Onboarding flow (< 15 minutes from signup to first SMS sent)
- [ ] Monthly value summary email (SMS count, open rate, time saved)
- [ ] Analytics (open rates, refresh counts, dashboard open confirmation per worker)

## Phase 3 — Scale
**Goal:** Reach 12-15 paying customers through referrals and targeted outreach.

- [ ] Industry-specific dashboard templates (cleaning, construction, healthcare)
- [ ] Scheduled automatic SMS sending (manager sets time, system sends daily)
- [ ] Custom plugin builder (businesses connect their own APIs)
- [ ] Usage analytics dashboard for managers
- [ ] Webhook support for real-time data updates from external tools

## Icebox
Good ideas parked for later — not committed to:
- Multi-language support (English only for MVP)
- Worker logins or accounts
- In-app messaging or team chat
- Native mobile app (iOS or Android)
- Payroll, time tracking, or HR features

## Completed Milestones
Brief log of what shipped and when:
- [Date TBD] Initial repository structure and monorepo setup
- [Date TBD] Database schema and RLS policies implemented
