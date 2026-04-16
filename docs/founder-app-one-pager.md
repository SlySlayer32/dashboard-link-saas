# Dashboard Link | Founder One-Pager
Generated from the current repo structure on 2026-04-06.
Dashboard Link is a multi-tenant SaaS product for field-service teams. Managers create worker records, add schedules and tasks, send a secure SMS link, and then confirm whether each worker opened their mobile dashboard.

## What It Does
- Solves the "where do I go, what do I do, and what is the access code?" problem for deskless workers.
- Uses SMS instead of app installs, logins, or chat threads, so casual and rotating staff can open their day plan in one tap.
- Keeps the manager in control: workers, schedules, tasks, tokens, plugins, SMS history, and dashboard-open tracking all sit in one admin flow.
- Current MVP launch path is the Scheduling workspace first, with plugin integrations available in the repo for Google Calendar, Airtable, Notion, and manual sync.

## Core Product Flow
- 1. Manager logs into the admin portal.
- 2. Manager creates or updates workers.
- 3. Manager adds schedule items and task items, mainly through Scheduling.
- 4. Manager sends a secure dashboard link by SMS.
- 5. Worker opens the mobile dashboard from the SMS, sees today's schedule and tasks, and can refresh to get updates.
- 6. Manager checks SMS delivery and dashboard-open history to confirm the message was actually received and opened.

## What The App Contains
- `apps/admin`: manager-facing React app for operations and setup.
- `apps/worker`: public worker-facing React app opened from an SMS link.
- `apps/api`: Hono + Node API for auth, worker data, tokens, SMS, plugins, and public dashboard redemption.
- `packages/auth`: authentication providers and auth utilities.
- `packages/database`: repositories and data-access layer.
- `packages/shared`: shared types, schemas, contracts, and validators.
- `packages/sms`: provider abstraction and SMS queue/service logic.
- `packages/tokens`: token generation and validation support.
- `packages/ui`: shared UI kit, auth components, loading states, and worker access components.
- `supabase`: schema, RLS policies, and indexes.

## Admin Pages
- `/login` LoginPage: branded access screen with `MagicLinkAuth`; supports password login, magic-link login, and signup.
- `/` DashboardPage: overview screen with quick actions, KPI cards (`DashboardStats`), recent activity (`RecentActivity`), and an MVP workflow checklist.
- `/workers` WorkersPage: searchable/filterable worker roster with `WorkerList` plus modal-based `WorkerForm` for create and edit.
- `/workers/:id` WorkerDetailPage: three-tab worker record with `WorkerProfile`, `WorkerActions`, `SmsHistory`, and `AccessLogHistory`.
- `/manual-data` Scheduling workspace: date-range-led planner, worker selector, assignment counts, tabs for schedule vs tasks, direct send-dashboard-link action, and add/edit forms for both item types.
- `/tokens` TokensPage: token stats, filters, token table, revoke/regenerate controls, and bulk cleanup for expired tokens.
- `/sms-logs` SMSLogsPage: delivery log table, resend action, and filters by worker, status, date, and search term.
- `/plugins` PluginsPage: plugin cards, enable/disable controls, configuration modal, and connection test action.
- `/settings` SettingsPage: organization details, editable defaults, usage summary placeholder, and destructive controls in `DangerZone`.

## Worker Pages
- `/` LandingPage: simple instruction page that tells workers to use the SMS link they received.
- `/dashboard/:token` DashboardPage: token-gated mobile dashboard with `WorkerAccess`, refresh control, pull-to-refresh, `ScheduleWidget`, `TasksWidget`, and empty states.
- `/error/invalid-token` InvalidTokenPage: explains cancelled, used, or malformed links and directs the worker to request a new one.
- `/error/expired-token` ExpiredTokenPage: explains time-limited access and tells the worker how to get a fresh link.
- `/error/not-found` NotFoundPage: fallback for bad routes.

## Major Components
- Admin shell: `Navigation`, `ProtectedRoute`, `PageSkeleton`, toast notifications, and auto-refresh behavior.
- Worker management: `WorkerList`, `WorkerCard`, `WorkerForm`, `DeleteWorkerDialog`, `WorkerProfile`, `WorkerActions`.
- Manual content: `ManualDataList`, `ScheduleItemForm`, `TaskItemForm`.
- Messaging and access: `SMSModal`, `SMSLogTable`, `SmsHistory`, `AccessLogHistory`, `TokenTable`, `TokenActions`.
- Integrations and settings: `PluginCard`, `PluginConfigForm`, `OrganizationForm`, `DangerZone`.
- Worker experience: `WorkerAccess`, `ScheduleWidget`, `TasksWidget`, `ErrorLayout`, `PageSkeleton`.
- Shared UI base: buttons, cards, modals, inputs, tabs, loading spinners, and auth widgets live in `packages/ui`.

## API And Data Setup
- Public API: dashboard token redemption, worker dashboard by token, and provider webhooks.
- Protected API: worker CRUD, worker stats, access logs, manual schedule/tasks CRUD, SMS send/send-link/logs, token list/stats/revoke/regenerate, plugin CRUD/test, dashboard stats, and organization lookup.
- Middleware: auth, tenant scoping, rate limiting, cache, and global error handling.
- Data model: Supabase/Postgres stores workers, dashboard tokens, SMS logs, access logs, schedule items, task items, organizations, and adapter configs.
- Security posture: tenant isolation is enforced through organization scoping and Supabase RLS policies; worker links are time-limited and can be revoked.

## Best Refinement Levers
- Worker dashboard content: what fields matter most on the day view.
- Manager workflow: whether the MVP should stay manual-first or push harder on integrations.
- SMS behavior: wording, timing, resend rules, expiry length, and read-confirmation reporting.
- Plugins: which integrations are truly launch-critical versus nice-to-have.
- Commercial setup: branding, analytics, billing, and whether the admin app needs a stronger mobile owner-operator experience.
