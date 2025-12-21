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
- [ ] Edit organization name
- [ ] Configure SMS sender ID
- [ ] Set default token expiry (1-168 hours)
- [ ] Add custom metadata fields
- [ ] Show organization creation date
- [ ] Display current plan/usage stats
- [ ] Delete organization with confirmation
- [ ] Save/cancel actions
- [ ] Form validation

## Implementation Details
- Use the organizations API endpoints
- Add confirmation for dangerous actions
- Include usage statistics
- Add team member management later
- Show billing information placeholder

## Test Checklist
- [ ] Form loads with current settings
- [ ] Updates save successfully
- [ ] Validation prevents invalid values
- [ ] Delete requires confirmation
- [ ] Changes persist after reload

---

## Completion Log
- **Started**: 
- **Completed**: 
- **AI Assistant**: 
- **Review Status**: pending
