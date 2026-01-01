# GitHub Copilot Instructions for Dashboard Link SaaS

## 🎯 Project Overview

This is **Dashboard Link** - a Zapier-style enterprise SaaS platform that delivers personalized daily dashboards to workers via SMS. The project follows a **plugin-based architecture** similar to Zapier, allowing integration with various data sources (Google Calendar, Airtable, Notion, etc.).

### Key Product Features
- **SMS Dashboard Delivery**: Workers receive a simple SMS link to view their daily schedule
- **No App Required**: Mobile-first web interface, no app installation needed
- **Multi-tenant SaaS**: Each organization is fully isolated using Row-Level Security (RLS)
- **Plugin System**: Modular adapters for external data sources
- **Secure Token-Based Access**: Time-limited, auto-expiring dashboard links

## 🏗️ Architecture Style

**Zapier-Inspired Design Pattern:**
- **Service Layer**: Core business logic (independent of external services)
- **Contract Layer**: Interfaces/contracts defining what adapters must implement
- **Adapter Layer**: Swappable implementations for external services (SMS providers, data sources)
- **External Services**: Third-party APIs (their problem, not ours)

This allows us to swap providers (e.g., MobileMessage → Twilio) without touching core business logic.

## 🛠️ Tech Stack

### Monorepo Structure (Turborepo + pnpm)
```
apps/
  ├── admin/      # Admin dashboard (React + Vite + TanStack Query)
  ├── worker/     # Worker mobile view (React + Vite)
  └── api/        # Backend API (Hono.js)
packages/
  ├── ui/         # Shared React components
  ├── auth/       # Authentication logic
  ├── database/   # Supabase client + types
  ├── sms/        # SMS service contracts
  ├── tokens/     # Token generation/validation
  ├── plugins/    # Plugin adapters system
  └── shared/     # Shared utilities
```

### Core Technologies
- **Frontend**: React 18, TypeScript, Vite, TanStack Query, Zustand, Tailwind CSS
- **Backend**: Hono.js (lightweight web framework), Node.js
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **SMS**: MobileMessage.com.au (Australia-focused provider)
- **Build System**: Turborepo, pnpm workspaces
- **Testing**: Vitest
- **Linting**: ESLint 9 (flat config), Prettier

## 👤 User Context

This project is developed by a **non-technical founder** using:
- **Vibe coding**: Iterative, conversation-driven development
- **GitHub Copilot**: AI-assisted coding
- **Learning by doing**: Building while learning best practices

### When Helping This User:
1. **Explain technical concepts simply** - use analogies and plain language
2. **Show complete code examples** - don't assume knowledge of patterns
3. **Highlight common pitfalls** - especially around TypeScript, monorepo, and async code
4. **Suggest testing approaches** - guide how to verify changes work
5. **Be patient with iterations** - changes may need refinement
6. **Provide context for decisions** - explain "why" not just "how"

## 📝 Coding Conventions

### File Naming
- **Components**: `PascalCase.tsx` (e.g., `WorkerList.tsx`, `SendSMSButton.tsx`)
- **Pages**: `PascalCase` + `Page.tsx` suffix (e.g., `WorkersPage.tsx`)
- **Hooks**: `camelCase.ts` with `use` prefix (e.g., `useWorkers.ts`)
- **Services**: `camelCase.ts` (e.g., `tokenService.ts`, `smsService.ts`)
- **Types**: `camelCase.ts` + `Types` suffix (e.g., `workerTypes.ts`)
- **Utils**: `camelCase.ts` + `Utils` suffix (e.g., `dateUtils.ts`)

### TypeScript Patterns
- Use **interfaces** for object shapes: `interface Worker { ... }`
- Use **types** for unions/utilities: `type Status = 'active' | 'inactive'`
- Always add explicit return types for functions
- Prefer `async/await` over `.then()` chains

