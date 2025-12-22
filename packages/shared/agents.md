# Shared Package Guidelines

When working with files in this directory:

## Purpose
Common TypeScript types, utilities, and constants shared across all applications in the CleanConnect monorepo.

## Exports
- TypeScript types (Worker, Organization, Dashboard, etc.)
- Phone number utilities (AU formatting/validation)
- Date utilities (today range, formatting)
- API response types
- Validation schemas

## File Naming Conventions
- Types: camelCase with "Types" suffix (e.g., `workerTypes.ts`)
- Utils: camelCase with "Utils" suffix (e.g., `dateUtils.ts`)
- Constants: camelCase (e.g., `apiConstants.ts`)
- Schemas: camelCase (e.g., `validationSchemas.ts`)

## Folder Structure
```
src/
├── types/           # TypeScript type definitions
│   ├── worker.ts
│   ├── organization.ts
│   ├── dashboard.ts
│   └── api.ts
├── utils/           # Utility functions
│   ├── date.ts
│   ├── phone.ts
│   └── validation.ts
├── constants/       # Shared constants
│   └── api.ts
└── index.ts         # Main export file
```

## Code Patterns

### Type Definitions
```typescript
// Use interfaces for object shapes
export interface Worker {
  id: string;
  name: string;
  phone: string;
  email: string;
  active: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

// Use types for unions, computed types, or utility types
export type WorkerStatus = 'active' | 'inactive';
export type CreateWorkerRequest = Omit<Worker, 'id' | 'createdAt' | 'updatedAt'>;

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}
```

### Utility Functions
```typescript
// Pure functions only - no side effects
export const formatAustralianPhone = (phone: string): string => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (digits.startsWith('61')) {
    return `+${digits}`;
  } else if (digits.startsWith('04')) {
    return `+61${digits.substring(1)}`;
  }
  
  return phone;
};

export const getTodayRange = (timezone?: string) => {
  const now = timezone ? new Date(new Date().toLocaleString("en-US", {timeZone: timezone})) : new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start, end };
};
```

## Guidelines

### Type Safety
- Always export types explicitly
- Use generics for reusable components
- Prefer `interface` for object shapes
- Use `type` for unions and computed types
- Never use `any` - use `unknown` instead

### Import/Export
- Use named exports for types and utilities
- Provide a clean index.ts for easy imports
- Separate type exports with `export type`
- Group related exports together

### Version Compatibility
- Types must work across all apps
- Avoid breaking changes without major version bump
- Use semantic versioning
- Document breaking changes in changelog

### Validation
- Include Zod schemas for type validation
- Schemas should match TypeScript types
- Export both types and schemas
- Use for API validation

## Common Types

### Core Entities
```typescript
export interface Organization {
  id: string;
  name: string;
  settings: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
}

export interface Admin {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Dashboard {
  id: string;
  organizationId: string;
  workerId: string;
  name: string;
  active: boolean;
  widgets: DashboardWidget[];
}
```

### Plugin Types
```typescript
export interface ScheduleItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  source: string; // plugin id
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  source: string; // plugin id
}
```

## Testing
- Unit tests for all utility functions
- Test edge cases and error conditions
- Use TypeScript for compile-time checks
- Validate types match runtime behavior

## Dependencies
- Keep dependencies minimal
- No runtime dependencies - types and utils only
- Use devDependencies for testing tools
- Peer dependencies for shared libraries
