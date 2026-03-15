---
description: Maintain the project development log across monthly files with a master index, decisions log, and bug history. On first run, reconstructs full project history from git and docs. On every subsequent run, writes entries automatically with no prompts required.
---

## User Input

```text
$ARGUMENTS
```

## Goal

Maintain a structured, navigable development record across multiple files — never one cluttered document. Every action is logged, every month is its own file, every decision and bug has a dedicated home. Runs completely autonomously — no user prompts at any point.

---

## Execution Steps

### 1. Determine Run Mode

Check the state of `docs/devlog/INDEX.md`:

| Condition | Mode |
|-----------|------|
| `docs/devlog/INDEX.md` does not exist | **Bootstrap** (Step 2) |
| Exists but fewer than 3 entries | **Bootstrap** (Step 2) |
| Exists with entries, no `$ARGUMENTS` | **Append** (Step 5) |
| `$ARGUMENTS` contains structured bugfix context | **Bugfix Entry** (Step 6) |
| `$ARGUMENTS` = `seal` | **Seal Month** (Step 7) |
| `$ARGUMENTS` = `proof` | **Generate Proof** (Step 8) |

---

### 2. Bootstrap Mode — Reconstruct Full History

Runs once. Excavates everything. Writes the complete project history. No user input at any point.

#### 2a. Build the Folder Structure

Create if they do not exist:

```
docs/devlog/
  INDEX.md
  decisions.md
  bugs.md
```

Write each file using the header formats in `.windsurf/skills/devlog/SKILL.md`.

#### 2b. Gather All Evidence

Run and read:

```bash
git log --all --date=short --pretty=format:"%ad | %H | %s" | sort
```

Then read every file in the Evidence Sources table in `.windsurf/skills/devlog/SKILL.md`.

From all evidence, extract a raw event list:

```
[date] | [action type] | [area] | [summary] | [files if known] | [evidence source]
```

#### 2c. Group Events Into Entries

Group using the Grouping Rules in `.windsurf/skills/devlog/SKILL.md`.

Do not create one entry per commit. A unit of work is: commits on the same day, in the same area, with a coherent purpose.

Every ADR found becomes its own standalone `DECISION` entry regardless of grouping.

#### 2d. Organise By Month

Group all entries by `YYYY-MM`. For each unique month:

1. Create `docs/devlog/YYYY-MM.md` using the monthly file header from the skill
2. Write all entries for that month in date order using the standard entry format
3. Past months (not current month) → write a Monthly Summary section at the bottom, mark `[SEALED]` in the file header
4. Current month → leave open, no summary yet

#### 2e. Populate decisions.md

For every `DECISION` entry found:
- Write to `docs/devlog/decisions.md` using the decision format in the skill
- Include ADR reference number if a matching ADR exists in `docs/4-decisions/ADR/`

#### 2f. Populate bugs.md

For any `BUGFIX` entries found in git history:
- Write to `docs/devlog/bugs.md` under `## Closed`
- Mark status as `[RECONSTRUCTED]`

#### 2g. Build INDEX.md

Write `docs/devlog/INDEX.md` using the index header from the skill.

Add one row per entry across all months, chronological order.

Add one milestone row per phase completion found in `docs/1-overview/ROADMAP.md`.

#### 2h. Final Bootstrap Entry

Append to the current month file:

```markdown
---

## Entry #[N] — [TODAY] — DOCS: Development log bootstrapped

**Status**: completed
**Source**: reconstructed

### What Happened
Full project development history reconstructed from git commits, ADRs, roadmap,
and documentation. [N] entries written covering [earliest date] to today
across [X] monthly files.

### Files Touched
- `docs/devlog/INDEX.md` — created
- `docs/devlog/[each monthly file]` — created
- `docs/devlog/decisions.md` — created
- `docs/devlog/bugs.md` — created

### Why
Establishes proof-of-work record and development audit trail from project
inception. Captures all development decisions and actions to date.

### Constitution Notes
None

### Git Commit
`docs: bootstrap devlog with full project history ([N] entries, [start date] → [today])`
```

Update `INDEX.md` with this entry.

---

### 3. Month Boundary Check

Run this silently before writing any entry in Append or Bugfix mode.

Check if today's `YYYY-MM` matches the most recent monthly file in `docs/devlog/`.

**If a new month has started:**
1. Seal the previous month (run Step 7 silently for that month)
2. Create `docs/devlog/[new YYYY-MM].md` using the monthly file header from the skill
3. Continue writing the new entry into the new file

---

### 4. Milestone Detection

Run this silently before writing any entry in Append or Bugfix mode.

Read `docs/1-overview/ROADMAP.md` and `docs/6-product/FEATURES.md`.

If all features for a phase are marked complete and no milestone entry exists for that phase in `INDEX.md`:

Write a milestone marker as the first entry in the current session:

```markdown
---

## ⭐ MILESTONE — Phase [N] Complete — [YYYY-MM-DD]

**Phase**: [N]
**Completed**: [YYYY-MM-DD]

All Phase [N] features shipped. [One sentence describing what Phase [N] delivered.]
See `docs/1-overview/ROADMAP.md` for Phase [N+1] scope.
```

