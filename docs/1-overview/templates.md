The better option is **don't just add a description — give each file pre-built section headers with a one-liner explaining each section.**

Here's why that's stronger:

- A description tells Claude *what the file is for*
- Section headers tell Claude *exactly what to write and where*
- It also means the files are immediately useful as templates, not just placeholders
- TODOs become specific ("## Database Tables — TODO: list each table and its purpose") instead of generic

---

## What Each File Should Look Like When Created

Here's the full structure with headers mapped out for every file:

---

### `CONTEXT.md`
```markdown
# Project Context
> Read this first. Updated whenever something major changes.

## What This App Does
[1-2 sentence description of the product]

## Who It's For
[Target user, their problem]

## Current Status
[What phase, what was last worked on]

## Tech Stack Summary
[Quick list: frontend, backend, database, hosting]

## Key Docs
- PRD: /docs/1-overview/PRD.md
- Architecture: /docs/2-architecture/ARCHITECTURE.md
- Current Features: /docs/6-product/FEATURES.md

## Known Issues / Active Blockers
[Anything a dev needs to know before touching the code]
```

---

### `1-overview/PRD.md`
```markdown
# Product Requirements Document

## Problem Statement
[What problem does this solve and for who]

## Goals
[What success looks like]

## Non-Goals
[What this product deliberately does NOT do]

## Target Users
[Who uses this, their technical level, their context]

## Core Features
[High level list — detail lives in /docs/6-product/FEATURES.md]

## Constraints
[Budget, timeline, technical limitations]
```

---

### `1-overview/VISION.md`
```markdown
# Vision

## The Why
[Why does this product exist]

## North Star
[The single outcome that defines success]

## 12-Month Picture
[What does this look like when it's working]

## Principles
[2-4 rules that guide every decision e.g. "simple over feature-rich"]
```

---

### `1-overview/ROADMAP.md`
```markdown
# Roadmap

## Phase 1 — MVP
**Goal:** [what this phase achieves]
- [ ] Feature/task
- [x] Completed item

## Phase 2 — [Name]
**Goal:**
- [ ]

## Icebox
[Good ideas parked for later — not committed to]

## Completed Milestones
[Brief log of what shipped and when]
```

---

### `2-architecture/ARCHITECTURE.md`
```markdown
# System Architecture

## Overview
[How the system works at a high level — 1 paragraph]

## System Diagram
[Embed or link to /docs/2-architecture/DIAGRAMS/]

## Key Components
[List each major part: what it does, what it talks to]

## Data Flow
[How data moves through the system for the main use case]

## Scalability Considerations
[What will break first under load, what's intentionally deferred]
```

---

### `2-architecture/TECH-STACK.md`
```markdown
# Tech Stack

## Frontend
| Tool | Version | Why Chosen |
|------|---------|------------|

## Backend
| Tool | Version | Why Chosen |
|------|---------|------------|

## Database
| Tool | Version | Why Chosen |
|------|---------|------------|

## Infrastructure / Hosting
| Tool | Purpose | Why Chosen |
|------|---------|------------|

## Rejected Alternatives
[What was considered and why it was passed on]
```

---

### `2-architecture/DATABASE-SCHEMA.md`
```markdown
# Database Schema

## Overview
[Relational / NoSQL / hybrid — brief summary]

## Tables / Collections

### [TableName]
| Field | Type | Required | Description |
|-------|------|----------|-------------|

## Relationships
[How tables connect to each other]

## Indexes
[What's indexed and why]

## Migration Strategy
[How schema changes are handled]
```

---

### `2-architecture/FRONTEND.md`
```markdown
# Frontend Architecture

## Framework & Version
## Folder Structure
[How components/pages are organised]

## State Management
[What tool, what lives in global vs local state]

## Styling Approach
[CSS framework, design tokens, conventions]

## Component Conventions
[Naming, file structure, when to split a component]

## Key Third-Party Libraries
```

---

### `2-architecture/BACKEND.md`
```markdown
# Backend Architecture

## Framework & Version
## Folder Structure
## Request Lifecycle
[How a request flows from entry to response]

## Middleware
[What runs on every request]

## Error Handling
[How errors are caught, formatted, returned]

## Background Jobs / Queues
[If any — what runs async and how]
```

---

### `3-api/API-OVERVIEW.md`
```markdown
# API Overview

## Base URL
## Authentication Method
[JWT / API key / OAuth — how it works]

## Request Format
[Headers required, content-type, etc]

## Response Format
[Standard response shape — success and error]

## Rate Limiting
## Versioning Strategy
```

