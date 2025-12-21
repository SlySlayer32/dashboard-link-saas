# Development Environment Setup

This document outlines the development environment configuration for CleanConnect.

## 🛠️ Tools Installed

### ESLint
- **Location**: Root-level `eslint.config.js` (flat config)
- **Features**: 
  - TypeScript support
  - React hooks linting
  - React refresh for hot reload
  - Prettier integration
- **Usage**: `pnpm lint` to check, `pnpm lint:fix` to auto-fix

### Prettier
- **Location**: `.prettierrc.json`
- **Style**: 
  - No semicolons
  - Single quotes
  - Trailing commas (ES5)
  - 100 character line width
- **Usage**: `pnpm format` to format, `pnpm format:check` to verify

### Pre-commit Hooks
- **Tool**: Husky + lint-staged
- **Actions**: Runs ESLint and Prettier on staged files
- **Setup**: Automatically installed via `prepare` script

### VS Code Configuration
- **Settings**: Auto-format on save, ESLint auto-fix
- **Extensions**: Recommended extensions in `.vscode/extensions.json`
- **Features**: Excludes build files from search/explorer

## 📝 Available Scripts

```bash
# Development
pnpm dev          # Start all apps in development mode
pnpm build        # Build all apps
pnpm test         # Run all tests

# Code Quality
pnpm lint         # Check for linting errors
pnpm lint:fix     # Auto-fix linting errors
pnpm format       # Format all files
pnpm format:check # Check formatting

# Maintenance
pnpm clean        # Clean build artifacts and node_modules
```

## 🎯 MCP Servers (Optional)

For enhanced development experience, consider these MCP servers:

1. **supabase-mcp** - Already available for database management
2. **@anthropic/mcp-server-filesystem** - Enhanced file operations

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Install VS Code extensions (prompt will appear)
4. Start development: `pnpm dev`

The pre-commit hooks will automatically run when you commit changes, ensuring code quality across the team.
