# Data and infrastructure plan

See [NEEDS_DECISIONS.md](NEEDS_DECISIONS.md) for open questions.

## Core schema and baseline RLS
- [ ] Run migrations and optional seed data to validate schema and RLS policies.
- [ ] Add test fixtures and seed data for workers, dashboards, and manual items.
- [ ] Validate RLS policies for dashboards, widgets, manual data, and sms logs.

## Tokens and SMS logs
- [ ] Align token storage schema with DatabaseTokenProvider (hash, payload, metadata, refresh tokens).
- [ ] Update `sms_logs` schema to include fields used by the SMS service (provider and error details).
- [ ] Add indexes for token lookups, sms log queries, and manual data filters.
- [ ] Validate migrations for tokens and sms logs align with service usage.

## Webhook events and queues
- [ ] Use `packages/database/migrations/002_webhook_events.sql` for event storage and add indexes as needed.
- [ ] Add queue status tables to support DLQ inspection and replay.

## Audits and retention
- [ ] Add migrations for audit logs, quota tracking, and retention metadata.
- [ ] Update RLS policies to cover new tables and audit log access.
- [ ] Add archival tables or storage integrations for warm/cold retention tiers.

## Billing
- [ ] Add migrations for billing plans, subscriptions, and usage metering tables.
