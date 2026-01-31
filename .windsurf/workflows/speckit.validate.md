---
description: Comprehensive quality validation and deployment readiness assessment
handoffs:
  - label: Fix Issues
    agent: speckit.implement
    prompt: Fix the validation issues found
  - label: Re-verify After Fixes
    agent: speckit.verify
    prompt: Verify the fixes meet quality standards
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Purpose

Perform comprehensive quality assurance across all implementation phases to determine deployment readiness. This is the **FINAL QUALITY GATE** before code can be deployed or merged.

## Outline

1. Run `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load Quality Standards and Context**:
   - Read `.specify/memory/constitution.md` for quality requirements
   - Read tasks.md for complete task list
   - Read plan.md for architecture and tech stack
   - Read spec.md for original requirements

3. **Phase Quality Gates**:
   
   For each phase in tasks.md, verify phase completion:
   
   ### Phase Completion Checklist
   - [ ] All tasks in phase marked [X]
   - [ ] All files created exist and are non-empty
   - [ ] No TODO/FIXME comments in phase files
   - [ ] No placeholder implementations in phase files
   - [ ] All integration points wired up
   - [ ] TypeScript compiles without errors (if applicable)
   - [ ] Tests pass for this phase (if tests required)
   
   **Phase Gate Status**: PASS / FAIL
   
   If any phase FAILS:
   - Document which phase failed
   - List specific failing criteria
   - Provide remediation steps
   - Mark overall validation as FAIL

4. **Comprehensive Code Audit**:
   
   Run automated checks across entire codebase:
   
   ### A. Placeholder Detection
   ```bash
   # Search for placeholder indicators
   grep -r "TODO" --include="*.ts" --include="*.tsx" [source directories]
   grep -r "FIXME" --include="*.ts" --include="*.tsx" [source directories]
   grep -r "@ts-ignore" --include="*.ts" --include="*.tsx" [source directories]
   grep -r "console.log" --include="*.ts" --include="*.tsx" [source directories]
   grep -r "mock" --include="*.ts" --include="*.tsx" [source directories]
   grep -r "placeholder" --include="*.ts" --include="*.tsx" [source directories]
   ```
   
   Report count and locations of each placeholder type.
   
   ### B. Constitution Compliance Audit
   - [ ] **TypeScript Strict Mode**: Check tsconfig.json has `"strict": true`
   - [ ] **Function Size**: Scan for functions >50 lines (flag for review)
   - [ ] **File Size**: Scan for files >500 lines (flag for review)
   - [ ] **Error Handling**: Check for empty catch blocks
   - [ ] **No Silent Failures**: Verify error logging/propagation
   - [ ] **Test Coverage**: Check if tests exist for required components
   
   ### C. Integration Completeness
   - [ ] **Routes Registered**: All route files imported in main app
   - [ ] **Middleware Applied**: Middleware stack configured correctly
   - [ ] **Database Migrations**: All migrations can run successfully
   - [ ] **Environment Config**: All required env vars documented in .env.example
   - [ ] **Dependencies Installed**: package.json matches actual imports
   
   ### D. TypeScript Compilation Check
   
   If TypeScript project:
   ```bash
   # Run type check
   npx tsc --noEmit
   ```
   
   Report:
   - [ ] Compiles without errors
   - [ ] Number of type errors (if any)
   - [ ] Critical type errors that block deployment

5. **Test Coverage Validation** (if tests exist):
   
   ### Test Execution
   - Identify test framework (Jest, Vitest, etc.)
   - Check if test command exists in package.json
   - Report test infrastructure status
   
   ### Coverage Requirements (from constitution)
   - [ ] API endpoints: 90%+ coverage
   - [ ] React components: 85%+ coverage
   - [ ] Utility functions: 95%+ coverage
   
   ### Test Quality Check
   - [ ] Tests have meaningful assertions (not just "it exists")
   - [ ] Tests cover edge cases
   - [ ] No flaky tests
   - [ ] Tests are deterministic

6. **Specification Alignment Check**:
   
   Compare implementation against original spec.md:
   
   ### Functional Requirements Coverage
   - [ ] All functional requirements have corresponding implementation
   - [ ] User stories are fully implemented
   - [ ] Acceptance criteria are met
   
   ### Non-Functional Requirements
   - [ ] Performance requirements addressed
   - [ ] Security requirements implemented
   - [ ] Scalability considerations included
   
   ### Edge Cases
   - [ ] Edge cases from spec are handled
   - [ ] Error scenarios are covered

7. **Architecture Compliance Audit**:
   
   Verify implementation follows plan.md architecture:
   
   - [ ] **File Structure**: Matches plan.md structure
   - [ ] **Tech Stack**: Uses specified technologies only
   - [ ] **Layering**: Follows Zapier-style layering (if applicable)
   - [ ] **Patterns**: Uses established patterns consistently
   - [ ] **Dependencies**: Only approved dependencies used

8. **Security & Best Practices Check**:
   
   ### Security Audit
   - [ ] No hardcoded secrets or API keys
   - [ ] Environment variables used for sensitive data
   - [ ] Input validation on all endpoints
   - [ ] Authentication/authorization properly implemented
   - [ ] SQL injection prevention (parameterized queries)
   - [ ] XSS prevention (proper escaping)
   
   ### Best Practices
   - [ ] Error messages don't leak sensitive info
   - [ ] Logging doesn't include sensitive data
   - [ ] CORS configured appropriately
   - [ ] Rate limiting on abuse-prone endpoints

9. **Generate Comprehensive Validation Report**:
   
   ```markdown
   # Quality Validation Report: [FEATURE NAME]
   
   **Date**: [DATE]
   **Validation Status**: ✅ PASS / ❌ FAIL
   **Deployment Ready**: YES / NO
   
   ---
   
   ## Executive Summary
   
   - **Total Tasks**: [X]
   - **Tasks Completed**: [X]
   - **Phases Complete**: [X] / [Total]
   - **Critical Issues**: [X]
   - **High Priority Issues**: [X]
   - **Warnings**: [X]
   
   **Overall Assessment**: [Brief summary of readiness]
   
   ---
   
   ## Phase Quality Gates
   
   | Phase | Tasks | Status | Issues |
   |-------|-------|--------|--------|
   | Phase 1: Setup | 10/10 | ✅ PASS | None |
   | Phase 2: Foundation | 10/10 | ✅ PASS | None |
   | Phase 3: User Story 1 | 18/18 | ✅ PASS | None |
   | Phase 4: User Story 2 | 13/13 | ❌ FAIL | 3 critical |
   | Phase 5: User Story 3 | 12/12 | ⚠️ WARNING | 2 warnings |
   
   **Phase Gate Summary**: 3/5 phases PASS, 1 FAIL, 1 WARNING
   
   ---
   
   ## Code Quality Audit
   
   ### Placeholder Detection
   - ❌ **TODO comments**: 15 found
   - ❌ **FIXME comments**: 8 found
   - ⚠️ **@ts-ignore**: 3 found
   - ❌ **console.log**: 12 found (production code)
   - ❌ **mock/placeholder**: 5 found
   
   ### Constitution Compliance
   - ✅ **TypeScript Strict Mode**: Enabled
   - ⚠️ **Function Size**: 3 functions >50 lines
   - ✅ **File Size**: All files <500 lines
   - ❌ **Error Handling**: 5 empty catch blocks found
   - ✅ **Test Coverage**: Infrastructure exists
   
   ### Integration Completeness
   - ✅ **Routes Registered**: All routes wired
   - ✅ **Middleware Applied**: Correctly configured
   - ⚠️ **Database Migrations**: 1 migration needs review
   - ✅ **Environment Config**: All vars documented
   - ✅ **Dependencies**: All installed
   
   ### TypeScript Compilation
   - ❌ **Status**: 12 type errors
   - **Critical Errors**: 3 (blocking)
   - **Warnings**: 9 (non-blocking)
   
   ---
   
   ## Test Coverage Validation
   
   | Component Type | Target | Actual | Status |
   |----------------|--------|--------|--------|
   | API Endpoints | 90% | 45% | ❌ FAIL |
   | React Components | 85% | 30% | ❌ FAIL |
   | Utility Functions | 95% | 70% | ❌ FAIL |
   
   **Test Status**: FAIL - Coverage below targets
   
   ---
   
   ## Specification Alignment
   
   - ✅ **Functional Requirements**: 90% implemented
   - ⚠️ **User Stories**: 4/5 complete
   - ❌ **Acceptance Criteria**: 70% met
   - ⚠️ **Edge Cases**: Partially handled
   
   ---
   
   ## Critical Issues (MUST FIX)
   
   1. **Token Service (T071)**: Database operations commented out
      - Location: apps/api/src/services/token-service.ts
      - Impact: Feature non-functional
      - Fix: Implement real DB queries
   
   2. **SMS Service (T073)**: console.log instead of real SMS
      - Location: apps/api/src/services/sms.service.ts
      - Impact: SMS sending doesn't work
      - Fix: Integrate MobileMessage.au API
   
   3. **TypeScript Errors**: 3 blocking compilation errors
      - Impact: Code won't compile
      - Fix: Resolve type errors
   
   ---
   
   ## High Priority Issues
   
   1. **Test Coverage**: Below all targets
   2. **Placeholder Code**: 15 TODO comments remain
   3. **Error Handling**: 5 empty catch blocks
   
   ---
   
   ## Warnings
   
   1. **Auth Store**: Uses mock authentication
   2. **Function Size**: 3 functions exceed 50 lines
   3. **Database Migration**: One migration needs review
   
   ---
   
   ## Deployment Readiness Assessment
   
   ### ❌ NOT READY FOR DEPLOYMENT
   
   **Blockers**:
   1. Critical features non-functional (token service, SMS service)
   2. TypeScript compilation errors
   3. Test coverage below minimum thresholds
   
   **Required Actions Before Deployment**:
   1. Fix all 3 critical issues
   2. Resolve TypeScript compilation errors
   3. Increase test coverage to minimum targets
   4. Remove placeholder code
   5. Fix error handling issues
   
   **Estimated Effort**: 2-3 days
   
   ---
   
   ## Recommendations
   
   ### Immediate Actions (Before Deployment)
   1. Fix critical issues in token and SMS services
   2. Resolve TypeScript compilation errors
   3. Write tests to meet coverage targets
   4. Remove all TODO/FIXME comments
   5. Fix empty catch blocks
   
   ### Post-Deployment Improvements
   1. Refactor functions >50 lines
   2. Review database migration
   3. Replace mock auth with real implementation
   4. Improve edge case handling
   
   ### Long-Term Quality Improvements
   1. Set up automated test coverage reporting
   2. Add pre-commit hooks for placeholder detection
   3. Implement CI/CD pipeline with quality gates
   4. Regular code quality audits
   
   ---
   
   ## Next Steps
   
   1. **Fix Critical Issues**:
      - Run `/speckit.implement` to fix T071, T073
      - Resolve TypeScript errors
   
   2. **Write Tests**:
      - Add tests for API endpoints
      - Add tests for React components
      - Add tests for utilities
   
   3. **Re-validate**:
      - Run `/speckit.verify` after fixes
      - Run `/speckit.validate` again
      - Confirm PASS status
   
   4. **Deploy** (only after validation PASS):
      - Follow deployment checklist
      - Monitor for issues
      - Have rollback plan ready
   ```

10. **Provide Final Decision**:
    
    Based on validation results, provide clear decision:
    
    ### ✅ VALIDATION PASS
    ```markdown
    ## ✅ DEPLOYMENT APPROVED
    
    All quality gates passed. Code is ready for deployment.
    
    **Summary**:
    - All phases complete
    - No critical issues
    - Constitution compliance verified
    - Tests passing with adequate coverage
    - Specification requirements met
    
    **Next Steps**:
    1. Proceed with deployment
    2. Monitor for issues
    3. Have rollback plan ready
    ```
    
    ### ❌ VALIDATION FAIL
    ```markdown
    ## ❌ DEPLOYMENT BLOCKED
    
    Critical issues prevent deployment. Must fix before proceeding.
    
    **Blockers**:
    [List critical issues]
    
    **Required Actions**:
    [List specific fixes needed]
    
    **Next Steps**:
    1. Fix all critical issues
    2. Run `/speckit.verify` to confirm fixes
    3. Run `/speckit.validate` again
    4. Only deploy after PASS status
    ```

## Operating Principles

### Comprehensive Assessment
- Check ALL quality dimensions
- Don't skip checks even if some pass
- Report complete picture of quality
- Provide actionable remediation

### Clear Decision Making
- Binary PASS/FAIL decision
- Clear criteria for each decision
- No ambiguity about deployment readiness
- Specific blockers if FAIL

### Constitution Authority
- Constitution standards are non-negotiable
- Violations are always critical
- No exceptions without explicit approval
- Document any justified deviations

### User Guidance
- Explain why issues matter
- Prioritize fixes by impact
- Provide clear next steps
- Estimate effort for fixes

## Success Criteria

Validation is successful when:
- All phases have been assessed
- Clear PASS/FAIL decision made
- All issues categorized by severity
- Remediation plan provided
- User knows exactly what to do next

## Notes

- This command should be run AFTER `/speckit.verify`
- This is the FINAL quality gate before deployment
- Can be run multiple times as issues are fixed
- PASS status required before deployment
- Designed to prevent low-quality code from reaching production
