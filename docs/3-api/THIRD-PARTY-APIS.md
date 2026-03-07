# Third-Party APIs

## MobileMessage.com.au
**Purpose:** SMS delivery to Australian phone numbers  
**Auth:** API key in request header (`Authorization: Bearer <api_key>`)  
**Key Endpoints Used:**
- `POST /v1/sms/send` — Send single SMS
- `POST /v1/sms/send-bulk` — Send multiple SMS (batch)
- `GET /v1/sms/:message_id` — Check delivery status

**Request Parameters (POST /v1/sms/send):**
```json
{
  "to": "+61412345678",        // Required: E.164 format
  "message": "Your dashboard",  // Required: Message content
  "from": "Dashboard",          // Optional: Sender ID (11 chars max)
  "unicode": false,             // Optional: Enable unicode characters
  "max_parts": 1,               // Optional: Max SMS parts (160 chars each)
  "scheduled_for": "ISO8601",   // Optional: Schedule for future delivery
  "callback_url": "https://..." // Optional: Delivery status webhook
}
```

**Limits / Gotchas:**
- Rate limit: 100 SMS per minute (provider-level)
- Cost: 2-3¢ per SMS (no monthly fees)
- Australia-only: Only supports Australian phone numbers (+61)
- Free virtual number included for SMS replies
- Delivery reports via webhook (optional)
- Message length: 160 chars (GSM-7), 70 chars (unicode) ✅ Industry standard
- Multi-part messages: Automatically split if > 160 chars (unless max_parts=1)
- Database constraint: 320 chars max (verified in `supabase/migrations/20260124231200_mvp_schema.sql`)

**Docs:** https://www.mobilemessage.com.au/api-docs

---

## Google Calendar API
**Purpose:** Sync worker schedules from Google Calendar events  
**Auth:** OAuth 2.0 (authorization code flow)  
**Key Endpoints Used:**
- `GET /calendar/v3/calendars/:calendarId/events` — List events
- `GET /calendar/v3/calendars/:calendarId/events/:eventId` — Get single event
- `POST /calendar/v3/calendars/:calendarId/events/watch` — Set up webhook for real-time updates

**Limits / Gotchas:**
- Rate limit: 1,000,000 queries per day (per project)
- Quota: 10 queries per second per user
- OAuth scopes required: `calendar.readonly`
- Refresh tokens expire after 6 months of inactivity
- Event data includes: summary, location, start/end time, description

**Docs:** https://developers.google.com/calendar/api/v3/reference

---

## Airtable API
**Purpose:** Pull task/schedule data from Airtable bases  
**Auth:** Personal access token or OAuth 2.0  
**Key Endpoints Used:**
- `GET /v0/:baseId/:tableId` — List records
- `GET /v0/:baseId/:tableId/:recordId` — Get single record
- Webhooks available for real-time updates (requires webhook endpoint setup)

**Limits / Gotchas:**
- Rate limit: 5 requests per second per base
- Max 100 records per request (use pagination for more)
- Field types: text, number, date, attachment, select, etc.
- Base ID and table ID required (found in Airtable URL)
- Personal access tokens don't expire but can be revoked

**Docs:** https://airtable.com/developers/web/api/introduction

---

## Notion API
**Purpose:** Fetch task/schedule data from Notion databases  
**Auth:** OAuth 2.0 or internal integration token  
**Key Endpoints Used:**
- `POST /v1/databases/:database_id/query` — Query database
- `GET /v1/pages/:page_id` — Get page details
- `GET /v1/blocks/:block_id/children` — Get block content

**Limits / Gotchas:**
- Rate limit: 3 requests per second (average)
- Burst limit: 100 requests per minute
- OAuth scopes: `read_content` for reading databases
- Database ID required (found in Notion URL)
- Property types: title, rich_text, number, date, select, multi_select, etc.
- No native webhook support (must poll for changes)

**Docs:** https://developers.notion.com/reference/intro

---

## Supabase (Internal)
**Purpose:** Database, authentication, storage, and realtime subscriptions  
**Auth:** Service role key (server-side) or anon key + RLS (client-side)  
**Key Endpoints Used:**
- PostgreSQL REST API (PostgREST) for database queries
- Auth API for user management and JWT validation
- Storage API for file uploads (future use)
- Realtime API for database change subscriptions (future use)

**Limits / Gotchas:**
- Free tier: 500MB database, 2GB bandwidth, 50,000 monthly active users
- RLS policies enforce multi-tenant isolation
- Service role bypasses RLS (use carefully)
- Connection pooling: Max 60 connections on free tier
- Automatic backups: Daily (free tier)

**Docs:** https://supabase.com/docs

---

## TODO: Add Stripe API documentation once billing integration is implemented (Phase 2)
## TODO: Document webhook signature verification for each provider
