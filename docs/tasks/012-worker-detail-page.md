# Task 012: Create Worker Detail Page

## Goal
Implement a detailed view page for individual workers with all their information and actions

## Context
Users need to view complete worker details, see their dashboard widgets, and perform actions like sending SMS links or managing their data.

## Files to Create/Modify
- `apps/admin/src/pages/WorkerDetailPage.tsx` - Worker detail view
- `apps/admin/src/components/WorkerInfo.tsx` - Worker information display
- `apps/admin/src/components/WorkerDashboardPreview.tsx` - Preview of worker's dashboard
- `apps/admin/src/components/WorkerActivity.tsx` - Recent activity log

## Dependencies
- Task 007: Worker List Page
- Task 008: Worker Form
- Task 010: Send SMS Button

## Acceptance Criteria
- [ ] Shows all worker details (name, phone, email, status)
- [ ] Displays worker's dashboard widgets
- [ ] Send SMS button prominently displayed
- [ ] Edit/Delete buttons for worker management
- [ ] Shows recent SMS sends to this worker
- [ ] Shows manual schedule/task items
- [ ] Breadcrumb navigation
- [ ] Loading and error states

## Implementation Details
- Use route parameter for worker ID
- Fetch worker data with TanStack Query
- Implement tabs for different sections
- Add confirmation modals for destructive actions
- Include last login/activity if available

## Test Checklist
- [ ] Page loads with worker data
- [ ] Edit button opens modal with form
- [ ] Delete shows confirmation dialog
- [ ] SMS button sends to correct worker
- [ ] Tabs switch content correctly

---

## Completion Log
- **Started**: 
- **Completed**: 
- **AI Assistant**: 
- **Review Status**: pending
