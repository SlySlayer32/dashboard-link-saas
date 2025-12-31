---
trigger: model_decision
description: Apply when making architectural decisions, implementing features, or understanding system requirements. Use for business logic clarification, technical architecture guidance, API endpoint decisions, plugin system implementation, security requirements, database schema questions, technology stack choices, deployment considerations, and testing strategies. Essential for maintaining consistency with project's multi-tenant SaaS architecture and mobile-first SMS dashboard delivery system.
---

## Project Identity

**Name**: Dashboard Link SaaS Platform  
**Type**: Multi-tenant B2B SaaS application  
**Primary Purpose**: Deliver personalized daily dashboards to workers via SMS links  
**Target Industries**: Cleaning companies, construction firms, healthcare agencies, delivery services, educational institutions  

## Business Requirements

### Core Business Logic
- **Multi-tenant Architecture**: Complete data isolation between organizations using Row Level Security (RLS)
- **SMS Dashboard Delivery**: Workers receive SMS links to access their personalized dashboards
- **Token-Based Security**: Time-limited, secure tokens (1hr-24hr configurable) for dashboard access
- **Mobile-First Design**: Worker dashboards optimized for mobile phone viewing
- **Plugin System**: Extensible adapters for pulling data from external systems

### Business Rules
1. **Security Requirement**: All dashboard links must be tokenized with configurable expiry times
2. **Data Privacy**: Workers only see their own data; admins see organization-wide data
3. **Mobile Optimization**: Worker experience must be flawless on mobile devices
4. **Plugin Flexibility**: Support both PULL (fetch) and PUSH (webhook) data sources
5. **SMS Tracking**: Complete audit trail of all SMS deliveries and status
6. **Real-time Updates**: Dashboard data should reflect changes in external systems

### Success Metrics
- SMS delivery rate > 95%
- Dashboard load time < 2 seconds
- Mobile usability score > 90%
- Plugin connection success rate > 98%

## Technical Architecture

### System Components

#### Frontend Applications
1. **Admin Portal** (`apps/admin`)
   - Port: 5173
   - Purpose: Organization management interface
   - Tech Stack: Vite + React 18 + TanStack Query + Tailwind CSS + Zustand
   - Key Features: Worker CRUD, plugin configuration, SMS link generation, organization settings

2. **Worker Dashboard** (`apps/worker`)
   - Port: 5174
   - Purpose: Mobile-optimized dashboard view for workers
   - Tech Stack: Vite + React 18 + TanStack Query + Tailwind CSS
   - Key Features: Token-based access, schedule display, task management, mobile UI

#### Backend API (`apps/api`)
- Port: 3000
- Framework: Hono.js (chosen for 5x smaller memory footprint and fastest cold starts)
- Runtime: Node.js (edge-compatible)
- Purpose: RESTful API for all backend operations

#### Shared Packages
- `@dashboard-link/shared`: Common types and utilities
- `@dashboard-link/plugins`: Plugin adapter system
- `@dashboard-link/ui`: Shared React components
- `@dashboard-link/database`: Database schema and migrations

### Database Architecture

#### Core Tables
- **organizations**: Multi-tenant root entity
- **admins**: Admin users linked to organizations
- **workers**: Non-admin recipients of dashboards
- **worker_tokens**: Secure tokens for SMS links
- **dashboards**: Worker dashboard configurations
- **dashboard_widgets**: Individual dashboard components
- **plugin_configs**: External system configurations
- **manual_schedule_items**: Manual plugin schedule data
- **manual_task_items**: Manual plugin task data
- **sms_logs**: SMS delivery audit trail

#### Security Implementation
- Row Level Security (RLS) enabled on all tables
- Helper function: `get_user_organization_id()` for tenant isolation
- Complete data separation between organizations
- Service role key for public token validation

### Plugin System Architecture

#### Plugin Interface
```typescript
interface PluginAdapter {
  id: string;
  name: string;
  description: string;
  version: string;
  
  getTodaySchedule(workerId: string, config: any): Promise<ScheduleItem[]>;
  getTodayTasks(workerId: string, config: any): Promise<TaskItem[]>;
  validateConfig(config: any): Promise<boolean>;
  handleWebhook?(payload: any, config: any): Promise<void>;
}
```

#### Built-in Plugins
1. **Manual Adapter**: Direct data entry through admin interface
2. **Google Calendar Adapter**: Pull events from Google Calendar
3. **Airtable Adapter**: Pull from custom Airtable bases
4. **Notion Adapter**: Pull from Notion databases

