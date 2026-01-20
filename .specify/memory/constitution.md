<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.1.0 (minor: new observability/resilience principle
  and expanded architecture requirements)
- Modified principles:
  - II. Secure Tokenized Access → II. Secure Tokenized & Auditable Access
  - III. Plugin-Based Extensibility → III. Plugin-Based Extensibility & Resilience
  - IV. SMS-First Delivery (post-MVP queueing requirements added)
- Added sections:
  - Core Principles VI. Observable & Resilient by Default
  - Architecture Requirements (observability, resilience, compliance additions)
- Removed sections: None
- Templates requiring updates:
  ✅ .specify/templates/plan-template.md (no changes required)
  ✅ .specify/templates/spec-template.md (no changes required)
  ✅ .specify/templates/tasks-template.md (observability tasks added)
- Follow-up TODOs: None
-->

# CleanConnect Constitution

## Core Principles

### I. Mobile-First Worker Experience
Every feature MUST prioritize the mobile worker experience. Workers access
dashboards via SMS links on phones, not desktops. UI MUST be optimized for
mobile screens, touch interactions, and intermittent connectivity. No
desktop-only worker features.

### II. Secure Tokenized & Auditable Access
All dashboard links MUST use time-limited tokens (1hr-24hr expiry). Tokens MUST
NOT require worker login. Security MUST include tenant isolation via RLS,
encrypted data in transit, audit logging, rate limiting, and webhook signature
verification for PUSH integrations.

### III. Plugin-Based Extensibility & Resilience
The system MUST use a plugin adapter pattern for all external integrations.
Each plugin MUST implement the base adapter interface, handle its own
authentication, and support PULL (fetch) and PUSH (webhook) patterns. Post-MVP,
adapters MUST include versioned contracts, health checks, rate limiting,
standardized error codes, and circuit breaker + retry protection. Core plugins:
Manual Entry, Google Calendar, Airtable, Notion.

### IV. SMS-First Delivery
SMS is the primary delivery mechanism for dashboard links. The system MUST
track delivery status, log all SMS for audit, support custom messages, handle
bulk sending, and include rate limiting per organization. Post-MVP, SMS
delivery MUST use queued processing with retries and dead letter handling to
ensure reliability. SMS provider is MobileMessage.com.au for Australian rates.

### V. Simple Admin Experience
Admin setup MUST be completable in under 2 minutes. Configuration flows MUST be
intuitive for non-technical users. Plugin setup SHOULD require minimal steps
(OAuth preferred over API keys) to reduce friction. All admin interfaces MUST
provide clear feedback and error messages.

### VI. Observable & Resilient by Default
Production systems MUST emit structured logs with request and tenant context
and capture metrics and traces for core workflows. Post-MVP, the platform MUST
define SLIs/SLOs (availability, latency, SMS delivery) with error budgets and
use queues, retries, and circuit breakers to prevent cascading failures.
Disaster recovery targets for production MUST meet RTO < 1 hour and
RPO < 5 minutes.

## Technology Constraints

### Fixed Technology Stack
- Frontend: Vite + React 18 + shadcn/ui + Tailwind + Zustand + TanStack Query
- Backend: Hono.js (NOT Express/Fastify) - chosen for 5x smaller memory footprint and TypeScript-first design
- Database: Supabase (PostgreSQL) - chosen for built-in RLS, Auth, Storage, and Realtime
- SMS: MobileMessage.com.au (Australia) - chosen for 2¢/SMS intro rate, no monthly fees
- Monorepo: Turborepo (NOT Nx) - chosen for simpler configuration and faster setup
- Deployment: Frontend on Vercel, Backend/DB on Supabase

### Architecture Requirements
- Multi-tenant by design with organization isolation at ALL layers and resource
  quotas per plan (post-MVP)
- Zapier-style plugin architecture with adapter registry and versioned
  contracts
- Event-driven processing for reliability (post-MVP) using queues and dead
  letter handling
- Circuit breakers + retry policies for external integrations (post-MVP)
- API versioning with URL pattern: /api/v1/, /api/v2/
- Security defense-in-depth (OAuth 2.0/JWT, rate limiting, audit logging,
  webhook signature verification for PUSH)
- Observability baseline: structured logs, metrics, tracing, SLI/SLOs with error
  budgets (post-MVP)
- Data lifecycle compliance (GDPR-ready retention, deletion, audit trails) for
  production (post-MVP)
- Disaster recovery readiness for production (RTO < 1 hour, RPO < 5 minutes)
- TypeScript throughout - no JavaScript in source files

## Development Workflow

### Quality Gates
- All API endpoints MUST have proper error responses
- Observability hooks (structured logs + core metrics) MUST exist for all core
  API flows before production releases
- Mobile views MUST be tested on actual phones
- Token expiry MUST work correctly in all scenarios
- SMS service MUST have test mode for development
- Plugin connections MUST handle failures gracefully
- Test coverage targets: API 90%+, React 85%+, Utils 95%+

### Code Organization
- Monorepo structure with apps/, packages/, and docs/ at root
- Shared types and utilities in packages/shared/
- UI components in packages/ui/ using shadcn/ui patterns
- Plugin adapters in packages/plugins/ with base adapter inheritance
- Each app (admin, worker, api) is independently deployable

### MVP Scope Discipline
V1 MUST include only: Auth system, Worker management, Google Calendar plugin,
SMS sending, Worker dashboard, Manual data entry backend. All other plugins,
webhooks, async processing, circuit breakers, observability stacks, SLOs,
disaster recovery, data lifecycle compliance, billing, and performance
optimizations are deferred until revenue. NO exceptions without explicit
business justification and constitutional amendment.

## Governance

This constitution supersedes all other practices and documentation. Amendments require:
1. Documentation of proposed changes with rationale
2. Approval from project maintainer
3. Version increment following semantic versioning
4. Update of all dependent templates and documentation
5. Migration plan for any breaking changes

All PRs and reviews MUST verify compliance with these principles. Technology
choices are FIXED - alternatives require constitutional amendment. For runtime
development guidance, refer to docs/PROJECT_FOUNDATION.md,
docs/MVP_QUICKSTART.md, and docs/ARCHITECTURE_FUTURE_STATE.md (post-MVP).

**Version**: 1.1.0 | **Ratified**: 2025-01-21 | **Last Amended**: 2026-01-20
