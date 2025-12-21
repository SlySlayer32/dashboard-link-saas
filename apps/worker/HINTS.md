# Worker Dashboard Hints

> **Purpose**: Mobile-first dashboard for workers to view their daily tasks and schedules

## 🎯 Worker Persona
- Field worker (cleaner, driver, carer, etc.)
- Uses personal smartphone (Android/iOS)
- Needs quick, glanceable information
- Limited technical proficiency
- Works in various environments (poor connectivity, bright light)

## 📱 Mobile-First Imperative

### Design Constraints
- **Minimum Width**: 375px (iPhone SE)
- **Touch Targets**: Minimum 44px
- **Thumb Zone**: Place primary actions in bottom half
- **One Hand**: All actions reachable with one thumb
- **No Hover**: Touch states only

### Performance Requirements
- **Load Time**: < 3 seconds on 3G
- **Offline**: Show cached data when offline
- **Data Usage**: Minimal images, compress API responses
- **Battery**: Avoid constant polling, use webhooks

## 🏗️ Architecture Patterns

### Token-Based Authentication
- No login required - tokenized URL from SMS
- Token contains worker ID and expiry
- Auto-refresh token if valid
- Clear error page for expired/invalid tokens

### Data Fetching Strategy
```typescript
// Single query for all dashboard data
const { data: dashboard, isLoading, error } = useQuery({
  queryKey: ['dashboard', token],
  queryFn: fetchDashboardData,
  staleTime: 5 * 60 * 1000, // 5 minutes
  retry: 3
});
```

### Component Structure
```
src/
├── components/
│   ├── widgets/      # Schedule, Tasks, Notes widgets
│   ├── layout/       # Mobile layout components
│   └── common/       # Reusable UI elements
├── pages/
│   ├── Dashboard.tsx # Main dashboard view
│   ├── Error.tsx     # Token error page
│   └── Loading.tsx   # Loading state
├── hooks/
│   ├── useToken.ts   # Token validation
│   └── useDashboard.ts # Data fetching
└── lib/
    ├── api.ts        # API client
    └── utils.ts      # Mobile utilities
```

## 🎨 UI/UX Guidelines

### Visual Design
- **High Contrast**: Works in bright sunlight
- **Large Text**: Minimum 16px, important info 18px+
- **Simple Icons**: Universally understood symbols
- **Color Coding**: Green=good, Red=urgent, Blue=info

### Layout Patterns
1. **Single Column**: Never side-by-side on mobile
2. **Card-Based**: Group related information
3. **Sticky Headers**: Keep context visible
4. **Infinite Scroll**: For long lists, not pagination

### Critical Information Hierarchy
1. **Today's Date & Location** - Always visible
2. **Next Task/Job** - Most important, highlighted
3. **Schedule Timeline** - Chronological view
4. **Task Checklist** - Interactive items
5. **Important Notes** - Expandable section

## 📊 Widget System

### Schedule Widget
- Timeline view of day's activities
- Map integration for locations
- One-tap directions
- Time zone awareness

### Tasks Widget
- Checkbox list for completion
- Priority indicators
- Photo upload for completion proof
- Notes/comments field

### Notes Widget
- Expandable cards
- Rich text support
- Contact information
- Emergency procedures

## 🔄 Data Synchronization

### Online Mode
- Real-time updates via WebSocket
- Push notifications for changes
- Sync on app focus

### Offline Mode
- Show last known data
- Queue actions to sync later
- Clear offline indicator
- Manual refresh option

### Background Sync
- Service worker for caching
- Stale-while-revalidate strategy
- Periodic sync every 30 minutes

## 🚨 Error Handling

### Network Errors
- Retry button with exponential backoff
- Show cached data if available
- Clear error messages
- Report issue option

### Token Errors
- Friendly explanation of expiry
- Contact admin for new link
- Auto-redirect after 10 seconds
- No technical jargon

## 🔐 Security Considerations

### Data Privacy
- Only show worker's own data
- No organization visibility
- Mask sensitive information
- Clear data on logout

### Token Security
- HTTPS required
- Short expiry times (1-24 hours)
- No localStorage for sensitive data
- Automatic token refresh

## 🧪 Testing Approach

### Device Testing
- iPhone (iOS 14+)
- Android (API 28+)
- Various screen sizes
- Poor network conditions

### User Scenarios
1. New worker receives SMS link
2. Returns worker checks schedule
3. Updates task completion
4. Handles network interruption
5. Views on tablet device

## 🚀 Performance Optimization

### Bundle Size
- Target < 100KB initial load
- Code split by route
- Lazy load images
- Use modern image formats

### Runtime Performance
- Virtualize long lists
- Debounce search/filter
- Optimize re-renders
- Use CSS transforms for animations

### Network Optimization
- Compress API responses
- Cache static assets
- Minimize round trips
- Use HTTP/2 push for critical resources

## 🔧 Common Tasks

### Adding New Widget
1. Create in `src/components/widgets/`
2. Add to dashboard grid
3. Ensure responsive design
4. Test offline behavior

### Handling New Data Type
1. Update TypeScript interfaces
2. Add to API response mapping
3. Create display component
4. Add to dashboard layout

## 💡 Pro Tips

1. **Test on Real Devices**: Emulators don't show real performance
2. **Use Device APIs**: Camera, GPS, contacts when helpful
3. **Consider Context**: Workers may be wearing gloves
4. **Save Progress**: Auto-save form inputs
5. **Simple Language**: Avoid technical terms

---

**Remember**: Workers need information quickly and reliably. Prioritize clarity and speed over features. Every extra tap or second of load time matters.
