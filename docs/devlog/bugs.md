# Bug History

**Project**: Dashboard Link (CleanConnect SaaS)  
**Developer**: Solo founder  
**Period**: 2025-12-20 — 2026-03-15

## Open Bugs

| ID | Date | Severity | Summary | Status |
|----|------|----------|---------|--------|
| BUG-001 | 2026-03-15 | High | Duplicate `GET/POST /api/v1/workers` handlers in `apps/api/src/v1.ts` and `apps/api/src/routes/workers.ts` return different response contracts, which can break the admin worker list depending on which route handles the request. | Open |
| BUG-002 | 2026-03-15 | High | Concurrent edit conflicts from `apps/api/src/routes/workers.ts` do not return a machine-readable `code`, but the admin client expects `CONCURRENT_EDIT`, so conflict-specific UX does not trigger correctly. | Open |
| BUG-003 | 2026-03-15 | Medium | Worker status filtering in `apps/admin/src/pages/WorkersPage.tsx` uses `deletedAt`, while `WorkerCard.tsx` also treats `!worker.active` as inactive, causing inconsistent Active/Inactive UI behavior. | Open |
| BUG-004 | 2026-03-15 | Medium | The worker search input in `apps/admin/src/pages/WorkersPage.tsx` is bound to the debounced value instead of the live value, causing visible typing lag. | Open |
| BUG-005 | 2026-03-15 | **CRITICAL** | Database schema column name mismatch: `workers` table uses `full_name`, `phone_number`, `calendar_email` but application code expects `name`, `phone`, `email`. This breaks all worker queries and RLS policies. Location: `supabase/migrations/20260124231200_mvp_schema.sql` vs `packages/database/src/repositories/WorkerRepository.ts`. | Open |
| BUG-006 | 2026-03-15 | **CRITICAL** | Missing `deleted_at` column in `workers` table schema. Application code relies on soft deletes via `deletedAt` field but column doesn't exist in database. All soft delete operations will fail. Location: `supabase/migrations/20260124231200_mvp_schema.sql:38-46`. | Open |
| BUG-007 | 2026-03-15 | **CRITICAL** | Missing `active` column in `workers` table schema. Application code expects `active` boolean field but column doesn't exist in database. Worker activation/deactivation will fail. Location: `supabase/migrations/20260124231200_mvp_schema.sql:38-46`. | Open |
| BUG-008 | 2026-03-15 | **CRITICAL** | `DatabaseTokenProvider` all database operations are stubbed out and return mock data. Methods like `findTokenRecord()` always return null, making token validation completely broken. Worker dashboard access via tokens is non-functional. Location: `packages/tokens/src/providers/DatabaseTokenProvider.ts:488-575`. | Open |
| BUG-009 | 2026-03-15 | **CRITICAL** | Worker dashboard route has broken imports using wrong package names (`@cleanconnect` instead of `@dashboard-link`) and references non-existent middleware. Uses Cloudflare Workers syntax in a Hono.js + Supabase project. Location: `apps/api/src/routes/worker-dashboard.ts:1-2`. | Open |
| BUG-010 | 2026-03-15 | **CRITICAL** | RLS bypass risk: `setTenantContext()` and `clearTenantContext()` don't validate RPC call success. If RPC fails silently, RLS policies won't have tenant context and queries may return all organizations' data (multi-tenancy breach). Location: `apps/api/src/lib/db.ts:20-33`. | Open |
| BUG-011 | 2026-03-15 | High | `WorkerRepository.create()` method doesn't actually insert data - it performs SELECT queries instead of INSERT. Workers cannot be created. Same issue in `update()` and `delete()` methods. Location: `packages/database/src/repositories/WorkerRepository.ts:51-100`. | Open |
| BUG-012 | 2026-03-15 | High | `SupabaseQueryBuilder` missing `insert()`, `update()`, and `delete()` methods. Only SELECT queries are implemented. All write operations are broken across the entire application. Location: `packages/database/src/adapters/SupabaseAdapter.ts:107-233`. | Open |
| BUG-013 | 2026-03-15 | High | `SupabaseQueryBuilder.count()` creates a new query instead of counting the existing filtered query, causing all count queries to ignore filters and return total table counts. Location: `packages/database/src/adapters/SupabaseAdapter.ts:212-227`. | Open |
| BUG-014 | 2026-03-15 | High | Tenant middleware missing error handling for `setTenantContext()`. If call fails, request continues without RLS protection, potentially exposing cross-tenant data. Location: `apps/api/src/middleware/tenant.middleware.ts:26-27`. | Open |
| BUG-015 | 2026-03-15 | High | Worker auth middleware sets `organizationId` in context but never calls `setTenantContext()`. Worker dashboard queries bypass RLS and could return data from all organizations. Location: `apps/api/src/middleware/workerAuth.ts:63-67`. | Open |
| BUG-016 | 2026-03-15 | Medium | `SupabaseQueryBuilder.offset()` hardcodes a limit of 1000 records, breaking pagination as page size cannot be controlled independently. Location: `packages/database/src/adapters/SupabaseAdapter.ts:184-187`. | Open |

## Closed Bugs

| ID | Date | Severity | Summary | Resolution |
|----|------|----------|---------|------------|
| [to be populated] | | | | |
