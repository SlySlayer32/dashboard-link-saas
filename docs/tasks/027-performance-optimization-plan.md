# Performance Optimization Implementation Plan

## Overview
This plan provides a step-by-step approach to optimize the Dashboard Link SaaS application for better performance, focusing on high-impact, low-risk optimizations first.

## Phase 1: Measurement & Baseline (Day 1)

### 1.1 Set Up Performance Measurement Tools
**Priority**: High
**Files to modify**:
- `package.json` (root)
- `apps/admin/vite.config.ts`
- `apps/worker/vite.config.ts`

**Steps**:
1. Install bundle analyzer:
```bash
pnpm add -D rollup-plugin-visualizer
```

2. Configure in vite configs:
```typescript
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
    })
  ]
})
```

3. Run Lighthouse baseline tests:
   - Admin app: http://localhost:5173
   - Worker app: http://localhost:5174
   - Document scores in task file

### 1.2 Identify Performance Bottlenecks
- Use React DevTools Profiler to identify slow components
- Check Network tab for large assets
- Analyze bundle size with visualizer

## Phase 2: Frontend Optimizations (Days 2-3)

### 2.1 Route-Based Code Splitting
**Priority**: High
**Files to modify**:
- `apps/admin/src/App.tsx`
- `apps/worker/src/App.tsx`

**Implementation**:
```typescript
// Replace direct imports with lazy loading
const WorkersPage = lazy(() => import('./pages/WorkersPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))

// Add Suspense wrapper
<Suspense fallback={<PageSkeleton />}>
  <Route path="/workers" element={<WorkersPage />} />
</Suspense>
```

### 2.2 TanStack Query Optimization
**Priority**: High
**Files to modify**:
- `apps/admin/src/hooks/useWorkers.ts`
- `apps/admin/src/hooks/useDashboard.ts`
- `apps/worker/src/hooks/useSchedule.ts`

**Optimizations**:
```typescript
export const useWorkers = () => {
  return useQuery({
    queryKey: ['workers'],
    queryFn: () => workersService.getWorkers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};
```

### 2.3 Image Lazy Loading
**Priority**: Medium
**Files to modify**: All image components

**Implementation**:
```typescript
// Add native lazy loading
<img 
  src={url} 
  alt={alt}
  loading="lazy"
  decoding="async"
  className="transition-opacity"
  onLoad={(e) => e.currentTarget.classList.add('loaded')}
/>
```

### 2.4 Virtual Scrolling
**Priority**: Medium
**Package**: `@tanstack/react-virtual`

**Files to create/modify**:
- `packages/ui/src/VirtualList.tsx`
- Components with large lists (WorkerList, TaskList)

**Implementation**:
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

const VirtualList = ({ items, renderItem }) => {
  const parentRef = useRef()
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
  })
  
  // Render virtualized items
}
```

## Phase 3: Advanced Optimizations (Days 4-5)

### 3.1 React.memo and Callback Optimization
**Priority**: Medium (Only after profiling!)
**Files to modify**: Components identified as slow in profiling

**Implementation**:
```typescript
// Only for components that re-render unnecessarily
export const WorkerCard = React.memo(({ worker, onEdit }) => {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison if needed
  return prevProps.worker.id === nextProps.worker.id
});

// Use useCallback for event handlers
const handleEdit = useCallback((worker: Worker) => {
  onEdit(worker);
}, [onEdit]);
```

### 3.2 API Caching Middleware
**Priority**: Medium
**Files to create**:
- `apps/api/src/middleware/cache.ts`

**Implementation**:
```typescript
import { Context, Next } from 'hono'

const cache = new Map()

export const cacheMiddleware = (ttl: number = 60000) => {
  return async (c: Context, next: Next) => {
    const key = c.req.url
    const cached = cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return c.json(cached.data)
    }
    
    await next()
    
    cache.set(key, {
      data: c.res,
      timestamp: Date.now()
    })
  }
}
```

### 3.3 Service Worker Implementation
**Priority**: Medium
**Package**: `vite-plugin-pwa`

**Files to modify**:
- `apps/admin/vite.config.ts`
- `apps/worker/vite.config.ts`
- `public/manifest.json` (create)

**Implementation**:
```typescript
import { VitePWA } from 'vite-plugin-pwa'

