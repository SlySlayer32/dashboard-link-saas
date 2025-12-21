# Task 006: Complete Manual Adapter Implementation

## Goal
Implement database queries in the ManualAdapter to fetch schedule and task items

## Context
The ManualAdapter structure exists but the getTodaySchedule() and getTodayTasks() methods are empty. They need to query the database for manual items created for workers.

## Files to Create/Modify
- `packages/plugins/src/manual/index.ts` - Complete ManualAdapter implementation

## Dependencies
- Task 005: Manual Data API (database tables and API endpoints)

## Acceptance Criteria
- [ ] getTodaySchedule() queries manual_schedule_items table
- [ ] getTodaySchedule() filters by worker and date
- [ ] getTodaySchedule() returns properly formatted ScheduleItem[]
- [ ] getTodayTasks() queries manual_task_items table
- [ ] getTodayTasks() filters by worker and date
- [ ] getTodayTasks() returns properly formatted TaskItem[]
- [ ] Both methods handle timezone correctly
- [ ] Both methods sort results appropriately

## Implementation Details
- Use Supabase client from plugin context
- Query by worker_id and date range (today's date)
- Transform database rows to ScheduleItem/TaskItem format
- Include all relevant fields (title, description, times, etc.)
- Handle null values gracefully
- Use UTC dates for consistency

## Component Props
N/A - This is a plugin adapter

## Test Checklist
- [x] Adapter returns items created for today
- [x] Items from other dates are excluded
- [x] Items from other workers are excluded
- [x] Schedule items sorted by start_time
- [x] Tasks sorted by priority then due_date
- [x] Empty arrays returned when no items exist

## Notes
- Use the plugin's getConfig() method if needed
- Follow the same pattern as other adapters
- Test with actual database records
- Consider caching results for performance

---

## Completion Log
- **Started**: 2025-01-21
- **Completed**: 2025-01-21
- **AI Assistant**: Cascade
- **Review Status**: completed

## 🎁 Value Additions
1. Added proper error handling with try-catch blocks
2. Implemented UTC date handling for timezone consistency
3. Added database result transformation to match shared types
4. Included sorting logic (schedule by time, tasks by priority)
5. Used flexible date filtering to include tasks without due dates
6. Added comprehensive logging for debugging
7. Ensured adapter returns empty arrays on error instead of crashing
