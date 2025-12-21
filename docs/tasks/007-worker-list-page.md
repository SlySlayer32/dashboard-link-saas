# Task 007: Implement Worker List Page

## Goal
Create the WorkersPage component with a table view of all workers and search/filter functionality

## Context
With the auth system in place, we can now build the main worker management interface. This page will allow admins to view, search, and manage all workers in their organization.

## Files to Create/Modify
- `apps/admin/src/pages/WorkersPage.tsx` - Main workers page component
- `apps/admin/src/components/WorkerList.tsx` - Worker table component
- `apps/admin/src/hooks/useWorkers.ts` - TanStack Query hooks for workers
- `apps/admin/src/components/ui/Table.tsx` - Reusable table component (if needed)

## Dependencies
- Task 001: Auth Store
- Task 002: Protected Routes
- Worker API routes (already complete)

## Acceptance Criteria
- [ ] Page displays all workers in a table
- [ ] Table shows: name, phone, email, status, created date
- [ ] Search bar filters workers by name or email
- [ ] Status filter shows active/inactive workers
- [ ] "Add Worker" button opens create form
- [ ] Clicking worker row opens edit modal
- [ ] Delete button shows confirmation dialog
- [ ] Loading spinner shown while fetching
- [ ] Empty state displayed when no workers
- [ ] Pagination for large lists (20 per page)

## Implementation Details
- Use TanStack Query for data fetching
- Implement debounced search (300ms delay)
- Use Tailwind classes for styling
- Make table responsive for tablets
- Add hover states and transitions
- Include worker count in page header

## Component Props
```typescript
interface WorkerListProps {
  workers: Worker[];
  isLoading: boolean;
  onEdit: (worker: Worker) => void;
  onDelete: (worker: Worker) => void;
}
```

## Test Checklist
- [x] Workers load on page mount
- [x] Search filters results in real-time
- [x] Status filter works correctly
- [x] Edit button triggers modal
- [x] Delete shows confirmation
- [x] Pagination loads next page
- [x] Mobile responsive layout

## Notes
- Use the worker types from shared package
- Follow the loading/error pattern from conventions
- Consider adding bulk actions later
- Phone numbers should be formatted for display

---

## Completion Log
- **Started**: 2025-01-21
- **Completed**: 2025-01-21
- **AI Assistant**: Cascade
- **Review Status**: completed

## 🎁 Value Additions
1. Implemented debounced search (300ms) to reduce API calls
2. Added pagination with prefetching for better UX
3. Created reusable Table component with skeleton loading
4. Added confirmation modal for delete actions
5. Implemented proper error handling with user-friendly messages
6. Added status badges for visual clarity
7. Built responsive design that works on tablets
8. Included worker count and pagination controls
