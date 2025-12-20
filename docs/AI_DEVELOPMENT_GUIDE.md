# AI Development Guide - CleanConnect

> **98% open. Zero downloads.**

A guide for using AI tools (GitHub Copilot, Cursor, ChatGPT) to contribute to CleanConnect effectively.

---

## 🤖 Why This Guide?

CleanConnect was built with **AI-assisted development** using GitHub Copilot. This guide helps you:

1. ✅ **Continue development** using the same AI-assisted approach
2. ✅ **Understand the codebase context** to give AI tools better prompts
3. ✅ **Avoid common pitfalls** when using AI for coding
4. ✅ **Maximize productivity** with proven patterns and examples

**Philosophy:** AI tools are **force multipliers**, not replacements for thinking. Use them to accelerate, not to avoid understanding.

---

## 🛠️ Recommended AI Tools

### 1. GitHub Copilot (Primary)

**What it's for:** In-editor code completion and suggestions

**Best for:**
- ✅ Writing boilerplate code
- ✅ Completing repetitive patterns
- ✅ Generating TypeScript interfaces
- ✅ Creating React components
- ✅ Writing tests

**How to use:**
- Write clear comments describing what you need
- Accept/reject suggestions with Tab/Esc
- Use Ctrl+Enter for multiple suggestions
- Iterate on prompts if first suggestion isn't right

**Cost:** $10/month (or free with student/open source accounts)

### 2. Cursor (Alternative)

**What it's for:** AI-powered code editor (VS Code fork)

**Best for:**
- ✅ Whole-file rewrites
- ✅ Refactoring large sections
- ✅ Chat-based code generation
- ✅ Debugging with AI assistance

**How to use:**
- Cmd+K for inline edits
- Cmd+L for chat panel
- @-mention files for context
- Ask questions about code

**Cost:** $20/month (free tier available)

### 3. ChatGPT / Claude (Research & Planning)

**What it's for:** Architecture discussions, research, complex problem-solving

**Best for:**
- ✅ Technology research and comparisons
- ✅ Architecture planning
- ✅ Complex algorithm design
- ✅ Documentation writing
- ✅ Learning new concepts

**How to use:**
- Provide clear context about the problem
- Ask for reasoning, not just solutions
- Iterate on responses
- Verify factual claims

**Cost:** Free tier available, $20/month for Plus

---

## 📁 Codebase Context for AI

To get the best results from AI tools, provide context about CleanConnect's architecture:

### High-Level Context

```
CleanConnect is a multi-tenant SaaS platform that delivers personalized 
daily dashboards to workers via SMS. 

Architecture:
- Admin portal (React + Vite + TanStack Query)
- Worker dashboard (React + Vite, mobile-optimized)
- API server (Hono.js, edge-compatible)
- Database (Supabase PostgreSQL with RLS)
- Plugin system (adapter pattern for external integrations)

Key constraints:
- Multi-tenant with complete data isolation (Row Level Security)
- Token-based auth for workers (no passwords)
- Mobile-first UI for workers
- Extensible plugin architecture
```

### File Structure Context

```
dashboard-link-saas/
├── apps/
│   ├── admin/          # Admin portal (React + Vite)
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── pages/        # Page components
│   │   │   └── services/     # API client logic
│   │   └── package.json
│   ├── worker/         # Worker dashboard (React + Vite)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   └── pages/
│   │   └── package.json
│   └── api/            # Hono.js API server
│       ├── src/
│       │   ├── routes/       # API route handlers
│       │   ├── services/     # Business logic
│       │   └── middleware/   # Auth, rate limiting, etc.
│       └── package.json
├── packages/
│   ├── plugins/        # Plugin adapter system
│   ├── database/       # Schema, migrations, seed data
│   ├── shared/         # Common types & utilities
│   └── ui/             # Shared React components
└── docs/               # Documentation
```

---

## 💡 Example Prompts & Workflows

### 1. Adding a New API Endpoint

**Scenario:** You need to add a new endpoint to fetch worker statistics.

**Prompt (as comment in `apps/api/src/routes/workers.ts`):**

