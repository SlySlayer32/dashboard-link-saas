# Complete Spec Kit Workflow Guide

**For**: Non-technical founders building SaaS products with AI  
**Goal**: Professional-quality development with clear, repeatable workflows

---

## Quick Reference

### All Available Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/speckit.constitution` | Set maturity level | Once per project, or when upgrading levels |
| `/speckit.specify` | Create feature spec | Start of every feature |
| `/speckit.clarify` | Ask clarification questions | When spec needs refinement |
| `/speckit.plan` | Create technical design | After spec is clear |
| `/speckit.tasks` | Generate task breakdown | After plan is complete |
| `/speckit.analyze` | **Validate everything** | **Before implementation (CRITICAL)** |
| `/speckit.checklist` | Custom validation checklist | Optional quality gate |
| `/speckit.implement` | Execute implementation | After validation passes |
| `/speckit.taskstoissues` | Create GitHub issues | For team collaboration |

---

## Recommended Workflows

### 🚀 Standard Flow (Most Features)

```mermaid
graph LR
    A[/speckit.specify] --> B[/speckit.clarify]
    B --> C[/speckit.plan]
    C --> D[/speckit.tasks]
    D --> E[/speckit.analyze]
    E --> F{Pass?}
    F -->|Yes| G[/speckit.implement]
    F -->|No| H[Fix Issues]
    H --> E
```

**Use for**: 90% of features

**Steps**:
```bash
1. /speckit.specify Build [feature] following our [LEVEL] constitution
2. /speckit.clarify  # AI asks 3-5 questions
3. /speckit.plan Design [feature] per [LEVEL] constitution
4. /speckit.tasks Break down [feature] following [LEVEL] constraints
5. /speckit.analyze  # ⚠️ CRITICAL - Don't skip!
6. /speckit.implement  # Only if step 5 passes
```

---

### ⚡ Express Flow (Simple, Clear Features)

```mermaid
graph LR
    A[/speckit.specify] --> B[/speckit.plan]
    B --> C[/speckit.tasks]
    C --> D[/speckit.implement]
```

**Use for**: Very simple features where specification is crystal clear

**Steps**:
```bash
1. /speckit.specify Build [feature] following our [LEVEL] constitution
2. /speckit.plan Design [feature] per [LEVEL] constitution
3. /speckit.tasks Break down [feature]
4. /speckit.implement
```

**⚠️ Warning**: Skipping `/speckit.analyze` increases risk of:
- Over-engineering beyond maturity level
- Missing constitution constraints
- Contradictions between spec/plan/tasks

**Only use Express Flow if**:
- ✅ You've built 10+ features successfully
- ✅ Feature is extremely simple (< 3 tasks)
- ✅ You're confident in maturity constraints

---

### 🏆 Quality-First Flow (Critical Features)

```mermaid
graph LR
    A[/speckit.specify] --> B[/speckit.clarify]
    B --> C[/speckit.checklist]
    C --> D[/speckit.plan]
    D --> E[/speckit.tasks]
    E --> F[/speckit.analyze]
    F --> G{Pass?}
    G -->|Yes| H[/speckit.implement]
    G -->|No| I[Fix Issues]
    I --> F
```

**Use for**: High-stakes features (authentication, payments, security)

**Steps**:
```bash
1. /speckit.specify Build [feature] following our [LEVEL] constitution
2. /speckit.clarify  # Extra thorough
3. /speckit.checklist Create validation checklist for [feature security/payments/etc]
4. /speckit.plan Design [feature] with comprehensive security/error handling
5. /speckit.tasks Include security tests and edge cases
6. /speckit.analyze  # Validates everything
7. Manual review against checklist from step 3
8. /speckit.implement  # Only after all validations pass
```

---

## Step-by-Step Detailed Guide

### Initial Setup (Once Per Project)

#### Step 1: Choose Your Maturity Level

**Ask yourself**:
- Do I have paying customers? NO → MVP
- Do I have paying customers? YES → How many?
  - <100 → V1
  - 100-500 → V2
  - 500+ with enterprise needs → PRODUCTION

**Decision tree**:
```
Starting new product? → MVP
Have 10+ users willing to pay? → V1
Have 100+ paying customers? → V2
Need enterprise features (SSO)? → PRODUCTION
```

