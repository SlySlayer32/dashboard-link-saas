---
description: Identify underspecified areas in the current feature spec by asking up to 5 highly targeted clarification questions and encoding answers back into the spec.
handoffs: 
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Create a plan for the spec. I am building with...
scripts:
   sh: scripts/bash/check-prerequisites.sh --json --paths-only
   ps: scripts/powershell/check-prerequisites.ps1 -Json -PathsOnly
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Chain

```text
constitution → specify → [CLARIFY] → plan → tasks → analyze → implement
```

- **Position**: Optional refinement step — resolves spec ambiguity before planning
- **Prerequisites**: spec.md must exist (run `/speckit.specify` first)
- **Next step**: `/speckit.plan`

## Goal

Detect ambiguity and missing decisions in the feature spec. Ask up to 5 targeted questions, encode answers back into the spec. Run BEFORE `/speckit.plan`.

## Execution

### 1. Setup

Run `{SCRIPT}` once. Parse JSON for FEATURE_DIR and FEATURE_SPEC. Abort if missing — instruct user to run `/speckit.specify` first. Use double-quotes for args with apostrophes.

### 2. Scan for Ambiguity

Load spec. Internally classify each area as Clear / Partial / Missing:

- **Scope**: goals, out-of-scope, user roles
- **Data**: entities, relationships, state transitions, scale
- **UX**: journeys, error/empty/loading states
- **Non-functional**: performance, security, reliability, observability
- **Integrations**: external APIs, failure modes, protocols
- **Edge cases**: negative scenarios, rate limits, conflicts
- **Terminology**: consistency, undefined terms, vague adjectives ("robust", "fast")

For Partial/Missing areas, generate candidate questions (max 5) ranked by `Impact × Uncertainty`. Only ask questions that materially affect architecture, data model, testing, or UX.

### 3. Question Loop (interactive, one at a time)

For each question:
1. Present **one question** with a **recommended answer** and options table (A/B/C or short answer ≤5 words).
2. User replies with option letter, "yes" (accepts recommendation), or custom answer.
3. After acceptance, immediately:
   - Append to `## Clarifications > ### Session YYYY-MM-DD`: `- Q: <question> → A: <answer>`
   - Update the relevant spec section (requirements, entities, edge cases, etc.)
   - Replace any invalidated statements — no contradictory text.
   - Save spec after each integration.

**Stop when**: all critical ambiguities resolved, user says "done", or 5 questions asked.

### 4. Validate & Report

- No duplicate clarification bullets; no lingering placeholders the answer was meant to resolve.
- Report: questions asked, spec path, sections touched, coverage summary (Resolved / Deferred / Clear / Outstanding).
- Suggest next command (`/speckit.plan` or re-run `/speckit.clarify`).

## Rules

- Max 5 questions total (retries don't count as new).
- No tech stack questions unless they block functional clarity.
- Respect early termination ("stop", "done", "proceed").
- If no ambiguities found: report "No critical ambiguities" and suggest proceeding.

Context: {ARGS}
