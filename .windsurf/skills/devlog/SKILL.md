---
name: devlog
description: Reference formats, headers, grouping rules, and evidence sources used by the devlog workflow. Contains every template the workflow needs to create and populate the docs/devlog/ folder structure. Used by devlog.md and bugfix.md — do not run directly.
compatibility: Used by .windsurf/workflows/devlog.md and .windsurf/workflows/bugfix.md
metadata:
  author: dashboard-link
  source: .windsurf/skills/devlog/SKILL.md
---

# Devlog Skill — Reference

---

## Action Types

| Type | When to Use |
|------|-------------|
| `BUILD` | New feature, component, endpoint, or page created |
| `BUGFIX` | Bug found and fixed or logged for later |
| `CLEANUP` | Dead code, unused components, or redundant files removed |
| `DECISION` | Technical or product decision made (reference ADR if one exists) |
| `REFACTOR` | Code restructured without behaviour change |
| `CONFIG` | Environment, tooling, deployment, or package config changed |
| `DOCS` | Documentation created or updated |
| `REVERT` | Previous change rolled back |
| `MILESTONE` | Phase or major goal completed |

---

## Folder Structure

```
docs/devlog/
  INDEX.md          ← master index, one row per entry, links to monthly files
  YYYY-MM.md        ← one file per calendar month, sealed when month ends
  decisions.md      ← all architectural and product decisions, permanent
  bugs.md           ← all bugs found and their status, open and closed
```

---

## INDEX.md Header

```markdown
# Dashboard Link — Development Log Index

**Project**: Dashboard Link (CleanConnect SaaS)
**Developer**: Solo founder
**Started**: [date from earliest git commit or constitution ratification]
**Index Updated**: [today YYYY-MM-DD]

For full entry detail, open the monthly file linked in each row.

---

## Entry Index

| # | Date | Action | Summary | File |
|---|------|--------|---------|------|

---
```

---

## Monthly File Header

```markdown
# Devlog — [Month Name YYYY]

**Project**: Dashboard Link
**Status**: [ACTIVE | SEALED — do not edit]
**Entries**: [N]

---
```

---

## decisions.md Header

```markdown
# Dashboard Link — Decisions Log

All architectural and product decisions made during development.
Each entry is permanent and append-only.
For full ADR detail see `docs/4-decisions/ADR/`.

---
```

---

## bugs.md Header

```markdown
# Dashboard Link — Bug History

All bugs discovered during development, open and closed.
Open bugs are tasks waiting to be fixed.
Closed bugs are resolved and documented.

---

## Open

[open bugs listed here — moved to Closed when fixed]

---

## Closed

[fixed bugs listed here — newest at top]

---
```

---

## Standard Entry Format

Used in all monthly files:

```markdown
---

## Entry #[N] — [YYYY-MM-DD] — [ACTION]: [Short title, 5–8 words]

**Status**: [completed / in-progress / logged-for-later / reverted]
**Feature**: [spec or feature name — omit if not applicable]
**Bug ID**: [BUG-YYYY-MM-DD-slug — omit if not a bugfix]
**Source**: [real-time | reconstructed-from-git | reconstructed-from-docs]

### What Happened
[2–4 sentences. Plain language. Written for a future developer or co-founder
with no shared context. No jargon. No assumed knowledge.]

### Files Touched
- `[exact file path]` — [created / modified / deleted] — [what changed and why]

### Why
[Mandatory. The reason for this change. What problem it solved. What user need
it serves. If a bug: what was broken and the impact. If a build: what value it
delivers. If a decision: what alternatives were considered. Reference relevant
constitution section if applicable.]

### Constitution Notes
[Flags raised, deviations approved, or sections applied. Write "None" if clean.]

### Git Commit
`[type(scope): description — e.g. feat(worker): add token expiry display]`
```

---

## BUGFIX Entry Format

Used in monthly files when triggered by bugfix workflow:

```markdown
---

## Entry #[N] — [YYYY-MM-DD] — BUGFIX: [Short title]

**Bug ID**: [BUG-YYYY-MM-DD-slug]
**Severity**: [CRITICAL / HIGH / MEDIUM / LOW]
**Status**: [fixed | logged-for-later]
**Source**: real-time

### What Happened
[What was broken. Where it was. What the user would have experienced.]

### Root Cause
[Exact file and line range. What was wrong and why it caused the bug.]

### Files Touched
- `[file path]` — [created / modified / deleted] — [what changed]

### Why
[Why this matters for the product. What risk it was causing.]

### Constitution Notes
[Any flags raised, or "None"]

### Git Commit
`[fix(scope): description — e.g. fix(auth): null guard missing in TokenService L84]`
```

---

## Decision Entry Format

Used in decisions.md:

```markdown
---

## [YYYY-MM-DD] — [Decision Title]

**ADR**: [ADR-XXX if one exists, otherwise "none"]
**Status**: [active | superseded | reversed]

### Decision
[One sentence: what was decided]

### Why
[Why this choice was made over alternatives. What constraints drove it.
What the long-term implication is.]

### Alternatives Considered
- [Option A] — rejected because [reason]
- [Option B] — rejected because [reason]

### Reversal Conditions
[What would need to change for this decision to be revisited]
```

---

## Bug History Entry Format

Used in bugs.md:

```markdown
### [BUG-YYYY-MM-DD-slug]

**Date Found**: [YYYY-MM-DD]
**Severity**: [CRITICAL / HIGH / MEDIUM / LOW]
**Status**: [open | fixed | logged-for-later | RECONSTRUCTED]
**Fixed In Entry**: [Entry #N — link to monthly file, or "pending"]

**What Was Wrong**: [one sentence]
**Fix Applied**: [one sentence, or "pending"]
```

---

## INDEX.md Row Format

```markdown
| [N] | [YYYY-MM-DD] | [ACTION] | [Summary — max 10 words] | [docs/devlog/YYYY-MM.md] |
```

Milestone rows:

```markdown
| ⭐ | [YYYY-MM-DD] | MILESTONE | Phase [N] complete | [docs/devlog/YYYY-MM.md] |
```

Sealed month rows:

```markdown
| — | [YYYY-MM] | SEALED | [N] entries — [Month YYYY] | [docs/devlog/YYYY-MM.md] |
```

---

## Evidence Sources (Bootstrap — Priority Order)

| Priority | Source | What to Extract |
|----------|--------|-----------------|
| 1 | `git log --all --date=short` | Dates, commit messages, changed files |
| 2 | `docs/4-decisions/ADR/` (all files) | Decision dates, choices, rationale |
| 3 | `.specify/memory/constitution.md` | Ratification date = project formal start |
| 4 | `docs/1-overview/ROADMAP.md` | Phase dates and milestones |
| 5 | `docs/6-product/FEATURES.md` | Completed features and their status |
| 6 | `docs/CONTEXT.md` | Current project state snapshot |
| 7 | `docs/2-architecture/TECH-STACK.md` | Stack decisions and rationale |
| 8 | `docs/2-architecture/ARCHITECTURE.md` | Structural decisions |
| 9 | `docs/3-api/API-OVERVIEW.md` | API build status |
| 10 | `.specify/specs/*/spec.md` (all) | Features built per spec |

---

## Grouping Rules (Bootstrap)

| Rule | Detail |
|------|--------|
| Same day + same area | Group into one entry |
| Same feature across multiple days | One entry per day |
| ADR found | Always its own DECISION entry, never grouped |
| Config commits | Group all config changes on same day into one CONFIG entry |
| Doc commits | Group all doc changes on same day into one DOCS entry |
| Unrelated changes on same day | Split into separate entries by area |
| Ambiguous commit message | Use file paths to infer the area and action type |

---

## Git Commit Message Conventions

```
feat(scope):     new feature or component
fix(scope):      bug fix
refactor(scope): code restructure, no behaviour change
docs(scope):     documentation change
config(scope):   environment, tooling, or package config
chore(scope):    cleanup, dead code removal
revert(scope):   rollback of a previous commit
```

Common scopes for this project: `admin`, `worker`, `api`, `database`, `sms`, `auth`, `plugins`, `devlog`, `docs`