#### Plugin Registry
- Centralized registration system
- Runtime plugin discovery
- Graceful error handling for plugin failures
- Parallel plugin execution for performance

## API Endpoints

### Authentication Routes (`/auth`)
- `POST /auth/login`: Admin authentication
- `POST /auth/signup`: New organization registration
- `POST /auth/refresh`: JWT token refresh
- `POST /auth/logout`: Session termination
- `GET /auth/me`: Current user information

### Worker Management (`/workers`)
- `GET /workers`: List workers (paginated, searchable)
- `POST /workers`: Create new worker
- `GET /workers/:id`: Get worker details
- `PUT /workers/:id`: Update worker information
- `DELETE /workers/:id`: Deactivate worker

### Organization Management (`/organizations`)
- `GET /organizations`: Get organization details
- `PUT /organizations`: Update organization settings
- `GET /organizations/settings`: Get configuration

### SMS Operations (`/sms`)
- `POST /sms/send-dashboard-link`: Send dashboard link to worker
- `POST /sms/send-bulk`: Send to multiple workers
- `GET /sms/logs`: SMS delivery history
- `GET /sms/logs/:id`: Specific SMS details

### Dashboard Access (`/dashboard`, `/dashboards`)
- `GET /dashboard/:token`: Public dashboard access (worker view)
- `GET /dashboards/:workerId`: Admin dashboard preview
- `POST /dashboards`: Create dashboard configuration
- `PUT /dashboards/:id`: Update dashboard settings

### Plugin Management (`/plugins`)
- `GET /plugins`: List available plugins
- `POST /plugins/:pluginId/config`: Configure plugin
- `GET /plugins/:pluginId/status`: Connection status
- `POST /plugins/:pluginId/test`: Test plugin connection

### Webhook Handling (`/webhooks`)
- `POST /webhooks/:pluginId`: Receive external system updates
- Plugin-specific webhook processing
- Real-time data synchronization

### Manual Data Entry (no prefix)
- `POST /schedule-items`: Create manual schedule entries
- `PUT /schedule-items/:id`: Update schedule items
- `POST /task-items`: Create manual task entries
- `PUT /task-items/:id`: Update task items

## Technology Stack Decisions

### Fixed Technology Choices
- **Frontend Framework**: Vite + React 18 (non-negotiable)
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Backend Framework**: Hono.js (chosen over Express/Fastify)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **SMS Provider**: MobileMessage.com.au (Australia-specific)
- **Monorepo Tool**: Turborepo (chosen over Nx)
- **Package Manager**: pnpm

### Rationale for Key Decisions
- **Hono.js**: 5x smaller memory footprint, fastest cold starts, TypeScript-first
- **Supabase**: All-in-one solution with built-in RLS, auth, and real-time capabilities
- **MobileMessage**: 2¢/SMS intro rate, no monthly fees, Australian provider
- **Turborepo**: Simpler configuration, faster setup for small-medium teams

## Development Workflow

### Environment Setup
1. Node.js 18+, pnpm 9+
2. Supabase account (free tier sufficient for development)
3. MobileMessage.com.au account for SMS functionality
4. Environment variables configuration via `.env`

### Development Commands
- `pnpm dev`: Start all applications in development mode
- `pnpm build`: Build all applications for production
- `pnpm test`: Run test suites across all packages
- `pnpm lint`: Code quality checks
- `pnpm db:migrate`: Apply database migrations
- `pnpm db:seed`: Seed development data

### Code Organization Principles
- Multi-package monorepo structure
- Shared types and utilities in packages
- Plugin-based architecture for extensibility
- Mobile-first development approach
- Comprehensive error handling and logging

## Security Considerations

### Authentication & Authorization
- Admin authentication via Supabase Auth (email/password)
- Worker access via tokenized URLs (no login required)
- JWT tokens for admin sessions
- Service role key for public dashboard access

### Data Security
- All tables have RLS policies enabled
- Complete tenant isolation
- Encrypted API key storage for plugins
- HTTPS-only in production
- Rate limiting on SMS endpoints

### Token Security
- 256-bit entropy tokens using `crypto.randomBytes(32)`
- Configurable expiry times (1hr-24hr)
- Single-use or multi-use options
- Automatic cleanup of expired tokens

## Performance Requirements

