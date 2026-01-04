---
name: naming-conventions
description: Comprehensive naming conventions guide for Dashboard Link SaaS codebase. Use when creating new files, renaming files, defining variables/functions/types, or when user asks about "proper naming", "what should I call this?", "naming standards", "PascalCase vs camelCase", or any naming-related questions. Essential for maintaining consistency across the monorepo.
---

# Naming Conventions

## Overview

Enforces consistent naming patterns across the Dashboard Link SaaS monorepo for files, components, variables, functions, types, and more.

## File Naming

### React Components
```
PascalCase.tsx
```
**Examples:**
- ✅ `WorkerList.tsx`
- ✅ `SendSMSButton.tsx`
- ✅ `DashboardCard.tsx`
- ❌ `workerList.tsx`
- ❌ `send-sms-button.tsx`

### Pages
```
PascalCasePage.tsx
```
**Examples:**
- ✅ `WorkersPage.tsx`
- ✅ `DashboardPage.tsx`
- ✅ `SettingsPage.tsx`
- ❌ `Workers.tsx` (no Page suffix)
- ❌ `workers-page.tsx`

### Custom Hooks
```
useCamelCase.ts
```
**Examples:**
- ✅ `useWorkers.ts`
- ✅ `useAuth.ts`
- ✅ `useDashboardData.ts`
- ❌ `UseWorkers.ts`
- ❌ `workers-hook.ts`

### Services
```
camelCase.ts
```
**Examples:**
- ✅ `workerService.ts`
- ✅ `smsService.ts`
- ✅ `tokenService.ts`
- ❌ `WorkerService.ts`
- ❌ `worker-service.ts`

### Types
```
camelCaseTypes.ts
```
**Examples:**
- ✅ `workerTypes.ts`
- ✅ `dashboardTypes.ts`
- ✅ `pluginTypes.ts`
- ❌ `WorkerTypes.ts`
- ❌ `worker-types.ts`
- ❌ `types.ts` (too generic)

### Utils
```
camelCaseUtils.ts
```
**Examples:**
- ✅ `dateUtils.ts`
- ✅ `phoneUtils.ts`
- ✅ `validationUtils.ts`
- ❌ `DateUtils.ts`
- ❌ `date-utils.ts`
- ❌ `utils.ts` (too generic)

### Adapters (Zapier Pattern)
```
PascalCaseAdapter.ts
```
**Examples:**
- ✅ `GoogleCalendarAdapter.ts`
- ✅ `MobileMessageAdapter.ts`
- ✅ `AirtableAdapter.ts`
- ❌ `googleCalendarAdapter.ts`
- ❌ `google-calendar-adapter.ts`

### Contracts/Interfaces
```
PascalCase.ts (no suffix)
```
**Examples:**
- ✅ `SMSProvider.ts`
- ✅ `PluginAdapter.ts`
- ✅ `Repository.ts`
- ❌ `SMSProviderInterface.ts`
- ❌ `IPluginAdapter.ts`

## Code Naming

### Variables
```typescript
// camelCase for regular variables
const userName = 'John';
const phoneNumber = '+61412345678';
const isLoading = true;

// SCREAMING_SNAKE_CASE for constants
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;

// Booleans: use is/has/should prefix
const isAuthenticated = true;
const hasPermission = false;
const shouldRedirect = true;
```

### Functions
```typescript
// camelCase for functions
function getUserById(id: string) { }
function createWorker(data: WorkerData) { }
function sendSMS(phone: string, message: string) { }

// Event handlers: handle prefix
const handleClick = () => { };
const handleSubmit = (e: FormEvent) => { };
const handleChange = (value: string) => { };
```

### React Components
```typescript
// PascalCase for components
export const WorkerList: React.FC<Props> = () => { };
export const SendSMSButton: React.FC<ButtonProps> = () => { };

// Props interface: ComponentNameProps
interface WorkerListProps {
  organizationId: string;
}

interface SendSMSButtonProps {
  workerId: string;
  disabled?: boolean;
}
```

### TypeScript Interfaces & Types
```typescript
// PascalCase for interfaces
interface Worker {
  id: string;
  name: string;
  phone: string;
}

interface DashboardConfig {
  theme: string;
  layout: string;
}

// PascalCase for types
type WorkerStatus = 'active' | 'inactive' | 'pending';
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// Use 'I' prefix ONLY for contracts/adapters pattern
interface IPluginAdapter { } // ❌ Don't use I prefix generally
interface PluginAdapter { }   // ✅ Just use the name
```

### Classes
```typescript
// PascalCase for classes
class WorkerService {
  createWorker() { }
  updateWorker() { }
}

class GoogleCalendarAdapter {
  getSchedule() { }
}

// Private members: _ prefix
class UserService {
  private _cache: Map<string, User>;
  
  private _validateUser(user: User) { }
}
```

### Enums
```typescript
// PascalCase for enum name and values
enum WorkerStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Pending = 'PENDING'
}

enum HTTPMethod {
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Delete = 'DELETE'
}
```

## Package Naming

### Package Names (package.json)
```
@dashboard-link/package-name
```
**Examples:**
- ✅ `@dashboard-link/ui`
- ✅ `@dashboard-link/auth`
- ✅ `@dashboard-link/database`
- ❌ `@dashboard-link/UI`
- ❌ `@dashboard-link/Auth_Package`

### Folder Names
```
kebab-case for folders
```
**Examples:**
- ✅ `apps/admin/`
- ✅ `packages/sms/`
- ✅ `packages/shared-utils/`
- ❌ `apps/Admin/`
- ❌ `packages/SMS/`
- ❌ `packages/shared_utils/`