Add to `INDEX.md` with `MILESTONE` in the Action column.

---

### 5. Append Mode — Write a New Entry

Used for all manual runs after bootstrap with no structured arguments.

#### 5a. Find What's New

Read the date of the last entry in `docs/devlog/INDEX.md`.

Run:
```bash
git log --since="[last entry date]" --date=short --pretty=format:"%ad | %s" --all
```

Group commits since that date by unit of work (see Grouping Rules in skill).

If no new commits: check if any doc files have been modified since the last entry. If yes, write a `DOCS` entry. If nothing at all has changed, print:

```
Nothing new to log since [last entry date]. No entry written.
```

And stop.

#### 5b. Determine Entry Number

Count total rows in the `docs/devlog/INDEX.md` index table. New entry = count + 1.

#### 5c. Write the Entry

Run Month Boundary Check (Step 3) first.
Run Milestone Detection (Step 4) first.

Append the entry to the current month file using the standard entry format from the skill.

Update `docs/devlog/INDEX.md`.

If the entry contains a major technical or product decision → also write to `docs/devlog/decisions.md`.

---

### 6. Bugfix Entry Mode

Called automatically by the bugfix workflow. No user interaction required.

Parse structured context from `$ARGUMENTS`:

```
ACTION: bugfix
BUG_ID: [id]
SEVERITY: [level]
FILES_AFFECTED: [comma-separated paths]
SUMMARY: [one sentence]
STATUS: [fixed | logged-for-later]
CONSTITUTION_FLAGS: [flags or none]
```

Run Month Boundary Check (Step 3).

Write entry to current month file using the BUGFIX entry format from the skill.

Also write to `docs/devlog/bugs.md`:
- Under `## Closed` if status is `fixed`
- Under `## Open` if status is `logged-for-later`

Update `docs/devlog/INDEX.md`.

---

### 7. Seal Month Mode

Called automatically at month boundary, or manually with `$ARGUMENTS = seal`.

Find the most recently completed month file that is not yet `[SEALED]`.

Write a Monthly Summary at the bottom of that file:

```markdown
---

## Monthly Summary — [Month Name YYYY]

**Total Entries**: [N]
**Breakdown**: [N] builds | [N] bugfixes | [N] decisions | [N] refactors | [N] other
**Features Shipped**: [list names, or "none"]
**Bugs Fixed**: [N] ([BUG IDs])
**Decisions Made**: [N] ([short decision titles])
**Milestones**: [phase completions, or "none"]

### This Month in Plain Language
[3–5 sentences. What was the focus? What got shipped? What was hard?
What was decided? Written for a future reader with no context.]

### Most Active Files This Month
[Top 5–8 most-modified files and one sentence on why each was touched]
```

Update the file header to `[SEALED — do not edit]`.

Add a sealed marker row to `docs/devlog/INDEX.md`:

```
| — | [YYYY-MM] | SEALED | [N] entries — [Month YYYY] complete |
```

---

### 8. Generate Proof Mode

Called with `$ARGUMENTS = proof`.

Reads all devlog files and generates `docs/PROOF.md` — a clean, single document suitable for investors, lawyers, or future developers.

```markdown
# Dashboard Link — Proof of Development

**Project**: Dashboard Link (CleanConnect SaaS)
**Developer**: Solo founder
**Period**: [earliest devlog date] — [today]
**Total Logged Actions**: [N]
**Generated**: [today]

---

## Development Timeline

| # | Date | Action | Summary |
|---|------|--------|---------|
[All INDEX.md rows — milestones highlighted with ⭐]

---

## Key Decisions

[All entries from decisions.md — 2 sentences each, ADR reference where applicable]

---

## Features Shipped

| Feature | First Logged | Status |
|---------|-------------|--------|
[From FEATURES.md cross-referenced with devlog entries]

---

## Development Phases

| Phase | Started | Completed | Notes |
|-------|---------|-----------|-------|
[From ROADMAP.md cross-referenced with milestone entries]

---

## Bug History

| Bug ID | Severity | Date | Status |
|--------|----------|------|--------|
[From bugs.md]

**Total found**: [N] | **Fixed**: [N] | **Critical**: [N]

---

*Auto-generated from docs/devlog/. Full detail in monthly files.*
*Last updated: [today]*
```

Save to `docs/PROOF.md`.

---

### 9. Confirm

After any mode completes, print:

```
✅ Devlog updated

Mode:     [Bootstrap / Append / Bugfix Entry / Seal / Proof]
Written:  [list of files written or updated]
Entries:  [total entries across all monthly files]
Current:  docs/devlog/[YYYY-MM].md → Entry #[N]

Suggested git commit:
[commit message]
```

---

## Rules

- Never ask the user for any information — find it or infer it from the project
- Never edit sealed monthly files — they are permanent
- Never overwrite or compress any previous entry
- The Why field is mandatory — an entry without a reason is not valid
- Always end with a suggested git commit message
- Decisions go to both the monthly file and decisions.md
- Bugs go to both the monthly file and bugs.md
- PROOF.md is a derived document — always regenerate fresh, never manually edit
- Plain language always — readable years from now without technical context
- When in doubt about what to log — log more, not less
