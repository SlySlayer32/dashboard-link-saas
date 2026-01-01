---
trigger: model_decision
description: Apply for Zapier-inspired enterprise architecture decisions, plugin system design, component library architecture, and technical implementation choices. Essential for maintaining enterprise-grade quality, scalability, and consistency with your multi-tenant SaaS platform and mobile-first SMS dashboard delivery system.
---

## Project Identity

**Name**: Dashboard Link SaaS Platform  
**Type**: Multi-tenant B2B SaaS application  
**Primary Purpose**: Deliver personalized daily dashboards to workers via SMS links  
**Target Industries**: Cleaning companies, construction firms, healthcare agencies, delivery services, educational institutions  
**Architecture Philosophy**: Zapier-inspired enterprise middleware with standardized data contracts and plugin extensibility

## Business Requirements

### Core Business Logic
- **Multi-tenant Architecture**: Complete data isolation between organizations using Row Level Security (RLS)
- **SMS Dashboard Delivery**: Workers receive SMS links to access their personalized dashboards
- **Token-Based Security**: Time-limited, secure tokens (1hr-24hr configurable) for dashboard access
- **Mobile-First Design**: Worker dashboards optimized for mobile phone viewing
- **Zapier-Style Plugin System**: Enterprise middleware architecture with standardized data contracts

### Business Rules
1. **Security Requirement**: All dashboard links must be tokenized with configurable expiry times
2. **Data Privacy**: Workers only see their own data; admins see organization-wide data
3. **Mobile Optimization**: Worker experience must be flawless on mobile devices
4. **Plugin Flexibility**: Support both PULL (fetch) and PUSH (webhook) data sources
5. **SMS Tracking**: Complete audit trail of all SMS deliveries and status
6. **Real-time Updates**: Dashboard data should reflect changes in external systems
7. **Enterprise Quality**: Zapier-level reliability, scalability, and maintainability

### Success Metrics
- SMS delivery rate > 95%
- Dashboard load time < 2 seconds
- Mobile usability score > 90%
- Plugin connection success rate > 98%
- API response time < 200ms (95th percentile)
- System uptime > 99.9%
- Component library consistency > 95%

## Technical Architecture

### System Components

#### Frontend Applications
1. **Admin Portal** (`apps/admin`)
   - Port: 5173
   - Purpose: Organization management interface
   - Tech Stack: Vite + React 18 + TanStack Query + Tailwind CSS + Zustand
   - UI Library: Zapier-inspired component library (Radix UI + CVA + Tailwind)
   - Key Features: Worker CRUD, plugin configuration, SMS link generation, organization settings

2. **Worker Dashboard** (`apps/worker`)
   - Port: 5174
   - Purpose: Mobile-optimized dashboard view for workers
   - Tech Stack: Vite + React 18 + TanStack Query + Tailwind CSS
   - UI Library: Shared component library with mobile-first design
   - Key Features: Token-based access, schedule display, task management, mobile UI

#### Backend API (`apps/api`)
- Port: 3000
- Framework: Hono.js (chosen for 5x smaller memory footprint and fastest cold starts)
- Runtime: Node.js (edge-compatible)
- Purpose: RESTful API for all backend operations
- Architecture: Enterprise middleware with plugin orchestration

#### Shared Packages
- `@dashboard-link/shared`: Common types and utilities with standardized data contracts
- `@dashboard-link/plugins`: Zapier-style plugin adapter system with BasePluginAdapter
- `@dashboard-link/ui`: Enterprise-grade React component library (Card, Badge, Input, Modal, Tabs)
- `@dashboard-link/database`: Database schema and migrations with RLS policies

### Zapier-Style Plugin Architecture

#### Core Plugin Interface
```typescript
// Standardized data contracts (camelCase, ISO 8601)
interface StandardScheduleItem {
  id: string;
  title: string;
  startTime: string;        // ISO 8601 format
  endTime: string;          // ISO 8601 format
  location?: string;
  description?: string;
  source: string;          // Plugin identifier
  metadata?: Record<string, unknown>;
}

interface StandardTaskItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;        // ISO 8601 format
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  source: string;         // Plugin identifier
  metadata?: Record<string, unknown>;
}

// Base adapter following Zapier middleware patterns
abstract class BasePluginAdapter {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract version: string;
  
  // Core data fetching methods
  abstract fetchScheduleItems(config: any): Promise<StandardScheduleItem[]>;
  abstract fetchTaskItems(config: any): Promise<StandardTaskItem[]>;
  
  // Data transformation to standard format
  protected transformScheduleItem(item: any): StandardScheduleItem;
  protected transformTaskItem(item: any): StandardTaskItem;
  
  // Configuration validation
  abstract validateConfig(config: any): Promise<boolean>;
  
  // Error handling and response standardization
  protected createSuccessResponse(data: any): PluginResponse;
  protected createErrorResponse(error: any): PluginResponse;
  
  // Optional webhook handling
  handleWebhook?(payload: any, config: any): Promise<void>;
}
```

