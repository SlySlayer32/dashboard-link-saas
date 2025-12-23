# Pull Request Checklist

## Before Creating PR
- [ ] Code has been tested locally
- [ ] All tests pass (`pnpm test`)
- [ ] Linting passes with 0 errors (`pnpm lint`)
- [ ] TypeScript compiles without errors (`pnpm build`)
- [ ] Code follows existing patterns and conventions

## Code Quality Requirements
- [ ] No `any` types used (use `Record<string, unknown>` instead)
- [ ] No `@ts-ignore` comments
- [ ] No console statements in production code
- [ ] All imports are used
- [ ] No unused variables (unless prefixed with `_`)
- [ ] No undefined variables - all must be declared
- [ ] All React components import React
- [ ] Parsing errors are fixed

## Architecture & Patterns
- [ ] Shared types/schemas imported from `@dashboard-link/shared`
- [ ] API responses follow `ApiResponse<T>` format
- [ ] Error boundaries implemented where needed
- [ ] Loading states for all async operations
- [ ] Proper authentication flow (API tokens, not direct Supabase)
- [ ] Zod schemas used for validation
- [ ] TanStack Query hooks used for data fetching

## Testing
- [ ] Unit tests for utility functions
- [ ] Integration tests for API endpoints
- [ ] Component tests for UI components
- [ ] Test coverage > 80%
- [ ] Tests use realistic data, not mocks

## Documentation
- [ ] JSDoc comments for complex functions
- [ ] API endpoints documented
- [ ] Component props documented
- [ ] README updated if needed
- [ ] Changes reflected in relevant documentation

## Security
- [ ] Input validation implemented
- [ ] No sensitive data in client code
- [ ] Rate limiting considered for new endpoints
- [ ] SQL injection protection verified
- [ ] XSS prevention checked

## Performance
- [ ] No unnecessary re-renders
- [ ] Proper key props in lists
- [ ] Images optimized
- [ ] Bundle size considered
- [ ] Database queries optimized

## Review Process
- [ ] Self-review completed
- [ ] PR description clearly explains changes
- [ ] Screenshots provided for UI changes
- [ ] Breaking changes documented
- [ ] Migration steps provided if needed

## Deployment
- [ ] Environment variables documented
- [ ] Database migrations included
- [ ] Deployment steps verified
- [ ] Rollback plan considered

## Post-Merge
- [ ] Delete feature branch
- [ ] Update project documentation
- [ ] Communicate changes to team
- [ ] Monitor for issues

## Notes
- Pre-commit hooks will block commits on ESLint errors
- All PRs require at least one approval
- PRs must pass all automated checks
- Use semantic commit messages
- Keep PRs focused and reasonably sized
