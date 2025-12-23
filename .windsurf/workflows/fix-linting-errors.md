---
description: Fix all linting errors in the project systematically
---

# Fix Linting Errors Workflow

This workflow automates the process of fixing common ESLint errors in the CleanConnect project.

## Steps

1. **Run lint to identify errors**
   ```bash
   pnpm lint
   ```

2. **Bulk fix common pattern errors**
   
   Replace `@ts-ignore` with `@ts-expect-error`:
   ```bash
   # In PowerShell (for Windows)
   Get-ChildItem -Path . -Filter "*.ts" -Recurse | ForEach-Object { 
     (Get-Content $_.FullName) -replace '@ts-ignore', '@ts-expect-error' | Set-Content $_.FullName 
   }
   ```

   Replace `: any` with `: unknown`:
   ```bash
   # In PowerShell (for Windows)
   Get-ChildItem -Path . -Filter "*.ts" -Recurse | ForEach-Object { 
     (Get-Content $_.FullName) -replace ': any', ': unknown' | Set-Content $_.FullName 
   }
   ```

3. **Fix missing imports**
   - Check for `no-undef` errors
   - Add missing imports from `@dashboard-link/shared`
   - Common missing imports: `logger`, `WorkerQuerySchema`, `CreateWorkerSchema`, `UpdateWorkerSchema`, `UseQueryResult`

4. **Fix unused variables**
   - Prefix unused parameters with `_` (e.g., `_config`, `_workerId`)
   - Remove unused variable declarations

5. **Fix console statements**
   - Replace `console.log` with `logger.info`
   - Replace `console.error` with `logger.error`
   - Replace `console.warn` with `logger.warn`
   - Ensure `logger` is imported from `../utils/logger` or `@dashboard-link/shared`

6. **Fix React-specific issues**
   - Replace `Math.random()` with `useId()` hook for IDs
   - Add missing React imports (`import React from 'react'`)
   - Fix HTML element types (import from 'react')

7. **Fix non-null assertions**
   - Replace `!` with proper type guards or optional chaining
   - Example: `plugin!` → `if (plugin) { ... }`

8. **Run lint again to verify fixes**
   ```bash
   pnpm lint
   ```

9. **If errors remain, fix manually**
   - Read the specific error messages
   - Apply targeted fixes
   - Repeat until all errors are resolved

10. **Commit the changes**
    ```bash
    git add -A
    git commit -m "fix: resolve all linting errors
    
    - Replace @ts-ignore with @ts-expect-error
    - Replace any types with unknown or proper types
    - Add missing imports
    - Fix unused variables and console statements
    - Resolve React-specific issues"
    ```

## Common Error Patterns and Solutions

### no-undef
- Add missing import from `@dashboard-link/shared`
- Check if the variable is defined in the file

### @typescript-eslint/no-explicit-any
- Replace `any` with `unknown` or a specific type
- For API responses, use proper type definitions

### @typescript-eslint/no-unused-vars
- Prefix with `_` if parameter is required but unused
- Remove the variable if not needed

### no-console
- Replace with appropriate logger method
- Import logger if not already imported

### react-hooks/purity
- Replace `Math.random()` with `useId()` hook
- Move random ID generation outside component

### Forbidden non-null assertion
- Use optional chaining (`?.`)
- Add proper null checks

## Tips

- Run lint after each major fix to track progress
- Use `pnpm lint --quiet` to see only errors
- Focus on one file at a time if overwhelmed
- Check the shared package for common types and utilities
