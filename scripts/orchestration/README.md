# Agent Orchestration System

Production-grade GitHub Actions based orchestration system for custom Copilot agents in the Dashboard Link SaaS repository.

## Overview

This orchestration system enables intelligent, parallel execution of specialized "worker" skills in response to GitHub events (issues, PRs, comments). It acts as the glue between GitHub Actions and the repository's skill system.

## Architecture

```
GitHub Event (Issue/PR/Comment)
         ↓
   Plan Workers (orchestrator.ts)
         ↓
   Execute Workers in Parallel (skill-runner.ts)
         ↓
   Aggregate Results (aggregator.ts)
         ↓
   Post Comment (comment-poster.ts)
```

## Components

### 1. Orchestrator (`orchestrator.ts`)
- Parses GitHub events
- Analyzes context (labels, keywords, file changes)
- Generates worker execution plan
- Outputs: `outputs/plan.json`

### 2. Skill Runner (`skill-runner.ts`)
- Loads skill definitions from `.github/skills/`
- Executes skills with event context
- Produces structured results
- Outputs: `outputs/{worker-name}.json`

### 3. Results Aggregator (`aggregator.ts`)
- Collects all worker results
- Combines into unified summary
- Extracts recommendations
- Outputs: `outputs/aggregated.json`, `outputs/comment.md`

### 4. Comment Poster (`comment-poster.ts`)
- Posts aggregated markdown to GitHub
- Uses GitHub API with token authentication
- Posts to issue or PR based on event type

## GitHub Actions Workflows

### Issue Agent (`issue-agent.yml`)
- **Triggers**: `issues` (opened, labeled, edited), `issue_comment` (created)
- **Bot Mention**: Only responds to comments mentioning `@copilot`, `@github-actions`, or `@bot`
- **Concurrency**: One execution per issue at a time
- **Permissions**: `contents: read`, `issues: write`

### PR Agent (`pr-agent.yml`)
- **Triggers**: `pull_request` (opened, synchronize, labeled, edited), `pull_request_review_comment` (created)
- **Bot Mention**: Only responds to review comments mentioning the bot
- **Concurrency**: One execution per PR at a time
- **Permissions**: `contents: read`, `pull-requests: write`

## Worker Plan Schema

```typescript
interface WorkerPlan {
  workers: Worker[];
  parallel: boolean;
  metadata: PlanMetadata;
}

interface Worker {
  name: string;        // Unique worker identifier
  skill: string;       // Skill to execute (from .github/skills/)
  reason: string;      // Why this worker was activated
  priority: number;    // Lower = higher priority
  enabled: boolean;    // Whether to execute this worker
  timeout?: number;    // Max execution time (seconds)
}
```

## Usage

### Automatic Activation (Labels)
Workers automatically activate based on issue/PR labels:
- `bug` → code-quality-review, error-analysis
- `enhancement`, `feature` → architecture-review, next-steps-planning
- `question`, `help wanted` → next-steps-planning

### Keyword Detection
Workers activate based on title/body keywords:
- "plugin", "adapter", "architecture" → architecture-review
- "error", "fix", "bug" → error-analysis
- "refactor", "rename", "naming" → naming-review
- "missing logic", "code quality" → code-quality-review

### Explicit Commands (Comments)
Mention the bot and use keywords:
- `@copilot review the code` → code-quality-review
- `@github-actions check architecture` → architecture-review
- `@bot fix errors` → error-analysis
- `@copilot what's next?` → next-steps-planning
- `@bot naming conventions` → naming-review

## Development

### Build Scripts
```bash
cd scripts/orchestration
npm install
npm run build
```

### Run Locally
```bash
# Set environment variables
export GITHUB_EVENT_PATH=/path/to/event.json
export GITHUB_EVENT_NAME=pull_request
export GITHUB_REPOSITORY=owner/repo

# Plan workers
npm run orchestrate -- parse-event

# Execute skill
npm run run-skill -- --skill code-quality-reviewer --worker code-quality-review --output outputs/result.json

# Aggregate results
npm run aggregate

# Post comment (requires GITHUB_TOKEN)
npm run post-comment
```

### Testing Event Payloads
Create test event files in `test-events/`:

```json
{
  "action": "opened",
  "pull_request": {
    "number": 123,
    "title": "Add new plugin adapter",
    "body": "This PR implements a new Zapier-style adapter",
    "labels": [{"name": "enhancement"}],
    "changed_files": 5
  },
  "repository": {
    "full_name": "owner/repo"
  }
}
```

## Security

### Least-Privilege Permissions
- Workflows use minimal required permissions
- Separate permissions per job
- Token only used for posting comments

### Concurrency Control
- Prevents race conditions with `concurrency` groups
- One orchestration per issue/PR at a time
- Non-cancellable to ensure completion

### Error Handling
- Workers fail gracefully (`fail-fast: false`)
- Partial results always aggregated
- Error details included in comments

## Worker Definition

Workers are mapped to skills in `.github/skills/`:
- `code-quality-review` → `code-quality-reviewer`
- `architecture-review` → `architecture-guide`
- `error-analysis` → `error-fixer`
- `naming-review` → `naming-conventions`
- `next-steps-planning` → `next-steps-planner`

## Output Files

- `outputs/plan.json` - Worker execution plan
- `outputs/context.json` - Event context for workers
- `outputs/{worker-name}.json` - Individual worker results
- `outputs/aggregated.json` - Combined results
- `outputs/comment.md` - Markdown for GitHub comment

## Extending the System

### Add New Worker Activation Logic
Edit `scripts/orchestration/orchestrator.ts`:
```typescript
// In analyzePR() or analyzeIssue()
if (this.hasKeywords(title, body, ['performance', 'optimize'])) {
  workers.push({
    name: 'performance-review',
    skill: 'performance-analyzer',
    reason: 'PR involves performance optimization',
    priority: 25,
    enabled: true,
    timeout: 300,
  });
}
```

### Add New Skill
1. Create skill in `.github/skills/my-new-skill/SKILL.md`
2. Add worker activation logic in orchestrator
3. Test with local event payload

## Troubleshooting

### No workers activated
- Check event payload in GitHub Actions logs
- Verify labels/keywords match detection logic
- Ensure bot is mentioned in comments

### Worker execution failed
- Check skill exists in `.github/skills/`
- Verify skill SKILL.md format (frontmatter + body)
- Review worker logs in GitHub Actions

### Comment not posted
- Verify `GITHUB_TOKEN` has `issues: write` or `pull-requests: write`
- Check issue/PR number determination logic
- Review GitHub API rate limits

## Contributing

When modifying the orchestration system:
1. Update TypeScript types in `types.ts`
2. Build and test locally
3. Update this README
4. Test with real GitHub events before merging

## License

Same as main repository.
