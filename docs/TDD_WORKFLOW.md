# CleanConnect TDD Workflow Guide
# Test-Driven Development for Non-Technical Founder

## 🎯 MANDATORY TDD WORKFLOW
ALWAYS follow this exact order for every feature:

### STEP 1: CREATE TEST FILE
- Create test file first: `*.test.ts` or `*.test.tsx`
- Place test file in `__tests__/` directory or same directory as implementation
- Test file MUST exist before any implementation code

### STEP 2: WRITE FAILING TESTS
- Write tests that describe WHAT the feature should do
- Tests must FAIL initially (Red phase)
- Include tests for:
  - Happy path (success case)
  - Error cases (invalid input, network errors)
  - Edge cases (empty data, boundary values)

### STEP 3: RUN TESTS TO CONFIRM FAILURE
- Run `pnpm test` to verify tests fail
- See error messages - this guides implementation
- NO implementation code until tests fail

### STEP 4: IMPLEMENT CODE
- Write MINIMUM code to make tests pass
- Focus only on passing tests, no extra features
- Keep implementation simple and readable

### STEP 5: RUN TESTS TO CONFIRM PASSING
- Run `pnpm test` to verify all tests pass
- If tests fail, return to Step 4
- Once green, refactor if needed

## 📋 TEST STRUCTURE TEMPLATES

### Component Test Template
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ComponentName } from './ComponentName'

describe('ComponentName', () => {
  it('should render', () => {
    render(<ComponentName />)
    expect(screen.getByText('expected text')).toBeInTheDocument()
  })
  
  it('should handle user interaction', () => {
    // Test user behavior
  })
})
```

### Utility Function Test Template
```typescript
import { describe, it, expect } from 'vitest'
import { functionName } from './functionName'

describe('functionName', () => {
  it('should return correct result for valid input', () => {
    expect(functionName('input')).toBe('expected output')
  })
  
  it('should handle edge cases', () => {
    expect(() => functionName(null)).toThrow()
  })
})
```

## 🚨 NEVER DO THESE
- ❌ Write implementation code before tests
- ❌ Skip tests because "it's simple"
- ❌ Write tests that always pass (false positives)
- ❌ Mock everything - test real behavior
- ❌ Use console.log for testing - use assertions

## ✅ ALWAYS DO THESE
- ✅ Write descriptive test names
- ✅ Test business requirements, not implementation details
- ✅ Keep tests small and focused
- ✅ Run tests after every change
- ✅ Explain test failures in simple terms

## 💬 COMMUNICATION RULES
When presenting test results:
1. Show the failing test (Red)
2. Explain what the test expects
3. Show implementation that fixes it
4. Show passing test (Green)
5. Explain what was built in simple terms

## 🎁 VALUE ADDS
After tests pass, always add:
1. Type safety improvements
2. Error handling
3. Performance optimizations
4. Documentation
5. Better error messages

## 📝 PROMPT TEMPLATES FOR AI

### When requesting a new feature:
```
Please implement [feature name] using TDD workflow:
1. First create failing tests for [specific requirements]
2. Show me the test failures
3. Then implement the code to make tests pass
4. Confirm all tests pass
```

### When fixing a bug:
```
Please fix [bug description] using TDD:
1. Write a test that reproduces the bug
2. Show the failing test
3. Fix the implementation
4. Show the test now passes
```

## 🛠️ SETUP INSTRUCTIONS

To add Vitest to your project:
```bash
# Install Vitest and testing utilities
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Add to vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts']
  }
})
```

Remember: Tests are your safety net. They ensure features work as expected and prevent future breaks.
