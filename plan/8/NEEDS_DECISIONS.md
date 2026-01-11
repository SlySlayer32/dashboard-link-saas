# Area - Decisions log (Folder 8)

This area tracks open decisions that affect scope, schema, and implementation.
For step-by-step instructions, use `plan/8/PLAYBOOK_DECISIONS.md`.

If anything here conflicts with SSOT, update this file to reference the SSOT.

## Single source of truth (SSOT)

- Repo execution order: `plan/PLAN_INDEX.md`
- Architecture rules: `docs/ARCHITECTURE_BLUEPRINT.md`

---

## Decision workflow (always follow)

1) Add new decision items with a clear question and a default suggestion.
2) Note the impacted folders and scope boundaries.
3) Resolve decisions before expanding scope that depends on them.
4) When resolved, update the affected plan/playbook and remove the item from the open list.
5) Review the list before starting a new folder.

---

## Definition of done (area gate)

- No open decisions block the current folder being executed.
- Resolved decisions are reflected in the relevant plan and playbook.

---

## Open decisions

- None.

---

## Decision template (copy/paste)

```text
- decision: <clear question>
  - default suggestion: <recommended default>
  - context: <short context or constraints>
  - impacted folders: <plan/1..plan/8>
  - owner: <name>
  - date: <YYYY-MM-DD>
```
