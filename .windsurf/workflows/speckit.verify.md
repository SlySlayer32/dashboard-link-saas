---
description: Verify implementation quality against constitution standards and task acceptance criteria
handoffs:
  - label: Fix Issues and Re-verify
    agent: speckit.implement
    prompt: Fix the verification issues found
  - label: Run Final Validation
    agent: speckit.validate
    prompt: Run comprehensive quality validation
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Purpose

Verify that implemented code meets quality standards **WITHOUT modifying code**. This is a **READ-ONLY** verification workflow that checks implementation against:
- Constitution quality standards
- Task acceptance criteria
- Integration requirements
- Code quality metrics

## Outline

1. Run `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load Quality Standards**:
   - Read `.specify/memory/constitution.md` for quality requirements
   - Extract key standards:
     - TypeScript strict mode (no `any` types)
     - Functions under 50 lines, files under 500 lines
     - Test coverage targets: API 90%, React 85%, Utils 95%
     - No placeholder code (TODO, FIXME, commented implementations)
     - Explicit error handling (no empty catch blocks)
     - Mobile-first UI (touch targets ≥44px, fonts ≥16px)

3. **Load Implementation Context**:
   - Read tasks.md for task list with acceptance criteria
   - Read plan.md for tech stack and architecture
   - Identify all tasks marked [X] as complete

4. **Per-Task Verification** (For each task marked [X]):
   
   Run comprehensive quality checks across 8 categories:
   
   ### A. File Existence Verification
   - [ ] File exists at EXACT path specified in task description
   - [ ] File is not empty (minimum 10 lines for implementation files)
   - [ ] File has correct extension (.ts for TypeScript, .tsx for React, etc.)
   
   ### B. Implementation Completeness Verification
   - [ ] ALL required functions/methods/components mentioned in task are implemented
   - [ ] No TODO, FIXME, or @ts-ignore comments remain
   - [ ] No commented-out implementation code (DB queries, API calls, business logic)
   - [ ] No placeholder/mock data in production code paths
   - [ ] No `console.log` used instead of real implementation
   - [ ] All imports are present and correct
   - [ ] All exports are present (functions/classes/components are exported)
   
   ### C. Constitution Compliance Verification
   - [ ] **TypeScript Strict Mode**: No `any` types (except justified with comment)
   - [ ] **Function Size**: All functions under 50 lines
   - [ ] **File Size**: File under 500 lines (if larger, flag for review)
   - [ ] **Error Handling**: Explicit try-catch with typed errors (no empty catch blocks)
   - [ ] **No Silent Failures**: All errors are logged or propagated
   - [ ] **Dependency Injection**: Services use DI for testability (no hardcoded dependencies)
   
   ### D. Integration Verification
   - [ ] **Routes Wired**: If creating service, verify it's imported and used by routes
   - [ ] **Middleware Applied**: If creating middleware, verify it's registered in app
   - [ ] **Database Connected**: If using DB, verify real queries (not commented out)
   - [ ] **External APIs**: If calling external service, verify real API calls (not mocks)
   - [ ] **State Management**: If creating store, verify it's imported by components
   
   ### E. Functional Verification
   - [ ] **Code Compiles**: No TypeScript errors (check syntax)
   - [ ] **Imports Resolve**: All imported modules exist
   - [ ] **Logic Complete**: Business logic is fully implemented (not stubbed)
   - [ ] **Data Flow**: Data flows from input → processing → output correctly
   
   ### F. Testing Verification (if tests required by constitution)
   - [ ] **Tests Exist**: Test file created for this implementation
   - [ ] **Tests Would Pass**: Tests have meaningful assertions (not just "it exists")
   - [ ] **Coverage Target**: Would meet coverage requirement (API 90%, React 85%, Utils 95%)
   - [ ] **No Flaky Tests**: Tests are deterministic
   
   ### G. UI/UX Verification (for frontend tasks only)
   - [ ] **Mobile-First**: Component works on mobile screens
   - [ ] **Touch Targets**: Interactive elements ≥44px
   - [ ] **Font Sizes**: Text ≥16px to prevent zoom
   - [ ] **Loading States**: Shows loading for operations >200ms
   - [ ] **Error Messages**: User-friendly (not technical stack traces)
   - [ ] **Accessibility**: Keyboard navigation and screen reader support
   
   ### H. Documentation Verification
   - [ ] **JSDoc Comments**: Public APIs have JSDoc with param/return types
   - [ ] **Complex Logic**: Non-obvious code has explanatory comments
   - [ ] **README Updated**: If adding new feature, README documents it
   
   ### I. Acceptance Criteria Verification
   - [ ] Check task's acceptance criteria (if defined)
   - [ ] Verify each acceptance criterion is met
   - [ ] Flag any unmet criteria

5. **Generate Verification Report**:
   
   Create a structured report with:
   
   ```markdown
   # Implementation Verification Report: [FEATURE NAME]
   
   **Date**: [DATE]
   **Tasks Verified**: [X] / [Total]
   **Overall Status**: PASS / FAIL
   
   ## Summary
   - ✅ Verified: [X] tasks
   - ❌ Failed: [X] tasks
   - ⚠️ Warnings: [X] tasks
   
   ## Verification Results by Task
   
   ### ✅ VERIFIED Tasks
   
   - [X] ✅ T001 - Create project structure
     - All criteria passed
   
   - [X] ✅ T040 - Implement AuthService
     - All criteria passed
   
   ### ❌ FAILED Tasks
   
   - [X] ❌ T071 - Create token service
     - **CRITICAL**: Database operations commented out (Category D)
     - **HIGH**: Uses mock data instead of real implementation (Category B)
     - **MEDIUM**: Missing error handling (Category C)
     - Recommendation: Implement real DB queries, remove mocks, add try-catch
   
   - [X] ❌ T073 - Create SMS service
     - **CRITICAL**: console.log instead of real SMS sending (Category B)
     - **HIGH**: No integration with MobileMessage.au API (Category D)
     - Recommendation: Implement real SMS API integration
   
   ### ⚠️ WARNING Tasks
   
   - [X] ⚠️ T049 - Create auth store
     - **WARNING**: Uses mock authentication (Category B)
     - **WARNING**: Not connected to real API (Category D)
     - Recommendation: Connect to real auth service
   
   ## Category Breakdown
   
   | Category | Pass | Fail | Warning |
   |----------|------|------|---------|
   | A. File Existence | 100 | 0 | 0 |
   | B. Implementation Completeness | 85 | 10 | 5 |
   | C. Constitution Compliance | 90 | 5 | 5 |
   | D. Integration | 70 | 20 | 10 |
   | E. Functional | 95 | 5 | 0 |
   | F. Testing | 60 | 30 | 10 |
   | G. UI/UX | 80 | 5 | 15 |
   | H. Documentation | 75 | 10 | 15 |
   
   ## Critical Issues (Must Fix Before Deployment)
   
   1. **T071**: Token service has no real DB implementation
   2. **T073**: SMS service uses console.log instead of real API
   3. **T049**: Auth store uses mock authentication
   
   ## High Priority Issues
   
   [List high priority issues]
   
   ## Recommendations
   
   1. Fix all CRITICAL issues before proceeding to validation
   2. Address HIGH priority issues for production readiness
   3. Consider fixing WARNING issues for better quality
   
   ## Next Steps
   
   - [ ] Fix critical issues in failed tasks
   - [ ] Re-run `/speckit.verify` to confirm fixes
   - [ ] Once all tasks verified, run `/speckit.validate` for final QA
   ```

6. **Update Task Status** (Optional - ask user first):
   
   Ask user: "Would you like me to update tasks.md with verification status? (yes/no)"
   
   If yes, update tasks.md:
   ```markdown
   - [X] ✅ T001 Create project structure - VERIFIED
   - [X] ❌ T071 Create token service - NEEDS_FIX: DB operations commented out, uses mocks
   - [X] ⚠️ T049 Create auth store - WARNING: Uses mock auth, not connected to API
   ```

7. **Provide Remediation Guidance**:
   
   For each failed task, provide specific fix instructions:
   ```markdown
   ## Fix Guide for T071 - Token Service
   
   **File**: apps/api/src/services/token-service.ts
   
   **Issues**:
   1. Lines 45-60: DB queries commented out
   2. Lines 70-85: Returns mock data instead of real tokens
   3. Missing error handling
   
   **Required Changes**:
   1. Uncomment DB queries and implement real Supabase calls
   2. Remove mock data, use actual token generation
   3. Add try-catch with typed errors
   
   **Acceptance Criteria to Meet**:
   - [ ] Uses real Supabase client (not mocks)
   - [ ] Database operations implemented (not commented)
   - [ ] Error handling with typed errors
   ```

## Operating Principles

### Read-Only Verification
- **NEVER modify code** - This is strictly verification
- **NEVER mark tasks as incomplete** - Only report status
- **NEVER fix issues automatically** - Only suggest fixes

### Comprehensive Checking
- Check ALL 8 categories for each task
- Don't skip categories even if file looks good
- Report all issues found, not just first one

### Clear Reporting
- Use severity levels: CRITICAL, HIGH, MEDIUM, LOW
- Provide specific line numbers when possible
- Give actionable remediation steps
- Link issues to constitution principles

### User Guidance
- Explain why each issue matters
- Suggest specific fixes
- Prioritize issues by impact
- Provide clear next steps

## Success Criteria

Verification is successful when:
- All tasks have been checked
- Report clearly shows PASS/FAIL status
- Critical issues are highlighted
- Remediation guidance is provided
- User knows exactly what to fix

## Notes

- This command should be run AFTER `/speckit.implement`
- This command should be run BEFORE `/speckit.validate`
- Can be run multiple times as issues are fixed
- Designed to catch placeholder code and incomplete implementations
- Enforces constitution standards without being destructive
