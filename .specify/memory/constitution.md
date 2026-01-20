<!--
Sync Impact Report:
- Version change: 1.1.0 → 1.2.0 (minor: four new principles added for code quality,
  testing, UX consistency, and performance)
- Modified principles: None (existing principles unchanged)
- Added sections:
  - Core Principles VII. Code Quality & Maintainability
  - Core Principles VIII. Testing Standards & Discipline
  - Core Principles IX. User Experience Consistency
  - Core Principles X. Performance Requirements & Optimization
  - Development Workflow: Code Review Standards (new subsection)
  - Development Workflow: Performance Validation (new subsection)
- Removed sections: None
- Templates requiring updates:
  ✅ .specify/templates/plan-template.md (performance goals already present)
  ✅ .specify/templates/spec-template.md (success criteria align with new principles)
  ✅ .specify/templates/tasks-template.md (test tasks and polish phase align)
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

### VII. Code Quality & Maintainability
All code MUST be written in TypeScript with strict mode enabled - no JavaScript
in source files. Code MUST follow single responsibility principle with functions
under 50 lines and files under 500 lines. Shared logic MUST be extracted to
packages/shared/ or packages/ui/. All public APIs MUST have TypeScript
interfaces with JSDoc comments. Code MUST use meaningful variable names (no
single letters except loop indices). Error handling MUST be explicit with typed
errors - no silent failures or generic catch blocks. Dependency injection MUST
be used for testability. Circular dependencies are FORBIDDEN. All configuration
MUST be externalized via environment variables with validation at startup.

**Rationale**: Maintainable code reduces technical debt, enables faster feature
development, and prevents bugs. TypeScript provides type safety that catches
errors at compile time. Small, focused functions are easier to test and reason
about.

### VIII. Testing Standards & Discipline
All features MUST include tests before merging to main. Test coverage targets:
API endpoints 90%+, React components 85%+, utility functions 95%+. Tests MUST
follow the testing pyramid: many unit tests, fewer integration tests, minimal
E2E tests. Unit tests MUST be fast (<100ms each) and isolated with no external
dependencies. Integration tests MUST use test databases and mock external APIs.
Contract tests MUST validate API request/response schemas. Tests MUST be
organized by feature in parallel with source structure. Test names MUST clearly
describe what is being tested and expected behavior (Given-When-Then format).
Flaky tests MUST be fixed immediately or removed. All tests MUST pass before
deployment - no exceptions.

**Rationale**: Tests prevent regressions, enable confident refactoring, and
serve as living documentation. The testing pyramid balances coverage with speed.
Fast, reliable tests encourage frequent execution during development.

### IX. User Experience Consistency
All UI components MUST use shadcn/ui patterns with Tailwind CSS - no custom CSS
frameworks. Mobile interfaces MUST have touch targets ≥44px and font sizes
≥16px to prevent zoom. Loading states MUST be shown for operations >200ms.
Error messages MUST be user-friendly with actionable guidance (not technical
stack traces). Forms MUST validate on blur with inline error messages. Success
feedback MUST be immediate and clear. Navigation MUST be consistent across
admin and worker apps. Keyboard navigation and screen reader support MUST work
for all interactive elements. Color contrast MUST meet WCAG AA standards
(4.5:1 for text). Empty states MUST guide users toward next actions.

**Rationale**: Consistent UX reduces cognitive load and training time. Mobile
optimization ensures workers can use the system effectively in the field.
Accessibility ensures the platform is usable by all workers regardless of
ability.

### X. Performance Requirements & Optimization
API endpoints MUST respond in <500ms at p99 for all CRUD operations. Dashboard
page load MUST complete in <2s on 3G mobile connections. Database queries MUST
use indexes for all WHERE, JOIN, and ORDER BY clauses. N+1 queries are
FORBIDDEN - use eager loading or batching. API responses MUST use pagination
for collections >100 items. Images MUST be optimized and served via CDN with
lazy loading. Bundle sizes MUST be monitored - admin app <500KB, worker app
<300KB (gzipped). React components MUST use memo/useMemo for expensive
computations. Unnecessary re-renders MUST be eliminated. Database connection
pools MUST be configured for expected load. Cache headers MUST be set for
static assets (1 year) and API responses (appropriate TTL).