plugins: [
  VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/api\./i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 // 24 hours
            }
          }
        }
      ]
    }
  })
]
```

## Phase 4: Backend & Database (Days 6-7)

### 4.1 Database Query Optimization
**Priority**: Low
**Files to modify**:
- `packages/database/migrations/` (add indexes)
- `apps/api/src/services/*.ts`

**Optimizations**:
1. Add indexes for frequently queried columns:
```sql
-- Add to migrations
CREATE INDEX idx_workers_organization_active 
ON workers(organization_id, active);
CREATE INDEX idx_tokens_worker_id 
ON tokens(worker_id) 
WHERE expires_at > NOW();
```

2. Optimize queries:
```typescript
// Select only needed columns
const { data } = await supabase
  .from('workers')
  .select('id, name, phone, active')
  .eq('organization_id', orgId)
```

### 4.2 CDN Configuration
**Priority**: Low
**Files to modify**:
- `apps/admin/vite.config.ts`
- `apps/worker/vite.config.ts`

**Implementation**:
```typescript
// Configure asset URLs for production
export default defineConfig(({ mode }) => ({
  base: mode === 'production' 
    ? 'https://cdn.yourdomain.com/' 
    : '/',
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    }
  }
}))
```

## Phase 5: Final Optimizations (Day 8)

### 5.1 Route Prefetching
**Priority**: Low
**Files to modify**: Route components

**Implementation**:
```typescript
import { usePrefetchQuery } from '@tanstack/react-query'

// In dashboard component
const queryClient = useQueryClient()

const handleMouseOverWorkers = () => {
  queryClient.prefetchQuery({
    queryKey: ['workers'],
    queryFn: () => workersService.getWorkers(),
    staleTime: 5 * 60 * 1000
  })
}
```

### 5.2 Compression Middleware
**Priority**: Low
**Files to modify**:
- `apps/api/src/index.ts`

**Implementation**:
```typescript
import { compress } from 'hono/compress'

app.use('*', compress())
```

## Testing & Validation

### Performance Tests Checklist
1. **Lighthouse Scores**:
   - Performance: > 90
   - First Contentful Paint: < 2s
   - Largest Contentful Paint: < 2.5s
   - Cumulative Layout Shift: < 0.1

2. **Bundle Size**:
   - Admin app: < 300KB (gzipped)
   - Worker app: < 200KB (gzipped)
   - 20% reduction from baseline

3. **Runtime Performance**:
   - Memory usage stable over time
   - No memory leaks on page navigation
   - Smooth 60fps scrolling

4. **Network Performance**:
   - API responses cached appropriately
   - Service worker caching working
   - CDN assets loading quickly

## Potential Pitfalls & Solutions

1. **Over-memoization**: Don't add memo/useCallback everywhere
   - Solution: Profile first, optimize only what's slow

2. **Bundle splitting too granular**: Too many chunks can hurt performance
   - Solution: Split at route level, not component level

3. **Aggressive caching**: Stale data showing to users
   - Solution: Implement proper invalidation strategies

4. **Service worker issues**: Offline bugs or update problems
   - Solution: Test thoroughly, implement update prompts

## Implementation Order Summary

1. **Day 1**: Set up measurement tools, establish baseline
2. **Day 2**: Code splitting, TanStack Query optimization
3. **Day 3**: Image lazy loading, basic component profiling
4. **Day 4**: Virtual scrolling, targeted memo optimization
5. **Day 5**: API caching, service worker setup
6. **Day 6**: Database optimization, query tuning
7. **Day 7**: CDN configuration, compression
8. **Day 8**: Route prefetching, final testing

## Success Metrics

- Lighthouse performance score > 90
- Bundle size reduced by 20%
- First Contentful Paint < 2 seconds
- No layout shifts (CLS < 0.1)
- Stable memory usage over time
- Smooth 60fps scrolling on large lists
