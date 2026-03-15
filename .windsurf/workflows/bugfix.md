---
description: Investigate a reported bug, trace it to root cause, produce a structured report, apply or log the fix, and write a devlog entry — fully autonomous, no prompts required.
---

## User Input

```text
$ARGUMENTS
```

## Goal

Investigate the reported bug without asking any questions. Read the codebase, trace the fault, produce a report, apply or log the fix, then write the devlog entry. The only decision handed to the user is fix-now vs save-for-later — everything else runs automatically.

---

## Execution Steps

### 1. Parse the Bug from Input

Read `$ARGUMENTS`. Extract whatever is available:
- Symptom (what the user observed)
- Location hint (app, screen, action, error message)
- Any reproduction steps

Do NOT ask clarifying questions. Work with what is given. If the input is minimal, infer scope from the error message or symptom and proceed. State your inference at the top of the report so the user can see your reasoning.

---

### 2. Load Context

Read these files in order — stop loading once you have enough to trace the bug:

1. `.windsurf/rules/projectrules.md` — project map
2. `.specify/memory/constitution.md` — governing rules and severity triggers
3. `docs/CONTEXT.md` — current project state
4. `docs/2-architecture/ARCHITECTURE.md` — system structure

Then load only the area relevant to the symptom using the file location map in `.windsurf/skills/bugfix/SKILL.md`. Do not load unrelated packages or apps.

---

### 3. Trace Root Cause

Walk the call path from symptom to source:
1. Entry point — route, component, or trigger
2. Service layer — which service handles this
3. Data layer — repository, RLS policy, or query involved
4. Exact fault — file path and line range

Use the bug type classification table in `.windsurf/skills/bugfix/SKILL.md`.

---

### 4. Assess Severity

Use the severity scale in `.windsurf/skills/bugfix/SKILL.md`.

**If CRITICAL** (multi-tenant exposure, RLS failure, token bypass, data loss):
- Stop all other output immediately
- Surface the exact file, line, and risk as the first and only output
- Follow constitution Section IX: document concern, propose solution, get approval before proceeding
- Do not apply any fix until the user explicitly approves

---

### 5. Output Bug Report

Print the structured bug report using the format in `.windsurf/skills/bugfix/SKILL.md`.

Generate a Bug ID: `BUG-[YYYY-MM-DD]-[short-slug-from-symptom]`

---

### 6. Present Fix Decision

Immediately after the report, print exactly this — no extra explanation:

```
Fix options:
  A — Apply fix now
  B — Save as task for later
```

Wait for the user to reply A or B.

**If A**: Apply the fix following all constitution rules. Mark complete.
**If B**: Append the task to `.specify/bugs/open-bugs.md` under `## Open [YYYY-MM-DD]`. Create the file if it does not exist.

---

### 7. Write Devlog Entry

After A or B is resolved, open `docs/DEVLOG.md` and append a new entry.

**If `docs/DEVLOG.md` does not exist**: Create it with the bootstrap header defined in `.windsurf/skills/devlog/SKILL.md`, then append the entry.

Entry format:

```markdown
---

## Entry #[N] — [YYYY-MM-DD] — BUGFIX: [Short title]

**Bug ID**: [BUG-YYYY-MM-DD-slug]
**Severity**: [CRITICAL / HIGH / MEDIUM / LOW]
**Status**: [fixed | logged-for-later]

### What Happened
[Plain language — what was broken and where]

### Root Cause
[Exact file and line range — what was wrong and why]

### Files Touched
- `[file path]` — [created / modified / deleted] — [what changed]

### Why
[What this bug was causing and why fixing it matters for the product]

### Constitution Notes
[Any flags raised, or "None"]

### Git Commit
`[suggested commit message — e.g. fix(api): resolve null guard missing in TokenService L84]`
```

Update the Session Index table at the top of `docs/DEVLOG.md` with the new row.

---

## Rules

- Never ask questions during investigation — infer and proceed
- Never modify files during Steps 1–5
- Always write the devlog entry — no fix session is complete without it
- Always suggest a git commit message at the end of the devlog entry
- CRITICAL bugs halt everything and surface the risk first — no exceptions