```typescript
// Create a GET endpoint at /workers/:id/stats
// Returns statistics for a worker:
// - Total dashboards sent (count)
// - Last dashboard sent (timestamp)
// - Average open rate (percentage)
// Requires auth middleware
// Returns 404 if worker not found
// Returns 403 if worker belongs to different org
```

**Copilot will generate:**

```typescript
app.get('/workers/:id/stats', authMiddleware, async (c) => {
  try {
    const workerId = c.req.param('id');
    const orgId = c.get('organizationId');
    
    // Verify worker belongs to org
    const worker = await supabase
      .from('workers')
      .select('id')
      .eq('id', workerId)
      .eq('organization_id', orgId)
      .single();
    
    if (!worker.data) {
      return c.json({ error: 'Worker not found' }, 404);
    }
    
    // Get statistics
    const stats = await supabase
      .from('sms_logs')
      .select('created_at, status')
      .eq('worker_id', workerId);
    
    const totalSent = stats.data?.length || 0;
    const lastSent = stats.data?.[0]?.created_at || null;
    const delivered = stats.data?.filter(s => s.status === 'delivered').length || 0;
    const openRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
    
    return c.json({
      totalSent,
      lastSent,
      openRate: Math.round(openRate * 100) / 100
    }, 200);
  } catch (error) {
    console.error('Error fetching worker stats:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});
```

**Review checklist:**
- ✅ Uses auth middleware
- ✅ Checks organization isolation
- ✅ Proper error handling
- ✅ Correct HTTP status codes
- ⚠️ **Review:** Does the query need pagination? Rate limiting?

### 2. Creating a React Component

**Scenario:** You need a component to display worker statistics.

**Prompt (as comment in `apps/admin/src/components/WorkerStats.tsx`):**

```typescript
// Create a WorkerStats component that:
// - Takes workerId as prop
// - Fetches worker stats from /api/workers/:id/stats
// - Uses TanStack Query for data fetching
// - Shows loading skeleton while loading
// - Shows error message if fetch fails
// - Displays: Total Sent, Last Sent (formatted date), Open Rate (percentage with bar)
// - Uses Tailwind CSS for styling
// - TypeScript strict mode
```

**Copilot will generate:**

```typescript
import { useQuery } from '@tanstack/react-query';

interface WorkerStatsProps {
  workerId: string;
}

interface Stats {
  totalSent: number;
  lastSent: string | null;
  openRate: number;
}

export function WorkerStats({ workerId }: WorkerStatsProps) {
  const { data, isLoading, error } = useQuery<Stats>({
    queryKey: ['worker-stats', workerId],
    queryFn: async () => {
      const response = await fetch(`/api/workers/${workerId}/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600">
        Failed to load statistics
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-600">Total Sent</p>
        <p className="text-2xl font-bold">{data?.totalSent}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Last Sent</p>
        <p className="text-lg">
          {data?.lastSent 
            ? new Date(data.lastSent).toLocaleDateString()
            : 'Never'
          }
        </p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Open Rate</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${data?.openRate}%` }}
            />
          </div>
          <span className="text-lg font-semibold">{data?.openRate}%</span>
        </div>
      </div>
    </div>
  );
}
```

**Review checklist:**
- ✅ TypeScript interfaces defined
- ✅ TanStack Query used correctly
- ✅ Loading and error states handled
- ✅ Tailwind CSS for styling
- ⚠️ **Review:** Should it auto-refetch on interval?

### 3. Adding a Database Table

**Scenario:** You need to add a table for tracking dashboard views.

**Prompt (as comment in new migration file):**

```sql
-- Create a dashboard_views table to track when workers open their dashboards
-- Columns:
-- - id (UUID, primary key)
-- - worker_id (UUID, foreign key to workers)
-- - token_id (UUID, foreign key to worker_tokens)
-- - viewed_at (timestamp, when dashboard was opened)
-- - user_agent (text, browser/device info)
-- - ip_address (text, for security tracking)
-- - created_at (timestamp, auto-set)
-- 
-- Indexes:
-- - worker_id, viewed_at (for querying views per worker over time)
-- - token_id (for linking to specific dashboard link)
--
-- RLS:
-- - Only admins from same org can read views
```

**Copilot will generate:**

