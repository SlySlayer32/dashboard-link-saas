---
trigger: always_on
---

# Dashboard Link SaaS - Essential Rules

> **Context**: Multi-tenant SaaS platform delivering personalized daily dashboards via SMS.  
> **Architecture**: Turborepo monorepo with Vite frontends + Hono.js API + Supabase backend.  
> **Current Stage**: Local development (V1 Professional Product maturity level).

---

## Tech Stack

- **Frontend**: Vite + React 18 + TanStack Query + Tailwind CSS + Zustand
- **Backend**: Hono.js (Node.js server) + Supabase Edge Functions
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth + Custom JWT tokens
- **Payments**: Stripe (future implementation)
- **Deployment**: Docker (local dev) → Vercel + Supabase Cloud (production recommended)
- **Email**: Not yet implemented (Resend recommended when needed)
- **SMS**: MobileMessage.com.au (primary), Twilio/AWS SNS (fallback)

## Project Structure

```
/apps/admin → Admin dashboard (Vite + React)
/apps/worker → Worker-facing dashboard app
/apps/api → Backend API (Hono.js server)
/packages/auth → Authentication utilities
/packages/database → Database client & queries
/packages/plugins → Plugin system (Google Calendar, Airtable, Notion)
/packages/shared → Shared types, constants, validators
/packages/sms → SMS provider integrations
/packages/tokens → Token generation & validation
/packages/ui → Shared UI components (buttons, inputs, etc.)
/supabase/migrations → Database schema migrations
/docs → Project documentation
/specs → Feature specifications
.env → Environment variables (never commit)
```

## Key Decisions

- **Monorepo architecture** using Turborepo + pnpm workspaces for code sharing
- **Multi-tenant by design** with Row Level Security (RLS) enforced at database level
- **Plugin-based data sources** - all external integrations go through `/packages/plugins` adapters
- **Token-based worker access** - time-limited, single-use tokens instead of traditional auth
- **API-first approach** - all data fetching goes through `/apps/api`, never directly from frontend
- **Client components only when needed** - React components default to client-side (Vite SPA)
- **Shared packages** for cross-app code reuse (types, UI, business logic)
- **SMS abstraction layer** in `/packages/sms` with provider fallback support

## Naming Conventions

- **Components**: PascalCase (`WorkerProfile.tsx`, `SMSModal.tsx`)
- **Utilities/hooks**: camelCase (`useAuth.ts`, `queryClient.ts`)
- **Pages**: PascalCase files in lowercase folders (`pages/dashboard/Dashboard.tsx`)
- **Packages**: kebab-case with scoped names (`@dashboard-link/auth`)
- **API routes**: kebab-case (`/api/workers`, `/api/send-sms`)

## Database Patterns

- **RLS is mandatory** - Every table MUST have Row Level Security policies
- **Tenant isolation** - All queries automatically filtered by `organization_id` via RLS
- **Soft deletes** - Use `deleted_at` timestamp, never hard delete user data
- **Migrations only** - Schema changes ONLY via `/supabase/migrations/*.sql`
- **No direct SQL in app code** - Use `/packages/database` query functions
- **Supabase client** - Import from `@dashboard-link/database`, never instantiate directly

## API Patterns

- **Hono.js framework** - All API routes in `/apps/api/src/routes`
- **Zod validation** - Use `@hono/zod-validator` for all request validation
- **Error responses** - Return structured JSON: `{ success: false, error: "message" }`
- **Success responses** - Return structured JSON: `{ success: true, data: {...} }`
- **Auth middleware** - Apply to all protected routes via Hono middleware chain
- **Rate limiting** - Configured globally, override per-route if needed
- **CORS** - Configured in `/apps/api/src/index.ts`, whitelist only known origins
- **No business logic in routes** - Routes validate input → call `/packages/*` functions → return response

## Plugin Patterns

