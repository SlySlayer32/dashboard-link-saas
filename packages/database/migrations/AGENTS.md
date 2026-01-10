# Database Migrations Agent Guide

## Scope
Supabase SQL migrations.

## Rules
- Never edit applied migrations; add new files only.
- Include RLS policies and grants when schema changes.
- Keep filenames ordered and descriptive.

## Touchpoints
- Run via `pnpm db:migrate` and `pnpm db:seed`.

## Tests
- Validate locally with Supabase CLI.
