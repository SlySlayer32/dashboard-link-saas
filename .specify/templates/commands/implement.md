---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md
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
constitution → specify → clarify → plan → tasks → analyze → [IMPLEMENT]
```

- **Position**: Final step — writes code from tasks.md
- **Prerequisites**: tasks.md (required), plan.md (required). If missing → run `/speckit.tasks` first.
- **Auto-load**: ALWAYS read `/memory/constitution.md` to enforce project rules during implementation
- **Next step**: Done — feature is implemented

## Execution

### 1. Setup

Run `{SCRIPT}` from repo root. Parse JSON for FEATURE_DIR and AVAILABLE_DOCS. All paths absolute. Use double-quotes for args with apostrophes.

### 2. Checklist Gate (if FEATURE_DIR/checklists/ exists)

Scan all checklist files. Count `- [ ]` (incomplete) vs `- [x]`/`- [X]` (complete). Display status table. If any incomplete → STOP and ask user whether to proceed.

### 3. Load Context

- **Required**: tasks.md (task list), plan.md (tech stack, structure), `/memory/constitution.md` (project rules)
- **If exists**: data-model.md, contracts/, research.md, quickstart.md

### 4. Project Setup

Verify/create ignore files (`.gitignore`, `.dockerignore`, `.eslintignore`, `.prettierignore`, etc.) based on detected tech stack from plan.md. If file exists, append missing critical patterns only. If missing, create with standard patterns for the technology.

### 5. Execute Tasks

Parse tasks.md phases. Execute phase-by-phase:

- **Phase order**: Setup → Foundational → Story phases → Polish
- **Dependencies**: Sequential tasks in order; `[P]` tasks can run in parallel
- **TDD**: If test tasks exist, execute before implementation tasks
- **Same-file tasks**: Must run sequentially
- **Checkpoints**: Verify phase completion before proceeding

### 6. Progress & Error Handling

- Report progress after each task
- Mark completed tasks as `[X]` in tasks.md
- Halt on non-parallel task failure; continue parallel tasks and report failures
- Provide error context and suggest next steps

### 7. Completion

- Verify all tasks completed
- Check implementation matches spec and plan
- Validate tests pass
- Report final status summary

If tasks.md is missing or incomplete → suggest running `/speckit.tasks` first.
