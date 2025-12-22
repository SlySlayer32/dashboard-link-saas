# Task 010: Create Send SMS Button Component

## Goal
Implement a button component that allows admins to send dashboard links via SMS to workers

## Context
With the SMS API endpoints complete, we need a UI component that allows admins to easily send dashboard links to workers. This will be used on the worker detail page and in the worker list.

## Files to Create/Modify
- `apps/admin/src/components/SendSMSButton.tsx` - SMS sending button
- `apps/admin/src/components/SMSPreview.tsx` - SMS preview modal
- `apps/admin/src/hooks/useSMS.ts` - SMS sending mutation hook

## Dependencies
- Task 003: SMS API Endpoints
- Task 007: Worker List Page (where this will be used)

## Acceptance Criteria
- [ ] Button shows "Send Dashboard Link" text
- [ ] Clicking opens preview modal with SMS content
- [ ] Modal shows phone number and message preview
- [ ] Token expiry selector (1h, 6h, 12h, 24h)
- [ ] Custom message option (optional)
- [ ] Send button with loading state
- [ ] Success notification when sent
- [ ] Error handling for failures
- [ ] Resend option after successful send
- [ ] SMS delivery status shown

## Implementation Details
- Use the SMS API endpoint from Task 003
- Format phone number for display
- Include dashboard URL in preview
- Show character count for custom message
- Disable button while sending
- Store last sent time for each worker

## Component Props
```typescript
interface SendSMSButtonProps {
  worker: Worker;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}
```

## Test Checklist
- [ ] Modal opens on button click
- [ ] Preview shows correct phone number
- [ ] Expiry selection updates token in URL
- [ ] Send button triggers API call
- [ ] Loading state shows during send
- [ ] Success toast appears on completion
- [ ] Error toast shows failure reason
- [ ] Button disabled for recently sent SMS

## Notes
- Consider rate limiting UI (show cooldown)
- Add SMS template customization later
- Track SMS sends for analytics
- Use the shared types for SMS responses

---

## Completion Log
- **Started**: 2025-12-22
- **Completed**: 2025-12-22
- **AI Assistant**: Cascade
- **Review Status**: completed

## Implementation Summary

### ✅ Completed Features
- [x] Button shows "Send Dashboard Link" text
- [x] Clicking opens preview modal with SMS content
- [x] Modal shows phone number and message preview
- [x] Token expiry selector (1h, 6h, 12h, 24h)
- [x] Custom message option (optional)
- [x] Send button with loading state
- [x] Success notification when sent
- [x] Error handling for failures
- [x] Resend option after successful send
- [x] SMS delivery status shown

### 📁 Files Created/Modified
- `apps/admin/src/hooks/useSMS.ts` - SMS sending mutation hook
- `apps/admin/src/components/SendSMSButton.tsx` - SMS sending button component
- `apps/admin/src/components/SMSPreview.tsx` - SMS preview modal component
- `apps/admin/src/components/WorkerList.tsx` - Integrated SMS button into actions
- `packages/shared/src/types/sms.ts` - Added SMS types to shared types

### 🔧 Technical Implementation
- Uses TanStack Query for API state management
- React Hot Toast for notifications
- Shared types for consistency across apps
- Proper error handling and loading states
- Phone number formatting utilities
- Modal with character count and validation

### 🧪 Test Status
- Tests not yet implemented (low priority)
- Build passes successfully
- Components integrate properly with existing codebase
