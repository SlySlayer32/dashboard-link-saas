# SpecKit Workflows - CleanConnect

## Overview

SpecKit provides a complete workflow system for feature development, from specification to deployment. The workflows follow a structured approach with clear separation of concerns.

## Workflow Sequence

### 1. Specification Phase

#### `/speckit.specify [feature description]`
**Purpose**: Create feature specification from natural language description

**Output**: `specs/[###-feature-name]/spec.md`

**Next Step**: `/speckit.clarify` (if needed) or `/speckit.plan`

---

#### `/speckit.clarify`
**Purpose**: Resolve ambiguities in specification

**When to Use**: When spec has [NEEDS CLARIFICATION] markers

**Output**: Updated `spec.md` with clarifications resolved

**Next Step**: `/speckit.plan`

---

### 2. Planning Phase

#### `/speckit.plan`
**Purpose**: Generate technical implementation plan

**Input**: `spec.md`

**Output**: 
- `plan.md` - Technical architecture and structure
- `research.md` - Technical decisions
- `data-model.md` - Entity definitions
- `contracts/` - API specifications
- `quickstart.md` - Integration scenarios

**Next Step**: `/speckit.tasks`

---

### 3. Task Generation Phase

#### `/speckit.tasks`
**Purpose**: Generate actionable task breakdown with acceptance criteria

**Input**: `spec.md`, `plan.md`, `data-model.md`, `contracts/`

**Output**: `tasks.md` with dependency-ordered tasks

**Next Step**: `/speckit.analyze` (optional) or `/speckit.implement`

---

#### `/speckit.analyze` (Optional)
**Purpose**: Non-destructive consistency analysis across artifacts

**When to Use**: Before implementation to catch issues early

**Output**: Analysis report with inconsistencies and recommendations

**Next Step**: Fix issues, then `/speckit.implement`

---

### 4. Implementation Phase

#### `/speckit.implement` ⭐ **SIMPLIFIED**
**Purpose**: Write code and create files for all tasks

**What It Does**:
- ✅ Creates files at specified paths
- ✅ Writes functional code
- ✅ Wires integrations
- ✅ Marks tasks [X] when code written

**What It DOESN'T Do**:
- ❌ Quality verification (use `/speckit.verify`)
- ❌ Placeholder detection (use `/speckit.verify`)
- ❌ Final validation (use `/speckit.validate`)

**Output**: 
- All code files created/modified
- tasks.md with tasks marked [X]
- Implementation report

**Next Step**: **ALWAYS** run `/speckit.verify`

---

### 5. Verification Phase ⭐ **NEW**

#### `/speckit.verify`
**Purpose**: Verify implementation quality against constitution standards

**What It Checks** (8 categories):
- File existence and completeness
- Implementation completeness (no placeholders)
- Constitution compliance (TypeScript strict, function size, etc.)
- Integration verification (routes wired, DB connected)
- Functional verification (code compiles, imports resolve)
- Testing verification (tests exist, coverage targets)
- UI/UX verification (mobile-first, accessibility)
- Documentation verification (JSDoc, comments)

**Output**:
- Verification report with PASS/FAIL per task
- Critical issues highlighted
- Remediation guidance

**Next Step**: 
- If issues found: Fix them, then re-run `/speckit.verify`
- If all pass: Run `/speckit.validate`

---

### 6. Validation Phase ⭐ **NEW**

#### `/speckit.validate`
**Purpose**: Comprehensive quality assurance and deployment readiness

**What It Checks**:
- Phase quality gates
- Placeholder detection (grep TODO, FIXME, mock)
- Constitution compliance audit
- TypeScript compilation
- Test coverage validation
- Specification alignment
- Architecture compliance
- Security & best practices

**Output**:
- Comprehensive validation report
- **PASS/FAIL deployment decision**
- Specific blockers if FAIL
- Remediation plan

**Next Step**:
- If PASS: Deploy
- If FAIL: Fix issues, re-verify, re-validate

---

## Complete Workflow Example

### Scenario: Building a new feature

