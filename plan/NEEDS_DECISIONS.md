# Needs decisions

This list consolidates open decisions across phases. Review and resolve before expanding scope. See the detailed plans for context.

- Needs decision: V1 plugin scope (Google Calendar only vs include Manual data UI). Suggestion: keep UI Google-only for V1, but implement manual data backend CRUD now to remove placeholders and enable later UI.
- Needs decision: Token storage schema (expand `worker_tokens` vs add new tables). Suggestion: add new `tokens` and `refresh_tokens` tables matching DatabaseTokenProvider and migrate token manager to them; keep `worker_tokens` only if required for legacy links.
- Needs decision: Google Calendar auth method (API key vs OAuth). Suggestion: V1 uses API key for shared/public calendars; Phase 2 adds OAuth for private calendars.
- Needs decision: Default dashboard contents. Suggestion: create one dashboard per worker with a single Google Calendar widget and a simple config payload.
- Needs decision: Dashboard model usage. Suggestion: create one dashboard per worker with a single Google Calendar widget in V1; expand widgets when multiple plugins are enabled.
- Needs decision: Redis hosting provider. Suggestion: use managed Redis (Upstash or Redis Cloud) with TLS and per-environment databases.
- Needs decision: Observability stack. Suggestion: start with Sentry plus JSON logs and add Grafana Cloud for metrics/tracing.
- Needs decision: Plugin config secret storage method. Suggestion: use Supabase Vault or field-level encryption with KMS and service-role access.
- Needs decision: Retention durations if they differ from the blueprint. Suggestion: use blueprint defaults for SMS logs and audit logs unless legal requirements change.
- Needs decision: Payment provider and pricing model. Suggestion: use Stripe with metered usage (SMS count + active workers) and enforce plan caps in the API.
