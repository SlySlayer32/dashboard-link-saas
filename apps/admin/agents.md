# Admin Portal Guidelines

When working with files in this directory:

## Purpose
Management interface for organization administrators to manage workers, configure plugins, and send SMS dashboard links.

## Tech Stack
- Vite + React 18
- TanStack Query (data fetching)
- React Router (navigation)
- Tailwind CSS (styling)
- Zustand (auth state only)

## Key Features
- Worker CRUD operations
- Plugin configuration
- SMS link generation
- Organization settings
- Dashboard preview

## File Naming Conventions
- Components: PascalCase (e.g., `WorkerList.tsx`, `SendSMSButton.tsx`)
- Pages: PascalCase with "Page" suffix (e.g., `WorkersPage.tsx`)
- Hooks: camelCase with "use" prefix (e.g., `useWorkers.ts`, `useAuth.ts`)
- Services: camelCase (e.g., `tokenService.ts`, `smsService.ts`)

## Folder Structure
```
src/
├── components/       # Reusable UI components
│   ├── ui/          # Basic UI elements (Button, Input, etc.)
│   └── forms/       # Form-specific components
├── pages/           # Page-level components
├── hooks/           # Custom React hooks
├── store/           # Zustand stores
├── services/        # API service functions
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── styles/          # Global styles and CSS
```

## Code Patterns

### React Components
```typescript
export const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // Hooks at the top
  const [state, setState] = useState<Type>();
  const { data, isLoading } = useCustomHook();
  
  // Event handlers
  const handleClick = useCallback(() => {
    // handler logic
  }, [dependencies]);
  
  // Conditional renders for loading/error states
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  // Main render
  return (
    <div className="tailwind-classes">
      {/* JSX */}
    </div>
  );
};
```

### Custom Hooks with TanStack Query
```typescript
export const useWorkers = () => {
  return useQuery({
    queryKey: ['workers'],
    queryFn: () => workersService.getWorkers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateWorker = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: workersService.createWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success('Worker created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
};
```

## Routes
- `/` - Dashboard overview
- `/workers` - Worker management
- `/workers/:id` - Worker details
- `/settings` - Organization settings
- `/plugins` - Plugin configuration

## Guidelines
- Always implement loading, error, and empty states for data-driven components
- Use TypeScript interfaces for all props and data structures
- Import shared types from `@dashboard-link/shared`
- Use semantic color palette (primary, secondary, success, error, warning)
- Mobile-first responsive design
- Test user interactions, not implementation details
- Use `useNavigate()` from React Router for navigation (not window.location)

## Authentication
- Use Zustand store for auth state persistence
- JWT tokens stored securely
- Protected routes use auth middleware
- Always validate organization access

## API Integration
- All API calls go through service functions
- Use the response envelope: `{ success, data?, error? }`
- Handle errors gracefully with user-friendly messages
- Include organization_id in all relevant requests

## Testing
- Unit tests for utilities and pure functions
- Component tests for UI interactions
- Integration tests for API routes
- Use descriptive test names following "should do X when Y" pattern
