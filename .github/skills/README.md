# GitHub Copilot Skills for Dashboard Link SaaS

Comprehensive skill system for GitHub Copilot workspace agent to act as a lead developer for Dashboard Link SaaS.

## 🎯 Overview

These skills transform GitHub Copilot into an intelligent lead developer that understands:
- Dashboard Link SaaS architecture (Zapier-style patterns)
- Code quality standards and best practices
- Development workflows and next steps
- Naming conventions across the stack
- Systematic error fixing

Perfect for **non-technical founders** using vibe coding with AI models.

## 📦 Available Skills

### 1. Code Quality Reviewer (`code-quality-reviewer`)
**Triggers**: "find missing logic", "review code quality", "check for issues", "ensure quality", "validate code"

Performs systematic code reviews checking for:
- Missing error handling
- Missing loading states
- Security vulnerabilities
- TypeScript quality
- React patterns
- Architecture adherence

**Includes**:
- Comprehensive review checklist
- Common antipatterns guide
- Step-by-step review process

### 2. Architecture Guide (`architecture-guide`)
**Triggers**: "follow the architecture", "use proper patterns", "implement like Zapier", "add a new plugin"

Guides implementation of Zapier-style architecture:
- Service → Contract → Adapter → External API pattern
- Plugin adapter system
- Organization isolation (RLS)
- Multi-tenancy patterns

**Includes**:
- Complete adapter template
- Step-by-step implementation guide
- Example code for all patterns

### 3. Next Steps Planner (`next-steps-planner`)
**Triggers**: "what next?", "what should I do now?", "what's the next step?"

Intelligent planning for development lifecycle:
- Post-completion checklists
- Feature development workflow
- Bug fixing workflow
- Sprint planning guidance
- Priority decision trees

**Includes**:
- Verification checklists
- Priority matrix
- Common scenario workflows

### 4. Naming Conventions (`naming-conventions`)
**Triggers**: "proper naming", "what should I call this?", "naming standards", "PascalCase vs camelCase"

Complete naming standards reference:
- File naming (Components, Pages, Hooks, Services, etc.)
- Code naming (Variables, Functions, Classes, Types)
- Database naming (Tables, Columns, Foreign Keys)
- API naming (Endpoints, Routes)
- Package naming

**Includes**:
- Quick reference table
- Common mistakes guide
- Real examples from codebase

### 5. Error Fixer (`error-fixer`)
**Triggers**: "fix all errors", "resolve errors", "fix the build", "make it work", "troubleshoot"

Systematic error fixing workflow:
- TypeScript compilation errors
- Lint errors
- Build failures
- Test failures
- Runtime errors

**Includes**:
- Common error types & fixes
- Debugging workflow
- Error prevention strategies

## 🚀 Usage

### For Users

Skills are automatically loaded and activated by GitHub Copilot workspace agent based on your prompts. Just use natural language!

**Examples**:
```
"Find any missing logic in the worker service"
→ Activates: code-quality-reviewer

"Add support for Airtable plugin"
→ Activates: architecture-guide

"What should I do now that the feature is complete?"
→ Activates: next-steps-planner

"What's the right way to name this component file?"
→ Activates: naming-conventions

"Fix all the TypeScript errors"
→ Activates: error-fixer
```

### For Developers

#### Creating New Skills

```bash
# Initialize a new skill
python3 scripts/init_skill.py my-new-skill

# Edit the skill
# - Update .github/skills/my-new-skill/SKILL.md
# - Add references to .github/skills/my-new-skill/references/
# - Add scripts to .github/skills/my-new-skill/scripts/
# - Add assets to .github/skills/my-new-skill/assets/

# Package the skill
python3 scripts/package_skill.py .github/skills/my-new-skill
```

#### Skill Structure

```
.github/skills/my-skill/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description)
│   └── Markdown body (instructions)
├── scripts/
│   └── automation scripts (Python, Bash, etc.)
├── references/
│   └── detailed documentation loaded as needed
└── assets/
    └── templates and resources for output
```

#### Validation & Packaging

```bash
# Validate skill structure and content
python3 scripts/package_skill.py .github/skills/my-skill

# Package creates .skill file (ZIP with .skill extension)
# Output: .github/skills/my-skill.skill
```

## 📚 Skill Development Guidelines

### Core Principles

1. **Concise is Key**: Only include what the AI doesn't already know
2. **Progressive Disclosure**: SKILL.md → references → scripts
3. **Appropriate Freedom**: Match specificity to task fragility

### Anatomy of SKILL.md

```markdown
---
name: skill-name
description: Comprehensive description including WHEN to use
---

# Skill Name

## Overview
Brief overview

## Workflow
Step-by-step instructions

## Resources
- References: See references/ for details
- Scripts: See scripts/ for automation

## Common Pitfalls
Things to watch out for

## Best Practices
Recommended approaches
```

### When to Create a Skill

Create a skill when:
- Same workflow repeated multiple times
- Complex procedural knowledge needed
- Domain-specific patterns exist
- AI needs specialized guidance
- Non-obvious steps required

### When NOT to Create a Skill

Don't create a skill for:
- One-off tasks
- Knowledge AI already has
- Constantly changing information
- Simple lookups

## 🛠️ Scripts

### `init_skill.py`
Initialize new skill with proper structure

```bash
python3 scripts/init_skill.py <skill-name> [--path <output-dir>]
```

Creates:
- SKILL.md template
- scripts/, references/, assets/ directories
- Example files (delete as needed)

### `package_skill.py`
Validate and package skill into .skill file

```bash
python3 scripts/package_skill.py <skill-path> [output-dir]
```

Features:
- Validates YAML frontmatter
- Checks required fields
- Validates naming conventions
- Creates distributable .skill package

## 📖 Project Context

### Dashboard Link SaaS Architecture

Zapier-inspired enterprise SaaS platform:
- **Service Layer**: Core business logic
- **Contract Layer**: Interfaces/contracts
- **Adapter Layer**: Swappable external service implementations
- **Multi-tenant**: Organization isolation via RLS

### Tech Stack
- **Frontend**: React, TypeScript, Vite, TanStack Query
- **Backend**: Hono.js, Node.js
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Monorepo**: Turborepo + pnpm workspaces

### Target User
Non-technical founder using:
- Vibe coding (conversation-driven development)
- AI-assisted coding
- Iterative learning

## 🔄 Iteration & Improvement

Skills should be updated based on usage:

1. **Identify Issues**: Skill doesn't trigger, provides wrong guidance, etc.
2. **Update Skill**: Modify SKILL.md or references
3. **Test**: Verify improvement
4. **Repackage**: Run package_skill.py
5. **Deploy**: Commit changes

## 📝 Contributing

When adding/updating skills:

1. Follow progressive disclosure (keep SKILL.md lean)
2. Use references/ for detailed documentation
3. Provide concrete examples
4. Test with real scenarios
5. Validate before committing

## 🎯 Success Metrics

A successful skill:
- ✅ Triggers correctly for relevant prompts
- ✅ Provides actionable, step-by-step guidance
- ✅ Reduces AI hallucination
- ✅ Improves code quality
- ✅ Speeds up development

## 🔗 Resources

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Dashboard Link Architecture](/ARCHITECTURE_BLUEPRINT.md)
- [Coding Conventions](/docs/conventions.md)

## 📄 License

Same as main repository.
