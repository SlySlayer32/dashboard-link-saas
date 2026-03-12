#!/bin/bash
# Development Quality Check Script
# Run this before committing or to validate your changes

set -e

echo "🔍 Running development quality checks..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

# Function to run a check
run_check() {
    local name=$1
    local command=$2
    
    echo -e "${YELLOW}▶ $name${NC}"
    if eval "$command"; then
        echo -e "${GREEN}✓ $name passed${NC}"
        echo ""
    else
        echo -e "${RED}✗ $name failed${NC}"
        echo ""
        FAILURES=$((FAILURES + 1))
    fi
}

# 1. TypeScript Type Checking
run_check "TypeScript Type Check" "pnpm run typecheck"

# 2. ESLint (with auto-fix)
run_check "ESLint Check & Fix" "pnpm run lint:fix"

# 3. Prettier Formatting
run_check "Prettier Format" "pnpm run format"

# 4. Build Check (ensure code compiles)
run_check "Build Verification" "pnpm run build --filter=@dashboard-link/shared"

# 5. Unit Tests (if they exist)
if [ -f "vitest.config.ts" ]; then
    run_check "Unit Tests" "pnpm run test:unit --run"
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Ready to commit.${NC}"
    exit 0
else
    echo -e "${RED}✗ $FAILURES check(s) failed. Please fix before committing.${NC}"
    exit 1
fi
