# Missing Items and Issues Found

## ESLint Configuration
- Added missing HTML element types to globals:
  - `HTMLImageElement`
  - `HTMLInputElement` 
  - `HTMLSelectElement`
- Added missing browser globals:
  - `clearInterval`
  - `URL`

## Schema Imports Missing
The following schemas are referenced but not imported in useWorkers hook:
- `WorkerQuerySchema`
- `CreateWorkerSchema`
- `UpdateWorkerSchema`

These need to be imported from `@dashboard-link/shared`

## Unused Variables to Fix
- `SettingsPage.tsx`: `_navigate` variable
- `DashboardPreviewPage.tsx`: `isLoading` and `error` variables
- `Pagination.tsx`: `_pages` variable

## React Component Fixes
- Fixed `Math.random()` purity issue in `Input.tsx` by using `useId()` hook
- Added default exports to page components for React.lazy compatibility

## Type Issues Fixed
- Replaced `any` types with `unknown` or proper types
- Fixed cache middleware type issues
- Added proper typing for event handlers

## Non-Critical Warnings (Can Be Ignored)
- TanStack Virtual incompatible library warnings (expected behavior)
- React refresh warnings for utility exports (expected behavior)

## Recommendations
1. Import missing schemas from shared package
2. Clean up unused variables
3. Consider adding ESLint auto-fix for minor issues
4. Document that TanStack Virtual warnings are expected

## Additional Issues Found
- **Button.tsx Type Error**: `class-variance-authority` type constraint issue in worker app
  - Error: Type does not satisfy constraint '(...args: unknown) => any'
  - Location: `E:\CleanConnect\apps\worker\src\components\ui\Button.tsx:31`
  - This is a CVA type compatibility issue that may need updating the library or type declarations

## Dashboard Preview Implementation Missing Items

### API Dependencies
- **Axios**: Had to install axios in admin app for API calls
  - Added to `apps/admin/package.json`
  - Created `apps/admin/src/lib/api.ts` with axios configuration

### Component Exports
- **DashboardPreview Component**: Had inconsistent export/import pattern
  - Fixed by using default export instead of named export
  - Updated imports in `WorkerDetailPage.tsx` and `DashboardPreviewPage.tsx`

### TypeScript Type Issues
- **DashboardData Interface**: Missing interface definition
  - Added proper typing for schedule and task items
  - Fixed optional chaining for `data.schedule.length` and `data.tasks.length`

### Route Integration
- **Admin Routes**: Missing admin route structure
  - Created `apps/api/src/routes/admin/index.ts`
  - Created `apps/api/src/routes/admin/dashboards.ts`
  - Updated main API server to mount admin routes

### Unused Variables
- **DashboardPreviewPage.tsx**: After refactoring, `isLoading` and `error` are unused
  - These variables are now handled internally by the DashboardPreview component

### Project Audit Findings (2025-12-26)

**High Priority Items**:
1. Webhook authentication middleware missing for event listing endpoints (`/events`, `/events/:id`)
2. Core worker CRUD operations not implemented in API routes
3. Plugin adapters need proper API integrations (Google Calendar, Airtable, Notion)

**Medium Priority Items**:
1. SMS history component using mock data - needs real API integration
2. Worker action modals not implemented (edit, SMS send)
3. Missing pagination/filter support in SMS logs API

**Low Priority/Enhancements**:
1. Webhook rate limiting could use Redis instead of in-memory store
2. Additional test coverage for auth middleware
3. Better error handling for plugin adapter failures

### Recommendations for Future Tasks
1. Consider creating a shared API client utility to avoid duplicating axios setup
2. Standardize component export patterns (prefer default exports for page components)
3. Add proper error boundaries for API failures
4. Consider adding loading skeleton components for better UX
5. Document the admin route pattern for future admin features