#!/bin/bash
# Generate a comprehensive lint report
# Useful for CI/CD or reviewing all issues at once

set +e  # Don't exit on errors, we want to collect all issues

echo "📋 Generating comprehensive lint report..."
echo ""

REPORT_FILE="lint-report.txt"
> $REPORT_FILE  # Clear/create report file

{
    echo "=================================="
    echo "LINT REPORT - $(date)"
    echo "=================================="
    echo ""
    
    echo "1. TYPESCRIPT TYPE ERRORS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    pnpm run typecheck 2>&1 || true
    echo ""
    
    echo "2. ESLINT ISSUES"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    pnpm run lint 2>&1 || true
    echo ""
    
    echo "3. PRETTIER FORMATTING ISSUES"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    pnpm exec prettier --check "**/*.{ts,tsx,js,jsx,json,md}" 2>&1 || true
    echo ""
    
    echo "4. UNUSED DEPENDENCIES"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if command -v depcheck &> /dev/null; then
        pnpm exec depcheck 2>&1 || true
    else
        echo "depcheck not installed (optional)"
    fi
    echo ""
    
    echo "=================================="
    echo "END OF REPORT"
    echo "=================================="
} | tee $REPORT_FILE

echo ""
echo "📄 Full report saved to: $REPORT_FILE"
echo ""
echo "💡 To fix auto-fixable issues, run: pnpm run fix:all"
