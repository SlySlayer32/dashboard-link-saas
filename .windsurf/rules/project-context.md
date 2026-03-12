---
trigger: always
description: Project identity, docs index, and tech stack for Dashboard Link
---

# Dashboard Link — Project Context

## What This Product Is
- Multi-tenant SaaS platform
- Sends field workers a daily SMS containing a secure link
- Link opens a personalised mobile dashboard — no app, no login, no friction
- Managers configure once; system delivers daily automatically
- Primary market: cleaning service businesses, 5–50 workers, Australia

## Current Phase
MVP — Phase 1 (Months 1–3)
Goal: Prove 3–5 businesses prefer this over WhatsApp for daily worker comms

## Docs Index

| File | Purpose |
|------|---------|
| `/docs/CONTEXT.md` | Project primer — quick orientation |
| `/docs/1-overview/PRD.md` | Full product requirements |
| `/docs/1-overview/VISION.md` | North star and product vision |
| `/docs/1-overview/ROADMAP.md` | Phase 1/2/3 milestones |
| `/docs/2-architecture/ARCHITECTURE.md` | System architecture |
| `/docs/2-architecture/TECH-STACK.md` | Stack decisions — source of truth |
| `/docs/3-api/API-OVERVIEW.md` | API structure and endpoints |
| `/docs/4-decisions/ADR/` | All architecture decision records |
| `/docs/5-dev-guide/SETUP.md` | Dev environment setup |
| `/docs/6-product/FEATURES.md` | Feature build status — check before adding anything |

## Locked Tech Stack
Do not suggest alternatives. These decisions are final.

| Layer | Decision |
|-------|---------|
| Backend | Hono.js |
| Database | Supabase (PostgreSQL + RLS) |
| Frontend | Vite + React 18 |
| Monorepo | Turborepo + pnpm |
| SMS Provider | MobileMessage.com.au (AU only) |

## Project Structure

```
apps/
  admin/      # Manager dashboard (Vite + React 18)
  worker/     # Worker dashboard — token link access, no login
packages/
  api/        # Hono.js backend
  db/         # Supabase client, schema, RLS policies
  sms/        # MobileMessage.com.au integration
  tokens/     # Token generation and validation
docs/         # All documentation (see index above)
```

## Key Constraints
- Solo developer — keep every solution simple and achievable alone
- Web-only — no native app, no App Store, no React Native
- Australia-first — SMS is AU-specific via MobileMessage.com.au
- No worker logins — access via time-limited token only
- Free tier not planned — paid-only MVP
