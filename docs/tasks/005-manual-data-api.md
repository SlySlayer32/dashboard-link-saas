# Task 005: Implement Manual Data API Endpoints

## Goal
Create CRUD endpoints for manual schedule and task items

## Context
The database schema for manual data is ready, but the API endpoints need to be implemented to allow admins to create, read, update, and delete manual schedule and task items for workers.

## Files to Create/Modify
- `apps/api/src/routes/manual-data.ts` - New route file for manual data
- `apps/api/src/types/manual-data.ts` - Manual data types

## Dependencies
- Worker routes (already complete)
- Database schema (already complete)

## Acceptance Criteria
- [ ] POST /workers/:id/schedule-items creates manual schedule item
- [ ] GET /workers/:id/schedule-items retrieves schedule items for date range
- [ ] PUT /schedule-items/:id updates schedule item
- [ ] DELETE /schedule-items/:id deletes schedule item
- [ ] POST /workers/:id/task-items creates manual task item
- [ ] GET /workers/:id/task-items retrieves task items for date range
- [ ] PUT /task-items/:id updates task item
- [ ] DELETE /task-items/:id deletes task item
- [ ] All endpoints validate worker belongs to organization
- [ ] Date filtering works correctly
- [ ] Pagination for list endpoints

## Implementation Details
- Create new route file for manual data endpoints
- Use worker ID from params to validate ownership
- Support date range filtering with query params
- Add validation for required fields
- Implement proper HTTP status codes
- Include worker validation middleware

## API Endpoints
```
POST /workers/:id/schedule-items
Request: {
  title: string;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  location?: string;
  description?: string;
}

GET /workers/:id/schedule-items
Query: ?startDate=2025-01-01&endDate=2025-01-31&page=1&limit=20

PUT /schedule-items/:id
Request: Same as POST (all fields optional)

DELETE /schedule-items/:id
Response: 204 No Content

POST /workers/:id/task-items
Request: {
  title: string;
  description?: string;
  dueDate: string; // ISO date
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
}

GET /workers/:id/task-items
Query: Same as schedule items

PUT /task-items/:id
Request: Same as POST (all fields optional)

DELETE /task-items/:id
Response: 204 No Content
```

## Test Checklist
- [x] Cannot access data for workers in other organizations
- [x] Schedule items require valid time range
- [x] Task items require valid priority and status
- [x] Date filtering returns correct items
- [x] Pagination works correctly
- [x] Updates only modify provided fields
- [x] Delete actually removes records

## Notes
- Use the ManualAdapter pattern for consistency
- Consider bulk operations for future enhancement
- Add recurrency support in future version
- Ensure all timestamps are in UTC

---

## Completion Log
- **Started**: 2025-01-21
- **Completed**: 2025-01-21
- **AI Assistant**: Cascade
- **Review Status**: completed

## 🎁 Value Additions
1. Added comprehensive error handling for all endpoints with proper HTTP status codes
2. Implemented pagination with count for list endpoints to improve frontend UX
3. Added timezone-aware date filtering using UTC timestamps
4. Included validation for time ranges (startTime < endTime)
5. Added worker ownership validation to ensure multi-tenant security
6. Used TypeScript interfaces for type safety throughout the API
7. Implemented proper sorting (schedule by time, tasks by priority then date)
