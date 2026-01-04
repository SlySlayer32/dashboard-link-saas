---
goal: Prioritized Improvement Roadmap for Dashboard Link SaaS
version: 1.0
date_created: 2026-01-04
last_updated: 2026-01-04
owner: Development Team
status: 'Planned'
tags: ['roadmap', 'improvement', 'planning', 'prioritization']
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This roadmap provides a **prioritized, actionable plan** to address the issues identified in the repository investigation. The plan is structured into **4 priority tiers** with **estimated timelines** and **clear success criteria**.

Based on the comprehensive investigation, the repository is currently at **60-70% production readiness** with critical blockers preventing builds and lints from succeeding.

---

## 1. Requirements & Constraints

### Business Requirements

- **REQ-001**: Achieve successful builds across all packages (no TypeScript errors)
- **REQ-002**: Pass all linting checks with zero errors
- **REQ-003**: Achieve minimum 80% test coverage for core packages
- **REQ-004**: Complete all 4 plugin adapter implementations
- **REQ-005**: Address all documented security vulnerabilities
- **REQ-006**: Achieve production-ready status within 3-5 weeks
- **REQ-007**: Maintain existing functionality while improving quality
- **REQ-008**: Document all improvements for knowledge transfer

### Technical Constraints

- **CON-001**: Must maintain monorepo structure (Turborepo + pnpm)
- **CON-002**: Must preserve Zapier-style architecture patterns
- **CON-003**: Must maintain backward compatibility with existing data
- **CON-004**: Cannot change core tech stack (React, Hono.js, Supabase)
- **CON-005**: Must work within budget constraints (open-source friendly)
- **CON-006**: Must support existing MobileMessage SMS integration
- **CON-007**: Must maintain multi-tenant RLS implementation

### Quality Standards

- **GUD-001**: All packages must build successfully without errors
- **GUD-002**: All packages must pass ESLint with zero warnings
- **GUD-003**: Zero TypeScript `any` types in production code
- **GUD-004**: Minimum 80% test coverage for services and utilities
- **GUD-005**: All security vulnerabilities addressed
- **GUD-006**: All public methods have JSDoc documentation
- **GUD-007**: All API endpoints have request/response validation
- **GUD-008**: All environment variables validated at startup

---

## 2. Implementation Steps

### Priority 1: Critical Blockers (IMMEDIATE - Days 1-3)

**Goal**: Unblock development by fixing build and lint failures

**Timeline**: 2-3 days  
**Success Criteria**: `pnpm build` and `pnpm lint` succeed with zero errors

| Task      | Description                                              | Owner | Estimated Time | Dependencies |
| --------- | -------------------------------------------------------- | ----- | -------------- | ------------ |
| CRIT-001  | Fix ESLint version conflict (9.39.2 vs 8.57.1)           | Dev   | 2 hours        | None         |
| CRIT-002  | Fix SMS package TypeScript errors (12 errors)            | Dev   | 3 hours        | CRIT-001     |
| CRIT-003  | Test build success across all packages                   | Dev   | 1 hour         | CRIT-002     |
| CRIT-004  | Test lint success across all packages                    | Dev   | 1 hour         | CRIT-001     |
| CRIT-005  | Verify CI/CD workflows pass                              | Dev   | 2 hours        | CRIT-003-004 |

**Subtasks for CRIT-001 (ESLint Fix)**:
- Identify version source conflict
- Update package.json dependencies
- Remove conflicting lockfile entries
- Test lint on all packages
- Document resolution

**Subtasks for CRIT-002 (SMS TypeScript Errors)**:
- Prefix unused variables with `_`
- Add missing `success` property to `SMSBatchResult`
- Fix AWS SNS message attributes type
- Remove unused `SMSDeliveryReport` import
- Fix test file errors
- Run `tsc` to verify

**Deliverables**:
- ✅ All packages build successfully
- ✅ All packages lint successfully
- ✅ CI/CD pipeline green
- ✅ Documentation updated with fixes

---

### Priority 2: Type Safety & Code Quality (URGENT - Days 4-10)

**Goal**: Eliminate `any` types, fix unused variables, improve code quality

**Timeline**: 5-7 days  
**Success Criteria**: Zero `any` types, zero unused variables, consistent error handling

