---
description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Source**: `specs/[###-feature-name]/` | **Requires**: plan.md, spec.md

## Task Format

```text
- [ ] T### [P?] [US#?] Description with exact file path
```

- **[P]** = parallelisable (different files, no dependency on incomplete tasks)
- **[US#]** = user story label (required in story phases; omitted in Setup/Foundational/Polish)

<!-- Replace ALL sample tasks below with real tasks derived from spec.md, plan.md, data-model.md, and contracts/. -->

## Phase 1: Setup

- [ ] T001 Create project structure per plan.md
- [ ] T002 Install dependencies and configure tooling

**Checkpoint**: Project builds and lints cleanly.

---

## Phase 2: Foundational (blocks all stories)

- [ ] T003 [Database/auth/routing/shared infrastructure task with file path]

**Checkpoint**: Foundation ready — story phases can begin.

---

## Phase 3: [US1 Title] (P1) — MVP

**Goal**: [What this story delivers]
**Verify independently**: [How to test this story alone]

- [ ] T0XX [P] [US1] [Model/service/endpoint task with file path]

**Checkpoint**: US1 fully functional and independently testable.

---

## Phase 4+: [US2 Title] (P2)

<!-- Repeat the Phase 3 pattern for each additional user story in priority order. -->

---

## Final Phase: Polish & Cross-Cutting

- [ ] TXXX Documentation, cleanup, security hardening, quickstart.md validation

---

## Dependencies

- **Setup → Foundational → User Stories → Polish** (sequential gates)
- User stories can run in parallel after Foundational completes
- Within a story: models → services → endpoints → integration
- Tests (if requested) written before implementation, must fail first
