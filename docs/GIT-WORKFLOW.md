# Git Workflow & Branch Strategy
**Project:** Dashboard Link SaaS  
**Last Updated:** March 30, 2026

---

## Branch Strategy

### Main Branches

```
main (production)
  ↓
develop (integration)
  ↓
feature/* (new features)
bugfix/* (bug fixes)
hotfix/* (urgent production fixes)
```

### Branch Descriptions

**`main`**
- Production-ready code only
- Protected branch (requires PR + review)
- All commits must be tagged with version numbers
- Deployed to production environment
- **Current Status:** Contains realignment changes (85% complete)

**`develop`**
- Integration branch for ongoing development
- All feature branches merge here first
- Continuous integration runs on every push
- Deployed to staging environment
- **Recommended:** Create this branch from current `main` state

**`feature/*`**
- New feature development
- Branch from: `develop`
- Merge to: `develop`
- Naming: `feature/short-description` (e.g., `feature/admin-app-fixes`)
- Delete after merge

**`bugfix/*`**
- Non-urgent bug fixes
- Branch from: `develop`
- Merge to: `develop`
- Naming: `bugfix/issue-description` (e.g., `bugfix/typescript-errors`)
- Delete after merge

**`hotfix/*`**
- Urgent production fixes
- Branch from: `main`
- Merge to: `main` AND `develop`
- Naming: `hotfix/critical-issue` (e.g., `hotfix/security-vulnerability`)
- Delete after merge

---

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring (no feature change or bug fix)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system or dependency changes
- `ci`: CI/CD configuration changes
- `chore`: Other changes (tooling, etc.)
- `revert`: Revert a previous commit

### Scopes

- `database`: Database layer, repositories, migrations
- `api`: Backend API, routes, middleware
- `admin`: Admin frontend application
- `worker`: Worker frontend application
- `shared`: Shared packages (types, constants, validators)
- `auth`: Authentication package
- `plugins`: Plugin system
- `sms`: SMS provider integrations
- `tokens`: Token generation/validation
- `ui`: Shared UI components
- `deps`: Dependencies

### Examples

```bash
# Feature
feat(database): add AdapterConfigRepository

Implements repository pattern for adapter_configs table following
existing patterns. Includes CRUD operations and proper type safety.

Closes #123

# Bug fix
fix(admin): resolve TypeScript errors in PluginsPage

- Add id and name properties to PluginWithConfig interface
- Fix status.id type to be required string instead of optional
- Update state setter to match interface exactly

Fixes #124

# Breaking change
feat(database)!: extend QueryBuilder with CRUD methods

BREAKING CHANGE: All repositories must now use .insert(), .update(),
.delete() instead of .where() for CRUD operations.

Migration guide:
- create(): .where(data).first() → .insert(data).returning('*').first()
- update(): .where({id, ...data}) → .update(data).where({id}).returning('*')
- delete(): .where({id}).first() → .delete().where({id})

# Documentation
docs: add handover documentation for project state

Creates comprehensive handover document with:
- Complete change log from realignment
- Current project status (85% complete)
- Outstanding issues and next steps
- Testing strategy and deployment readiness

# Refactor
refactor(sms): simplify MessageBirdProvider error handling

No functional changes, improves code readability.
```

---

## Workflow Steps

### 1. Starting New Work

```bash
# Update local repository
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/admin-app-fixes

# Or for bugfix
git checkout -b bugfix/typescript-errors
```

### 2. Making Changes

```bash
# Make your changes
# ...

# Stage changes
git add .

# Commit with conventional message
git commit -m "fix(admin): resolve TypeScript errors in PluginsPage"

# Push to remote
git push origin feature/admin-app-fixes
```

### 3. Creating Pull Request

1. Go to GitHub repository
2. Click "New Pull Request"
3. Select base: `develop`, compare: `feature/admin-app-fixes`
4. Fill in PR template:
   - **Title:** Same as commit message (if single commit) or descriptive summary
   - **Description:** What changed, why, and how to test
   - **Related Issues:** Link to issue numbers
   - **Checklist:** Mark completed items
5. Request review from team member
6. Wait for CI/CD checks to pass

### 4. Code Review Process

**Reviewer:**
- Check code quality and style
- Verify tests pass
- Test functionality locally if needed
- Leave comments or approve

**Author:**
- Address review comments
- Push additional commits if needed
- Request re-review

### 5. Merging

```bash
# After approval, merge via GitHub UI
# Choose "Squash and merge" for feature branches
# Choose "Merge commit" for release branches

# Delete branch after merge (via GitHub UI or locally)
git branch -d feature/admin-app-fixes
git push origin --delete feature/admin-app-fixes
```

### 6. Releasing to Production

```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# Update version numbers
# Update CHANGELOG.md
# Run final tests

# Merge to main
git checkout main
git merge release/v1.0.0

# Tag release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main --tags

# Merge back to develop
git checkout develop
git merge release/v1.0.0
git push origin develop

# Delete release branch
git branch -d release/v1.0.0
```

---

## Current Repository State

### Recent Changes (March 27-30, 2026)

