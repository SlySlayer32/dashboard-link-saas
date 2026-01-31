---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md
handoffs:
  - label: Verify Implementation Quality
    agent: speckit.verify
    prompt: Verify the implementation meets quality standards
    send: true
  - label: Run Final Validation
    agent: speckit.validate
    prompt: Run comprehensive quality validation for deployment readiness
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Run `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Check checklists status** (if FEATURE_DIR/checklists/ exists):
   - Scan all checklist files in the checklists/ directory
   - For each checklist, count:
     - Total items: All lines matching `- [ ]` or `- [X]` or `- [x]`
     - Completed items: Lines matching `- [X]` or `- [x]`
     - Incomplete items: Lines matching `- [ ]`
   - Create a status table:

     ```text
     | Checklist | Total | Completed | Incomplete | Status |
     |-----------|-------|-----------|------------|--------|
     | ux.md     | 12    | 12        | 0          | ✓ PASS |
     | test.md   | 8     | 5         | 3          | ✗ FAIL |
     | security.md | 6   | 6         | 0          | ✓ PASS |
     ```

   - Calculate overall status:
     - **PASS**: All checklists have 0 incomplete items
     - **FAIL**: One or more checklists have incomplete items

   - **If any checklist is incomplete**:
     - Display the table with incomplete item counts
     - **STOP** and ask: "Some checklists are incomplete. Do you want to proceed with implementation anyway? (yes/no)"
     - Wait for user response before continuing
     - If user says "no" or "wait" or "stop", halt execution
     - If user says "yes" or "proceed" or "continue", proceed to step 3

   - **If all checklists are complete**:
     - Display the table showing all checklists passed
     - Automatically proceed to step 3

3. Load and analyze the implementation context:
   - **REQUIRED**: Read tasks.md for the complete task list and execution plan
   - **REQUIRED**: Read plan.md for tech stack, architecture, and file structure
   - **IF EXISTS**: Read data-model.md for entities and relationships
   - **IF EXISTS**: Read contracts/ for API specifications and test requirements
   - **IF EXISTS**: Read research.md for technical decisions and constraints
   - **IF EXISTS**: Read quickstart.md for integration scenarios

4. **Project Setup Verification**:
   - **REQUIRED**: Create/verify ignore files based on actual project setup:

   **Detection & Creation Logic**:
   - Check if the following command succeeds to determine if the repository is a git repo (create/verify .gitignore if so):

     ```sh
     git rev-parse --git-dir 2>/dev/null
     ```

   - Check if Dockerfile* exists or Docker in plan.md → create/verify .dockerignore
   - Check if .eslintrc* exists → create/verify .eslintignore
   - Check if eslint.config.* exists → ensure the config's `ignores` entries cover required patterns
   - Check if .prettierrc* exists → create/verify .prettierignore
   - Check if .npmrc or package.json exists → create/verify .npmignore (if publishing)
   - Check if terraform files (*.tf) exist → create/verify .terraformignore
   - Check if .helmignore needed (helm charts present) → create/verify .helmignore

   **If ignore file already exists**: Verify it contains essential patterns, append missing critical patterns only
   **If ignore file missing**: Create with full pattern set for detected technology

   **Common Patterns by Technology** (from plan.md tech stack):
   - **Node.js/JavaScript/TypeScript**: `node_modules/`, `dist/`, `build/`, `*.log`, `.env*`
   - **Python**: `__pycache__/`, `*.pyc`, `.venv/`, `venv/`, `dist/`, `*.egg-info/`
   - **Java**: `target/`, `*.class`, `*.jar`, `.gradle/`, `build/`
   - **C#/.NET**: `bin/`, `obj/`, `*.user`, `*.suo`, `packages/`
   - **Go**: `*.exe`, `*.test`, `vendor/`, `*.out`
   - **Ruby**: `.bundle/`, `log/`, `tmp/`, `*.gem`, `vendor/bundle/`
   - **PHP**: `vendor/`, `*.log`, `*.cache`, `*.env`
   - **Rust**: `target/`, `debug/`, `release/`, `*.rs.bk`, `*.rlib`, `*.prof*`, `.idea/`, `*.log`, `.env*`
   - **Kotlin**: `build/`, `out/`, `.gradle/`, `.idea/`, `*.class`, `*.jar`, `*.iml`, `*.log`, `.env*`
   - **C++**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.so`, `*.a`, `*.exe`, `*.dll`, `.idea/`, `*.log`, `.env*`
   - **C**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.a`, `*.so`, `*.exe`, `Makefile`, `config.log`, `.idea/`, `*.log`, `.env*`
   - **Swift**: `.build/`, `DerivedData/`, `*.swiftpm/`, `Packages/`
   - **R**: `.Rproj.user/`, `.Rhistory`, `.RData`, `.Ruserdata`, `*.Rproj`, `packrat/`, `renv/`
   - **Universal**: `.DS_Store`, `Thumbs.db`, `*.tmp`, `*.swp`, `.vscode/`, `.idea/`

   **Tool-Specific Patterns**:
   - **Docker**: `node_modules/`, `.git/`, `Dockerfile*`, `.dockerignore`, `*.log*`, `.env*`, `coverage/`
   - **ESLint**: `node_modules/`, `dist/`, `build/`, `coverage/`, `*.min.js`
   - **Prettier**: `node_modules/`, `dist/`, `build/`, `coverage/`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
   - **Terraform**: `.terraform/`, `*.tfstate*`, `*.tfvars`, `.terraform.lock.hcl`
   - **Kubernetes/k8s**: `*.secret.yaml`, `secrets/`, `.kube/`, `kubeconfig*`, `*.key`, `*.crt`

5. Parse tasks.md structure and extract:
   - **Task phases**: Setup, Tests, Core, Integration, Polish
   - **Task dependencies**: Sequential vs parallel execution rules
   - **Task details**: ID, description, file paths, parallel markers [P]
   - **Execution flow**: Order and dependency requirements

6. **Load Implementation Context**:
   - Read `.specify/memory/constitution.md` for awareness of quality standards
   - Note key principles (will be enforced by `/speckit.verify` later):
     - TypeScript strict mode
     - Functions under 50 lines
     - No placeholder code
     - Explicit error handling
     - Test coverage targets

7. **Execute Implementation** (Phase-by-Phase):
   
   For each phase in tasks.md:
   
   ### Phase Execution Rules
   - **Phase-by-phase execution**: Complete each phase before moving to the next
   - **Respect dependencies**: Run sequential tasks in order, parallel tasks [P] can run together
   - **Follow TDD approach**: Execute test tasks before their corresponding implementation tasks
   - **File-based coordination**: Tasks affecting the same files must run sequentially
   
   ### Implementation Approach
   - **Setup first**: Initialize project structure, dependencies, configuration
   - **Tests before code**: Write tests for contracts, entities, and integration scenarios
   - **Core development**: Implement models, services, CLI commands, endpoints
   - **Integration work**: Database connections, middleware, logging, external services
   - **Polish**: Documentation, code cleanup, final touches

8. **Per-Task Implementation** (For each task):
   
   ### Implementation Steps
   1. **Read task specification**:
      - Understand what needs to be built
      - Check acceptance criteria (if defined)
      - Note file paths and requirements
   
   2. **Check if exists**:
      - Verify if file already exists
      - If exists, read current implementation
      - Determine if needs creation or modification
   
   3. **Implement the code**:
      - Create file at exact path specified
      - Write complete, functional implementation
      - Include all required functions/methods/components
      - Add proper imports and exports
      - Implement error handling
      - Add necessary comments for complex logic
   
   4. **Wire integrations**:
      - If creating service, import it in routes
      - If creating middleware, register it in app
      - If creating component, ensure it's importable
      - Connect to database if needed
      - Connect to external APIs if needed
   
   5. **Mark task complete**:
      - Mark task [X] in tasks.md when implementation is written
      - Note: Quality verification happens later in `/speckit.verify`
   
   ### What "Complete" Means for Implementation
   - ✅ File created at correct path
   - ✅ Code written (not just file created)
   - ✅ All required functions/methods implemented
   - ✅ Integrations wired up
   - ✅ No obvious syntax errors
   - ✅ **NO PLACEHOLDERS**: No `TODO`, `FIXME`, `@ts-ignore`, `console.log` (as impl), or mock data in production paths
   - ✅ **NO "LATER"**: No commented out code or "implement this later" comments

   **Note**: Detailed quality verification (placeholder detection, constitution compliance, testing) happens in `/speckit.verify` workflow.

9. **Progress Tracking and Error Handling**:
   - Report progress after each completed task
   - Show which phase you're working on
   - Halt execution if any non-parallel task fails to implement
   - For parallel tasks [P], continue with successful tasks, report failed ones
   - Provide clear error messages with context for debugging
   - Suggest next steps if implementation cannot proceed
   - Mark task [X] when code is written (verification happens later)

10. **Phase Completion Report** (After each phase):
    
    After completing all tasks in a phase:
    
    ```markdown
    ## Phase [N] Complete: [PHASE NAME]
    
    - Tasks Implemented: [X] / [Total]
    - Files Created: [X]
    - Files Modified: [X]
    
    **Implementation Summary**:
    [Brief summary of what was implemented]
    
    **Next Phase**: [Next phase name]
    ```

11. **Final Implementation Report** (After all phases complete):
    
    ```markdown
    # Implementation Complete: [FEATURE NAME]
    
    **Date**: [DATE]
    **Status**: All tasks implemented
    
    ## Summary
    - Total Tasks: [X]
    - Phases Completed: [X]
    - Files Created: [X]
    - Files Modified: [X]
    
    ## Phase Breakdown
    
    | Phase | Tasks | Status |
    |-------|-------|--------|
    | Phase 1: Setup | 10/10 | ✅ Complete |
    | Phase 2: Foundation | 10/10 | ✅ Complete |
    | Phase 3: User Story 1 | 18/18 | ✅ Complete |
    | Phase 4: User Story 2 | 13/13 | ✅ Complete |
    | Phase 5: User Story 3 | 12/12 | ✅ Complete |
    
    ## Implementation Highlights
    
    [Brief summary of key features implemented]
    
    ## Next Steps - IMPORTANT
    
    ⚠️ **Implementation is complete, but quality verification is required before deployment.**
    
    ### Recommended Workflow:
    
    1. **Run Quality Verification**:
       ```
       /speckit.verify
       ```
       This will check implementation quality against constitution standards and identify any issues.
    
    2. **Fix Any Issues Found**:
       - Address critical issues
       - Fix high priority issues
       - Consider warnings
    
    3. **Re-verify After Fixes**:
       ```
       /speckit.verify
       ```
       Confirm all issues are resolved.
    
    4. **Run Final Validation**:
       ```
       /speckit.validate
       ```
       Comprehensive quality assurance and deployment readiness check.
    
    5. **Deploy** (only after validation PASS):
       - Follow deployment checklist
       - Monitor for issues
       - Have rollback plan ready
    
    ## Notes
    
    - All code has been written and integrated
    - Quality verification happens in separate workflows
    - Do not deploy without running `/speckit.verify` and `/speckit.validate`
    ```

Note: This command assumes a complete task breakdown exists in tasks.md. If tasks are incomplete or missing, suggest running `/speckit.tasks` first to regenerate the task list.

**After implementation completes, ALWAYS recommend running `/speckit.verify` next.**
