---
description: Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts.
---

Read and execute the workflow in `.specify/templates/commands/tasks.md`. Ignore YAML frontmatter. Follow the **Outline** and all subsequent sections.

## User Input

```text
$ARGUMENTS
```

**Placeholder resolution** (Windows/PowerShell):
- `{SCRIPT}` → `.specify/scripts/powershell/check-prerequisites.ps1 -Json`
- `{ARGS}` → The user input above

Follow all steps, rules, and guidelines in the command file.
