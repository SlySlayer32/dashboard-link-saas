# MSW (Mock Service Worker) Setup Guide

## Overview

Mock Service Worker (MSW) is configured for integration testing to mock external API calls without hitting real services. This allows testing of:
- SMS provider integration (MobileMessage.com.au)
- Plugin APIs (Google Calendar, Airtable, Notion)
- Error scenarios (timeouts, rate limits, auth failures)

## Installation

MSW is already configured in the API package. To install in other packages:

```powershell
# Install MSW
pnpm add -D msw@latest

# For TypeScript support
pnpm add -D @types/node
```

## Project Structure

```
apps/api/src/test/
├── mocks/
│   ├── handlers.ts    # MSW request handlers
│   └── server.ts      # MSW server setup
└── setup.ts           # Vitest setup with MSW integration
```

## Usage in Tests

### Basic Test with Default Handlers

```typescript
import { describe, it, expect } from 'vitest'
import { SMSService } from '@/services/sms-service'

describe('SMSService', () => {
  it('should send SMS successfully', async () => {
    const smsService = new SMSService()
    
    // MSW will intercept this HTTP call
    const result = await smsService.send({
      to: '+61412345678',
      message: 'Test message'
    })
    
    expect(result.success).toBe(true)
    expect(result.messageId).toMatch(/^mock-msg-/)
  })
})
```

### Override Handlers for Specific Tests

```typescript
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

describe('SMSService error handling', () => {
  it('should handle SMS provider timeout', async () => {
    // Override default handler for this test
    server.use(
      http.post('https://api.mobilemessage.com.au/v1/send', async () => {
        await new Promise(resolve => setTimeout(resolve, 10000))
        return HttpResponse.json({ error: 'Timeout' }, { status: 504 })
      })
    )
    
    const smsService = new SMSService()
    const result = await smsService.send({
      to: '+61412345678',
      message: 'Test'
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Timeout')
  })
})
```

### Test Rate Limiting

```typescript
it('should handle Google Calendar rate limit', async () => {
  server.use(
    http.get('https://www.googleapis.com/calendar/v3/calendars/:calendarId/events', () => {
      return HttpResponse.json(
        { error: { message: 'Rate limit exceeded', code: 429 } },
        { status: 429 }
      )
    })
  )
  
  const calendarService = new GoogleCalendarService()
  const result = await calendarService.getEvents('calendar-id')
  
  expect(result.error).toContain('Rate limit')
})
```

## Available Mock Handlers

### SMS Provider (MobileMessage.com.au)

**Send SMS:**
- Endpoint: `POST https://api.mobilemessage.com.au/v1/send`
- Validates phone number format (+61...)
- Returns mock message ID

**Get Status:**
- Endpoint: `GET https://api.mobilemessage.com.au/v1/status/:messageId`
- Returns 'delivered' status

### Google Calendar API

**List Events:**
- Endpoint: `GET https://www.googleapis.com/calendar/v3/calendars/:calendarId/events`
- Returns 2 mock events with today's date
- Respects `timeMin` and `timeMax` query params

**OAuth Token:**
- Endpoint: `POST https://oauth2.googleapis.com/token`
- Handles both authorization code and refresh token flows

### Airtable API

**List Records:**
- Endpoint: `GET https://api.airtable.com/v0/:baseId/:tableId`
- Returns 2 mock task records

### Notion API

**Query Database:**
- Endpoint: `POST https://api.notion.com/v1/databases/:databaseId/query`
- Returns 1 mock page

**OAuth Token:**
- Endpoint: `POST https://api.notion.com/v1/oauth/token`
- Returns mock access token

## Error Simulation

Import `errorHandlers` for testing error scenarios:

```typescript
import { server } from '@/test/mocks/server'
import { errorHandlers } from '@/test/mocks/handlers'

describe('Error handling', () => {
  beforeEach(() => {
    server.use(...errorHandlers)
  })
  
  it('should handle timeout', async () => {
    // All handlers now simulate errors
  })
})
```

## Best Practices

### 1. Reset Handlers Between Tests

MSW automatically resets handlers after each test via `server.resetHandlers()` in `setup.ts`.

### 2. Use Specific Overrides

Override only the specific endpoint you're testing:

```typescript
// Good: Specific override
server.use(
  http.post('https://api.mobilemessage.com.au/v1/send', () => {
    return HttpResponse.json({ error: 'Failed' }, { status: 500 })
  })
)

// Bad: Replacing all handlers
server.use(...errorHandlers) // Only use in beforeEach
```

### 3. Test Both Success and Failure

```typescript
describe('SMSService', () => {
  it('should send SMS successfully', async () => {
    // Uses default handler (success)
  })
  
  it('should handle provider errors', async () => {
    server.use(/* error handler */)
  })
  
  it('should handle network timeouts', async () => {
    server.use(/* timeout handler */)
  })
})
```

### 4. Validate Request Data

```typescript
http.post('https://api.mobilemessage.com.au/v1/send', async ({ request }) => {
  const body = await request.json()
  
  // Validate request structure
  if (!body.to || !body.message) {
    return HttpResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  
  // Validate phone format
  if (!body.to.match(/^\+61\d{9}$/)) {
    return HttpResponse.json({ error: 'Invalid phone' }, { status: 400 })
  }
  
  return HttpResponse.json({ success: true })
})
```

## Debugging MSW

### Enable Request Logging

MSW logs unhandled requests by default (configured in `setup.ts`):

```typescript
server.listen({ onUnhandledRequest: 'warn' })
```

### Check Active Handlers

```typescript
import { server } from '@/test/mocks/server'

console.log(server.listHandlers())
```

### Verify Handler Matches

```typescript
it('should match handler', async () => {
  const response = await fetch('https://api.mobilemessage.com.au/v1/send', {
    method: 'POST',
    body: JSON.stringify({ to: '+61412345678', message: 'Test' })
  })
  
  console.log(response.status) // Should be 200 if handler matched
})
```

## Integration with Vitest

MSW is automatically enabled for all tests via `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    setupFiles: ['./src/test/setup.ts'], // Loads MSW server
    environment: 'node',
  }
})
```

## Common Issues

### Issue: "Cannot find module 'msw'"

**Solution:** Install MSW as dev dependency:
```powershell
pnpm add -D msw@latest
```

### Issue: Handlers not matching

**Solution:** Check URL exactly matches (including protocol, domain, path):
```typescript
// Wrong: Missing protocol
http.get('api.example.com/endpoint', ...)

// Correct: Full URL
http.get('https://api.example.com/endpoint', ...)
```

### Issue: TypeScript errors on request/params

**Solution:** MSW provides types automatically. Ensure `msw` is installed and TypeScript can find it.

## Running Tests

```powershell
# Run all tests with MSW
pnpm --filter @dashboard-link/api test

# Run specific test file
pnpm --filter @dashboard-link/api test src/services/sms-service.test.ts

# Run with coverage
pnpm --filter @dashboard-link/api test --coverage
```

## Next Steps

1. **Install MSW:** `pnpm add -D msw@latest` in `apps/api`
2. **Run tests:** Verify MSW handlers work correctly
3. **Add integration tests:** Test full API flows with mocked external services
4. **Monitor coverage:** Ensure thresholds are met (see `vitest.config.ts`)

## References

- [MSW Documentation](https://mswjs.io)
- [MSW with Vitest](https://mswjs.io/docs/integrations/node)
- [Test Handlers](../apps/api/src/test/mocks/handlers.ts)
- [Coverage Thresholds](../apps/api/vitest.config.ts)
