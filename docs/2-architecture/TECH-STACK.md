# Tech Stack

**✅ VERIFIED:** All versions verified against package.json files in apps/admin, apps/worker, and apps/api.

## Frontend
| Tool | Version | Why Chosen |
|------|---------|------------|
| Vite | 5.x | Fast HMR, modern tooling, excellent TypeScript support |
| React | 18.x | Team familiarity, mature ecosystem, concurrent features |
| TypeScript | 5.x | Type safety, better DX, catches errors at compile time |
| Tailwind CSS | 3.x | Utility-first, fast prototyping, consistent design system |
| shadcn/ui | Latest | Accessible components, customizable, copy-paste friendly |
| Zustand | 4.x | Lightweight state management, no boilerplate vs Redux |
| TanStack Query | 5.x | Server state management, caching, background refetch, optimistic updates |
| React Router | 6.x | Standard routing solution, type-safe with TypeScript |
| React Hook Form | 7.x | Performant forms, integrates with Zod validation |
| Zod | 3.x | Type-safe runtime validation, automatic TypeScript type inference |

## Backend
| Tool | Version | Why Chosen |
|------|---------|------------|
| Node.js | 18+ LTS | Stable, long-term support, modern features |
| Hono.js | 4.x | 5x smaller than Express, fastest cold starts, TypeScript-first, built-in OpenAPI |
| Zod | 3.x | Input validation everywhere, type-safe schemas |
| TypeScript | 5.x | Strict mode enabled, end-to-end type safety |

## Database
| Tool | Version | Why Chosen |
|------|---------|------------|
| Supabase | Latest | All-in-one: PostgreSQL + RLS + Auth + Storage + Realtime, reduces operational complexity |
| PostgreSQL | 15+ | Robust relational DB, RLS for multi-tenant isolation, JSONB for flexible data |

## Infrastructure / Hosting
| Tool | Purpose | Why Chosen |
|------|---------|------------|
| Vercel | Frontend hosting | Zero-config deployment, edge network, preview deployments |
| Supabase | Backend + DB hosting | Managed PostgreSQL, built-in auth, generous free tier |
| MobileMessage.com.au | SMS delivery | 2-3¢/SMS, AU-focused, no monthly fees, free virtual number |
| pnpm | Package manager | Faster than npm, efficient disk usage, strict dependency resolution |
| Turborepo | Monorepo build system | Incremental builds, caching, parallel task execution |
| GitHub Actions | CI/CD | Free for public repos, integrated with GitHub, flexible workflows |

## Rejected Alternatives

### Express.js (rejected for Hono.js)
- **Why rejected:** 5x larger memory footprint, slower cold starts, not TypeScript-first
- **Trade-off:** Smaller ecosystem, team learning curve

### Next.js (rejected for Vite + React)
- **Why rejected:** Overkill for SPA use case, don't need SSR for admin dashboard
- **Trade-off:** Vite requires manual routing setup vs Next.js file-based routing

### Firebase (rejected for Supabase)
- **Why rejected:** Vendor lock-in, NoSQL doesn't fit relational data model, more expensive at scale
- **Trade-off:** Supabase is newer, smaller community

### Twilio (rejected for MobileMessage.com.au)
- **Why rejected:** Higher cost per SMS in Australia, global focus means less AU optimization
- **Trade-off:** MobileMessage.com.au is AU-only, global expansion requires provider switch

### Redux (rejected for Zustand)
- **Why rejected:** Too much boilerplate for small team, overkill for app complexity
- **Trade-off:** Zustand has smaller ecosystem, fewer devtools
