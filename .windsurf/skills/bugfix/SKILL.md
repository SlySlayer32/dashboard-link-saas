---
name: bugfix
description: Reference tables and formats used by the bugfix workflow. Contains bug type classifications, severity scale, file location map, and report format. Used by bugfix.md — do not run directly.
compatibility: Used by .windsurf/workflows/bugfix.md
metadata:
  author: dashboard-link
  source: .windsurf/skills/bugfix/SKILL.md
---

# Bugfix Skill — Reference

## Bug Type Classification

| Type | Description | Common Location |
|------|-------------|-----------------|
| `logic-error` | Wrong conditional, calculation, or state transition | services/, components/ |
| `missing-guard` | Null/undefined not handled, no fallback | services/, route handlers |
| `rls-violation` | Multi-tenant data leaking or incorrectly blocked | packages/database/, RLS policies |
| `token-error` | Invalid, expired, or revoked token not handled | TokenService, worker dashboard |
| `type-error` | TypeScript mismatch causing runtime failure | anywhere — check strict mode |
| `integration-error` | External service (SMS, plugin API) failing or mishandled | adapters/, SMSService |
| `ui-error` | Component rendering incorrectly, layout broken | apps/admin/src/, apps/worker/src/ |
| `config-error` | Environment variable, adapter, or import misconfigured | .env, adapters/, package config |

---

## Severity Scale

| Severity | Condition | Constitution Reference |
|----------|-----------|----------------------|
| **CRITICAL** | Multi-tenant data exposure, token bypass, RLS failure, data loss | Section IX — halt immediately, flag before all else |
| **HIGH** | Feature completely broken, workers cannot access dashboard, SMS not sending | Section II, III |
| **MEDIUM** | Feature partially broken, non-critical path affected, workaround exists | — |
| **LOW** | Visual glitch, minor UX issue, non-blocking edge case | — |

**CRITICAL escalation process** (from constitution Section IX):
1. Stop work immediately
2. Document: what, why, impact, alternatives
3. Propose solution
4. Get approval before proceeding
5. Update constitution if needed

---

## File Location Map

| Symptom Area | Primary Files to Load |
|---|---|
| Manager dashboard | `apps/admin/src/` — relevant component and route only |
| Worker dashboard | `apps/worker/src/` — relevant component only |
| API / backend | `packages/api/src/routes/` + `packages/api/src/services/` |
| Multi-tenant / RLS | `packages/database/src/repositories/` + Supabase RLS policies |
| SMS delivery | `packages/api/src/services/SMSService` + `packages/api/src/adapters/` |
| Token validation | `packages/api/src/services/TokenService` |
| Plugin sync | `packages/api/src/adapters/` — relevant plugin adapter |

Load narrow first. Expand only if root cause not found in primary files.

---

## Bug Report Format

```markdown
## Bug Report

**ID**: BUG-[YYYY-MM-DD]-[short-slug]
**Date**: [YYYY-MM-DD]
**Severity**: [CRITICAL / HIGH / MEDIUM / LOW]
**Type**: [bug type from classification above]

### Symptom
[What the user observed — plain language, no assumptions]

### Root Cause
[Exact file path, line range, and explanation of what is wrong and why]

### Affected Files
- `[file path]` — [why affected]

### Constitution Flags
[Any violations, or "None detected"]

### Proposed Fix
[Plain-language description of what needs to change — no code yet]

### Risk of Fix
[Low / Medium / High — will this change affect other areas?]
```

---

## Open Bugs File Format

Path: `.specify/bugs/open-bugs.md`

```markdown
# Open Bugs

## Open [YYYY-MM-DD]

- [ ] [BUG-YYYY-MM-DD-slug] — [severity] — Fix: [plain description] in `[file path]`
```
