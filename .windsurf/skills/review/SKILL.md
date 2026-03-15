---
name: review
description: Reference formats, severity scales, finding types, and report structure used by the review workflow. Contains the findings table format, canonical path recommendation format, consistency check rules, and fix task format. Used by review.md — do not run directly.
compatibility: Used by .windsurf/workflows/review.md
metadata:
  author: dashboard-link
  source: .windsurf/skills/review/SKILL.md
---

# Review Skill — Reference

---

## Document Authority Order

When any conflict exists between governing documents, resolve using this hierarchy:

| Priority | Document | Location |
|----------|----------|----------|
| 1 — Highest | Constitution | `.specify/memory/constitution.md` |
| 2 | Feature Spec | `.specify/specs/[feature]/spec.md` |
| 3 | Implementation Plan | `.specify/specs/[feature]/plan.md` |
| 4 | Task List | `.specify/specs/[feature]/tasks.md` |
| 5 | Project Rules | `.windsurf/rules/projectrules.md` |
| 6 — Context only | Project Context | `docs/CONTEXT.md` |

Code never overrides documents. If code is right but docs are wrong — update the docs.

---

## Finding Types

| Type | Description |
|------|-------------|
| `VIOLATION` | Code breaks a constitution rule or spec requirement |
| `DUPLICATION` | Two or more things doing the same job — one must be removed |
| `CONFLICT` | Two contradictory approaches, patterns, or flows — one must be canonical |
| `GAP` | A spec requirement or task has no implementation |
| `ORPHAN` | Code exists with no spec or task backing it |
| `STALE_DOC` | Code is correct but the spec/plan/tasks no longer reflect it |
| `BUG` | Logic error, unhandled edge case, or incorrect behaviour |
| `SECURITY` | Vulnerability, data exposure, or RLS bypass risk |
| `IMPROVEMENT` | Non-blocking quality improvement worth considering |

---

## Severity Scale

| Severity | Condition | Action |
|----------|-----------|--------|
| `CRITICAL` | Constitution violation, security vulnerability, RLS/multi-tenant risk, data loss potential | Block — fix before anything ships |
| `HIGH` | Spec behaviour missing or wrong, duplicate canonical path, coverage gap in core feature | Fix promptly — saved as task if not applied now |
| `MEDIUM` | Orphan behaviour, stale doc, non-critical duplicate, unhandled edge case | Save as task — address before next major feature |
| `LOW` | Style issue, naming inconsistency, minor improvement | Save as task — address when convenient |

---

## Pre-Review Consistency Check Rules

Before touching code, verify documents are consistent with each other:

| Check | Pass Condition |
|-------|---------------|
| Spec requirements vs plan architecture | Plan supports every spec requirement — no requirements with no architectural home |
| Plan vs tasks | Every plan component has at least one task — no planned components with zero tasks |
| Tasks vs spec user stories | Every task maps to a user story or foundational need — no floating tasks |
| Constitution vs spec scope | Spec contains nothing explicitly excluded by constitution Section VIII |
| Terminology | Same concept uses the same name across all four documents |

If any check fails → report as `PRE-REVIEW BLOCK` with the specific conflict. Do not proceed with code review until resolved.

---

## Findings Table Format

```markdown
## Findings

| ID | Pass | Layer | Type | Severity | Location | Description | Recommended Action |
|----|------|-------|------|----------|----------|-------------|-------------------|
| R01 | 1 | constitution | VIOLATION | CRITICAL | `apps/api/src/routes/workers.ts:L34` | Direct Supabase call in route handler — must be in repository per File Structure Rules | Move DB call to `packages/database/src/repositories/WorkerRepository.ts` |
| R02 | 2 | spec | GAP | HIGH | `spec.md §FR-4` | Token expiry display requirement has no implementation in worker dashboard | Implement expiry countdown in `apps/worker/src/components/Dashboard.tsx` |
| R03 | 3 | implementation | DUPLICATION | HIGH | `TokenService.ts`, `auth-utils.ts` | Token validation logic exists in two places | Canonicalise in `TokenService.ts`, delete from `auth-utils.ts`, update plan.md §Services |
```

Column definitions:
- **ID**: Sequential R01, R02, R03...
- **Pass**: Which review pass found it (1=constitution, 2=spec/plan/tasks, 3=duplicates, 4=coverage, 5=code)
- **Layer**: `constitution` / `spec` / `plan` / `tasks` / `implementation`
- **Type**: From finding types table above
- **Severity**: CRITICAL / HIGH / MEDIUM / LOW
- **Location**: Exact file path + line number, or document section reference
- **Description**: What is wrong and why it matters
- **Recommended Action**: Specific, actionable — what to do, where, and what to update

---

## Canonical Path Recommendation Format

Written once at the end of the findings table, covering all conflicts and duplications found:

```markdown
## Canonical Path Recommendations

### [Conflict Title — e.g. Token Validation]

**Keep**: `[file path or function]` — matches spec §[X] and plan §[Y]
**Remove**: `[file path or function]` — duplicate, no spec backing
**Update**: `[document] §[section]` — change "[old text]" to "[new text]"

---

### [Next Conflict Title]
...

---

### No conflicts found
[Write this explicitly if Pass 3 found nothing]
```

---

## Fix Task Format

Generated for every CRITICAL and HIGH finding:

```markdown
- [ ] [REVIEW-YYYY-MM-DD-slug] [SEVERITY]: [plain description of fix] in `[file path]`
```

Examples:
```markdown
- [ ] [REVIEW-2026-03-15-token-dup] HIGH: Remove duplicate token validation from auth-utils.ts, canonicalise in TokenService.ts
- [ ] [REVIEW-2026-03-15-rls-bypass] CRITICAL: Add tenant middleware guard to /api/workers route — direct DB call bypasses RLS
```

---

## Constitution Quick Reference (Sections Most Commonly Violated)

**File Placement (Section I)**:
- Vendor SDK calls → `packages/*/src/adapters/` only
- Business logic → `apps/api/src/services/`
- UI components → `apps/*/src/components/`
- Utilities → `apps/*/src/lib/` or `packages/shared/src/utils/`

**TypeScript (Section I)**:
- Never use `any` — use `unknown` or proper types
- Never ignore TypeScript errors
- Never use `var`
- Props are immutable in React

**Established Patterns (Section I)**:
- All DB access through repositories — no direct SQL in route handlers
- Business logic in services only
- Middleware order: Logger → CORS → Tenant → Cache → Routes → Error
- Error handling via Hono.js `HTTPException` or custom error classes
- Component structure: Hooks → Event handlers → Render

**MVP Scope Gate (Section VIII)**:
- Check FEATURES.md before flagging orphan behaviour — feature may be planned but not yet specced
- Anything not in FEATURES.md that appears in the code is a genuine orphan

**Security Critical (Section II + IX)**:
- Multi-tenant isolation — always CRITICAL if breached
- Token validation — always CRITICAL if bypassed
- RLS enforcement — always CRITICAL if missing
- Phone number validation — E.164 format required

---

## Scope Detection Logic

| Condition | Scope Used | Git Command |
|-----------|------------|-------------|
| File paths in `$ARGUMENTS` | Those files only | — |
| Feature name in `$ARGUMENTS` | All files in that spec | — |
| Empty `$ARGUMENTS`, on main | Last commit | `git diff --name-only HEAD~1 HEAD` |
| Empty `$ARGUMENTS`, on feature branch | All branch changes | `git diff --name-only main...HEAD` |
