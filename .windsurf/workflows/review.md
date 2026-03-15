---
description: Review code changes for strict conformance to constitution, spec, plan, and tasks — then check for bugs, security issues, duplicates, and orphaned code. Produces a single canonical path recommendation and writes a devlog entry. Fully autonomous.
---

## User Input

```text
$ARGUMENTS
```

## Goal

Perform a spec-driven code review. The primary job is not to find bugs — it is to verify that what was built matches what was agreed. Constitution and spec are the source of truth. Code that does not conform to them is wrong. Documents that do not reflect the code are outdated. Both are reported. Both are actionable.

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

### 2. Load All Governing Documents

Read these in strict authority order before looking at any code:

1. `.specify/memory/constitution.md` — highest authority, non-negotiable
2. Active `spec.md` for the feature being reviewed (from `.specify/specs/[feature]/spec.md`)
3. Active `plan.md` for the feature (from `.specify/specs/[feature]/plan.md`)
4. Active `tasks.md` for the feature (from `.specify/specs/[feature]/tasks.md`)
5. `.windsurf/rules/projectrules.md` — project map and locked constraints
6. `docs/CONTEXT.md` — current project state

If no active feature spec exists (e.g. reviewing a config change or infrastructure work), use only the constitution and projectrules as authority. Note this at the top of the report.

---

### 3. Run Pre-Review Consistency Check

Before reviewing code, check if the governing documents are internally consistent.

Read `.windsurf/skills/review/SKILL.md` for the consistency check rules.

If the spec, plan, and tasks contradict each other — flag this as a `PRE-REVIEW BLOCK` and report it before any code findings. The user must resolve the document conflict before the review can be meaningful.

If the documents are consistent — proceed.

---

### 4. Load the Changed Code

Read every changed file identified in Step 1.

For each changed file, also read its closest related files:
- The service it calls (if a route handler changed)
- The repository it uses (if a service changed)
- The component that renders it (if an API response shape changed)

Do not load the entire codebase — load only what is needed to trace the call path for each change.

---

### 5. Run the Five Review Passes

Work through each pass in order. Record every finding using the finding format in `.windsurf/skills/review/SKILL.md`.

#### Pass 1 — Constitution Conformance

For every changed file:
- Check naming conventions (files, variables, functions, types, enums) against Section I
- Check file placement against the File Structure Rules (adapters in adapters, business logic in services, etc.)
- Check import order against the Import Order rules
- Check TypeScript rules (no `any`, no ignored errors, strict mode)
- Check that established patterns are followed (Repository Pattern, Service Layer, Middleware Order, Error Handling, Component Structure)

Any violation of the constitution is automatically `CRITICAL`.

#### Pass 2 — Spec / Plan / Tasks Conformance

For every changed file, ask:
- Does the behaviour implemented match the functional requirements in spec.md?
- Does the architecture and structure match plan.md?
- Is this change covered by a task in tasks.md? If not, it is orphan behaviour.
- Is there a spec requirement that this change was supposed to address but doesn't? That is a coverage gap.
- Does the implementation introduce behaviour that is explicitly out of scope in the constitution Section VIII or spec.md?

If the code is correct but the spec/plan/tasks are outdated — state precisely which document section needs to be updated. Do not penalise the code for a stale document.

#### Pass 3 — Duplicates and Conflicting Paths

Scan the changed files and their related files for:
- Two or more functions, services, routes, or components that do the same thing
- Two different patterns solving the same problem (e.g. two ways of handling token validation)
- Competing flows where it is unclear which path is canonical
- Data transformations happening in multiple layers when they should happen in one

For each duplicate or conflict:
- Identify which version is canonical (default to whatever matches spec/plan)
- State explicitly what should be deleted or merged
- State if the spec/plan/tasks need to be updated to reflect the resolution

#### Pass 4 — Coverage and Orphans

Cross-reference the changed files against spec.md and tasks.md:

**Coverage gaps** — requirements or tasks that are related to this change but have no implementation
- List the spec requirement or task ID
- State what is missing

**Orphan behaviour** — code that exists in the changed files but has no corresponding requirement or task
- List the file and function/route/component
- Recommend: delete it, or add it to the spec

#### Pass 5 — Code Quality

Now — and only now — check the code itself for:
- Logic errors and incorrect behaviour
- Unhandled edge cases (null, undefined, empty arrays, zero values)
- Missing error handling or fallback paths
- Security issues (SQL injection risk, unvalidated input, exposed secrets, RLS bypass potential)
- Race conditions or async/await misuse
- Resource leaks (unclosed connections, uncleared timers)
- API contract violations (response shapes that don't match what callers expect)
- Incorrect caching (stale data, wrong cache keys, missing invalidation)
- TypeScript strict mode violations not caught in Pass 1

Reference the constitution section number for any finding that relates to a specific rule.

---

### 6. Build the Report

Output one structured report using the report format in `.windsurf/skills/review/SKILL.md`.

The report has three sections:

**Section A — Pre-Review Status**
Document consistency check result. Scope used. Governing documents loaded.

**Section B — Findings Table**
One row per finding. See format in skill.

**Section C — Canonical Path Recommendation**
The most important section. Do not just list issues — resolve them.

For every duplicate, conflict, or architectural issue found: write a single clear recommendation:

```
Canonical path: [what to keep]
Remove: [what to delete, exact file/function/route]
Update docs: [which spec/plan/tasks section needs to change, and how]
```

If there are no conflicts — state that explicitly.

---

### 7. Produce Fix Tasks

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

### 8. Write Devlog Entry

After the fix decision is resolved, open `docs/devlog/` and write an entry to the current month file using the standard entry format from `.windsurf/skills/devlog/SKILL.md`.

Entry fields:
- `ACTION`: `REVIEW`
- `SUMMARY`: One sentence — what was reviewed, how many findings, what was done
- `FILES_AFFECTED`: All changed files that were reviewed
- `FEATURE`: Feature name from spec if applicable
- `STATUS`: completed
- `NOTES`: Count of findings by severity, canonical path recommendation summary
- `CONSTITUTION_FLAGS`: Any CRITICAL constitution violations found

Update `docs/devlog/INDEX.md`.

---

### 9. Confirm

Print:

```
✅ Review complete

Scope:       [files reviewed]
Findings:    [N critical] | [N high] | [N medium] | [N low]
Docs issues: [N pre-review blocks or conformance issues]
Action:      [fixes applied / tasks saved / mixed]
Devlog:      Entry #[N] written to docs/devlog/[YYYY-MM].md

Suggested git commit:
[commit message]
```

---

## Rules

- Constitution violations are always CRITICAL — no exceptions
- Never apply MEDIUM or LOW fixes automatically — always save as tasks
- Never skip the governing documents pass — code review without spec conformance is incomplete
- If documents contradict each other, block the review and report the conflict first
- Always produce a canonical path recommendation — not just a list of problems
- Always write a devlog entry — no review session is undocumented
- Never guess at intent — if a behaviour has no spec backing, call it an orphan
