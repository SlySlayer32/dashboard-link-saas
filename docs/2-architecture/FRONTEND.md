# Frontend Architecture

## Framework & Version

> See `@e:\CleanConnect\docs\2-architecture\TECH-STACK.md` for frontend framework details — documented there as the single source of truth.

**Quick reference:** Vite 5.x + React 18.x + TypeScript 5.x (strict mode)

## Folder Structure

```
apps/admin/                 # Admin dashboard (desktop-focused)
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/              # Route-level page components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and helpers
│   ├── stores/             # Zustand state stores
│   ├── api/                # TanStack Query hooks and API clients
│   └── main.tsx            # App entry point

apps/worker/                # Worker dashboard (mobile-first)
├── src/
│   ├── components/         # Mobile-optimized components
│   ├── pages/              # Single dashboard page
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and helpers
│   └── main.tsx            # App entry point

packages/ui/                # Shared UI components (shadcn/ui)
├── src/
│   ├── components/         # Button, Input, Card, etc.
│   └── lib/                # Tailwind utilities
```

**Naming conventions:**

> See `@e:\CleanConnect\docs\5-dev-guide\CODE-STANDARDS.md` for naming conventions — documented there as the single source of truth.

## Offline Tolerance

**Screenshot-able for zero signal (PRD requirement):**
- Dashboard must be fully functional after initial load
- No additional API calls required after data fetch
- All critical info visible in single viewport (no infinite scroll)
- Workers can screenshot dashboard for offline reference

**Technical approach:**
- Single-page load with all data embedded
- No lazy loading for critical content
- Static assets cached via service worker (PWA)
- Fallback UI for failed data loads

## State Management

**Zustand for global state:**
- User authentication state (JWT, user profile)
- Organization context (current org ID, settings)
- UI state (sidebar open/closed, theme)

**TanStack Query v5 for server state:**
- Workers list, plugins list, SMS logs
- Automatic caching, background refetch, optimistic updates
- No manual state management for API data

**TanStack Query v5 API (object-based):**
```typescript
// Correct v5 syntax
import { useQuery, useMutation } from '@tanstack/react-query';

// Query example
const { data, isLoading, error } = useQuery({
  queryKey: ['workers', organizationId],
  queryFn: () => fetchWorkers(organizationId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Mutation example
const mutation = useMutation({
  mutationFn: (newWorker) => createWorker(newWorker),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['workers'] });
  },
});
```

**Note:** v5 uses object-based configuration instead of v4's positional parameters. All options (queryKey, queryFn, staleTime, etc.) are passed as a single object.

**Local state (useState) for:**
- Form inputs
- Component-specific UI state (modals, dropdowns)

## Styling Approach

**Tailwind CSS utility-first:**
- No custom CSS files unless absolutely necessary
- Design tokens defined in `tailwind.config.js`
- Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`

**shadcn/ui components:**
- Accessible, customizable, copy-paste friendly
- Variants defined using `class-variance-authority`
- Dark mode support via CSS variables

**Mobile-first for worker dashboard:**
- Base styles target mobile (320px+)
- Progressive enhancement for larger screens
- Touch-friendly tap targets (min 44x44px)

## Component Conventions

**When to split a component:**
- Component exceeds 200 lines
- Logic is reused in 2+ places
- Component has 3+ distinct responsibilities

**Component structure:**
```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types
interface MyComponentProps {
  title: string;
  onSubmit: () => void;
}

// 3. Component
export function MyComponent({ title, onSubmit }: MyComponentProps) {
  // 3a. Hooks
  const [isOpen, setIsOpen] = useState(false);
  
  // 3b. Event handlers
  const handleClick = () => {
    setIsOpen(true);
    onSubmit();
  };
  
  // 3c. Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick}>Submit</Button>
    </div>
  );
}
```

**File organization:**
- One component per file
- Co-locate tests: `MyComponent.test.tsx` next to `MyComponent.tsx`
- Export from index: `components/index.ts` for clean imports

## Key Third-Party Libraries

- **@tanstack/react-query** — Server state management, caching, background refetch
- **react-router-dom** — Client-side routing
- **react-hook-form** — Performant form handling
- **zod** — Runtime validation, integrates with react-hook-form
- **zustand** — Lightweight global state management
- **lucide-react** — Icon library (modern, tree-shakeable)
- **date-fns** — Date manipulation (lighter than moment.js)
- **clsx** + **tailwind-merge** — Conditional className utilities
