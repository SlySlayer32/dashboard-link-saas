$ErrorActionPreference = "Stop"

Write-Host "Running development quality checks..." -ForegroundColor Cyan
Write-Host ""

$failures = 0

function Invoke-Check {
  param(
    [string]$Name,
    [string]$Command
  )

  Write-Host "▶ $Name" -ForegroundColor Yellow

  try {
    Invoke-Expression $Command
    if ($LASTEXITCODE -ne 0) {
      throw "Command exited with code $LASTEXITCODE"
    }
    Write-Host "✓ $Name passed" -ForegroundColor Green
  } catch {
    $script:failures += 1
    Write-Host "✗ $Name failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor DarkRed
  }

  Write-Host ""
}

Invoke-Check "TypeScript Type Check" "pnpm run typecheck"
Invoke-Check "ESLint Check" "pnpm run lint"
Invoke-Check "Prettier Format Check" "pnpm run format:check"
Invoke-Check "Build Verification" "pnpm run build"
Invoke-Check "Unit Tests" "pnpm run test"

Write-Host "========================================"
if ($failures -eq 0) {
  Write-Host "✓ All checks passed. Ready to commit." -ForegroundColor Green
  exit 0
}

Write-Host "✗ $failures check(s) failed. Please fix before committing." -ForegroundColor Red
exit 1