```bash
# 1. Create specification
/speckit.specify "Add user authentication with email/password and JWT tokens"

# 2. Clarify if needed (optional)
/speckit.clarify

# 3. Generate technical plan
/speckit.plan

# 4. Generate task breakdown
/speckit.tasks

# 5. Analyze for consistency (optional)
/speckit.analyze

# 6. Implement all tasks
/speckit.implement

# 7. Verify implementation quality
/speckit.verify

# 8. Fix any issues found
# (manually fix or re-run /speckit.implement for specific tasks)

# 9. Re-verify after fixes
/speckit.verify

# 10. Run final validation
/speckit.validate

# 11. If validation PASS, deploy!
# If validation FAIL, fix issues and repeat steps 7-10
```

---

## Workflow Separation Benefits

### Before (Old `/speckit.implement`)
- ❌ Did everything: implement + verify + validate
- ❌ Slow (verification blocked implementation)
- ❌ Hard to debug (which step failed?)
- ❌ All-or-nothing (can't skip verification)

### After (New 3-Workflow System)
- ✅ Clear separation: implement → verify → validate
- ✅ Faster iteration (implement all, then verify)
- ✅ Easy debugging (know which workflow failed)
- ✅ Flexible (can skip verification for prototypes)

---

## Quick Reference

| Workflow | Purpose | Input | Output | Duration |
|----------|---------|-------|--------|----------|
| `/speckit.specify` | Create spec | Feature description | spec.md | 2-5 min |
| `/speckit.clarify` | Resolve ambiguities | spec.md | Updated spec.md | 1-3 min |
| `/speckit.plan` | Technical plan | spec.md | plan.md, research.md, etc. | 3-7 min |
| `/speckit.tasks` | Task breakdown | plan.md, spec.md | tasks.md | 2-4 min |
| `/speckit.analyze` | Consistency check | All artifacts | Analysis report | 2-5 min |
| `/speckit.implement` | Write code | tasks.md | Code files | 10-60 min |
| `/speckit.verify` | Quality check | Code files | Verification report | 3-10 min |
| `/speckit.validate` | Final QA | All code | Validation report | 5-15 min |

---

## Best Practices

### 1. Always Run Verification After Implementation
```bash
/speckit.implement
/speckit.verify  # Don't skip this!
```

### 2. Fix Issues Before Validation
```bash
/speckit.verify
# Fix issues found
/speckit.verify  # Re-verify
/speckit.validate  # Only when verify passes
```

### 3. Don't Deploy Without Validation PASS
```bash
/speckit.validate
# Only deploy if you see: ✅ DEPLOYMENT APPROVED
```

### 4. Use Analyze to Catch Issues Early
```bash
/speckit.tasks
/speckit.analyze  # Catch inconsistencies before implementing
/speckit.implement
```

### 5. Iterate on Verification
```bash
/speckit.verify
# Fix 3 critical issues
/speckit.verify
# Fix 2 more issues
/speckit.verify
# All pass! ✅
/speckit.validate
```

---

## Troubleshooting

### "Implementation complete but verify shows many failures"
**Solution**: This is expected! Implementation writes code, verification checks quality. Fix the issues and re-verify.

### "Validation fails even though verify passed"
**Solution**: Validation is more comprehensive (checks phases, compilation, tests). Fix the validation issues.

### "Too many issues to fix manually"
**Solution**: Re-run `/speckit.implement` for specific tasks that failed verification.

### "Want to prototype quickly without quality checks"
**Solution**: Run `/speckit.implement` only, skip verify/validate. But don't deploy without validation!

---

## Constitution Compliance

All workflows enforce the project constitution (`.specify/memory/constitution.md`):

- TypeScript strict mode
- Functions under 50 lines
- Test coverage targets (API 90%, React 85%, Utils 95%)
- No placeholder code
- Explicit error handling
- Mobile-first UI
- Accessibility standards

Violations are caught by `/speckit.verify` and `/speckit.validate`.

---

## Additional Workflows

### `/speckit.checklist`
Generate custom checklists for specific domains (UX, security, performance, etc.)

### `/speckit.constitution`
Create or update project constitution

### `/speckit.taskstoissues`
Convert tasks to GitHub issues

---

## Support

For issues or questions about workflows:
1. Check this README
2. Review individual workflow files in `.windsurf/workflows/`
3. Consult `.specify/memory/constitution.md` for quality standards
4. Ask for clarification with specific workflow name
