# CleanConnect Request Enhancement Examples

This file contains real examples of request enhancements specific to the CleanConnect project.

## Before & After Examples

### Example 1: Worker Data Sync

**Before:**
```
sync workers from connecteam
```

**After:**
```markdown
## Objective
Implement an automated synchronization system to fetch worker data from the Connecteam API and store it in the CleanConnect database with proper multi-tenant isolation.

## Context
- Project: CleanConnect - Multi-tenant SaaS for workforce management
- Tech Stack: Hono (backend) + Supabase (database) + BullMQ (async jobs)
- Current State: Connecteam adapter exists in packages/plugins/src
- Business Impact: Critical for keeping workforce data up-to-date

## Requirements
### Functional Requirements
- Fetch all workers for an organization from Connecteam API
- Map Connecteam fields to CleanConnect worker schema
- Handle incremental updates (new/modified/deleted workers)
- Schedule sync to run every hour
- Send SMS notifications for shift changes

### Technical Requirements
- Use existing Connecteam adapter under packages/plugins/src
- Implement in packages/worker/src following service boundaries
- Queue async jobs with BullMQ for reliable processing
- Scope all queries by organizationId
- Implement rate limiting for Connecteam API calls

### Constraints
- Must follow Zapier-style layering (no vendor SDK in services)
- Use expand/contract pattern for any schema changes
- Add connector versioning and canary rollout support
- Include kill switch for disabling sync

## Success Criteria
- Worker data matches Connecteam within 5 minutes
- No cross-organization data leakage
- SMS notifications sent for shift changes within 1 minute
- System handles Connecteam API failures gracefully
- Sync completes within organization's rate limits

## Preferred Approach
- Create scheduled job using BullMQ's repeatable jobs
- Use optimistic locking for concurrent sync prevention
- Implement exponential backoff for API failures
- Add comprehensive logging for debugging
- Follow the connector stability strategy in AGENTS.md

## Testing Strategy
- Unit tests for data mapping logic
- Integration tests with Connecteam test API
- Load testing with realistic worker counts
- Test rate limiting and retry behavior
- Verify multi-tenant data isolation
```

### Example 2: Dashboard UI

**Before:**
```
make a dashboard for managers
```

**After:**
```markdown
## Objective
Create a manager dashboard in the admin app that displays workforce metrics, shift schedules, and team productivity analytics.

## Context
- Project: CleanConnect - Multi-tenant SaaS for workforce management
- Tech Stack: React + TypeScript + TailwindCSS + shadcn/ui
- Current State: Basic admin shell exists in apps/admin
- Business Impact: Enables managers to make data-driven decisions

## Requirements
### Functional Requirements
- Display key metrics: total workers, active shifts, attendance rate
- Interactive calendar view for shift scheduling
- Worker productivity charts and trends
- Export functionality for reports (PDF/Excel)
- Real-time updates for shift changes

### Technical Requirements
- Use TanStack Query for data fetching and caching
- Implement with shadcn/ui components for consistency
- Add responsive design for mobile/tablet access
- Include loading states and error boundaries
- Optimize for performance with virtualization if needed

### Constraints
- Must follow existing UI patterns in apps/admin
- Use Zustand for state management (no Redux)
- Implement proper error handling with user-friendly messages
- Ensure accessibility (WCAG 2.1 AA compliance)
- All API calls must go through Hono backend

## Success Criteria
- Dashboard loads in under 2 seconds
- Real-time updates appear within 5 seconds
- All charts are accessible with screen readers
- Export generates correct reports for 1000+ workers
- Mobile view is fully functional

## Preferred Approach
- Start with metrics cards component
- Use Recharts for data visualization
- Implement WebSocket connection for real-time updates
- Follow the component structure in packages/ui
- Add comprehensive error logging

## Testing Strategy
- Visual regression tests for all dashboard views
- Performance tests with large datasets
- Accessibility testing with axe-core
- User interaction testing with Playwright
- Error scenario testing (network failures, empty states)
```

### Example 3: Database Migration

**Before:**
```
add phone number to workers
```

