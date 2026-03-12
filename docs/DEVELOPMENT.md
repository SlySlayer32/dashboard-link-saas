# Development Workflow Guide

## Quality Assurance Tools

This project uses a multi-layer approach to code quality:

### 🔧 Available Commands

#### Quick Fixes (Recommended)
```bash
# Fix all auto-fixable issues (ESLint + Prettier)
pnpm run fix:all

# Run comprehensive pre-commit checks
pnpm run dev:check

# Validate everything (type check + lint + format check)
pnpm run validate
```

#### Individual Tools
```bash
# Type checking
pnpm run typecheck

# Linting
pnpm run lint              # Check for issues
pnpm run lint:fix          # Fix auto-fixable issues

# Formatting
pnpm run format            # Format all files
pnpm run format:check      # Check formatting without changes

# Testing
pnpm run test              # Run all tests
pnpm run test:unit         # Run unit tests only
```

#### Reporting
```bash
# Generate comprehensive lint report
pnpm run lint:report       # Creates lint-report.txt
```

#### Quality Check Workflow
```bash
# Run automated quality check workflow (via Windsurf)
# This workflow:
# - Auto-fixes code formatting with Prettier
# - Auto-fixes ESLint issues where possible
# - Analyzes TypeScript type errors with detailed solutions
# - Analyzes build compilation status
# - Generates comprehensive diagnostic report
@[/dev-quality-check]
```

The quality check workflow generates a `quality-diagnostic-report.md` file with:
- ✅ Auto-fixed issues (applied automatically)
- ⚠️ Issues requiring manual attention (with detailed solutions)
- 📊 Summary of build status and next steps

---

## 🚀 Development Workflow

### Before Starting Work
```bash
# Start the database
pnpm run db:start

# Start development servers
pnpm run dev
```

### During Development
```bash
# Run quick validation (recommended after major changes)
pnpm run dev:check
```

### Before Committing
**Automatic:** Pre-commit hooks will run automatically when you commit:
- ESLint with auto-fix on staged files
- Prettier formatting on staged files

**Manual validation (optional):**
```bash
# Run all checks manually
pnpm run validate

# Or use the comprehensive check script
pnpm run dev:check
```

---

## 📋 Pre-Commit Hooks

Pre-commit hooks are automatically installed via `simple-git-hooks` when you run `pnpm install`.

### What Runs on Commit?
1. **ESLint** - Lints and auto-fixes staged `.ts`, `.tsx`, `.js`, `.jsx` files
2. **Prettier** - Formats staged files

### Bypassing Hooks (Not Recommended)
```bash
git commit --no-verify
```

---

## 🔍 Understanding Errors

### TypeScript Errors
```bash
pnpm run typecheck
```
- Shows type errors across the entire monorepo
- Must be fixed manually (no auto-fix)
- Common issues: missing types, incorrect imports, type mismatches

### ESLint Errors
```bash
pnpm run lint
```
- Many can be auto-fixed with `pnpm run lint:fix`
- Some require manual intervention (e.g., unused variables, complexity issues)

### Prettier Formatting
```bash
pnpm run format:check  # Check only
pnpm run format        # Fix
```
- Always auto-fixable
- Enforces consistent code style

---

## 🏗️ Monorepo Structure

```
CleanConnect/
├── apps/
│   ├── admin/          # Admin dashboard (React + Vite)
│   ├── api/            # Backend API (Hono.js)
│   └── worker/         # Worker dashboard (React + Vite)
├── packages/
│   ├── auth/           # Authentication utilities
│   ├── database/       # Database layer (Supabase)
│   ├── shared/         # Shared types and validators
│   └── plugins/        # Plugin system
└── scripts/            # Development scripts
```

---

## 🎯 Best Practices

### 1. Run Checks Early and Often
```bash
# After implementing a feature
pnpm run dev:check

# Before pushing to remote
pnpm run validate
```

### 2. Fix Issues Incrementally
Don't let errors accumulate. Fix them as you go:
```bash
# Quick fix for formatting and auto-fixable lints
pnpm run fix:all
```

### 3. Use Type-Safe Patterns
- Always define types for function parameters and return values
- Use Zod schemas for runtime validation
- Leverage TypeScript's strict mode

### 4. Review Generated Reports
```bash
pnpm run lint:report
```
Review `lint-report.txt` to see all issues across the codebase.

---

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
# Rebuild shared packages
pnpm run build --filter=@dashboard-link/shared

# Or rebuild everything
pnpm run build
```

### ESLint/Prettier conflicts
The project uses `eslint-config-prettier` to disable conflicting rules. If you see conflicts:
1. Run `pnpm run format` first
2. Then run `pnpm run lint:fix`

### Git hooks not running
```bash
# Reinstall hooks
pnpm run postinstall
```

### Type errors in IDE but not in CLI
```bash
# Restart TypeScript server in your IDE
# VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

---

## 📚 Additional Resources

- [ESLint Rules](https://eslint.org/docs/latest/rules/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [Turbo Documentation](https://turbo.build/repo/docs)

---

## 🔄 CI/CD Integration

The same validation runs in CI/CD:
```yaml
# Example GitHub Actions workflow
- name: Validate Code Quality
  run: pnpm run validate

- name: Run Tests
  run: pnpm run test
```

This ensures code quality is maintained across the team.
