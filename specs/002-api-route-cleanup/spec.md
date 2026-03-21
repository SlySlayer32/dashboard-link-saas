# Feature Specification: API Route Cleanup

**Feature Branch**: `[002-api-route-cleanup]`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User description: "Create an API route cleanup feature that removes duplicate route definitions and fixes missing imports."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Eliminate Route Conflicts (Priority: P1)

As a developer, I need the API to have a single source of truth for worker routes so that there are no conflicting route definitions causing unexpected behavior.

**Why this priority**: Duplicate route definitions cause runtime errors and make the API behavior unpredictable. The Hono router may use either the inline or mounted route inconsistently.

**Independent Test**: After removing duplicate inline routes, all worker endpoints (GET /workers, POST /workers, etc.) should respond correctly through the mounted route from `./routes/workers`.

**Acceptance Scenarios**:

1. **Given** the API is running with duplicate routes, **When** the cleanup is applied, **Then** only ONE worker route definition exists in v1.ts
2. **Given** a request to GET /workers, **When** the API processes it, **Then** it uses the route from `./routes/workers` with proper middleware and validation
3. **Given** a request to POST /workers, **When** the API processes it, **Then** it uses the route from `./routes/workers` with proper service layer abstraction

---

### User Story 2 - Fix Missing Imports (Priority: P1)

As a developer, I need the API to have all required imports so that the application starts without "module not found" errors.

**Why this priority**: The dashboard redemption and SMS endpoints reference `TokenService` and `SMSService` but don't import them, causing runtime errors.

**Independent Test**: After adding the missing imports or removing dead code, the API starts without errors and endpoints either work correctly or fail gracefully with clear error messages.

**Acceptance Scenarios**:

1. **Given** the API starts, **When** all modules are loaded, **Then** no "module not found" errors occur
2. **Given** a request to POST /dashboard/redeem, **When** TokenService is not available, **Then** the endpoint returns a 501 Not Implemented with clear error message
3. **Given** a request to POST /dashboards/:id/send-link, **When** TokenService or SMSService are not available, **Then** the endpoint returns a 501 Not Implemented with clear error message

---

### Edge Cases

- What happens if the workers route file is missing or malformed?
- How does the system handle requests to endpoints with missing services during the transition period?
- What validation differences exist between inline and mounted routes that could affect existing clients?

## Clarifications

### Session 2026-03-20

- **Q**: How to handle TokenService and SMSService - implement, stub, or remove? → **A**: Stub with 501 errors (Option B). User will personally implement TokenService and SMSService features in the future.
- **Dead Code Handling Strategy**: All endpoints referencing missing services remain in place. Create minimal stub services (`TokenService.ts`, `SMSService.ts`) that throw "Not Implemented" errors. Endpoints catch these and return HTTP 501. This preserves API contracts for future implementation while unblocking API startup.
- **Testing/Verification Approach**: (1) Unit tests for stub services verifying they throw correct errors, (2) Integration tests for worker CRUD via mounted route, (3) Manual verification with curl for 501 responses, (4) TypeScript type check and lint before commit, (5) API startup test confirming no module errors in logs.
- **Rollback Strategy**: All changes confined to single feature branch `002-api-route-cleanup`. If issues detected: (1) Revert v1.ts changes via git checkout, (2) Delete stub service files, (3) Re-run T001 verification to confirm original state. Rollback time < 5 minutes. Critical safety: Do not modify workers.ts — only v1.ts and new service files.
- **Service Conflict Prevention**: Before creating stubs, verify no existing services with same names in `/apps/api/src/services/`. Use exact class names `TokenService` and `SMSService` to match v1.ts references. Single source of truth: mounted workers.ts route remains only worker route definition post-cleanup.
- **Q**: What is the required automated test coverage scope for this cleanup feature? → **A**: Unit tests for stub services + integration tests for worker routes only (Option B).
- **Q**: What is the standard error response format for 501 Not Implemented errors? → **A**: { success: false, error: "Not implemented" } (Option A - consistent with API patterns).
- **Q**: What deployment verification steps are required after this cleanup? → **A**: Local testing only, no production deployment needed (Option B).
- **Q**: What performance or reliability requirements apply to this cleanup? → **A**: No performance impact, maintain existing response times (Option C).
- **Q**: What is the timeline for implementing actual TokenService and SMSService? → **A**: Future feature - not part of this cleanup scope.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST remove duplicate inline worker routes from v1.ts (lines 213-313)
- **FR-002**: System MUST keep only the mounted route from `./routes/workers` (line 589)
- **FR-003**: System MUST either import `TokenService` from `./services/TokenService` OR remove dead code referencing it
- **FR-004**: System MUST either import `SMSService` from `@dashboard-link/sms` OR remove dead code referencing it
- **FR-005**: System MUST ensure all worker endpoints respond correctly through the single mounted route
- **FR-006**: Dashboard redemption endpoint MUST either work correctly OR gracefully fail with HTTP 501 and clear error message
- **FR-007**: SMS sending endpoint MUST either work correctly OR gracefully fail with HTTP 501 and clear error message
- **FR-008**: System MUST maintain all existing functionality (no breaking changes to API contracts)

### Key Entities

- **v1.ts**: Main API router file in `/apps/api/src/v1.ts`
- **workers.ts**: Worker route definitions in `/apps/api/src/routes/workers.ts`
- **TokenService**: Service for token creation/validation (may not exist yet)
- **SMSService**: Service for SMS operations from `@dashboard-link/sms` package

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Only ONE worker route definition exists in entire v1.ts (verified by code inspection)
- **SC-002**: No "module not found" errors when starting the API (verified by startup logs)
- **SC-003**: All worker endpoints respond correctly (GET /workers, POST /workers return 200/201)
- **SC-004**: Dashboard redemption endpoint returns valid response or 501 with clear error
- **SC-005**: SMS sending endpoint returns valid response or 501 with clear error
- **SC-006**: No route conflicts in Hono router (verified by running API and testing endpoints)
