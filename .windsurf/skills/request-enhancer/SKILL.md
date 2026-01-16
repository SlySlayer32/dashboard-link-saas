---
name: request-enhancer
description: Automatically rewrites, expands, and enhances user requests using proper linguistics and structured input for optimal vibe coding and SaaS development results
version: 2.0
---

# Request Enhancer Skill v2.0

## Purpose

This skill automatically transforms user requests into well-structured, detailed prompts that follow best practices for vibe coding and SaaS development. It enhances clarity, adds context, and structures requests for optimal AI assistance.

**Key Improvements in v2.0:**
- Integrated with CleanConnect memory bank system
- Enhanced business focus for non-technical founder
- Automatic V1 checklist mapping
- Risk assessment and mitigation strategies
- Progress tracking integration

## Enhancement Process

### 1. Request Analysis
- Identify the core intent and objectives
- Detect implicit requirements and assumptions
- Assess technical complexity and domain
- Identify missing context that would be helpful

### 2. Linguistic Enhancement
- Improve clarity and specificity
- Add proper technical terminology where appropriate
- Structure sentences for unambiguous interpretation
- Ensure professional yet approachable tone

### 3. Structural Improvements
- Add clear objectives and success criteria
- Include relevant context about the project/environment
- Specify constraints and preferences
- Organize into logical sections with clear headings

### 4. Best Practices Integration
- Include relevant architectural considerations
- Add security and performance implications
- Suggest testing strategies
- Reference project-specific standards and patterns

## Enhanced Request Template v2.0

```markdown
## Objective
[Clear, specific statement of what needs to be accomplished]

## Business Context
- **User**: Non-technical founder building CleanConnect SaaS
- **Goal**: [Business outcome this enables]
- **Impact**: [Why this matters for the business]
- **Timeline**: [Urgency level: Immediate/This week/Soon]

## Project Context
- **Project**: CleanConnect - Multi-tenant SaaS for workforce management
- **Tech Stack**: Hono + Supabase + React + TypeScript + pnpm
- **Current Phase**: [Foundation/V1 Build/V2]
- **Recent Progress**: [What was just completed]

## V1 Checklist Mapping
- **Checklist Item**: [Exact item from plan/]
- **Phase Number**: [Current phase from plan/PLAN_INDEX.md]
- **Complexity**: [Simple/Medium/Complex]
- **Estimated Time**: [Time estimate in hours]
- **Dependencies**: [What needs to be done first]

## Requirements
### Must-Haves (Non-negotiable)
- [Critical requirements that must be met]

### Should-Haves (Important)
- [Important features that should be included]

### Could-Haves (Nice to have)
- [Optional features if time permits]

## Technical Constraints
- Must follow Zapier-style layering
- All database queries scoped by organizationId
- No vendor SDK calls outside adapters/
- Use fixed tech stack only
- Validate inputs with Zod

## Risk Assessment
- **Risk Level**: [Low/Medium/High]
- **Potential Issues**: [What could go wrong]
- **Mitigation**: [How we'll prevent problems]
- **Confidence**: [1-10 confidence level]

## Success Criteria
- [Measurable outcomes that indicate success]
- [How to verify the implementation works]
- [What the user should be able to do]

## Testing Strategy
- **Unit Tests**: [What needs unit testing]
- **Integration Tests**: [What needs integration testing]
- **Manual Testing**: [How to manually verify]

## Next Steps
1. [Immediate first action]
2. [What needs to be decided]
3. [What I need from you]
```

## Implementation Guidelines v2.0

When enhancing requests:

1. **Founder-First Communication**: 
   - Use simple, non-technical language
   - Focus on business outcomes
   - Provide confidence levels
   - Celebrate small wins

2. **Memory Integration**: 
   - Check activeContext.md for current work
   - Reference previous decisions
   - Maintain continuity
   - Update memory after completion

