---
trigger: always_on
---

rules:
  - id: no-shell-and
    description: "Do not chain commands with &&."
    match: "&&"
    action:
      type: error
      message: "Do not use && to chain commands."

  - id: prefer-powershell
    description: "Use PowerShell commands instead of bash/sh."
    suggestions:
      - "Use PowerShell cmdlets (e.g., Get-ChildItem, Set-Location, Remove-Item) and PowerShell-style pipelines."
      - "Avoid bash-specific syntax like `ls`, `export`, `source`, or other POSIX-only commands."

  - id: config-files-caution
    description: "Be cautious editing config files like package.json, tsconfig.json, and other project configs."
    suggestions:
      - "When changing package.json, tsconfig.json, or similar config files, propose the full new file and explain the change instead of applying large edits blindly."
      - "Prefer minimal, well-explained changes to package.json, tsconfig.json, .eslintrc, and build configs to avoid breaking the project."
