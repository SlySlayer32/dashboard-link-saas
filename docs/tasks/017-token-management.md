# Task 017: Create Token Management Page

## Goal
Implement a page to view and manage active dashboard tokens

## Context
Admins need to see which dashboard links are active, revoke tokens if needed, and view token usage analytics.

## Files to Create/Modify
- `apps/admin/src/pages/TokensPage.tsx` - Token management interface
- `apps/admin/src/components/TokenTable.tsx` - Tokens table
- `apps/admin/src/components/TokenActions.tsx` - Revoke/resend actions
- `apps/admin/src/hooks/useTokens.ts` - Tokens query hook

## Dependencies
- Token Service (already complete)
- Task 003: SMS API Endpoints

## Acceptance Criteria
- [ ] List all active tokens with expiry times
- [ ] Show which tokens have been used
- [ ] Filter by worker
- [ ] Filter by status (active/used/expired)
- [ ] Revoke token action
- [ ] Regenerate token for worker
- [ ] Show token analytics (usage rate)
- [ ] Bulk revoke expired tokens
- [ ] Auto-cleanup configuration

## Implementation Details
- Create token listing API endpoint
- Add real-time countdown for expiry
- Include token usage statistics
- Show device/browser info if available
- Add security alerts for unusual activity

## Test Checklist
- [ ] Tokens list loads correctly
- [ ] Revoke disables token immediately
- [ ] Regenerate creates new token
- [ ] Filters work as expected
- [ ] Expiry countdown updates
- [ ] Bulk cleanup removes expired tokens

---

## Completion Log
- **Started**: Dec 23, 2025
- **Completed**: Dec 23, 2025
- **AI Assistant**: Cascade
- **Review Status**: completed
