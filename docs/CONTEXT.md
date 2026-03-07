# Project Context
> Read this first. Updated whenever something major changes.

## What This App Does

Dashboard Link is a multi-tenant SaaS platform that delivers personalized, mobile-first daily dashboards to field workers via SMS link. Workers receive a text message each morning with a secure link that opens their dashboard instantly—no app install, no login required.

## Who It's For

**Primary Target:** Cleaning service businesses (5-50 field workers) in Australia who currently use WhatsApp groups and manual SMS to coordinate daily schedules. Managers waste 1-2 hours daily resending information; workers miss critical details like door codes and locations.

**End Users:** Mobile field workers who need to see today's schedule, location, access codes, and instructions without installing apps or remembering passwords.

## Current Status

**Phase:** MVP In Progress (Months 1-3)  
**Goal:** Prove that 3-5 businesses prefer this over WhatsApp for daily worker communication.

**In Progress:**
- Worker management (add/edit/delete)
- Secure token generation (1-24hr expiry)
- SMS delivery via MobileMessage.com.au
- Mobile worker dashboard
- Multi-tenant isolation (RLS)

**Planned:**
- Manual data entry plugin
- Google Calendar plugin
- Admin SMS logs

## Tech Stack Summary

> See `@e:\CleanConnect\docs\2-architecture\TECH-STACK.md` for complete tech stack details — documented there as the single source of truth.

**Quick reference:** Vite + React 18, Hono.js, Supabase, MobileMessage.com.au, Turborepo

## Key Docs

- **PRD:** `/docs/1-overview/PRD.md` (moved from root)
- **Architecture:** `/docs/2-architecture/ARCHITECTURE.md`
- **Current Features:** `/docs/6-product/FEATURES.md`
- **Tech Stack Detail:** `/docs/2-architecture/TECH-STACK.md`
- **Setup Guide:** `/docs/5-dev-guide/SETUP.md`

## Known Issues / Active Blockers

- **MVP Scope Only:** No payroll, time tracking, or HR features. No worker logins. No native app.
- **Australia-First:** SMS provider (MobileMessage.com.au) is AU-specific. Global expansion requires different provider strategy.
- **Solo Developer:** AI-assisted development compensates for velocity; strict MVP scope prevents burnout.
- **Free Tier:** Not planned for MVP—paid-only to validate genuine willingness to pay.
