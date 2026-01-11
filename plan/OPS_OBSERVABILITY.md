# Ops and observability plan

See [NEEDS_DECISIONS.md](NEEDS_DECISIONS.md) for open questions.

## Environment and runtime setup
- [ ] Start local Supabase and copy `supabase status` values into `.env` and Vite envs.
- [ ] Ensure `.env` includes Supabase keys, Google API key, SMS provider credentials, and `JWT_SECRET`.
- [ ] Update `ENV.example` with all required V1 keys.
- [ ] Ensure `ENV.example` includes all required V1 keys and notes.

## Queue and infrastructure readiness
- [ ] Provision Redis for BullMQ and configure TLS and per-environment isolation.
- [ ] Add env configs for queue concurrency and retry policies.

## Backups, secrets, and lifecycle infrastructure
- [ ] Set up automated backups with retention aligned to RTO/RPO targets.
- [ ] Configure secrets management for encryption keys and integration tokens.

## Deployment operations
- [ ] Set up CI/CD pipelines with staging and production environments.
- [ ] Implement blue/green or canary deployment strategy and rollback.

## Logging, metrics, and alerting
- [ ] Verify API logs show startup and health check entries.
- [ ] Add structured logs for auth, dashboard fetch, and SMS send flows.
- [ ] Verify logs include request and organization identifiers in core routes.
- [ ] Add structured logs with correlation IDs for async jobs.
- [ ] Add metrics for queue depth, failure rates, and SMS delivery rates.
- [ ] Implement tracing for request -> queue -> worker flows.
- [ ] Add alerts for quota breaches, backup failures, and audit log anomalies.
- [ ] Create incident runbooks and disaster recovery drills.
- [ ] Add alerts for billing failures and deployment regressions.
