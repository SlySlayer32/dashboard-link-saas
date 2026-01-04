# Leveraging GitHub Actions, Skills & Sub-Agents for Custom PR/Issue Agents

## Overview

This guide shows how to create a multi-worker system where custom GitHub Copilot agents (for PRs and issues) can leverage GitHub Actions, skills, and sub-agents to improve their capabilities through parallel execution.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  GitHub Event (Issue/PR)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              GitHub Actions Workflow Trigger                 │
│  (on: issues, pull_request, issue_comment, etc.)            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Main Orchestrator Agent                       │
│  - Analyzes the issue/PR                                    │
│  - Determines which sub-agents/skills to activate           │
│  - Delegates work to parallel workers                       │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Worker 1    │  │  Worker 2    │  │  Worker 3    │
│  (Sub-Agent) │  │  (Sub-Agent) │  │  (Sub-Agent) │
│              │  │              │  │              │
│ + Skills     │  │ + Skills     │  │ + Skills     │
└──────────────┘  └──────────────┘  └──────────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Results Aggregation & Response                  │
│  - Combines outputs from all workers                        │
│  - Posts unified comment on PR/Issue                        │
│  - Creates commits if needed                                │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Strategy

### 1. GitHub Actions Workflow for Agent Orchestration

Create `.github/workflows/agent-orchestrator.yml`:

```yaml
name: AI Agent Orchestrator

on:
  issues:
    types: [opened, labeled]
  pull_request:
    types: [opened, synchronize, labeled]
  issue_comment:
    types: [created]

permissions:
  contents: write
  issues: write
  pull-requests: write

jobs:
  orchestrate:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Parse event and determine strategy
        id: strategy
        run: |
          # Analyze the event type and content
          # Determine which sub-agents to activate
          python3 scripts/agent-orchestrator.py parse-event
      
      - name: Activate Sub-Agents
        uses: ./.github/actions/sub-agent-runner
        with:
          strategy: ${{ steps.strategy.outputs.plan }}
          skills-path: .github/skills
          github-token: ${{ secrets.GITHUB_TOKEN }}

  # Parallel worker jobs
  code-review-worker:
    needs: orchestrate
    if: contains(needs.orchestrate.outputs.required-workers, 'code-review')
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Code Quality Review
        uses: ./.github/actions/skill-runner
        with:
          skill: code-quality-reviewer
          context: ${{ toJson(github.event) }}
      
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: code-review-results
          path: outputs/code-review.json

  architecture-review-worker:
    needs: orchestrate
    if: contains(needs.orchestrate.outputs.required-workers, 'architecture')
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Architecture Review
        uses: ./.github/actions/skill-runner
        with:
          skill: architecture-guide
          context: ${{ toJson(github.event) }}
      
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: architecture-results
          path: outputs/architecture.json

  error-fixing-worker:
    needs: orchestrate
    if: contains(needs.orchestrate.outputs.required-workers, 'error-fixing')
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Error Fixer
        uses: ./.github/actions/skill-runner
        with:
          skill: error-fixer
          context: ${{ toJson(github.event) }}
      
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: error-fixing-results
          path: outputs/error-fixing.json

  aggregate-results:
    needs: [code-review-worker, architecture-review-worker, error-fixing-worker]
    if: always()
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Download all artifacts
        uses: actions/download-artifact@v4
        with:
          path: outputs/
      
      - name: Aggregate and post results
        run: |
          python3 scripts/aggregate-results.py
          python3 scripts/post-to-github.py
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 2. Custom GitHub Action for Skill Runner

Create `.github/actions/skill-runner/action.yml`:

```yaml
name: 'Skill Runner'
description: 'Executes a specific skill with GitHub Copilot context'

inputs:
  skill:
    description: 'Name of the skill to execute'
    required: true
  context:
    description: 'JSON context from GitHub event'
    required: true
  github-token:
    description: 'GitHub token for API access'
    required: false
    default: ${{ github.token }}

outputs:
  result:
    description: 'JSON result from skill execution'
    value: ${{ steps.execute.outputs.result }}

runs:
  using: 'composite'
  steps:
    - name: Setup Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      shell: bash
      run: |
        pip install pyyaml anthropic openai
    
    - name: Load skill
      shell: bash
      run: |
        python3 scripts/load-skill.py \
          --skill ${{ inputs.skill }} \
          --context '${{ inputs.context }}'
    
    - name: Execute skill with AI
      id: execute
      shell: bash
      env:
        GITHUB_TOKEN: ${{ inputs.github-token }}
        ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      run: |
        python3 scripts/execute-skill.py \
          --skill ${{ inputs.skill }} \
          --output outputs/${{ inputs.skill }}.json
