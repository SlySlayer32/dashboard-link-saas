# Testing Strategy

## Performance Targets

**Dashboard Load Time:** < 2 seconds on 4G (PRD requirement)
- Measured from link tap to interactive dashboard
- Target: 80th percentile < 2s, 95th percentile < 3s
- Testing: Lighthouse CI, WebPageTest on 4G throttling

**SMS Delivery Success Rate:** > 99% (PRD requirement)
- Measured via MobileMessage.com.au delivery webhooks
- Monitoring: Track failed deliveries in `sms_logs` table

## Philosophy
Test what matters. Not everything needs a test. Focus on business logic, critical paths, and areas prone to bugs. Avoid testing framework code or trivial getters/setters.

**Test priorities:**
1. **High:** Multi-tenant isolation, authentication, token validation, SMS delivery
2. **Medium:** API endpoints, plugin adapters, data transformations
3. **Low:** UI components (test manually), simple utilities

## Test Types in Use

### Unit Tests
Test individual functions/modules in isolation. Fast, no external dependencies.

**What to unit test:**
- Utility functions (date formatting, validation, etc.)
- Business logic (token generation, dashboard data aggregation)
- Plugin adapters (mock external APIs)
- Error handling (custom error classes)

**Example:**
```typescript
describe('generateToken', () => {
  it('generates 32-character token', () => {
    const token = generateToken();
    expect(token).toHaveLength(32);
  });
});
```

### Integration Tests
Test multiple modules working together. May use test database or mock external services.

**What to integration test:**
- API endpoints (request → validation → service → database → response)
- Multi-tenant isolation (RLS policies work correctly)
- Plugin data sync (adapter → transformation → storage)
- Authentication flow (login → JWT → protected endpoint)

**Example:**
```typescript
describe('POST /api/workers', () => {
  it('creates worker for authenticated organization', async () => {
    const response = await request(app)
      .post('/api/workers')
      .set('Authorization', `Bearer ${validJWT}`)
      .send({ full_name: 'John Doe', phone_number: '+61412345678' });
    
    expect(response.status).toBe(201);
    expect(response.body.data.full_name).toBe('John Doe');
  });
});
```

### E2E Tests (Future)
Test complete user flows through UI. Slow, brittle, but catch integration issues.

**What to E2E test (when implemented):**
- Manager onboarding flow (signup → add worker → send SMS)
- Worker dashboard access (tap link → view schedule)
- Plugin connection flow (OAuth → configure → sync data)

## Tools

- **Vitest** — Fast unit test runner (Vite-native)
- **Testing Library** — React component testing (when needed)
- **Supertest** — HTTP API testing
- **MSW (Mock Service Worker)** — Mock external APIs in tests

## Test Commands

**From archive/docs/SETUP_GUIDE.md and V1_IMPLEMENTATION_CHECKLIST.md:**

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests for specific package
pnpm --filter @dashboard-link/api test
pnpm --filter @dashboard-link/admin test
pnpm --filter @dashboard-link/worker test

# Run tenant isolation tests (from PHASE_1_IMPLEMENTATION.md)
cd apps/api
npm run test:isolation

# Type checking (not tests, but part of quality checks)
pnpm typecheck

# Lint (code quality)
pnpm lint
```

**Tenant isolation test (critical for multi-tenant security):**
This test creates two organizations, adds workers to each, and verifies:
1. Each user can only see their own organization's data
2. SQL injection attempts fail (RLS blocks cross-tenant access)
3. Service role properly sets tenant context
4. Cleanup removes test data

## What Must Always Be Tested

1. **Multi-tenant isolation** — Ensure queries can't cross organization boundaries
2. **Token validation** — Expired/invalid tokens are rejected
3. **Phone number validation** — E.164 format enforced
4. **RLS policies** — Database-level isolation works
5. **Error handling** — Errors return correct status codes and messages

## What We Intentionally Don't Test

1. **Third-party libraries** — Trust they're tested (React, Hono, Supabase)
2. **UI styling** — Visual testing is manual (not automated)
3. **Simple getters/setters** — No business logic to test
4. **Framework code** — Don't test React rendering or Hono routing
5. **Database migrations** — Tested manually in dev environment

## How to Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests for specific package
pnpm --filter @dashboard-link/api test
```

## Test Coverage Targets

**Industry-standard coverage goals:**

| Category | Target Coverage | Rationale |
|----------|----------------|----------|
| **Security-critical code** | 100% | Auth, RLS, token validation — zero tolerance for bugs |
| **Business logic** | 80-90% | Services, plugin adapters, data transformations |
| **API endpoints** | 80% | Request/response handling, validation |
| **Utilities** | 70% | Helper functions, formatters |
| **Overall project** | 60-70% | Acceptable for MVP, increase post-launch |

**What counts as security-critical:**
- Authentication middleware (`middleware/auth.ts`)
- Tenant isolation middleware (`middleware/tenant.ts`)
- Token generation/validation (`services/tokens.ts`)
- RLS policy enforcement (integration tests)
- Input validation (Zod schemas)

**Coverage enforcement:**
- Run `pnpm test:coverage` to generate coverage report
- Coverage report saved to `coverage/` directory (gitignored)
- View HTML report: `coverage/index.html`
- Block PRs if security-critical code drops below 100%

## CI/CD Integration

**GitHub Actions workflow (`.github/workflows/test.yml`):**

```yaml
name: Test Suite

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Type check
        run: pnpm typecheck
      
      - name: Lint
        run: pnpm lint
      
      - name: Run tests
        run: pnpm test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: true
      
      - name: Check coverage thresholds
        run: |
          # Fail if overall coverage < 60%
          # Fail if security-critical files < 100%
          pnpm test:coverage --check-coverage
```

**When tests run:**
- Every pull request (blocks merge if tests fail)
- Every push to main branch
- Manual trigger via GitHub Actions UI

**Test failure handling:**
- PR cannot be merged if tests fail
- Coverage report posted as PR comment
- Failing tests highlighted in PR checks
