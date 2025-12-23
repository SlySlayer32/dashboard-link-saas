---
trigger: always_on
---

# AI Assistant Context Guide - Dashboard Link SaaS

## 1. Project Foundation

### Tech Stack
- **Frontend**: Vite, React 18, TypeScript
- **Backend**: Hono.js (Node.js/Edge runtime), Supabase
- **Styling**: Tailwind CSS
- **State Management**: Zustand (auth only), TanStack Query (data)
- **Monorepo**: Turborepo + pnpm workspaces
- **Package Manager**: pnpm (v9.15.0+)

### Project Structure
```
dashboard-link-saas/
├── apps/
│   ├── admin/          # Admin dashboard (port 5173)
│   ├── worker/         # Worker mobile dashboard (port 5174)
│   └── api/            # Hono.js API server (port 3000)
├── packages/
│   ├── plugins/        # Plugin adapter system
│   ├── database/       # Supabase migrations & schema
│   ├── shared/         # Shared types & utilities
│   └── ui/             # Shared UI components
```

### Key Commands
```bash
# Development
pnpm dev                    # Start all apps
pnpm dev --filter admin     # Start specific app
pnpm dev --filter api

# Building & Testing
pnpm build                  # Build all packages
pnpm lint                   # Lint all code
pnpm test                   # Run all tests

# Formatting
pnpm format                 # Format with Prettier
pnpm format:check          # Check formatting
```

## 2. Architecture & Patterns

### Application Roles
- **Admin App**: Organization management, worker CRUD, SMS sending
- **Worker App**: Token-based dashboard view (no auth required)
- **API**: RESTful backend with Supabase integration

### Authentication Flow
- **Admin**: Supabase Auth + JWT tokens (stored in Zustand + localStorage)
- **Worker**: Time-limited access tokens (1h-24h expiry, URL-based)
- **API Middleware**: JWT validation on protected routes

### Multi-Tenancy Pattern
```typescript
// CRITICAL: Every DB query MUST filter by organization_id
const { data } = await supabase
  .from('workers')
  .select('*')
  .eq('organization_id', organizationId)  // ← REQUIRED
```