#### Step 2: Set Up Constitution

```bash
# Copy appropriate template
cp .specify/templates/maturity-levels/mvp-constitution.md .specify/memory/constitution.md

# Customize (edit the file)
# - Set PROJECT_NAME
# - Add any project-specific constraints
# - Document any deviations
```

#### Step 3: Initialize with AI

```bash
/speckit.constitution Use MVP maturity level for this project. 
Follow MVP constraints strictly: 1 core feature, basic auth, max 5 tables, free tiers only.
```

---

### Feature Development (Per Feature)

#### Command 1: `/speckit.specify` - Create Feature Specification

**Purpose**: Transform your idea into structured specification

**Input**: Natural language description of what you want to build

**Output**: `specs/###-feature-name/spec.md`

**Example**:

```bash
/speckit.specify Build user authentication following our MVP constitution constraints.

Context: MVP level - focus on CORE feature only

Core Feature: Users need accounts to save their tasks

Scope:
- Email/password signup
- Email/password login  
- Password reset via email
- Session management

Explicitly Excluded (defer to V1):
- NO social login (Google, GitHub)
- NO 2FA/MFA
- NO role-based access
- NO OAuth for third parties

Tech Stack: NextAuth.js + Supabase (per MVP constitution)

Success: User can signup, login, reset password, and sessions persist
```

**What AI Does**:
1. Creates feature branch (e.g., `001-user-auth`)
2. Generates `specs/001-user-auth/spec.md` with:
   - User stories (prioritized P1, P2, P3)
   - Functional requirements (testable)
   - Success criteria (measurable)
   - Key entities (data model outline)

**Maturity Level Impact**:
- **MVP**: AI limits to 1-2 core features max
- **V1**: AI allows 3-5 complete features
- **V2**: AI allows 8-12 features
- **PRODUCTION**: No feature limit

**Red Flags** (AI should warn you):
- ❌ Requesting integrations at MVP level
- ❌ Too many features for maturity level
- ❌ Tech stack doesn't match constitution

---

#### Command 2: `/speckit.clarify` - Reduce Ambiguity

**Purpose**: Ask targeted questions to fill gaps in specification

**Input**: None (works on current spec)

**Output**: Updates `spec.md` with clarifications

**When to Use**:
- ✅ First time building this type of feature
- ✅ Spec has vague areas
- ✅ Multiple interpretations possible

**When to Skip**:
- ❌ Specification is crystal clear
- ❌ You've built this feature before
- ❌ Exploratory spike (throwaway code)

**Example Interaction**:

```bash
/speckit.clarify

AI: "I found 3 areas needing clarification:

1. **Authentication Method**: Should password reset be via email link or code?
   - Email link (more secure, industry standard)
   - 6-digit code (simpler for users)

2. **Session Duration**: How long should sessions last?
   - 1 hour (more secure)
   - 24 hours (better UX)
   - 7 days with 'remember me'

3. **Email Provider**: Which service for password reset emails?
   - Resend (recommended for V1+, $0-20/mo)
   - SendGrid (more features, $15+/mo)
   - Manual SMTP (not recommended)

Please answer each question."
```

**How to Respond**:
```
1. Email link (industry standard)
2. 24 hours (better UX for MVP validation)
3. We'll handle manually for MVP (no email service yet)
```

**What AI Does**:
- Updates `spec.md` with your answers
- Removes [NEEDS CLARIFICATION] markers
- Adds assumptions section documenting decisions

---

#### Command 3: `/speckit.plan` - Create Technical Design

**Purpose**: Transform spec into technical architecture and design

**Input**: Completed `spec.md`

**Output**: 
- `plan.md` - Implementation plan
- `research.md` - Technology research and decisions
- `data-model.md` - Database schema design
- `contracts/` - API endpoint definitions
- `quickstart.md` - How to run the feature

**Example**:

```bash
/speckit.plan Design user authentication per MVP constitution:
- Max 3 database tables
- Use Supabase Auth (NextAuth.js)
- NO automated tests (manual testing for MVP)
- Deploy to Vercel free tier
```

**What AI Does**:

