# Tech Context - CleanConnect Technical Setup

## Technology Stack

### Backend
- **Framework**: Hono (lightweight, fast)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **ORM**: Drizzle ORM (via @dashboard-link/database)
- **Validation**: Zod
- **Async Processing**: BullMQ + Redis

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Routing**: React Router v6

### Infrastructure
- **Hosting**: Supabase (initially)
- **Deployment**: GitHub Actions
- **Monitoring**: Supabase logs + custom metrics
- **CDN**: Supabase Edge Functions

### Development Tools
- **Package Manager**: pnpm (required, not npm)
- **Monorepo**: pnpm workspaces
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky for pre-commit

## Project Structure

```
CleanConnect/
├── apps/
│   ├── admin/          # Main web application
│   ├── api/            # Backend API server
│   └── worker/         # Background job processor
├── packages/
│   ├── shared/         # Shared types and utilities
│   ├── database/       # Database schemas and migrations
│   ├── auth/           # Authentication logic
│   ├── plugins/        # Plugin system
│   ├── sms/            # SMS connector (MobileMessage)
│   ├── tokens/         # Token management
│   └── ui/             # Shared UI components
├── docs/               # Documentation
├── plan/               # Implementation plans (numbered 1-8)
├── supabase/           # Database migrations and functions
└── .windsurf/          # AI assistant configuration
```

## Environment Setup

### Prerequisites
- Node.js 18+ (use LTS version)
- pnpm 8+ (required, not npm)
- Git with configured SSH keys
- Supabase CLI (for local development)

### Installation Steps
```bash
# Clone repository
git clone <repository-url>
cd CleanConnect

# Install dependencies (must use pnpm)
pnpm install

# Setup environment files
cp ENV.example .env
cp apps/admin/.env.example apps/admin/.env
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env

# Setup Supabase
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase db push
```

### Environment Variables
**Required for all environments**:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

**Backend only**:
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- `REDIS_URL` - Redis connection for BullMQ
- `JWT_SECRET` - JWT signing secret

**SMS Provider** (optional during development):
- `MOBILEMESSAGE_API_KEY` - MobileMessage API key
- `MOBILEMESSAGE_API_SECRET` - MobileMessage secret

## Development Workflow

### Starting Development
```bash
# Start all services in development mode
pnpm dev

# Or start individually:
pnpm --filter @dashboard-link/api dev
pnpm --filter @dashboard-link/admin dev
pnpm --filter @dashboard-link/worker dev
```

### Building
```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @dashboard-link/api build
```

### Testing
```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @dashboard-link/api test

# Run tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e
```

## Database Setup

### Migrations
- Location: `supabase/migrations/`
- Format: `001_description.sql`
- Always use expand/contract pattern
- Never destructive operations

### Seeding
- Development data: `supabase/seed.sql`
- Test data: `.env.test` configuration
- Production: Manual data migration

### Schema Management
```bash
# Generate new migration
supabase migration new new_feature

# Apply migrations
supabase db push

# Reset local database
supabase db reset
```

## Package Dependencies

### Core Dependencies
```json
{
  "dependencies": {
    "hono": "^3.x",
    "@supabase/supabase-js": "^2.x",
    "zod": "^3.x",
    "drizzle-orm": "^0.x",
    "@tanstack/react-query": "^5.x",
    "zustand": "^4.x"
  }
}
```

### Development Dependencies
```json
{
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "@vitejs/plugin-react": "^4.x",
    "tailwindcss": "^3.x",
    "eslint": "^8.x",
    "prettier": "^3.x"
  }
}
```

## Deployment

### Production Deployment
1. **Backend**: Deploy to Supabase Edge Functions
2. **Frontend**: Deploy to Supabase Hosting
3. **Database**: Managed by Supabase
4. **Worker**: Deploy as separate service

### CI/CD Pipeline
- Trigger on push to main
- Run tests and linting
- Build applications
- Deploy to staging first
- Manual approval for production

### Environment Management
- Development: Local Supabase
- Staging: Separate Supabase project
- Production: Dedicated Supabase project

## Monitoring and Observability

### Logging
- Structured JSON logs
- Correlation IDs for requests
- Error tracking with context
- Performance metrics

### Monitoring Tools
- Supabase Dashboard
- Custom metrics in Edge Functions
- Error tracking (to be added)
- Performance monitoring (to be added)

## Security Considerations

### Authentication
- Supabase Auth for users
- JWT tokens for API access
- Row Level Security (RLS)
- Organization-based isolation

### API Security
- Request validation with Zod
- Rate limiting on endpoints
- CORS configuration
- HTTPS enforcement

### Data Protection
- Encrypted connections
- PII masking in logs
- Secure key management
- Regular security audits

## Common Issues and Solutions

### Build Issues
- Always use `pnpm` not `npm`
- Clear node_modules if needed: `pnpm clean`
- Check TypeScript strict mode errors

### Database Issues
- Check RLS policies if data missing
- Verify organizationId in queries
- Use expand/contract for migrations

### Development Issues
- Restart services after env changes
- Clear browser cache for UI issues
- Check network tab for API errors
