# Feature Specification: CleanConnect SMS Dashboard MVP

**Feature Branch**: `001-sms-dashboard-mvp`  
**Created**: 2026-01-21  
**Status**: Draft  
**Input**: User description: "Develop CleanConnect, a SaaS platform that delivers personalized daily dashboards to frontline workers via SMS links—no app install and no worker login. The goal is to make 'today's work' instantly accessible on any phone, while admins configure what each worker sees through secure, organization‑scoped data sources."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Onboards Organization and Workers (Priority: P1)

A cleaning company manager needs to set up their organization and add their team of cleaners so they can start receiving daily job schedules via SMS.

**Why this priority**: This is the foundational capability—without organization setup and worker management, no other features can function. It establishes the multi-tenant structure and enables all subsequent workflows.

**Independent Test**: Can be fully tested by creating an admin account, setting up an organization with basic settings, adding multiple workers with phone numbers, and verifying workers are stored with proper organization isolation. Delivers immediate value by establishing the worker roster.

**Acceptance Scenarios**:

1. **Given** a new user visits the platform, **When** they sign up with email and password, **Then** they create an admin account and are prompted to set up their organization
2. **Given** an admin is logged in, **When** they complete organization setup with name and settings, **Then** their organization is created and they can access the admin dashboard
3. **Given** an admin is on the workers page, **When** they add a worker with name and phone number, **Then** the worker is saved to their organization and appears in the worker list
4. **Given** an admin has multiple workers, **When** they view the worker list, **Then** they see only workers belonging to their organization (tenant isolation verified)
5. **Given** an admin selects a worker, **When** they edit or delete the worker, **Then** the changes are saved and reflected immediately

---

### User Story 2 - Admin Connects Calendar Data Source (Priority: P2)

A construction firm admin needs to connect their Google Calendar where they schedule site assignments, so the system can automatically pull each worker's daily schedule.

**Why this priority**: This enables the core value proposition—automated data aggregation from external sources. Without a data source, admins would have no content to send to workers. Google Calendar is chosen as the primary integration because it's widely used and demonstrates the plugin architecture.

**Independent Test**: Can be fully tested by an admin initiating OAuth connection to Google Calendar, granting permissions, verifying the connection is saved, and confirming the system can fetch calendar events. Delivers value by automating schedule retrieval instead of manual entry.

**Acceptance Scenarios**:

1. **Given** an admin is on the integrations page, **When** they click "Connect Google Calendar", **Then** they are redirected to Google OAuth consent screen
2. **Given** an admin is on Google OAuth screen, **When** they grant calendar read permissions, **Then** they are redirected back with an authorization code
3. **Given** the system receives an OAuth code, **When** it exchanges the code for tokens, **Then** the Google Calendar connection is saved with encrypted tokens for the organization
4. **Given** a Google Calendar is connected, **When** the system fetches events for a specific date, **Then** it retrieves calendar events using the stored OAuth tokens
5. **Given** a calendar connection exists, **When** an admin views the integrations page, **Then** they see the connection status as "Active" with last sync time
6. **Given** OAuth tokens expire, **When** the system attempts to fetch events, **Then** it automatically refreshes the tokens using the refresh token

---

### User Story 3 - Admin Sends Dashboard Link via SMS (Priority: P3)

A healthcare agency admin needs to send today's patient visit schedule to each carer via SMS, so carers can view their assignments on their phones without installing an app.

**Why this priority**: This is the delivery mechanism that makes the dashboard accessible to workers. It depends on having workers (P1) and data sources (P2) configured first. This completes the core admin-to-worker flow.

**Independent Test**: Can be fully tested by an admin selecting a worker, customizing the SMS message, sending the link, and verifying SMS delivery logs. Delivers value by enabling instant mobile access to personalized dashboards.

**Acceptance Scenarios**:

1. **Given** an admin is viewing a worker's details, **When** they click "Send Dashboard Link", **Then** they see an SMS composition interface with a default message
2. **Given** an admin is composing an SMS, **When** they customize the message text, **Then** the preview shows the personalized message with the dashboard link placeholder
3. **Given** an admin confirms the SMS, **When** they click "Send", **Then** the system generates a secure tokenized link with configurable expiry (1-24 hours)
4. **Given** a tokenized link is generated, **When** the system sends the SMS via MobileMessage.au API, **Then** the SMS is delivered to the worker's phone with the full message and link
5. **Given** an SMS is sent, **When** the admin views SMS logs, **Then** they see the delivery status (sent, delivered, failed) with timestamp and message content
6. **Given** an admin sends bulk SMS to multiple workers, **When** they select multiple workers and send, **Then** each worker receives a unique tokenized link for their personalized dashboard

