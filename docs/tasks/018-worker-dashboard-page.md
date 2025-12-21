# Task 018: Create Worker Dashboard Page

## Goal
Implement the worker-facing dashboard that displays schedule and tasks

## Context
This is the page workers see when they click the SMS link. It must be mobile-optimized and display today's schedule and tasks without requiring login.

## Files to Create/Modify
- `apps/worker/src/pages/DashboardPage.tsx` - Main worker dashboard
- `apps/worker/src/components/widgets/ScheduleWidget.tsx` - Schedule display
- `apps/worker/src/components/widgets/TasksWidget.tsx` - Tasks display
- `apps/worker/src/hooks/useDashboardData.ts` - Dashboard data hook

## Dependencies
- Task 006: Manual Adapter Implementation
- Dashboard API endpoints (already complete)

## Acceptance Criteria
- [ ] Load dashboard data using token from URL
- [ ] Display worker name and date
- [ ] Show schedule items in chronological order
- [ ] Show tasks grouped by priority
- [ ] Mobile-optimized layout (full-width)
- [ ] Loading spinner while fetching
- [ ] Error handling for invalid/expired tokens
- [ ] Empty state messages
- [ ] Time formatting (e.g., "9:00 AM - 10:00 AM")
- [ ] Location and description display

## Implementation Details
- Extract token from URL params
- Use TanStack Query for data fetching
- Implement pull-to-refresh on mobile
- Add offline support later
- Use system fonts for better mobile rendering

## Test Checklist
- [ ] Dashboard loads with valid token
- [ ] Invalid token shows error page
- [ ] Expired token shows expiry message
- [ ] Schedule items sorted correctly
- [ ] Tasks show priority indicators
- [ ] Mobile responsive on all screen sizes
- [ ] Refresh updates data

---

## Completion Log
- **Started**: 
- **Completed**: 
- **AI Assistant**: 
- **Review Status**: pending
