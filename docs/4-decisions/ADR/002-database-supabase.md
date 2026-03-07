# ADR-002: Use Supabase (PostgreSQL) for Database and Auth
**Date:** 2026-01-07  
**Status:** Accepted

## Context
Need a database solution that supports multi-tenant isolation, authentication, and real-time features. Solo developer needs to minimize operational complexity while maintaining security and scalability. Budget constraints require cost-effective solution with generous free tier.

## Options Considered

1. **Firebase (Firestore + Auth)** — Google's BaaS platform
   - Pros: Mature, excellent real-time features, generous free tier, easy auth
   - Cons: NoSQL doesn't fit relational data model, vendor lock-in, more expensive at scale, no native SQL

2. **Self-hosted PostgreSQL + custom auth** — Full control
   - Pros: Complete control, no vendor lock-in, cheapest at scale
   - Cons: High operational burden (backups, scaling, security patches), auth implementation from scratch, no built-in real-time

3. **Supabase (PostgreSQL + Auth + Storage + Realtime)** — Open-source Firebase alternative
   - Pros: PostgreSQL (relational + JSONB flexibility), built-in RLS for multi-tenant isolation, Auth included, Storage included, Realtime included, generous free tier, open-source (less vendor lock-in)
   - Cons: Newer platform (less mature than Firebase), smaller community, self-hosting requires DevOps knowledge

## Decision
Use Supabase for database, authentication, storage, and real-time features.

**Primary reasons:**
- PostgreSQL with Row-Level Security (RLS) provides database-level multi-tenant isolation (critical security requirement)
- All-in-one platform (DB + Auth + Storage + Realtime) reduces operational complexity for solo developer
- Built-in authentication eliminates need to build auth from scratch
- Generous free tier (500MB DB, 2GB bandwidth, 50K MAU) covers MVP phase
- Open-source reduces vendor lock-in risk (can self-host if needed)

## Consequences

**Positive:**
- RLS enforces multi-tenant isolation at database level (even SQL injection can't cross tenant boundaries)
- Authentication handled by Supabase Auth (JWT, OAuth, MFA support)
- Storage API ready for future file upload features
- Realtime subscriptions enable live dashboard updates (future feature)
- Automatic daily backups included
- Reduces operational complexity significantly (no server management, no auth implementation)

**Negative:**
- Vendor lock-in risk (mitigated: open-source, can self-host)
- Newer platform means smaller community and fewer Stack Overflow answers
- Free tier connection limit (60 connections) may require connection pooling at scale
- Supabase-specific patterns (RLS, PostgREST) require learning

**Neutral:**
- PostgreSQL is industry-standard (easy to migrate if needed)
- Can use Prisma or raw SQL for database access (flexibility maintained)
- Self-hosting option exists but requires DevOps expertise
