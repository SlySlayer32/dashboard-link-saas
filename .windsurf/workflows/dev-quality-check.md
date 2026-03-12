---
description: Auto-fix simple issues and document complex problems with solutions
---

# Development Quality Check & Diagnostic Workflow

This workflow auto-fixes simple issues (formatting, linting) and documents complex problems (TypeScript errors, build failures) with detailed solutions and recommendations. Simple fixes are applied automatically, while major file adjustments are outlined for manual review.

## Steps

### 1. Initialize diagnostic report
```bash
REPORT_FILE="quality-diagnostic-report.md"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "# Quality Diagnostic Report" > $REPORT_FILE
echo "" >> $REPORT_FILE
echo "**Generated:** $TIMESTAMP" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "---" >> $REPORT_FILE
echo "" >> $REPORT_FILE
```

### 2. Check dependencies status
```bash
echo "## 1. Dependency Status" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "Checking if all dependencies are installed..." >> $REPORT_FILE
echo "" >> $REPORT_FILE

if [ ! -d "node_modules" ]; then
  echo "**❌ ISSUE:** node_modules directory not found" >> $REPORT_FILE
  echo "- **Location:** Project root" >> $REPORT_FILE
  echo "- **Cause:** Dependencies have not been installed" >> $REPORT_FILE
  echo "- **Impact:** Cannot run any build, lint, or test commands" >> $REPORT_FILE
  echo "- **Recommendation:** Run \`pnpm install\`" >> $REPORT_FILE
else
  echo "**✅ PASS:** Dependencies are installed" >> $REPORT_FILE
fi
echo "" >> $REPORT_FILE
```

### 3. Auto-fix code formatting with Prettier
// turbo
```bash
echo "## 2. Code Formatting (Prettier)" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "Auto-fixing formatting inconsistencies..." >> $REPORT_FILE
echo "" >> $REPORT_FILE

pnpm run format > format.tmp 2>&1 || true

if grep -q "error" format.tmp; then
  echo "**❌ ERROR:** Prettier encountered errors" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  echo "### Details:" >> $REPORT_FILE
  echo '```' >> $REPORT_FILE
  cat format.tmp >> $REPORT_FILE
  echo '```' >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  echo "- **Cause:** Syntax errors or invalid configuration" >> $REPORT_FILE
  echo "- **Impact:** Cannot auto-format files" >> $REPORT_FILE
  echo "- **Action Required:** Fix syntax errors manually" >> $REPORT_FILE
else
  echo "**✅ AUTO-FIXED:** Code formatted successfully" >> $REPORT_FILE
fi

rm -f format.tmp
echo "" >> $REPORT_FILE
```

### 4. Auto-fix ESLint issues
// turbo
```bash
echo "## 3. ESLint Issues" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "Auto-fixing linting issues..." >> $REPORT_FILE
echo "" >> $REPORT_FILE

pnpm run lint:fix > lint-fix.tmp 2>&1 || true

# Check remaining issues after auto-fix
pnpm run lint > lint-check.tmp 2>&1 || true

if grep -q "error" lint-check.tmp || grep -q "warning" lint-check.tmp; then
  ERROR_COUNT=$(grep -c "error" lint-check.tmp || echo "0")
  WARNING_COUNT=$(grep -c "warning" lint-check.tmp || echo "0")
  
  echo "**⚠️ REMAINING ISSUES:** Some ESLint issues require manual fixes" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  echo "- **Errors:** $ERROR_COUNT" >> $REPORT_FILE
  echo "- **Warnings:** $WARNING_COUNT" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  echo "### Details:" >> $REPORT_FILE
  echo '```' >> $REPORT_FILE
  cat lint-check.tmp >> $REPORT_FILE
  echo '```' >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  echo "- **Cause:** Code violates ESLint rules that cannot be auto-fixed" >> $REPORT_FILE
  echo "- **Impact:** Potential bugs, inconsistent patterns, or code quality issues" >> $REPORT_FILE
  echo "- **Action Required:** Review and fix each issue manually" >> $REPORT_FILE
else
  echo "**✅ AUTO-FIXED:** All ESLint issues resolved" >> $REPORT_FILE
