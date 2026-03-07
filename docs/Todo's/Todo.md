Here's a comprehensive list of all TODO markers left in the documentation:

## Database & Schema
- **DATABASE-SCHEMA.md**: Document exact column types and constraints from `supabase/migrations/20260124231200_mvp_schema.sql`
- **DATABASE-SCHEMA.md**: Document indexes from `supabase/migrations/20260124231202_indexes.sql`

## Architecture & Diagrams
- **ARCHITECTURE.md**: Create system diagram showing Client Layer → API Gateway → Application Layer → Data Layer → Integration Layer

## API Documentation
- **API-OVERVIEW.md**: Add production API URL once deployed
- **API-OVERVIEW.md**: Document rate limits once implemented (e.g., 100 requests/minute per organization, 10 SMS sends/minute)
- **ENDPOINTS.md**: Add specific request/response schemas for each endpoint once finalized
- **ENDPOINTS.md**: Document pagination format (cursor-based vs offset-based)
- **ENDPOINTS.md**: Document webhook endpoints for plugin integrations
- **THIRD-PARTY-APIS.md**: Add Stripe API documentation once billing integration is implemented (Phase 2)
- **THIRD-PARTY-APIS.md**: Document webhook signature verification for each provider
- **BACKEND.md**: Document specific API response schemas and error codes once endpoints are finalized

## Testing
- **TESTING.md**: Document specific test commands and coverage targets once test suite is established
- **TESTING.md**: Add test coverage targets (e.g., >80% for critical paths)
- **TESTING.md**: Add CI/CD integration (run tests on every PR)

## Security
- **SECURITY.md**: Add security audit checklist for pre-production launch
- **SECURITY.md**: Document incident response plan for security breaches
- **SECURITY.md**: Add OWASP Top 10 compliance checklist

## Deployment
- **DEPLOYMENT.md**: Add staging URLs once deployed
- **DEPLOYMENT.md**: Add production URLs once deployed
- **DEPLOYMENT.md**: Add specific deployment commands once hosting providers are configured
- **DEPLOYMENT.md**: Document database backup strategy (frequency, retention, restore process)
- **DEPLOYMENT.md**: Add monitoring and alerting setup (Sentry, uptime monitoring)

## Product & Features
- **USER-FLOWS.md**: Add user flow for plugin disconnection/reconnection
- **USER-FLOWS.md**: Add user flow for worker deletion and data cleanup
- **USER-FLOWS.md**: Add user flow for organization settings update
- **FEATURES.md**: Update status as features are completed
- **FEATURES.md**: Add estimated completion dates for planned features
- **PRICING.md**: Finalize free tier limits (if offering free tier)
- **PRICING.md**: Add annual billing discount (e.g., 2 months free)
- **PRICING.md**: Document refund policy
- **PRICING.md**: Add pricing page copy and FAQ

**Total: 31 TODO items** across 10 documentation files.

Most are waiting on:
1. **Implementation completion** (API schemas, test suite, deployment)
2. **Business decisions** (pricing tiers, free tier limits)
3. **Infrastructure setup** (production URLs, monitoring tools)