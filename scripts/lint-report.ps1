$ErrorActionPreference = "Continue"

$reportFile = "lint-report.txt"
"" | Set-Content $reportFile

function Write-Section {
  param(
    [string]$Title,
    [string]$Command
  )

  Add-Content $reportFile ""
  Add-Content $reportFile $Title
  Add-Content $reportFile ("".PadLeft(34, "="))

  $output = Invoke-Expression $Command 2>&1
  if ($output) {
    $output | Add-Content $reportFile
  }
}

Add-Content $reportFile "=================================="
Add-Content $reportFile "LINT REPORT - $(Get-Date -Format s)"
Add-Content $reportFile "=================================="

Write-Section "1. TYPESCRIPT TYPE ERRORS" "pnpm run typecheck"
Write-Section "2. ESLINT ISSUES" "pnpm run lint"
Write-Section "3. PRETTIER FORMATTING ISSUES" "pnpm run format:check"

$report = Get-Content $reportFile
$report | ForEach-Object { Write-Host $_ }
Write-Host ""
Write-Host "Full report saved to: $reportFile" -ForegroundColor Green
