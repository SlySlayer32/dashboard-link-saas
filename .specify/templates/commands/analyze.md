---
description: Perform a non-destructive cross-artifact consistency and quality analysis across spec.md, plan.md, and tasks.md after task generation.
scripts:
  sh: scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
  ps: scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Chain

```text
constitution → specify → clarify → plan → tasks → [ANALYZE] → implement
```

- **Position**: Quality gate — read-only consistency check before implementation
- **Prerequisites**: spec.md, plan.md, tasks.md (all required)
- **Next step**: `/speckit.implement` (if no CRITICAL issues) or fix issues first

## Goal

**READ-ONLY** analysis of spec.md, plan.md, and tasks.md for inconsistencies, gaps, and ambiguities. Run after `/speckit.tasks`. Do NOT modify any files.

Constitution (`/memory/constitution.md`) is non-negotiable — conflicts are automatically CRITICAL.

## Execution

### 1. Setup

Run `{SCRIPT}` once. Parse JSON for FEATURE_DIR and AVAILABLE_DOCS. Derive SPEC, PLAN, TASKS paths. Abort if any required file is missing. Use double-quotes for args with apostrophes.

### 2. Load & Model

Load minimal context from each artifact. Build internal mappings:
- Requirements inventory (functional + non-functional, keyed by slug)
- User story → acceptance criteria inventory
- Task → requirement/story coverage map
- Constitution MUST/SHOULD rules

### 3. Detection Passes (max 50 findings)

| Pass | What to Find |
|------|-------------|
| **Duplication** | Near-duplicate requirements |
| **Ambiguity** | Vague adjectives without metrics, unresolved placeholders (TODO, ???) |
| **Underspecification** | Requirements missing measurable outcomes, tasks referencing undefined components |
| **Constitution** | Any violation of a MUST principle |
| **Coverage gaps** | Requirements with zero tasks, tasks with no mapped requirement |
| **Inconsistency** | Terminology drift, entity mismatches, conflicting requirements, ordering contradictions |

### 4. Severity

- **CRITICAL**: Constitution violation, zero-coverage blocking requirement
- **HIGH**: Conflicting/duplicate requirements, untestable criteria
- **MEDIUM**: Terminology drift, missing non-functional coverage
- **LOW**: Style/wording improvements

### 5. Report (output to chat, no file writes)

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|

Plus: Coverage summary table, constitution issues, unmapped tasks, and metrics (total requirements, total tasks, coverage %, critical count).

### 6. Next Actions

- CRITICAL issues → resolve before `/speckit.implement`
- LOW/MEDIUM only → may proceed with suggestions
- Offer: "Want concrete remediation edits for the top N issues?" (do NOT apply automatically)

Context: {ARGS}
