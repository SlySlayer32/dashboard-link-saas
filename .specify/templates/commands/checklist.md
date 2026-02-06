---
description: Generate a custom checklist for the current feature based on user requirements.
scripts:
  sh: scripts/bash/check-prerequisites.sh --json
  ps: scripts/powershell/check-prerequisites.ps1 -Json
---

## Core Concept

Checklists are **unit tests for requirements writing** — they validate quality, clarity, and completeness of the **spec itself**, NOT the implementation.

- **Ask**: "Are [requirements] defined/specified/documented for [scenario]?" `[Quality dimension]`
- **Never**: "Verify/Test/Confirm [implementation behaviour]"

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Chain

```text
constitution → specify → clarify → plan → tasks → analyze → implement
                    ↕           ↕
              [CHECKLIST]  [CHECKLIST]
```

- **Position**: Auxiliary — can run after specify (validate spec quality) or after plan (validate design quality)
- **Prerequisites**: spec.md (minimum); plan.md and tasks.md improve checklist quality
- **Next step**: Fix issues found, then continue the main chain

## Execution

### 1. Setup

Run `{SCRIPT}` from repo root. Parse JSON for FEATURE_DIR and AVAILABLE_DOCS. All paths absolute. Use double-quotes for args with apostrophes.

### 2. Clarify Intent

Ask up to 3 contextual questions (skip if already clear from `$ARGUMENTS`):
- **Scope**: What domain/area? (e.g., UX, API, security, performance)
- **Depth**: Lightweight sanity check or formal gate?
- **Boundaries**: Anything explicitly excluded?

Defaults if interaction impossible: Standard depth, PR reviewer audience, top 2 relevance clusters.

### 3. Load Context

Read relevant portions of spec.md, plan.md (if exists), tasks.md (if exists) from FEATURE_DIR. Load only sections relevant to the checklist focus — avoid full-file dumping.

### 4. Generate Checklist

- Create `FEATURE_DIR/checklists/[domain].md` (e.g., `ux.md`, `api.md`, `security.md`)
- Use `templates/checklist-template.md` for structure
- Number items sequentially: CHK001, CHK002…
- Each run creates a NEW file (never overwrites)

**Item format**: `- [ ] CHK### Question about requirement quality [Dimension, Spec §X.Y or Gap]`

**Quality dimensions** to cover:
- **Completeness**: Are all necessary requirements present?
- **Clarity**: Are requirements unambiguous and quantified?
- **Consistency**: Do requirements align across sections?
- **Measurability**: Can criteria be objectively verified?
- **Coverage**: Are edge cases, error states, and scenarios addressed?

**Traceability**: ≥80% of items must reference `[Spec §X.Y]`, `[Gap]`, `[Ambiguity]`, or `[Conflict]`.

**Consolidation**: Soft cap ~40 items. Merge near-duplicates; batch low-impact edge cases.

**Prohibited patterns**: No "Verify/Test/Confirm" + implementation behaviour. No references to code execution, clicks, renders, or frameworks.

### 5. Report

Output: checklist path, item count, focus areas, depth level. Remind user each run creates a new file.