```

### 3. Agent Orchestrator Script

Create `scripts/agent-orchestrator.py`:

```python
#!/usr/bin/env python3
"""
Agent Orchestrator - Determines which sub-agents and skills to activate
based on GitHub event context.
"""

import json
import sys
import os
from typing import Dict, List, Set

class AgentOrchestrator:
    """Orchestrates sub-agents based on GitHub events."""
    
    def __init__(self, event_path: str):
        with open(event_path, 'r') as f:
            self.event = json.load(f)
        
        self.event_type = os.environ.get('GITHUB_EVENT_NAME', '')
        
    def parse_event(self) -> Dict[str, any]:
        """Analyze event and determine execution strategy."""
        
        strategy = {
            'required_workers': [],
            'priority': 'normal',
            'parallel_execution': True
        }
        
        # Analyze based on event type
        if self.event_type == 'pull_request':
            strategy['required_workers'] = self._analyze_pr()
        elif self.event_type == 'issues':
            strategy['required_workers'] = self._analyze_issue()
        elif self.event_type == 'issue_comment':
            strategy['required_workers'] = self._analyze_comment()
        
        return strategy
    
    def _analyze_pr(self) -> List[str]:
        """Determine workers needed for PR."""
        workers = set()
        
        pr = self.event.get('pull_request', {})
        
        # Check for code changes
        if pr.get('changed_files', 0) > 0:
            workers.add('code-review')
        
        # Check PR title/body for keywords
        title = pr.get('title', '').lower()
        body = pr.get('body', '').lower()
        
        if any(kw in title or kw in body for kw in ['plugin', 'adapter', 'architecture']):
            workers.add('architecture')
        
        if any(kw in title or kw in body for kw in ['error', 'fix', 'bug']):
            workers.add('error-fixing')
        
        if any(kw in title or kw in body for kw in ['refactor', 'rename']):
            workers.add('naming')
        
        # Always plan next steps for PRs
        workers.add('next-steps')
        
        return list(workers)
    
    def _analyze_issue(self) -> List[str]:
        """Determine workers needed for issue."""
        workers = set()
        
        issue = self.event.get('issue', {})
        title = issue.get('title', '').lower()
        body = issue.get('body', '').lower()
        labels = [l.get('name', '') for l in issue.get('labels', [])]
        
        # Check labels
        if 'bug' in labels:
            workers.update(['code-review', 'error-fixing'])
        
        if 'enhancement' in labels or 'feature' in labels:
            workers.update(['architecture', 'next-steps'])
        
        if 'question' in labels:
            workers.add('next-steps')
        
        # Check content
        if any(kw in title or kw in body for kw in ['missing logic', 'code quality']):
            workers.add('code-review')
        
        if any(kw in title or kw in body for kw in ['name', 'naming', 'convention']):
            workers.add('naming')
        
        return list(workers)
    
    def _analyze_comment(self) -> List[str]:
        """Determine workers needed for comment."""
        workers = set()
        
        comment = self.event.get('comment', {})
        body = comment.get('body', '').lower()
        
        # Check if comment mentions the bot
        if '@copilot' not in body:
            return []
        
        # Parse command
        if 'review' in body or 'quality' in body:
            workers.add('code-review')
        
        if 'architecture' in body or 'pattern' in body:
            workers.add('architecture')
        
        if 'fix' in body or 'error' in body:
            workers.add('error-fixing')
        
        if 'next' in body or 'what should' in body:
            workers.add('next-steps')
        
        if 'name' in body or 'naming' in body:
            workers.add('naming')
        
        return list(workers)

def main():
    """Main execution."""
    if len(sys.argv) < 2:
        print("Usage: agent-orchestrator.py <command>")
        sys.exit(1)
    
    command = sys.argv[1]
    event_path = os.environ.get('GITHUB_EVENT_PATH', '')
    
    if command == 'parse-event':
        orchestrator = AgentOrchestrator(event_path)
        strategy = orchestrator.parse_event()
        
        # Output for GitHub Actions
        print(f"::set-output name=required-workers::{json.dumps(strategy['required_workers'])}")
        print(f"::set-output name=priority::{strategy['priority']}")
        print(f"::set-output name=parallel::{str(strategy['parallel_execution']).lower()}")
        
        # Save detailed plan
        with open('outputs/strategy.json', 'w') as f:
            json.dump(strategy, f, indent=2)

if __name__ == '__main__':
    main()
```

### 4. Skill Execution Script

Create `scripts/execute-skill.py`:

```python
#!/usr/bin/env python3
"""
Skill Executor - Loads and executes skills with AI context.
"""

import json
import yaml
import argparse
from pathlib import Path
from typing import Dict, List