### React Patterns
```typescript
// ✅ Good: Function component with explicit types
export const WorkerList: React.FC<WorkerListProps> = ({ organizationId }) => {
  const { data, isLoading, error } = useWorkers(organizationId);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div className="space-y-4">
      {data.map(worker => <WorkerCard key={worker.id} worker={worker} />)}
    </div>
  );
};

// ❌ Avoid: Missing types, no loading states
export const WorkerList = ({ organizationId }) => {
  const data = useWorkers(organizationId);
  return <div>{data.map(w => <WorkerCard worker={w} />)}</div>;
};
```

### API Route Patterns (Hono.js)
```typescript
// ✅ Good: Middleware, validation, proper error handling
router.use(authMiddleware);

router.post('/workers', validateBody(CreateWorkerSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const organizationId = c.get('organizationId');
    
    const worker = await workerService.create(body, organizationId);
    return c.json({ success: true, data: worker }, 201);
  } catch (error) {
    console.error('Create worker error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ❌ Avoid: No auth, no validation, poor error handling
router.post('/workers', async (c) => {
  const worker = await workerService.create(await c.req.json());
  return c.json(worker);
});
```

### Tailwind CSS Patterns
- Mobile-first: Start with base styles, add `sm:`, `md:`, `lg:` for larger screens
- Use utility classes: `className="flex items-center gap-4 p-4 rounded-lg shadow"`
- Consistent spacing: Use Tailwind's scale (`space-y-4`, `gap-6`, `p-8`)
- Semantic colors: `bg-primary-600`, `text-error-500`, `border-success-300`

## 🏗️ Plugin System Architecture

**Core Principle**: Adapters transform external API responses into our standard format.

### Plugin Adapter Contract
```typescript
interface PluginAdapter {
  id: string;
  name: string;
  version: string;
  
  // Transform external schedule data → our format
  getSchedule(workerId: string, config: PluginConfig): Promise<PluginResponse<StandardScheduleItem>>;
  
  // Transform external task data → our format
  getTasks(workerId: string, config: PluginConfig): Promise<PluginResponse<StandardTaskItem>>;
  
  // Validate plugin configuration
  validateConfig(config: PluginConfig): Promise<ValidationResult>;
  
  // Optional: health check
  healthCheck?(): Promise<HealthStatus>;
}

// Standard data format (all plugins must output this)
interface StandardScheduleItem {
  id: string;
  title: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  location?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  metadata: Record<string, any>; // Store provider-specific data here
}
```

### Example: Google Calendar Adapter
```typescript
export class GoogleCalendarAdapter implements PluginAdapter {
  id = 'google-calendar';
  name = 'Google Calendar';
  version = '1.0.0';
  
  async getSchedule(workerId: string, config: PluginConfig): Promise<PluginResponse<StandardScheduleItem>> {
    // 1. Fetch from Google Calendar API (their format)
    const googleEvents = await this.fetchGoogleEvents(workerId, config);
    
    // 2. Transform to our standard format
    const standardItems = googleEvents.map(event => ({
      id: event.id,
      title: event.summary,
      startTime: event.start.dateTime,
      endTime: event.end.dateTime,
      location: event.location,
      description: event.description,
      metadata: {
        googleEventId: event.id,
        htmlLink: event.htmlLink,
        attendees: event.attendees
      }
    }));
    
    // 3. Return in standard envelope
    return {
      success: true,
      data: standardItems,
      metadata: { provider: 'google-calendar', fetchedAt: new Date().toISOString() }
    };
  }
}
```

## 🧪 Testing & Quality

### Commands
```bash
# Run all tests
pnpm test

# Run tests in specific package
pnpm --filter @dashboard-link/auth test

# Run with coverage
pnpm test:coverage

# Lint code
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check
```

### Test Patterns
```typescript
// ✅ Good: Descriptive, arrange-act-assert pattern
describe('WorkerService', () => {
  describe('createWorker', () => {
    it('should create worker with valid phone number', async () => {
      // Arrange
      const workerData = { name: 'John Doe', phone: '+61412345678' };
      const orgId = 'org_123';
      
      // Act
      const result = await workerService.createWorker(workerData, orgId);
      
      // Assert
      expect(result.id).toBeDefined();
      expect(result.phone).toBe('+61412345678');
    });
  });
});
```

