---
trigger: model_decision
description: Apply for Zapier-inspired enterprise architecture decisions, plugin system design, component library architecture, and technical implementation choices. Essential for maintaining enterprise-grade quality, scalability, and consistency with your multi-tenant SaaS platform and mobile-first SMS dashboard delivery system.
---

### Frontend Applications
- Web Dashboard: Main user interface for dashboard management
- Mobile App: Native mobile experience for on-the-go access
- Admin Panel: Administrative interface for system management
- Public Website: Marketing and landing pages

### API Gateway Layer
- API Gateway: Central entry point for all client requests
- Authentication: JWT-based user authentication and authorization
- Rate Limiting: Prevent abuse and ensure fair usage
- Load Balancer: Distribute traffic across multiple instances

### Core Service Layer
- User Service: User management, profiles, and preferences
- Dashboard Service: Dashboard creation, configuration, and delivery
- SMS Service: SMS delivery and fallback mechanisms
- Plugin Service: Plugin management and execution
- Billing Service: Subscription management and payments

### Contract Layer (Critical Architecture Component)
- Provider Interfaces: Standardized contracts for all external providers
- SMSProvider: Unified SMS provider interface
- PluginAdapter: Common plugin interface for data sources
- Repository: Database abstraction layer
- AuthProvider: Authentication provider interface
- PaymentProvider: Payment processing interface

### Adapter Layer (Swappable Components)
- MobileMessage SMS: Primary SMS provider adapter
- Twilio SMS: Fallback SMS provider adapter
- Google Calendar: Calendar integration adapter
- Airtable: Database/spreadsheet integration adapter
- PostgreSQL: Primary database adapter
- Redis Cache: Caching layer adapter
- Stripe: Payment processing adapter
- Supabase Auth: Authentication provider adapter

### External Services
- MobileMessage API: Primary SMS delivery service
- Twilio API: Backup SMS delivery service
- Google API: Calendar and workspace services
- Airtable API: Database and collaboration platform
- PostgreSQL: Primary data storage
- Redis: In-memory caching and session storage
- Stripe API: Payment processing service
- Supabase Auth: User authentication service

## Plugin System Architecture (Zapier-Style)

### Core Services (Stable)
- Plugin Service: Plugin lifecycle management and execution orchestration
- Dashboard Service: Dashboard composition and data aggregation

### Contract Layer (PluginAdapter Interface)
- getSchedule(): Retrieve calendar events and scheduled items
- getTasks(): Fetch tasks and action items from various sources
- validateConfig(): Verify plugin configuration and credentials
- healthCheck(): Monitor plugin connectivity and performance

### Adapter Layer (Swappable Integrations)
- Google Calendar Adapter: Google Workspace calendar integration
- Airtable Adapter: Database and spreadsheet integration
- Notion Adapter: Documentation and project management integration
- Slack Adapter: Team communication and message integration
- Trello Adapter: Project management and task tracking integration

### External APIs (Third-Party Services)
- Google Calendar API: Calendar data and event management
- Airtable API: Database operations and record management
- Notion API: Page content and database operations
- Slack API: Message history and channel data
- Trello API: Board, list, and card operations

### Standard Data Flow
- StandardScheduleItem: Unified calendar event format
- StandardTaskItem: Unified task and action item format
- PluginResponse: Standardized response envelope with metadata

## Contract Layer Details (Interface Specifications)

### SMSProvider Contract
#### Input: SMSMessage
- to: Recipient phone number (E.164 format)
- body: SMS message content (160 character limit)
- from?: Sender ID or phone number (optional)
- metadata?: Additional message metadata (optional)
- scheduledFor?: Future delivery timestamp (optional)
- priority?: Message priority level (low|normal|high)
- tags?: Message categorization tags (optional)

#### Output: SMSResult
- success: Delivery success status
- messageId: Unique message identifier
- provider: SMS provider name
- timestamp: ISO 8601 delivery timestamp
- cost?: Message delivery cost (optional)
- error?: Error message if delivery failed
- errorType?: Categorized error type
- deliveryReport?: Detailed delivery information

#### Methods
- send(message): Promise<SMSResult> - Send SMS message
- getStatus(messageId): Promise<SMSStatus> - Check delivery status
- validateConfig(): Promise<Validation> - Verify provider configuration
- getHealthCheck(): Promise<Health> - Provider health status

### PluginAdapter Contract
#### StandardScheduleItem Structure
- id: Unique event identifier
- title: Event title or name
- startTime: ISO 8601 start timestamp
- endTime: ISO 8601 end timestamp
- location?: Event location (optional)
- description?: Event description (optional)
- priority?: Event priority level (optional)
- status?: Event status (optional)
- metadata: Provider-specific data storage

