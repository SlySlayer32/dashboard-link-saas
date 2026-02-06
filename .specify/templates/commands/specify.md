---
description: Create or update the feature specification from a natural language feature description.
handoffs: 
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Create a plan for the spec. I am building with...
  - label: Clarify Spec Requirements
    agent: speckit.clarify
    prompt: Clarify specification requirements
    send: true
scripts:
  sh: scripts/bash/create-new-feature.sh --json "{ARGS}"
  ps: scripts/powershell/create-new-feature.ps1 -Json "{ARGS}"
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Chain

```text
constitution → [SPECIFY] → clarify → plan → tasks → analyze → implement
```

- **Position**: Entry point — creates the feature spec
- **Prerequisites**: Constitution at `/memory/constitution.md` must exist
- **Next step**: `/speckit.clarify` (if ambiguities remain) or `/speckit.plan` (if spec is clean)

## Outline

The text after `/speckit.specify` **is** the feature description. Do not ask the user to repeat it unless empty.

### 1. Branch Setup

1. Generate a **2-4 word short name** (action-noun, e.g., `user-auth`, `analytics-dashboard`).
2. Find the next available number:
   - `git fetch --all --prune`
   - Check remote branches, local branches, and `specs/` directories matching `[0-9]+-<short-name>`
   - Use highest N+1 (or 1 if none found)
3. Run `{SCRIPT}` **once** with `--number N --short-name "<name>" "<description>"`. Parse JSON output for BRANCH_NAME and SPEC_FILE.
   - For single quotes in args: use `"I'm Groot"` (double-quote).

### 2. Generate Specification

1. Load `templates/spec-template.md` for required sections and `/memory/constitution.md` for project constraints.
2. Parse feature description → extract actors, actions, data, constraints.
3. Fill all template sections with concrete details:
   - **User Scenarios**: Prioritised stories (P1, P2…) with Given/When/Then acceptance criteria. If no clear user flow → ERROR.
   - **Functional Requirements**: Each must be testable. Use reasonable defaults for unspecified details.
   - **Key Entities**: Include if data is involved.
   - **Success Criteria**: Measurable, technology-agnostic, user-focused outcomes.
4. For unclear aspects — make informed guesses. Only use `[NEEDS CLARIFICATION: question]` (max 3) when the choice significantly impacts scope/security/UX and no reasonable default exists.
5. Write to SPEC_FILE.

### 3. Validate & Resolve

1. Create `FEATURE_DIR/checklists/requirements.md` with quality checks: no implementation details, testable requirements, measurable success criteria, edge cases identified, scope bounded.
2. Review spec against checklist. Fix failing items (max 3 iterations).
3. If `[NEEDS CLARIFICATION]` markers remain (max 3):
   - Present each as a question with options table (A/B/C/Custom) and implications
   - Wait for user response, then update spec
4. Report: branch name, spec path, checklist status, next step (`/speckit.clarify` or `/speckit.plan`).

**NOTE:** The script creates and checks out the branch before writing.

## Guidelines

- Focus on **WHAT** and **WHY** — never HOW (no tech stack, APIs, code).
- Written for non-technical stakeholders.
- Mandatory sections must be completed; remove inapplicable optional sections entirely.
- Make informed guesses; document assumptions. Prioritise clarifications: scope > security > UX > technical.
- Success criteria must be measurable, technology-agnostic, user-focused, and verifiable.