**Phase 0 - Research**:
- Researches best practices for authentication
- Evaluates NextAuth.js vs Supabase Auth
- Documents decision rationale in `research.md`

**Phase 1 - Design**:
- Creates data model (`data-model.md`):
  ```
  users table:
    - id (uuid, primary key)
    - email (text, unique)
    - password_hash (text)
    - created_at (timestamp)
    - updated_at (timestamp)
  
  sessions table (handled by NextAuth):
    - session_token
    - user_id
    - expires
  ```

- Defines API contracts (`contracts/auth-api.md`):
  ```
  POST /api/auth/signup
  POST /api/auth/login
  POST /api/auth/reset-password
  GET /api/auth/session
  ```

- Creates quickstart guide (`quickstart.md`)

**Constitution Check**:
AI validates:
- ✅ Table count: 2 tables (under MVP limit of 5)
- ✅ Tech stack: NextAuth.js matches MVP constitution
- ✅ No advanced features: No SSO, no 2FA (correct for MVP)
- ✅ Testing: Manual only (MVP allows this)

**Maturity Level Impact**:
- **MVP**: Simple architecture, free tier services, manual processes OK
- **V1**: Professional architecture, paid services, testing infrastructure
- **V2**: Scalable architecture, caching layers, performance optimization
- **PRODUCTION**: Enterprise architecture, multi-region, compliance docs

---

#### Command 4: `/speckit.tasks` - Generate Task Breakdown

**Purpose**: Break implementation plan into actionable tasks

**Input**: Completed `plan.md`

**Output**: `tasks.md` with dependency-ordered tasks

**Example**:

```bash
/speckit.tasks Break down auth implementation following MVP constraints.
Skip test tasks. Focus on core implementation only.
```

**What AI Does**:

Generates `tasks.md`:

```markdown
## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Create project structure
- [ ] T002 [P] Initialize Next.js with TypeScript
- [ ] T003 [P] Install NextAuth.js dependencies

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T004 Setup Supabase database connection
- [ ] T005 Create users table migration
- [ ] T006 Configure NextAuth.js providers

## Phase 3: User Story 1 - User Signup (P1)

- [ ] T007 [P] Create signup API endpoint
- [ ] T008 [P] Create signup UI component
- [ ] T009 Add email validation
- [ ] T010 Add password strength validation

## Phase 4: User Story 2 - User Login (P1)

- [ ] T011 [P] Create login API endpoint
- [ ] T012 [P] Create login UI component
- [ ] T013 Add session management

## Phase 5: User Story 3 - Password Reset (P2)

- [ ] T014 Create password reset request endpoint
- [ ] T015 Create password reset UI
- [ ] T016 Add password reset flow (manual email for MVP)
```

**Task Format**:
- `[P]` = Can run in parallel (different files, no dependencies)
- `[US1]` = Belongs to User Story 1
- Exact file paths included in descriptions

**Maturity Level Impact**:
- **MVP**: No test tasks, simple implementation, manual processes
- **V1**: Test tasks included, comprehensive error handling
- **V2**: Performance optimization tasks, caching setup, monitoring
- **PRODUCTION**: Security hardening tasks, compliance tasks, audit logging

---

#### Command 5: `/speckit.analyze` - **CRITICAL VALIDATION GATE**

**Purpose**: Validate EVERYTHING before you write code

**Input**: Completed spec.md, plan.md, tasks.md

**Output**: Validation report with issues found

**⚠️ THIS IS YOUR SAFETY NET - DON'T SKIP IT!**

**Example**:

```bash
/speckit.analyze
```

**What AI Validates**:

✅ **Cross-Artifact Consistency**:
- All spec requirements have corresponding tasks
- All plan entities appear in spec
- No contradictions between documents

✅ **Constitution Compliance** (CRITICAL):
- Tech stack matches constitution
- Database table count within limits
- No forbidden features for maturity level

✅ **Maturity Level Constraints**:
- Feature count matches maturity level
- Testing requirements match maturity level
- Integration points appropriate for maturity level

✅ **Completeness**:
- No [NEEDS CLARIFICATION] markers remaining
- All user stories have acceptance criteria
- All entities have defined fields

**Example Output**:

