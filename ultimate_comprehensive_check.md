# ULTIMATE COMPREHENSIVE PROJECT AUDIT

You are auditing a 100% AI-generated SaaS application called "Dashboard Link". This is a monorepo with 3 apps (admin, worker, api) built with React, Hono.js, and Supabase.

## YOUR MISSION

Perform a complete codebase audit and return a detailed report of:
1. What's complete and working
2. What's broken or missing (CRITICAL)
3. What needs fixing before launch
4. Confidence score for production readiness

---

## AUDIT METHODOLOGY

For each section, you will:
1. **READ the actual files** (don't theorize)
2. **Verify code exists** (paste proof)
3. **Test logic flows** (trace execution paths)
4. **Flag blockers** (rate severity: CRITICAL/HIGH/MEDIUM/LOW)

---

## SECTION 1: PROJECT STRUCTURE AUDIT

Check these folders and files exist:

### Required Folders
```
apps/admin/src/
apps/worker/src/
apps/api/src/
packages/plugins/
packages/shared/
packages/ui/
packages/database/migrations/
```

**For each folder:**
- ✓ Exists: YES/NO
- ✓ Has index/main file: YES/NO
- ⚠️ If missing: CRITICAL/HIGH/MEDIUM/LOW

### Required Config Files
```
package.json (root)
turbo.json
pnpm-workspace.yaml
apps/admin/package.json
apps/worker/package.json
apps/api/package.json
apps/admin/vite.config.ts
apps/worker/vite.config.ts
apps/api/tsconfig.json
```

**List any missing config files.**

---

## SECTION 2: AUTHENTICATION SYSTEM AUDIT

### Files to Check
```
apps/admin/src/store/auth.ts
apps/admin/src/components/ProtectedRoute.tsx
apps/admin/src/pages/LoginPage.tsx
apps/api/src/routes/auth.ts
apps/api/src/middleware/auth.ts
```

### Verification Checklist

**Zustand Store (auth.ts):**
- [ ] Exports `useAuthStore` hook
- [ ] Has properties: `user`, `token`, `isLoading`
- [ ] Has `login(email, password)` function
- [ ] Has `logout()` function
- [ ] Uses `persist` middleware for localStorage
- [ ] Handles errors with try/catch
- [ ] Checks token expiry on rehydration
- **Paste the login function signature**

**ProtectedRoute Component:**
- [ ] Checks auth state with `useAuthStore()`
- [ ] Redirects to `/login` when unauthenticated
- [ ] Shows loading spinner during auth check
- [ ] Passes through to children when authenticated
- **Paste the redirect logic**

**Login Page:**
- [ ] Has email input field
- [ ] Has password input field
- [ ] Calls `useAuthStore().login()`
- [ ] Shows validation errors
- [ ] Has "Sign Up" link
- **Paste the form submit handler**

**API Routes (auth.ts):**
- [ ] POST /auth/login endpoint exists
- [ ] POST /auth/signup endpoint exists
- [ ] POST /auth/logout endpoint exists
- [ ] Calls Supabase `auth.signInWithPassword()`
- [ ] Returns `{ user, token }` on success
- [ ] Returns proper error responses (400, 401, 500)
- **Paste the /login route handler**

**Auth Middleware:**
- [ ] Validates JWT token from Authorization header
- [ ] Extracts userId and organizationId
- [ ] Attaches to context for routes to use
- [ ] Returns 401 for invalid/missing tokens
- **Paste the middleware function**

### CRITICAL ISSUES
List any auth functionality that is:
- ❌ **CRITICAL**: Missing/broken - auth won't work at all
- ⚠️ **HIGH**: Partial implementation - security risk
- ⚡ **MEDIUM**: Works but unreliable
- ✓ **WORKING**: Fully implemented

---

## SECTION 3: WORKER MANAGEMENT AUDIT

### Files to Check
```
apps/admin/src/pages/WorkersPage.tsx
apps/admin/src/components/WorkerList.tsx
apps/admin/src/components/WorkerForm.tsx
apps/admin/src/hooks/useWorkers.ts
apps/admin/src/utils/phoneUtils.ts
apps/api/src/routes/workers.ts
packages/shared/src/types/worker.ts
```

### Verification Checklist

**Workers Page:**
- [ ] Uses `useQuery` or `useWorkers` hook
- [ ] Displays workers in table/list
- [ ] Has search/filter functionality
- [ ] Has "Add Worker" button
- [ ] Opens modal/form on click
- [ ] Shows loading skeleton
- [ ] Shows empty state
- **Paste the data fetching hook call**

**Worker Form:**
- [ ] Has fields: name, phone, email, active
- [ ] Validates phone number (Australian format)
- [ ] Validates email format
- [ ] Validates name (min 2 chars)
- [ ] Handles create mode (no initial data)
- [ ] Handles edit mode (pre-fills data)
- [ ] Shows field-level validation errors
- [ ] Calls API on submit
- **Paste the phone validation code**

**Phone Utils:**
- [ ] Has `formatPhone()` function
- [ ] Has `validatePhone()` function
- [ ] Converts to +61 format for storage
- [ ] Displays as 04xx xxx xxx format
- [ ] Handles edge cases (international, invalid)
- **Paste the validation regex or function**

**API Routes (workers.ts):**
- [ ] GET /workers - returns array filtered by org
- [ ] POST /workers - creates with validation
- [ ] PUT /workers/:id - updates existing
- [ ] DELETE /workers/:id - soft/hard delete
- [ ] ALL routes filter by `organizationId`
- [ ] Uses Zod for input validation
- [ ] Returns proper error codes
- **Paste the GET /workers handler**
- **Paste the organization filter code**

**Worker Types:**
- [ ] TypeScript interface `Worker` exists
- [ ] Has all required fields
- [ ] Exported from shared package
- **Paste the Worker interface**

### CRITICAL ISSUES
List any worker management functionality that is broken:
- ❌ **CRITICAL**: CRUD operations don't work
- ⚠️ **HIGH**: Missing validation/security
- ⚡ **MEDIUM**: UI issues but functional
- ✓ **WORKING**: Fully operational

---

## SECTION 4: SMS SYSTEM AUDIT

### Files to Check
```
apps/api/src/services/sms.service.ts
apps/api/src/services/token.service.ts
apps/api/src/routes/sms.ts
apps/admin/src/components/SendSMSButton.tsx
apps/admin/src/components/SMSPreview.tsx
apps/admin/src/hooks/useSMS.ts
```

### Verification Checklist

**SMS Service (sms.service.ts):**
- [ ] Has `sendSMS(phone, message)` function
- [ ] Makes HTTP POST to MobileMessage API
- [ ] URL: https://api.mobilemessage.com.au
- [ ] Uses Basic Auth with username/password
- [ ] Formats phone to +61 format
- [ ] Logs to sms_logs table
- [ ] Returns success/failure status
- [ ] Handles errors gracefully
- **Paste the HTTP request code**
- **Paste the phone formatting code**

**Token Service (token.service.ts):**
- [ ] Has `generateToken()` function
- [ ] Uses `crypto.randomBytes(32)`
- [ ] Generates 64-char hex string
- [ ] Saves to worker_tokens table
- [ ] Sets expiry timestamp (1h-24h)
- [ ] Returns token and dashboard URL
- [ ] Has `validateToken()` function
- [ ] Checks expiry and revoked status
- **Paste the generateToken function**

**API Routes (sms.ts):**
- [ ] POST /sms/send-dashboard-link exists
- [ ] Accepts { workerId, expiresIn }
- [ ] Validates workerId belongs to org
- [ ] Calls tokenService.generateToken()
- [ ] Calls smsService.sendSMS()
- [ ] Returns { token, dashboardUrl, status }
- [ ] GET /sms/logs with pagination
- [ ] Filters logs by organization
- **Paste the send-dashboard-link handler**

**Frontend Components:**
- [ ] SendSMSButton component exists
- [ ] Opens modal/preview on click
- [ ] Shows worker phone number
- [ ] Allows selecting expiry (1h, 6h, 12h, 24h)
- [ ] Shows SMS message preview
- [ ] Calls API endpoint on send
- [ ] Shows loading state during send
- [ ] Shows success toast on completion
- [ ] Shows error toast on failure
- **Paste the API call code**

**Environment Variables:**
- [ ] MOBILEMESSAGE_USERNAME defined in .env.example
- [ ] MOBILEMESSAGE_PASSWORD defined in .env.example
- [ ] Code references these env vars correctly
- **Paste the env var names from code**

### CRITICAL ISSUES - SMS System
Rate each component:
- ❌ **CRITICAL**: SMS won't send at all
- ⚠️ **HIGH**: SMS might fail silently
- ⚡ **MEDIUM**: SMS works but unreliable
- ✓ **WORKING**: Production ready

**Specific checks:**
- Can generate tokens? YES/NO
- Can send to MobileMessage API? YES/NO
- Will SMS reach real phone? YES/NO
- Are errors handled? YES/NO

---

## SECTION 5: WORKER DASHBOARD AUDIT

### Files to Check
```
apps/worker/src/pages/DashboardPage.tsx
apps/worker/src/components/widgets/ScheduleWidget.tsx
apps/worker/src/components/widgets/TasksWidget.tsx
apps/worker/src/hooks/useDashboardData.ts
apps/worker/src/pages/InvalidTokenPage.tsx
apps/worker/src/pages/ExpiredTokenPage.tsx
apps/api/src/routes/dashboards.ts
```

### Verification Checklist

**Dashboard Page:**
- [ ] Extracts token from URL params
- [ ] Calls API with token
- [ ] Shows loading spinner while fetching
- [ ] Redirects to /invalid for bad token
- [ ] Redirects to /expired for expired token
- [ ] Displays worker name
- [ ] Renders ScheduleWidget
- [ ] Renders TasksWidget
- [ ] Mobile-optimized (full width, readable text)
- **Paste the token extraction code**
- **Paste the API endpoint called**

**Schedule Widget:**
- [ ] Receives schedule[] as prop
- [ ] Displays title, time, location, description
- [ ] Formats time as "9:00 AM - 11:00 AM"
- [ ] Sorts items chronologically
- [ ] Shows empty state message
- [ ] Uses mobile-friendly classes
- **Paste the time formatting code**
- **Paste the empty state JSX**

**Tasks Widget:**
- [ ] Receives tasks[] as prop
- [ ] Displays title, priority, due date, description
- [ ] Shows priority indicators (colors/badges)
- [ ] Groups or sorts by priority
- [ ] Shows empty state message
- [ ] Mobile-optimized layout
- **Paste the priority display code**

**Dashboard Data Hook:**
- [ ] Uses useQuery or fetch
- [ ] Handles loading state
- [ ] Handles error states (invalid, expired, network)
- [ ] Returns { worker, schedule, tasks }
- **Paste the complete hook**

**API Endpoint (dashboards.ts):**
- [ ] GET /dashboards/:token exists
- [ ] Validates token in worker_tokens table
- [ ] Checks token not expired
- [ ] Checks token not revoked
- [ ] Fetches worker data
- [ ] Fetches today's schedule from manual_schedule_items
- [ ] Fetches today's tasks from manual_task_items
- [ ] Returns { worker, schedule, tasks }
- [ ] Returns 401 for invalid token
- [ ] Returns 410 for expired token
- **Paste the complete route handler**

**Error Pages:**
- [ ] InvalidTokenPage exists and is clear
- [ ] ExpiredTokenPage exists with helpful message
- [ ] Both are mobile-friendly
- **Paste one error page component**

### CRITICAL ISSUES - Worker Dashboard
- ❌ **CRITICAL**: Dashboard doesn't load at all
- ⚠️ **HIGH**: Data doesn't display
- ⚡ **MEDIUM**: Works on desktop only
- ✓ **WORKING**: Mobile-ready and functional

**Specific checks:**
- Can extract token from URL? YES/NO
- Does API endpoint exist? YES/NO
- Does it fetch real data? YES/NO
- Is it mobile-responsive? YES/NO

---

## SECTION 6: MANUAL DATA ENTRY AUDIT

### Files to Check
```
apps/admin/src/pages/ManualDataPage.tsx
apps/admin/src/components/ScheduleItemForm.tsx
apps/admin/src/components/TaskItemForm.tsx
apps/admin/src/components/ManualDataList.tsx
apps/api/src/routes/manual-data.ts
packages/plugins/src/manual/index.ts
```

### Verification Checklist

**Manual Data Page:**
- [ ] Has tabs: Schedule and Tasks
- [ ] Has worker selector dropdown
- [ ] Has date picker/filter
- [ ] Shows list of items
- [ ] Has "Add" button
- [ ] Opens form modal on add
- [ ] Allows editing existing items
- [ ] Allows deleting items
- **Paste the tab switching code**

**Schedule Item Form:**
- [ ] Fields: title, start_time, end_time, location, description
- [ ] Validates time range (start < end)
- [ ] Validates all required fields
- [ ] Handles create mode
- [ ] Handles edit mode (pre-fills)
- [ ] Calls API on submit
- **Paste the validation code**

**Task Item Form:**
- [ ] Fields: title, description, due_date, priority, status
- [ ] Priority options: low, medium, high
- [ ] Status options: pending, in_progress, completed
- [ ] Validates required fields
- [ ] Calls API on submit
- **Paste the submit handler**

**API Routes (manual-data.ts):**
- [ ] POST /workers/:id/schedule-items - creates item
- [ ] GET /workers/:id/schedule-items - lists with date filter
- [ ] PUT /schedule-items/:id - updates item
- [ ] DELETE /schedule-items/:id - deletes item
- [ ] POST /workers/:id/task-items - creates task
- [ ] GET /workers/:id/task-items - lists tasks
- [ ] PUT /task-items/:id - updates task
- [ ] DELETE /task-items/:id - deletes task
- [ ] ALL routes filter by organization_id
- [ ] Validates date ranges
- [ ] Returns proper pagination
- **Paste one CREATE endpoint handler**

**Manual Adapter (plugins):**
- [ ] Has `getTodaySchedule(workerId)` function
- [ ] Queries manual_schedule_items table
- [ ] Filters by worker_id and today's date
- [ ] Transforms to ScheduleItem[] format
- [ ] Has `getTodayTasks(workerId)` function
- [ ] Queries manual_task_items table
- [ ] Filters by worker_id
- [ ] Transforms to TaskItem[] format
- [ ] Handles errors gracefully
- **Paste the getTodaySchedule function**

### CRITICAL ISSUES - Manual Data
- ❌ **CRITICAL**: Can't add/edit/delete data
- ⚠️ **HIGH**: Data doesn't appear on worker dashboard
- ⚡ **MEDIUM**: UI issues but saves correctly
- ✓ **WORKING**: Full CRUD operational

---

## SECTION 7: DATABASE AUDIT

### Files to Check
```
packages/database/migrations/001_initial_schema.sql
packages/database/migrations/002_rls_policies.sql
packages/database/migrations/003_indexes.sql (if exists)
```

### Required Tables

Check if these tables are created in migrations:
- [ ] organizations
- [ ] admins
- [ ] workers
- [ ] worker_tokens
- [ ] dashboards
- [ ] dashboard_widgets
- [ ] manual_schedule_items
- [ ] manual_task_items
- [ ] sms_logs

**For each table:**
- List primary key
- List foreign keys
- Confirm organization_id exists (for multi-tenancy)
- **Paste one table creation SQL**

### RLS Policies

Check if Row Level Security is enabled:
- [ ] RLS enabled on all tables
- [ ] Policies check organization_id
- [ ] Helper function `get_user_organization_id()` exists
- [ ] Policies prevent cross-org data access
- **Paste one RLS policy**

### Indexes

Check performance indexes exist:
- [ ] workers(organization_id, active)
- [ ] worker_tokens(token)
- [ ] worker_tokens(worker_id, expires_at)
- [ ] manual_schedule_items(worker_id, start_time)
- [ ] manual_task_items(worker_id, due_date)
- **Paste index creation SQL**

### CRITICAL ISSUES - Database
- ❌ **CRITICAL**: Tables don't exist
- ⚠️ **HIGH**: Missing RLS policies (security risk!)
- ⚡ **MEDIUM**: Missing indexes (performance)
- ✓ **WORKING**: Schema complete

---

## SECTION 8: ERROR HANDLING AUDIT

### Files to Check
```
apps/admin/src/components/common/ErrorBoundary.tsx
apps/worker/src/components/ErrorBoundary.tsx
apps/api/src/middleware/error-handler.ts
apps/api/src/utils/errors.ts
apps/admin/src/components/ui/Toast.tsx
apps/admin/src/hooks/useToast.ts
```

### Verification Checklist

**Error Boundary (React):**
- [ ] Catches unhandled React errors
- [ ] Shows user-friendly error page
- [ ] Logs error details to console
- [ ] Has "Try Again" button
- [ ] Has "Reload Page" button
- [ ] Shows error details in dev mode only
- **Paste the componentDidCatch code**

**API Error Handler:**
- [ ] Catches all API errors
- [ ] Returns consistent format: { success, error: { code, message } }
- [ ] Handles different error types (validation, auth, not found)
- [ ] Returns proper HTTP status codes
- [ ] Logs errors with context
- [ ] Doesn't leak sensitive data
- **Paste the error handler middleware**

**Toast Notifications:**
- [ ] Toast component exists
- [ ] Shows success, error, warning, info types
- [ ] Auto-dismisses after timeout
- [ ] Has manual dismiss button
- [ ] Positioned correctly (top-right)
- [ ] Multiple toasts stack properly
- **Paste the Toast component**

**Custom Error Classes:**
- [ ] AppError base class exists
- [ ] ValidationError class
- [ ] AuthenticationError class
- [ ] NotFoundError class
- [ ] All have proper status codes
- **Paste one error class**

### CRITICAL ISSUES - Error Handling
- ❌ **CRITICAL**: App crashes on errors
- ⚠️ **HIGH**: No user feedback on errors
- ⚡ **MEDIUM**: Poor error messages
- ✓ **WORKING**: Comprehensive handling

---

## SECTION 9: END-TO-END INTEGRATION TEST

Trace the COMPLETE user flow through the codebase:

### Flow: Admin Creates Worker & Sends SMS

**Step 1:** Admin signs up
- File: `apps/admin/src/pages/LoginPage.tsx`
- Calls: `POST /auth/signup`
- Creates: organizations + admins records
- ✓ Complete? YES/NO

**Step 2:** Admin adds worker "John"
- File: `apps/admin/src/pages/WorkersPage.tsx`
- Calls: `POST /workers`
- Creates: workers record
- ✓ Complete? YES/NO

**Step 3:** Admin adds schedule item for John
- File: `apps/admin/src/pages/ManualDataPage.tsx`
- Calls: `POST /workers/:id/schedule-items`
- Creates: manual_schedule_items record
- ✓ Complete? YES/NO

**Step 4:** Admin sends SMS to John
- File: `apps/admin/src/components/SendSMSButton.tsx`
- Calls: `POST /sms/send-dashboard-link`
- Creates: worker_tokens + sms_logs records
- Sends: HTTP POST to MobileMessage API
- ✓ Complete? YES/NO

**Step 5:** John opens link on phone
- URL: `http://localhost:5174/dashboard/TOKEN`
- File: `apps/worker/src/pages/DashboardPage.tsx`
- Calls: `GET /dashboards/:token`
- Fetches: worker + schedule + tasks
- ✓ Complete? YES/NO

**Step 6:** John sees his schedule
- Component: `ScheduleWidget`
- Displays: "Clean Office A, 9:00 AM - 11:00 AM"
- ✓ Complete? YES/NO

### Integration Issues

For each step, identify:
- ❌ **BROKEN**: Step completely fails
- ⚠️ **PARTIAL**: Step works sometimes
- ✓ **WORKS**: Step fully functional

---

## SECTION 10: SECURITY AUDIT

### Critical Security Checks

**Authentication Security:**
- [ ] Passwords never stored (Supabase handles)
- [ ] JWT tokens used correctly
- [ ] Tokens stored in localStorage (frontend)
- [ ] Tokens validated on every API request
- [ ] Admin routes require authentication

**Authorization Security:**
- [ ] ALL API routes filter by organization_id
- [ ] Workers can only see their own data
- [ ] Admins can only see their org's data
- [ ] Cross-org data access prevented
- **Paste one org_id filter example**

**Input Validation:**
- [ ] All API inputs validated with Zod
- [ ] Phone numbers sanitized
- [ ] SQL injection prevented (using Supabase)
- [ ] XSS prevented (React escapes by default)

**Secrets Management:**
- [ ] SUPABASE_SERVICE_KEY not in frontend
- [ ] MOBILEMESSAGE credentials server-side only
- [ ] No hardcoded secrets in code
- [ ] .env.example exists (no actual values)

**Token Security:**
- [ ] Tokens are 256-bit random (64 hex chars)
- [ ] Tokens have expiry timestamps
- [ ] Expired tokens rejected
- [ ] Tokens can be revoked

### CRITICAL SECURITY ISSUES
- ❌ **CRITICAL**: Cross-org data leak possible
- ⚠️ **HIGH**: Weak token generation
- ⚡ **MEDIUM**: Missing input validation
- ✓ **SECURE**: Production ready

---

## SECTION 11: MOBILE RESPONSIVENESS AUDIT

### Files to Check
```
apps/worker/src/pages/DashboardPage.tsx
apps/admin/src/components/Navigation.tsx
All component files
```

### Mobile Design Checks

**Worker Dashboard (Primary Mobile App):**
- [ ] Uses mobile-first Tailwind classes
- [ ] Full width containers (w-full, max-w-none)
- [ ] Readable text sizes (text-base or larger)
- [ ] Touch targets ≥44px (p-3, py-3, etc.)
- [ ] No horizontal scroll on mobile
- [ ] Stacks vertically (flex-col)
- [ ] Large buttons (p-4, text-lg)
- **Paste one mobile className example**

**Admin Dashboard:**
- [ ] Sidebar collapses to hamburger on mobile
- [ ] Tables scroll horizontally on mobile
- [ ] Forms full-width on mobile
- [ ] Navigation accessible on mobile
- [ ] Modals work on mobile
- **Paste responsive navigation code**

### CRITICAL MOBILE ISSUES
- ❌ **CRITICAL**: Worker dashboard broken on mobile
- ⚠️ **HIGH**: Hard to use on mobile
- ⚡ **MEDIUM**: Minor mobile UX issues
- ✓ **MOBILE-READY**: Fully responsive

---

## SECTION 12: PERFORMANCE AUDIT

### Code Splitting
- [ ] React.lazy used for routes
- [ ] Suspense wrappers exist
- [ ] Dynamic imports present
- **Paste one lazy import**

### Query Optimization
- [ ] TanStack Query has staleTime configured
- [ ] Queries have proper cache times
- [ ] Refetch strategies defined
- **Paste one useQuery configuration**

### Bundle Analysis
- [ ] rollup-plugin-visualizer installed
- [ ] Build command generates stats
- [ ] Can check bundle sizes
- **Paste visualizer config**

### PERFORMANCE ISSUES
- ⚠️ **HIGH**: Large bundle sizes
- ⚡ **MEDIUM**: No code splitting
- ✓ **OPTIMIZED**: Good performance

---

## FINAL AUDIT REPORT FORMAT

Provide your response in this EXACT format:

---

# 🔍 COMPREHENSIVE PROJECT AUDIT REPORT
**Date:** [Current Date]
**Project:** Dashboard Link SaaS
**Auditor:** AI Assistant

## ✅ WHAT'S WORKING (Complete & Functional)

List every major feature that is fully implemented:
- ✓ Feature name - File evidence - Confidence: XX%

## ❌ CRITICAL ISSUES (Blockers - App Won't Work)

List issues that prevent basic functionality:
- ❌ Issue description
  - **Severity:** CRITICAL
  - **Impact:** What breaks
  - **Files affected:** List
  - **Fix required:** Exact change needed

## ⚠️ HIGH PRIORITY ISSUES (Security/Reliability Risks)

List issues that make app unreliable or insecure:
- ⚠️ Issue description
  - **Severity:** HIGH
  - **Impact:** What's at risk
  - **Files affected:** List
  - **Fix required:** What to add/change

## ⚡ MEDIUM PRIORITY ISSUES (UX/Performance Issues)

List issues that hurt user experience:
- ⚡ Issue description
  - **Severity:** MEDIUM
  - **Impact:** How it affects users
  - **Files affected:** List
  - **Fix required:** Recommended improvement

## 📊 COMPONENT SCORES

Rate each major system:
- Authentication: __/10
- Worker Management: __/10
- SMS System: __/10
- Worker Dashboard: __/10
- Manual Data Entry: __/10
- Database Schema: __/10
- Error Handling: __/10
- Security: __/10
- Mobile Responsiveness: __/10
- Performance: __/10

**Overall Score:** __/100

## 🎯 TOP 3 PRIORITIES

What must be fixed IMMEDIATELY before testing:
1. [Most critical issue]
2. [Second most critical]
3. [Third most critical]

## 🚀 PRODUCTION READINESS

**Can this app launch today?** YES/NO

**Confidence Level:** __% (0-100)

**Estimated Fix Time:**
- Critical issues: __ hours
- High priority: __ hours
- Medium priority: __ hours

**Recommendation:**
[DO NOT LAUNCH / LAUNCH WITH CAUTION / READY TO LAUNCH]

---

## REMEMBER:

1. **Be brutally honest** - I need to know what's actually broken
2. **Paste code evidence** - Prove things exist or are missing
3. **Rate severity correctly** - Don't exaggerate or downplay
4. **Focus on blockers** - What prevents basic functionality?
5. **Give actionable fixes** - Tell me exactly what to do

I'm a non-technical founder. I need clear, specific answers about whether this will work when I run `pnpm dev`.
