# CleanConnect Windsurf Rules & Workflows

## Project Overview
**Project**: CleanConnect - Multi-tenant SaaS for workforce management
**Founder**: Non-technical user (vibe coding with Cascade/Windsurf)
**Architecture**: Zapier-style layering with strict separation of concerns

## Core Rules (Non-Negotiable)

### 1. Memory-First Development
- Every session starts by loading project context from memory bank
- Verify memory consistency before starting tasks
- Update memory after completing any task
- Document decisions in activeContext.md

### 2. Architecture Compliance
- **Zapier-style layering is mandatory**:
  - Core services → contracts/types → adapters/connectors → external services
- **Vendor SDK calls ONLY in adapters** under `packages/*/src`
- Apps and core services MUST NOT call vendor SDKs directly
- Enforce tenant scoping by `organizationId` everywhere
- Never trust tenant IDs from the client

### 3. Implementation Standards
- Never leave placeholder comments or incomplete implementations
- Deliver fully functional, tested code
- Use expand/contract DB migrations (append-only)
- Validate inputs with Zod
- Return standard API shape: `{ success: true, data: ... }` or `{ success: false, error: { code, message } }`
- Use stable error codes (no string-matching in clients)

### 4. Development Workflow
- **SpecKit Workflows**: Use `/speckit.*` commands for feature development (specify → plan → tasks → implement → verify → validate)
- **Implementation Discipline**: `/speckit.implement` writes code ONLY - quality verification happens in separate workflows
- **Quality Enforcement**: ALWAYS run `/speckit.verify` after implementation to catch placeholder code, mocks, and constitution violations
- **Deployment Gate**: MUST run `/speckit.validate` and receive PASS before deploying - this is non-negotiable
- Follow `plan/PLAN_INDEX.md` execution order (don't skip prerequisites)
- Read `AGENTS.md` first, then folder-specific `AGENTS.md`
- Check docs/ARCHITECTURE_BLUEPRINT.md for patterns
- Run relevant tests after changes
- Keep changes scoped (no drive-by refactors)

### 5. Safety & Reliability
- External API calls need: retries, backoff, timeouts, circuit breaker
- Side-effects must be idempotent under retries
- Webhook endpoints verify signatures (HMAC)
- Async processing uses queues (BullMQ + Redis)
- Rate limiting on abuse-prone endpoints
- Structured logs + correlation IDs

### 6. Dependencies & Package Management
- Use package manager commands without versions:
  - JavaScript: `pnpm add package-name` (not npm)
  - Let pnpm select compatible versions from pnpm-lock.yaml
  - Never manually edit version numbers in package.json
- Document dependency additions in task log

### 7. Multi-Tenant Isolation
- Every repository query scoped by `organizationId`
- RLS is a backstop, not a substitute
- Derive tenant scope from auth/session/token
- Test data isolation between organizations

### 8. Connector Stability
- Version all connectors (SemVer)
- Support per-org pinning
- Use canary rollouts first
- Implement kill switch for quick disabling
- Contract tests must pass

## Workflow Triggers

### Session Start
1. Check `.windsurf/` directory structure
2. Create missing directories/files
3. Load memory bank from `.windsurf/core/`
4. Verify memory consistency
5. Identify current task from activeContext.md

### Task Start
1. Document objectives in task log
2. Develop success criteria
3. Load relevant context
4. Create implementation plan
5. Map to V1 checklist items

### Task Execution
1. Read files before editing
2. Consult documentation (no guessing)
3. Implement following patterns
4. Test implementation
5. Update documentation

### Error Recovery
1. Document error in `.windsurf/errors/`
2. Check memory for similar errors
3. Apply recovery strategy
4. Update error patterns
5. Escalate if unresolved

### Task Complete
1. Document implementation details
2. Evaluate performance (score 1-10)
3. Update all memory layers
4. Update activeContext.md with next steps

## Communication Style for Non-Technical Founder

### Principles
- Use analogies instead of technical terms
- Focus on business impact and outcomes
- Provide confidence levels and risk assessments
- Celebrate progress and wins
- Explain the "why" in simple terms

### Response Structure
1. **Status Update**: Clear, non-technical progress
2. **What I Did**: Simple explanation of actions
3. **Why It Matters**: Business value
4. **What's Next**: Immediate next steps
5. **Questions**: Any decisions needed

### Risk Management
- Always assess risk level (Low/Medium/High)
- Provide options with pros/cons
- Flag potential issues early
- Suggest mitigation strategies

## Fixed Tech Stack (Do Not Deviate)

### Backend
- **Framework**: Hono
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Async**: BullMQ + Redis

### Frontend
- **Framework**: React 18 + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod

### Packages
- **Monorepo**: pnpm workspaces
- **Shared**: @dashboard-link/shared
- **SMS**: MobileMessage
- **Validation**: Zod

## Quality Gates

### Before Commit
- Code follows project patterns
- Tests pass for modified packages
- Documentation updated
- Memory bank synchronized

### Before Deploy
- **MANDATORY**: `/speckit.validate` PASS status received
- All tests pass
- Security review complete
- Performance benchmarks met
- Rollback plan documented
- No placeholder code (TODO, FIXME, mocks, console.log)
- Constitution compliance verified
- Test coverage targets met (API 90%, React 85%, Utils 95%)

## Emergency Procedures

### Production Issues
1. Check logs in Supabase dashboard
2. Review recent deployments
3. Use kill switch if needed
4. Communicate impact clearly
5. Document post-mortem

### Getting Unstuck
1. Review AGENTS.md for rules
2. Check plan/PLAN_INDEX.md
3. Search docs for patterns
4. Ask for clarification with context
5. Document decision points

## Memory Bank Structure

```
.windsurf/
├── core/                    # Persistent memory
│   ├── project-brief.md     # Project overview
│   ├── product-context.md   # Why we exist
│   ├── system-patterns.md   # Architecture decisions
│   ├── tech-context.md      # Setup & dependencies
│   └── memory-index.md      # File checksums
├── active/
│   └── activeContext.md     # Current work focus
├── plans/                   # Implementation plans
├── errors/                  # Error logs & patterns
└── sessions/                # Session summaries
```

## Success Metrics

### Development Velocity
- Tasks completed per session
- Blocker resolution time
- Code quality score (1-10)

### Project Health
- Test coverage percentage
- Documentation completeness
- Error rate trends
- User feedback integration

## SpecKit Workflow Rules (CRITICAL)

### Workflow Sequence (MUST FOLLOW)
1. `/speckit.specify` - Create feature specification
2. `/speckit.plan` - Generate technical plan
3. `/speckit.tasks` - Generate task breakdown with acceptance criteria
4. `/speckit.implement` - Write all code (no quality checks here)
5. `/speckit.verify` - Verify quality (8 categories, read-only)
6. `/speckit.validate` - Final QA and deployment decision

### Implementation Rules (NON-NEGOTIABLE)
- **NEVER mark tasks [X] without writing actual code**
- **NEVER leave placeholder code** (TODO, FIXME, mocks, commented DB queries)
- **NEVER skip verification** - `/speckit.verify` catches what implement misses
- **NEVER deploy without validation PASS** - `/speckit.validate` is the final gate
- **ALWAYS wire integrations** - services to routes, middleware to app, stores to components
- **ALWAYS use real implementations** - no console.log instead of SMS, no mock auth in production paths

### Quality Verification (ENFORCED)
When `/speckit.verify` finds issues:
1. Fix ALL critical issues immediately
2. Fix high priority issues before proceeding
3. Re-run `/speckit.verify` to confirm fixes
4. Only proceed to `/speckit.validate` when verify passes

### Deployment Gate (ABSOLUTE)
- `/speckit.validate` provides binary PASS/FAIL decision
- **PASS** = Deploy approved, all quality gates met
- **FAIL** = Deployment blocked, must fix issues and re-validate
- **NO exceptions** - if validation fails, code is not production-ready

### Acceptance Criteria (REQUIRED)
All tasks MUST include acceptance criteria:
- File exists at exact path
- All required methods/functions implemented
- No placeholder code (TODO, FIXME, mocks)
- Integration points wired up
- TypeScript strict compliance
- Tests written and passing (if required)

## Reminders

- You're helping a non-technical founder - keep it simple
- Every task should move us closer to V1 launch
- Document decisions for future reference
- When in doubt, ask for clarification
- Progress over perfection
- **Quality over speed** - better to implement fewer tasks correctly than many tasks with placeholders