```markdown
# Analysis Report: user-auth

## Summary
- ✅ PASSED: Cross-artifact consistency
- ✅ PASSED: Constitution compliance  
- ⚠️ WARNING: 1 minor issue found
- ❌ CRITICAL: 0 issues found

## Findings

### ⚠️ WARNING-001: Missing Edge Case
**Severity**: WARNING
**Location**: spec.md - User Stories
**Issue**: No handling for "user forgets email address" scenario
**Impact**: Users may get stuck if they forget which email they used
**Recommendation**: Add "email lookup by name" or document as out of scope

### ✅ Constitution Compliance: PASSED
- Database tables: 2 (limit: 5) ✅
- Tech stack: NextAuth.js (matches constitution) ✅
- Features: 3 (limit: 1-2 for MVP) ⚠️ Slightly over but justified
- Testing: Manual only (allowed for MVP) ✅

### ✅ Maturity Level Validation: PASSED
- Current Level: MVP
- Feature count: 3 (signup, login, reset) - acceptable for auth
- No integrations: ✅
- No team features: ✅
- No advanced features: ✅

## Recommendation
✅ **PROCEED TO IMPLEMENTATION**

Minor warning can be addressed later. All critical validations pass.
```

**If CRITICAL Issues Found**:

```markdown
## ❌ CRITICAL-001: Maturity Level Violation
**Severity**: CRITICAL
**Location**: spec.md - User Stories
**Issue**: Spec includes "SSO with Okta" but maturity level is V1
**Impact**: SSO is a PRODUCTION feature, not available until PRODUCTION level
**Recommendation**: 
1. Remove SSO from spec (defer to PRODUCTION roadmap)
2. OR upgrade to PRODUCTION maturity level first
3. OR document as deviation with business justification

## Recommendation
❌ **DO NOT PROCEED TO IMPLEMENTATION**
Fix critical issues and re-run /speckit.analyze
```

**Action Required**:
- Fix CRITICAL issues
- Consider WARNING issues
- Re-run `/speckit.analyze`
- Only proceed to `/speckit.implement` when report shows ✅ PASSED

---

#### Command 6: `/speckit.implement` - Execute Implementation

**Purpose**: Execute all tasks from tasks.md

**Input**: Validated tasks.md

**Output**: Working code implementation

**⚠️ Only run AFTER `/speckit.analyze` passes!**

**Example**:

```bash
/speckit.implement Build authentication system per MVP constitution and tasks.md
```

**What AI Does**:
1. Reads `tasks.md`
2. Executes tasks in dependency order
3. Writes code following patterns from constitution
4. Tests manually (or runs automated tests for V1+)
5. Reports progress

**Maturity Level Impact**:
- **MVP**: Quick implementation, basic error handling, manual testing
- **V1**: Professional implementation, comprehensive error handling, automated tests
- **V2**: Optimized implementation, caching, performance tuning
- **PRODUCTION**: Enterprise implementation, security hardening, compliance

---

### Optional Commands

#### `/speckit.checklist` - Custom Validation Checklist

**When to Use**: High-stakes features needing extra validation

**Example**:

```bash
/speckit.checklist Create security checklist for authentication feature
```

**Output**: Custom checklist based on feature type

```markdown
# Security Checklist: Authentication

## Password Security
- [ ] Passwords hashed with bcrypt/argon2
- [ ] Minimum password length enforced (8+ chars)
- [ ] Password complexity requirements
- [ ] No password stored in plain text
- [ ] No password logged

## Session Security  
- [ ] Sessions use secure, httpOnly cookies
- [ ] CSRF protection enabled
- [ ] Session timeout configured
- [ ] Logout clears all session data

## Input Validation
- [ ] Email format validated
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] Rate limiting on auth endpoints

## Error Handling
- [ ] Generic error messages (no user enumeration)
- [ ] Failed login attempts logged
- [ ] Account lockout after N failed attempts
```

#### `/speckit.taskstoissues` - Create GitHub Issues

**When to Use**: Working with a team, want GitHub project management

**Example**:

```bash
/speckit.taskstoissues
```

**What AI Does**:
- Converts each task from `tasks.md` to GitHub issue
- Preserves dependencies
- Adds labels (priority, maturity level)
- Links related issues

