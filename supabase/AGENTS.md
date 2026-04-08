# Supabase Instructions

This file applies to `supabase`.

## Source of Truth

- Database changes must go through migration files.
- Do not treat the live database as the source of truth.

## Safety Rules

- Preserve multi-tenant isolation.
- Preserve or improve RLS coverage when schema changes touch tenant-owned data.
- Avoid destructive migration patterns unless the user explicitly asks for them.

## Change Rules

- Keep migration files forward-only and reviewable.
- Update seed data only when the local developer flow actually depends on it.
- If schema changes affect API contracts or docs, update those in the same patch.