---

### User Story 4 - Worker Views Dashboard via SMS Link (Priority: P4)

A delivery driver receives an SMS with a link, opens it on their phone, and immediately sees their daily delivery routes and tasks without needing to log in or install anything.

**Why this priority**: This is the worker-facing experience that validates the entire platform value proposition. It depends on all previous stories (P1-P3) being complete. This is the "magic moment" where workers experience frictionless access to their personalized work information.

**Independent Test**: Can be fully tested by opening a tokenized SMS link on a mobile device, verifying token validation, viewing the personalized dashboard with schedule/tasks, and confirming the mobile-optimized UI. Delivers the core end-user value of instant work visibility.

**Acceptance Scenarios**:

1. **Given** a worker receives an SMS link, **When** they tap the link on their phone, **Then** they are taken to a mobile-optimized dashboard page
2. **Given** a worker opens a dashboard link, **When** the system validates the token, **Then** it verifies the token is not expired and belongs to a valid worker
3. **Given** a valid token, **When** the dashboard loads, **Then** it displays today's schedule with time, location, and task details from the connected calendar
4. **Given** a worker has no schedule for today, **When** they view the dashboard, **Then** they see a friendly "No tasks scheduled for today" message
5. **Given** a worker views their dashboard, **When** they scroll through the content, **Then** the UI is fully responsive and optimized for mobile screens (no horizontal scrolling, readable text)
6. **Given** a worker's dashboard is open, **When** they refresh the page, **Then** the token is re-validated and fresh data is fetched from the data source
7. **Given** a worker tries to access a dashboard, **When** the token is expired, **Then** they see a clear error message: "This link has expired. Please contact your manager for a new link."
8. **Given** a worker tries to access a dashboard, **When** the token is invalid or tampered with, **Then** they see a security error message and the attempt is logged

---

### User Story 5 - Admin Monitors SMS Delivery and Worker Access (Priority: P5)

A cleaning company manager needs to verify that all cleaners received their daily schedules and see who has viewed their dashboard, so they can follow up with anyone who might have missed the message.

**Why this priority**: This provides operational visibility and helps admins ensure their team is informed. It's lower priority because the core send/receive flow (P3-P4) must work first, but it's essential for production use to track delivery success and worker engagement.

**Independent Test**: Can be fully tested by sending SMS to multiple workers, viewing delivery logs with status indicators, checking dashboard access logs, and filtering/searching logs by date or worker. Delivers value through operational transparency and accountability.

**Acceptance Scenarios**:

1. **Given** an admin is on the SMS logs page, **When** they view recent sends, **Then** they see a list of all SMS messages with worker name, phone number, timestamp, and delivery status
2. **Given** an SMS was successfully delivered, **When** the admin views the log entry, **Then** the status shows "Delivered" with delivery timestamp
3. **Given** an SMS failed to deliver, **When** the admin views the log entry, **Then** the status shows "Failed" with error reason (invalid number, carrier rejection, etc.)
4. **Given** a worker opened their dashboard link, **When** the admin views access logs, **Then** they see the worker name, access timestamp, and token expiry time
5. **Given** an admin needs to find specific logs, **When** they filter by date range or search by worker name, **Then** the logs are filtered accordingly
6. **Given** an admin sees a failed delivery, **When** they click "Resend", **Then** a new SMS with a fresh token is generated and sent to the worker

---

### Edge Cases

- **Expired Token Access**: What happens when a worker tries to access a dashboard link after the token has expired (1-24 hours)? System must display a user-friendly error message explaining the link is expired and instructing them to request a new one from their manager.

- **Invalid Phone Number**: How does the system handle SMS sending when a worker's phone number is invalid or incorrectly formatted? System must validate phone numbers before sending, show clear error to admin, and log the failure with specific reason.

- **No Calendar Events**: What happens when a worker's dashboard is accessed but the connected calendar has no events for today? System must display a clean empty state message like "No tasks scheduled for today" rather than showing errors or blank screens.

- **OAuth Token Expiration**: How does the system handle fetching calendar data when OAuth tokens have expired? System must automatically attempt token refresh using the refresh token, and if that fails, notify the admin to reconnect the calendar.