---

## Validation Gates (Quality Checkpoints)

### Gate 1: After Specification

**Checkpoint**: Is the spec clear enough?

**Tool**: `/speckit.clarify`

**Pass Criteria**:
- No [NEEDS CLARIFICATION] markers
- User stories are concrete
- Requirements are testable

**If Fails**: Run `/speckit.clarify` again

---

### Gate 2: After Planning

**Checkpoint**: Is the design complete and constitutional?

**Tool**: Manual review + constitution check

**Pass Criteria**:
- ✅ All spec requirements addressed in plan
- ✅ Tech stack matches constitution
- ✅ Database design is sound
- ✅ API contracts are defined

**If Fails**: Update `plan.md` or `research.md`

---

### Gate 3: Before Implementation (CRITICAL)

**Checkpoint**: Is everything validated and ready?

**Tool**: `/speckit.analyze` ⭐⭐⭐

**Pass Criteria**:
- ✅ Zero CRITICAL issues
- ✅ Constitution compliance verified
- ✅ Maturity level constraints met
- ✅ All documents consistent

**If Fails**: 
1. Fix issues identified
2. Re-run `/speckit.analyze`
3. Repeat until passing

**DO NOT SKIP THIS GATE!**

---

## Troubleshooting

### Problem: AI Suggests Features Outside My Maturity Level

**Example**: You're at MVP, AI suggests Zapier integration

**Solution**:
```bash
"That feature is V2, not MVP. Follow MVP constitution strictly. 
Skip integrations and focus on core functionality only."
```

### Problem: Spec is Too Vague

**Solution**: Run `/speckit.clarify` - it will ask targeted questions

### Problem: Not Sure If Ready to Implement

**Solution**: Run `/speckit.analyze` - it validates everything

### Problem: Want Extra Confidence

**Solution**: Use Quality-First Flow with `/speckit.checklist`

### Problem: AI Over-Engineers

**Solution**: Reference maturity level in EVERY command:
```bash
/speckit.specify Build [feature] following our MVP constitution constraints
/speckit.plan Design [feature] per MVP constitution (max 5 tables, basic implementation)
```

---

## Best Practices

### ✅ Do This

1. **Always reference maturity level** in commands
2. **Run `/speckit.analyze`** before implementing
3. **Start with MVP**, upgrade later
4. **One feature at a time** (don't batch)
5. **Follow standard flow** until experienced

### ❌ Avoid This

1. **Don't skip validation** (`/speckit.analyze`)
2. **Don't mix maturity levels** (MVP auth + V2 analytics = confusion)
3. **Don't ignore warnings** from AI about maturity
4. **Don't over-specify** at MVP (keep it simple)
5. **Don't skip clarification** for complex features

---

## Quick Command Reference

```bash
# Setup (once)
cp .specify/templates/maturity-levels/mvp-constitution.md .specify/memory/constitution.md
/speckit.constitution Use MVP maturity level

# Every feature (standard flow)
/speckit.specify Build [feature] following our MVP constitution
/speckit.clarify
/speckit.plan Design [feature] per MVP constitution
/speckit.tasks Following MVP constraints
/speckit.analyze  # ⚠️ CRITICAL - Don't skip!
/speckit.implement  # Only if validation passes

# Optional
/speckit.checklist [type] checklist
/speckit.taskstoissues
```

---

## Success Metrics

**You're using workflows correctly if**:
- ✅ Every feature has spec → plan → tasks
- ✅ You run `/speckit.analyze` before implementing
- ✅ Maturity constraints are respected
- ✅ Features work first time (no major refactors)

**You need to improve if**:
- ❌ Skipping validation steps
- ❌ Features exceed maturity level
- ❌ Frequent contradictions between spec/plan/tasks
- ❌ Major refactors needed after implementation

---

## Next Steps

1. **Read this guide** completely (you're doing it now!)
2. **Set up constitution** for your project
3. **Build one feature** using standard flow
4. **Review `/speckit.analyze` report** carefully
5. **Iterate and improve** your workflow

**Remember**: These workflows are your virtual technical co-founder. Trust the process, reference your maturity level, and validate before implementing. You'll build professional-quality software! 🚀
