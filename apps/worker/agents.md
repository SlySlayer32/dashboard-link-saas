# Worker Dashboard Guidelines

When working with files in this directory:

## Purpose
Mobile-optimized dashboard for workers to view their daily schedule and tasks via SMS token links.

## Tech Stack
- Vite + React 18
- TanStack Query (data fetching)
- Tailwind CSS (mobile-first)
- No authentication (token-based access)

## Key Features
- Token-based access (no login required)
- Today's schedule display
- Tasks with priority indicators
- Mobile-optimized layout
- Auto-refresh capability

## File Naming Conventions
- Components: PascalCase (e.g., `ScheduleView.tsx`, `TaskItem.tsx`)
- Pages: PascalCase with "Page" suffix (e.g., `DashboardPage.tsx`)
- Hooks: camelCase with "use" prefix (e.g., `useDashboardData.ts`)
- Utils: camelCase (e.g., `dateUtils.ts`, `formatUtils.ts`)

## Folder Structure
```
src/
├── components/       # Reusable UI components
│   ├── ui/          # Basic UI elements
│   └── dashboard/   # Dashboard-specific components
├── pages/           # Page-level components
├── hooks/           # Custom React hooks
├── services/        # API service functions
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── styles/          # Global styles and CSS
```

## Code Patterns

### Token-based Data Fetching
```typescript
export const useDashboardData = (token: string) => {
  return useQuery({
    queryKey: ['dashboard', token],
    queryFn: () => dashboardService.getDashboardData(token),
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
};
```

### Mobile-First Component
```typescript
export const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-3">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
        <PriorityIndicator priority={task.priority} />
      </div>
      {task.description && (
        <p className="mt-1 text-xs text-gray-600">{task.description}</p>
      )}
      {task.dueDate && (
        <p className="mt-2 text-xs text-gray-500">
          Due: {formatDate(task.dueDate)}
        </p>
      )}
    </div>
  );
};
```

## Routes
- `/` - Landing page with token input
- `/dashboard/:token` - Worker dashboard view

## Mobile Design Guidelines
- Use relative units (rem, em) for scalability
- Touch-friendly tap targets (min 44px)
- Single column layout for small screens
- Swipe gestures for navigation (consider)
- Optimized for one-handed use

## Data Display
- Group schedule items by time slots
- Show tasks ordered by priority
- Use clear visual hierarchy
- Minimal scrolling required
- Pull-to-refresh functionality

## Token Handling
- Extract token from URL params
- Validate token on component mount
- Handle expired/invalid tokens gracefully
- No local storage of sensitive data

## Error Handling
- Network errors: Show retry option
- Invalid token: Redirect to landing
- No data: Show empty state with contact info
- Loading states: Skeleton screens preferred

## Performance
- Lazy load components
- Optimize images for mobile
- Minimize bundle size
- Use React.memo for expensive components

## Accessibility
- Semantic HTML5 elements
- ARIA labels where needed
- High contrast colors
- Readable font sizes (16px+)
- Focus indicators visible

## Testing
- Test on actual mobile devices
- Verify token flow end-to-end
- Test offline behavior
- Performance testing on slow networks
- Accessibility testing with screen readers
