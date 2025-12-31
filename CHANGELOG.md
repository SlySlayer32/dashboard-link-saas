# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Complete onboarding flow with plugin selection and configuration
- SMS modal component for enhanced messaging capabilities  
- Development login button for easier testing workflows
- Project rules system for architectural consistency (.windsurf/rules/)
- Comprehensive TypeScript type definitions across all packages
- Enhanced API middleware with improved authentication and error handling
- New admin dashboard components and hooks for better UX
- Improved logging system with proper TypeScript typing
- VS Code launch configuration for better debugging experience

### Changed
- Refactored shared package structure and removed compiled artifacts
- Updated API middleware and services for improved authentication
- Enhanced plugin architecture with better type safety
- Improved package configurations and build settings
- Updated TanStack Query hooks for better performance
- Streamlined error handling across all services

### Fixed
- TypeScript typing issues in plugin adapters
- Linting errors across admin, API, and plugin packages
- HTMLTextAreaElement type definitions in UI components
- Authentication middleware context typing
- Logger utility TypeScript compliance

---

## [0.2.0] - 2025-12-31

### Added
- README overhaul with marketing copy and clear 5‑minute setup
- Environment variable examples inline in README
- Production deployment checklist
- Testing commands and coverage targets in docs
- Streamlined plugin system table with setup times
- Strengthened deployment section with Vercel/Docker instructions

### Changed
- Simplified Quick Start to numbered 4‑step process
- Consolidated architecture and tech stack sections
- Removed outdated screenshot/demo links to reduce maintenance

### Deprecated
- Legacy demo links and placeholder screenshots

### Removed
- Redundant UI showcase section with broken image links

---

## [0.1.0] - 2025-12-27

### Added
- Initial monorepo structure with apps/admin, apps/worker, apps/api
- Supabase integration for auth, database, and storage
- SMS delivery via MobileMessage.com.au
- Plugin system with Manual, Google Calendar, Airtable, Notion adapters
- Admin dashboard with worker management and SMS logs
- Worker mobile dashboard with tokenized access
- Multi-tenant architecture with RLS policies
- TypeScript throughout with shared types package
- TanStack Query for data fetching and caching
- Zustand for frontend state management
- Hono.js API with middleware and error handling
- Vite + Turborepo build system
- Comprehensive test suite with Vitest

---

## [Future]

### Planned
- Plugin marketplace and third-party adapters
- Advanced analytics and reporting dashboard
- Bulk SMS scheduling and templates
- International SMS providers beyond Australia
- Worker self-service portal
- API rate limiting and quotas
- SSO integration (SAML, OAuth2)
- Mobile apps (React Native) for offline access
- Webhook system for real-time data sync
- Custom branding and white-label options