class SkillExecutor:
    """Executes a skill with AI assistance."""
    
    def __init__(self, skill_name: str, skills_path: Path):
        self.skill_name = skill_name
        self.skill_path = skills_path / skill_name
        self.skill_data = self._load_skill()
    
    def _load_skill(self) -> Dict:
        """Load skill metadata and content."""
        skill_md = self.skill_path / 'SKILL.md'
        
        with open(skill_md, 'r') as f:
            content = f.read()
        
        # Parse frontmatter
        parts = content.split('---', 2)
        frontmatter = yaml.safe_load(parts[1])
        body = parts[2].strip()
        
        # Load references
        references = {}
        ref_path = self.skill_path / 'references'
        if ref_path.exists():
            for ref_file in ref_path.glob('*'):
                if ref_file.is_file():
                    references[ref_file.name] = ref_file.read_text()
        
        return {
            'metadata': frontmatter,
            'body': body,
            'references': references
        }
    
    def execute(self, context: Dict) -> Dict:
        """Execute skill with given context."""
        
        # Build prompt for AI
        prompt = self._build_prompt(context)
        
        # Call AI (using Anthropic Claude or OpenAI)
        result = self._call_ai(prompt)
        
        return {
            'skill': self.skill_name,
            'context': context,
            'result': result,
            'status': 'completed'
        }
    
    def _build_prompt(self, context: Dict) -> str:
        """Build AI prompt from skill and context."""
        
        prompt_parts = [
            f"# Skill: {self.skill_data['metadata']['name']}",
            f"\n## Description\n{self.skill_data['metadata']['description']}",
            f"\n## Instructions\n{self.skill_data['body']}",
            f"\n## Context\n```json\n{json.dumps(context, indent=2)}\n```",
            "\n## Task\nFollow the skill instructions above to analyze the context and provide guidance."
        ]
        
        return '\n'.join(prompt_parts)
    
    def _call_ai(self, prompt: str) -> Dict:
        """Call AI API with prompt."""
        # Implementation depends on your AI provider
        # Example with Anthropic Claude:
        
        import anthropic
        import os
        
        client = anthropic.Anthropic(
            api_key=os.environ.get('ANTHROPIC_API_KEY')
        )
        
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4000,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )
        
        return {
            'response': message.content[0].text,
            'model': 'claude-3-5-sonnet',
            'tokens': {
                'input': message.usage.input_tokens,
                'output': message.usage.output_tokens
            }
        }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--skill', required=True)
    parser.add_argument('--context-file', default='outputs/context.json')
    parser.add_argument('--output', required=True)
    
    args = parser.parse_args()
    
    # Load context
    with open(args.context_file, 'r') as f:
        context = json.load(f)
    
    # Execute skill
    executor = SkillExecutor(args.skill, Path('.github/skills'))
    result = executor.execute(context)
    
    # Save output
    with open(args.output, 'w') as f:
        json.dump(result, f, indent=2)

if __name__ == '__main__':
    main()
```

### 5. Results Aggregator

Create `scripts/aggregate-results.py`:

```python
#!/usr/bin/env python3
"""
Results Aggregator - Combines outputs from parallel workers.
"""

import json
from pathlib import Path
from typing import List, Dict

class ResultsAggregator:
    """Aggregates results from multiple workers."""
    
    def __init__(self, outputs_dir: Path):
        self.outputs_dir = outputs_dir
    
    def aggregate(self) -> Dict:
        """Combine all worker outputs."""
        
        results = []
        
        # Find all result files
        for result_file in self.outputs_dir.glob('**/*.json'):
            if result_file.name == 'aggregated.json':
                continue
            
            with open(result_file, 'r') as f:
                results.append(json.load(f))
        
        # Combine results
        aggregated = {
            'summary': self._create_summary(results),
            'workers': results,
            'recommendations': self._create_recommendations(results),
            'priority_actions': self._prioritize_actions(results)
        }
        
        return aggregated
    
    def _create_summary(self, results: List[Dict]) -> str:
        """Create executive summary."""
        parts = [
            "# Multi-Agent Analysis Results\n",
            f"Executed {len(results)} specialized workers:\n"
        ]
        
        for result in results:
            skill = result.get('skill', 'unknown')
            status = result.get('status', 'unknown')
            parts.append(f"- {skill}: {status}")
        
        return '\n'.join(parts)
    
    def _create_recommendations(self, results: List[Dict]) -> List[str]:
        """Extract actionable recommendations."""
        recommendations = []
        
        for result in results:
            response = result.get('result', {}).get('response', '')
            # Parse recommendations from AI response
            # (implementation depends on response format)
            
        return recommendations
    
    def _prioritize_actions(self, results: List[Dict]) -> List[Dict]:
        """Prioritize actions across all workers."""
        actions = []
        
        # Extract and prioritize actions
        # (implementation depends on your needs)
        
        return sorted(actions, key=lambda x: x.get('priority', 999))