### Data Fetching Pattern
```typescript
// Use TanStack Query for all data fetching
export const useWorkers = () => {
  return useQuery({
    queryKey: ['workers'],
    queryFn: () => workersService.getWorkers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

## 3. Code Standards & Conventions

### File Naming
- **React Components**: `PascalCase.tsx` (e.g., `WorkerList.tsx`)
- **Pages**: `PascalCase` + "Page" suffix (e.g., `WorkersPage.tsx`)
- **Hooks**: `camelCase` + "use" prefix (e.g., `useWorkers.ts`)
- **Services**: `camelCase` + "service" suffix (e.g., `tokenService.ts`)
- **API Routes**: `kebab-case.ts` (e.g., `manual-data.ts`)

### TypeScript Rules
- **Use explicit types**: Avoid `any`, prefer `Record<string, unknown>` or proper interfaces
- **Unused variables**: Prefix with `_` (e.g., `_error`) or remove entirely
- **Import organization**: Remove unused imports before committing

### Formatting (Prettier)
```json
{
  "semi": false,
  "singleQuote": true,
  "jsxSingleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

### Linting Critical Rules
- **Errors block commits**: `no-undef`, `no-unused-vars`, parsing errors
- **Warnings allowed**: `@typescript-eslint/no-explicit-any`, `no-console`
- **Always run**: `pnpm lint` before committing (don't rely on lint-staged alone)

## 4. UI/UX Patterns

### Component Structure
```typescript
export const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // 1. Hooks at the top
  const [state, setState] = useState<Type>();
  const { data, isLoading } = useCustomHook();
  
  // 2. Event handlers
  const handleClick = useCallback(() => {
    // handler logic
  }, [dependencies]);
  
  // 3. Conditional renders for loading/error
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  // 4. Main render
  return <div className="tailwind-classes">{/* JSX */}</div>;
};
```

### Tailwind Usage
- **Mobile-first**: Start with base styles, add `sm:`, `md:`, `lg:` as needed
- **Spacing scale**: Use consistent spacing (4, 6, 8, 12, 16, 24)
- **Color palette**: Primary (blue), secondary (gray), success, error, warning
- **Touch targets**: Minimum 44px for mobile tap areas

### Form Patterns
```typescript
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().refine(validateAustralianPhone),
  email: z.string().email().optional(),
})

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
  mode: 'onChange',
})
```

## 5. Business Logic & Domain

### Plugin System
```typescript
// Plugins fetch data from external sources
interface PluginAdapter {
  id: string;
  name: string;
  getTodaySchedule(workerId: string, config: any): Promise<ScheduleItem[]>;
  getTodayTasks(workerId: string, config: any): Promise<TaskItem[]>;
}

// Built-in plugins: Manual Entry, Google Calendar, Airtable, Notion
```

### SMS Integration (MobileMessage.com.au)
- **Pricing**: 2-3¢/SMS (vs Twilio AU 5.15¢)
- **Phone format**: Australian E.164 format (`+61 4xx xxx xxx`)
- **Rate limiting**: 5 requests/minute to prevent abuse
- **Message template**: `Hi {name}! Your daily dashboard is ready: {url}`

### Token System
```typescript
// Token generation
const token = crypto.randomBytes(32).toString('hex');
const expiresAt = new Date(Date.now() + expirySeconds * 1000);

// Token expiry options: 1h, 6h, 12h, 24h
// Tokens are single-use but can be accessed multiple times before expiry
```

## 6. Database & API Patterns

### Supabase Client Usage
```typescript
// Use SERVICE_KEY for backend operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Always include organization_id filter
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('organization_id', orgId);
```

### API Response Format
```typescript
// Success
{
  success: true,
  data: T,
  message?: string
}

// Error
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Human-readable error',
    details?: any
  }
}
```

### Pagination Pattern
```typescript
interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Query params: ?page=1&limit=20&search=query
```

## 7. Development Environment

### Environment Variables
```bash
# Admin App (.env in apps/admin)
VITE_API_URL=http://localhost:3000

# Worker App (.env in apps/worker)
VITE_API_URL=http://localhost:3000

# API (.env in apps/api)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
MOBILEMESSAGE_USERNAME=your-username
MOBILEMESSAGE_PASSWORD=your-password
```

### Port Assignments
- **Admin**: `http://localhost:5173`
- **Worker**: `http://localhost:5174`
- **API**: `http://localhost:3000`

### Development Workflow
1. Run `pnpm install` after pulling changes
2. Start dev servers: `pnpm dev`
3. Make changes and test locally
4. Run `pnpm lint` and fix errors
5. Run `pnpm format` before committing
6. Commit with descriptive messages

## 8. Performance & Optimization

### Query Optimization
- **Stale time**: 5 minutes for list views, 2 minutes for detail views
- **Refetch interval**: 5 minutes for auto-refresh (worker dashboard)
- **Prefetching**: Prefetch next page in paginated lists
- **Select specific fields**: Only fetch columns you need

### Bundle Size
- **Lazy load routes**: Use React.lazy() for page-level components
- **Code splitting**: Separate vendor bundles
- **Tree shaking**: Import only what you need from libraries

### Mobile Optimization (Worker App)
- **Optimize images**: Use appropriate formats and sizes
- **Minimize JS**: Keep bundle < 200KB for fast load
- **Skeleton screens**: Show loading skeletons instead of spinners
- **Touch optimization**: 44px minimum tap targets

## 9. Testing Strategy

### Unit Tests
```typescript
// Use Vitest for unit tests
describe('Component/Function', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Integration Tests
- Test API endpoints with mocked Supabase
- Test React components with React Testing Library
- Mock external services (SMS provider)

### Smoke Tests
- Auth flow (login → protected route → logout)
- Worker CRUD operations
- SMS sending workflow
- Dashboard token access

## 10. Critical Constraints & Gotchas

### Security Requirements
- ❌ **NEVER** expose service keys in frontend code
- ✅ **ALWAYS** validate organization_id on backend
- ✅ **ALWAYS** sanitize phone numbers before storage
- ✅ **ALWAYS** validate token expiry before allowing access

### Phone Number Rules
- Format: Australian E.164 (`+61 4xx xxx xxx`)
- Validation: Must start with `04` or `+614`
- Display: Show as `04xx xxx xxx` (domestic format)
- Storage: Store as `+61 4xx xxx xxx` (international format)

### Known Limitations
- **SMS rate limit**: 5 per minute to prevent abuse
- **Token reuse**: Tokens can be accessed multiple times before expiry
- **Plugin adapters**: Currently manual configuration (no UI yet)
- **Browser storage**: Cannot use localStorage in artifacts (Claude.ai restriction)

### Common Pitfalls
1. **Forgetting organization_id filter** → Cross-tenant data leak
2. **Using wrong port for worker app** → 5174, not 5173
3. **Not handling token expiry** → Users see broken dashboard
4. **Mixing up phone formats** → SMS delivery failures
5. **Not checking worker.active status** → Sending SMS to inactive workers

## 11. Deployment & Production

### Environment Checklist
- [ ] All environment variables configured
- [ ] Supabase RLS policies enabled
- [ ] SMS provider credentials valid
- [ ] API CORS configured for production domains
- [ ] Error logging/monitoring set up

### Build Process
```bash
# Build all packages in correct order
pnpm build

# Deploy frontend to Vercel
vercel --prod

# Deploy API to Vercel Edge Functions or similar
cd apps/api && vercel --prod
```

### Monitoring
- API response times
- SMS delivery success rate
- Token validation failures
- Database query performance
- Error rates by endpoint

---

## Quick Reference Card

**When creating new features:**
1. Check if component/hook already exists in shared packages
2. Follow file naming conventions strictly
3. Add organization_id filter to all DB queries
4. Use TanStack Query for data fetching
5. Implement loading, error, and empty states
6. Write tests for critical paths
7. Run `pnpm lint` before committing

**When debugging:**
1. Check browser console for client errors
2. Check API logs for backend errors
3. Verify Supabase RLS policies aren't blocking queries
4. Confirm environment variables are loaded
5. Test with `curl` to isolate frontend vs backend issues

**When asking AI for help:**
- Specify which app (admin/worker/api)
- Include relevant file paths
- Share error messages in full
- Mention what you've already tried
- Reference this guide for context