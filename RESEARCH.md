# Tech Stack Research & Decisions

> Documentation of technology choices for Dashboard Link SaaS platform, with research backing each decision.

## Executive Summary

This document explains why we chose specific technologies for the Dashboard Link SaaS platform. All decisions were made in December 2025 based on current best practices, performance benchmarks, and cost considerations.

---

## Frontend Framework: Vite + React 18

### Decision: Vite over Next.js

**Why Vite?**
- ⚡ **Build Speed**: 10-20x faster cold starts than webpack-based tools
- 🎯 **Use Case Fit**: We don't need SSR for this SaaS (both apps are behind auth)
- 📦 **Size**: Smaller bundle sizes with better tree-shaking
- 🔧 **Simplicity**: Less opinionated, more flexible for custom setups
- 💰 **Cost**: No vendor lock-in (Next.js optimized for Vercel)

**Why Not Next.js?**
- Next.js excels at SEO and SSR, which we don't need
- The App Router adds complexity we don't require
- Vercel-specific optimizations create vendor lock-in
- Heavier framework (more abstractions, larger runtime)

**Benchmarks** (2025):
```
Cold Start (Development):
- Vite: ~200ms
- Next.js: ~2-3s

Build Time (Small Project):
- Vite: ~5s
- Next.js: ~15-20s

Bundle Size (Minimal App):
- Vite + React: ~140KB
- Next.js App: ~280KB
```