**After:**
```markdown
## Objective
Add phone number field to the workers table and update all related components to support SMS notifications for shift changes.

## Context
- Project: CleanConnect - Multi-tenant SaaS for workforce management
- Tech Stack: Supabase (PostgreSQL) + TypeScript
- Current State: Workers table exists in packages/database
- Business Impact: Enables SMS notifications for better communication

## Requirements
### Functional Requirements
- Add phone_number column to workers table
- Update worker creation/editing forms to include phone
- Validate phone number format per country
- Support SMS opt-in/opt-out preference
- Handle international phone numbers

### Technical Requirements
- Use expand/contract migration pattern
- Add phone number validation with Zod schemas
- Update all worker API endpoints
- Modify UI components in apps/admin and future mobile app
- Add phone number to TypeScript types

### Constraints
- Must follow expand/contract migration pattern
- No destructive changes to existing data
- Backfill strategy for existing workers
- Update all worker-related queries
- Consider GDPR/privacy implications

## Success Criteria
- Phone numbers are stored and validated correctly
- All existing functionality continues to work
- SMS can be sent to workers with phone numbers
- International numbers work properly
- Migration completes without data loss

## Preferred Approach
1. Expand: Add phone_number column (nullable)
2. Update application code to handle new field
3. Backfill existing workers if needed
4. Contract: Make column non-nullable after validation
5. Add comprehensive tests for phone number handling

## Testing Strategy
- Migration rollback tests
- Phone number validation tests
- SMS integration tests
- Privacy/GDPR compliance tests
- Performance tests with phone number queries
```

### Example 4: Google Calendar Integration

**Before:**
```
add google calendar sync
```

**After:**
```markdown
## Objective
Implement Google Calendar integration to sync worker shifts from CleanConnect to Google Calendar accounts.

## Context
- Project: CleanConnect - Multi-tenant SaaS for workforce management
- Tech Stack: Hono (backend) + Supabase (database) + BullMQ (async jobs)
- Current State: Basic auth and organization management exists
- Business Impact: Critical for V1 - allows managers to see shifts in their preferred calendar

## V1 Checklist Mapping
- **Checklist Item**: "Implement Google Calendar sync in packages/plugins/src"
- **Phase**: 1 (V1 Build)
- **Complexity**: Medium
- **Estimated Time**: 2-3 days

## Requirements
### Functional Requirements
- Sync worker shifts to organization's Google Calendar
- Support one-way sync (CleanConnect → Google Calendar)
- Handle calendar creation and permissions
- Update existing events when shifts change
- Include worker names and shift details in calendar events

### Technical Requirements
- Use Google Calendar API v3
- Implement OAuth2 flow for calendar permissions
- Store calendar tokens securely in database
- Queue sync operations with BullMQ
- Handle rate limiting and API quotas

### Constraints
- Must follow V1 thin slice approach (basic sync only)
- No two-way sync in V1
- Use existing auth patterns in packages/auth
- Respect organization isolation (each org has its own calendar)

## Success Criteria
- Shifts appear in Google Calendar within 30 seconds
- Calendar updates when shifts are modified
- Managers can connect their Google Account
- Sync handles API failures gracefully
- No cross-organization data leakage

## Testing Strategy
- Unit tests for calendar event creation
- Integration tests with Google Calendar test API
- Test OAuth2 flow and token refresh
- Verify multi-tenant calendar isolation
- Test rate limiting and error handling

## Next Steps
1. Set up Google Cloud project and OAuth credentials
2. Implement Google Calendar adapter in packages/plugins
3. Add calendar sync endpoints to API
4. Create calendar connection UI in admin app
5. Test end-to-end sync workflow
```

## Enhancement Checklist

When enhancing requests for CleanConnect, always check:

- [ ] Is the V1 checklist item identified?
- [ ] Is the phase correct (0=Setup, 1=V1 Build)?
- [ ] Is complexity level set (Simple/Medium/Complex)?
- [ ] Is business impact explained for the founder?
- [ ] Is organization scoping mentioned?
- [ ] Are relevant AGENTS.md sections referenced?
- [ ] Is the tech stack properly specified?
- [ ] Are multi-tenant considerations included?
- [ ] Is the implementation approach aligned with architecture?
- [ ] Are testing requirements specified?
- [ ] Are next steps clearly defined?

## Quick Reference

### Common Paths to Reference
- Database: `packages/database/src/`
- API: `apps/api/src/`
- Admin UI: `apps/admin/src/`
- Shared types: `packages/shared/src/`
- Auth: `packages/auth/src/`
- Workers: `packages/worker/src/`

### Key Patterns
- All queries: `WHERE organizationId = ?`
- API responses: `{ success, data, error }`
- Validation: `z.object(...)`
- External calls: Adapters only
- Async jobs: BullMQ + Redis
