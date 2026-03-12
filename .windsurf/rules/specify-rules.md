# CleanConnect Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-08

## Active Technologies
- TypeScript 5.x (strict mode), Node.js 18+ LTS + Hono.js 4.x (API), React 18.x + Vite 5.x (admin UI), Supabase client, Zod 3.x (validation) (001-worker-management)
- PostgreSQL 15+ via Supabase with custom RLS pattern (`app.tenant_id` session variable) (001-worker-management)

- TypeScript 5.x (strict mode), Node.js 18+ LTS + Hono.js 4.x (API), React 18.x + Vite 5.x (frontend), Zod 4.x (validation), TanStack Query 5.x (state), libphonenumber-js (phone validation) (001-worker-management)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x (strict mode), Node.js 18+ LTS: Follow standard conventions

## Recent Changes
- 001-worker-management: Added TypeScript 5.x (strict mode), Node.js 18+ LTS + Hono.js 4.x (API), React 18.x + Vite 5.x (admin UI), Supabase client, Zod 3.x (validation)

- 001-worker-management: Added TypeScript 5.x (strict mode), Node.js 18+ LTS + Hono.js 4.x (API), React 18.x + Vite 5.x (frontend), Zod 4.x (validation), TanStack Query 5.x (state), libphonenumber-js (phone validation)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