fi

rm -f lint-fix.tmp lint-check.tmp
echo "" >> $REPORT_FILE
```

### 5. Analyze TypeScript type errors with detailed solutions
```bash
echo "## 4. TypeScript Type Errors" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "Running TypeScript compiler checks..." >> $REPORT_FILE
echo "" >> $REPORT_FILE

pnpm run typecheck > typecheck.tmp 2>&1 || true

if grep -q "error TS" typecheck.tmp; then
  ERROR_COUNT=$(grep -c "error TS" typecheck.tmp || echo "0")
  
  echo "**❌ ISSUES FOUND:** $ERROR_COUNT TypeScript type error(s) detected" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  echo "### Error Summary by File:" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  
  # Extract unique files with errors
  grep "error TS" typecheck.tmp | sed 's/(.*//' | sort -u > files-with-errors.tmp
  
  while IFS= read -r file; do
    if [ -n "$file" ]; then
      echo "#### \`$file\`" >> $REPORT_FILE
      echo "" >> $REPORT_FILE
      
      # Get all errors for this file
      grep "$file" typecheck.tmp | grep "error TS" > file-errors.tmp || true
      
      if [ -s file-errors.tmp ]; then
        echo '```' >> $REPORT_FILE
        cat file-errors.tmp >> $REPORT_FILE
        echo '```' >> $REPORT_FILE
        echo "" >> $REPORT_FILE
        
        # Analyze error types and provide solutions
        if grep -q "TS2304" file-errors.tmp; then
          echo "**Common Issue:** Cannot find name (TS2304)" >> $REPORT_FILE
          echo "- **Likely Cause:** Missing import, typo in variable/type name, or missing type declaration" >> $REPORT_FILE
          echo "- **Solution:** Add missing import statement or install missing @types package" >> $REPORT_FILE
          echo "" >> $REPORT_FILE
        fi
        
        if grep -q "TS2322" file-errors.tmp; then
          echo "**Common Issue:** Type mismatch (TS2322)" >> $REPORT_FILE
          echo "- **Likely Cause:** Assigning incompatible types" >> $REPORT_FILE
          echo "- **Solution:** Update type annotations or transform data to match expected type" >> $REPORT_FILE
          echo "" >> $REPORT_FILE
        fi
        
        if grep -q "TS2345" file-errors.tmp; then
          echo "**Common Issue:** Argument type mismatch (TS2345)" >> $REPORT_FILE
          echo "- **Likely Cause:** Function called with wrong parameter types" >> $REPORT_FILE
          echo "- **Solution:** Pass correct types or update function signature" >> $REPORT_FILE
          echo "" >> $REPORT_FILE
        fi
        
        if grep -q "TS2339" file-errors.tmp; then
          echo "**Common Issue:** Property does not exist (TS2339)" >> $REPORT_FILE
          echo "- **Likely Cause:** Accessing undefined property or incorrect type definition" >> $REPORT_FILE
          echo "- **Solution:** Add property to type/interface or check for property existence" >> $REPORT_FILE
          echo "" >> $REPORT_FILE
        fi
        
        if grep -q "TS7006" file-errors.tmp; then
          echo "**Common Issue:** Implicit 'any' type (TS7006)" >> $REPORT_FILE
          echo "- **Likely Cause:** Missing type annotations" >> $REPORT_FILE
          echo "- **Solution:** Add explicit type annotations to parameters/variables" >> $REPORT_FILE
          echo "" >> $REPORT_FILE
        fi
      fi
      
      rm -f file-errors.tmp
    fi
  done < files-with-errors.tmp
  
  echo "### Recommended Actions:" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  echo "1. **Review each file** listed above and examine the specific errors" >> $REPORT_FILE
  echo "2. **Start with TS2304 errors** (missing names) as they often cascade to other errors" >> $REPORT_FILE
  echo "3. **Check imports** - Ensure all types and functions are properly imported" >> $REPORT_FILE
  echo "4. **Update type definitions** - Add or modify interfaces/types as needed" >> $REPORT_FILE
  echo "5. **Run typecheck again** after each fix to see progress" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  echo "- **Impact:** Code may fail at runtime; prevents successful compilation" >> $REPORT_FILE
  echo "- **Priority:** HIGH - Must be fixed before deployment" >> $REPORT_FILE
  
  rm -f files-with-errors.tmp