- **Concurrent SMS Sends**: What happens when an admin sends dashboard links to 50+ workers simultaneously? System must handle bulk sends gracefully, potentially queuing requests to avoid rate limits, and provide progress feedback to the admin.

- **Token Tampering**: How does the system respond when someone modifies a dashboard link token in the URL? System must detect invalid tokens, reject access, log the security event, and display a generic error without exposing system details.

- **Mobile Data Connection Loss**: What happens when a worker opens their dashboard but loses mobile data connection while viewing? Dashboard should display cached content if available, or show a clear "connection lost" message with retry option.

- **Organization Deletion**: What happens to workers, SMS logs, and active tokens when an organization is deleted? System must cascade delete all related data while respecting data retention policies, and invalidate all active tokens immediately.

- **Duplicate Worker Phone Numbers**: How does the system handle multiple workers in the same organization with the same phone number? System should allow this (e.g., shared work phones) but warn the admin that multiple workers will receive the same link, each with their own personalized dashboard.

- **Calendar Connection Failure**: What happens when the Google Calendar API is unavailable or returns errors during dashboard load? System must gracefully handle API failures, display a clear error message to the worker, and log the incident for admin review.

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication & Authorization

- **FR-001**: System MUST provide email/password authentication for admin users with secure password hashing
- **FR-002**: System MUST enforce organization-level tenant isolation so admins can only access their own organization's data
- **FR-003**: System MUST generate secure, time-limited tokens (1-24 hours configurable expiry) for worker dashboard access
- **FR-004**: System MUST validate dashboard tokens on every request and reject expired or invalid tokens
- **FR-005**: System MUST NOT require workers to create accounts or log in to view their dashboards

#### Organization & Worker Management

- **FR-006**: System MUST allow admins to create and configure their organization with name and basic settings
- **FR-007**: System MUST allow admins to add workers with name and phone number (Australian format: +61 or 04xx xxx xxx)
- **FR-008**: System MUST allow admins to edit worker details (name, phone) and delete workers
- **FR-009**: System MUST display a list of all workers belonging to the admin's organization
- **FR-010**: System MUST validate phone numbers before saving and format them to E.164 standard (+61xxxxxxxxx)

#### Data Source Integration

- **FR-011**: System MUST support connecting Google Calendar as a data source via OAuth 2.0
- **FR-012**: System MUST securely store OAuth tokens (access token, refresh token) with encryption at rest
- **FR-013**: System MUST automatically refresh expired OAuth tokens using the refresh token
- **FR-014**: System MUST fetch calendar events for a specific worker and date from the connected Google Calendar
- **FR-015**: System MUST implement a plugin/adapter architecture to support future data source integrations without core system changes
- **FR-016**: System MUST display connection status (Active, Disconnected, Error) for each configured data source

#### SMS Delivery

- **FR-017**: System MUST send SMS messages via MobileMessage.au API with Basic Authentication
- **FR-018**: System MUST allow admins to customize the SMS message text while automatically including the dashboard link
- **FR-019**: System MUST generate unique tokenized dashboard URLs for each worker (format: `https://app.cleanconnect.com/dashboard/{token}`)
- **FR-020**: System MUST log all SMS sends with worker ID, phone number, message content, timestamp, and delivery status
- **FR-021**: System MUST handle SMS delivery failures gracefully and display error reasons to admins
- **FR-022**: System MUST support sending dashboard links to multiple workers in a single bulk operation
- **FR-023**: System MUST allow admins to configure token expiry time (1-24 hours) when sending SMS

#### Worker Dashboard

- **FR-024**: System MUST display a mobile-optimized dashboard when a worker accesses a valid tokenized link
- **FR-025**: System MUST fetch and display today's schedule/tasks from the connected data source for the specific worker
- **FR-026**: System MUST display schedule items with time, location/description, and any relevant details
- **FR-027**: System MUST show a user-friendly empty state when no schedule items exist for today
- **FR-028**: System MUST display clear error messages for expired tokens, invalid tokens, and data fetch failures
- **FR-029**: System MUST ensure the dashboard UI is fully responsive with no horizontal scrolling on mobile devices
- **FR-030**: System MUST refresh dashboard data when the worker manually refreshes the page (if token still valid)

#### Logging & Monitoring

