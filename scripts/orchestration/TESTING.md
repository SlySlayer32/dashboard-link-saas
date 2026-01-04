# Testing Guide for Agent Orchestration System

This guide covers testing the agent orchestration system locally before deploying to GitHub Actions.

## Prerequisites

```bash
cd scripts/orchestration
npm install
npm run build
```

## Test Scenarios

### 1. Test Orchestrator with Different Events

#### PR Event (with architecture changes)
```bash
export GITHUB_EVENT_PATH="$PWD/test-events/pr-opened.json"
export GITHUB_EVENT_NAME="pull_request"
export GITHUB_OUTPUT="/tmp/test_output.txt"
mkdir -p outputs

node scripts/orchestration/dist/orchestrator.js parse-event

# Expected: code-quality-review, architecture-review, next-steps-planning
cat outputs/plan.json
```

#### Issue Event (bug)
```bash
export GITHUB_EVENT_PATH="$PWD/test-events/issue-opened.json"
export GITHUB_EVENT_NAME="issues"
export GITHUB_OUTPUT="/tmp/test_output.txt"

node scripts/orchestration/dist/orchestrator.js parse-event

# Expected: code-quality-review, error-analysis
cat outputs/plan.json
```

#### Comment Event (bot mentioned)
```bash
export GITHUB_EVENT_PATH="$PWD/test-events/comment-created.json"
export GITHUB_EVENT_NAME="issue_comment"
export GITHUB_OUTPUT="/tmp/test_output.txt"

node scripts/orchestration/dist/orchestrator.js parse-event

# Expected: Workers based on comment keywords
cat outputs/plan.json
```

### 2. Test Skill Runner

```bash
# Create context
cat > outputs/context.json << EOF
{
  "eventType": "pull_request",
  "repository": "SlySlayer32/dashboard-link-saas",
  "prNumber": 123
}
EOF

# Run a skill
node scripts/orchestration/dist/skill-runner.js \
  --skill code-quality-reviewer \
  --worker code-quality-review \
  --output outputs/code-quality-review.json

# Check result
cat outputs/code-quality-review.json
```

### 3. Test Multiple Workers

```bash
# Run all skills
node scripts/orchestration/dist/skill-runner.js \
  --skill code-quality-reviewer \
  --worker code-quality-review \
  --output outputs/code-quality-review.json

node scripts/orchestration/dist/skill-runner.js \
  --skill architecture-guide \
  --worker architecture-review \
  --output outputs/architecture-review.json

node scripts/orchestration/dist/skill-runner.js \
  --skill next-steps-planner \
  --worker next-steps-planning \
  --output outputs/next-steps-planning.json

# List results
ls -la outputs/
```

### 4. Test Aggregation

```bash
# After running multiple workers
node scripts/orchestration/dist/aggregator.js

# Check aggregated results
cat outputs/aggregated.json
cat outputs/comment.md
```

### 5. Test Failure Handling

```bash
# Create a failing worker
node scripts/orchestration/dist/skill-runner.js \
  --skill nonexistent-skill \
  --worker failure-test \
  --output outputs/failure-test.json || echo "Failed as expected"

# Create a successful worker
node scripts/orchestration/dist/skill-runner.js \
  --skill code-quality-reviewer \
  --worker success-test \
  --output outputs/success-test.json

# Aggregate (should handle mixed results)
node scripts/orchestration/dist/aggregator.js

# Check comment includes both success and failure
cat outputs/comment.md
```

### 6. Test GITHUB_OUTPUT Format

```bash
# Verify outputs are in correct format
export GITHUB_OUTPUT="/tmp/test_github_output.txt"
rm -f $GITHUB_OUTPUT

node scripts/orchestration/dist/orchestrator.js parse-event

# Check output format (should be key=value)
cat $GITHUB_OUTPUT
```

Expected output format:
```
worker-matrix={"worker":["code-quality-review","architecture-review"]}
worker-count=2
workers=code-quality-review,architecture-review
parallel=true
```

## Workflow Validation

### Validate YAML Syntax

```bash
# Using Python
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/issue-agent.yml')); print('✅ issue-agent.yml is valid')"
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/pr-agent.yml')); print('✅ pr-agent.yml is valid')"
```

### Check Workflow Structure

Verify these elements in both workflows:
- [ ] Concurrency group defined
- [ ] Permissions are least-privilege
- [ ] Matrix strategy uses `fromJson()`
- [ ] `fail-fast: false` for worker execution
- [ ] Uses `$GITHUB_OUTPUT` not `::set-output`
- [ ] Artifacts uploaded/downloaded correctly
- [ ] `if: always()` for aggregation job

## Integration Testing

### Test with Real GitHub Event

1. Create a test branch
2. Open a PR with specific keywords (e.g., "plugin", "adapter")
3. Watch GitHub Actions run
4. Verify workers are activated correctly
5. Check comment is posted

### Test Bot Mention

1. Create an issue
2. Comment with `@copilot review the code`
3. Verify only issue_comment workflow runs
4. Check correct workers are activated

## Troubleshooting

### Orchestrator returns no workers

**Check:**
- Event file structure matches expected format
- Keywords/labels are correctly matched
- Bot mention is present for comment events

**Debug:**
```bash
# Add debug output to orchestrator
export DEBUG=1
node scripts/orchestration/dist/orchestrator.js parse-event
```

### Skill runner fails

**Check:**
- Skill exists in `.github/skills/`
- SKILL.md has correct frontmatter
- Context file exists

**Debug:**
```bash
# Check skill file
cat .github/skills/code-quality-reviewer/SKILL.md | head -10
```

### Aggregator finds no results

**Check:**
- Worker result files are in `outputs/` directory
- Files have `.json` extension
- Files are valid JSON

**Debug:**
```bash
# List all JSON files
find outputs -name "*.json" -type f
```

### Workflows fail on GitHub Actions

**Check:**
- npm dependencies installed
- TypeScript compiled successfully
- Artifacts uploaded/downloaded correctly

**Debug:**
```bash
# In workflow, add debug steps
- name: Debug outputs
  run: ls -laR outputs/
```

## Test Event Templates

### Minimal PR Event
```json
{
  "action": "opened",
  "pull_request": {
    "number": 1,
    "title": "Test PR",
    "body": "Test",
    "labels": [],
    "changed_files": 1
  },
  "repository": {
    "full_name": "owner/repo"
  }
}
```

### Minimal Issue Event
```json
{
  "action": "opened",
  "issue": {
    "number": 1,
    "title": "Test Issue",
    "body": "Test",
    "labels": []
  },
  "repository": {
    "full_name": "owner/repo"
  }
}
```

### Comment Event
```json
{
  "action": "created",
  "issue": {
    "number": 1,
    "title": "Test",
    "body": "Test",
    "labels": []
  },
  "comment": {
    "id": 1,
    "body": "@copilot test",
    "user": {
      "login": "test"
    }
  },
  "repository": {
    "full_name": "owner/repo"
  }
}
```

## Cleanup

```bash
# Remove test outputs
rm -rf outputs/

# Remove test artifacts
rm -f /tmp/test_*.txt
```

## Success Criteria

- [ ] Orchestrator generates valid worker plans for all event types
- [ ] Skill runner executes skills and produces structured output
- [ ] Aggregator combines results from multiple workers
- [ ] System handles worker failures gracefully
- [ ] Workflows have valid YAML syntax
- [ ] All scripts build without TypeScript errors
- [ ] GITHUB_OUTPUT uses correct format
- [ ] Concurrency controls prevent race conditions