else
  echo "**✅ PASS:** No TypeScript errors found" >> $REPORT_FILE
fi

rm -f typecheck.tmp
echo "" >> $REPORT_FILE
```

### 6. Analyze build compilation with detailed diagnostics
```bash
echo "## 5. Build Compilation Status" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "Attempting to build shared package..." >> $REPORT_FILE
echo "" >> $REPORT_FILE

pnpm run build --filter=@dashboard-link/shared > build.tmp 2>&1 || true

if grep -q "error" build.tmp || grep -q "failed" build.tmp; then
  echo "**❌ ISSUES FOUND:** Build compilation failed" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  
  # Categorize build errors
  echo "### Build Error Analysis:" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  
  if grep -q "Cannot find module" build.tmp; then
    echo "**Issue Type:** Missing Module Dependencies" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    echo '```' >> $REPORT_FILE
    grep "Cannot find module" build.tmp >> $REPORT_FILE
    echo '```' >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    echo "- **Cause:** Required modules are not installed or paths are incorrect" >> $REPORT_FILE
    echo "- **Solution Steps:**" >> $REPORT_FILE
    echo "  1. Check package.json for missing dependencies" >> $REPORT_FILE
    echo "  2. Run \`pnpm install\` to ensure all packages are installed" >> $REPORT_FILE
    echo "  3. Verify import paths match actual file locations" >> $REPORT_FILE
    echo "  4. Check tsconfig.json path mappings are correct" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
  fi
  
  if grep -q "error TS" build.tmp; then
    echo "**Issue Type:** TypeScript Compilation Errors" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    echo "- **Cause:** Type errors prevent successful compilation" >> $REPORT_FILE
    echo "- **Solution:** Fix TypeScript errors listed in section 4 above" >> $REPORT_FILE
    echo "- **Note:** Build will succeed once all type errors are resolved" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
  fi
  
  if grep -q "ENOENT" build.tmp || grep -q "no such file" build.tmp; then
    echo "**Issue Type:** Missing Files or Directories" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    echo '```' >> $REPORT_FILE
    grep -E "ENOENT|no such file" build.tmp >> $REPORT_FILE
    echo '```' >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    echo "- **Cause:** Build process expects files that don't exist" >> $REPORT_FILE
    echo "- **Solution Steps:**" >> $REPORT_FILE
    echo "  1. Check if referenced files were deleted or moved" >> $REPORT_FILE
    echo "  2. Update import statements to correct paths" >> $REPORT_FILE
    echo "  3. Verify build configuration (tsconfig.json, vite.config.ts)" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
  fi
  
  echo "### Full Build Output:" >> $REPORT_FILE
  echo '```' >> $REPORT_FILE
  cat build.tmp >> $REPORT_FILE
  echo '```' >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  
  echo "### Recommended Fix Order:" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  echo "1. **Install dependencies** - Ensure all packages are available" >> $REPORT_FILE
  echo "2. **Fix TypeScript errors** - Resolve type issues first (see section 4)" >> $REPORT_FILE
  echo "3. **Verify file paths** - Check all imports and references" >> $REPORT_FILE
  echo "4. **Check build config** - Review tsconfig.json and build settings" >> $REPORT_FILE
  echo "5. **Retry build** - Run \`pnpm run build --filter=@dashboard-link/shared\`" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  echo "- **Impact:** Cannot create production builds; deployment will fail" >> $REPORT_FILE
  echo "- **Priority:** HIGH - Blocks deployment" >> $REPORT_FILE
else
  echo "**✅ PASS:** Build compiled successfully" >> $REPORT_FILE
fi

rm -f build.tmp
echo "" >> $REPORT_FILE
```

### 7. Analyze test results with failure diagnostics
```bash
echo "## 6. Test Results" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "Running unit tests..." >> $REPORT_FILE
echo "" >> $REPORT_FILE

pnpm run test:unit --run > test.tmp 2>&1 || true

