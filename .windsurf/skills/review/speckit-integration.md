# Speckit Integration Guide

This document defines how the review workflow integrates with speckit workflows to prevent conflicts and ensure consistency.

---

## Review Workflow Position in Speckit Lifecycle

```
/speckit.specify     → Create spec.md (requirements)
         ↓
/speckit.clarify     → Resolve ambiguities in spec
         ↓
/speckit.plan        → Create plan.md (architecture)
         ↓
/speckit.tasks       → Create tasks.md (implementation breakdown)
         ↓
/speckit.analyze     → Check consistency across spec/plan/tasks
         ↓
/speckit.implement   → Execute tasks, build feature
         ↓
/review              → ← YOU ARE HERE
         ↓           Verify implementation matches spec/plan/tasks
         ↓           Detect duplicates, check imports, find bugs
         ↓
/devlog              → Document review findings and fixes
```

**Key principle**: Review validates that implementation matches design. It does NOT redesign the feature.

---

## Integration Points

### 1. Pre-Review: Load Governing Documents

**Order of authority** (from `.windsurf/skills/review/SKILL.md`):
1. `.specify/memory/constitution.md` — highest authority
2. `.specify/specs/[feature]/spec.md` — functional requirements
3. `.specify/specs/[feature]/plan.md` — architecture
4. `.specify/specs/[feature]/tasks.md` — implementation tasks
5. `.windsurf/rules/essential-rules.md` — project map
6. `docs/CONTEXT.md` — current state

**Why this order matters**:
- Constitution is non-negotiable (code must comply)
- Spec defines what to build (requirements are source of truth)
- Plan defines how to build (architecture decisions)
- Tasks define implementation steps (what was actually done)

**What review does**:
- Check code against spec requirements
- Verify architecture matches plan
- Confirm tasks were completed correctly
- Flag deviations from constitution

**What review does NOT do**:
- Rewrite spec (use `/speckit.specify` for that)
- Change architecture (use `/speckit.plan` for that)
- Add new tasks (use `/speckit.tasks` for that)

---

### 2. Consistency Check Integration

**Review runs same checks as `/speckit.analyze`** but on implemented code:

| Check | /speckit.analyze | /review |
|-------|------------------|---------|
| Spec/plan alignment | ✅ Pre-implementation | ✅ Post-implementation |
| Plan/tasks alignment | ✅ Pre-implementation | ✅ Post-implementation |
| Constitution compliance | ✅ Document level | ✅ Code level |
| Duplicate requirements | ✅ In spec/plan/tasks | ✅ In code |
| Coverage gaps | ✅ Requirements → tasks | ✅ Tasks → code |

**Difference**:
- `/speckit.analyze` checks documents for consistency BEFORE coding
- `/review` checks code matches documents AFTER coding

**Workflow**:
1. Run `/speckit.analyze` after task generation → fix document issues
2. Run `/speckit.implement` → build feature
3. Run `/review` → verify code matches fixed documents

---

### 3. Deduplication Detection

**Speckit prevents duplication in design**:
- `/speckit.specify` — No duplicate requirements
- `/speckit.plan` — No duplicate components/services
- `/speckit.tasks` — No duplicate tasks

**Review prevents duplication in code**:
- Pass 3: Duplicates and Conflicting Paths
- Detects functions/types/components doing same thing
- Recommends canonical version per constitution

**Integration**:
```markdown
## Example: Token Validation Duplication

**Spec says** (spec.md §FR-3): "System validates worker tokens before dashboard access"

**Plan says** (plan.md §Services): "TokenService handles all token operations"

**Tasks say** (tasks.md T-004): "Implement token validation in TokenService"

**Code has**:
- `packages/auth/src/TokenService.ts:validateToken()` ✅ Matches plan
- `apps/api/src/utils/token-helpers.ts:checkToken()` ❌ Duplicate, not in plan
- `apps/admin/src/lib/auth.ts:isTokenValid()` ❌ Duplicate, not in plan

**Review finding**:
- Type: DUPLICATION
- Severity: HIGH
- Canonical: TokenService (matches plan §Services)
- Remove: token-helpers.ts, auth.ts versions
- Update docs: None needed (plan already correct)
```

---

### 4. Coverage Gap Detection

**Speckit checks requirements → tasks**:
- `/speckit.analyze` — Every requirement has ≥1 task

**Review checks tasks → code**:
- Pass 4: Coverage and Orphans
- Every task has implementation
- Every implementation has task

**Integration**:
```markdown
## Example: Missing Implementation

**Spec says** (spec.md §FR-5): "Workers see access codes for locations"

**Plan says** (plan.md §Data Model): "Schedule includes access_codes field"

**Tasks say** (tasks.md T-012): "Display access codes in worker dashboard"

**Code has**:
- Database: `schedules.access_codes` column ✅ Exists
- API: `GET /dashboard/:token` returns schedule ✅ Exists
- UI: WorkerDashboard.tsx shows schedule ✅ Exists
- UI: No access_codes rendering ❌ MISSING

**Review finding**:
- Type: GAP
- Severity: HIGH
- Location: spec.md §FR-5
- Missing: Access codes display in WorkerDashboard.tsx
- Task: T-012 incomplete
```

---

### 5. Orphan Behavior Detection

**Speckit prevents orphan tasks**:
- `/speckit.analyze` — Every task maps to requirement

**Review detects orphan code**:
- Pass 4: Coverage and Orphans
- Code exists with no spec/plan/task backing

**Integration**:
```markdown
## Example: Orphan Feature

**Code has**:
- `apps/worker/src/components/WeatherWidget.tsx` — Shows weather forecast

**Spec says**: Nothing about weather
**Plan says**: Nothing about weather
**Tasks say**: Nothing about weather

**Review finding**:
- Type: ORPHAN
- Severity: MEDIUM
- Location: apps/worker/src/components/WeatherWidget.tsx
- Recommendation: Delete OR add to spec if needed
```

