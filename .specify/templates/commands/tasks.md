---
description: Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts.
handoffs: 
  - label: Analyze For Consistency
    agent: speckit.analyze
    prompt: Run a project analysis for consistency
    send: true
  - label: Implement Project
    agent: speckit.implement
    prompt: Start the implementation in phases
    send: true
scripts:
  sh: scripts/bash/check-prerequisites.sh --json
  ps: scripts/powershell/check-prerequisites.ps1 -Json
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Chain

```text
constitution → specify → clarify → plan → [TASKS] → analyze → implement
```

- **Position**: Task generation hub — converts design artifacts into executable task list
- **Prerequisites**: plan.md (required), spec.md (required). If missing, ERROR with instruction to run `/speckit.plan` or `/speckit.specify` first.
- **Auto-load**: ALWAYS read `/memory/constitution.md` to enforce project rules in task design
- **Next step**: `/speckit.analyze` (recommended) or `/speckit.implement` (if skipping analysis)

## Outline

1. **Setup**: Run `{SCRIPT}` from repo root. Parse JSON for FEATURE_DIR and AVAILABLE_DOCS. All paths absolute. Use double-quotes for args with apostrophes.

2. **Load documents** from FEATURE_DIR:
   - **Required**: plan.md (tech stack, structure), spec.md (user stories with priorities)
   - **Required**: `/memory/constitution.md` (project rules — enforce in all task descriptions)
   - **Optional**: data-model.md, contracts/, research.md, quickstart.md

3. **Generate tasks** using `templates/tasks-template.md`:
   - Extract user stories (P1, P2…) from spec.md → one phase per story
   - Map entities (data-model.md) and endpoints (contracts/) to their stories
   - Shared entities serving multiple stories → Setup or Foundational phase
   - Each task must be specific enough for an LLM to execute without extra context

4. **Report**: tasks.md path, total count, count per story, MVP scope (typically US1 only).

Context: {ARGS}

## Task Format (REQUIRED)

```text
- [ ] T### [P?] [US#?] Description with exact file path
```

- **Checkbox** (`- [ ]`): always required
- **T###**: sequential ID in execution order
- **[P]**: only if parallelisable (different files, no dependencies)
- **[US#]**: required in story phases; omitted in Setup/Foundational/Polish
- **Description**: clear action + exact file path

## Task Organisation

| Source | Mapping |
|--------|---------|
| User stories (spec.md) | Each story → own phase (P1, P2…) with models → services → endpoints |
| Contracts | Each endpoint → the user story it serves |
| Data model | Each entity → its story; shared entities → Setup/Foundational |
| Infrastructure | Shared → Setup (Phase 1); blocking → Foundational (Phase 2) |

**Phase order**: Setup → Foundational (blocks stories) → Story phases (priority order) → Polish.
**Tests**: Only include if explicitly requested. If included, write before implementation.
