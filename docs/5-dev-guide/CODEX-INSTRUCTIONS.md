# Codex Instruction File Best Practices

This document explains how to write and maintain `AGENTS.md` files for this repository.

## What OpenAI Codex Expects

The current official Codex guidance treats `AGENTS.md` files as scoped instruction files:

- A file applies to the directory tree rooted where that file lives.
- A deeper `AGENTS.md` overrides a broader one when they conflict.
- Direct prompt instructions still outrank `AGENTS.md`.

Because of that, the safest pattern is a small hierarchy of focused files instead of one giant file.

## Recommended Hierarchy For This Repo

- Root `AGENTS.md`: stable repo-wide rules
- `apps/AGENTS.md`: rules common to all deployable apps
- `apps/api/AGENTS.md`: runtime and API-specific rules
- `apps/admin/AGENTS.md`: manager UI rules
- `apps/worker/AGENTS.md`: worker UI rules
- `packages/AGENTS.md`: shared library rules
- `supabase/AGENTS.md`: schema and migration rules

## What Belongs In A Good `AGENTS.md`

- Stable architecture facts
- Commands the agent should run to verify work
- Rules that are easy to violate accidentally
- Scope-specific conventions
- Safety boundaries

Good examples:

- "Use explicit `.js` extensions for Node ESM runtime imports in this subtree."
- "Run `pnpm --filter @dashboard-link/api build` after changing API code."
- "Keep tenant scoping enforced for protected routes."

## What Should Not Go In `AGENTS.md`

- Sprint notes
- Temporary bug lists
- Personal reminders
- Ambiguous preferences with no action attached
- Rules that duplicate broader files without adding anything new

Those belong in normal docs, tickets, or handover notes instead.

## Authoring Principles

1. Keep the root file short.
2. Push details down into the narrowest correct scope.
3. Write instructions as concrete actions, not vague advice.
4. Prefer durable truths over status snapshots that will go stale.
5. Put verification commands near the code they apply to.
6. Update instruction files when startup paths, env conventions, or architecture boundaries change.

## Pattern To Follow

Use this shape when adding a new scoped instruction file:

```md
# <Area> Instructions

This file applies to `<path>`.

## Purpose

- What this area is for

## Rules

- Concrete rules Codex should follow here

## Verification

- Exact commands to run after touching this area
```

## How To Keep These Files Healthy

- Review them whenever the repo structure changes.
- Remove rules that are no longer true.
- If a rule only matters in one subtree, move it out of the root file.
- If two files repeat the same rule, keep it only in the highest scope that truly needs it.

## Source Notes

These recommendations are based on the current official OpenAI Codex guidance around `AGENTS.md` scope, precedence, and verification behavior, plus repo-specific decisions for CleanConnect.