| Task     | Description                                                | Owner | Estimated Time | Dependencies |
| -------- | ---------------------------------------------------------- | ----- | -------------- | ------------ |
| QUAL-001 | Replace all `any` types in auth package (74+ instances)    | Dev   | 8 hours        | CRIT-005     |
| QUAL-002 | Replace all `any` types in other packages (~30 instances)  | Dev   | 6 hours        | CRIT-005     |
| QUAL-003 | Fix unused error variables (50+ instances)                 | Dev   | 4 hours        | CRIT-005     |
| QUAL-004 | Fix unused variable declarations (prefix with `_`)         | Dev   | 3 hours        | CRIT-005     |
| QUAL-005 | Remove unreachable code and unnecessary try/catch          | Dev   | 3 hours        | CRIT-005     |
| QUAL-006 | Enable strict TypeScript compiler options                  | Dev   | 4 hours        | QUAL-001-005 |
| QUAL-007 | Add JSDoc comments to all public methods                   | Dev   | 12 hours       | QUAL-001-005 |
| QUAL-008 | Implement consistent error handling patterns               | Dev   | 6 hours        | QUAL-001-005 |

**Subtasks for QUAL-001 (Auth Package Any Types)**:
- `BaseAuthProvider.ts`: Replace `any` in transformUserToAuthUser
- `SupabaseAuthProvider.ts`: Replace `any` in session transform
- `AuthService.ts`: Replace `any` in validation
- `AuthMiddleware.ts`: Replace all `any` types
- Add proper type guards and assertions
- Test all changes

**Subtasks for QUAL-007 (JSDoc Comments)**:
- Document all service methods
- Document all provider methods
- Document all adapter methods
- Document all utility functions
- Include @param, @returns, @throws tags
- Add usage examples for complex methods

**Deliverables**:
- ✅ Zero `any` types in codebase
- ✅ All variables properly typed or prefixed
- ✅ Consistent error handling
- ✅ JSDoc on all public APIs
- ✅ Stricter TypeScript config

---

### Priority 3: Security & Testing (HIGH - Days 11-21)

**Goal**: Address security vulnerabilities, achieve 80%+ test coverage

**Timeline**: 7-11 days  
**Success Criteria**: All security issues resolved, 80%+ test coverage

| Task     | Description                                                | Owner | Estimated Time | Dependencies |
| -------- | ---------------------------------------------------------- | ----- | -------------- | ------------ |
| SEC-001  | Implement proper password hashing (bcrypt instead of Base64) | Dev  | 4 hours        | QUAL-006     |
| SEC-002  | Remove default secrets, require environment variables      | Dev   | 3 hours        | QUAL-006     |
| SEC-003  | Add input sanitization and XSS protection                  | Dev   | 6 hours        | QUAL-006     |
| SEC-004  | Validate environment variables at startup                  | Dev   | 4 hours        | SEC-002      |
| SEC-005  | Review and test RLS policies                               | Dev   | 6 hours        | QUAL-006     |
| SEC-006  | Security audit of token generation/validation              | Dev   | 4 hours        | SEC-001-005  |
| TEST-001 | Add unit tests for auth package                            | Dev   | 8 hours        | QUAL-006     |
| TEST-002 | Add unit tests for tokens package                          | Dev   | 6 hours        | QUAL-006     |
| TEST-003 | Add unit tests for database package                        | Dev   | 6 hours        | QUAL-006     |
| TEST-004 | Add unit tests for shared package                          | Dev   | 6 hours        | QUAL-006     |
| TEST-005 | Add unit tests for ui package                              | Dev   | 12 hours       | QUAL-006     |
| TEST-006 | Add integration tests for API endpoints                    | Dev   | 12 hours       | TEST-001-005 |
| TEST-007 | Add E2E tests for critical user flows                      | Dev   | 8 hours        | TEST-001-006 |
| TEST-008 | Set up test coverage reporting                             | Dev   | 2 hours        | TEST-001-007 |

**Subtasks for SEC-001 (Password Hashing)**:
- Install bcrypt dependency
- Replace Base64 encoding with bcrypt.hash
- Update password comparison logic
- Add salt rounds configuration
- Test password authentication
- Document password policy

**Subtasks for TEST-001 (Auth Package Tests)**:
- Test user authentication flows
- Test session management
- Test error handling
- Test middleware functions
- Test provider implementations
- Achieve 85%+ coverage

**Deliverables**:
- ✅ All security vulnerabilities fixed
- ✅ 80%+ test coverage achieved
- ✅ Security audit report
- ✅ Test documentation

---

### Priority 4: Feature Completion & Performance (MEDIUM - Days 22-35)

**Goal**: Complete plugin implementations, optimize performance

**Timeline**: 10-14 days  
**Success Criteria**: All 4 plugins working, performance benchmarks met

