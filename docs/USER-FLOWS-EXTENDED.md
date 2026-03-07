# Extended User Flows

> See `@e:\CleanConnect\docs\6-product\USER-FLOWS.md` for core user flows.

This document contains additional user flows and edge cases.

## E-04: Manager Makes Schedule Change (Real-Time Updates)

**PRD Reference:** Section 2.2, Step 5  
**Status:** Phase 2 feature (requires real-time infrastructure)

**Flow:**
1. Manager updates schedule in connected plugin (Google Calendar, Airtable)
2. Plugin webhook triggers sync to Dashboard Link
3. Dashboard Link updates worker's dashboard data
4. Worker refreshes dashboard → sees updated schedule
5. Optional: Push notification to worker (Phase 2+)

**Technical Requirements:**
- Webhook endpoints for each plugin
- Real-time data sync mechanism
- Dashboard refresh detection
- Push notification infrastructure (Phase 2+)

**Current MVP Behavior:**
- Manual refresh required
- No real-time updates
- No push notifications

## E-05: Onboarding Time Constraint

**PRD Reference:** Section 5.2  
**Target:** < 15 minutes from signup to first SMS sent

**Flow:**
1. Manager signs up (email/password) → **2 min**
2. Connect Google Calendar or enter manual data → **5 min**
3. Add first worker (name + phone) → **2 min**
4. Generate dashboard token → **1 min**
5. Send first SMS → **1 min**
6. Worker opens dashboard → **verify**

**Total:** ~11 minutes (within 15-minute target)

**Testing Approach:**
- Time each step in user testing
- Identify friction points
- Optimize slow steps
- Track completion rate

## E-08: Beta User Conversion Flow

**PRD Reference:** Section 6.2  
**Target:** > 60% conversion from beta to paid

**Flow:**
1. Beta user signs up (free trial)
2. Uses product for 14-30 days
3. Receives value summary email (SMS sent, time saved)
4. Prompted to upgrade at trial end
5. Selects plan and enters payment
6. Becomes paying customer

**Conversion Triggers:**
- Trial expiry (14 or 30 days)
- SMS limit reached (100 SMS/month on free tier)
- Worker limit reached (5 workers on free tier)
- Feature request (advanced features require paid plan)

**Tracking:**
- Signup date
- Trial end date
- SMS usage
- Worker count
- Conversion date
- Conversion trigger

## E-03: Dashboard Open Rate Tracking

**PRD Reference:** Section 6.2  
**Target:** > 80% open rate

**Implementation:**
1. Track when dashboard token is accessed (already in `access_logs`)
2. Calculate open rate: `accessed_tokens / total_tokens_sent`
3. Display in admin analytics dashboard
4. Alert if open rate drops below 70%

**Metrics:**
- Daily open rate
- Per-worker open rate
- Time to first open (after SMS sent)
- Refresh count per session

---

**Note:** These flows will be moved to main USER-FLOWS.md when implemented.