- **FR-031**: System MUST log all SMS delivery attempts with status (sent, delivered, failed) and timestamps
- **FR-032**: System MUST log all dashboard access attempts with worker ID, timestamp, and token validation result
- **FR-033**: System MUST log all security events (invalid tokens, token tampering attempts) for audit purposes
- **FR-034**: System MUST provide admins with a view of SMS delivery logs filterable by date and worker
- **FR-035**: System MUST provide admins with a view of dashboard access logs showing who viewed their dashboard and when
- **FR-036**: System MUST NEVER log sensitive data (OAuth tokens, full phone numbers in plaintext) in application logs

#### Security & Privacy

- **FR-037**: System MUST enforce HTTPS for all connections (admin dashboard, worker dashboard, API calls)
- **FR-038**: System MUST implement Row Level Security (RLS) in the database to enforce tenant isolation at the data layer
- **FR-039**: System MUST encrypt OAuth tokens and sensitive credentials at rest in the database
- **FR-040**: System MUST validate and sanitize all user inputs to prevent injection attacks
- **FR-041**: System MUST implement rate limiting on SMS sending endpoints to prevent abuse (e.g., 100 SMS per organization per hour)
- **FR-042**: System MUST invalidate all active tokens when a worker is deleted from the organization
- **FR-043**: System MUST implement CORS policies to restrict API access to authorized domains only

#### Data Management

- **FR-044**: System MUST associate all workers, SMS logs, and tokens with a specific organization ID for tenant isolation
- **FR-045**: System MUST cascade delete all related data (workers, logs, tokens) when an organization is deleted
- **FR-046**: System MUST store timestamps in UTC and display them in the admin's local timezone
- **FR-047**: System MUST handle duplicate phone numbers within an organization (allow but warn admin)

### Key Entities

- **Organization**: Represents a tenant in the multi-tenant system. Contains organization name, settings, subscription status, and creation timestamp. Each organization is completely isolated from others.

- **Admin User**: Represents an administrator who manages an organization. Contains email, hashed password, role, and organization association. Admins can only access data within their organization.

- **Worker**: Represents a frontline worker who receives dashboard links. Contains name, phone number (E.164 format), organization association, and creation timestamp. Workers do not have login credentials.

- **Data Source Connection**: Represents an external integration (e.g., Google Calendar). Contains connection type, OAuth tokens (encrypted), connection status, last sync timestamp, and organization association. Supports the plugin architecture for extensibility.

- **Dashboard Token**: Represents a time-limited access token for worker dashboards. Contains token string (hashed), worker ID, organization ID, expiry timestamp, and creation timestamp. Tokens are single-use or time-limited for security.

- **SMS Log**: Represents a record of SMS delivery. Contains worker ID, organization ID, phone number, message content, delivery status (sent/delivered/failed), error reason (if failed), and timestamp. Used for audit and troubleshooting.

- **Dashboard Access Log**: Represents a record of worker dashboard access. Contains worker ID, organization ID, token used, access timestamp, and validation result. Used for monitoring worker engagement.

- **Schedule Item**: Represents a task or event from a data source. Contains title, description, start time, end time, location, data source type, and raw data from the external system. This is fetched dynamically, not stored permanently.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can complete organization setup and add their first worker in under 3 minutes from signup
- **SC-002**: Admins can connect Google Calendar via OAuth and successfully fetch calendar events in under 2 minutes
- **SC-003**: Workers can access their personalized dashboard within 5 seconds of tapping the SMS link (on 4G connection)
- **SC-004**: 95% of SMS messages are successfully delivered within 30 seconds of admin clicking "Send"
- **SC-005**: Worker dashboard displays correctly on mobile devices (iOS Safari, Android Chrome) with no horizontal scrolling or layout issues
- **SC-006**: 90% of workers successfully view their dashboard on first attempt without encountering errors
- **SC-007**: System maintains 99% uptime during business hours (6 AM - 8 PM local time)
- **SC-008**: Dashboard token validation completes in under 100ms to ensure fast page loads
- **SC-009**: Admins can view SMS delivery logs and identify failed sends within 1 minute of sending
- **SC-010**: System enforces complete tenant isolation with zero data leakage between organizations (verified through security testing)
- **SC-011**: OAuth token refresh succeeds automatically 99% of the time without requiring admin re-authentication
- **SC-012**: Workers see clear, actionable error messages (not technical errors) when links expire or fail to load
