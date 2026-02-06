---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md
---

Read and execute the workflow in `.specify/templates/commands/implement.md`. Ignore YAML frontmatter. Follow the **Execution** and all subsequent sections.

## User Input

```text
$ARGUMENTS
```

**Placeholder resolution** (Windows/PowerShell):
- `{SCRIPT}` → `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks`
- `{ARGS}` → The user input above

Follow all steps, rules, and guidelines in the command file.
