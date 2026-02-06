---
description: Execute the implementation planning workflow using the plan template to generate design artifacts.
---

Read and execute the workflow in `.specify/templates/commands/plan.md`. Ignore YAML frontmatter. Follow the **Outline** and all subsequent sections.

## User Input

```text
$ARGUMENTS
```

**Placeholder resolution** (Windows/PowerShell):
- `{SCRIPT}` → `.specify/scripts/powershell/setup-plan.ps1 -Json`
- `{AGENT_SCRIPT}` → `.specify/scripts/powershell/update-agent-context.ps1 -AgentType windsurf`
- `{ARGS}` → The user input above

Follow all steps, rules, and guidelines in the command file.
