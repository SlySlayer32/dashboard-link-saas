# Task 013: Create Manual Data Entry Page

## Goal
Implement a page for creating and managing manual schedule and task items for workers

## Context
Admins need a dedicated interface to manually add schedule items and tasks for workers who don't have external calendar integrations.

## Files to Create/Modify
- `apps/admin/src/pages/ManualDataPage.tsx` - Main manual data management
- `apps/admin/src/components/ScheduleItemForm.tsx` - Schedule item form
- `apps/admin/src/components/TaskItemForm.tsx` - Task item form
- `apps/admin/src/components/ManualDataList.tsx` - List view of items

## Dependencies
- Task 005: Manual Data API
- Task 007: Worker List (for worker selection)

## Acceptance Criteria
- [x] Page shows tabs for Schedule and Tasks
- [x] Worker selector dropdown/filter
- [x] Date picker for scheduling items
- [x] Schedule item form: title, start/end time, location, description
- [x] Task form: title, description, due date, priority, status
- [x] List view shows all items for selected worker/date
- [x] Edit and delete actions for each item
- [x] Bulk operations (delete multiple) - placeholder for future
- [x] Calendar view option (placeholder for future)

## Implementation Details
- Use date-fns for date handling
- Implement time picker components
- Add validation for time ranges
- Use react-hook-form for forms
- Include recurrence options later

## Test Checklist
- [x] Forms validate all required fields
- [x] Items save to correct worker
- [x] Edit mode loads existing data
- [x] Delete removes items correctly
- [x] Date filtering works
- [x] Mobile responsive forms

---

## Completion Log
- **Started**: Dec 23, 2025
- **Completed**: Dec 23, 2025
- **AI Assistant**: Cascade
- **Review Status**: completed
