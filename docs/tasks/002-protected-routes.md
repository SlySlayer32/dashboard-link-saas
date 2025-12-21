# Task 002: Create Protected Route Component

## Goal
Implement a ProtectedRoute wrapper component that redirects unauthenticated users to login

## Context
Now that we have an auth store, we need to prevent access to admin pages without authentication. This component will wrap all protected routes and handle the redirect logic.

## Files to Create/Modify
- `apps/admin/src/components/ProtectedRoute.tsx` - Route protection wrapper
- `apps/admin/src/pages/LoginPage.tsx` - Login page component
- `apps/admin/src/App.tsx` - Update routing to use ProtectedRoute

## Dependencies
- Task 001: Auth Store (must be completed first)

## Acceptance Criteria
- [x] ProtectedRoute checks auth state on mount
- [x] Unauthenticated users redirected to /login
- [x] Authenticated users see protected content
- [x] Loading state shows spinner while checking auth
- [x] Login page integrates with auth store
- [x] Successful login redirects to dashboard
- [x] Logout button clears auth and redirects

## Implementation Details
- Use Navigate from react-router-dom for redirects
- Check auth store state, not just localStorage
- Show loading spinner during initial auth check
- Create clean login form with email/password
- Add form validation and error display
- Use Tailwind for styling (follow conventions)

## Component Props
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

## Test Checklist
- [x] Accessing protected route without auth redirects to login
- [x] After login, user is redirected back to intended page
- [x] Page refresh maintains authenticated state
- [x] Logout redirects to login page
- [x] Login form handles invalid credentials
- [x] Loading spinner shows during auth check

## Notes
- Store the intended destination in session storage to redirect after login
- Make sure the login form is accessible and mobile-friendly
- Add remember me option if time permits

---

## Completion Log
- **Started**: Dec 21, 2025
- **Completed**: Dec 21, 2025
- **AI Assistant**: Cascade
- **Review Status**: completed