| Task     | Description                                                | Owner | Estimated Time | Dependencies |
| -------- | ---------------------------------------------------------- | ----- | -------------- | ------------ |
| FEAT-001 | Complete Google Calendar data fetching implementation      | Dev   | 8 hours        | TEST-006     |
| FEAT-002 | Complete Airtable API integration                          | Dev   | 8 hours        | TEST-006     |
| FEAT-003 | Complete Notion API integration                            | Dev   | 8 hours        | TEST-006     |
| FEAT-004 | Implement plugin webhook handlers                          | Dev   | 6 hours        | FEAT-001-003 |
| FEAT-005 | Implement dashboard refresh functionality                  | Dev   | 4 hours        | FEAT-001-003 |
| FEAT-006 | Test all plugins end-to-end                                | Dev   | 6 hours        | FEAT-001-005 |
| PERF-001 | Implement database connection pooling                      | Dev   | 6 hours        | TEST-006     |
| PERF-002 | Add Redis caching layer                                    | Dev   | 8 hours        | PERF-001     |
| PERF-003 | Optimize API queries (prevent N+1)                         | Dev   | 6 hours        | PERF-001     |
| PERF-004 | Implement API rate limiting testing                        | Dev   | 4 hours        | PERF-001     |
| PERF-005 | Optimize frontend bundle size                              | Dev   | 6 hours        | FEAT-006     |
| PERF-006 | Add performance monitoring                                 | Dev   | 4 hours        | PERF-001-005 |

**Subtasks for FEAT-001 (Google Calendar)**:
- Implement OAuth token refresh
- Fetch calendar events from API
- Transform to StandardScheduleItem format
- Handle pagination and limits
- Add error handling
- Write tests

**Subtasks for PERF-001 (Connection Pooling)**:
- Configure PostgreSQL connection pool
- Set pool size based on load testing
- Add connection health checks
- Monitor connection usage
- Document configuration
- Test under load

**Deliverables**:
- ✅ All 4 plugins fully functional
- ✅ Performance benchmarks met
- ✅ Caching layer operational
- ✅ Plugin documentation complete

---

### Priority 5: Documentation & DevOps (LOW - Days 25-35)

**Goal**: Complete documentation, optimize CI/CD, prepare for production

**Timeline**: 8-11 days (parallel with Priority 4)  
**Success Criteria**: Complete docs, optimized CI/CD, deployment guide

| Task     | Description                                                | Owner | Estimated Time | Dependencies |
| -------- | ---------------------------------------------------------- | ----- | -------------- | ------------ |
| DOC-001  | Write comprehensive API documentation                      | Dev   | 12 hours       | FEAT-006     |
| DOC-002  | Write plugin development guide                             | Dev   | 8 hours        | FEAT-006     |
| DOC-003  | Write deployment guide (Vercel, Docker)                    | Dev   | 6 hours        | PERF-006     |
| DOC-004  | Write troubleshooting guide                                | Dev   | 4 hours        | FEAT-006     |
| DOC-005  | Document database schema                                   | Dev   | 4 hours        | None         |
| DOC-006  | Update all outdated documentation                          | Dev   | 4 hours        | FEAT-006     |
| OPS-001  | Optimize CI/CD pipeline                                    | Dev   | 6 hours        | TEST-008     |
| OPS-002  | Add staging environment                                    | Dev   | 8 hours        | DOC-003      |
| OPS-003  | Set up error tracking (Sentry/similar)                     | Dev   | 4 hours        | OPS-002      |
| OPS-004  | Set up monitoring and alerts                               | Dev   | 6 hours        | OPS-002      |
| OPS-005  | Create production deployment checklist                     | Dev   | 2 hours        | DOC-003      |
| OPS-006  | Perform production deployment dry run                      | Dev   | 4 hours        | OPS-001-005  |

**Subtasks for DOC-001 (API Documentation)**:
- Document all endpoints with OpenAPI/Swagger
- Include request/response examples
- Document authentication requirements
- Document error responses
- Add rate limiting information
- Include usage examples

**Subtasks for OPS-001 (CI/CD Optimization)**:
- Add caching for node_modules
- Parallelize test execution
- Add deployment previews for PRs
- Configure automatic rollbacks
- Add deployment notifications
- Document CI/CD pipeline

**Deliverables**:
- ✅ Complete API documentation
- ✅ Plugin development guide
- ✅ Deployment guide
- ✅ Optimized CI/CD
- ✅ Production-ready infrastructure

---

## 3. Alternatives

### Alternative Approaches Considered

