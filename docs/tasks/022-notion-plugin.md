# Task 022: Implement Notion Plugin

## Goal
Create the Notion plugin adapter to sync database pages as schedule/task items

## Context
Organizations using Notion for project management need their tasks and schedules automatically imported into worker dashboards.

## Files to Create/Modify
- `packages/plugins/src/notion/index.ts` - Main plugin implementation
- `packages/plugins/src/notion/api.ts` - Notion API client
- `packages/plugins/src/notion/query.ts` - Database query builder
- `apps/admin/src/components/NotionConfig.tsx` - Configuration UI

## Dependencies
- Task 014: Plugin Configuration Page

## Acceptance Criteria
- [ ] Integration secret authentication
- [ ] Select database from dropdown
- [ ] Query builder for filtering
- [ ] Map properties to schedule/task fields
- [ ] Filter pages by worker property
- [ ] Transform pages to ScheduleItem/TaskItem format
- [ ] Support date, select, and text properties
- [ ] Handle Notion's pagination
- [ ] Sync only published pages

## Implementation Details
- Use Notion API v2022-06-28
- Implement property type detection
- Add support for formula properties
- Cache results for 5 minutes
- Include page URLs in descriptions
- Handle rich text formatting

## Test Checklist
- [ ] Integration secret validates
- [ ] Database selection works
- [ ] Query builder saves correctly
- [ ] Pages fetch and transform
- [ ] Worker filtering works
- [ ] Pagination handled correctly

---

## Completion Log
- **Started**: 
- **Completed**: 
- **AI Assistant**: 
- **Review Status**: pending