---

### `3-api/ENDPOINTS.md`
```markdown
# API Endpoints

## [Resource Name]

### GET /route
**Description:**
**Auth required:** Yes/No
**Query Params:**
**Response:**
```json
{}
```

### POST /route
...
```

---

### `3-api/THIRD-PARTY-APIS.md`
```markdown
# Third-Party APIs

## [Service Name]
**Purpose:** [what we use it for]
**Auth:** [how we authenticate]
**Key Endpoints Used:** [just the ones we actually call]
**Limits / Gotchas:** [rate limits, quirks to know]
**Docs:** [link]
```

---

### `4-decisions/ADR/_TEMPLATE.md`
```markdown
# ADR-[number]: [Decision Title]
**Date:** YYYY-MM-DD
**Status:** Accepted / Superseded / Deprecated

## Context
[What situation forced this decision]

## Options Considered
1. Option A — [pros/cons]
2. Option B — [pros/cons]

## Decision
[What was chosen and the primary reason]

## Consequences
[What this means going forward — good and bad]
```

---

### `5-dev-guide/SETUP.md`
```markdown
# Local Setup

## Prerequisites
[Node version, tools needed, accounts required]

## Installation
[Step by step commands]

## Running the App
[Dev server, any flags to know]

## Common Setup Issues
[Problems people actually hit and how to fix them]
```

---

### `5-dev-guide/ENV-VARIABLES.md`
```markdown
# Environment Variables

> Never commit real values. This documents keys only.

| Variable | Required | Description | Example Format |
|----------|----------|-------------|----------------|
| DATABASE_URL | Yes | Primary DB connection | postgresql://... |
```

---

### `5-dev-guide/CODE-STANDARDS.md`
```markdown
# Code Standards

## Naming Conventions
[Files, variables, functions, components]

## Folder / Import Rules
[Where things live, how imports are structured]

## Error Handling Rules
[How errors are caught and surfaced]

## Comment Style
[When to comment, when not to, format]

## Definition of Done
[What must be true before something is considered complete]

## Explicitly Banned Patterns
[Things we tried, didn't work, never do again]
```

---

### `5-dev-guide/TESTING.md`
```markdown
# Testing Strategy

## Philosophy
[What we test and why — not everything needs a test]

## Test Types in Use
[Unit / integration / e2e — which and when]

## Tools
## What Must Always Be Tested
## What We Intentionally Don't Test
## How to Run Tests
```

---

### `5-dev-guide/SECURITY.md`
```markdown
# Security

## Authentication & Authorization
[How identity is verified, how access is controlled]

## Data Access Rules
[Who can see what — RLS, role logic, etc]

## What Never Gets Exposed
[Fields, endpoints, data that must stay private]

## Input Validation
[Where and how inputs are sanitised]

## Known Risks / Accepted Tradeoffs
[Security decisions made consciously with reasoning]
```

---

### `5-dev-guide/DEPLOYMENT.md`
```markdown
# Deployment

## Environments
| Environment | URL | Purpose |
|-------------|-----|---------|
| Local | localhost | Development |
| Staging | | Pre-prod testing |
| Production | | Live |

## Deploy Process
[Step by step — how does code get to prod]

## Rollback Plan
[What to do if a deploy breaks something]

## Hosting Provider
## CI/CD Setup
```

---

### `6-product/FEATURES.md`
```markdown
# Features

## Legend
✅ Built | 🔄 In Progress | 📋 Planned | ❌ Cut

## Core Features
| Feature | Status | Notes |
|---------|--------|-------|

## Nice-to-Haves
| Feature | Status | Notes |
|---------|--------|-------|

## Cut Features
| Feature | Why Cut |
|---------|---------|
```

---

### `6-product/USER-FLOWS.md`
```markdown
# User Flows

## [Flow Name e.g. Onboarding]
**User goal:** [what they're trying to do]
**Entry point:** [where it starts]

1. Step one
2. Step two
3. ...

**Success state:** [what the user sees when it works]
**Failure states:** [what can go wrong and what happens]
```

---

### `6-product/PRICING.md`
```markdown
# Pricing & Plans

## Plans
| Plan | Price | Limits | Target User |
|------|-------|--------|-------------|

## Business Logic
[Rules enforced in code — what happens when limits are hit]

## Trial / Free Tier
## Upgrade / Downgrade Behaviour
```