**Commits Made:**
1. Extended QueryBuilder interface with CRUD methods
2. Implemented methods in SupabaseAdapter and MockAdapter
3. Fixed all 5 repositories (AccessLog, Worker, Dashboard, Organization, SMSLog)
4. Downgraded Zod to v3.22.4 in admin app
5. Added @types/node to admin and worker apps
6. Fixed SMS package TypeScript errors
7. Replaced direct Supabase call for dashboards
8. Created handover and audit documentation
9. Updated CHANGELOG.md

**Current Branch:** `main`

**Status:**
- ✅ All backend packages build successfully
- ✅ Database migrations applied
- ✅ Environment configured
- ❌ Admin app has 18 TypeScript errors (needs fix)

### Recommended Next Branch

Create a feature branch to fix remaining issues:

```bash
git checkout -b feature/admin-app-typescript-fixes

# Fix the 18 TypeScript errors
# Test the changes
# Commit and push

git add .
git commit -m "fix(admin): resolve all TypeScript errors

- Update PluginWithConfig interface to include id and name
- Fix SMSLogsPage property names (worker_id → workerId)
- Fix SMSLogsPage status filter (remove empty string)
- Update auth.test.ts to use correct property names

Fixes all 18 TypeScript errors blocking admin app build."

git push origin feature/admin-app-typescript-fixes
```

---

## Pre-Commit Hooks

We use `simple-git-hooks` and `lint-staged` for automated checks.

**Configured Hooks:**
- `pre-commit`: Runs `pnpm lint-staged`

**Lint-Staged Configuration:**
```json
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
```

**To Install Hooks:**
```bash
pnpm install  # Automatically installs hooks via postinstall script
```

---

## CI/CD Pipeline

### GitHub Actions (Recommended Setup)

**`.github/workflows/ci.yml`** (to be created):

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

### Deployment Pipeline (Future)

**Staging:**
- Trigger: Push to `develop`
- Deploy to: Vercel staging environment
- Run: E2E tests after deployment

**Production:**
- Trigger: Push to `main` with version tag
- Deploy to: Vercel production environment
- Run: Smoke tests after deployment
- Notify: Team via Slack/Discord

---

## Best Practices

### Do's ✅

- **Commit often** with small, focused changes
- **Write descriptive commit messages** following conventional commits
- **Test locally** before pushing
- **Keep branches up to date** with base branch
- **Delete merged branches** to keep repository clean
- **Use meaningful branch names** that describe the work
- **Review your own PR** before requesting review from others
- **Respond to review comments** promptly

### Don'ts ❌

- **Don't commit directly to `main`** - always use PRs
- **Don't commit sensitive data** (API keys, passwords, etc.)
- **Don't commit large binary files** without Git LFS
- **Don't force push** to shared branches
- **Don't merge without review** (except for hotfixes with approval)
- **Don't leave stale branches** - clean up after merge
- **Don't commit commented-out code** - use git history instead
- **Don't commit `console.log`** statements in production code

---

## Troubleshooting

### Merge Conflicts

```bash
# Update your branch with latest develop
git checkout feature/your-branch
git fetch origin
git merge origin/develop

# Resolve conflicts in your editor
# ...

# Mark as resolved
git add .
git commit -m "chore: resolve merge conflicts with develop"
git push origin feature/your-branch
```

### Undo Last Commit (Not Pushed)

```bash
# Keep changes, undo commit
git reset --soft HEAD~1

# Discard changes, undo commit
git reset --hard HEAD~1
```

### Undo Last Commit (Already Pushed)

```bash
# Create revert commit
git revert HEAD
git push origin your-branch
```

### Accidentally Committed to Wrong Branch

```bash
# Save changes
git stash

# Switch to correct branch
git checkout correct-branch

# Apply changes
git stash pop
```

---

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version (1.0.0 → 2.0.0): Breaking changes
- **MINOR** version (1.0.0 → 1.1.0): New features (backward compatible)
- **PATCH** version (1.0.0 → 1.0.1): Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests pass
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json files
- [ ] Documentation updated
- [ ] Migration guide created (if breaking changes)
- [ ] Release notes prepared
- [ ] Staging deployment successful
- [ ] Code review completed
- [ ] Security audit passed (for major releases)

### Creating a Release

```bash
# 1. Create release branch
git checkout develop
git pull origin develop
git checkout -b release/v1.1.0

# 2. Update version
pnpm version minor  # or major, patch

# 3. Update CHANGELOG.md
# Move items from [Unreleased] to [1.1.0] - 2026-03-30

# 4. Commit changes
git add .
git commit -m "chore: prepare release v1.1.0"

# 5. Merge to main
git checkout main
git merge release/v1.1.0

# 6. Tag release
git tag -a v1.1.0 -m "Release version 1.1.0"
git push origin main --tags

# 7. Merge back to develop
git checkout develop
git merge release/v1.1.0
git push origin develop

# 8. Delete release branch
git branch -d release/v1.1.0

# 9. Create GitHub release
# Go to GitHub → Releases → Draft new release
# Select tag v1.1.0
# Add release notes from CHANGELOG.md
```

---

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Keep a Changelog](https://keepachangelog.com/)

---

**Document Maintained By:** Development Team  
**Last Review:** March 30, 2026  
**Next Review:** After first production release