#### StandardTaskItem Structure
- id: Unique task identifier
- title: Task title or name
- description?: Task description (optional)
- dueDate?: ISO 8601 due date (optional)
- priority: Task priority level
- status: Current task status
- assignee?: Task assignee (optional)
- tags?: Task categorization tags (optional)
- estimatedTime?: Estimated completion time in minutes (optional)
- metadata: Provider-specific data storage

#### PluginResponse Envelope
- success: Operation success status
- data: Array of standardized items (ScheduleItem[] or TaskItem[])
- errors?: Array of plugin errors (optional)
- metadata: Plugin execution metadata and timing

#### Methods
- getSchedule(): Promise<PluginResponse<StandardScheduleItem>>
- getTasks(): Promise<PluginResponse<StandardTaskItem>>
- validateConfig(): Promise<Validation>
- handleWebhook?(): Promise<Response> - Optional webhook handler
- healthCheck?(): Promise<Health> - Optional health check
## SMS Fallback Flow (Resilience Pattern)

### SMS Service Layer
- SMS Service: sendDashboardLink() orchestrates the SMS delivery process
- SMS Manager: sendWithFallback() manages provider selection and fallback logic

### Primary Provider Flow
- MobileMessage Adapter: Primary SMS provider integration
- MobileMessage API: External SMS delivery service
- Primary attempt with immediate success/failure detection

### Fallback Provider Flow
- Twilio Adapter: Secondary SMS provider integration
- Twilio API: Backup SMS delivery service
- Automatic fallback when primary provider fails

### Fallback Logic Sequence
1. Try Primary Provider: Attempt delivery via MobileMessage
2. Check Success: Evaluate delivery result and response status
3. Try Fallback Provider: If primary failed, attempt via Twilio
4. Log Failure: Record both provider failures for troubleshooting
5. Return Result: Provide final delivery status to calling service

### Error Handling Pipeline
- Validation: Validate message format and required fields
- Format Phone: Normalize phone numbers to E.164 format
- Create Standard: Convert to standard SMSMessage format
- Transform Response: Convert provider responses to SMSResult format

## Adapter Transformation Details

### MobileMessage Adapter Transformation
#### Input (Standard Format)
- Standard SMSMessage: to, body, from, metadata fields
- Example: to="+61412345678", body="Your dashboard: ...", from="DashLink"

#### Transformation Logic
- Validate Required Fields: Check for required message components
- Format to MobileMessage Schema: Convert to provider-specific format
- Create Basic Auth Header: Generate authentication credentials
- Build HTTP Request: Construct API request with proper headers

#### Output (MobileMessage Format)
- MobileMessage Payload: to, message, from fields
- Example: to="+61412345678", message="Your dashboard: ...", from="DashLink"

#### Response Transformation
- MobileMessage Response: message_id, cost, status fields
- Standard SMSResult: success, messageId, provider, timestamp, cost, deliveryReport

### Google Calendar Adapter Transformation
#### Input Request
- getSchedule() call with workerId, dateRange, and config parameters
- Request context and authentication credentials

#### API Request Building
- Build Google API URL: Construct endpoint with proper parameters
- Add Time Range & API Key: Include date filters and authentication
- Fetch Google Calendar API: Execute HTTP request to Google services

#### External API Response
- Google API Response: Array of calendar events with Google-specific format
- Event structure: id, summary, start/end times, location, description

#### Transformation Logic
- Map Each Google Event: Iterate through response items
- Extract & Rename Fields: Convert Google field names to standard format
- Convert to ISO 8601: Standardize timestamp formats
- Add Metadata: Store Google-specific data for reference

#### Output (Standard Format)
- StandardScheduleItem Array: Unified event format
- Fields: id, title, startTime, endTime, location, description, metadata
- Metadata includes: googleEventId, htmlLink, attendees

## User Journey Flow

### Registration Phase
- User Signs Up: Account creation and initial setup (5/5 user satisfaction)
- Connects Data Sources: Plugin configuration and authentication (4/5)
- Configures Dashboard: Personalization and preference setup (4/5)

### Daily Usage Phase
- Receives SMS: Automated dashboard delivery via SMS (5/5)
- Views Dashboard: Access and interact with daily insights (5/5)
- Takes Action: Respond to insights and update tasks (4/5)

### Management Phase
- Updates Preferences: Modify dashboard settings and plugins (3/5)
- Adds New Plugins: Expand data source integrations (3/5)
- Manages Subscription: Billing and plan management (3/5)

