# User Flows

## Manager Onboarding
**User goal:** Set up organization and send first dashboard to workers  
**Entry point:** Sign up page or invitation link

1. Manager signs up with email/password (Supabase Auth)
2. Manager creates organization (name, settings)
3. Manager adds first worker (name, phone number)
4. Manager connects data source (Google Calendar, Airtable, or manual entry)
5. Manager configures dashboard (select what to show)
6. Manager clicks "Send Dashboard" → SMS sent to worker
7. Manager sees confirmation and delivery status

**Success state:** Worker receives SMS with dashboard link, manager sees "SMS sent successfully"  
**Failure states:**
- Invalid phone number → Show validation error, ask to correct
- SMS delivery fails → Show error, offer to retry
- Plugin connection fails → Show error, offer to reconnect

---

## Daily SMS Send Workflow
**User goal:** Send updated dashboard to all workers for today  
**Entry point:** Admin dashboard home page

1. Manager logs into admin dashboard
2. Manager clicks "Send Today's Dashboard" button
3. System generates tokens for all active workers
4. System aggregates data from connected plugins
5. System sends SMS to each worker with unique dashboard link
6. Manager sees progress indicator and delivery status
7. Manager sees summary: "Sent to 15 workers, 14 delivered, 1 failed"

**Success state:** All workers receive SMS, delivery status shows "delivered"  
**Failure states:**
- Worker phone number invalid → Skip worker, show in failed list
- SMS provider error → Retry failed sends, alert manager
- Plugin sync fails → Use cached data, show warning

---

## Worker Dashboard Access
**User goal:** View today's schedule and tasks  
**Entry point:** SMS link received on phone

1. Worker receives SMS: "Your dashboard for today: [link]"
2. Worker taps link → Opens in phone browser
3. Token validated → Dashboard loads instantly
4. Worker sees today's schedule, location, access codes, instructions
5. Worker taps "Refresh" to see latest updates (no new SMS needed)
6. Worker can screenshot dashboard for offline reference

**Success state:** Dashboard loads in < 2 seconds, shows current data  
**Failure states:**
- Token expired → Show "Link expired, contact your manager"
- Token invalid → Show "Invalid link, contact your manager"
- No internet → Show "No connection, try again"
- Plugin data unavailable → Show cached data with warning

---

## Plugin Connection
**User goal:** Connect Google Calendar to sync worker schedules  
**Entry point:** Admin dashboard → Plugins page

1. Manager clicks "Connect Plugin" → Selects "Google Calendar"
2. Manager clicks "Authorize" → Redirected to Google OAuth
3. Manager grants calendar read permission
4. Manager redirected back to admin dashboard
5. Manager selects which calendar to sync
6. System tests connection → Shows "Connected successfully"
7. System performs initial data sync
8. Manager sees calendar events in dashboard preview

**Success state:** Plugin shows "Active" status, data syncing successfully  
**Failure states:**
- OAuth fails → Show "Authorization failed, try again"
- Calendar not found → Show "No calendars found, check permissions"
- Sync fails → Show "Sync error", offer to retry or disconnect
- Rate limit hit → Show "Too many requests, try again in 1 minute"

---

## Token Expiry / Re-send
**User goal:** Worker needs new dashboard link after token expires  
**Entry point:** Worker taps expired link OR manager manually re-sends

### Scenario A: Worker Taps Expired Link
1. Worker taps dashboard link from yesterday's SMS
2. Token validation fails (expired)
3. Dashboard shows "Link expired, contact your manager for new link"
4. Worker contacts manager (phone/text)
5. Manager re-sends dashboard from admin panel
6. Worker receives new SMS with fresh link

### Scenario B: Manager Proactively Re-sends
1. Manager sees worker hasn't opened dashboard (access logs)
2. Manager clicks "Resend" next to worker name
3. System generates new token, revokes old token
4. System sends new SMS to worker
5. Worker receives new link, old link stops working

**Success state:** Worker receives new link, accesses dashboard successfully  
**Failure states:**
- Worker phone number changed → Manager updates phone, re-sends
- SMS delivery fails → Manager tries alternative contact method
- Worker still can't access → Manager checks token expiry settings

---

