# CleanConnect Coding Conventions

> Follow these patterns consistently across the entire codebase

## File Naming
- **Components**: PascalCase (e.g., `WorkerList.tsx`, `SendSMSButton.tsx`)
- **Pages**: PascalCase with "Page" suffix (e.g., `WorkersPage.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useWorkers.ts`, `useAuth.ts`)
- **Services**: camelCase (e.g., `tokenService.ts`, `smsService.ts`)
- **Types**: camelCase (e.g., `workerTypes.ts`, `dashboardTypes.ts`)
- **Utils**: camelCase (e.g., `dateUtils.ts`, `phoneUtils.ts`)

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
// Use function declarations with explicit return type
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

### API Routes (Hono.js)
```typescript
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createSuccessResponse, createErrorResponse } from '../utils/response';

const router = new Hono<{ Variables: ContextVariables }>();

// Apply middleware
router.use(authMiddleware);

// GET endpoint
router.get('/', async (c) => {
  try {
    const data = await service.getData(c.get('organizationId'));
    return c.json(createSuccessResponse(data));
  } catch (error) {
    return c.json(createErrorResponse(error.message), 500);
  }
});

// POST endpoint with validation
router.post('/', validateBody(CreateSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const data = await service.createData(body, c.get('organizationId'));
    return c.json(createSuccessResponse(data), 201);
  } catch (error) {
    return c.json(createErrorResponse(error.message), 500);
  }
});
```

### Zustand Stores
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(email, password);
          set({ 
            user: response.user, 
            token: response.token,
            isLoading: false 
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      logout: () => {
        set({ user: null, token: null });
      },
      
      refreshToken: async () => {
        // implementation
      }
    }),
    { name: 'auth-storage' }
  )
);
```

### Custom Hooks
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workersService } from '../services/workersService';

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

## TypeScript Patterns

### Type Definitions
```typescript
// Use interfaces for object shapes
interface Worker {
  id: string;
  name: string;
  phone: string;
  email: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Use types for unions, computed types, or utility types
type WorkerStatus = 'active' | 'inactive';
type CreateWorkerRequest = Omit<Worker, 'id' | 'createdAt' | 'updatedAt'>;
```

### API Response Types
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## CSS/Tailwind Patterns
- Use utility classes first
- Create custom components for repeated patterns
- Mobile-first responsive design
- Consistent spacing using Tailwind's scale
- Use semantic color palette (primary, secondary, success, error, warning)

## Error Handling
```typescript
// Service layer
try {
  const result = await apiCall();
  return result;
} catch (error) {
  console.error('Service error:', error);
  throw new Error('Failed to complete operation');
}

// Component layer
const handleSubmit = async () => {
  try {
    await createWorker(data);
    // Success handling
  } catch (error) {
    // Error already handled by toast in mutation
  }
};
```

## Testing Patterns
- Unit tests for utilities and pure functions
- Integration tests for API routes
- Component tests for UI interactions
- Use descriptive test names
- Arrange-Act-Assert pattern

## Git Commit Messages
```
type(scope): description

feat(auth): add login component
fix(api): handle null values in worker endpoint
docs(readme): update setup instructions
refactor(worker): extract worker service
```

## Environment Variables
- Use `.env.example` for template
- Never commit actual `.env` files
- Use descriptive names with APP_ prefix
- Group by feature (AUTH_, DATABASE_, SMS_)
