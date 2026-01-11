# CleanConnect Plan Index

## How to use
- Work areas in order; start with foundation setup, then core user flows, then platform reliability, security, and deployment.
- This index is organized user-flow-first: admin + worker flow plans come before platform areas.
- Keep V1 scope tight unless a Needs decision item expands it.
- Follow Zapier-style layering (core -> contracts -> adapters) and shared types.
- Keep vendor SDKs in adapters only; routes call services and contracts.

## Migration note (2026-01-10)
- Phase-based plan files in `plan/PHASE_*.md` were superseded by the area-based plans below and removed to keep a single source of truth.

## Docs reviewed
- AGENTS.md
- CHANGELOG.md
- README.md
- apps/AGENTS.md
- apps/admin/AGENTS.md
- apps/admin/src/AGENTS.md
- apps/admin/src/components/AGENTS.md
- apps/admin/src/docs/AGENTS.md
- apps/admin/src/docs/AUTH_SETUP.md
- apps/admin/src/hooks/AGENTS.md
- apps/admin/src/lib/AGENTS.md
- apps/admin/src/pages/AGENTS.md
- apps/admin/src/services/AGENTS.md
- apps/admin/src/store/AGENTS.md
- apps/admin/src/test/AGENTS.md
- apps/admin/src/types/AGENTS.md
- apps/admin/src/utils/AGENTS.md
- apps/api/AGENTS.md
- apps/api/src/AGENTS.md
- apps/api/src/config/AGENTS.md
- apps/api/src/middleware/AGENTS.md
- apps/api/src/routes/AGENTS.md
- apps/api/src/services/AGENTS.md
- apps/api/src/test/AGENTS.md
- apps/api/src/types/AGENTS.md
- apps/api/src/utils/AGENTS.md
- apps/worker/AGENTS.md
- apps/worker/src/AGENTS.md
- apps/worker/src/components/AGENTS.md
- apps/worker/src/hooks/AGENTS.md
- apps/worker/src/lib/AGENTS.md
- apps/worker/src/pages/AGENTS.md
- docs/AGENTS.md
- docs/ARCHITECTURE_BLUEPRINT.md
- docs/ARCHITECTURE_RESEARCH_SUMMARY.md
- docs/CORE_INFRA_PLAN.md
- docs/PROJECT_FOUNDATION.md
- docs/SETUP_CHECKLIST.md
- docs/V1_IMPLEMENTATION_CHECKLIST.md
- packages/AGENTS.md
- packages/auth/AGENTS.md
- packages/auth/src/AGENTS.md
- packages/database/AGENTS.md
- packages/database/migrations/AGENTS.md
- packages/database/src/AGENTS.md
- packages/plugins/AGENTS.md
- packages/plugins/src/AGENTS.md
- packages/plugins/src/__tests__/README.md
- packages/shared/AGENTS.md
- packages/shared/src/AGENTS.md
- packages/sms/AGENTS.md
- packages/sms/README.md
- packages/sms/SECURITY_AND_PRODUCTION_NOTES.md
- packages/sms/src/AGENTS.md
- packages/tokens/AGENTS.md
- packages/tokens/src/AGENTS.md
- packages/ui/AGENTS.md
- packages/ui/src/AGENTS.md
- packages/ui/src/components/AGENTS.md
- packages/ui/src/hooks/AGENTS.md
- packages/ui/src/lib/AGENTS.md
- packages/ui/src/test/AGENTS.md
- packages/ui/src/tokens/AGENTS.md
- packages/ui/src/utils/AGENTS.md
- supabase/AGENTS.md

## Area-based plan files
- plan/AREA_FOUNDATION_SETUP.md
- plan/AREA_CORE_USER_FLOWS.md
- plan/AREA_PLATFORM_RELIABILITY_ASYNC.md
- plan/AREA_SECURITY_DATA_LIFECYCLE.md
- plan/AREA_DEPLOYMENT_BILLING_OPS.md

Each area file includes its definition of done; use those statements to gate progress to the next area.

## Domain plan files
- plan/FRONTEND_USER_FLOW.md
- plan/BACKEND_SERVICES.md
- plan/DATA_INFRA.md
- plan/QA_SECURITY.md
- plan/OPS_OBSERVABILITY.md
- plan/NEEDS_DECISIONS.md

## Global constraints
- TypeScript everywhere, ESM modules, Zod validation for inputs.
- Prefer shared types from @dashboard-link/shared.
- Keep vendor SDKs in adapters under packages/*/src.
- Keep services clean of vendor SDKs; use contracts and registries.
- Follow the API response shape rule: return { success, data, error }.

## V1 acceptance criteria summary
- Admin can sign up, create org, add workers, connect Google Calendar, and send a dashboard SMS.
- Worker can open SMS link and see today's schedule and tasks from Google Calendar.
- Tokens expire as configured; expired and invalid links show correct error states.
- SMS logs are recorded per organization and visible in admin.
- Core API routes and repositories have passing tests.

## Needs decision summary (with suggestions)
See plan/NEEDS_DECISIONS.md for the canonical list and updates.
- Needs decision: V1 plugin scope (Google Calendar only vs include Manual data UI). Suggestion: keep UI Google-only for V1, but implement manual data backend CRUD now to remove placeholders and unblock later UI.
- Needs decision: Token storage schema (worker_tokens vs a dedicated tokens table). Suggestion: add new tokens and refresh_tokens tables matching DatabaseTokenProvider, migrate token manager to the new tables, and keep worker_tokens only if required for legacy links.
- Needs decision: Google Calendar auth method. Suggestion: V1 uses API key for shared/public calendars; Phase 2 adds OAuth for private calendars and per-user access.
- Needs decision: Dashboard model usage. Suggestion: create one dashboard per worker with a single Google Calendar widget in V1; expand widgets when multiple plugins are enabled.
- Needs decision: Plugin config secret storage. Suggestion: use Supabase Vault or field-level encryption with KMS and service-role access; avoid plaintext JSONB.
- Needs decision: Redis hosting for BullMQ. Suggestion: use managed Redis (Upstash or Redis Cloud) with TLS and per-environment databases.
- Needs decision: Observability stack. Suggestion: start with structured JSON logs and Sentry; add Grafana Cloud for metrics and tracing in Phase 2.
- Needs decision: Billing provider and limits. Suggestion: Stripe with metered usage for SMS and worker counts, enforced by app quotas.