## Plugin Disconnection/Reconnection
**User goal:** Disconnect a plugin that's no longer needed or reconnect after fixing configuration  
**Entry point:** Admin dashboard → Plugins page

### Disconnection Flow
1. Manager clicks "Disconnect" next to plugin (e.g., Google Calendar)
2. Confirmation modal appears: "Are you sure? Workers will no longer see data from this plugin."
3. Manager confirms disconnection
4. System revokes OAuth tokens (if applicable)
5. System updates plugin status to 'disconnected' in database
6. System stops syncing data from this plugin
7. Manager sees plugin status change to "Disconnected"

**Success state:** Plugin disconnected, OAuth tokens revoked, data sync stopped  
**Failure states:**
- OAuth revocation fails → Plugin marked disconnected anyway, tokens expire naturally
- Plugin still shows in worker dashboards → Clear cache, refresh dashboard

### Reconnection Flow
1. Manager clicks "Reconnect" on disconnected plugin
2. System initiates OAuth flow (if OAuth-based plugin)
3. Manager grants permissions again
4. System stores new OAuth tokens (encrypted)
5. System updates plugin status to 'active'
6. System performs initial data sync
7. Manager sees "Connected successfully" with last sync timestamp

**Success state:** Plugin reconnected, data syncing successfully  
**Failure states:**
- OAuth fails → Show "Authorization failed, try again"
- Sync fails → Show error message, offer to retry or check configuration
- Rate limit hit → Show "Too many requests, try again in 1 minute"

---

## Worker Deletion and Data Cleanup
**User goal:** Remove a worker who left the company or was added by mistake  
**Entry point:** Admin dashboard → Workers page

1. Manager clicks "Delete" next to worker name
2. Confirmation modal appears with warning:
   - "This will delete [Worker Name] and all associated data."
   - "Dashboard tokens will be revoked immediately."
   - "SMS logs and access logs will be retained for audit (90 days)."
   - "This action cannot be undone."
3. Manager types worker name to confirm (prevents accidental deletion)
4. Manager clicks "Delete Worker"
5. System performs cleanup:
   - Revokes all active dashboard tokens for this worker
   - Marks worker record as deleted (soft delete) OR hard deletes (based on GDPR settings)
   - Retains SMS logs and access logs (foreign key ON DELETE SET NULL)
   - Removes worker from plugin data mappings
6. Manager sees "Worker deleted successfully"
7. Worker removed from worker list

**Success state:** Worker deleted, tokens revoked, audit logs retained  
**Failure states:**
- Database error → Show error, worker not deleted, try again
- Worker has pending SMS → Warn manager, offer to cancel SMS first

**Data retention (GDPR compliance):**
- Worker record: Deleted immediately (or after 30-day grace period)
- SMS logs: Retained for 90 days (audit trail), then anonymized
- Access logs: Retained for 90 days (security audit), then anonymized
- Dashboard tokens: Revoked immediately, deleted after expiry + 24 hours

---

## Organization Settings Update
**User goal:** Update organization settings (name, SMS limits, token expiry, plan)  
**Entry point:** Admin dashboard → Settings page

1. Manager navigates to Settings page
2. Manager sees current settings:
   - Organization name
   - SMS limit per hour (default: 100)
   - Default token expiry hours (default: 8, range: 1-24)
   - Subscription plan (free/starter/professional/enterprise)
3. Manager updates desired settings (e.g., change token expiry from 8 to 24 hours)
4. Manager clicks "Save Changes"
5. System validates changes:
   - Token expiry must be 1-24 hours
   - SMS limit must be within plan limits
   - Organization name must be 1-100 characters
6. System saves changes to database
7. System shows "Settings updated successfully"
8. New settings apply immediately to future operations

**Success state:** Settings saved, new values applied to future tokens/SMS  
**Failure states:**
- Validation error → Show field-specific error (e.g., "Token expiry must be between 1-24 hours")
- Database error → Show "Failed to save settings, try again"
- Plan limit exceeded → Show "Upgrade to [plan] to increase SMS limit"

**Settings that affect existing data:**
- Token expiry change: Only affects NEW tokens (existing tokens keep original expiry)
- SMS limit change: Applies immediately (rate limiting updated)
- Organization name change: Updates immediately, visible in all dashboards
- Plan change: Triggers feature availability check (may disable features if downgrading)
