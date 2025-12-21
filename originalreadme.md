Dashboard Link SaaS Platform - Initial Setup
Project Overview
Build a SaaS platform where organizations can create personalized daily dashboards for their people (workers, contractors, staff), delivered via SMS link. The platform allows admins to configure dashboard widgets powered by plugins that pull data from external systems.

Use Cases:

Cleaning company → sends cleaners their daily jobs/locations
Construction firm → sends workers their site assignments
Healthcare agency → sends carers their patient visit schedule
Delivery company → sends drivers their daily routes
Architecture Reference
The platform follows this flow (from user's Mermaid diagram):

Admin Setup: Add worker contacts, configure plugins, generate SMS link
Authentication: Token service creates secure tokens (1hr-1day expiry), SMS service sends link
Worker Receives Link: Opens tokenized URL on mobile
Backend Validates: API Gateway validates token, Dashboard API orchestrates data
Plugin Adapters (PULL): Calendar, Scheduling, Task adapters fetch from external APIs
External Systems: Google Calendar, Scheduling tools, Task management APIs
Display Dashboard: Today's schedule, tasks, important notes
Webhooks (PUSH): Real-time updates from external systems
Tech Stack Decisions (Based on 2025 Research)
Frontend
Framework: Vite + React 18 (user preference for Vite, fast builds, great DX)
UI Components: shadcn/ui + Tailwind CSS (modern, accessible, customizable)
State Management: Zustand (lightweight, simple)
Data Fetching: TanStack Query (caching, real-time updates)
Backend API
Framework: Hono.js (chosen over Express/Fastify)
Why: Best for edge/serverless, 5x smaller memory footprint (~18MB vs ~120MB), fastest cold starts (~120ms), TypeScript-first, works on Node.js + Edge runtimes
Database & Backend Services
Database: Supabase (PostgreSQL)
Why: All-in-one (DB, Auth, Storage, Realtime), open-source, no vendor lock-in, predictable pricing, Row Level Security built-in
Alternative considered: Neon (great for branching but requires assembling auth/storage separately)
SMS Provider (Australia)
Provider: MobileMessage.com.au
Why: Australian company, cheapest rates (2¢/SMS intro, 3¢ ongoing), no monthly fees, credits never expire, free virtual number for 2-way SMS, simple REST API
API Endpoint: https://api.mobilemessage.com.au/
Auth: Basic Authentication
Competitor comparison: Twilio AU is 5.15¢/SMS with fees
Monorepo
Tool: Turborepo (chosen over Nx)
Why: Simpler config (~20 lines vs 200+), faster setup, perfect for Vite+React, Vercel integration, better for small-medium teams
Deployment
Platform: Vercel (frontend) + Supabase (backend/DB)
Edge Functions: Vercel Edge or Cloudflare Workers (Hono compatible)
Repository Structure to Create
dashboard-link-saas/
├── README.md                         # Project overview, setup instructions
├── RESEARCH.md                       # Tech stack decisions with sources
├── ARCHITECTURE.md                   # System design documentation
├── turbo.json                        # Turborepo configuration
├── package.json                      # Root package.json
├── pnpm-workspace.yaml               # pnpm workspaces config
├── .env.example                      # Environment variables template
├── .gitignore
│
├── apps/
│   ├── admin/                        # Admin dashboard (Vite + React)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── worker/                       # Worker mobile dashboard (Vite + React)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── widgets/          # Schedule, Tasks, Notes widgets
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                          # Hono.js API
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   ├── workers.ts
│       │   │   ├── organizations.ts
│       │   │   ├── dashboards.ts
│       │   │   ├── sms.ts
│       │   │   └── webhooks.ts
│       │   ├── middleware/
│       │   │   ├── auth.ts
│       │   │   └── rateLimit.ts
│       │   ├── services/
│       │   │   ├── token.service.ts
│       │   │   ├── sms.service.ts      # MobileMessage.com.au integration
│       │   │   └── plugin-manager.ts
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── plugins/                      # Plugin adapter system
│   │   ├── src/
│   │   │   ├── base/
│   │   │   │   └── adapter.ts    ...

</details>