#### Plugin Registry System
```typescript
class PluginRegistry {
  private plugins: Map<string, BasePluginAdapter> = new Map();
  
  register(plugin: BasePluginAdapter): void;
  get(id: string): BasePluginAdapter | undefined;
  list(): BasePluginAdapter[];
  getEnabled(): BasePluginAdapter[];
}
```

#### Plugin Manager Service
```typescript
class PluginManagerService {
  // Parallel plugin execution with error isolation
  async getDashboardData(workerId: string): Promise<{
    schedule: StandardScheduleItem[];
    tasks: StandardTaskItem[];
    errors: PluginError[];
  }>;
  
  // Individual plugin operations
  async testPluginConnection(pluginId: string, config: any): Promise<boolean>;
  async getPluginStatus(pluginId: string): Promise<PluginStatus>;
}
```

#### Built-in Enterprise Plugins
1. **Manual Adapter**: Direct data entry through admin interface
2. **Google Calendar Adapter**: OAuth 2.0 integration with event transformation
3. **Airtable Adapter**: API key authentication with custom base support
4. **Notion Adapter**: Integration secret with database property mapping

#### Plugin Development Principles
- **Standardized Data Shapes**: All plugins output `StandardScheduleItem` and `StandardTaskItem`
- **Error Isolation**: Plugin failures don't cascade to core system
- **Parallel Execution**: Performance-optimized concurrent plugin operations
- **Configuration Validation**: Robust validation before plugin activation
- **Comprehensive Testing**: 2,100+ lines of test coverage per plugin
- **Mock External Dependencies**: Reliable testing without external API calls

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
- Encrypted API key storage for plugin configurations

### Enterprise UI Component Library

#### Design Philosophy
- **Zapier-Inspired**: Minimalist, workflow-first design language
- **Accessibility First**: Radix UI primitives for keyboard navigation
- **Variant-Driven**: Class Variance Authority (CVA) for consistent styling
- **Professional Quality**: Enterprise-grade components with comprehensive testing

#### Core Components (Phase 1 Complete)
```typescript
// Primary layout primitive
<Card variant="default|muted|elevated" padding="none|sm|md|lg">
  <CardHeader>
    <CardTitle>Plugin Configuration</CardTitle>
    <CardDescription>Connect your external system</CardDescription>
  </CardHeader>
  <CardContent>
    <Input label="API Key" error="Invalid key" />
    <Badge variant="success">Connected</Badge>
  </CardContent>
</Card>

// Status indicators
<Badge variant="default|primary|success|warning|error|info" size="sm|md|lg">
  Connection Status
</Badge>

// Configuration forms
<Input 
  label="API Key" 
  helperText="Get this from your settings"
  variant="default|error|success"
  size="sm|md|lg"
  required
/>

// Dialogs and confirmations
<Modal open={isOpen} onOpenChange={setIsOpen}>
  <ModalContent>
    <ModalHeader>
      <ModalTitle>Confirm Plugin Deletion</ModalTitle>
      <ModalDescription>This action cannot be undone</ModalDescription>
    </ModalHeader>
    <ModalFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive">Delete</Button>
    </ModalFooter>
  </ModalContent>
</Modal>

// Navigation and steps
<Tabs defaultValue="configure">
  <TabsList>
    <TabsTrigger value="configure">Configure</TabsTrigger>
    <TabsTrigger value="test">Test</TabsTrigger>
    <TabsTrigger value="deploy">Deploy</TabsTrigger>
  </TabsList>
  <TabsContent value="configure">
    <Input label="Webhook URL" />
  </TabsContent>
</Tabs>
```

#### Design Tokens
```typescript
// Zapier-inspired color palette
colors: {
  primary: '#3b82f6',      // Calm blue
  semantic: {
    success: '#10b981',   // Clear green
    warning: '#f59e0b',   // Attention yellow
    error: '#ef4444',      // Clear red
    info: '#06b6d4',       // Cyan
  },
  neutral: {
    50: '#f9fafb',         // Lightest
    900: '#111827',        // Darkest
  }
}

// Consistent spacing scale (8px base)
spacing: {
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  4: '1rem',     // 16px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
}
```

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
- **UI Components**: Custom Zapier-style library (Radix UI + CVA + Tailwind CSS)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Backend Framework**: Hono.js (chosen over Express/Fastify)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **SMS Provider**: MobileMessage.com.au (Australia-specific)
- **Monorepo Tool**: Turborepo (chosen over Nx)
- **Package Manager**: pnpm
- **Component Documentation**: Storybook
- **Icon Library**: Lucide React