if grep -q "FAIL" test.tmp || grep -q "failed" test.tmp; then
  FAILED_COUNT=$(grep -c "FAIL" test.tmp || echo "0")
  PASSED_COUNT=$(grep -c "PASS" test.tmp || echo "0")
  
  echo "**❌ ISSUES FOUND:** Test failures detected" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  echo "- **Failed Tests:** $FAILED_COUNT" >> $REPORT_FILE
  echo "- **Passed Tests:** $PASSED_COUNT" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  
  echo "### Failed Test Analysis:" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  
  # Extract failed test details
  if grep -q "AssertionError" test.tmp; then
    echo "**Failure Type:** Assertion Errors" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    echo "- **Cause:** Expected values don't match actual values" >> $REPORT_FILE
    echo "- **Common Reasons:**" >> $REPORT_FILE
    echo "  - Code logic changed but tests weren't updated" >> $REPORT_FILE
    echo "  - Test expectations are incorrect" >> $REPORT_FILE
    echo "  - Data or state setup is wrong" >> $REPORT_FILE
    echo "- **Solution:** Review the expected vs actual values and update code or tests accordingly" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
  fi
  
  if grep -q "TypeError" test.tmp; then
    echo "**Failure Type:** Type Errors in Tests" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    echo "- **Cause:** Incorrect types or undefined values" >> $REPORT_FILE
    echo "- **Solution:** Check function signatures and ensure proper type handling" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
  fi
  
  if grep -q "ReferenceError" test.tmp; then
    echo "**Failure Type:** Reference Errors" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    echo "- **Cause:** Variables or functions not defined" >> $REPORT_FILE
    echo "- **Solution:** Ensure all imports and dependencies are properly set up in tests" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
  fi
  
  echo "### Full Test Output:" >> $REPORT_FILE
  echo '```' >> $REPORT_FILE
  cat test.tmp >> $REPORT_FILE
  echo '```' >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  
  echo "### Recommended Actions:" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  echo "1. **Identify failing test files** - Look for FAIL markers in output above" >> $REPORT_FILE
  echo "2. **Review test expectations** - Check if expected values are still valid" >> $REPORT_FILE
  echo "3. **Debug the code** - Add console.log or use debugger to understand behavior" >> $REPORT_FILE
  echo "4. **Run individual tests** - Use \`pnpm test <test-file>\` to isolate issues" >> $REPORT_FILE
  echo "5. **Update tests or code** - Fix the underlying issue or update test expectations" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  echo "- **Impact:** Regression in functionality; features may not work as expected" >> $REPORT_FILE
  echo "- **Priority:** MEDIUM-HIGH - Should be fixed before merging" >> $REPORT_FILE
  
elif grep -q "No test files found" test.tmp; then
  echo "**⚠️ WARNING:** No tests found" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  echo "- **Cause:** Test files don't exist or aren't configured properly" >> $REPORT_FILE
  echo "- **Impact:** No automated verification of functionality" >> $REPORT_FILE
  echo "- **Recommendation:** Consider adding unit tests for critical functionality" >> $REPORT_FILE
  echo "- **Priority:** LOW - Tests are recommended but not required" >> $REPORT_FILE
else
  echo "**✅ PASS:** All tests passed" >> $REPORT_FILE
fi

rm -f test.tmp
echo "" >> $REPORT_FILE
```

### 8. Check Git status and uncommitted changes
```bash
echo "## 7. Git Status" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "Checking for uncommitted changes..." >> $REPORT_FILE
echo "" >> $REPORT_FILE

git status --short > git-status.tmp

if [ -s git-status.tmp ]; then
  echo "**⚠️ WARNING:** Uncommitted changes detected" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  echo "### Modified Files:" >> $REPORT_FILE
  echo '```' >> $REPORT_FILE
  cat git-status.tmp >> $REPORT_FILE
  echo '```' >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  echo "- **Cause:** Working directory has changes not committed to Git" >> $REPORT_FILE
  echo "- **Impact:** Changes may be lost; difficult to track what was modified" >> $REPORT_FILE
  echo "- **Recommendation:** Review changes and commit them with a descriptive message" >> $REPORT_FILE
else
  echo "**✅ PASS:** Working directory is clean" >> $REPORT_FILE