```sql
CREATE TABLE dashboard_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  token_id UUID NOT NULL REFERENCES worker_tokens(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_dashboard_views_worker_viewed 
  ON dashboard_views(worker_id, viewed_at);
CREATE INDEX idx_dashboard_views_token 
  ON dashboard_views(token_id);

-- Row Level Security
ALTER TABLE dashboard_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY dashboard_views_policy ON dashboard_views
  FOR SELECT
  USING (
    worker_id IN (
      SELECT id FROM workers 
      WHERE organization_id = get_user_organization_id()
    )
  );
```

**Review checklist:**
- ✅ Foreign keys with ON DELETE CASCADE
- ✅ Indexes on frequently queried columns
- ✅ RLS policy using org isolation helper
- ⚠️ **Review:** Do we need a policy for INSERT (who creates views)?

### 4. Creating a New Plugin Adapter

**Scenario:** You need to add a Slack integration plugin.

**Prompt (as comment in `packages/plugins/src/adapters/slack.ts`):**

```typescript
// Create a SlackAdapter that extends BaseAdapter
// 
// Plugin should:
// - ID: 'slack'
// - Name: 'Slack'
// - Description: 'Fetch schedule and tasks from Slack channels'
//
// Config format:
// {
//   botToken: string;      // Slack Bot User OAuth Token
//   channelId: string;     // Slack channel to monitor
// }
//
// getTodaySchedule implementation:
// - Fetch messages from Slack channel for today
// - Parse messages that start with "SCHEDULE:"
// - Extract time, title, location from message format
// - Return as ScheduleItem[]
//
// getTodayTasks implementation:
// - Fetch messages from Slack channel for today
// - Parse messages that start with "TASK:"
// - Extract title, priority from message format
// - Return as TaskItem[]
//
// Use @slack/web-api package
```

**Copilot will generate:**

```typescript
import { BaseAdapter, ScheduleItem, TaskItem } from './base-adapter';
import { WebClient } from '@slack/web-api';

interface SlackConfig {
  botToken: string;
  channelId: string;
}

export class SlackAdapter extends BaseAdapter {
  id = 'slack';
  name = 'Slack';
  description = 'Fetch schedule and tasks from Slack channels';
  version = '1.0.0';

  async getTodaySchedule(workerId: string, config: SlackConfig): Promise<ScheduleItem[]> {
    const client = new WebClient(config.botToken);
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Fetch messages from today
    const result = await client.conversations.history({
      channel: config.channelId,
      oldest: (today.getTime() / 1000).toString(),
      latest: (tomorrow.getTime() / 1000).toString(),
    });
    
    const scheduleItems: ScheduleItem[] = [];
    
    for (const message of result.messages || []) {
      if (message.text?.startsWith('SCHEDULE:')) {
        // Parse: "SCHEDULE: 09:00 | Meeting | Room 5"
        const parts = message.text.replace('SCHEDULE:', '').trim().split('|');
        if (parts.length >= 2) {
          const [time, title, location] = parts.map(p => p.trim());
          
          const startTime = new Date(today);
          const [hours, minutes] = time.split(':');
          startTime.setHours(parseInt(hours), parseInt(minutes));
          
          scheduleItems.push({
            id: message.ts || '',
            title,
            startTime,
            endTime: new Date(startTime.getTime() + 60 * 60 * 1000), // +1 hour
            location: location || null,
            description: null,
          });
        }
      }
    }
    
    return scheduleItems;
  }

  async getTodayTasks(workerId: string, config: SlackConfig): Promise<TaskItem[]> {
    const client = new WebClient(config.botToken);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const result = await client.conversations.history({
      channel: config.channelId,
      oldest: (today.getTime() / 1000).toString(),
      latest: (tomorrow.getTime() / 1000).toString(),
    });
    
    const taskItems: TaskItem[] = [];
    
    for (const message of result.messages || []) {
      if (message.text?.startsWith('TASK:')) {
        // Parse: "TASK: Clean office | HIGH"
        const parts = message.text.replace('TASK:', '').trim().split('|');
        if (parts.length >= 1) {
          const [title, priorityStr] = parts.map(p => p.trim());
          const priority = (priorityStr?.toLowerCase() as 'low' | 'medium' | 'high') || 'medium';
          
          taskItems.push({
            id: message.ts || '',
            title,
            description: null,
            priority,
            status: 'pending',
            dueDate: today,
          });
        }
      }
    }
    
    return taskItems;
  }

  async validateConfig(config: SlackConfig): Promise<boolean> {
    try {
      const client = new WebClient(config.botToken);
      await client.auth.test();
      return true;
    } catch {
      return false;
    }
  }
}
```

