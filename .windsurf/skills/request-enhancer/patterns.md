# Request Enhancement Patterns

This file contains common patterns and templates used by the request-enhancer skill to improve user requests.

## Common Request Types & Enhancements

### 1. Feature Implementation
**Indicators**: "add", "implement", "create", "build"

**Enhancement Pattern**:
- Add user story format
- Include acceptance criteria
- Specify UI/UX requirements
- Add data model implications
- Include API endpoint design

### 2. Bug Fixes
**Indicators**: "fix", "broken", "not working", "error"

**Enhancement Pattern**:
- Request error logs and reproduction steps
- Ask for affected components
- Include regression testing requirements
- Specify root cause analysis needs

### 3. Refactoring
**Indicators**: "improve", "refactor", "optimize", "clean up"

**Enhancement Pattern**:
- Define performance metrics
- Specify backward compatibility requirements
- Include migration strategy
- Add testing approach for refactored code

### 4. Integration Tasks
**Indicators**: "connect", "integrate", "sync", "api"

**Enhancement Pattern**:
- Specify data flow direction
- Include error handling strategy
- Add retry and fallback mechanisms
- Define monitoring requirements

### 5. Database Changes
**Indicators**: "database", "schema", "migration", "data"

**Enhancement Pattern**:
- Follow expand/contract pattern
- Include rollback strategy
- Specify data validation
- Add performance impact assessment

## Project-Specific Context

### CleanConnect Architecture
- Multi-tenant SaaS with organization-based isolation
- Zapier-style layering: core services → contracts → adapters → external
- Supabase for backend services
- React + TypeScript for frontend
- BullMQ + Redis for async processing

### V1 Implementation Focus
- Current scope: Google Calendar + SMS sync (thin V1 slice)
- Always reference `docs/V1_IMPLEMENTATION_CHECKLIST.md`
- Work in Phase order: 0 (Setup) → 1 (V1 Build)
- Keep scope minimal - reduce features instead of expanding

### Key Patterns to Reference
- All queries must be scoped by organizationId
- Vendor SDK calls only in adapters
- Use Zod for validation
- Return { success, data, error } response format
- Implement retries with backoff for external calls

### Common Files to Reference
- `AGENTS.md` - Development rules and patterns
- `docs/V1_IMPLEMENTATION_CHECKLIST.md` - Current V1 tasks
- `docs/ARCHITECTURE_BLUEPRINT.md` - Architecture decisions
- `plan/PLAN_INDEX.md` - Execution order and plans
- Package-specific AGENTS.md files

### MUST-DOS for Every Request
1. **Map to Checklist**: Identify which V1 checklist item this addresses
2. **Check Phase**: Ensure work matches current phase (0 or 1)
3. **Scope Check**: Keep within V1 thin slice (Calendar + SMS)
4. **Multi-tenant**: Always consider organization isolation
5. **Test First**: Include testing approach in every request

## Enhancement Templates

### Vague to Specific
```
Vague: "make it better"
Specific: "Optimize the API response time for the worker list endpoint from 2s to under 500ms"
```

### Missing Context
```
Missing: "add webhook handler"
With Context: "Add a webhook handler for Connecteam that processes worker updates and stores them in the database with proper organization isolation"
```

### Unclear Success
```
Unclear: "fix auth"
Clear Success: "Implement authentication that prevents cross-organization data access and passes all OWASP security tests"
```

## Tone and Style Guidelines

1. **Professional but approachable** - Avoid overly formal language
2. **Action-oriented** - Start with clear verbs
3. **Specific and measurable** - Include numbers and concrete criteria
4. **Context-aware** - Reference existing patterns and decisions
5. **Business-focused** - Connect technical tasks to business value

## Anti-Patterns to Avoid

1. **Don't over-engineer** - Keep enhancements proportional to the task
2. **Don't change intent** - Only improve expression, not goals
3. **Don't add requirements** - Unless they're clearly implied
4. **Don't assume expertise** - Explain technical concepts simply
5. **Don't be prescriptive** - Offer options, not mandates