### Rationale for Key Decisions
- **Hono.js**: 5x smaller memory footprint, fastest cold starts, TypeScript-first
- **Supabase**: All-in-one solution with built-in RLS, auth, and real-time capabilities
- **MobileMessage**: 2¢/SMS intro rate, no monthly fees, Australian provider
- **Turborepo**: Simpler configuration, faster setup for small-medium teams
- **Radix UI**: Headless primitives for accessibility, following Zapier patterns
- **CVA**: Variant-driven styling for consistent component variations
- **Lucide React**: Professional icon library matching Zapier aesthetic

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
- `pnpm storybook`: Launch component documentation

### Code Organization Principles
- Multi-package monorepo structure
- Shared types and utilities in packages
- Zapier-style plugin architecture for extensibility
- Mobile-first development approach
- Enterprise-grade error handling and logging
- Comprehensive testing for all components and plugins

### Component Development Guidelines
- **Design Tokens First**: Define colors, spacing, typography before components
- **Accessibility Built-in**: Use Radix UI primitives for all interactive elements
- **Variant-Driven**: Use CVA for consistent component variations
- **Storybook Documentation**: Document all component variants and use cases
- **Type Safety**: Full TypeScript coverage with proper prop typing
- **Enterprise Quality**: Follow Zapier-level standards for maintainability

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

### Plugin Security
- API key encryption in database
- Plugin configuration validation
- Webhook authentication and verification
- Error isolation to prevent plugin failures from affecting core system
- Audit logging for all plugin operations

## Performance Requirements

### Response Time Targets
- API responses: < 200ms (95th percentile)
- Dashboard load: < 2 seconds
- SMS delivery: < 30 seconds
- Plugin data fetch: < 5 seconds per plugin
- Component rendering: < 16ms (60fps)

### Scalability Considerations
- Stateless API design for horizontal scaling
- Database connection pooling via Supabase
- Client-side caching with TanStack Query
- Plugin parallel execution for performance
- Edge deployment capability
- Component-level optimization for mobile devices

### Monitoring Requirements
- API response time tracking
- SMS delivery rate monitoring
- Plugin connection success rates
- Token validation performance
- Database query optimization
- Component performance metrics
- User experience monitoring

## Integration Points

### External Systems
1. **MobileMessage.com.au**: SMS delivery via REST API
2. **Google Calendar**: OAuth 2.0 integration with event transformation
3. **Airtable**: API key authentication with base mapping
4. **Notion**: Integration secret authentication with property mapping

### Webhook Support
- Plugin-specific webhook endpoints
- Real-time data synchronization
- Webhook authentication and validation
- Error handling for failed webhooks
- Standardized webhook payload format

## Deployment Architecture

### Development Environment
- Local development with `pnpm dev`
- Supabase local development options
- Environment-specific configurations
- Storybook for component development

### Production Deployment
- Frontend: Vercel (recommended)
- Backend: Vercel Edge Functions or Cloudflare Workers
- Database: Supabase (managed PostgreSQL)
- SMS: MobileMessage.com.au production API
- Component Library: Deployed as private npm package

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

### Enterprise Testing Standards

#### Plugin Testing (Zapier-Level Coverage)
- **Unit Tests**: 2,100+ lines per plugin adapter
- **Mock External Dependencies**: All external API calls mocked
- **Data Transformation Testing**: Verify standard data contract compliance
- **Error Scenario Testing**: Network failures, invalid responses, rate limits
- **Configuration Validation**: Test all valid/invalid config scenarios
- **Performance Testing**: Plugin execution time benchmarks

#### Component Testing
- **Storybook Stories**: All component variants documented
- **Accessibility Testing**: Keyboard navigation, screen reader support
- **Visual Regression Testing**: Component appearance consistency
- **Interaction Testing**: User behavior simulation
- **Responsive Testing**: Mobile-first design verification

#### API Testing
- **Route Testing**: All endpoints with various inputs
- **Error Handling**: Structured error response validation
- **Security Testing**: Authentication, authorization, RLS compliance
- **Performance Testing**: Load testing for concurrent users
- **Integration Testing**: End-to-end workflow validation

### Mocking Strategy (Current Development Stage)

#### What to Mock
- **SMS Provider (MobileMessage.com.au)**: 
  - Mock all SMS sending functionality during development
  - Use test mode that logs SMS content instead of sending
  - Mock delivery status callbacks and webhooks
  - Simulate success/failure scenarios for testing error handling
  - Mock phone number validation and formatting

- **External Plugin APIs**:
  - Google Calendar API responses
  - Airtable API responses
  - Notion API responses
  - Network failures and rate limits
  - Authentication errors