- **ALT-001**: Big bang rewrite - Rejected: Too risky, would delay production by months
- **ALT-002**: Outsource improvements - Rejected: Knowledge loss, higher cost
- **ALT-003**: Freeze features, focus only on bugs - Rejected: Incomplete features block MVP
- **ALT-004**: Different priority order (features before quality) - Rejected: Technical debt compounds
- **ALT-005**: Skip testing, ship faster - Rejected: High risk of production failures
- **ALT-006**: Switch frameworks (e.g., Next.js instead of Vite) - Rejected: Not addressing root issues

### Chosen Approach: Incremental Quality Improvements

**Rationale**:
- Addresses blockers first (build/lint)
- Builds quality foundation (types/tests)
- Completes features on solid base
- Minimizes risk of regressions
- Enables continuous deployment
- Maintains team velocity

---

## 4. Dependencies

### External Dependencies

- **DEP-001**: Development team availability (full-time or part-time)
- **DEP-002**: Supabase service availability for testing
- **DEP-003**: MobileMessage SMS credits for integration testing
- **DEP-004**: Google Calendar API access for plugin testing
- **DEP-005**: Airtable API access for plugin testing
- **DEP-006**: Notion API access for plugin testing
- **DEP-007**: Deployment platform (Vercel recommended)

### Internal Dependencies

- **DEP-008**: Access to production-like environment for testing
- **DEP-009**: Sample data for integration testing
- **DEP-010**: Code review process for quality assurance
- **DEP-011**: Documentation approval process

---

## 5. Files

### Files to Modify

**Configuration Files**:
- `package.json` - Fix ESLint version
- `eslint.config.js` - Verify configuration
- `tsconfig.base.json` - Enable strict mode
- Individual package `package.json` files

**Package Files** (High Priority):
- `packages/sms/src/**/*.ts` - Fix build errors
- `packages/auth/src/**/*.ts` - Replace any types
- `packages/tokens/src/**/*.ts` - Fix lint issues
- `packages/shared/src/**/*.ts` - Type improvements

**Security Files**:
- `packages/auth/src/services/AuthService.ts` - Password hashing
- API middleware files - Input sanitization
- Environment configuration files

**Plugin Files**:
- `packages/plugins/src/adapters/GoogleCalendarAdapter.ts`
- `packages/plugins/src/adapters/AirtableAdapter.ts`
- `packages/plugins/src/adapters/NotionAdapter.ts`

**Test Files** (New):
- `packages/auth/src/**/*.test.ts`
- `packages/tokens/src/**/*.test.ts`
- `packages/database/src/**/*.test.ts`
- `apps/api/src/**/*.test.ts`

**Documentation Files**:
- `docs/API.md` - New file
- `docs/PLUGIN_DEVELOPMENT.md` - New file
- `docs/DEPLOYMENT.md` - New file
- `docs/TROUBLESHOOTING.md` - New file

### Files Created by This Roadmap

- `plan/improvement-roadmap.md` - This file
- `plan/findings-report.md` - Investigation results
- `plan/architecture-repository-investigation-1.md` - Investigation plan

---

## 6. Testing

### Test Strategy by Priority

**Priority 1 (Critical Blockers)**:
- Manual testing of build and lint commands
- CI/CD workflow verification
- Smoke tests of applications

**Priority 2 (Type Safety)**:
- TypeScript compiler verification
- ESLint rule validation
- Manual code review

**Priority 3 (Security & Testing)**:
- Unit test execution (80%+ coverage)
- Integration test execution
- Security scanning tools
- Manual security testing

**Priority 4 (Features & Performance)**:
- Plugin integration testing
- Performance benchmarking
- Load testing
- E2E testing

**Priority 5 (Documentation & DevOps)**:
- Documentation review
- Deployment dry runs
- Production readiness checklist

---

## 7. Risks & Assumptions

### Risks

**HIGH RISK**:
- **RISK-001**: Unforeseen breaking changes when fixing TypeScript errors
  - **Mitigation**: Comprehensive testing after each fix
  
- **RISK-002**: Security fixes may require database migrations
  - **Mitigation**: Plan migration strategy upfront

- **RISK-003**: Plugin API changes by external providers
  - **Mitigation**: Version lock dependencies, monitor changelogs

**MEDIUM RISK**:
- **RISK-004**: Test coverage targets may be unrealistic for timeframe
  - **Mitigation**: Prioritize critical path testing
  
- **RISK-005**: Performance optimizations may introduce bugs
  - **Mitigation**: Feature flags, gradual rollout

- **RISK-006**: Documentation may become outdated quickly
  - **Mitigation**: Automate docs generation where possible

**LOW RISK**:
- **RISK-007**: CI/CD optimization may temporarily break pipeline
  - **Mitigation**: Test in separate branch first