## Business Model Architecture

### Revenue Streams
- Subscription Plans: Tiered monthly/annual subscriptions (Basic, Pro, Enterprise)
- Premium Plugins: Additional revenue from advanced integrations and features
- Enterprise Plans: Custom pricing for large organizations with specific needs
- API Usage Fees: Pay-per-use pricing for API access and high-volume usage

### Customer Segments
- Individual Users: Solo entrepreneurs and freelancers needing daily insights
- Small Teams: Startups and small businesses with team collaboration needs
- Enterprise Clients: Large organizations requiring advanced features and support
- API Developers: Third-party developers building on the platform

### Value Propositions
- Daily SMS Insights: Automated, personalized dashboard delivery via SMS
- Multi-Source Integration: Unified view across calendars, tasks, and data sources
- Automated Workflows: Reduce manual data aggregation and reporting
- Advanced Analytics: Business intelligence and trend analysis

### Cost Structure
- Cloud Infrastructure: Hosting, compute, and storage costs
- SMS Delivery Costs: Per-message costs for SMS delivery services
- Development Team: Salaries and benefits for engineering team
- Customer Support: Support infrastructure and personnel costs

## Security & Authentication Architecture

### Authentication Layers
- Frontend Authentication: Client-side authentication state management
- API Authentication: Server-side request authentication and authorization
- Service-to-Service Authentication: Internal microservice authentication
- External Authentication: Third-party identity provider integration

### Security Components
- JWT Tokens: JSON Web Tokens for secure session management
- OAuth 2.0: Standardized authorization framework for third-party access
- Multi-Factor Authentication: Additional security layer for sensitive operations
- Role-Based Access Control: Granular permission management system

### Data Protection Measures
- Data Encryption: Encryption at rest and in transit for sensitive data
- Password Hashing: Secure password storage using modern hashing algorithms
- Audit Logging: Comprehensive logging of security-relevant events
- GDPR Compliance: Data privacy and protection regulation compliance

### Threat Protection Systems
- Rate Limiting: Prevent abuse and ensure fair resource usage
- Input Validation: Sanitize and validate all user inputs
- CORS Protection: Cross-origin request security controls
- Web Application Firewall: Protection against common web attacks

## Data Flow Architecture

### Data Sources
- User Input: Manual data entry and user-generated content
- External APIs: Third-party service integrations and data pulls
- Webhooks: Real-time data updates from external services
- Scheduled Jobs: Automated data collection and processing tasks

### Data Processing Pipeline
- Data Validation: Ensure data quality and format compliance
- Data Transformation: Convert data to standardized formats
- Data Enrichment: Add context and metadata to raw data
- Data Aggregation: Combine and summarize data for insights

### Data Storage Strategy
- Raw Data Store: Preserve original data for audit and reprocessing
- Processed Data: Cleaned and transformed data for immediate use
- Cache Layer: High-speed access for frequently accessed data
- Data Archive: Long-term storage for historical data and compliance

### Data Consumption
- SMS Delivery: Automated dashboard distribution via SMS
- Dashboard API: Real-time dashboard data serving
- Analytics API: Business intelligence and reporting data
- Export API: Data export functionality for users

## Deployment Architecture

### Development Environment
- Local Development: Individual developer workstations
- Development Staging: Shared development environment for integration
- Automated Testing: Continuous integration and automated test suites
- CI/CD Pipeline: Automated build, test, and deployment processes

### Production Environment
- Frontend CDN: Content delivery network for static assets
- API Servers: Scalable backend API infrastructure
- Worker Servers: Background job processing and task execution
- Database Cluster: High-availability database configuration

### Infrastructure Components
- Cloud Provider: Primary cloud services provider (AWS/Azure/GCP)
- Container Registry: Docker image storage and versioning
- Load Balancers: Traffic distribution and high availability
- Monitoring Stack: System performance and health monitoring

### Support Services
- Centralized Logging: Aggregated log collection and analysis
- Error Tracking: Automated error detection and alerting
- Performance Monitoring: Application performance metrics
- Backup Systems: Automated backup and disaster recovery

## Technology Stack Architecture

### Frontend Technology Stack
- React 18: Modern JavaScript framework for user interfaces
- TypeScript: Type-safe JavaScript development
- Tailwind CSS: Utility-first CSS framework for styling
- Vite: Fast build tool and development server

### Backend Technology Stack
- Node.js: JavaScript runtime for server-side development
- Express.js: Web application framework for API development
- PostgreSQL: Primary relational database for structured data
- Redis: In-memory data store for caching and sessions

