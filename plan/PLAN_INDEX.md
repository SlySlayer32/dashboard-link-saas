# CleanConnect Plan Index

## How to use
- Use the numbered development order below as the default path.
- Keep V1 scope tight unless a Needs decision item expands it.
- Follow Zapier-style layering (core -> contracts -> adapters) and shared types.
- Keep vendor SDKs in adapters only; routes call services and contracts.

## Development order (start here)

1) Foundation setup (local dev works)
	- plan/1/AREA_FOUNDATION_SETUP.md
	- plan/1/PLAYBOOK_FOUNDATION_SETUP.md
	- docs/SETUP_CHECKLIST.md
	- ENV.example

2) Core user flows (build the thin slice)
	- plan/2/AREA_CORE_USER_FLOWS.md
	- plan/2/PLAYBOOK_USER_FLOWS.md
	- docs/V1_IMPLEMENTATION_CHECKLIST.md

3) Connectors and service boundaries (keep vendor churn isolated)
	- plan/3/BACKEND_SERVICES.md
	- plan/3/PLAYBOOK_CONNECTORS.md

4) Data infra foundations (schemas, invariants, replay safety)
	- plan/4/DATA_INFRA.md
	- plan/4/PLAYBOOK_DATA_INFRA.md

5) Reliability + async (retries, jobs, rollout safety)
	- plan/5/AREA_PLATFORM_RELIABILITY_ASYNC.md
	- plan/5/PLAYBOOK_PLATFORM_RELIABILITY_ASYNC.md

6) Security + QA (RLS, lifecycle, correctness gates)
	- plan/6/AREA_SECURITY_DATA_LIFECYCLE.md
	- plan/6/PLAYBOOK_SECURITY_DATA_LIFECYCLE.md

7) Deployment, billing, ops (ship and run it)
	- plan/7/AREA_DEPLOYMENT_BILLING_OPS.md
	- plan/7/PLAYBOOK_DEPLOYMENT_BILLING_OPS.md

8) Decisions log (when something is ambiguous)
	- plan/8/NEEDS_DECISIONS.md
	- plan/8/PLAYBOOK_DECISIONS.md

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
- plan/1/AREA_FOUNDATION_SETUP.md
- plan/2/AREA_CORE_USER_FLOWS.md
- plan/3/BACKEND_SERVICES.md
- plan/4/DATA_INFRA.md
- plan/5/AREA_PLATFORM_RELIABILITY_ASYNC.md
- plan/6/AREA_SECURITY_DATA_LIFECYCLE.md
- plan/7/AREA_DEPLOYMENT_BILLING_OPS.md
- plan/8/NEEDS_DECISIONS.md

Each area file includes its definition of done; use those statements to gate progress to the next area.

## Playbooks (canonical how-to)
- plan/1/PLAYBOOK_FOUNDATION_SETUP.md
- plan/2/PLAYBOOK_USER_FLOWS.md
- plan/3/PLAYBOOK_CONNECTORS.md
- plan/4/PLAYBOOK_DATA_INFRA.md
- plan/5/PLAYBOOK_PLATFORM_RELIABILITY_ASYNC.md
- plan/6/PLAYBOOK_SECURITY_DATA_LIFECYCLE.md
- plan/7/PLAYBOOK_DEPLOYMENT_BILLING_OPS.md
- plan/8/PLAYBOOK_DECISIONS.md

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

## Decisions log
See `plan/8/NEEDS_DECISIONS.md` for the canonical list and updates.