**Rationale**: Performance directly impacts user satisfaction and operational
costs. Mobile workers often have limited bandwidth and older devices. Fast
responses reduce frustration and increase productivity. Efficient resource
usage reduces infrastructure costs.

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

### Code Review Standards
All pull requests MUST be reviewed before merging. Reviewers MUST verify:
- TypeScript strict mode compliance with no `any` types except where justified
- Test coverage meets targets with meaningful assertions
- Error handling is explicit with typed errors
- Mobile responsiveness for UI changes (test on actual device or emulator)
- Performance impact (bundle size, query efficiency, render optimization)
- Accessibility compliance (keyboard nav, screen reader, color contrast)
- Security considerations (input validation, authorization checks, secret handling)
- Documentation updates for public APIs and complex logic
PRs MUST be small (<400 lines changed) to enable thorough review. Breaking
changes MUST include migration guides. All review comments MUST be resolved
before merge.

### Performance Validation
Before production deployment, MUST validate:
- API response times: p50 <200ms, p99 <500ms (use load testing tools)
- Database query performance: EXPLAIN ANALYZE for new queries, verify indexes
- Frontend bundle sizes: admin <500KB, worker <300KB (gzipped)
- Lighthouse scores: Performance >90, Accessibility >95, Best Practices >90
- Mobile performance: test on 3G throttled connection, verify <2s page load
- Memory usage: no memory leaks in long-running processes
Performance regressions >20% MUST be investigated and resolved before merge.

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

### Constitutional Supremacy
This constitution supersedes all other practices and documentation. When
conflicts arise between this constitution and other documentation, the
constitution takes precedence. All technical decisions MUST align with core
principles.

### How Principles Guide Technical Decisions
When evaluating technical choices, MUST consider impact on principles:
- **Code Quality (VII)**: Does this introduce complexity? Can it be tested? Is it maintainable?
- **Testing (VIII)**: Can this be unit tested? Does it require integration tests? Is it testable in isolation?
- **UX Consistency (IX)**: Does this match existing patterns? Is it accessible? Does it work on mobile?
- **Performance (X)**: What is the performance impact? Does it add bundle size? Will it scale?

Decisions that violate principles require explicit justification and
constitutional amendment. Convenience NEVER justifies principle violations.

### Implementation Choice Governance
When multiple implementation approaches exist, MUST choose based on:
1. **Principle alignment**: Which approach best satisfies constitutional principles?
2. **Simplicity**: Prefer simpler solutions that meet requirements
3. **Testability**: Choose approaches that are easier to test
4. **Performance**: Consider performance implications early
5. **Maintainability**: Favor code that future developers can understand

Document significant technical decisions with rationale in ADRs (Architecture
Decision Records) referencing relevant constitutional principles.

### Amendment Process
Constitutional amendments require:
1. Documentation of proposed changes with rationale
2. Impact analysis on existing codebase and principles
3. Approval from project maintainer
4. Version increment following semantic versioning:
   - MAJOR: Backward incompatible principle removals or redefinitions
   - MINOR: New principles or materially expanded guidance
   - PATCH: Clarifications, wording improvements, non-semantic refinements
5. Update of all dependent templates and documentation
6. Migration plan for any breaking changes
7. Communication to all team members

### Compliance Verification
All PRs and reviews MUST verify compliance with these principles. Reviewers
MUST check:
- Code quality standards (TypeScript strict, function size, error handling)
- Test coverage and quality (pyramid, isolation, meaningful assertions)
- UX consistency (shadcn/ui, mobile optimization, accessibility)
- Performance requirements (response times, bundle sizes, query efficiency)

Technology choices are FIXED - alternatives require constitutional amendment.
For runtime development guidance, refer to docs/PROJECT_FOUNDATION.md,
docs/MVP_QUICKSTART.md, and docs/ARCHITECTURE_FUTURE_STATE.md (post-MVP).

**Version**: 1.2.0 | **Ratified**: 2025-01-21 | **Last Amended**: 2026-01-21
