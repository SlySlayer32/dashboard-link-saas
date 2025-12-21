# Task 004: Complete Organizations API Endpoints

## Goal
Implement organization management endpoints for updating settings and retrieving organization details

## Context
Admin users need to manage their organization settings such as SMS sender ID, default token expiry, and other preferences. The API endpoints need to be completed to support this functionality.

## Files to Create/Modify
- `apps/api/src/routes/organizations.ts` - Complete organization endpoints
- `apps/api/src/types/organization.ts` - Organization-related types

## Dependencies
- Auth middleware (already complete)
- Database schema (already complete)

## Acceptance Criteria
- [x] GET /organizations returns current organization details
- [x] PUT /organizations updates organization settings
- [x] Settings include SMS sender ID, default token expiry
- [x] Settings support custom JSON metadata
- [x] Updates are validated before saving
- [x] Returns 404 if organization not found
- [x] Only admins can update their organization

## Implementation Details
- Use organization ID from auth middleware
- Validate settings object against schema
- Merge updates with existing settings (don't overwrite)
- Add TypeScript interfaces for settings
- Include updated_at timestamp in response
- Handle partial updates (only provided fields)

## API Endpoints
```
GET /organizations
Response: {
  success: boolean;
  data: {
    id: string;
    name: string;
    settings: {
      smsSenderId: string;
      defaultTokenExpiry: number; // in hours
      customMetadata: Record<string, any>;
    };
    createdAt: string;
    updatedAt: string;
  }
}

PUT /organizations
Request: {
  name?: string;
  settings?: {
    smsSenderId?: string;
    defaultTokenExpiry?: number;
    customMetadata?: Record<string, any>;
  };
}
Response: {
  success: boolean;
  data: Organization; // Same structure as GET
}
```

## Test Checklist
- [x] GET endpoint returns 401 without auth
- [x] GET returns correct organization data
- [x] PUT updates only provided fields
- [x] PUT validates sender ID format
- [x] PUT validates token expiry range (1-168 hours)
- [x] Settings merge correctly with existing data
- [x] Updated timestamp changes after update

## Notes
- Use JSON schema validation for settings
- Consider adding organization logo upload later
- Settings should have sensible defaults
- Add audit trail for important changes if time permits

---

## Completion Log
- **Started**: Dec 21, 2025
- **Completed**: Dec 21, 2025
- **AI Assistant**: Cascade
- **Review Status**: completed
