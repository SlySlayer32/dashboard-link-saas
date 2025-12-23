# Dev Rules Update Summary

## Overview
The `.windsurf/rules/dev-rules.md` file has been completely transformed from a rule-based format to a comprehensive AI assistant context guide. This change provides AI assistants with complete project context to understand the codebase architecture, patterns, and conventions.

## Key Changes

### 1. Format Transformation
- **Before**: Rule-based format with XML-like tags (`<system_constraints>`, `<authority>`, etc.)
- **After**: Comprehensive markdown documentation with clear sections and subsections

### 2. New Documentation Sections Added

#### Project Foundation
- Tech stack details (Vite, React 18, TypeScript, Hono.js, Supabase, Tailwind CSS)
- State management patterns (Zustand for auth, TanStack Query for data)
- Monorepo structure with Turborepo + pnpm workspaces
- Port assignments for each app
- Key development commands

#### Architecture & Patterns
- Application roles (Admin, Worker, API)
- Authentication flows for different user types
- Multi-tenancy patterns with organization isolation
- Data fetching patterns using TanStack Query

#### Code Standards & Conventions
- File naming conventions for all file types
- TypeScript rules and best practices
- Prettier configuration
- Linting rules and requirements

#### UI/UX Patterns
- React component structure template
- Tailwind CSS usage guidelines
- Form patterns with react-hook-form and Zod
- Mobile-first responsive design principles

#### Business Logic & Domain
- Plugin system architecture
- SMS integration details (MobileMessage.com.au)
- Token system implementation
- Phone number formatting rules

#### Database & API Patterns
- Supabase client usage patterns
- API response format standardization
- Pagination implementation
- Database change procedures

#### Development Environment
- Environment variable setup
- Development workflow steps
- Port assignments
- Build processes

#### Performance & Optimization
- Query optimization strategies
- Bundle size optimization
- Mobile optimization for worker app
- Caching strategies

#### Testing Strategy
- Unit test examples with Vitest
- Integration test guidelines
- Smoke test checklist
- Mocking policies

#### Critical Constraints & Gotchas
- Security requirements
- Phone number rules
- Known limitations
- Common pitfalls to avoid

#### Deployment & Production
- Environment checklist
- Build process
- Monitoring requirements

#### Quick Reference Card
- Feature development checklist
- Debugging steps
- How to ask for AI help effectively

## Statistics
- **Total lines changed**: 717
- **Insertions**: 389
- **Deletions**: 328
- **Net change**: +61 lines

## Benefits
1. **Better AI Assistance**: AI assistants now have complete context about the project
2. **Improved Onboarding**: New developers can quickly understand the project structure
3. **Consistent Patterns**: Clear documentation of expected patterns and conventions
4. **Reduced Ambiguity**: Detailed examples and guidelines reduce guesswork
5. **Faster Development**: Quick reference sections speed up common tasks

## Migration Notes
- All previous rules have been preserved and integrated into the new format
- The document maintains all critical constraints and forbidden patterns
- The trigger directive (`trigger: always_on`) has been preserved
- Authority and system constraints are now documented in the introduction

## Next Steps
1. Update any references to the old rule-based format
2. Consider creating additional workflow files for common tasks
3. Review and update the quick reference card based on team feedback
4. Ensure all AI assistants are aware of the new documentation format
