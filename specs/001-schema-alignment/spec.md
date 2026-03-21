# Feature Specification: Database Schema Alignment

**Feature Branch**: `001-schema-alignment`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User description: "Create database schema alignment feature that fixes critical mismatches between database schema and application code. Rename columns: full_name → name, phone_number → phone, calendar_email → email. Add missing columns: active (boolean default true), deleted_at (timestamp nullable), metadata (jsonb default '{}'). Update indexes and verify RLS policies work with renamed columns."

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

### User Story 1 - Worker CRUD Operations Work (Priority: P1)

Administrators can create, read, update, and delete workers through the admin dashboard without encountering database errors.

**Why this priority**: This is a critical bug fix. Currently all worker operations fail because the application expects different column names than the database provides. This blocks basic functionality.

**Independent Test**: Can be fully tested by creating a new worker via API/dashboard and verifying it succeeds with the correct column mapping. This immediately unblocks all worker management features.

**Acceptance Scenarios**:

1. **Given** the database has the renamed columns, **When** an admin creates a worker with name "John", phone "+1234567890", email "john@example.com", **Then** the worker is created successfully without errors
2. **Given** existing workers in the database with old column names, **When** the migration runs, **Then** all worker data is preserved with new column names
3. **Given** the schema is aligned, **When** fetching worker list, **Then** the API returns workers with `name`, `phone`, `email`, `active`, and `metadata` fields populated correctly

---

### User Story 2 - Soft Delete Functionality (Priority: P2)

Administrators can soft-delete workers, which marks them as deleted without removing their data from the database.

**Why this priority**: Soft delete is a required data protection feature. The `deleted_at` column must exist and be nullable to support this pattern.

**Independent Test**: Can be fully tested by deleting a worker and verifying the `deleted_at` timestamp is set while the worker remains in the database but is excluded from active queries.

**Acceptance Scenarios**:

1. **Given** an existing worker, **When** a delete action is performed, **Then** the `deleted_at` column is set to current timestamp
2. **Given** a soft-deleted worker, **When** listing active workers, **Then** the deleted worker does not appear in results (filtered by `deleted_at IS NULL`)

---

### User Story 3 - Active/Inactive Worker Filtering (Priority: P3)

Administrators can toggle worker status between active and inactive, and filter the worker list by this status.

**Why this priority**: This enables workforce management - temporarily disabling workers without deleting them.

**Independent Test**: Can be fully tested by setting `active = false` on a worker and verifying they don't appear in active worker queries.

**Acceptance Scenarios**:

1. **Given** an active worker, **When** toggling active status to false, **Then** the worker's `active` column updates to false
2. **Given** workers with mixed active status, **When** filtering by `active=true`, **Then** only active workers are returned

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- **Migration rollback**: What happens if the migration needs to be rolled back? All column renames are reversible.
- **Concurrent access during migration**: Database transactions will handle concurrent reads/writes during the brief ALTER TABLE operations.
- **Existing data with null values**: The `calendar_email` column may have NULL values - after rename to `email`, these NULLs should remain valid.
- **Index rebuild time**: Renaming columns will cause indexes to rebuild - this should complete quickly for reasonable table sizes.
- **RLS policy compatibility**: All RLS policies referencing `organization_id` (unchanged) will continue to work after column renames.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: Migration MUST rename `workers.full_name` to `workers.name`
- **FR-002**: Migration MUST rename `workers.phone_number` to `workers.phone`
- **FR-003**: Migration MUST rename `workers.calendar_email` to `workers.email`
- **FR-004**: Migration MUST add `workers.active` column (BOOLEAN NOT NULL DEFAULT true)
- **FR-005**: Migration MUST add `workers.deleted_at` column (TIMESTAMPTZ NULLABLE)
- **FR-006**: Migration MUST add `workers.metadata` column (JSONB NOT NULL DEFAULT '{}')
- **FR-007**: All existing worker data MUST be preserved during migration
- **FR-008**: Indexes MUST be updated to reference new column names (`idx_workers_phone`, `idx_workers_calendar_email`)
- **FR-009**: RLS policies MUST continue to function correctly after column renames (they use `organization_id` which is unchanged)
- **FR-010**: Migration MUST be reversible/rollback-safe (use transaction-safe ALTER operations)

### Key Entities

- **Worker**: Represents a field worker/employee. Key attributes: id, organization_id, name, phone, email, active, deleted_at, metadata, created_at, updated_at.
- **Organization**: Unchanged - all workers belong to an organization. RLS policies filter by organization_id which remains unchanged.

## Assumptions

1. The application code in `/packages/shared/src/schemas/index.ts` is correct and the database must align to it
2. The workers table has a moderate number of records - migration operations will complete quickly
3. No code changes are needed in the application - the schema should match what the code already expects
4. Downstream RLS policies reference `organization_id` only, so column renames won't affect security policies

## Clarifications

### Session 2026-03-19

- **Q**: What is the migration downtime tolerance? **A**: No downtime constraint — can lock table for extended period
- **Q**: What is the backup and rollback strategy? **A**: Require automated backup snapshot before migration runs
- **Q**: How should migration failures be handled? **A**: All-or-nothing transaction — rollback on any failure
- **Q**: How should data validation during migration be handled? **A**: Validate only — report violations but don't block migration
- **Q**: What is the maximum acceptable migration completion time? **A**: 30 seconds

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Worker creation API call succeeds with 200 status and returns worker object with `name`, `phone`, `email` fields (currently fails)
- **SC-002**: All existing worker records are preserved after migration (data integrity check: 100% of records retained)
- **SC-003**: Soft delete functionality works: setting `deleted_at` timestamp causes worker to be excluded from active queries
- **SC-004**: Active/inactive filtering works: querying with `active=true` returns only workers with `active` column set to true
- **SC-005**: Metadata storage works: JSONB `metadata` column accepts and returns arbitrary key-value pairs
- **SC-006**: Database indexes on renamed columns function correctly (query performance equivalent to pre-migration)
- **SC-007**: RLS policies continue to enforce tenant isolation (verified by testing cross-tenant data access is blocked)