#### What NOT to Mock
- **Database Operations**: Use real Supabase instance (development tier)
- **Authentication Flow**: Use real Supabase Auth for testing login/signup
- **Token Generation/Validation**: Use real crypto functions for security testing
- **Plugin Adapter Logic**: Test real transformation and validation logic
- **API Routes**: Test real route handlers and middleware
- **Data Validation**: Use real Zod schemas and validation logic
- **Component Rendering**: Test real React components and interactions

#### Mocking Implementation Guidelines
- Create mock service classes that implement same interfaces as real services
- Use environment variables to switch between real and mock services
- Ensure mock responses match real API response formats exactly
- Include edge cases and error scenarios in mock implementations
- Log mock interactions for debugging during development
- Maintain mock data consistency with real data structures

## Common Implementation Patterns

### Error Handling
- Structured error responses with error codes
- Graceful degradation for plugin failures
- Comprehensive logging for debugging
- User-friendly error messages
- Error isolation to prevent cascade failures

### Data Validation
- Zod schemas for API validation
- Phone number formatting (E.164)
- Email validation standards
- Plugin configuration validation
- Standard data contract enforcement

### Caching Strategy
- Client-side caching with TanStack Query
- API response caching for static data
- Plugin result caching (future: Redis)
- Database query optimization
- Component-level memoization

### Plugin Development Patterns
- **Standard Data Contracts**: All plugins output standardized shapes
- **Error Isolation**: Plugin failures contained within adapter
- **Configuration Validation**: Robust validation before activation
- **Comprehensive Testing**: Full coverage with mocked dependencies
- **Performance Optimization**: Efficient data transformation and caching

## Future Enhancement Areas

### Planned Features
1. Real-time updates via WebSocket/SSE
2. Advanced analytics and reporting
3. Mobile apps (iOS/Android native)
4. White-labeling capabilities
5. Advanced plugin marketplace
6. Component library expansion (Phase 2 components)

### Scalability Improvements
1. Redis caching layer
2. Dedicated database instances
3. CDN integration for static assets
4. Advanced monitoring and alerting
5. Horizontal scaling for API endpoints

### Plugin Extensions
1. Microsoft Outlook Calendar
2. Salesforce integration
3. Custom API connector builder
4. Webhook automation rules
5. Enterprise system connectors (SAP, Oracle)

### UI/UX Enhancements
1. Advanced component variants
2. Dark mode support
3. Internationalization (i18n)
4. Advanced accessibility features
5. Mobile app components
6. Design system documentation site

### Technical Requirements
- Mobile-first user experience
- High SMS delivery reliability
- Fast dashboard loading times
- Secure token-based access
- Flexible plugin system
- Enterprise-grade component library
- Zapier-level reliability and maintainability

### Business Requirements
- Easy setup for non-technical users
- Cost-effective SMS delivery
- Reliable data synchronization
- Comprehensive audit trails
- Scalable multi-tenant architecture
- Professional admin interface
- Enterprise-quality user experience
```

---

## **Key Updates Made:**

### **🏗️ Architecture Philosophy**
- Added "Zapier-inspired enterprise middleware with standardized data contracts and plugin extensibility"
- Updated trigger description to reflect Zapier-inspired enterprise architecture

### **🔌 Plugin System Overhaul**
- Complete `BasePluginAdapter` interface with standardized data contracts
- `StandardScheduleItem` and `StandardTaskItem` interfaces (camelCase, ISO 8601)
- Plugin Registry and Manager Service patterns
- Enterprise testing standards (2,100+ lines per plugin)

### **🎨 Enterprise UI Component Library**
- Zapier-inspired design philosophy section
- Complete component examples with all Phase 1 components
- Design tokens with professional color palette
- Component development guidelines

### **📋 Enhanced Business Rules & Metrics**
- Added "Enterprise Quality" business rule
- Updated success metrics with API response times and uptime
- Added component library consistency metric

### **🔧 Technology Stack Updates**
- Updated UI Components to custom Zapier-style library
- Added Storybook and Lucide React
- Updated rationale for key decisions

### **🚀 Development Workflow**
- Added Storybook command
- Component development guidelines section
- Enterprise quality standards

### **🧪 Testing Strategy Enhancement**
- Enterprise testing standards section
- Plugin testing requirements
- Component testing with Storybook
- Enhanced mocking strategy

### **🔒 Security & Performance**
- Plugin security section
- Component performance metrics
- Enhanced monitoring requirements

### **📚 Future Enhancements**
- UI/UX enhancements section
- Component library expansion plans
- Mobile app components

This updated file now fully reflects your **Zapier-inspired enterprise architecture** with comprehensive plugin system, professional component library, and enterprise-grade quality standards.