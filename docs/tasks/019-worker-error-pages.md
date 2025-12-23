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
- **Started**: 2025-01-22
- **Completed**: 2025-01-22
- **AI Assistant**: Cascade
- **Review Status**: completed

## 🎁 Value Additions
1. Created a reusable ErrorLayout component with consistent branding and mobile optimization
2. Implemented intelligent error routing in DashboardPage that redirects based on error type
3. Added error tracking system that logs errors to localStorage for debugging
4. Included helpful illustrations and clear next steps for each error type
5. Added copy error details functionality for support
6. Implemented expiry time display for expired tokens
7. Used React Router's wildcard route for 404 handling
