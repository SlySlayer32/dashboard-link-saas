# UI Package Guidelines

When working with files in this directory:

## Purpose
Shared React components used across all applications in the CleanConnect monorepo, built with Tailwind CSS and following modern design patterns.

## Tech Stack
- React 18 with TypeScript
- Tailwind CSS for styling
- Headless UI primitives (where applicable)
- Lucide React for icons

## File Naming Conventions
- Components: PascalCase (e.g., `Button.tsx`, `Modal.tsx`)
- Stories: `ComponentName.stories.tsx`
- Tests: `ComponentName.test.tsx`
- Styles: `ComponentName.styles.ts` (if needed)

## Folder Structure
```
src/
├── components/       # UI components
│   ├── forms/       # Form-related components
│   ├── feedback/    # Loading, error, success states
│   ├── layout/      # Layout components
│   └── navigation/  # Navigation components
├── icons/           # Icon components
├── hooks/           # UI-specific hooks
├── utils/           # Style utilities
└── index.ts         # Main exports
```

## Code Patterns

### Component Structure
```typescript
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
}

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export const Button: React.FC<ButtonProps> = ({
  className,
  variant,
  size,
  children,
  ...props
}) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </button>
  );
};
```

### Form Component Pattern
```typescript
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required,
  children,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
```

## Design System

### Color Palette
- `primary`: Main brand color
- `secondary`: Secondary brand color
- `muted`: Subtle backgrounds
- `accent`: Highlight colors
- `destructive`: Error states
- `border`: UI borders

### Typography Scale
- `text-xs`: 0.75rem (12px)
- `text-sm`: 0.875rem (14px)
- `text-base`: 1rem (16px)
- `text-lg`: 1.125rem (18px)
- `text-xl`: 1.25rem (20px)
- `text-2xl`: 1.5rem (24px)

### Spacing Scale
- Follow Tailwind's default scale
- Use consistent spacing (4px base unit)
- Prefer spacing utilities over custom CSS

## Component Guidelines

### Accessibility
- All interactive elements keyboard accessible
- Proper ARIA labels and roles
- Focus indicators visible
- Color contrast WCAG AA compliant
- Semantic HTML5 elements

### Responsiveness
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Flexible layouts with flex/grid
- Touch-friendly tap targets (44px minimum)

### Performance
- Use React.memo for expensive components
- Lazy load heavy components
- Optimize re-renders with proper keys
- Avoid inline functions in render

### State Management
- Keep components stateless when possible
- Lift state up when needed
- Use refs for DOM manipulation
- Avoid prop drilling (context when needed)

## Available Components

### Basic Components
- Button (multiple variants)
- Input (text, email, password, etc.)
- Textarea
- Select
- Checkbox
- Radio Group
- Switch
- Label

### Layout Components
- Card
- Divider
- Spacer
- Container
- Grid
- Flex

### Feedback Components
- LoadingSpinner
- ProgressBar
- Alert
- Toast
- Badge

### Navigation Components
- Link
- Breadcrumb
- Tabs
- Pagination

### Overlay Components
- Modal
- Drawer
- Tooltip
- Popover
- Dropdown

## Styling Guidelines

### Tailwind Best Practices
- Use utility classes first
- Extract repeated patterns to components
- Use @apply for complex component styles
- Maintain consistent design tokens

### CSS Custom Properties
- Define in :root for theme values
- Use for dynamic values (colors, spacing)
- Support dark mode where applicable

### Animation
- Use Tailwind's animation utilities
- Keep animations subtle and purposeful
- Respect prefers-reduced-motion

## Testing
- Visual testing with Storybook
- Unit tests for component logic
- Accessibility testing with axe-core
- Cross-browser testing
- Responsive design testing

## Documentation
- Storybook stories for all components
- Prop documentation with TypeScript
- Usage examples in stories
- Design token documentation
