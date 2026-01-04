# Agent Orchestration System - Quick Reference

## Overview

Production-grade GitHub Actions orchestration system that automatically activates specialized workers (skills) in response to issues, PRs, and comments.

## How It Works

```
Event → Plan Workers → Execute in Parallel → Aggregate → Post Comment
```

## Triggering Workers

### Automatic (Labels)

| Label | Workers Activated |
|-------|------------------|
| `bug` | code-quality-review, error-analysis |
| `enhancement`, `feature` | architecture-review, next-steps-planning |
| `question`, `help wanted` | next-steps-planning |

### Automatic (Keywords)

| Keywords in Title/Body | Worker |
|------------------------|--------|
| "plugin", "adapter", "architecture" | architecture-review |
| "error", "fix", "bug" | error-analysis |
| "refactor", "rename", "naming" | naming-review |
| "missing logic", "code quality" | code-quality-review |

### Explicit (Bot Mentions)

Comment on issue/PR with:
- `@copilot review` → code-quality-review
- `@copilot architecture` → architecture-review
- `@copilot fix errors` → error-analysis
- `@copilot what's next?` → next-steps-planning
- `@copilot naming` → naming-review

## Workers

| Worker Name | Skill | Purpose |
|-------------|-------|---------|
| code-quality-review | code-quality-reviewer | Find missing logic, quality issues |
| architecture-review | architecture-guide | Validate Zapier patterns |
| error-analysis | error-fixer | Analyze and suggest fixes for errors |
| naming-review | naming-conventions | Check naming conventions |
| next-steps-planning | next-steps-planner | Suggest what to do next |

## Files

### Scripts
- `scripts/orchestration/orchestrator.ts` - Event parser & planner
- `scripts/orchestration/skill-runner.ts` - Skill executor
- `scripts/orchestration/aggregator.ts` - Result combiner
- `scripts/orchestration/comment-poster.ts` - GitHub commenter

### Workflows
- `.github/workflows/issue-agent.yml` - Issue orchestration
- `.github/workflows/pr-agent.yml` - PR orchestration

### Outputs
- `outputs/plan.json` - Worker execution plan
- `outputs/{worker}.json` - Individual results
- `outputs/aggregated.json` - Combined results
- `outputs/comment.md` - GitHub comment

## Local Testing

```bash
# 1. Build
cd scripts/orchestration
npm install
npm run build

# 2. Test orchestrator
export GITHUB_EVENT_PATH="test-events/pr-opened.json"
export GITHUB_EVENT_NAME="pull_request"
npm run orchestrate -- parse-event

# 3. Test worker
npm run run-skill -- \
  --skill code-quality-reviewer \
  --worker test-worker \
  --output ../outputs/result.json

# 4. Test aggregation
npm run aggregate

# 5. View comment
cat ../outputs/comment.md
```

## Workflow Behavior

### Issue Agent
- **Triggers**: Issue opened/labeled/edited, comments created
- **Bot Check**: Comments only trigger if bot mentioned
- **Concurrency**: Max 1 per issue

### PR Agent
- **Triggers**: PR opened/sync/labeled/edited, review comments
- **Bot Check**: Review comments only trigger if bot mentioned
- **Concurrency**: Max 1 per PR

## Permissions

| Job | Permissions |
|-----|------------|
| plan | `contents: read` |
| execute-workers | None (inherited) |
| aggregate-and-comment | `contents: read`, `issues: write` / `pull-requests: write` |

## Adding New Workers

1. Create skill in `.github/skills/{skill-name}/SKILL.md`
2. Add activation logic to `orchestrator.ts`:
   ```typescript
   if (this.hasKeywords(title, body, ['keyword'])) {
     workers.push({
       name: 'my-worker',
       skill: 'my-skill',
       reason: 'Detected keyword',
       priority: 20,
       enabled: true,
       timeout: 300,
     });
   }
   ```
3. Build and test locally
4. Commit changes

## Monitoring

### Check Workflow Runs
1. Go to repository → Actions
2. Select "Issue Agent Orchestrator" or "PR Agent Orchestrator"
3. View run details

### Debug Workers
1. Click on failed workflow run
2. Expand "Execute Worker - {name}" job
3. Check "Execute skill worker" step

### View Artifacts
1. Workflow run page → Artifacts section
2. Download `worker-plan` or `worker-result-*`

## Common Issues

### No workers activated
- Check labels/keywords match activation logic
- Verify bot is mentioned in comments
- Review orchestrator logs

### Worker execution failed
- Verify skill exists in `.github/skills/`
- Check SKILL.md frontmatter format
- Review skill-runner logs

### Comment not posted
- Check permissions in workflow
- Verify `GITHUB_TOKEN` is available
- Review comment-poster logs

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_EVENT_PATH` | Yes | Path to event JSON |
| `GITHUB_EVENT_NAME` | Yes | Event type (issues, pull_request, etc.) |
| `GITHUB_OUTPUT` | Workflows | Output file for Actions |
| `GITHUB_TOKEN` | Comment posting | GitHub API token |
| `GITHUB_REPOSITORY` | Comment posting | Repository name |

## Security

- ✅ Least-privilege permissions
- ✅ Concurrency controls prevent races
- ✅ Workers fail gracefully
- ✅ Partial results always reported
- ✅ No secrets in logs or comments

## Support

- **README**: `scripts/orchestration/README.md`
- **Testing**: `scripts/orchestration/TESTING.md`
- **Architecture**: `.github/AGENT_ORCHESTRATION_GUIDE.md`
