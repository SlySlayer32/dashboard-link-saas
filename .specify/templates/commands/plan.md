---
description: Execute the implementation planning workflow using the plan template to generate design artifacts.
handoffs: 
  - label: Create Tasks
    agent: speckit.tasks
    prompt: Break the plan into tasks
    send: true
  - label: Create Checklist
    agent: speckit.checklist
    prompt: Create a checklist for the following domain...
scripts:
  sh: scripts/bash/setup-plan.sh --json
  ps: scripts/powershell/setup-plan.ps1 -Json
agent_scripts:
  sh: scripts/bash/update-agent-context.sh __AGENT__
  ps: scripts/powershell/update-agent-context.ps1 -AgentType __AGENT__
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Chain

```text
constitution → specify → clarify → [PLAN] → tasks → analyze → implement
```

- **Position**: Technical design — translates spec into architecture and contracts
- **Prerequisites**: spec.md (required), constitution at `/memory/constitution.md` (required)
- **Next step**: `/speckit.tasks`

## Outline

1. **Setup**: Run `{SCRIPT}` from repo root. Parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH. Use double-quotes for args with apostrophes.
2. **Load context**: Read FEATURE_SPEC, `/memory/constitution.md`, and IMPL_PLAN template.
3. **Execute plan workflow** (Phase 0 → Phase 1 below).
4. **Stop and report**: branch, IMPL_PLAN path, and generated artifacts.

### Phase 0: Research

1. Fill Technical Context in plan template; mark unknowns as `NEEDS CLARIFICATION`.
2. Fill Constitution Check from constitution. ERROR if violations are unjustified.
3. Research each unknown and consolidate in `research.md` (Decision / Rationale / Alternatives).

**Output**: research.md — all unknowns resolved.

### Phase 1: Design & Contracts

1. Extract entities from spec → `data-model.md` (name, fields, relationships, validation, state transitions).
2. Map functional requirements to API endpoints → `contracts/` (OpenAPI/GraphQL schemas).
3. Generate `quickstart.md` (test scenarios).
4. Run `{AGENT_SCRIPT}` to update agent-specific context (adds new tech, preserves manual additions).
5. Re-evaluate Constitution Check post-design.

**Output**: data-model.md, contracts/, quickstart.md, agent context file.

## Rules

- All paths must be absolute.
- ERROR on gate failures or unresolved clarifications.
