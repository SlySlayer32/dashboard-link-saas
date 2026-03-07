---
trigger: always_on
description: Project map — docs index, tech stack, and non-negotiables for Dashboard Link
---

# Dashboard Link — Windsurf Project Rules

## Start Here
Before writing any code or making any decisions, read /docs/CONTEXT.md.
This is the master project primer. It has everything you need to understand 
the product, the constraints, and the current state of the build.

---

## Docs Folder Index

| File | What It Contains |
|------|-----------------|
| /docs/CONTEXT.md | Master AI primer — start here every session |
| /docs/1-overview/VISION.md | Product vision and north star |
| /docs/1-overview/ROADMAP.md | Phase 1/2/3 milestones and feature timeline |
| /docs/2-architecture/ARCHITECTURE.md | System architecture overview |
| /docs/2-architecture/TECH-STACK.md | Tech stack decisions and rationale |
| /docs/3-api/API-OVERVIEW.md | API structure and endpoint reference |
| /docs/4-decisions/ADR/ | All ADRs — check before changing anything structural |
| /docs/6-product/FEATURES.md | Feature list with current build status |

---

## Locked Tech Stack
Do not suggest alternatives. These are decided.
- Backend: Hono.js
- Database: Supabase (PostgreSQL + RLS)
- Frontend: Vite + React 18
- Monorepo: Turborepo + pnpm
- SMS: MobileMessage.com.au (AU only)

---

## Project Structure
- apps/admin — manager dashboard
- apps/worker — worker dashboard (SMS link, no login)
- packages/api — Hono.js backend
- docs/ — all documentation (see index above)

---

## Non-Negotiables
- Solo developer — keep solutions simple
- Web-only, no native app
- No worker logins — token links only
- AU market first
- MVP scope is fixed — check FEATURES.md before adding anything

## MVP Is NOT Building
- Payroll, time tracking, HR
- Worker accounts or logins
- In-app chat
- Native app
- Multi-language support