def main():
    aggregator = ResultsAggregator(Path('outputs'))
    aggregated = aggregator.aggregate()
    
    with open('outputs/aggregated.json', 'w') as f:
        json.dump(aggregated, f, indent=2)
    
    print("✅ Results aggregated successfully")

if __name__ == '__main__':
    main()
```

## Usage Examples

### Example 1: PR Review with Multiple Workers

When a PR is opened:

1. **Orchestrator** analyzes PR and activates:
   - `code-review-worker` (checks code quality)
   - `architecture-review-worker` (validates patterns)
   - `next-steps-worker` (suggests what to do after merge)

2. **Workers execute in parallel**:
   ```
   [code-review-worker]    [architecture-worker]    [next-steps-worker]
          ↓                         ↓                        ↓
   Lint errors found        Zapier pattern OK        Post-merge: deploy
   Missing tests            RLS enforced             Update docs
   No error handling        Adapter correct          Monitor metrics
   ```

3. **Aggregator combines**:
   ```markdown
   ## PR Review Summary
   
   ### Code Quality (⚠️ Issues Found)
   - 3 lint errors in workerService.ts
   - Missing error handling in 2 locations
   - No tests for new feature
   
   ### Architecture (✅ Approved)
   - Follows Zapier pattern correctly
   - RLS policies enforced
   - Adapter implements contract properly
   
   ### Next Steps After Merge
   1. Deploy to staging
   2. Update API documentation
   3. Monitor error rates
   ```

### Example 2: Issue Triage with Skills

When issue is created with "find missing logic":

1. **Orchestrator** detects keywords and activates:
   - `code-review-worker` with `code-quality-reviewer` skill

2. **Worker executes**:
   - Loads skill instructions
   - Runs automated checks
   - Analyzes code patterns
   - Generates report

3. **Posts comment**:
   ```markdown
   @user I've analyzed the codebase for missing logic:
   
   **High Priority**
   - Missing error handling in WorkerService.create() (line 45)
   - No loading state in WorkerList component
   
   **Medium Priority**
   - Missing pagination in workers endpoint
   
   See detailed checklist in attached artifact.
   ```

## Best Practices

### 1. Worker Isolation
- Each worker runs in separate job
- No shared state between workers
- Results communicated via artifacts

### 2. Efficient Skill Loading
- Load only required skills
- Use progressive disclosure
- Cache skill metadata

### 3. Parallel Execution
- Independent workers run simultaneously
- Reduces total execution time
- Use matrix strategy for scalability

### 4. Cost Management
- Set timeouts for AI calls
- Limit parallel workers based on priority
- Cache AI responses when possible

### 5. Error Handling
- Graceful degradation if worker fails
- Continue with partial results
- Report worker failures clearly

## Advanced Features

### Dynamic Worker Scaling

```yaml
jobs:
  determine-workers:
    outputs:
      worker-matrix: ${{ steps.plan.outputs.matrix }}
    
    steps:
      - id: plan
        run: |
          # Generate dynamic matrix based on analysis
          echo "matrix={\"worker\":[\"code-review\",\"architecture\"]}" >> $GITHUB_OUTPUT

  execute-workers:
    needs: determine-workers
    strategy:
      matrix: ${{ fromJson(needs.determine-workers.outputs.worker-matrix) }}
    
    steps:
      - name: Run ${{ matrix.worker }}
        uses: ./.github/actions/skill-runner
        with:
          skill: ${{ matrix.worker }}
```

### Skill Chaining

Workers can invoke other workers:

```python
# In worker A
if needs_architecture_review:
    trigger_worker('architecture-review-worker', context)
```

### Caching for Speed

```yaml
- name: Cache skill metadata
  uses: actions/cache@v4
  with:
    path: .github/skills/**/SKILL.md
    key: skills-${{ hashFiles('.github/skills/**') }}
```

## Summary

This system provides:

✅ **Parallel Execution** - Multiple workers running simultaneously
✅ **Skill Integration** - Workers leverage existing skills
✅ **Sub-Agent Pattern** - Specialized agents for specific tasks
✅ **Scalable** - Easy to add new workers/skills
✅ **Cost-Efficient** - Only runs what's needed
✅ **GitHub Native** - Uses Actions, artifacts, comments

The key insight is treating each skill as a specialized worker that can be executed in parallel, with an orchestrator that intelligently determines which workers to activate based on the GitHub event context.