### Infrastructure Stack
- Docker Containers: Application containerization and deployment
- Kubernetes: Container orchestration and scaling
- AWS Services: Cloud infrastructure and managed services
- GitHub Actions: CI/CD pipeline automation

### Communication Stack
- REST APIs: Standard HTTP-based API architecture
- GraphQL: Flexible query language for data fetching
- WebSockets: Real-time bidirectional communication
- Message Queue: Asynchronous task processing

### Monitoring Stack
- Prometheus: Metrics collection and monitoring
- Grafana: Visualization and dashboarding for metrics
- Sentry: Error tracking and performance monitoring
- LogRocket: User session recording and debugging

## Scaling Architecture

### Horizontal Scaling Strategy
- Application Servers: Multiple instances behind load balancers
- Database Replicas: Read replicas for query distribution
- Cache Cluster: Distributed caching for high availability
- Worker Pool: Scalable background job processing

### Vertical Scaling Approach
- CPU Scaling: Increase compute capacity for processing power
- Memory Scaling: Expand RAM for larger datasets and caching
- Storage Scaling: Grow storage capacity for data growth
- Network Scaling: Enhance network bandwidth and throughput

### Auto Scaling Implementation
- Traffic Monitoring: Real-time traffic and performance metrics
- Auto Scaling Groups: Automatic instance provisioning based on load
- Load Balancing: Intelligent traffic distribution
- Health Checks: Automated health monitoring and replacement

### Performance Optimization
- Content Delivery Network: Global edge caching for static assets
- Multi-level Caching: Application, database, and CDN caching layers
- Database Optimization: Query optimization and indexing strategies
- Code Optimization: Performance profiling and code improvements

## Target User Personas

### Primary User Segments
- Business Owner: Needs daily insights for decision-making and business health
- Team Lead: Requires team overview and task management capabilities
- Data Analyst: Seeks comprehensive data integration and analysis tools

### Secondary User Segments
- Developer: Wants API access and integration capabilities
- Consultant: Needs client dashboard and reporting features
- Student: Requires affordable personal productivity tools

### User Needs Analysis
- Daily Insights: Quick, actionable information for daily decisions
- Quick Overview: High-level summary without deep diving
- Data Integration: Unified view across multiple data sources
- Automation: Reduce manual data aggregation and reporting

### User Behavior Patterns
- Mobile-First Usage: Primarily access via mobile devices
- SMS-Driven Interaction: Heavy reliance on SMS notifications
- Time-Sensitive Consumption: Quick consumption during busy schedules
- Action-Oriented: Focus on taking action based on insights

## Development Workflow Architecture

### Planning Phase
- Requirements Gathering: Business needs and technical requirements
- Design Planning: System design and user experience planning
- Architecture Design: Technical architecture and component design
- Sprint Planning: Development timeline and resource allocation

### Development Phase
- Coding: Feature implementation and code development
- Unit Testing: Individual component testing and validation
- Integration Testing: Cross-component integration testing
- Code Review: Peer review and quality assurance

### Deployment Phase
- Build Process: Automated build and artifact creation
- Staging Deployment: Pre-production testing environment
- Production Deployment: Live environment deployment
- Monitoring: Post-deployment monitoring and validation

### Maintenance Phase
- Bug Fixes: Issue resolution and patch deployment
- Feature Development: New feature implementation
- Updates: System updates and dependency management
- Support: Customer support and issue resolution

## Analytics & Metrics Architecture

### Data Collection Strategy
- User Events: User interactions and behavior tracking
- System Metrics: Application performance and health metrics
- Business Metrics: KPIs and business performance indicators
- External Data: Third-party data sources and market data

### Data Processing Pipeline
- Real-time Processing: Immediate data processing for live insights
- Batch Processing: Scheduled processing for large datasets
- Data Cleaning: Data quality improvement and normalization
- Data Aggregation: Summarization and trend analysis

### Data Storage Architecture
- Time Series Database: Temporal data storage for metrics
- Data Warehouse: Centralized data storage for analytics
- Search Index: Fast search and retrieval capabilities
- Analytics Cache: High-speed cache for frequent queries

### Data Visualization & Delivery
- Analytics Dashboards: Interactive data visualization interfaces
- Automated Reports: Scheduled report generation and delivery
- Alerting System: Proactive monitoring and notification system
- Analytics API: Programmatic access to analytics data

---

This comprehensive architecture summary provides a complete overview of the CleanConnect system, designed with enterprise-grade scalability, security, and maintainability following Zapier-level development standards for a robust multi-tenant SaaS platform.