**Why orphans matter**:
- Violates spec-driven development
- Untested features (no acceptance criteria)
- Scope creep (not in MVP boundary)
- Maintenance burden (undocumented code)

---

### 6. Document Update Recommendations

**When code is correct but docs are stale**:

```markdown
## Example: Stale Plan

**Code has**:
- `packages/sms/src/providers/twilio.ts` — Twilio SMS adapter

**Spec says** (spec.md §Integrations): "SMS via MobileMessage.com.au"
**Plan says** (plan.md §SMS): "MobileMessage.com.au only"

**Review finding**:
- Type: STALE_DOC
- Severity: MEDIUM
- Code is correct: Twilio added as fallback (good practice)
- Docs outdated: plan.md needs update

**Recommendation**:
Update `plan.md §SMS` to:
"Primary: MobileMessage.com.au
Fallback: Twilio (for delivery failures)"

Update `spec.md §Integrations` to:
"SMS delivery with automatic fallback"
```

**Process**:
1. Review flags stale docs
2. User approves doc update
3. Run `/speckit.plan` or `/speckit.specify` to update
4. Re-run `/review` to confirm alignment

---

## Conflict Resolution Rules

### When Review Contradicts Speckit

**Scenario 1: Code violates spec**
- **Review says**: Code doesn't match spec requirement
- **Action**: Fix code to match spec (spec is source of truth)

**Scenario 2: Spec is wrong, code is right**
- **Review says**: Code is correct but spec outdated
- **Action**: Update spec via `/speckit.specify`, then re-review

**Scenario 3: Constitution conflict**
- **Review says**: Code violates constitution
- **Action**: Fix code (constitution supersedes spec/plan/tasks)

**Scenario 4: Plan/tasks conflict**
- **Review says**: Code matches spec but not plan
- **Action**: Update plan via `/speckit.plan` if code is better

---

## Review Output Format for Speckit

**Findings table** includes document references:

```markdown
| ID | Pass | Layer | Type | Severity | Location | Description | Recommended Action |
|----|------|-------|------|----------|----------|-------------|-------------------|
| R01 | 2 | spec | GAP | HIGH | spec.md §FR-5 | Access codes requirement has no UI implementation | Add access codes display to WorkerDashboard.tsx per T-012 |
| R02 | 3 | implementation | DUPLICATION | HIGH | TokenService.ts, token-helpers.ts | Token validation exists in two places | Keep TokenService (matches plan §Services), remove token-helpers.ts |
| R03 | 2 | plan | STALE_DOC | MEDIUM | plan.md §SMS | Plan says MobileMessage only, code has Twilio fallback | Update plan.md to document fallback strategy |
```

**Canonical path recommendations** reference spec/plan:

```markdown
## Canonical Path Recommendations

### Token Validation

**Keep**: `packages/auth/src/TokenService.ts:validateToken()` — matches plan.md §Services
**Remove**: `apps/api/src/utils/token-helpers.ts:checkToken()` — not in plan, duplicate
**Update**: None (plan already correct)

### SMS Provider

**Keep**: Both MobileMessage and Twilio adapters — fallback is good practice
**Remove**: Nothing
**Update**: `plan.md §SMS` — add "Fallback: Twilio for delivery failures"
```

---

## Workflow Coordination

### Before Review
1. ✅ `/speckit.specify` — Requirements defined
2. ✅ `/speckit.plan` — Architecture designed
3. ✅ `/speckit.tasks` — Tasks broken down
4. ✅ `/speckit.analyze` — Documents consistent
5. ✅ `/speckit.implement` — Feature built

### During Review
1. Load spec/plan/tasks as governing documents
2. Check code against requirements (Pass 2)
3. Detect duplicates (Pass 3)
4. Find coverage gaps (Pass 4)
5. Check code quality (Pass 5)

### After Review
1. Apply CRITICAL/HIGH fixes (or save as tasks)
2. Update stale docs if needed (via `/speckit.specify` or `/speckit.plan`)
3. Write devlog entry (via `/devlog`)
4. Re-run `/review` if docs updated

---

## Best Practices

### DO
- ✅ Load spec/plan/tasks before reviewing code
- ✅ Flag code that doesn't match spec (spec is source of truth)
- ✅ Recommend doc updates when code is correct but docs stale
- ✅ Use constitution as highest authority
- ✅ Reference spec/plan sections in findings

### DON'T
- ❌ Rewrite spec during review (use `/speckit.specify`)
- ❌ Change architecture during review (use `/speckit.plan`)
- ❌ Add new tasks during review (use `/speckit.tasks`)
- ❌ Ignore constitution violations (always CRITICAL)
- ❌ Skip document loading (review needs context)

---

## Example: Full Integration Flow

```bash
# 1. Design phase (speckit)
/speckit.specify "Worker dashboard shows access codes"
/speckit.plan
/speckit.tasks
/speckit.analyze  # ← Catches document inconsistencies

# 2. Implementation phase
/speckit.implement  # ← Builds feature

# 3. Review phase
/review  # ← YOU ARE HERE
# Findings:
# - R01: Access codes not displayed (GAP)
# - R02: Token validation duplicated (DUPLICATION)
# - R03: Plan outdated for SMS fallback (STALE_DOC)

# 4. Fix phase
# Apply R01 fix: Add access codes to UI
# Apply R02 fix: Remove duplicate token validation
# Update plan.md for R03

# 5. Document phase
/devlog  # ← Records review findings

# 6. Verify phase
/review  # ← Confirm all issues resolved
```

---

**Reference**: Used by `.windsurf/workflows/review.md` to integrate with speckit workflows
