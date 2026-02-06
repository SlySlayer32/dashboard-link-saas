# CleanConnect — SpecKit Quick Reference

> How to describe features so AI agents build the right thing. No coding knowledge needed.
> For the full workflow details, see `.specify/templates/commands/`.

---

## The SpecKit Chain

```text
/speckit.constitution  →  constitution.md  (project rules — foundation)
        ↓
/speckit.specify       →  spec.md          (WHAT users need and WHY)
        ↓
/speckit.clarify       →  refines spec     (resolves ambiguity — optional)
        ↓
/speckit.plan          →  plan.md          (HOW to build it technically)
        ↓
/speckit.tasks         →  tasks.md         (step-by-step build order)
        ↓
/speckit.analyze       →  quality report   (consistency check — optional)
        ↓
/speckit.implement     →  code!            (AI writes the code)
```

**How it works**: Each step auto-loads the constitution and all prior artifacts. You provide input for `/speckit.specify` — the chain handles the rest. Run `/speckit.tasks` with no arguments and it finds your spec + plan automatically.

**Auxiliary**: `/speckit.checklist` can run after any step to validate requirements quality.

---

## How to Describe a Feature

### Start with the Problem (WHY)

| Instead of this | Write this |
|----------------|-----------|
| "Add schedule preview to SMS" | "40% of workers don't open dashboards because they don't know what info is there. Adding a schedule preview in the SMS should increase engagement from 60% to 80%." |
| "Add Google Calendar support" | "Workers manually enter schedules, causing duplicates and 30% outdated data. Auto-syncing from Google Calendar eliminates manual entry." |

### Describe Who and What

Use this pattern: **As a [person], I want to [action], so that [benefit].**

Example: "As a field worker, I want to receive a text each morning with my day's schedule, so I can plan my route without opening the dashboard."

### Define "Done" with Scenarios

Use **Given / When / Then**:

- **Given** a worker has 3 jobs today, **When** the SMS sends at 6 AM, **Then** they see job count + first 2 jobs + dashboard link.
- **Given** a worker has no jobs, **When** the SMS sends, **Then** they see "No jobs scheduled" + dashboard link.
- **Given** the SMS provider is down, **When** delivery fails 3 times, **Then** the system stops retrying and logs an alert.

### Say What's NOT Included

"Out of scope: two-way calendar sync, shared calendars, calendar event creation."

---

## Tips for Better Results

1. **Explain the business impact** — "Reduces support tickets by 50%" beats "make it faster"
2. **Be specific** — "loads in under 2 seconds on 4G" beats "loads fast"
3. **List edge cases** — What happens when data is missing? When the service is down?
4. **Say what success looks like** — Measurable outcomes the AI can verify
5. **Mark unknowns** — If unsure, say so. The AI will ask clarifying questions.

---

## Key Terms

| Term | Meaning |
|------|---------|
| **Worker** | Field employee who receives daily dashboard via SMS |
| **Dashboard** | Mobile-optimized view of a worker's schedule and tasks |
| **Plugin** | Adapter connecting external services (Google Calendar, Airtable, etc.) |
| **Dashboard Token** | Short-lived link (1-24 hours) granting access without login |
| **Constitution** | Project rules the AI must always follow (see `memory/constitution.md`) |
| **Multi-tenant** | Each organisation's data is isolated from others |

---

## Quick Checklist Before Requesting a Feature

- [ ] **WHY** — Business problem and impact explained
- [ ] **WHO** — Which user type benefits
- [ ] **WHAT** — User story with specific actions and outcomes
- [ ] **WHEN DONE** — At least 2-3 Given/When/Then scenarios
- [ ] **WHAT'S OUT** — Explicitly excluded items
- [ ] **SUCCESS** — Measurable outcomes (time, percentage, count)

---

## Architecture

- **Single source of truth**: All workflow logic lives in `.specify/templates/commands/`
- **Windsurf workflows** (`.windsurf/workflows/`) are thin delegators — they read and execute the command files
- **Constitution** (`memory/constitution.md`) is auto-loaded by tasks, analyze, and implement workflows

*For detailed workflow instructions, see the command files in `.specify/templates/commands/`.*
*For project rules, see `.specify/memory/constitution.md`.*
