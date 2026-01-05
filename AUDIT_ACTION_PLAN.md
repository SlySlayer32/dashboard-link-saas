# Audit Action Plan - Dashboard Link SaaS
**Priority-Ordered Remediation Roadmap**

**Generated:** January 5, 2026  
**Status:** Ready for Implementation  
**Estimated Total Effort:** 3-5 days

---

## 🔴 CRITICAL - Must Fix Immediately (Day 1)

### 1. Fix API Package Build Failures
**Time Estimate:** 4-6 hours  
**Impact:** Backend API cannot build or deploy

#### Root Causes:
1. Hono context not typed with custom variables (`organizationId`, `user`)
2. Module resolution issues (`@dashboard-link/tokens`, `@dashboard-link/database`, `@dashboard-link/sms`)
3. Error handling type inconsistencies

#### Implementation Steps:

```typescript
// Step 1: Define Hono context type (apps/api/src/types.ts)
import { Context } from 'hono';

export interface AppContextVariables {
  organizationId: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export type AppContext = Context<{ Variables: AppContextVariables }>;

// Step 2: Update all route handlers
import type { AppContext } from '../types';

router.get('/plugins', async (c: AppContext) => {
  const organizationId = c.get('organizationId'); // Now properly typed
  // ...
});

// Step 3: Fix error handling
try {
  // ...
} catch (error) {
  console.error('Error:', error);
  return c.json({ 
    success: false, 
    error: error instanceof Error ? error.message : 'Unknown error' 
  }, 500);
}
```

#### Files to Fix:
- [ ] `apps/api/src/types.ts` (create)
- [ ] `apps/api/src/index.ts` (update Hono app type)
- [ ] `apps/api/src/routes/plugins.ts` (18 errors)
- [ ] `apps/api/src/routes/tokens.ts` (10 errors)
- [ ] `apps/api/src/routes/workers.ts` (2 errors)
- [ ] `apps/api/src/routes/sms.ts` (1 error)
- [ ] `apps/api/src/services/sms.service.ts` (2 errors)
- [ ] `apps/api/src/services/webhookService.ts` (2 errors)

#### Verification:
```bash
cd apps/api
pnpm build
# Should succeed with no TypeScript errors
```

---

### 2. Fix ESLint Configuration
**Time Estimate:** 2-3 hours  
**Impact:** Cannot commit code, quality enforcement broken

#### Root Cause:
Mixed ESLint v8 and v9, incompatible configurations

#### Implementation Steps:

```javascript
// Step 1: Update root ESLint config to v9 flat config
// File: eslint.config.js (update)

import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
];
```

```bash
# Step 2: Update all packages to use root config
# Remove individual eslint configs or make them extend root

# Step 3: Fix all 23 ESLint errors
```

#### Files to Fix:
- [ ] `eslint.config.js` (update to v9 flat config)
- [ ] `packages/sms/src/base/BaseSMSProvider.ts`
- [ ] `packages/sms/src/manager/SMSManager.ts`
- [ ] `packages/sms/src/middleware/RateLimitMiddleware.ts`
- [ ] `packages/sms/src/providers/AWSSNSProvider.ts`
- [ ] `packages/sms/src/providers/MessageBirdProvider.ts`
- [ ] `packages/sms/src/providers/MobileMessageProvider.ts`
- [ ] `packages/sms/src/providers/TwilioProvider.ts`
- [ ] `packages/sms/src/services/SMSWebhookService.ts`

#### Verification:
```bash
pnpm lint
# Should pass with no errors
```

---

## 🟡 HIGH - Fix Within 24-48 Hours (Day 2)

### 3. Fix Pre-commit Hooks
**Time Estimate:** 1 hour  
**Impact:** Developer workflow disrupted

#### Steps:

```bash
# Step 1: Update Husky config
# Remove deprecated lines from .husky/pre-commit

#!/usr/bin/env sh
pnpm lint-staged

# Step 2: Ensure lint-staged only runs after lint passes
# package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}

# Step 3: Test
git add .
git commit -m "test commit"
# Should run lint-staged successfully
```

---

### 4. Fix Test Configuration
**Time Estimate:** 1 hour  
**Impact:** Cannot run tests

#### Steps:

```typescript
// apps/api/src/test/setup.ts
import { afterEach, beforeEach } from 'vitest';

// ... rest of setup
```

#### Verification:
```bash
pnpm test
# All test suites should run
```

---

### 5. Standardize Dependencies
**Time Estimate:** 1 hour  
**Impact:** Type inconsistencies, potential bugs

#### Steps:

```bash
# Standardize Zod to v4
pnpm -r update zod@4.2.1

# Verify no breaking changes
pnpm build
pnpm test
```

---

## 🟢 MEDIUM - Fix This Week (Days 3-5)

### 6. Security Audit
**Time Estimate:** 2-4 hours  
**Impact:** Unknown vulnerabilities

