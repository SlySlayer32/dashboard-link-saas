# Feature Specification: Worker Management

**Feature Branch**: `001-worker-management`  
**Created**: 2026-03-08  
**Status**: Draft  
**Input**: User description: "Worker management feature — managers can add, edit, and delete field workers with name and phone number. Phone numbers must be validated for AU mobile format. Each worker belongs to one organisation."

## Clarifications

### Session 2026-03-11

- Q: What is the maximum length for worker names? → A: 255 characters maximum, no truncation
- Q: How should concurrent edits to the same worker be handled? → A: Last-write-wins with timestamp check
- Q: What is the API response time SLA for CRUD operations? → A: 500ms p95 for CRUD operations
- Q: How should validation errors be presented to users? → A: Inline errors next to invalid fields with input preservation
- Q: What observability and monitoring is required? → A: Structured logging with key metrics

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

### User Story 1 - Add New Worker (Priority: P1)

A manager needs to add a new field worker to their team so they can send them dashboard links via SMS.

**Why this priority**: This is the entry point for the entire feature. Without the ability to add workers, no other functionality matters. This directly enables the core product value: sending dashboard links to workers.

**Independent Test**: Can be fully tested by creating a worker with name and phone number, then verifying the worker appears in the system and can receive SMS messages.

**Acceptance Scenarios**:

1. **Given** a manager is logged into their organisation, **When** they enter a worker name "John Smith" and valid AU mobile number "0412 345 678", **Then** the worker is created and appears in the worker list
2. **Given** a manager attempts to add a worker, **When** they enter an invalid phone number format (e.g., "123" or "0212 345 678"), **Then** the system displays a validation error and prevents creation
3. **Given** a manager enters a valid phone number with spaces or formatting (e.g., "0412 345 678" or "0412-345-678"), **When** they submit the form, **Then** the system accepts and normalizes the number

---

### User Story 2 - View Worker List (Priority: P2)

A manager needs to see all their field workers in one place so they can verify who is on their team and access worker details.

**Why this priority**: After adding workers (P1), managers need to see their team. This is essential for managing workers and selecting who to send messages to. Without this, the add functionality has no visible output.

**Independent Test**: Can be fully tested by adding multiple workers and verifying they all appear in a list view with their names and phone numbers visible.

**Acceptance Scenarios**:

1. **Given** a manager has added 3 workers to their organisation, **When** they view the worker list, **Then** all 3 workers are displayed with their names and phone numbers
2. **Given** a manager belongs to Organisation A, **When** they view the worker list, **Then** they only see workers from Organisation A (not workers from other organisations)
3. **Given** a manager has no workers yet, **When** they view the worker list, **Then** they see an empty state with a prompt to add their first worker

---

### User Story 3 - Edit Worker Details (Priority: P3)

A manager needs to update a worker's name or phone number when details change (e.g., worker gets a new phone, name spelling correction).

**Why this priority**: Workers change phone numbers or managers make typos. This is important for data accuracy but not critical for MVP launch since managers can delete and re-add as a workaround.

**Independent Test**: Can be fully tested by editing an existing worker's details and verifying the changes persist and the worker can still receive SMS at the new number.

**Acceptance Scenarios**:

1. **Given** a worker exists with phone "0412 345 678", **When** the manager updates the phone to "0423 456 789", **Then** the worker's phone number is updated and future SMS messages go to the new number
2. **Given** a worker exists with name "John Smith", **When** the manager updates the name to "Jonathan Smith", **Then** the worker's name is updated in the system
3. **Given** a manager attempts to edit a worker's phone number, **When** they enter an invalid format, **Then** the system displays a validation error and prevents the update

---

### User Story 4 - Soft Delete Worker (Priority: P4)

A manager needs to remove a worker who is no longer with the company, while preserving historical SMS logs and dashboard access records.

**Why this priority**: Essential for data hygiene and legal compliance, but can be deferred slightly since managers can simply stop sending messages to inactive workers. However, this protects critical audit trail data.

**Independent Test**: Can be fully tested by soft deleting a worker, verifying they no longer appear in the active worker list, but their SMS history and logs remain accessible.

**Acceptance Scenarios**:

1. **Given** a worker exists in the system, **When** the manager deletes them, **Then** the worker is marked as inactive and no longer appears in the active worker list
2. **Given** a worker has been soft deleted, **When** viewing historical SMS logs or dashboard access records, **Then** the deleted worker's data is still visible with an indicator showing they are inactive
3. **Given** a worker has been soft deleted, **When** the manager attempts to add a new worker with the same phone number, **Then** the system allows creation of a new worker record (old worker remains soft deleted with historical data intact)

### Edge Cases

- **Duplicate phone numbers (active workers)**: Manager tries to add a worker with a phone number that already exists for an active worker in their organisation → System prevents creation and shows error "Phone number already in use"
- **Reusing phone number from soft deleted worker**: Manager adds a new worker with a phone number previously used by a soft deleted worker → System allows creation (creates new worker record, old worker remains soft deleted with historical data intact)
- **SMS to soft deleted worker**: Manager attempts to send SMS to a worker who has been soft deleted → System prevents SMS sending and shows error "Worker is no longer active"
- **Phone number format variations**: How does the system handle different input formats like "0412345678", "0412 345 678", "0412-345-678", "+61412345678"?
- **International numbers**: What happens if a manager accidentally enters a non-AU mobile number? (Block at validation or allow for edge cases?)
- **Empty worker list**: How does the system handle a manager with zero workers? (Show helpful empty state)
- **Very long names**: What happens if a manager enters an extremely long name (e.g., 200 characters)?
- **Special characters in names**: How does the system handle names with apostrophes, hyphens, or unicode characters (e.g., "O'Brien", "José")?
- **Concurrent edits**: If two managers edit the same worker simultaneously, last-write-wins with timestamp check applies. The losing write receives a 409 Conflict error with message "Worker was updated by another user. Please refresh and try again." and the response body MUST include the current worker data to enable client-side merge. User must reload worker data and reapply their changes. (Acceptable for solo operator MVP with rare concurrent access)

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST allow managers to create new workers with name and phone number fields
- **FR-002**: System MUST validate phone numbers against E.164 format (`^\+[1-9]\d{1,14}$`) for storage, specifically Australian mobile format (`+614XXXXXXXX` where X is 0-9). Validation uses libphonenumber-js with country code AU and mobile type verification to ensure compliance with E.164 standard. Applies to both create and update operations.
- **FR-003**: System MUST normalize phone number input by accepting Australian display formats ("04XX XXX XXX", "04XXXXXXXX", "0412-345-678") and converting to E.164 format (`+614XXXXXXXX`) for storage
- **FR-004**: System MUST associate each worker with exactly one organisation
- **FR-005**: System MUST restrict managers to viewing and managing only workers within their own organisation
- **FR-006**: System MUST display a list of all active workers for the manager's organisation
- **FR-007**: System MUST allow managers to edit worker name and phone number
- **FR-009**: System MUST implement soft delete for workers using `deleted_at` timestamp (NULL for active, timestamp for deleted)
- **FR-010**: System MUST preserve all historical data (SMS logs, dashboard access records, dashboard tokens) when a worker is soft deleted
- **FR-011**: System MUST exclude soft deleted workers from active worker list queries (WHERE deleted_at IS NULL)
- **FR-012**: System MUST indicate when viewing historical records that reference soft deleted workers
- **FR-016**: System MUST prevent duplicate phone numbers within the same organisation for active workers only (soft deleted workers do not block reuse)
- **FR-017**: System MUST prevent SMS sending to soft deleted workers (validation check before SMS dispatch)
- **FR-013**: System MUST provide clear validation error messages when phone number format is invalid
- **FR-014**: System MUST show an empty state with helpful prompt when a manager has no workers
- **FR-015**: System MUST handle names with special characters (apostrophes, hyphens, unicode characters)
- **FR-018**: System MUST limit worker names to 255 characters maximum
- **FR-019**: System MUST use last-write-wins strategy with `updated_at` timestamp check for concurrent edit conflict resolution
- **FR-020**: System MUST display validation errors inline next to the invalid field while preserving all valid user input
- **FR-021**: System MUST emit structured JSON logs for all CRUD operations including: operation type, duration_ms, success status, error_type (if failed), organization_id, worker_id

### Key Entities

- **Worker**: Represents a field worker who receives dashboard links via SMS. Key attributes: name (text), phone number (AU mobile format), organisation relationship (belongs to one organisation), active status (for soft delete)
- **Organisation**: Represents the cleaning business that employs workers. Workers belong to exactly one organisation. Managers can only access workers within their own organisation