- **RISK-008**: Timeline estimates may be off
  - **Mitigation**: Buffer time in estimates, regular progress reviews

### Assumptions

- **ASSUMPTION-001**: Development team has TypeScript and React experience
- **ASSUMPTION-002**: External APIs (Google, Airtable, Notion) remain stable
- **ASSUMPTION-003**: Supabase free tier sufficient for testing
- **ASSUMPTION-004**: MobileMessage credits available for SMS testing
- **ASSUMPTION-005**: No major architectural changes needed
- **ASSUMPTION-006**: Current tech stack choices are sound
- **ASSUMPTION-007**: Team has access to required services
- **ASSUMPTION-008**: Code can be incrementally improved without full rewrite

---

## 8. Related Specifications / Further Reading

### Internal Documents
- [Investigation Plan](./architecture-repository-investigation-1.md)
- [Findings Report](./findings-report.md)
- [Architecture Blueprint](/ARCHITECTURE_BLUEPRINT.md)
- [Current Status](/docs/CURRENT_STATUS.md)
- [Comprehensive Error Report](/COMPREHENSIVE_ERROR_REPORT.md)

### External Resources
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [ESLint Flat Config Migration](https://eslint.org/docs/latest/use/configure/migration-guide)
- [Vitest Coverage](https://vitest.dev/guide/coverage.html)
- [bcrypt for Node.js](https://www.npmjs.com/package/bcrypt)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

## Timeline Summary

### Overall Timeline: 3-5 Weeks

```
Week 1 (Days 1-7):
  Days 1-3:   Priority 1 - Critical Blockers ✅
  Days 4-7:   Priority 2 - Type Safety (partial)

Week 2 (Days 8-14):
  Days 8-10:  Priority 2 - Type Safety (complete) ✅
  Days 11-14: Priority 3 - Security & Testing (partial)

Week 3 (Days 15-21):
  Days 15-21: Priority 3 - Security & Testing (complete) ✅

Week 4 (Days 22-28):
  Days 22-28: Priority 4 - Features & Performance ✅
              Priority 5 - Documentation (start)

Week 5 (Days 29-35):
  Days 29-35: Priority 4 - Features & Performance (complete) ✅
              Priority 5 - Documentation & DevOps (complete) ✅
              Final testing and production deployment 🚀
```

### Milestone Checkpoints

- **End of Week 1**: Builds and lints passing, CI/CD green
- **End of Week 2**: Zero `any` types, JSDoc complete
- **End of Week 3**: 80% test coverage, security issues resolved
- **End of Week 4**: All plugins working, performance optimized
- **End of Week 5**: Documentation complete, production-ready

---

## Success Metrics

### Quantitative Metrics

| Metric | Current | Target | Priority |
|--------|---------|--------|----------|
| Build Success Rate | 40% (sms failing) | 100% | P1 |
| Lint Success Rate | 0% (config error) | 100% | P1 |
| TypeScript `any` Types | 100+ | 0 | P2 |
| Test Coverage | <20% | 80%+ | P3 |
| Security Vulnerabilities | 8 known | 0 | P3 |
| Plugin Completion | 25% (1/4) | 100% (4/4) | P4 |
| Production Readiness | 60-70% | 95%+ | P5 |

### Qualitative Metrics

- **Code Quality**: Consistent patterns, no code smells
- **Documentation**: Complete, accurate, easy to follow
- **Developer Experience**: Fast builds, helpful errors, good tooling
- **Production Stability**: Monitoring, error tracking, rollback capability

---

## Conclusion

This roadmap provides a **clear path from 60% to 95% production readiness** in **3-5 weeks** through **5 priority tiers** addressing:

1. **Critical Blockers** (3 days) - Unblock development
2. **Type Safety** (7 days) - Build quality foundation
3. **Security & Testing** (11 days) - Ensure reliability
4. **Features & Performance** (14 days) - Complete MVP
5. **Documentation & DevOps** (11 days parallel) - Production launch

**Key Success Factors**:
- ✅ Structured, priority-based approach
- ✅ Clear success criteria for each phase
- ✅ Risk mitigation strategies
- ✅ Realistic time estimates with buffer
- ✅ Focus on incremental improvements
- ✅ Emphasis on testing and security
- ✅ Comprehensive documentation

**Next Steps**:
1. Review and approve this roadmap
2. Begin Priority 1 implementation (ESLint + SMS fixes)
3. Set up daily/weekly progress tracking
4. Conduct milestone reviews at end of each week
5. Adjust timeline based on actual progress

**Production Launch Target**: 3-5 weeks from roadmap approval 🚀
