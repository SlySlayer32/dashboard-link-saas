# Development Decisions

**Project**: Dashboard Link (CleanConnect SaaS)  
**Developer**: Solo founder  
**Period**: 2025-12-20 — 2026-03-15

## Decision Log

| Date | Decision | Rationale | ADR Reference |
|------|----------|-----------|---------------|
| 2026-01-07 | Use Hono.js instead of Express | 5x smaller memory footprint, faster cold starts, TypeScript-first design for serverless deployment | ADR-001 |
| 2026-01-07 | Use Supabase (PostgreSQL) for Database and Auth | Built-in RLS for multi-tenant isolation, all-in-one platform reduces operational complexity | ADR-002 |
| 2026-01-07 | Use MobileMessage.com.au for SMS Delivery | 2-3¢/SMS (50-60% cheaper), Australia-first focus, no monthly fees | ADR-003 |
| 2026-01-07 | No Native App — Web-Only via SMS Link | Zero friction for workers (60% never download apps), works for casual staff Day 1 | ADR-004 |
| 2026-01-07 | Hard Deletes Over Soft Deletes | Simplifies RLS policies, reduces storage costs, clearer data model for MVP | ADR-002 |
| 2026-03-15 | Implement Soft Delete for Workers | Changed from hard delete to preserve historical data (SMS logs, access logs, tokens) while excluding from active queries | No ADR (implementation decision) |