- **Base adapter** - All plugins extend `BaseAdapter` from `@dashboard-link/plugins`
- **Required methods** - `getTodaySchedule()` and `getTodayTasks()` must be implemented
- **OAuth plugins** - Google Calendar uses OAuth flow, store tokens in `plugin_configs` table
- **API key plugins** - Airtable/Notion use API keys, store in `plugin_configs.credentials`
- **Manual entry** - Special plugin that reads from `manual_schedules` and `manual_tasks` tables
- **Plugin registration** - Register in `/packages/plugins/src/registry.ts`
- **Error handling** - Plugins must handle API failures gracefully, return empty arrays on error

## Error Handling

- **Frontend**: Use React Error Boundaries + `react-hot-toast` for user-facing errors
- **Backend**: Hono error handler catches all, logs to console (Sentry in production)
- **Validation errors**: Return 400 with Zod error details
- **Auth errors**: Return 401 with generic message (no leak)
- **Not found**: Return 404 with resource type
- **Server errors**: Return 500, log full stack trace, show generic message to user

## Testing Strategy

- **Unit tests**: Vitest for all `/packages/*` business logic (target: 95%+ coverage)
- **Integration tests**: API route tests with MSW for external API mocking
- **Component tests**: React Testing Library for critical UI flows
- **E2E tests**: Not yet implemented (Playwright planned)
- **Run before commit**: `pnpm test` via git hooks (simple-git-hooks)
- **CI/CD**: All tests run on PR via GitHub Actions

## Security Rules

- **Never commit secrets** - Use `.env` files, check `.gitignore`
- **RLS enforced** - Database queries MUST respect tenant boundaries
- **Token expiry** - Worker tokens expire (1h-24h), validate on every request
- **Input validation** - Zod schemas for ALL user input (API + forms)
- **SQL injection** - Use parameterized queries only (Supabase client handles this)
- **XSS protection** - React escapes by default, never use `dangerouslySetInnerHTML`
- **CORS whitelist** - Never use `*` in production

## State Management

- **Global state**: Zustand stores in `/apps/admin/src/store` (auth, organization, UI state)
- **Server state**: TanStack Query for all API data fetching (never use `useState` for server data)
- **Form state**: React Hook Form + Zod validation for all forms
- **Local state**: `useState` only for UI-only state (modals, toggles, local input)
- **Query keys**: Consistent naming in `/apps/admin/src/lib/queryClient.ts`
- **Cache invalidation**: Invalidate queries after mutations (create/update/delete)

## Frontend Patterns

- **Data fetching**: Use TanStack Query hooks, never fetch in `useEffect`
- **Loading states**: Show skeletons/spinners during queries (`isLoading` state)
- **Error states**: Display user-friendly messages via `react-hot-toast`
- **Optimistic updates**: Use for better UX on mutations (TanStack Query `onMutate`)
- **Component composition**: Prefer small, focused components over large monoliths
- **Props drilling**: Avoid deep prop drilling, use Zustand or React Context for shared state
- **Styling**: Tailwind utility classes only, no custom CSS files (except global styles)

## Development Workflow

- **Branch strategy**: `main` (production) ← `develop` ← feature branches
- **Commit format**: Conventional commits (`feat:`, `fix:`, `docs:`, etc.)
- **Pre-commit hooks**: Lint + format via `lint-staged`
- **Code review**: Required for all PRs to `main`
- **Local dev**: `pnpm dev` starts all apps concurrently via Turbo
- **Database**: Local Supabase via Docker (`pnpm db:start`)
- **Environment sync**: Copy `.env.example` → `.env`, fill in secrets

---

## Quick Reference

**Add new API route**: `/apps/api/src/routes` → Hono route + Zod validation  
**Add new component**: `/apps/admin/src/components` → PascalCase.tsx  
**Add database table**: `/supabase/migrations` → new .sql file with RLS policies  
**Add plugin**: `/packages/plugins/src/adapters` → extend `BaseAdapter`  
**Run tests**: `pnpm test` (all), `pnpm test:coverage` (with coverage)  
**Check types**: `pnpm typecheck` (all packages)  
**Format code**: `pnpm format` (Prettier)  
**Lint code**: `pnpm lint` (ESLint)
