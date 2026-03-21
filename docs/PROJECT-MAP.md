# PROJECT-MAP.md
> Living document. Update this file whenever a new package, route, or major file is added.
> Use section names when scoping AI debug requests (e.g. "debug the SMS section").

---

## Architecture Overview
This is a monorepo with two frontend apps, one backend API, and shared packages.
All shared logic lives in /packages — never duplicate it in /apps.

---

## 1. Frontend — Admin Dashboard
**Path:** /apps/admin
**Stack:** Vite + React 18 + TanStack Query + Tailwind CSS + Zustand + React Hook Form + Zod + React Router

**Location map:**
```
/apps/admin/src/components/   → UI components
/apps/admin/src/hooks/        → Custom React hooks
/apps/admin/src/store/        → Zustand global state
/apps/admin/src/lib/          → Query client + utilities
```

**Connects to:** /apps/api (REST), /packages/auth, /packages/ui, /packages/shared
**Scope:** Admin interface — manage workers, organisations, plugins
**Known issues:** [update as they arise]
**Last changed:** [update when you work in this area]

---

## 2. Frontend — Worker Dashboard
**Path:** /apps/worker
**Stack:** Vite + React 18 + Tailwind CSS

**Location map:**
```
/apps/worker/src/components/  → UI components
/apps/worker/src/pages/       → Page-level components
```

**Connects to:** /apps/api (REST), /packages/auth, /packages/ui, /packages/tokens
**Scope:** Worker-facing interface — daily dashboards and task views
**Known issues:** [update as they arise]
**Last changed:** [update when you work in this area]

---

## 3. Backend — API Server
**Path:** /apps/api
**Stack:** Hono.js + Node.js + TypeScript + Zod + Supabase client

**Location map:**
```
/apps/api/src/routes/         → All API route handlers
/apps/api/src/middleware/     → Auth checks, validation middleware
/apps/api/src/index.ts        → Server entry point
```

**Connects to:** /packages/auth, /packages/database, /packages/plugins, /packages/sms, /packages/shared
**Scope:** All REST endpoints and server-side logic
**Known issues:** [update as they arise]
**Last changed:** [update when you work in this area]

---

## 4. Package — Authentication
**Path:** /packages/auth
**Stack:** Supabase Auth + JWT

**Location map:**
```
/packages/auth/src/middleware.ts  → Auth middleware (used in /apps/api)
/packages/auth/src/tokens.ts      → JWT token utilities
```

**Connects to:** /packages/database, /apps/api (consumed here)
**Scope:** JWT handling, auth middleware, session management
**Known issues:** [update as they arise]
**Last changed:** [update when you work in this area]

---

## 5. Package — Database
**Path:** /packages/database
**Stack:** Supabase JS client + PostgreSQL

**Location map:**
```
/packages/database/src/client.ts     → Supabase client instance
/packages/database/src/queries/      → All DB query functions (never write raw queries elsewhere)
/packages/database/migrations/       → SQL migration files
```

**Connects to:** /supabase (schema source of truth), consumed by /apps/api
**Scope:** All database reads/writes — never query DB directly from routes, always go via /queries/
**Known issues:** [update as they arise]
**Last changed:** [update when you work in this area]

---

## 6. Package — Plugin System
**Path:** /packages/plugins
**Stack:** Third-party API clients (Google Calendar, Airtable, Notion)

**Location map:**
```
/packages/plugins/src/adapters/   → One adapter file per integration
/packages/plugins/src/registry.ts → Plugin registration and lookup
```

**Connects to:** /apps/api (consumed here), /packages/shared (types)
**Scope:** All external integrations — new integrations get a new adapter file
**Known issues:** [update as they arise]
**Last changed:** [update when you work in this area]

---

## 7. Package — SMS Service
**Path:** /packages/sms
**Stack:** MobileMessage.com.au (primary), Twilio, AWS SNS

**Location map:**
```
/packages/sms/src/providers/   → One file per SMS provider
/packages/sms/src/index.ts     → Unified SMS interface (all callers use this, never a provider directly)
```

**Connects to:** /apps/api (consumed here)
**Scope:** All outbound SMS — swap providers by changing index.ts, not callers
**Known issues:** [update as they arise]
**Last changed:** [update when you work in this area]

---

## 8. Package — Token Management
**Path:** /packages/tokens

**Location map:**
```
/packages/tokens/src/generator.ts  → Token creation logic
/packages/tokens/src/validator.ts  → Token validation logic
```

**Connects to:** /apps/api, /apps/worker
**Scope:** Worker token generation and validation only
**Known issues:** [update as they arise]
**Last changed:** [update when you work in this area]

---

## 9. Package — UI Components
**Path:** /packages/ui
**Stack:** React + Tailwind CSS + class-variance-authority

**Location map:**
```
/packages/ui/src/components/  → Shared reusable components (used across both apps)
/packages/ui/src/styles/      → Global styles
```

**Connects to:** /apps/admin, /apps/worker
**Scope:** Design system and shared components — if a component is used in more than one app, it lives here
**Known issues:** [update as they arise]
**Last changed:** [update when you work in this area]

---

## 10. Package — Shared Types
**Path:** /packages/shared

**Location map:**
```
/packages/shared/src/types/      → TypeScript type definitions
/packages/shared/src/constants/  → App-wide constants
/packages/shared/src/schemas/    → Zod validation schemas
```

**Connects to:** All packages and apps consume this
**Scope:** Single source of truth for types, constants, and validation schemas
**Convention:** If a type or schema is used in more than one place, it lives here — not inline
**Known issues:** [update as they arise]
**Last changed:** [update when you work in this area]

---

## 11. Infrastructure — Supabase / Database Layer
**Path:** /supabase

**Location map:**
```
/supabase/migrations/    → All schema changes (never edit DB directly — always via migration)
/supabase/seed.sql       → Development seed data
/supabase/config.toml    → Supabase project configuration
```

**Connects to:** /packages/database (queries run against this schema)
**Scope:** PostgreSQL schema, Row Level Security (RLS) policies, migrations
**Convention:** Schema changes always go through a migration file — never direct DB edits
**Known issues:** [update as they arise]
**Last changed:** [update when you work in this area]

---

## 12. Scripts & Dev Tools
**Path:** /scripts

**Location map:**
```
/scripts/dev-check.sh   → Validates local dev environment is set up correctly
/scripts/lint-report.sh → Runs and reports code quality checks
```

---

## 13. Documentation
**Path:** /docs

**Location map:**
```
/docs/1-overview/      → Project vision and roadmap
/docs/2-architecture/  → System architecture decisions
/docs/3-api/           → API endpoint documentation
/docs/PROJECT-MAP.md   → This file
```

---

## Key Conventions (read before writing any code)
- All data fetching goes through /packages/database/queries — never raw queries in routes or components
- All SMS calls go through /packages/sms/index.ts — never a provider directly
- All shared types and schemas live in /packages/shared — not inline
- Components used in more than one app belong in /packages/ui
- Server-side logic belongs in /apps/api routes — not in frontend code
- Auth logic lives in /packages/auth — not duplicated in individual apps

---

## Environment Variables
```
.env.local   → Never committed. Contains keys for Supabase, Stripe, SMS providers, etc.
```
Ask the developer which keys are needed when setting up a new integration.

---

## Testing Locations
```
Unit tests:       /packages/*/  and  /apps/*/  (Vitest)
Integration tests: /apps/api/   (API route testing)
Component tests:  /apps/admin/  and  /apps/worker/  (React Testing Library)
```

---

_Last updated: [date] — update this line each time the file is changed_