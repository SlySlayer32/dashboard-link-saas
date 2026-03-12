# 🚀 Quick Start - Development Workflow

## Essential Commands

### 🔧 Fix Everything Automatically
```bash
pnpm run fix:all
```
Runs ESLint auto-fix + Prettier formatting on all files.

### ✅ Validate Before Commit
```bash
pnpm run dev:check
```
Comprehensive check: TypeScript + ESLint + Prettier + Build verification.

### 📋 Generate Full Report
```bash
pnpm run lint:report
```
Creates `lint-report.txt` with all issues across the codebase.

---

## Common Workflows

### Starting Development
```bash
pnpm run db:start    # Start Supabase
pnpm run dev         # Start all dev servers
```

### After Making Changes
```bash
pnpm run fix:all     # Auto-fix linting and formatting
pnpm run typecheck   # Check for type errors
```

### Before Committing
```bash
pnpm run dev:check   # Run all quality checks
```
Or just commit - pre-commit hooks will run automatically!

### Debugging Issues
```bash
# Type errors
pnpm run typecheck

# Linting errors
pnpm run lint

# Formatting issues
pnpm run format:check

# Full report
pnpm run lint:report
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm run fix:all` | Fix all auto-fixable issues (ESLint + Prettier) |
| `pnpm run dev:check` | Run comprehensive pre-commit checks |
| `pnpm run validate` | Type check + lint + format check |
| `pnpm run typecheck` | Check TypeScript types |
| `pnpm run lint` | Check for linting issues |
| `pnpm run lint:fix` | Fix auto-fixable linting issues |
| `pnpm run format` | Format all files with Prettier |
| `pnpm run format:check` | Check formatting without changes |
| `pnpm run lint:report` | Generate comprehensive lint report |
| `pnpm run test` | Run all tests |
| `pnpm run build` | Build all packages |

---

## Pre-Commit Hooks

**Automatic on every commit:**
- ✅ ESLint with auto-fix on staged files
- ✅ Prettier formatting on staged files

**Bypass (not recommended):**
```bash
git commit --no-verify
```

---

## Troubleshooting

### "Cannot find module" errors
```bash
pnpm run build --filter=@dashboard-link/shared
```

### Git hooks not running
```bash
pnpm run postinstall
```

### IDE type errors but CLI is fine
Restart TypeScript server in your IDE:
- VS Code: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"

---

## 📚 Full Documentation

See [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) for detailed information.

---

## 🎯 Best Practice

**Run this after implementing features:**
```bash
pnpm run dev:check
```

This ensures code quality before you commit!
