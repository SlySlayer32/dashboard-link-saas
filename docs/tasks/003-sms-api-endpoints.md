# Task 003: Complete SMS API Endpoints

## Goal
Implement the SMS sending endpoint and SMS logs retrieval in the API

## Context
The SMS service is already implemented but the API routes need to be completed to enable sending dashboard links via SMS from the admin interface.

## Files to Create/Modify
- `apps/api/src/routes/sms.ts` - Complete SMS endpoints implementation
- `apps/api/src/types/sms.ts` - SMS-related TypeScript types

## Dependencies
- Token Service (already complete)
- SMS Service (already complete)

## Acceptance Criteria
- [x] POST /sms/send-dashboard-link generates secure token
- [x] POST /sms/send-dashboard-link sends SMS with dashboard URL
- [x] POST /sms/send-dashboard-link logs SMS to database
- [x] GET /sms/logs returns paginated SMS logs for organization
- [x] Token expiry is configurable (1hr, 6hr, 12hr, 24hr)
- [x] Rate limiting is applied per organization
- [x] Error handling for invalid phone numbers
- [x] Error handling for SMS delivery failures

## Implementation Details
- Use existing TokenService to generate tokens
- Use existing SMSService to send messages
- Validate worker exists and belongs to organization
- Check organization SMS limits (if configured)
- Return proper error messages with status codes
- Add pagination to logs endpoint
- Include SMS delivery status in response

## API Endpoints
```
POST /sms/send-dashboard-link
Request: {
  workerId: string;
  expiresIn: '1h' | '6h' | '12h' | '24h';
  customMessage?: string;
}
Response: {
  success: boolean;
  data: {
    smsId: string;
    token: string;
    dashboardUrl: string;
    status: 'sent' | 'pending' | 'failed';
  }
}

GET /sms/logs
Query: ?page=1&limit=20&workerId=xxx
Response: {
  success: boolean;
  data: SMSLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

## Test Checklist
- [x] SMS endpoint returns 401 without auth
- [x] SMS endpoint returns 404 for invalid worker
- [x] SMS generates valid token
- [x] SMS includes correct dashboard URL
- [x] SMS logged to database with correct status
- [x] Logs endpoint only returns organization's SMS logs
- [x] Pagination works correctly
- [x] Rate limiting prevents abuse

## Notes
- Use the organization ID from auth middleware
- Follow the error response pattern from other routes
- Make sure to validate phone format before sending
- Consider adding a test mode for development

---

## Completion Log
- **Started**: Dec 21, 2025
- **Completed**: Dec 21, 2025
- **AI Assistant**: Cascade
- **Review Status**: completed
