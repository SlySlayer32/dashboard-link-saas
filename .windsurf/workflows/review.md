---
description: Review code changes for strict conformance to constitution, spec, plan, and tasks — then check for bugs, security issues, duplicates, and orphaned code. Produces a single canonical path recommendation and writes a devlog entry. Fully autonomous.
---

## User Input

```text
$ARGUMENTS
```

## Goal

Enforce constitution compliance and eliminate code duplication. The primary job is to verify code follows constitution rules and find doubled-up implementations. Constitution is the single source of truth for architecture, patterns, and file placement.

---

## Execution Steps

### 1. Determine Scope

Read `$ARGUMENTS` to identify what to review:

- **File paths or glob patterns provided** → review those specific files
- **Feature name or spec slug provided** → find the relevant spec in `.specify/specs/` and review all files touched by that feature
- **`$ARGUMENTS` is empty** → run:

```bash
git diff --name-only HEAD~1 HEAD
```

Review all files changed in the most recent commit. If on a feature branch:

```bash
git diff --name-only main...HEAD
```

Review all files changed on this branch. State which scope was used at the top of the report.

---

### 2. Load Governing Documents

Load these two documents only:

1. `.specify/memory/constitution.md` — highest authority, non-negotiable
2. `.windsurf/rules/essential-rules.md` — project map and tech stack

These define all architectural rules, file placement patterns, and coding standards. No other documents needed.

---

### 3. Load the Changed Code

Read every changed file identified in Step 1.

For each changed file, also read its closest related files:
- The service it calls (if a route handler changed)
- The repository it uses (if a service changed)
- The component that renders it (if an API response shape changed)

Do not load the entire codebase — load only what is needed to trace the call path for each change.

---

### 4. Run the Three Review Passes

Work through each pass in order. Record every finding using the finding format in `.windsurf/skills/review/SKILL.md`.

#### Pass 1 — Constitution Conformance

For every changed file:
- Check naming conventions (files, variables, functions, types, enums) against Constitution Section I
- Check file placement against File Structure Rules (vendor SDKs in adapters, business logic in services, etc.)
- Check import order and cross-package boundaries (see `.windsurf/skills/review/import-validation.md`)
- Check TypeScript rules (no `any`, no ignored errors, strict mode)
- Check established patterns (Repository Pattern, Service Layer, Middleware Order, Error Handling)

Any violation of the constitution is automatically `CRITICAL`.

#### Pass 2 — Duplicates and Conflicting Paths

Scan the changed files and their related files for duplicates (see `.windsurf/skills/review/deduplication-patterns.md`):

- **Functional duplication**: Two or more functions doing the same thing
- **Type duplication**: Same data structure defined in multiple files
- **Component duplication**: UI components rendering the same thing
- **Validation duplication**: Same validation rules in multiple places
- **Data transformation duplication**: Same mapping logic in multiple layers

For each duplicate:
- Identify canonical version using the decision matrix (repositories > services > shared > adapters > app-specific)
- State explicitly what should be deleted or merged
- List all import sites that need updating

#### Pass 3 — Code Quality

Check the code for:
- Logic errors and incorrect behaviour
- Unhandled edge cases (null, undefined, empty arrays, zero values)
- Missing error handling or fallback paths
- Security issues (SQL injection risk, unvalidated input, exposed secrets, RLS bypass potential)
- Race conditions or async/await misuse
- Resource leaks (unclosed connections, uncleared timers)
- Import/reference errors (missing exports, circular dependencies, wrong signatures)

Reference the constitution section number for any finding that relates to a specific rule.

---

### 5. Build the Report

Output one structured report using the report format in `.windsurf/skills/review/SKILL.md`.

The report has three sections:

**Section A — Review Status**
Scope used. Governing documents loaded (constitution + essential rules).

**Section B — Findings Table**
One row per finding. See format in skill.

**Section C — Canonical Path Recommendations**
The most important section. Do not just list issues — resolve them.

For every duplicate or conflict found, write a clear recommendation:

```
Canonical path: [what to keep] — matches constitution §[section]
Remove: [what to delete, exact file/function/route]
Update imports: [list all files that need import changes]
```

If there are no conflicts — state that explicitly.

---

### 6. Produce Fix Tasks

For every `CRITICAL` or `HIGH` finding, generate a task in standard tasks.md format:

```
- [ ] [REVIEW-YYYY-MM-DD-slug] [severity]: [plain description of fix] in [file path]
```

Ask the user:

```
Fix options:
  A — Apply all CRITICAL and HIGH fixes now
  B — Save all fixes as tasks for later
  C — Apply CRITICAL fixes now, save HIGH fixes as tasks
```

Wait for A, B, or C.

- **A**: Apply fixes following all constitution rules. Mark tasks `[X]`.
- **B**: Append all tasks to `.specify/bugs/open-bugs.md` under `## Open [YYYY-MM-DD]`.
- **C**: Apply CRITICAL fixes now, append HIGH tasks to open-bugs.md.

MEDIUM and LOW findings are always saved as tasks, never auto-applied.

---

### 7. Confirm

Print:

```
✅ Review complete

Scope:       [files reviewed]
Findings:    [N critical] | [N high] | [N medium] | [N low]
Duplicates:  [N found and resolved]
Action:      [fixes applied / tasks saved / mixed]
```

---

## Rules

- Constitution violations are always CRITICAL — no exceptions
- Never apply MEDIUM or LOW fixes automatically — always save as tasks
- Always produce a canonical path recommendation for duplicates — not just a list of problems
- Use the deduplication decision matrix (repositories > services > shared > adapters > app-specific)
- Validate all imports against monorepo boundaries (no cross-app imports, vendor SDKs only in adapters)
- Focus on finding doubled-up code — that's the primary goal
