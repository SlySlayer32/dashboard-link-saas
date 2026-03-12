# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Fixed unnecessary escape character in `SMSValidationService.ts` regex pattern (ESLint error)
- Added missing `typecheck` task to turbo.json configuration

### Added
- Quality check workflow documentation in `docs/DEVELOPMENT.md`
- Automated quality diagnostic report generation via `/dev-quality-check` workflow
- `quality-diagnostic-report.md` for tracking code quality issues and fixes

### Documentation
- Enhanced DEVELOPMENT.md with quality check workflow instructions
- Added comprehensive guide for using automated quality checks
- Documented auto-fix capabilities and manual intervention requirements

### Known Issues
- 72 TypeScript type errors in `@dashboard-link/api` package (blocking)
  - Missing `msw` dev dependency for test mocks
  - Supabase type inference issues in token services
  - Hono AppContext type mismatches
  - Deprecated `token.service.old.ts` file with 19 errors
- 86 ESLint warnings across packages (non-blocking)
  - 62 warnings in `@dashboard-link/plugins` (no-explicit-any)
  - 23 warnings in `@dashboard-link/auth` (no-explicit-any, no-unreachable, no-useless-catch)
  - 1 warning in `@dashboard-link/sms` (no-explicit-any)

### Next Steps
1. Install missing dependency: `pnpm add -D msw`
2. Regenerate Supabase types: `pnpm supabase gen types typescript`
3. Remove or fix deprecated file: `apps/api/src/services/token.service.old.ts`
4. Fix Hono AppContext type configuration in `apps/api/src/v1.ts`
5. Address ESLint warnings by replacing `any` types with proper type definitions

---

## Previous Changes

See git history for changes prior to this changelog.
