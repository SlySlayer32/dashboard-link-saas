# Contributing to CleanConnect

> **98% open. Zero downloads.**

Thank you for your interest in contributing to CleanConnect! This document provides guidelines for contributing to the project.

---

## 🌟 How Can I Contribute?

### Reporting Bugs

If you find a bug, please create an issue with:

- **Clear title** describing the problem
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details** (OS, browser, Node version)

**Template:**
```
**Bug Description:**
[Clear description]

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Environment:**
- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Node: [e.g., 18.17.0]
```

### Suggesting Features

Feature suggestions are welcome! Please create an issue with:

- **Clear use case** - Why is this feature needed?
- **Proposed solution** - How would it work?
- **Alternatives considered** - What other approaches did you think about?
- **Business value** - Who benefits and how?

### Pull Requests

We love pull requests! Here's how to submit one:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** (see Code Style below)
4. **Test your changes** (`pnpm test`, `pnpm lint`)
5. **Commit with clear messages** (see Commit Messages below)
6. **Push to your fork** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request** with description of changes

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js** 18+ ([Install Node.js](https://nodejs.org/))
- **pnpm** 9+ ([Install pnpm](https://pnpm.io/installation))
- **Git** ([Install Git](https://git-scm.com/))
- **Supabase account** (free tier) ([Sign up](https://supabase.com/))
- **MobileMessage.com.au account** (for SMS, optional for development)

### Installation Steps

1. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/dashboard-link-saas.git
   cd dashboard-link-saas
   ```

2. **Install pnpm** (if not already installed)
   ```bash
   npm install -g pnpm
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

5. **Set up Supabase database**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy `packages/database/migrations/001_initial_schema.sql`
   - Paste into Supabase SQL Editor and execute
   - (Optional) Run seed data from `packages/database/seed.sql`

6. **Start development servers**
   ```bash
   pnpm dev
   ```

   This starts:
   - Admin app: http://localhost:5173
   - Worker app: http://localhost:5174
   - API server: http://localhost:3000

### Environment Variables

Create `.env` in the root directory:

```bash
# App URLs
APP_URL=http://localhost:5173
WORKER_APP_URL=http://localhost:5174
API_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# MobileMessage.com.au SMS (optional for development)
MOBILEMESSAGE_USERNAME=your-username
MOBILEMESSAGE_PASSWORD=your-password
MOBILEMESSAGE_SENDER_ID=DashLink

# Plugin Credentials (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
AIRTABLE_API_KEY=your-api-key
NOTION_INTEGRATION_SECRET=your-integration-secret
```

---

## 📝 Code Style & Conventions

### TypeScript

- ✅ **Use TypeScript** for all new code
- ✅ **Strict mode enabled** - no `any` types unless absolutely necessary
- ✅ **Explicit return types** for public functions
- ✅ **Interfaces over types** for object shapes

**Example:**
```typescript
// ✅ Good
interface Worker {
  id: string;
  name: string;
  phone: string;
}

export function getWorker(id: string): Promise<Worker> {
  // ...
}

// ❌ Avoid
type Worker = {
  id: any,
  name: any,
  phone: any
}

function getWorker(id) {
  // ...
}
```

### React Components

- ✅ **Functional components** with hooks
- ✅ **Named exports** for components
- ✅ **Props interfaces** above component
- ✅ **Destructure props** in function signature

**Example:**
```typescript
// ✅ Good
interface WorkerCardProps {
  worker: Worker;
  onEdit: (id: string) => void;
}

export function WorkerCard({ worker, onEdit }: WorkerCardProps) {
  return (
    <div onClick={() => onEdit(worker.id)}>
      {worker.name}
    </div>
  );
}

// ❌ Avoid
export default function WorkerCard(props) {
  return <div>{props.worker.name}</div>;
}
```

### File Naming

- ✅ **kebab-case** for files: `worker-card.tsx`, `use-workers.ts`
- ✅ **PascalCase** for components: `WorkerCard.tsx`
- ✅ **camelCase** for utilities: `formatPhone.ts`

### Code Organization

```
src/
├── components/       # React components
│   ├── WorkerCard.tsx
│   └── WorkerList.tsx
├── hooks/           # Custom React hooks
│   └── use-workers.ts
├── services/        # Business logic
│   └── worker-service.ts
├── types/           # TypeScript types
│   └── worker.ts
├── utils/           # Helper functions
│   └── format-phone.ts
└── App.tsx          # Root component
```

### API Routes (Hono.js)

- ✅ **RESTful conventions**
- ✅ **Middleware for auth**
- ✅ **Proper HTTP status codes**
- ✅ **Error handling**

**Example:**
```typescript
// ✅ Good
app.get('/workers/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const worker = await getWorker(id);
    
    if (!worker) {
      return c.json({ error: 'Worker not found' }, 404);
    }
    
    return c.json(worker, 200);
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});
```

---

## ✅ Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests for specific package
pnpm --filter @cleanconnect/api test
```

### Writing Tests

- ✅ Test files: `*.test.ts` or `*.test.tsx`
- ✅ One test file per source file
- ✅ Use descriptive test names

**Example:**
```typescript
import { describe, it, expect } from 'vitest';
import { formatPhone } from './format-phone';

describe('formatPhone', () => {
  it('should format Australian mobile numbers', () => {
    expect(formatPhone('0412345678')).toBe('+61412345678');
  });

  it('should handle numbers with spaces', () => {
    expect(formatPhone('0412 345 678')).toBe('+61412345678');
  });

  it('should return null for invalid numbers', () => {
    expect(formatPhone('invalid')).toBeNull();
  });
});
```

---

## 🏗️ Building & Linting

### Build

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @cleanconnect/admin build
```

### Linting

```bash
# Lint all code
pnpm lint

# Auto-fix linting issues
pnpm lint:fix
```

### Type Checking

```bash
# Type check all packages
pnpm typecheck
```

---

## 📋 Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear commit history.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring (no functional changes)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, tooling changes

### Examples

```bash
# New feature
git commit -m "feat(admin): add worker bulk import from CSV"

# Bug fix
git commit -m "fix(api): prevent duplicate SMS sends for same worker"

# Documentation
git commit -m "docs: update CONTRIBUTING.md with testing guidelines"

# Refactoring
git commit -m "refactor(plugins): extract common adapter logic to base class"
```

---

## 🎯 Pull Request Guidelines

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Types check (`pnpm typecheck`)
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow conventions

### PR Description Template

```markdown
## Description
[Clear description of what this PR does]

## Motivation
[Why is this change needed? What problem does it solve?]

## Changes Made
- [ ] Change 1
- [ ] Change 2
- [ ] Change 3

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Testing
- [ ] Unit tests added/updated
- [ ] Manually tested in browser
- [ ] Tested on mobile

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or documented if necessary)
```

### Review Process

1. **Automated checks run** (tests, linting, build)
2. **Code review** by maintainer
3. **Discussion/changes** if needed
4. **Approval and merge**

We aim to review PRs within 48 hours.

---

## 🔌 Adding a New Plugin

Want to add a new data source integration? Here's how:

### 1. Create Plugin Adapter

Create `packages/plugins/src/adapters/your-plugin.ts`:

```typescript
import { BaseAdapter, ScheduleItem, TaskItem } from './base-adapter';

export class YourPluginAdapter extends BaseAdapter {
  id = 'your-plugin';
  name = 'Your Plugin';
  description = 'Integrate with Your Service';
  version = '1.0.0';

  async getTodaySchedule(workerId: string, config: any): Promise<ScheduleItem[]> {
    // Fetch schedule from your API
    return [];
  }

  async getTodayTasks(workerId: string, config: any): Promise<TaskItem[]> {
    // Fetch tasks from your API
    return [];
  }

  async validateConfig(config: any): Promise<boolean> {
    // Validate plugin configuration
    return true;
  }
}
```

### 2. Register Plugin

In `packages/plugins/src/registry.ts`:

```typescript
import { YourPluginAdapter } from './adapters/your-plugin';

// Add to registry
registry.register(new YourPluginAdapter());
```

### 3. Add Tests

Create `packages/plugins/src/adapters/your-plugin.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { YourPluginAdapter } from './your-plugin';

describe('YourPluginAdapter', () => {
  it('should fetch schedule items', async () => {
    const adapter = new YourPluginAdapter();
    const items = await adapter.getTodaySchedule('worker-id', {});
    expect(Array.isArray(items)).toBe(true);
  });
});
```

### 4. Document Plugin

Add to `README.md` and `docs/PLUGINS.md` (if exists).

---

## 🐛 Debugging Tips

### Frontend Debugging

**React DevTools:**
- Install [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) browser extension
- Inspect component props, state, and hooks

**TanStack Query DevTools:**
- Already included in development mode
- Check cache state, refetch timing

**Console Logging:**
```typescript
console.log('[WorkerCard]', { worker, props });
```

### Backend Debugging

**Hono.js Logs:**
```typescript
app.use('*', async (c, next) => {
  console.log(`[${c.req.method}] ${c.req.url}`);
  await next();
});
```

**Supabase Logs:**
- Check Supabase Dashboard → Logs
- SQL queries, errors, and RLS policy issues

**Testing API Endpoints:**
```bash
# Using curl
curl http://localhost:3000/api/workers

# Using httpie (better formatting)
http GET localhost:3000/api/workers
```

---

## 📚 Resources

### Documentation

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Hono.js Documentation](https://hono.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Turborepo Documentation](https://turbo.build/repo/docs)

### Learning Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Monorepo Best Practices](https://monorepo.tools/)

---

## 🤝 Code of Conduct

### Our Standards

- ✅ Be respectful and inclusive
- ✅ Welcome newcomers and beginners
- ✅ Give constructive feedback
- ✅ Focus on what's best for the project
- ❌ No harassment, discrimination, or trolling

### Enforcement

Violations of the code of conduct may result in:
1. Warning
2. Temporary ban from contributing
3. Permanent ban for serious or repeated violations

Report issues to [your contact email].

---

## ❓ Questions?

- 📖 Check [README.md](./README.md) for setup help
- 🏗️ Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design questions
- 🔬 Check [RESEARCH.md](./RESEARCH.md) for technology choice context
- 💬 Open a GitHub Discussion for general questions
- 🐛 Open a GitHub Issue for bugs or feature requests

---

## 🙏 Thank You!

Every contribution, big or small, helps make CleanConnect better. We appreciate your time and effort!

**Built by Jacob Merlin** | December 2025  
*Embracing open collaboration and modern development practices*
