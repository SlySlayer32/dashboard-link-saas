# Task 020: Implement Google Calendar Plugin

## Goal
Create the Google Calendar plugin adapter to sync calendar events with worker dashboards

## Context
Workers who use Google Calendar need their schedule items automatically imported into their dashboard.

## Files to Create/Modify
- `packages/plugins/src/google-calendar/index.ts` - Main plugin implementation
- `packages/plugins/src/google-calendar/oauth.ts` - OAuth2 flow handler
- `packages/plugins/src/google-calendar/api.ts` - Google Calendar API client
- `apps/admin/src/components/GoogleCalendarConfig.tsx` - Configuration UI

## Dependencies
- Task 014: Plugin Configuration Page

## Acceptance Criteria
- [ ] OAuth2 authentication flow for Google
- [ ] Fetch calendar events for specified date range
- [ ] Filter events by worker email or calendar ID
- [ ] Transform events to ScheduleItem format
- [ ] Handle recurring events (expand to instances)
- [ ] Sync only primary calendar by default
- [ ] Error handling for API limits
- [ ] Cache results for 5 minutes
- [ ] Support multiple calendars per worker

## Implementation Details
- Use Google Calendar API v3
- Store refresh tokens securely
- Implement incremental sync
- Add timezone handling
- Include event location and description
- Filter out all-day events if needed

## Test Checklist
- [ ] OAuth flow completes successfully
- [ ] Calendar events fetch correctly
- [ ] Events transform to proper format
- [ ] Recurring events expanded
- [ ] API errors handled gracefully
- [ ] Cached results returned quickly

---

## Completion Log
- **Started**: 
- **Completed**: 
- **AI Assistant**: 
- **Review Status**: pending
