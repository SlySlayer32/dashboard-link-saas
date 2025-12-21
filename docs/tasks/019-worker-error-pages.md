# Task 019: Create Worker Error Pages

## Goal
Implement error pages for the worker dashboard (invalid token, expired token, etc.)

## Context
Workers may click expired or invalid links. We need clear, user-friendly error pages that explain the issue and provide next steps.

## Files to Create/Modify
- `apps/worker/src/pages/InvalidTokenPage.tsx` - Invalid token error
- `apps/worker/src/pages/ExpiredTokenPage.tsx` - Token expired error
- `apps/worker/src/pages/NotFoundPage.tsx` - 404 error
- `apps/worker/src/components/ErrorLayout.tsx` - Consistent error page layout

## Dependencies
- Task 018: Worker Dashboard Page

## Acceptance Criteria
- [ ] Invalid token shows clear error message
- [ ] Expired token shows expiry time and request new link option
- [ ] 404 page for unknown routes
- [ ] Consistent branding with admin app
- [ ] Mobile-optimized error layouts
- [ ] Contact support information
- [ ] Return to home option
- [ ] Error codes for debugging

## Implementation Details
- Use React Router error boundaries
- Add analytics tracking for errors
- Include helpful illustrations/icons
- Provide copy error button for support
- Add retry mechanism for network errors

## Test Checklist
- [ ] Invalid token URL shows error page
- [ ] Expired token shows expiry info
- [ ] 404 shows for unknown routes
- [ ] All pages mobile responsive
- [ ] Error tracking works

---

## Completion Log
- **Started**: 
- **Completed**: 
- **AI Assistant**: 
- **Review Status**: pending
