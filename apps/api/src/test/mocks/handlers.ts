/**
 * MSW Request Handlers for API Integration Tests
 * 
 * Mock external API calls (SMS provider, plugin APIs) for testing
 * without hitting real services.
 */

import { http, HttpResponse } from 'msw';

/**
 * MobileMessage.com.au SMS API Mocks
 */
export const smsHandlers = [
  // Send SMS endpoint
  http.post('https://api.mobilemessage.com.au/v1/send', async ({ request }) => {
    const body = await request.json() as { to: string; message: string }

    // Simulate validation errors
    if (!body.to || !body.message) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Simulate invalid phone number
    if (!body.to.match(/^\+61\d{9}$/)) {
      return HttpResponse.json(
        { error: 'Invalid Australian phone number' },
        { status: 400 }
      )
    }

    // Success response
    return HttpResponse.json({
      messageId: 'mock-msg-' + Math.random().toString(36).substring(7),
      status: 'sent',
      to: body.to,
      timestamp: new Date().toISOString(),
    })
  }),

  // Get SMS status endpoint
  http.get('https://api.mobilemessage.com.au/v1/status/:messageId', ({ params }) => {
    return HttpResponse.json({
      messageId: params.messageId,
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
    })
  }),
]

/**
 * Google Calendar API Mocks
 */
export const googleCalendarHandlers = [
  // List events endpoint
  http.get('https://www.googleapis.com/calendar/v3/calendars/:calendarId/events', ({ request }) => {
    const url = new URL(request.url)
    const timeMin = url.searchParams.get('timeMin')
    const timeMax = url.searchParams.get('timeMax')

    return HttpResponse.json({
      items: [
        {
          id: 'event-1',
          summary: 'Morning Shift',
          start: { dateTime: timeMin || new Date().toISOString() },
          end: { dateTime: timeMax || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() },
          location: '123 Main St',
        },
        {
          id: 'event-2',
          summary: 'Team Meeting',
          start: { dateTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString() },
          end: { dateTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() },
          location: 'Office',
        },
      ],
    })
  }),

  // OAuth token endpoint
  http.post('https://oauth2.googleapis.com/token', async ({ request }) => {
    const body = await request.formData()
    const grantType = body.get('grant_type')

    if (grantType === 'refresh_token') {
      return HttpResponse.json({
        access_token: 'mock-access-token-' + Date.now(),
        expires_in: 3600,
        token_type: 'Bearer',
      })
    }

    return HttpResponse.json({
      access_token: 'mock-access-token-' + Date.now(),
      refresh_token: 'mock-refresh-token-' + Date.now(),
      expires_in: 3600,
      token_type: 'Bearer',
    })
  }),
]

/**
 * Airtable API Mocks
 */
export const airtableHandlers = [
  // List records endpoint
  http.get('https://api.airtable.com/v0/:baseId/:tableId', () => {
    return HttpResponse.json({
      records: [
        {
          id: 'rec1',
          fields: {
            Task: 'Complete installation',
            Status: 'In Progress',
            'Due Date': new Date().toISOString().split('T')[0],
            Priority: 'High',
          },
          createdTime: new Date().toISOString(),
        },
        {
          id: 'rec2',
          fields: {
            Task: 'Follow-up call',
            Status: 'Pending',
            'Due Date': new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            Priority: 'Medium',
          },
          createdTime: new Date().toISOString(),
        },
      ],
    })
  }),
]

/**
 * Notion API Mocks
 */
export const notionHandlers = [
  // Query database endpoint
  http.post('https://api.notion.com/v1/databases/:databaseId/query', async () => {
    return HttpResponse.json({
      results: [
        {
          id: 'page-1',
          properties: {
            Name: {
              title: [{ text: { content: 'Site Visit - 123 Main St' } }],
            },
            Status: {
              select: { name: 'In Progress' },
            },
            Date: {
              date: { start: new Date().toISOString().split('T')[0] },
            },
          },
        },
      ],
    })
  }),

  // OAuth token endpoint
  http.post('https://api.notion.com/v1/oauth/token', async () => {
    return HttpResponse.json({
      access_token: 'mock-notion-token-' + Date.now(),
      workspace_id: 'mock-workspace-id',
    })
  }),
]

/**
 * Error Simulation Handlers
 * Use these to test error handling
 */
export const errorHandlers = [
  // Simulate SMS provider timeout
  http.post('https://api.mobilemessage.com.au/v1/send', async () => {
    await new Promise(resolve => setTimeout(resolve, 10000)) // 10s timeout
    return HttpResponse.json({ error: 'Timeout' }, { status: 504 })
  }),

  // Simulate rate limiting
  http.get('https://www.googleapis.com/calendar/v3/calendars/:calendarId/events', () => {
    return HttpResponse.json(
      { error: { message: 'Rate limit exceeded', code: 429 } },
      { status: 429 }
    )
  }),

  // Simulate unauthorized
  http.get('https://api.airtable.com/v0/:baseId/:tableId', () => {
    return HttpResponse.json(
      { error: { type: 'UNAUTHORIZED', message: 'Invalid API key' } },
      { status: 401 }
    )
  }),
]

/**
 * Default handlers for normal test scenarios
 */
export const handlers = [
  ...smsHandlers,
  ...googleCalendarHandlers,
  ...airtableHandlers,
  ...notionHandlers,
]
