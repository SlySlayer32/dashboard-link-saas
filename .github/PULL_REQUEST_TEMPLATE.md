## Description

<!--
Provide a clear description of the changes.
- What problem does this PR solve?
- What are the main changes?
- Which workflows are affected?
-->

### Problem Statement
"As a solo non-technical founder, I'm using SpecKit workflows to build production SaaS. The current workflows misinterpret 'MVP' as 'build incomplete code with placeholders' instead of 'build fewer features with production quality.' This results in TODO comments, mock data, and commented-out implementations that should never exist in production code."

### Solution Overview
Implemented a 3-mode system with explicit keywords (`mvp`/`v1`, `v2`/`v3`, full) that separates **scope decisions** (which features to build) from **quality decisions** (how well to build them). All modes produce production-ready code; only the number of features changes.

## Changes

- [ ] **Constitution**: Updated `MVP Scope Discipline` to explicitly define MVP as "fewer features, production quality" and forbid incomplete implementations.
- [ ] **Speckit.Specify**: Added mode detection logic for `mvp`, `v1`, `v2`, etc.
- [ ] **Speckit.Plan**: Added mode enforcement to ensure plan respects spec scope.
- [ ] **Speckit.Tasks**: Updated acceptance criteria to explicitly forbid placeholder code (`TODO`, `FIXME`, mocks).
- [ ] **Speckit.Implement**: Strengthened "Complete" definition to reject placeholders.
- [ ] **Docs**: Added `HOW_TO_USE_MODES.md` guide.

## Validation for Reviewers

Please verify:
1. **Clarity**: Can a non-technical founder understand the keywords?
2. **Correctness**: Do the workflow changes actually prevent placeholder code?
3. **Context**: Is this appropriate for a solo founder building production SaaS?
4. **Integration**: Do the workflows pass mode information correctly?

## Checklist

- [ ] I have read the `HOW_TO_USE_MODES.md` guide.
- [ ] I understand that "MVP" now means "Production Quality, Limited Scope".
- [ ] I have verified that no `TODO` or `FIXME` comments will be generated in MVP mode.