### Non-Functional Requirements

#### Performance
- **NFR-001**: Each individual worker CRUD API endpoint (GET, POST, PUT, DELETE) MUST respond within 500ms for 95th percentile requests (measured per-endpoint, not aggregate)
- **NFR-002**: Worker list queries MUST use database indexes on `organization_id`, `deleted_at`, and `phone_number` to achieve performance targets

#### Observability
- **NFR-003**: Service layer MUST emit structured JSON logs for all CRUD operations with fields: `operation`, `duration_ms`, `success`, `error_type`, `organization_id`, `worker_id`
- **NFR-004**: Logs MUST be queryable for debugging, performance analysis, and operational monitoring

#### Data Integrity
- **NFR-005**: Concurrent edit conflicts MUST be resolved using last-write-wins strategy with `updated_at` timestamp validation
- **NFR-006**: Database schema MUST enforce name length constraint at 255 characters via `VARCHAR(255)` type

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Managers can add a new worker (name + phone) in under 30 seconds
- **SC-002**: Phone number validation catches 100% of invalid AU mobile formats before submission
- **SC-003**: Managers can view their complete worker list and identify any worker in under 5 seconds
- **SC-004**: Soft deleted workers are excluded from active lists while preserving 100% of historical SMS and access log data
- **SC-005**: System prevents data loss by maintaining audit trail for all worker interactions even after deletion
- **SC-006**: 95% of managers successfully add their first worker without assistance or error
- **SC-007**: 95% of worker CRUD operations complete within 500ms (p95 latency target)
- **SC-008**: All validation errors display inline with field preservation, enabling immediate correction without data re-entry

## Assumptions

### Authentication & Authorization
- Managers are authenticated via Supabase Auth and belong to a single organisation
- Manager's organisation ID is derived from JWT claims (never from client input)
- Multi-tenant isolation is enforced via RLS policies using `app.tenant_id` session variable

### Data Access Patterns
- All database access goes through repository pattern (no direct SQL in API routes)
- Business logic isolated in service layer (`apps/api/src/services/WorkerService`)
- RLS policies enforce `organization_id = current_setting('app.tenant_id')::uuid` on workers table

### Integration Points
- SMS sending functionality exists separately (SMSService) and references workers by phone number
- Dashboard token generation exists separately (TokenService) and references workers by ID
- Access logging exists separately and tracks worker dashboard opens
- Organisation data model already exists with RLS policies enforced

### Target Market & Scale
- Solo operator MVP targeting small cleaning businesses (typically 1-10 workers per organisation)
- Managers access this feature through desktop-focused admin dashboard (React + Vite)
- Phone number uniqueness scoped to organisation level (different orgs can have workers with same phone)
- Australian mobile numbers stored in E.164 format (`+614XXXXXXXX`), displayed in AU format ("04XX XXX XXX")

### Soft Delete Behavior
- Soft deleted workers retain all historical data (SMS logs, access logs, dashboard tokens)
- Phone numbers from soft deleted workers can be reused for new workers (creates new record)
- Soft deleted workers are excluded from all active queries via `WHERE deleted_at IS NULL`
- No UI for reactivating soft deleted workers in MVP (can be added later if needed)

## Out of Scope

### Moved to Separate Features (002-005)
- **SMS sending** → Feature 003-sms-delivery
- **Token generation/validation** → Feature 002-token-system
- **Worker dashboard** → Feature 004-worker-dashboard
- **Access logging** → Feature 005-access-logging
- **Delivery status tracking** → Feature 003-sms-delivery

### Permanently Out of Scope
- Multi-organisation management (managers belong to one organisation only)
- Worker authentication or login (workers only receive SMS links, they don't log into the system)
- Bulk import of workers from CSV/spreadsheet
- Worker groups, teams, or hierarchies
- Role-based permissions for different manager levels
- Worker scheduling or shift management
- Worker performance tracking or ratings
- Email communication to workers (SMS only)
- International phone number support (AU mobile only for MVP)
- Hard delete functionality (soft delete only)
- Worker profile photos or avatars
- Worker employment details (start date, contract type, pay rate, etc.)
- Reactivation UI for soft deleted workers (can be added in future if needed)

**Note**: This feature (001-worker-management) provides the **CRUD foundation** only. The complete product workflow requires features 002-005.