## 🚀 Build & Development

### Development
```bash
# Start all apps in development mode
pnpm dev

# Start specific app
pnpm --filter admin dev
pnpm --filter api dev
pnpm --filter worker dev
```

### Build
```bash
# Build all apps
pnpm build

# Build specific package
pnpm --filter @dashboard-link/ui build
```

### Database (Supabase)
```bash
# Start local Supabase instance
pnpm db:start

# Apply migrations
pnpm db:migrate

# Reset database with seed data
pnpm db:reset

# Stop local Supabase
pnpm db:stop
```

## 🔐 Security & Best Practices

### Row-Level Security (RLS)
- Every table has `organization_id` column
- RLS policies ensure users only see their organization's data
- Always include `organization_id` in queries

### Token Security
- Dashboard tokens expire after 1-24 hours
- Tokens are single-use or limited-use
- Never expose Supabase service keys to frontend

### Environment Variables
- Use `.env.example` as template
- Never commit `.env` files
- Prefix variables: `APP_`, `SUPABASE_`, `SMS_`, etc.

## 🎨 UI/UX Guidelines

### Mobile-First
- Design for 320px width minimum
- Touch targets: 44x44px minimum
- Large, readable text (16px base)
- Simple, focused interface

### SMS Context
- Workers access via SMS link on their phone
- May have poor internet connection
- Need info at a glance (today's schedule only)
- No login required (token-based access)

### Admin Dashboard
- Desktop-focused (responsive)
- Data-dense tables with good spacing
- Quick actions (send SMS, edit worker)
- Real-time updates via TanStack Query

## 🐛 Common Pitfalls & Solutions

### Monorepo Issues
```bash
# ❌ Package not found
# ✅ Install at root level
pnpm install -w package-name

# ❌ Changes not reflected
# ✅ Rebuild dependencies
pnpm --filter package-name build
```

### TypeScript Issues
```typescript
// ❌ Type inference fails
const data = await fetchData(); // type: any

// ✅ Explicit type annotation
const data: Worker[] = await fetchData();
```

### Async/Await Issues
```typescript
// ❌ Not awaiting async function
const result = asyncFunction(); // Promise<T>, not T

// ✅ Properly awaiting
const result = await asyncFunction(); // T
```

## 📚 Key Resources

- **Architecture**: See `/ARCHITECTURE_BLUEPRINT.md` for Zapier-style patterns
- **Conventions**: See `/docs/conventions.md` for detailed patterns
- **Supabase Docs**: https://supabase.com/docs
- **Hono.js Docs**: https://hono.dev
- **TanStack Query**: https://tanstack.com/query/v5

## 💡 When Helping the Founder

1. **Start Simple**: Suggest the simplest solution first, then optimize
2. **Provide Full Context**: Include imports, types, and error handling
3. **Explain Trade-offs**: "This is easier but less flexible; this is harder but more maintainable"
4. **Show Testing Steps**: "Run `pnpm dev`, open http://localhost:5173, click the button"
5. **Reference Existing Code**: "Look at `WorkerList.tsx` as an example"
6. **Encourage Best Practices**: But don't be dogmatic - prioritize working code
7. **Think Zapier-Style**: Suggest modular, pluggable solutions

## ✅ Code Review Checklist

When reviewing or suggesting code, check:
- [ ] TypeScript types are defined (no `any`)
- [ ] Loading and error states handled
- [ ] Organization isolation enforced (RLS)
- [ ] Mobile-responsive (if UI)
- [ ] Consistent with existing patterns
- [ ] Tests included (for new features)
- [ ] Error messages are user-friendly
- [ ] No hardcoded values (use env vars)
- [ ] Follows file naming conventions
- [ ] Imports are clean and organized