**Review checklist:**
- ✅ Extends BaseAdapter
- ✅ Config interface defined
- ✅ Uses official Slack SDK
- ✅ Error handling in validateConfig
- ⚠️ **Review:** Add error handling for API failures
- ⚠️ **Review:** Add tests
- ⚠️ **Review:** Document message format in README

---

## 🎯 Best Practices for AI-Assisted Development

### 1. Write Clear Comments First

**Bad:**
```typescript
// add worker
```

**Good:**
```typescript
// Create a POST endpoint at /workers that:
// 1. Validates request body (name, phone, email optional)
// 2. Formats phone to +61 format
// 3. Checks for duplicate phone in same org
// 4. Inserts worker record
// 5. Returns created worker with 201 status
// 6. Returns 400 if validation fails
// 7. Returns 409 if duplicate phone
```

Clear comments → Better AI suggestions.

### 2. Provide Type Information

**Bad:**
```typescript
function processWorker(data) {
  // AI doesn't know what 'data' is
}
```

**Good:**
```typescript
interface Worker {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

function processWorker(data: Worker) {
  // AI knows exactly what to work with
}
```

### 3. Review AI Suggestions Critically

**Always check:**
- ✅ Does it match our architecture patterns?
- ✅ Does it follow our TypeScript strict mode?
- ✅ Does it handle errors properly?
- ✅ Does it respect RLS policies?
- ✅ Does it have security implications?

**Never blindly accept:**
- ❌ Suggestions that bypass auth
- ❌ Suggestions that hardcode secrets
- ❌ Suggestions that ignore error handling
- ❌ Suggestions that break TypeScript types

### 4. Iterate on Prompts

If first suggestion isn't right, refine your comment:

**First try:**
```typescript
// fetch workers
```

**AI generates basic fetch, missing pagination**

**Second try:**
```typescript
// Fetch workers with pagination (page, perPage)
// Return { workers: Worker[], total: number, page: number, totalPages: number }
// Filter by organization_id from auth context
```

**AI generates proper paginated query**

### 5. Use AI for Learning

Ask AI to explain code:

```typescript
// Explain what this RLS policy does and why it's secure
CREATE POLICY worker_policy ON workers
  FOR ALL
  USING (organization_id = get_user_organization_id());
```

AI will explain the multi-tenant isolation pattern.

---

## 🚫 Common AI Pitfalls (and How to Avoid Them)

### Pitfall 1: AI Suggests Insecure Code

**Example:**
```typescript
// AI might suggest
app.get('/workers/:id', async (c) => {
  const worker = await supabase
    .from('workers')
    .select('*')
    .eq('id', c.req.param('id'))
    .single();
  return c.json(worker.data);
});
```

**Problem:** No auth check! Could leak data between orgs.

**Fix:**
```typescript
app.get('/workers/:id', authMiddleware, async (c) => {
  const orgId = c.get('organizationId'); // From auth middleware
  const worker = await supabase
    .from('workers')
    .select('*')
    .eq('id', c.req.param('id'))
    .eq('organization_id', orgId) // Enforce org isolation
    .single();
  
  if (!worker.data) {
    return c.json({ error: 'Worker not found' }, 404);
  }
  
  return c.json(worker.data);
});
```

### Pitfall 2: AI Generates Outdated Patterns

**Example:**
```typescript
// AI might suggest class components
class WorkerCard extends React.Component {
  // ...
}
```

**Fix:** Specify modern patterns in your prompt
```typescript
// Create a functional WorkerCard component using hooks
```

### Pitfall 3: AI Ignores TypeScript Strict Mode

**Example:**
```typescript
// AI might suggest
function formatPhone(phone: any) {
  return '+61' + phone;
}
```

