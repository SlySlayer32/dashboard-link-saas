# Task 001: Implement Auth Store

## Goal
Create Zustand store for authentication state management in the admin dashboard

## Context
The auth backend is complete, but the frontend needs state management to handle user authentication, token storage, and protected routes. This is the foundation for all admin functionality.

## Files to Create/Modify
- `apps/admin/src/store/auth.ts` - Main auth store with Zustand
- `apps/admin/src/types/auth.ts` - Auth-related TypeScript types

## Dependencies
- None (this is the first frontend task)

## Acceptance Criteria
- [x] Store contains user, token, and loading state
- [x] Login action calls auth API and updates state
- [x] Logout action clears state and removes token
- [x] Token refresh action handles expiry
- [x] State persists to localStorage
- [x] Initial state loads from localStorage on app start

## Implementation Details
- Use Zustand with persist middleware
- Store JWT token in localStorage
- Include error handling in async actions
- Add TypeScript interfaces for User and LoginResponse
- Export typed hooks for component use

## API Integration
```typescript
// Will use these endpoints:
POST /auth/login - { email, password } -> { user, token }
POST /auth/logout - clears session
GET /auth/me - returns current user
```

## Component Props
N/A - This is a store, not a component

## Test Checklist
- [x] Store initializes with empty state
- [x] Login action updates store with user data
- [x] Logout action clears all state
- [x] State persists across page refresh
- [x] Invalid credentials throw appropriate error
- [x] Token refresh updates token without losing user data

## Notes
- Make sure to handle the case where stored token is expired
- Use the exact API response format from auth.ts routes
- Follow the store pattern defined in conventions.md

---

## Completion Log
- **Started**: Dec 21, 2025
- **Completed**: Dec 21, 2025
- **AI Assistant**: Cascade
- **Review Status**: completed
