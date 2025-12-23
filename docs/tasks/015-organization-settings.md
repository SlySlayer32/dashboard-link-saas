# Task 015: Create Organization Settings Page

## Goal
Implement the organization settings page for managing account preferences

## Context
Admins need to manage organization-level settings like SMS sender ID, default token expiry, and other preferences.

## Files to Create/Modify
- `apps/admin/src/pages/SettingsPage.tsx` - Organization settings
- `apps/admin/src/components/OrganizationForm.tsx` - Settings form
- `apps/admin/src/components/SMSSettings.tsx` - SMS configuration
- `apps/admin/src/components/DangerZone.tsx` - Delete organization

## Dependencies
- Task 004: Organizations API

## Acceptance Criteria
- [x] Edit organization name
- [x] Configure SMS sender ID
- [x] Set default token expiry (1-168 hours)
- [x] Add custom metadata fields
- [x] Show organization creation date
- [x] Display current plan/usage stats
- [x] Delete organization with confirmation
- [x] Save/cancel actions
- [x] Form validation

## Implementation Details
- Use the organizations API endpoints
- Add confirmation for dangerous actions
- Include usage statistics
- Add team member management later
- Show billing information placeholder

## Test Checklist
- [x] Form loads with current settings
- [x] Updates save successfully
- [x] Validation prevents invalid values
- [x] Delete requires confirmation
- [x] Changes persist after reload

---

## Completion Log
- **Started**: Dec 23, 2025
- **Completed**: Dec 23, 2025
- **AI Assistant**: Cascade
- **Review Status**: completed
