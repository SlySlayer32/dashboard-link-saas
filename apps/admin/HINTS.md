# Admin Dashboard Hints

> **Purpose**: Admin interface for managing workers, plugins, and SMS communications

## 🎯 Admin Persona
- Organization administrator or manager
- Manages workforce and schedules
- Needs bulk operations and data visibility
- Works primarily on desktop/laptop

## 🏗️ Architecture Patterns

### State Management
- Use Zustand stores from `src/store/`
- Each major feature has its own store (auth, workers, sms, plugins)
- Persist critical state to localStorage

### Data Fetching
- TanStack Query for all API calls
- Automatic caching and background refetching
- Loading and error states built-in
- Use `useQuery` for fetching, `useMutation` for changes

### Component Structure
```
src/
├── components/
│   ├── ui/          # shadcn/ui components
│   ├── forms/       # Form components with validation
│   ├── tables/      # Data tables with sorting/filtering
│   └── layout/      # Navigation, sidebar, headers
├── pages/           # Route components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and API clients
└── store/           # Zustand stores
```

## 🎨 UI/UX Guidelines

### Design Principles
- Desktop-first, but responsive for tablets
- Information density is valued
- Clear visual hierarchy
- Consistent with shadcn/ui design system

### Common Patterns
1. **Data Tables**: Always include sorting, pagination, bulk actions
2. **Forms**: Validation on blur, clear error messages
3. **Modals**: For create/edit operations
4. **Tooltips**: Explain technical terms (JWT, API keys, etc.)

### Key Pages
- **Dashboard**: Overview with metrics and quick actions
- **Workers**: CRUD operations with bulk SMS sending
- **SMS**: Logs, templates, and sending interface
- **Plugins**: Configure external data sources
- **Settings**: Organization configuration

## 🔐 Security Considerations

### Authentication
- JWT token stored in localStorage
- Automatic token refresh
- Redirect to login on 401 errors
- Role-based access control (future)

### Data Handling
- Never expose other organizations' data
- Sanitize all inputs before API calls
- Handle sensitive data (API keys) carefully
- Log all admin actions for audit

## 📱 Responsive Design

### Breakpoints
- Desktop: 1024px+ (primary target)
- Tablet: 768px-1023px (adapt layouts)
- Mobile: 320px-767px (emergency access only)

### Adaptations
- Collapse sidebar on tablet
- Stack tables on mobile
- Simplify forms on small screens
- Use touch-friendly targets

## 🚀 Performance Tips

### Optimization
- Lazy load routes with React.lazy
- Virtualize large tables (1000+ rows)
- Debounce search inputs
- Cache API responses with TanStack Query

### Bundle Size
- Import shadcn/ui components individually
- Use dynamic imports for heavy libraries
- Optimize images and icons
- Minimize third-party dependencies

## 🧪 Testing Approach

### What to Test
- Forms submit correctly
- Tables sort and filter
- API errors display properly
- Navigation works between pages
- Mobile responsiveness

### Manual Testing
1. Login/logout flow
2. Create/edit/delete workers
3. Send SMS dashboard link
4. Configure a plugin
5. View SMS logs

## 🔧 Common Tasks

### Adding New Page
1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Update navigation in `src/components/layout/`
4. Add any new stores in `src/store/`

### Creating New Form
1. Use react-hook-form with zod validation
2. Follow existing form patterns
3. Include clear error messages
4. Handle loading states
5. Show success/error feedback

### API Integration
1. Add endpoint to `src/lib/api.ts`
2. Create custom hook if complex
3. Handle errors gracefully
4. Show loading states
5. Cache appropriate data

## 🚨 Known Issues

### Browser Compatibility
- Modern browsers only (Chrome 90+, Firefox 88+, Safari 14+)
- No IE support needed
- Progressive enhancement for older browsers

### Accessibility
- Use semantic HTML5 elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader compatible

## 💡 Pro Tips

1. **Copy Patterns**: Find similar component and adapt it
2. **Use TypeScript**: Strict mode catches errors early
3. **Test Mobile**: Use devtools, check touch targets
4. **Error Boundaries**: Wrap routes to handle crashes
5. **Console Logs**: Remove before production

---

**Remember**: Admin users value efficiency and clarity. Make common tasks fast and provide helpful feedback for all actions.
