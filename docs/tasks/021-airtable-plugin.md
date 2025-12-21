# Task 021: Implement Airtable Plugin

## Goal
Create the Airtable plugin adapter to sync records as schedule/task items

## Context
Organizations using Airtable for task management need their data automatically imported into worker dashboards.

## Files to Create/Modify
- `packages/plugins/src/airtable/index.ts` - Main plugin implementation
- `packages/plugins/src/airtable/api.ts` - Airtable API client
- `packages/plugins/src/airtable/mapping.ts` - Field mapping logic
- `apps/admin/src/components/AirtableConfig.tsx` - Configuration UI

## Dependencies
- Task 014: Plugin Configuration Page

## Acceptance Criteria
- [ ] API key authentication
- [ ] Select base and table from dropdown
- [ ] Map fields to schedule/task properties
- [ ] Filter records by worker identifier field
- [ ] Transform records to ScheduleItem/TaskItem format
- [ ] Support formula fields for dates
- [ ] Handle multiple linked tables
- [ ] Sync only matching records
- [ ] Error handling for rate limits

## Implementation Details
- Use Airtable REST API
- Implement field mapping UI
- Support Airtable date formats
- Add record filtering options
- Cache results for performance
- Include attachment URLs if present

## Test Checklist
- [ ] API key validates successfully
- [ ] Base/table selection works
- [ ] Field mapping saves correctly
- [ ] Records fetch and transform
- [ ] Worker filtering works
- [ ] Errors handled gracefully

---

## Completion Log
- **Started**: 
- **Completed**: 
- **AI Assistant**: 
- **Review Status**: pending
