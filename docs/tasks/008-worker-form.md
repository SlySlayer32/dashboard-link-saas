# Task 008: Create Worker Form Component

## Goal
Implement a reusable form component for creating and editing workers

## Context
The worker list page needs a way to add new workers and edit existing ones. This form will handle worker data entry with validation for phone numbers and email addresses.

## Files to Create/Modify
- `apps/admin/src/components/WorkerForm.tsx` - Worker creation/editing form
- `apps/admin/src/components/ui/Form.tsx` - Reusable form components
- `apps/admin/src/utils/phoneUtils.ts` - Phone number validation/formatting
- `apps/admin/src/hooks/useWorkerMutation.ts` - Mutation hooks for CRUD

## Dependencies
- Task 007: Worker List Page (will use this form)

## Acceptance Criteria
- [ ] Form has fields: name, phone, email, status (active/inactive)
- [ ] Phone number validation for Australian format
- [ ] Email format validation
- [ ] Name field required (min 2 characters)
- [ ] Form submits with loading state
- [ ] Success message on creation/update
- [ ] Error messages for validation failures
- [ ] Form pre-fills data when editing
- [ ] Reset button clears form
- [ ] Cancel button closes modal

## Implementation Details
- Use react-hook-form for form management
- Implement phone mask/formatting for AU numbers
- Add real-time validation feedback
- Use controlled components
- Handle both create and edit modes
- Show field errors clearly

## Component Props
```typescript
interface WorkerFormProps {
  worker?: Worker; // If provided, edit mode
  onSubmit: (data: CreateWorkerRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}
```

## Test Checklist
- [x] Form validation triggers on blur
- [x] Submit button disabled while invalid
- [x] Phone formatting works on input
- [x] Edit mode pre-fills all fields
- [x] Create mode shows empty form
- [x] Form resets after successful submit
- [x] Error messages clear on input

## Notes
- Australian format: +61 4xx xxx xxx or 04xx xxx xxx
- Consider adding international support later
- Use the shared types from packages/shared
- Add form analytics tracking if needed

---

## Completion Log
- **Started**: 2025-01-21
- **Completed**: 2025-01-21
- **AI Assistant**: Cascade
- **Review Status**: completed

## 🎁 Value Additions
1. Created comprehensive phone utilities with real-time formatting as user types
2. Built reusable Form UI components that can be used across the admin app
3. Implemented proper form validation with Zod schema
4. Added loading states and error handling in mutation hooks
5. Created a flexible WorkerForm that handles both create and edit modes
6. Added helpful helper text and validation messages
7. Included TypeScript types for full type safety
8. Added react-hot-toast integration for user feedback
