# Area - Security hardening and data lifecycle

## Frontend
- [ ] Add admin UI for audit log viewing and export.
- [ ] Add admin UI for quota usage and retention settings visibility.

## Backend
- [ ] Implement audit logging hooks for admin actions and security events.
- [ ] Implement data retention jobs for SMS logs, dashboard data, and manual data.
- [ ] Implement GDPR delete/anonymize workflows for workers and admins.

## API
- [ ] Add endpoints for audit log listing and export.
- [ ] Add endpoints to request data export and data deletion for a user.
- [ ] Enforce tenant quotas on workers, SMS volume, and plugin count.

## Third-party
- [ ] Implement secure storage and rotation for integration tokens.

## Data
- [ ] Add migrations for audit logs, quota tracking, and retention metadata.
- [ ] Update RLS policies to cover new tables and audit log access.
- [ ] Add archival tables or storage integrations for warm/cold retention tiers.

## Infra
- [ ] Set up automated backups with retention aligned to RTO/RPO targets.
- [ ] Configure secrets management for encryption keys and integration tokens.

## Testing/QA
- [ ] Add tests for quota enforcement, audit logging, and deletion workflows.
- [ ] Add data retention job tests with time-based fixtures.

## Security/Compliance
- [ ] Validate defense-in-depth controls (RBAC, least privilege, RLS coverage).
- [ ] Document data handling and retention policies for compliance.

## Ops/Monitoring
- [ ] Add alerts for quota breaches, backup failures, and audit log anomalies.

**Definition of done:** Tenant quotas, audit logs, and data lifecycle workflows are enforced and tested.

## Needs decision (with suggestions)
- Needs decision: Plugin config secret storage method. Suggestion: use Supabase Vault or field-level encryption with KMS and service-role access.
- Needs decision: Retention durations if they differ from the blueprint. Suggestion: use blueprint defaults for SMS logs and audit logs unless legal requirements change.
