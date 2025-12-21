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
- [ ] Page shows tabs for Schedule and Tasks
- [ ] Worker selector dropdown/filter
- [ ] Date picker for scheduling items
- [ ] Schedule item form: title, start/end time, location, description
- [ ] Task form: title, description, due date, priority, status
- [ ] List view shows all items for selected worker/date
- [ ] Edit and delete actions for each item
- [ ] Bulk operations (delete multiple)
- [ ] Calendar view option (if time permits)

## Implementation Details
- Use date-fns for date handling
- Implement time picker components
- Add validation for time ranges
- Use react-hook-form for forms
- Include recurrence options later

## Test Checklist
- [ ] Forms validate all required fields
- [ ] Items save to correct worker
- [ ] Edit mode loads existing data
- [ ] Delete removes items correctly
- [ ] Date filtering works
- [ ] Mobile responsive forms

---

## Completion Log
- **Started**: 
- **Completed**: 
- **AI Assistant**: 
- **Review Status**: pending