### Response Time Targets
- API responses: < 200ms (95th percentile)
- Dashboard load: < 2 seconds
- SMS delivery: < 30 seconds
- Plugin data fetch: < 5 seconds per plugin

### Scalability Considerations
- Stateless API design for horizontal scaling
- Database connection pooling via Supabase
- Client-side caching with TanStack Query
- Plugin parallel execution for performance
- Edge deployment capability

### Monitoring Requirements
- API response time tracking
- SMS delivery rate monitoring
- Plugin connection success rates
- Token validation performance
- Database query optimization

## Integration Points

### External Systems
1. **MobileMessage.com.au**: SMS delivery via REST API
2. **Google Calendar**: OAuth 2.0 integration
3. **Airtable**: API key authentication
4. **Notion**: Integration secret authentication

### Webhook Support
- Plugin-specific webhook endpoints
- Real-time data synchronization
- Webhook authentication and validation
- Error handling for failed webhooks

## Deployment Architecture

### Development Environment
- Local development with `pnpm dev`
- Supabase local development options
- Environment-specific configurations

### Production Deployment
- Frontend: Vercel (recommended)
- Backend: Vercel Edge Functions or Cloudflare Workers
- Database: Supabase (managed PostgreSQL)
- SMS: MobileMessage.com.au production API

### Environment Variables Required
```
# Application
APP_URL=https://your-domain.com
API_URL=https://api.your-domain.com

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# SMS Provider
MOBILEMESSAGE_USERNAME=your-username
MOBILEMESSAGE_PASSWORD=your-password
MOBILEMESSAGE_SENDER_ID=YourBrand

# Plugin Keys (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
AIRTABLE_API_KEY=your-api-key
NOTION_INTEGRATION_SECRET=your-integration-secret
```

## Testing Strategy

### Mocking Strategy (Current Development Stage)

#### What to Mock
- **SMS Provider (MobileMessage.com.au)**: 
  - Mock all SMS sending functionality during development
  - Use test mode that logs SMS content instead of sending
  - Mock delivery status callbacks and webhooks
  - Simulate success/failure scenarios for testing error handling
  - Mock phone number validation and formatting


#### What NOT to Mock
- **Database Operations**: Use real Supabase instance (development tier)
- **Authentication Flow**: Use real Supabase Auth for testing login/signup
- **Token Generation/Validation**: Use real crypto functions for security testing
- **Plugin Adapters**: Test real adapter logic with mocked external API calls
- **API Routes**: Test real route handlers and middleware
- **Data Validation**: Use real Zod schemas and validation logic

#### Mocking Implementation Guidelines
- Create mock service classes that implement same interfaces as real services
- Use environment variables to switch between real and mock services
- Ensure mock responses match real API response formats exactly
- Include edge cases and error scenarios in mock implementations
- Log mock interactions for debugging during development

### Unit Testing
- API route testing with Vitest
- Plugin adapter testing
- Utility function testing
- Component testing for UI elements

### Integration Testing
- End-to-end API workflows
- Plugin connection testing
- SMS delivery testing (test mode)
- Database migration testing

### Performance Testing
- Load testing for API endpoints
- Mobile responsiveness testing
- Plugin performance benchmarking
- Database query optimization

## Common Implementation Patterns

### Error Handling
- Structured error responses with error codes
- Graceful degradation for plugin failures
- Comprehensive logging for debugging
- User-friendly error messages

### Data Validation
- Zod schemas for API validation
- Phone number formatting (E.164)
- Email validation standards
- Plugin configuration validation

### Caching Strategy
- Client-side caching with TanStack Query
- API response caching for static data
- Plugin result caching (future: Redis)
- Database query optimization

## Future Enhancement Areas

### Planned Features
1. Real-time updates via WebSocket/SSE
2. Advanced analytics and reporting
3. Mobile apps (iOS/Android native)
4. White-labeling capabilities
5. Advanced plugin marketplace

### Scalability Improvements
1. Redis caching layer
2. Dedicated database instances
3. CDN integration for static assets
4. Advanced monitoring and alerting

### Plugin Extensions
1. Microsoft Outlook Calendar
2. Salesforce integration
3. Custom API connector builder
4. Webhook automation rules

### Technical Requirements
- Mobile-first user experience
- High SMS delivery reliability
- Fast dashboard loading times
- Secure token-based access
- Flexible plugin system

### Business Requirements
- Easy setup for non-technical users
- Cost-effective SMS delivery
- Reliable data synchronization
- Comprehensive audit trails
- Scalable multi-tenant architecture