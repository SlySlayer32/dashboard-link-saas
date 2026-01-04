# Comprehensive Code Review Checklist

## TypeScript Quality

### Type Safety
- [ ] No `any` types (use `unknown` if needed)
- [ ] All function parameters have types
- [ ] All functions have explicit return types
- [ ] Interfaces used for object shapes
- [ ] Types used for unions/utilities
- [ ] Proper generic constraints
- [ ] No type assertions unless absolutely necessary

### Type Patterns
- [ ] Consistent naming (interfaces: `PascalCase`, types: `PascalCase`)
- [ ] Shared types in separate files (`*Types.ts`)
- [ ] No circular type dependencies
- [ ] Discriminated unions for complex types

## React Patterns

### Component Structure
- [ ] Function components with `React.FC<Props>` type
- [ ] Props interface defined before component
- [ ] Hooks at the top of component
- [ ] Event handlers use `useCallback` when passed as props
- [ ] Effects have proper dependency arrays

### State Management
- [ ] Loading states handled (`isLoading`)
- [ ] Error states handled (`error`)
- [ ] Empty states handled (no data)
- [ ] Optimistic updates where appropriate
- [ ] TanStack Query for server state
- [ ] Zustand for client state

### Rendering
- [ ] Keys on list items (unique, stable)
- [ ] Conditional renders before main return
- [ ] No inline object/array creation in render
- [ ] Memoization for expensive computations
- [ ] Lazy loading for code splitting

### Accessibility
- [ ] Semantic HTML elements
- [ ] ARIA labels where needed
- [ ] Keyboard navigation support
- [ ] Focus management for modals
- [ ] Alt text for images

## API Routes (Hono.js)

### Middleware
- [ ] Authentication middleware applied
- [ ] Authorization checks (org-level)
- [ ] Request validation middleware
- [ ] Rate limiting (if needed)
- [ ] CORS configured properly

### Request Handling
- [ ] Input validation (zod schemas)
- [ ] Type-safe request body access
- [ ] Organization ID from context
- [ ] Proper HTTP status codes
- [ ] Consistent response format

### Error Handling
- [ ] Try/catch blocks for async operations
- [ ] Meaningful error messages
- [ ] Error logging (not console.log)
- [ ] No sensitive data in error responses
- [ ] Proper error status codes (400, 401, 403, 404, 500)

## Architecture Adherence

### Zapier-Style Layering
- [ ] Business logic in Service layer
- [ ] Contracts/interfaces defined
- [ ] Adapters implement contracts
- [ ] No direct external API calls in services
- [ ] Swappable adapters

### Organization Isolation (RLS)
- [ ] All queries filter by `organization_id`
- [ ] Organization ID from authenticated context
- [ ] RLS policies enforced in database
- [ ] No cross-org data leakage
- [ ] Multi-tenant aware

### Separation of Concerns
- [ ] No business logic in React components
- [ ] No database queries in UI
- [ ] Services don't know about HTTP
- [ ] Clear module boundaries
- [ ] Single Responsibility Principle

## Security

### Authentication/Authorization
- [ ] Protected routes require auth
- [ ] Token validation
- [ ] Session management
- [ ] No auth logic in frontend
- [ ] Proper logout handling

### Data Protection
- [ ] No hardcoded secrets
- [ ] Environment variables for sensitive data
- [ ] No secrets in client-side code
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized input)

### Input Validation
- [ ] All user input validated
- [ ] Schema validation (zod)
- [ ] Phone number format validation
- [ ] Email format validation
- [ ] SQL injection prevention

### API Security
- [ ] Rate limiting implemented
- [ ] CORS configured properly
- [ ] No sensitive data in URLs
- [ ] HTTPS enforced (production)
- [ ] Secure headers set

## Performance

### Database
- [ ] No N+1 queries
- [ ] Proper indexes defined
- [ ] Efficient query patterns
- [ ] Pagination for large datasets
- [ ] Connection pooling configured

### Frontend
- [ ] Code splitting/lazy loading
- [ ] Image optimization
- [ ] Bundle size monitoring
- [ ] Memoization where beneficial
- [ ] Debounced/throttled inputs

### Caching
- [ ] TanStack Query cache configured
- [ ] Stale-while-revalidate patterns
- [ ] Cache invalidation on mutations
- [ ] Proper cache keys

## Testing

### Test Coverage
- [ ] Critical paths tested
- [ ] Happy path tests
- [ ] Error case tests
- [ ] Edge case tests
- [ ] Integration tests for APIs

### Test Quality
- [ ] Descriptive test names
- [ ] Arrange-Act-Assert pattern
- [ ] Independent tests (no shared state)
- [ ] Mock external dependencies
- [ ] Fast test execution

## Code Style

### File Organization
- [ ] Imports grouped (external, internal, relative)
- [ ] File length reasonable (<500 lines)
- [ ] Related files co-located
- [ ] Naming conventions followed
- [ ] No commented-out code

### Naming
- [ ] Components: `PascalCase.tsx`
- [ ] Pages: `PascalCasePage.tsx`
- [ ] Hooks: `useCamelCase.ts`
- [ ] Services: `camelCase.ts`
- [ ] Types: `camelCaseTypes.ts`
- [ ] Utils: `camelCaseUtils.ts`

### Code Quality
- [ ] No console.log statements
- [ ] Proper error logging
- [ ] Comments only where needed
- [ ] Self-documenting code
- [ ] DRY principle followed

## Documentation

### Code Documentation
- [ ] JSDoc for public functions
- [ ] Complex logic explained
- [ ] API endpoints documented
- [ ] Type definitions clear

### Project Documentation
- [ ] README updated if needed
- [ ] Architecture docs reflect changes
- [ ] Migration guide for breaking changes
- [ ] API documentation current

## Git Practices

### Commits
- [ ] Clear commit messages
- [ ] Logical commit grouping
- [ ] No unrelated changes mixed
- [ ] No build artifacts committed
- [ ] No node_modules committed

### PR Quality
- [ ] PR description clear
- [ ] Links to related issues
- [ ] Screenshots for UI changes
- [ ] Breaking changes highlighted
- [ ] Migration steps documented

## Build & Deploy

### Build Process
- [ ] Clean build succeeds
- [ ] No build warnings (that matter)
- [ ] TypeScript compilation clean
- [ ] Linter passes
- [ ] Tests pass

### Environment
- [ ] Environment variables documented
- [ ] .env.example updated
- [ ] No environment-specific hardcoding
- [ ] Proper config management

## Monorepo Specific

### Package Management
- [ ] Dependencies in correct package
- [ ] No duplicate dependencies
- [ ] Workspace protocol used (`workspace:*`)
- [ ] Package versions aligned

### Turborepo
- [ ] Build outputs cached correctly
- [ ] Task dependencies configured
- [ ] Remote caching works
- [ ] Pipeline optimized