3. **Risk-Aware Planning**: 
   - Always assess risk level
   - Provide mitigation strategies
   - Flag potential blockers early
   - Offer backup options

4. **Architecture Compliance**: 
   - Enforce Zapier-style layering
   - Ensure tenant scoping
   - Use fixed tech stack
   - Follow established patterns

5. **Progress Tracking**: 
   - Map to V1 checklist
   - Estimate complexity realistically
   - Track completion percentage
   - Document lessons learned

## Example Transformations

### Before:
"make a user login thing"

### After:
```markdown
## Objective
Implement a secure user authentication system with login and registration functionality for the CleanConnect SaaS platform.

## Context
- Project: CleanConnect - Multi-tenant SaaS for workforce management
- Tech Stack: Hono (backend) + Supabase (database/auth) + React (frontend) + TypeScript
- Current State: Basic project structure exists, Supabase configured
- Business Impact: Critical for user onboarding and data security

## Requirements
### Functional Requirements
- User registration with email verification
- Login with email/password
- Password reset functionality
- Session management with JWT tokens
- Multi-tenant isolation by organizationId

### Technical Requirements
- Use Supabase Auth for authentication
- Implement RLS policies for data isolation
- Secure session handling with httpOnly cookies
- Rate limiting on auth endpoints
- OAuth providers (Google, Microsoft) for enterprise

### Constraints
- Must follow existing authentication patterns in AGENTS.md
- All database queries must be scoped by organizationId
- No vendor SDK calls outside adapters layer

## Success Criteria
- Users can register and verify email
- Login works with correct credentials
- Invalid attempts are properly handled
- Sessions persist correctly across refreshes
- Data isolation between organizations is enforced

## Preferred Approach
- Follow the authentication flow outlined in docs/ARCHITECTURE_BLUEPRINT.md
- Use Zod for input validation
- Implement proper error handling with stable error codes
- Add comprehensive logging for security events

## Testing Strategy
- Unit tests for auth utilities
- Integration tests for login/registration flows
- Security tests for common vulnerabilities
- Test multi-tenant data isolation
```

## Automatic Invocation

**CRITICAL: This skill runs AUTOMATICALLY on EVERY user message before any other processing.**

This skill is triggered:
- On ALL user messages (no exceptions)
- Before any other tool or skill runs
- Even for seemingly simple requests

The only exceptions are:
- Messages starting with `/no-enhance`
- Messages to other agents/skills that explicitly bypass enhancement

## Enhancement Rules for CleanConnect v2.0

### Mandatory Fields to Add:
1. **Business Context**: Why this matters for the founder
2. **Risk Assessment**: Risk level and mitigation strategies
3. **Phase Number**: From plan/PLAN_INDEX.md (not just V1)
4. **Dependencies**: What needs to be done first
5. **Confidence Level**: 1-10 scale for success

### Auto-Correction Logic:
- If request is vague → Enhance with business context
- If request lacks risk → Add risk assessment
- If request jumps ahead → Realign to current phase
- If request is too broad → Break into smaller tasks
- If request lacks testing → Add comprehensive testing strategy
- If request ignores constraints → Add technical constraints section

### Memory Integration:
- Check `.windsurf/active/activeContext.md` for current work
- Reference previous decisions from memory bank
- Maintain continuity across sessions
- Update memory after task completion

### Founder-Friendly Output:
- Use analogies instead of technical terms
- Focus on outcomes and business value
- Provide clear next steps
- Include celebration points for progress

## Notes

- This skill runs before any other processing
- The enhanced request becomes the new prompt for Cascade
- Users can still manually invoke with @request-enhancer
- Enhancements are conservative - when in doubt, keep it simple
- v2.0 includes improved business focus and risk management
- Integrated with memory bank for context continuity
- Designed specifically for non-technical founder workflow

## Version History

- v1.0: Initial implementation with basic enhancement
- v2.0: Added business focus, risk assessment, memory integration, and founder-friendly communication