**Fix:** Specify strict typing
```typescript
// Create a formatPhone function
// Input: string (Australian phone number)
// Output: string | null (formatted or null if invalid)
// Use TypeScript strict mode (no 'any' types)
```

### Pitfall 4: AI Generates Untested Code

**Example:** AI generates a complex function without tests.

**Fix:** Always ask for tests
```typescript
// Create a formatPhone function
// [... function spec ...]
// Also create a test file with test cases:
// - Valid 04 number
// - Number with spaces
// - Invalid number
// - Empty string
```

---

## 📚 File-by-File AI Context Guide

When working on specific files, provide this context to AI:

### `apps/api/src/routes/workers.ts`

**Context:**
```
This file handles CRUD operations for workers.
- All routes use authMiddleware for authentication
- All queries filter by organization_id for multi-tenancy
- Uses Supabase client for database operations
- Returns proper HTTP status codes (200, 201, 400, 404, 500)
- Phone numbers must be in +61 format
- Validate input before database operations
```

### `apps/admin/src/components/*.tsx`

**Context:**
```
React components for admin portal.
- Use functional components with hooks
- Props interfaces defined before component
- Use TanStack Query for data fetching
- Use Tailwind CSS for styling
- Include loading and error states
- TypeScript strict mode (no 'any' types)
```

### `packages/plugins/src/adapters/*.ts`

**Context:**
```
Plugin adapters extend BaseAdapter.
- Must implement: getTodaySchedule, getTodayTasks
- Should implement: validateConfig
- Optionally implement: handleWebhook
- Return ScheduleItem[] and TaskItem[] in standard format
- Handle API errors gracefully (return empty array, don't throw)
- Document config format in comments
```

### `packages/database/migrations/*.sql`

**Context:**
```
SQL migrations for Supabase PostgreSQL.
- Include proper foreign keys with ON DELETE CASCADE
- Add indexes for frequently queried columns
- Enable RLS on all tables
- Create RLS policies using get_user_organization_id() helper
- Use UUID for primary keys
- Include created_at and updated_at timestamps
```

---

## 🎓 Learning Resources

### For AI-Assisted Development
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Cursor Documentation](https://cursor.sh/docs)
- [Effective Prompting for Developers](https://github.blog/2023-06-20-how-to-write-better-prompts-for-github-copilot/)

### For CleanConnect Stack
- [Hono.js Docs](https://hono.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Turborepo Docs](https://turbo.build/repo/docs)

---

## ✅ Quick Reference

### Starting a New Feature

1. **Understand the requirement**
   - What problem are we solving?
   - Who is the user?
   
2. **Plan the implementation**
   - What files need to change?
   - What new files need to be created?
   
3. **Write clear prompts as comments**
   - Describe inputs, outputs, edge cases
   - Specify technologies and patterns to use
   
4. **Review AI suggestions**
   - Does it match our architecture?
   - Does it handle errors?
   - Does it follow our conventions?
   
5. **Test thoroughly**
   - Manual testing
   - Write automated tests
   
6. **Document**
   - Update README if public API changed
   - Add comments for complex logic

### Code Review Checklist

When reviewing AI-generated code:

- [ ] Uses TypeScript strict mode (no `any`)
- [ ] Includes proper error handling
- [ ] Respects organization isolation (RLS/org_id checks)
- [ ] Uses auth middleware where needed
- [ ] Follows our naming conventions
- [ ] Includes loading/error states (React)
- [ ] Returns proper HTTP status codes (API)
- [ ] Has tests (or test plan)
- [ ] No hardcoded secrets
- [ ] No security vulnerabilities

---

## 🙋 Questions?

**For AI tool help:**
- GitHub Copilot: Check [official docs](https://docs.github.com/en/copilot)
- Cursor: Check [Cursor docs](https://cursor.sh/docs)

**For CleanConnect architecture:**
- See [ARCHITECTURE.md](../ARCHITECTURE.md)
- See [DEVELOPMENT_JOURNEY.md](./DEVELOPMENT_JOURNEY.md)

**For contributing:**
- See [CONTRIBUTING.md](../CONTRIBUTING.md)

---

**Built by Jacob Merlin** | December 2025  
*Embracing AI as a force multiplier for solo developers*