fi

rm -f git-status.tmp
echo "" >> $REPORT_FILE
```

### 9. Generate summary
```bash
echo "## Summary" >> $REPORT_FILE
echo "" >> $REPORT_FILE

TOTAL_ISSUES=0

# Count issues from each section
grep -c "❌ ISSUES FOUND" $REPORT_FILE > /dev/null && TOTAL_ISSUES=$((TOTAL_ISSUES + $(grep -c "❌ ISSUES FOUND" $REPORT_FILE))) || true
grep -c "⚠️ WARNING" $REPORT_FILE > /dev/null && WARNINGS=$(($(grep -c "⚠️ WARNING" $REPORT_FILE))) || WARNINGS=0

echo "### Issue Count:" >> $REPORT_FILE
echo "- **Critical Issues:** $TOTAL_ISSUES" >> $REPORT_FILE
echo "- **Warnings:** $WARNINGS" >> $REPORT_FILE
echo "" >> $REPORT_FILE

if [ $TOTAL_ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "**🎉 EXCELLENT:** No issues found! Your codebase is in great shape." >> $REPORT_FILE
elif [ $TOTAL_ISSUES -eq 0 ]; then
  echo "**✅ GOOD:** No critical issues, but there are some warnings to review." >> $REPORT_FILE
else
  echo "**⚠️ ACTION REQUIRED:** $TOTAL_ISSUES critical issue(s) need attention." >> $REPORT_FILE
fi

echo "" >> $REPORT_FILE
echo "---" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "**Report Location:** \`$REPORT_FILE\`" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "Review each section above for detailed information about issues, their causes, and recommendations." >> $REPORT_FILE
```

### 10. Display report location and summary
```bash
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 DIAGNOSTIC REPORT COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📄 Full report saved to: quality-diagnostic-report.md"
echo ""
echo "Summary:"
grep "Critical Issues:" $REPORT_FILE
grep "Warnings:" $REPORT_FILE
echo ""
echo "Open the report file to see detailed information about each issue."
echo ""
```

## What This Workflow Does

This hybrid workflow:

1. **Auto-Fixes Simple Issues** - Automatically fixes formatting (Prettier) and linting (ESLint) errors
2. **Documents Complex Issues** - Records major problems (TypeScript errors, build failures, test failures) with detailed analysis
3. **Provides Solutions** - Explains where each issue comes from, why it's occurring, and how to fix it
4. **Categorizes by Severity** - Distinguishes between auto-fixed, critical issues, and warnings
5. **Generates Comprehensive Report** - Creates a detailed markdown report with all findings and recommendations
6. **Smart Approach** - Fixes what's safe to fix, documents what needs manual review

## Report Sections

The generated report includes:

- **Dependency Status** - Whether node_modules is installed
- **Code Formatting (Auto-Fixed)** - Prettier formatting applied automatically
- **ESLint Issues (Auto-Fixed)** - Auto-fixable linting resolved; remaining issues documented
- **TypeScript Errors (Detailed Analysis)** - File-by-file breakdown with error types, causes, and solutions
- **Build Status (Diagnostic)** - Compilation errors categorized with step-by-step fix instructions
- **Test Results (Failure Analysis)** - Failed tests with error types and debugging recommendations
- **Git Status** - Uncommitted changes tracking
- **Summary** - Overall issue count, auto-fixes applied, and severity assessment

## After Running

1. **Review Auto-Fixes** - Prettier and ESLint have already fixed simple issues
2. **Open Report** - Read `quality-diagnostic-report.md` for detailed analysis
3. **Each Complex Issue Includes:**
   - **Location:** Specific files and line numbers
   - **Cause:** Root cause explanation
   - **Impact:** What problems it causes
   - **Solution Steps:** Detailed, actionable fix instructions
   - **Priority:** Severity level (HIGH/MEDIUM/LOW)
4. **Fix in Order:**
   - Start with HIGH priority issues (TypeScript errors, build failures)
   - Follow the recommended fix order in each section
   - Re-run workflow after fixes to verify progress
5. **Git Commit** - Once satisfied, commit the auto-fixed changes and your manual fixes
