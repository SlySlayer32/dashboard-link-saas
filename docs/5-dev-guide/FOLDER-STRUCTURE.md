# Folder Structure

**✅ VERIFIED:** Folder structure verified against actual codebase. All documented paths exist.

## Root
```
dashboard-link-saas/
├── apps/                   # Application packages
├── packages/               # Shared packages
├── supabase/               # Database migrations and config
├── docs/                   # Documentation (this folder)
├── .github/                # GitHub Actions workflows
├── .vscode/                # VS Code settings
├── package.json            # Root package.json (workspace config)
├── pnpm-workspace.yaml     # pnpm workspace configuration
├── turbo.json              # Turborepo configuration
├── tsconfig.base.json      # Base TypeScript config
└── .gitignore              # Git ignore rules
```

## Apps

### `apps/admin/` — Admin Dashboard
Desktop-focused interface for managers to configure workers, connect plugins, send SMS, and view analytics.

```
apps/admin/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # shadcn/ui components (Button, Input, etc.)
│   │   ├── workers/        # Worker-specific components
│   │   ├── plugins/        # Plugin-specific components
│   │   └── layout/         # Layout components (Sidebar, Header)
│   ├── pages/              # Route-level page components
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   ├── Workers.tsx     # Worker management
│   │   ├── Plugins.tsx     # Plugin configuration
│   │   └── Settings.tsx    # Organization settings
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and helpers
│   ├── stores/             # Zustand state stores
│   ├── api/                # TanStack Query hooks and API clients
│   └── main.tsx            # App entry point
├── public/                 # Static assets
├── index.html              # HTML entry point
└── vite.config.ts          # Vite configuration
```

### `apps/worker/` — Worker Dashboard
Mobile-first, single-page view of today's schedule and tasks. Accessed via time-limited token link.

```
apps/worker/
├── src/
│   ├── components/         # Mobile-optimized components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── ScheduleCard.tsx
│   │   ├── TaskList.tsx
│   │   └── ContactCard.tsx
│   ├── pages/              # Single dashboard page
│   │   └── Dashboard.tsx   # Main worker dashboard
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and helpers
│   └── main.tsx            # App entry point
├── public/                 # Static assets
├── index.html              # HTML entry point
└── vite.config.ts          # Vite configuration
```

### `apps/api/` — API Server
Hono.js backend handling authentication, request validation, and business logic.

```
apps/api/
├── src/
│   ├── routes/             # API route handlers
│   │   ├── workers.ts      # /api/workers endpoints
│   │   ├── plugins.ts      # /api/plugins endpoints
│   │   ├── sms.ts          # /api/sms endpoints
│   │   ├── tokens.ts       # /api/tokens endpoints
│   │   └── dashboard.ts    # /api/dashboard endpoints
│   ├── middleware/         # Request middleware
│   │   ├── auth.ts         # JWT validation
│   │   ├── tenant.ts       # Multi-tenant context
│   │   └── validation.ts   # Zod schema validation
│   ├── services/           # Business logic
│   │   ├── dashboard.ts    # Dashboard generation
│   │   ├── sms.ts          # SMS sending
│   │   ├── tokens.ts       # Token generation/validation
│   │   └── plugins.ts      # Plugin orchestration
│   ├── lib/                # Utilities
│   │   ├── db.ts           # Supabase client
│   │   ├── errors.ts       # Custom error classes
│   │   └── logger.ts       # Structured logging
│   └── index.ts            # App entry point
└── tsconfig.json           # TypeScript configuration
```

## Packages

### `packages/shared/` — Shared Types and Utilities
Types, constants, and utilities used across apps and packages.

```
packages/shared/
├── src/
│   ├── types/              # TypeScript types and interfaces
│   │   ├── worker.ts       # Worker-related types
│   │   ├── plugin.ts       # Plugin-related types
│   │   └── api.ts          # API request/response types
│   ├── constants/          # Shared constants
│   └── utils/              # Shared utility functions
└── tsconfig.json
```

### `packages/ui/` — Shared UI Components
shadcn/ui components and Tailwind utilities shared between admin and worker apps.

```
packages/ui/
├── src/
│   ├── components/         # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   └── lib/                # Tailwind utilities (cn, etc.)
└── tsconfig.json
```

### `packages/plugins/` — Plugin Adapter System
Plugin adapters for external API integrations (Google Calendar, Airtable, Notion).

```
packages/plugins/
├── src/
│   ├── adapters/           # Concrete plugin implementations
│   │   ├── google-calendar.ts
│   │   ├── airtable.ts
│   │   ├── notion.ts
│   │   └── manual.ts
│   ├── registry.ts         # Plugin registry (singleton)
│   ├── types.ts            # Plugin contracts/interfaces
│   └── utils.ts            # Shared plugin utilities
└── tsconfig.json
```

### `packages/auth/` — Authentication Utilities
Supabase Auth wrappers and JWT utilities.

```
packages/auth/
├── src/
│   ├── client.ts           # Supabase Auth client
│   ├── jwt.ts              # JWT validation utilities
│   └── types.ts            # Auth-related types
└── tsconfig.json
```

### `packages/database/` — Database Client and Migrations
Supabase client and database utilities.

```
packages/database/
├── src/
│   ├── client.ts           # Supabase client
│   ├── types.ts            # Database types (generated)
│   └── utils.ts            # Database utilities
├── migrations/             # SQL migration files (symlink to supabase/migrations)
└── tsconfig.json
```

## Supabase

### `supabase/` — Database Migrations and Configuration
```
supabase/
├── migrations/             # SQL migration files (append-only)
│   ├── 20260124231200_mvp_schema.sql
│   ├── 20260124231201_rls_policies.sql
│   └── 20260124231202_indexes.sql
├── config.toml             # Supabase project configuration
└── seed.sql                # Seed data for development
```

## Key Conventions

### Import Aliases

**✅ VERIFIED:** Import aliases verified in `apps/admin/tsconfig.json` and `apps/admin/vite.config.ts`.

- `@/` — Relative to `src/` in each app/package ✅
- `@dashboard-link/shared` — Shared package ✅
- `@dashboard-link/ui` — UI package ✅
- `@dashboard-link/plugins` — Plugins package

### File Naming

> See `@e:\CleanConnect\docs\5-dev-guide\CODE-STANDARDS.md#naming-conventions` for file naming rules — documented there as the single source of truth.

### Barrel Exports
- Each folder has `index.ts` for clean imports
- Example: `import { Button, Input } from '@/components/ui'`