**Sources:**
- [Vite 5.0 Benchmarks](https://vitejs.dev/blog/announcing-vite5)
- [Vite vs Next.js Comparison](https://www.builder.io/blog/vite-vs-nextjs)

---

## Backend Framework: Hono.js

### Decision: Hono.js over Express/Fastify

**Why Hono.js?**
- 🚀 **Performance**: 5-10x faster than Express
- ☁️ **Edge-Ready**: Works on Node.js, Cloudflare Workers, Deno, Bun
- 💾 **Memory**: ~18MB vs ~120MB for Express
- ⚡ **Cold Starts**: ~120ms vs ~500-800ms for Express
- 📝 **TypeScript**: Built with TypeScript from the ground up
- 🔧 **Modern**: Middleware system similar to Express but better

**Performance Benchmarks** (Requests/sec):
```
Framework        RPS      Memory    Cold Start
Hono (Node)     50,000   18 MB     120ms
Fastify         45,000   85 MB     350ms
Express         15,000   120 MB    500ms
```

**Why Not Express?**
- Old architecture (pre-async/await era)
- Large memory footprint
- Not optimized for edge/serverless
- Slow cold starts hurt serverless costs

**Why Not Fastify?**
- Better than Express, but not edge-compatible
- Still Node.js-only (vendor lock-in)
- Higher memory usage than Hono

**Edge Compatibility:**
Hono.js works on:
- ✅ Node.js
- ✅ Cloudflare Workers
- ✅ Vercel Edge Functions
- ✅ Deno
- ✅ Bun

This gives us deployment flexibility without code changes.

**Sources:**
- [Hono.js Official Benchmarks](https://hono.dev/docs/concepts/benchmarks)
- [Web Framework Benchmarks 2025](https://web-frameworks-benchmark.netlify.app/)

---

## Database: Supabase (PostgreSQL)

### Decision: Supabase over Firebase/Neon

**Why Supabase?**
- 🗄️ **Real PostgreSQL**: Full SQL power, not limited like Firebase
- 🔐 **Built-in Auth**: No need for separate auth service
- 📦 **All-in-one**: Database + Auth + Storage + Realtime
- 🔓 **Open Source**: No vendor lock-in, can self-host
- 💰 **Pricing**: Predictable ($25/mo for 50K MAU vs Firebase's variable)
- 🔒 **Row Level Security**: Built-in multi-tenancy support

**Comparison Table:**

| Feature | Supabase | Firebase | Neon |
|---------|----------|----------|------|
| Database | PostgreSQL | NoSQL | PostgreSQL |
| Auth | ✅ Built-in | ✅ Built-in | ❌ Separate |
| Storage | ✅ Built-in | ✅ Built-in | ❌ Separate |
| Realtime | ✅ Built-in | ✅ Built-in | ❌ Separate |
| Self-hostable | ✅ Yes | ❌ No | ✅ Yes |
| Pricing (50K users) | $25/mo | $100-500/mo | $20/mo + auth + storage |
| RLS | ✅ Native | ❌ Manual | ✅ Native |

**Why Not Firebase?**
- NoSQL limitations (no complex queries, joins)
- Expensive at scale (pricing unpredictable)
- Vendor lock-in (Google proprietary)
- Migration difficulty (NoSQL → SQL is hard)

**Why Not Neon?**
- Great for branching workflows (dev/staging)
- But requires assembling auth, storage separately
- More moving parts = more complexity
- Similar cost when you add auth + storage

**Our Use Case:**
We need:
- ✅ SQL for complex queries (multi-tenant, joins)
- ✅ Built-in auth (admin + worker access)
- ✅ Row Level Security (organization isolation)
- ✅ Predictable pricing
- ✅ No vendor lock-in

Supabase checks all boxes.

**Sources:**
- [Supabase vs Firebase Comparison](https://supabase.com/alternatives/supabase-vs-firebase)
- [Neon vs Supabase](https://neon.tech/blog/comparing-neon-and-supabase)

---

## SMS Provider: MobileMessage.com.au

### Decision: MobileMessage over Twilio (for Australian market)

**Why MobileMessage.com.au?**
- 💰 **Cost**: 2¢/SMS intro, 3¢ ongoing vs Twilio AU 5.15¢
- 🇦🇺 **Australian**: Local company, local support
- 📞 **Free Number**: Free virtual number for 2-way SMS
- ⏳ **No Expiry**: Credits never expire
- 💳 **No Fees**: No monthly fees or setup costs
- 📊 **Simple API**: RESTful API with Basic Auth

**Cost Comparison** (sending 1000 SMS/month):

| Provider | Cost/SMS | Monthly Total | Notes |
|----------|----------|---------------|-------|
| MobileMessage | 3¢ | $30 | No fees |
| Twilio AU | 5.15¢ | $51.50 + fees | Plus base fees |
| ClickSend AU | 4.5¢ | $45 | Monthly minimum |
| SMS Broadcast | 4¢ | $40 | Setup fees |

**Annual Savings**: ~$250-400/year vs competitors for typical usage.

**API Quality:**
```json
// MobileMessage API (Simple REST)
POST https://api.mobilemessage.com.au/v1/messages
Authorization: Basic <base64>
{
  "to": "+61412345678",
  "message": "Your dashboard link...",
  "from": "DashLink"
}
```

**Why Not Twilio?**
- More expensive (almost 2x for AU market)
- Overkill for our needs (we don't need global coverage)
- More complex API (good for scale, bad for simplicity)
- Vendor lock-in concerns (proprietary ecosystem)

**Why Not ClickSend?**
- Monthly minimums
- More expensive
- Less favorable terms for startups

**Sources:**
- [MobileMessage Pricing](https://mobilemessage.com.au/pricing)
- [Twilio AU Pricing](https://www.twilio.com/en-us/sms/pricing/au)
- [Australian SMS Provider Comparison 2025](https://www.productreview.com.au/listings/sms-providers)

---

## Monorepo Tool: Turborepo

### Decision: Turborepo over Nx

**Why Turborepo?**
- 🎯 **Simplicity**: ~20 lines of config vs 200+ for Nx
- ⚡ **Speed**: Similar performance, easier setup
- 📦 **Small Teams**: Perfect for 1-10 developers
- 🔧 **Vite Integration**: Better support for Vite projects
- ☁️ **Vercel**: Native integration (same company)

**Config Comparison:**

**Turborepo (turbo.json):**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```
**Simple. Clear. Done.**

**Nx (nx.json + project.json × N):**
```json
// nx.json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "@nx/workspace/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "lint", "test"],
        ...50+ more lines
      }
    }
  },
  ...150+ more lines
}
// Plus separate project.json for each package
```

**When to use Nx instead:**
- Large teams (50+ developers)
- Complex monorepo (100+ packages)
- Need code generators
- Enterprise requirements

**Our use case:** Small team, ~7 packages → Turborepo is perfect.

**Sources:**
- [Turborepo vs Nx Comparison](https://turbo.build/repo/docs/comparisons/nx)
- [Monorepo Tools Benchmark 2025](https://monorepo.tools/)

---

## State Management: Zustand

### Decision: Zustand over Redux/Jotai

**Why Zustand?**
- 🎯 **Simplicity**: Minimal boilerplate
- 📦 **Size**: 1.2KB vs Redux 15KB
- ⚡ **Performance**: No unnecessary re-renders
- 📝 **TypeScript**: Excellent TS support
- 🔧 **DevTools**: Redux DevTools compatible

**Code Comparison:**

**Zustand:**
```typescript
const useStore = create((set) => ({
  workers: [],
  addWorker: (worker) => set((state) => ({ 
    workers: [...state.workers, worker] 
  })),
}));
```

**Redux:**
```typescript
// actions.ts
const ADD_WORKER = 'ADD_WORKER';
export const addWorker = (worker) => ({ type: ADD_WORKER, payload: worker });

// reducer.ts
const workersReducer = (state = [], action) => {
  switch (action.type) {
    case ADD_WORKER:
      return [...state, action.payload];
    default:
      return state;
  }
};

// store.ts
const store = createStore(combineReducers({ workers: workersReducer }));

// Usage needs Provider wrapper, etc.
```

**Bundle Size Impact:**
- Zustand: +1.2KB
- Redux Toolkit: +15KB
- Jotai: +3KB (but more complex API)

**Why Not Redux?**
- Too much boilerplate for our scale
- Larger bundle size
- More concepts to learn (actions, reducers, selectors)

**Why Not Jotai?**
- Great for atomic state
- But more complex mental model
- Zustand is simpler for our needs

**Sources:**
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [State Management Bundle Size Comparison](https://bundlephobia.com/)

---

## UI Components: shadcn/ui + Tailwind CSS

### Decision: shadcn/ui over Material-UI/Chakra

**Why shadcn/ui?**
- 🎨 **Copy-Paste**: Components in your codebase, not node_modules
- 🔧 **Full Control**: Modify any component freely
- 📦 **Zero Bundle**: Only ship what you use
- ♿ **Accessible**: Built on Radix UI (WAI-ARIA compliant)
- 🎯 **Tailwind**: Works perfectly with Tailwind CSS

**Comparison:**

| Aspect | shadcn/ui | Material-UI | Chakra UI |
|--------|-----------|-------------|-----------|
| Bundle Size | Only used components | ~300KB minimum | ~150KB minimum |
| Customization | Full source control | Theme config | Theme tokens |
| Dependencies | In your code | In node_modules | In node_modules |
| Updates | Manual (git) | npm update | npm update |
| Learning Curve | Tailwind knowledge | MUI API | Chakra API |

**Why Tailwind CSS?**
- 🎨 **Utility-First**: Rapid UI development
- 📦 **Tiny CSS**: Only ships used utilities (~5-10KB)
- 🔧 **Customizable**: Easy to match brand guidelines
- 🏆 **Industry Standard**: Most popular CSS framework (2025)
- 🔄 **No Runtime**: Zero JS for styling

**Sources:**
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [State of CSS 2024](https://2024.stateofcss.com/)

---

## Data Fetching: TanStack Query

### Decision: TanStack Query over SWR/RTK Query

**Why TanStack Query?**
- 🔄 **Smart Caching**: Automatic background refetching
- ⚡ **Performance**: Optimistic updates, prefetching
- 🎯 **DevTools**: Best-in-class debugging
- 📊 **Features**: Infinite queries, pagination, mutations
- 🔧 **Framework Agnostic**: Works with any framework

**Feature Comparison:**

| Feature | TanStack Query | SWR | RTK Query |
|---------|----------------|-----|-----------|
| Cache Management | ✅ Advanced | ⚠️ Basic | ✅ Advanced |
| Optimistic Updates | ✅ | ⚠️ | ✅ |
| Infinite Queries | ✅ | ❌ | ⚠️ |
| DevTools | ✅ Excellent | ❌ None | ✅ Good |
| Bundle Size | 13KB | 5KB | 18KB (needs Redux) |
| Learning Curve | Medium | Easy | Hard |

**Why Not SWR?**
- Simpler but missing features we need
- No built-in DevTools
- Less powerful caching strategies

**Why Not RTK Query?**
- Requires Redux
- More complex setup
- Tied to Redux ecosystem

**Sources:**
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Data Fetching Libraries Comparison](https://npmtrends.com/@tanstack/react-query-vs-swr)

---

## Deployment: Vercel + Supabase

### Decision: Vercel for Frontend, Supabase for Backend

**Why Vercel?**
- ⚡ **Edge Network**: Global CDN, fast everywhere
- 🔄 **Git Integration**: Deploy on push
- 🎯 **Optimized**: Built for React/Vite apps
- 💰 **Free Tier**: Generous limits for MVP
- 🔧 **Zero Config**: Works out of the box

**Why Supabase for Backend?**
- 🗄️ **Managed Postgres**: Don't manage database servers
- 🔐 **Auth Included**: No separate auth service
- 💰 **Pricing**: Predictable costs
- 🌍 **Global**: Multi-region support

**Alternative Considered:** Netlify
- Similar to Vercel
- But Vercel has better Vite/React optimization
- Vercel Edge Functions work great with Hono.js

**Sources:**
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

## Summary

All technology choices were made with these priorities:

1. **Performance** - Fast for end users (workers on mobile)
2. **Developer Experience** - Easy to build and maintain
3. **Cost** - Optimized for Australian market and startup budget
4. **Flexibility** - No vendor lock-in, can migrate if needed
5. **Modern** - Using 2025 best practices

The stack is proven, performant, and perfect for our SaaS use case.

---

**Research Date:** December 2025  
**Next Review:** June 2026
