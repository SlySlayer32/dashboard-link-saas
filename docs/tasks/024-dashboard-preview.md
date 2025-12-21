# Task 024: Create Dashboard Preview for Admins

## Goal
Implement a preview feature that allows admins to see what workers see

## Context
Admins need to preview worker dashboards to ensure data is correct before sending SMS links.

## Files to Create/Modify
- `apps/admin/src/pages/DashboardPreviewPage.tsx` - Preview interface
- `apps/admin/src/components/DashboardPreview.tsx` - Preview component
- `apps/admin/src/components/DateSelector.tsx` - Date picker for preview
- `apps/admin/src/hooks/useDashboardPreview.ts` - Preview data hook

## Dependencies
- Task 018: Worker Dashboard Page

## Acceptance Criteria
- [ ] Preview shows exact worker dashboard layout
- [ ] Date selector to preview any day
- [ ] Switch between mobile/desktop view
- [ ] Shows same data as worker sees
- [ ] Quick access from worker detail page
- [ ] Print preview option
- [ ] Share preview link (temporary)
- [ ] Highlight manual vs external data
- [ ] Show data sources

## Implementation Details
- Reuse worker dashboard components
- Add admin-specific controls
- Simulate mobile viewport
- Include debug information
- Add data source indicators

## Test Checklist
- [ ] Preview matches worker view
- [ ] Date selector updates data
- [ ] Mobile view works correctly
- [ ] Print formatting looks good
- [ ] Share link works temporarily

---

## Completion Log
- **Started**: 
- **Completed**: 
- **AI Assistant**: 
- **Review Status**: pending