```bash
# Run audit
pnpm audit

# Fix vulnerabilities
pnpm audit --fix

# Review remaining issues
pnpm audit --json > audit-report.json
```

---

### 7. Test Coverage Analysis
**Time Estimate:** 4 hours  
**Impact:** Unknown code quality

```bash
# Generate coverage
pnpm test:coverage

# Analyze critical untested paths
# Priority areas:
# - SMS sending logic
# - Plugin data transformations
# - Token validation
# - Authentication flows
# - RLS enforcement
```

---

### 8. Code Refactoring
**Time Estimate:** 6-8 hours  
**Impact:** Maintainability

#### Priority Files:
1. `apps/api/src/routes/plugins.ts` - Extract error handling
2. `apps/api/src/routes/tokens.ts` - Create context helpers
3. `packages/sms/src/providers/AWSSNSProvider.ts` - Complete or remove

---

## 🔵 LOW - Next Sprint

### 9. Documentation
**Time Estimate:** 1-2 days

- [ ] API endpoint documentation (Swagger/OpenAPI)
- [ ] Database ERD generation
- [ ] Deployment guide
- [ ] Architecture Decision Records (ADRs)

---

### 10. Infrastructure
**Time Estimate:** 4-8 hours

```dockerfile
# Create Dockerfile for API
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN npm install -g pnpm@9.15.0
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm build

# Start
EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
```

```yaml
# docker-compose.yml for local development
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    depends_on:
      - postgres
  
  postgres:
    image: supabase/postgres
    environment:
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
```

---

## Daily Checklist Format

### Day 1: Critical Fixes
- [ ] Morning: Fix API build errors (4-6 hours)
- [ ] Afternoon: Fix ESLint configuration (2-3 hours)
- [ ] EOD: Verify builds pass, commit progress

### Day 2: High Priority
- [ ] Morning: Fix pre-commit hooks (1 hour)
- [ ] Mid-morning: Fix test configuration (1 hour)
- [ ] Afternoon: Standardize dependencies (1 hour)
- [ ] Late afternoon: Security audit (2-4 hours)
- [ ] EOD: Run full test suite

### Day 3: Testing & Coverage
- [ ] Morning: Generate coverage reports
- [ ] Afternoon: Write missing tests for critical paths
- [ ] EOD: Aim for 60%+ coverage

### Day 4: Refactoring
- [ ] Full day: Refactor priority files
- [ ] Focus on error handling patterns
- [ ] Extract common utilities

### Day 5: Documentation & Verification
- [ ] Morning: Generate API docs
- [ ] Afternoon: Database ERD
- [ ] EOD: Full system verification

---

## Success Criteria

### Must Pass Before Production:
✅ All packages build without TypeScript errors  
✅ All tests pass  
✅ ESLint passes with no errors  
✅ Pre-commit hooks work  
✅ Security audit shows no critical vulnerabilities  
✅ Test coverage > 60% for critical paths  
✅ API documentation complete  
✅ Deployment guide written  
✅ Docker configuration tested  

---

## Emergency Escalation

### If Blocked:
1. **Build Errors Still Present**
   - Review tsconfig.json path mappings
   - Check package.json exports
   - Verify build order in turbo.json

2. **ESLint Issues Persist**
   - Consider disabling problematic rules temporarily
   - Focus on critical errors first
   - Warnings can be addressed later

3. **Tests Failing**
   - Isolate failing tests
   - Check environment setup
   - Review mock configurations

4. **Time Overrun**
   - Prioritize build fixes over everything
   - Code quality can be improved iteratively
   - Documentation can be written in parallel

---

## Communication Plan

### Daily Standups:
- What was completed yesterday
- What's planned for today
- Any blockers

### Deliverables:
- **Day 1 EOD:** Building API package
- **Day 2 EOD:** Clean lint, passing tests
- **Day 3 EOD:** Coverage report, security audit
- **Day 4 EOD:** Refactored code
- **Day 5 EOD:** Complete documentation

---

## Tools & Resources

### Required Tools:
```bash
# Install globally if needed
npm install -g pnpm@9.15.0
npm install -g @supabase/cli

# Project tools (already in package.json)
# - Turbo for builds
# - Vitest for testing
# - ESLint for linting
# - Prettier for formatting
```

### Useful Commands:
```bash
# Clean rebuild
pnpm clean && pnpm install && pnpm build

# Run specific package tests
pnpm --filter @dashboard-link/sms test

# Lint specific package
pnpm --filter @dashboard-link/api lint

# Generate coverage
pnpm --filter @dashboard-link/sms test:coverage
```

---

**Next Steps:** Begin with Day 1 tasks immediately.  
**Review Frequency:** Daily progress review, adjust plan as needed.  
**Completion Target:** End of Week 1 for critical + high priority items.
