---
description: Perform a non-destructive cross-artifact consistency and quality analysis across spec.md, plan.md, and tasks.md after task generation.
---

Read and execute the workflow in `.specify/templates/commands/analyze.md`. Ignore YAML frontmatter. Follow the **Goal**, **Execution**, and all subsequent sections.

## User Input

```text
$ARGUMENTS
```

**Placeholder resolution** (Windows/PowerShell):
- `{SCRIPT}` → `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks`
- `{ARGS}` → The user input above

Follow all steps, rules, and guidelines in the command file.
