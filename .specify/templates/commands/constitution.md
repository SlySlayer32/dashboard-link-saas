---
description: Create or update the project constitution from interactive or provided principle inputs, ensuring all dependent templates stay in sync.
handoffs: 
  - label: Build Specification
    agent: speckit.specify
    prompt: Implement the feature specification based on the updated constitution. I want to build...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Chain

```text
[CONSTITUTION] → specify → clarify → plan → tasks → analyze → implement
```

- **Position**: Foundation — defines non-negotiable project rules all workflows enforce
- **Prerequisites**: None (this is the starting point)
- **Next step**: `/speckit.specify` (to create a feature spec under these rules)

## Outline

Update the project constitution at `/memory/constitution.md`. Collect/derive values, fill the template, propagate changes to dependent artifacts.

### 1. Load & Identify

Load `/memory/constitution.md`. Identify all `[PLACEHOLDER]` tokens. Respect user-specified principle count.

### 2. Collect Values

- Use values from user input first; infer remainder from repo context (README, docs, prior versions).
- **Versioning** (semver): MAJOR = principle removal/redefinition; MINOR = new principle/section; PATCH = wording/typo fixes.
- **Dates**: ISO `YYYY-MM-DD`. `LAST_AMENDED_DATE` = today if changes made.

### 3. Draft Update

- Replace all placeholders with concrete text. No unexplained bracket tokens remaining.
- Each principle: succinct name + non-negotiable rules (MUST/SHOULD, no vague language).
- Governance section: amendment procedure, versioning policy, compliance expectations.

### 4. Propagate to Dependents

Check and update if needed:
- `templates/plan-template.md` — Constitution Check alignment
- `templates/spec-template.md` — mandatory sections/constraints
- `templates/tasks-template.md` — principle-driven task types
- `templates/commands/*.md` — no outdated references
- Runtime docs (README, quickstart) — principle references

### 5. Validate & Write

- No unexplained placeholders; version matches; dates ISO format; principles are declarative and testable.
- Write to `/memory/constitution.md` (overwrite).

### 6. Report

- Version change + bump rationale
- Files updated or flagged for follow-up
- Suggested commit message

If critical info missing, insert `TODO(<FIELD>): explanation` and include in report.