## Database Naming

### Tables
```
snake_case, plural
```
**Examples:**
- ✅ `workers`
- ✅ `organizations`
- ✅ `dashboard_tokens`
- ❌ `Workers`
- ❌ `worker` (singular)
- ❌ `dashboardTokens`

### Columns
```
snake_case
```
**Examples:**
- ✅ `organization_id`
- ✅ `phone_number`
- ✅ `created_at`
- ❌ `organizationId`
- ❌ `PhoneNumber`

### Foreign Keys
```
table_id
```
**Examples:**
- ✅ `organization_id`
- ✅ `worker_id`
- ✅ `plugin_id`
- ❌ `org_id` (don't abbreviate)
- ❌ `organizationID`

## API Routes

### Endpoints
```
/kebab-case
```
**Examples:**
- ✅ `/api/workers`
- ✅ `/api/dashboard-tokens`
- ✅ `/api/sms/send`
- ❌ `/api/Workers`
- ❌ `/api/dashboardTokens`
- ❌ `/api/sms_send`

### Route Files
```
camelCase.ts
```
**Examples:**
- ✅ `workers.ts`
- ✅ `dashboardTokens.ts`
- ✅ `sms.ts`
- ❌ `Workers.ts`
- ❌ `dashboard-tokens.ts`

## Environment Variables

```
SCREAMING_SNAKE_CASE with PREFIX
```

**Prefixes:**
- `APP_` - Application config
- `SUPABASE_` - Supabase config
- `SMS_` - SMS service config
- `DATABASE_` - Database config

**Examples:**
- ✅ `APP_NAME`
- ✅ `SUPABASE_URL`
- ✅ `SMS_API_KEY`
- ✅ `DATABASE_URL`
- ❌ `appName`
- ❌ `supabase_url`
- ❌ `SmsApiKey`

## CSS Classes (Tailwind)

```
kebab-case for custom classes
Use Tailwind utilities as-is
```

**Examples:**
```tsx
// ✅ Tailwind utilities
<div className="flex items-center gap-4 bg-blue-500" />

// ✅ Custom classes (if needed)
<div className="worker-card dashboard-layout" />

// ❌ Don't use these styles
<div className="WorkerCard dashboardLayout" />
<div className="worker_card dashboard_layout" />
```

## Git Commit Messages

```
type: lowercase description
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `test:` - Tests
- `chore:` - Maintenance

**Examples:**
- ✅ `feat: add worker dashboard page`
- ✅ `fix: resolve SMS sending timeout`
- ✅ `refactor: extract adapter pattern`
- ❌ `Feat: Add worker dashboard`
- ❌ `Fixed SMS bug`
- ❌ `Update stuff`

## Quick Reference Table

| Type | Convention | Example |
|------|-----------|---------|
| React Component | PascalCase.tsx | `WorkerList.tsx` |
| Page | PascalCasePage.tsx | `WorkersPage.tsx` |
| Hook | useCamelCase.ts | `useWorkers.ts` |
| Service | camelCase.ts | `workerService.ts` |
| Types | camelCaseTypes.ts | `workerTypes.ts` |
| Utils | camelCaseUtils.ts | `dateUtils.ts` |
| Adapter | PascalCaseAdapter.ts | `GoogleCalendarAdapter.ts` |
| Variable | camelCase | `userName` |
| Constant | SCREAMING_SNAKE_CASE | `API_BASE_URL` |
| Function | camelCase | `getUserById` |
| Event Handler | handleCamelCase | `handleClick` |
| Interface | PascalCase | `Worker` |
| Type | PascalCase | `WorkerStatus` |
| Class | PascalCase | `WorkerService` |
| Enum | PascalCase | `WorkerStatus` |
| Package | @org/kebab-case | `@dashboard-link/ui` |
| Folder | kebab-case | `shared-utils/` |
| Table | snake_case (plural) | `workers` |
| Column | snake_case | `organization_id` |
| API Route | /kebab-case | `/api/workers` |
| Env Var | SCREAMING_SNAKE_CASE | `SUPABASE_URL` |

## Common Mistakes to Avoid

### ❌ Mixing Conventions
```typescript
// Bad - Mixing camelCase and PascalCase
const WorkerData = { name: 'John' };
function GetUser(id: string) { }

// Good - Consistent conventions
const workerData = { name: 'John' };
function getUser(id: string) { }
```

### ❌ Inconsistent File Names
```
// Bad
WorkerList.tsx
worker-service.ts
workerTypes.ts

// Good - All follow their conventions
WorkerList.tsx
workerService.ts
workerTypes.ts
```

### ❌ Too Generic Names
```typescript
// Bad
interface Data { }
function process() { }
const utils.ts

// Good - Specific names
interface WorkerData { }
function processWorkerData() { }
const workerUtils.ts
```

### ❌ Abbreviations
```typescript
// Bad
const org = getOrganization();
const usr = getUser();
const msg = 'Hello';

// Good - Full names
const organization = getOrganization();
const user = getUser();
const message = 'Hello';
```

## When in Doubt

1. **Check existing code** - Follow patterns already in the codebase
2. **Be consistent** - Same type of thing = same naming pattern
3. **Be descriptive** - Name should explain what it is
4. **Be concise** - But not at expense of clarity
5. **Follow conventions** - Don't invent new patterns

## Resources

See `references/naming-examples.md` for comprehensive examples from the codebase.

## Best Practices

- Use descriptive names over short names
- Consistency > personal preference
- Follow established patterns in the codebase
- When renaming, update ALL references
- Use find-and-replace for consistency
- Don't abbreviate unless universally understood (HTTP, API, URL, etc.)
