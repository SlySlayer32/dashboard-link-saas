# AI Agent Skill: Playbook & Plan Engineering

## Skill Overview

### Purpose

This skill enables AI agents to autonomously create, refactor, and ingest execution playbooks that are deterministic, testable, and ready for zero-shot agent execution. It transforms informal plans, rough playbooks, and user descriptions into production-grade orchestration scaffolds with:

- **YAML orchestration patterns** for state machines and workflow graphs
- **Strict JSON tool schemas** for type-safe API boundaries
- **ReAct decision trees** implementing planner → executor → verifier patterns
- **Inline test commands** for validation at each step
- **Code stubs** for immediate zero-shot execution

### Why This Matters

Raw playbooks lack the structure needed for autonomous agent execution. They contain ambiguous instructions, missing error paths, and no verification steps. This skill bridges the gap between human planning and machine execution by:

1. **Determinism**: Every step has clear inputs, outputs, and success criteria
2. **Resilience**: Error handling and retry logic are first-class citizens
3. **Observability**: Checkpoints and logging built into every phase
4. **Testability**: Inline commands verify correctness at each stage
5. **Composability**: Reusable patterns that agents can assemble

### Core Transformation

```
Raw Plan → Enhanced Playbook → Agent Scaffold → Executable Workflow
```

---

## Input Formats

The skill accepts three primary input types:

### 1. Existing Playbooks (Markdown)

**Characteristics:**
- Human-readable step-by-step instructions
- May lack explicit decision points
- Often missing error handling
- No formal state management

**Example:**
```markdown
# Deploy API to Production

1. Build the Docker image
2. Push to registry
3. Update Kubernetes manifests
4. Apply changes
5. Verify deployment
```

### 2. Rough Plans (Text/Outline)

**Characteristics:**
- High-level goals without implementation details
- May contain branching logic ("if X then Y")
- Lacks tool specifications
- No validation criteria

**Example:**
```
Goal: Set up user authentication

- Configure Supabase auth
- Add RLS policies
- Create login/signup flows
- Test with real users
```

### 3. User Descriptions (Natural Language)

**Characteristics:**
- Intent-based ("I need to...")
- May be ambiguous or incomplete
- Requires inference of implementation steps
- No technical specifications

**Example:**
```
We need a system to sync worker data from Connecteam to our database 
every hour and send SMS notifications when shifts change.
```

### Input Metadata (Optional)

Enhance input with structured context:

```yaml
input_context:
  domain: "DevOps" | "Data Pipeline" | "User Flow" | "Backend Service"
  complexity: "simple" | "moderate" | "complex"
  dependencies: ["service-name", "database-schema"]
  constraints: ["must be idempotent", "max 30min execution"]
  existing_patterns: ["expand-contract migration", "async job queue"]
```

---

## Output Specifications

### Enhanced Playbook Structure

Every enhanced playbook follows this canonical structure:

```markdown
# [Playbook Title]

## Meta

```yaml
version: "1.0.0"
domain: "DevOps|DataPipeline|UserFlow|BackendService"
estimated_duration: "30m"
prerequisites:
  - service: "database"
    status: "running"
  - env_vars: ["SUPABASE_URL", "SUPABASE_KEY"]
checkpoints:
  - id: "checkpoint_1"
    rollback_command: "pnpm db:rollback"
```

## State Machine

```yaml
orchestration:
  type: "langgraph_stategraph"
  nodes:
    - id: "validate_prerequisites"
      type: "validator"
      next: ["setup_environment", "abort_missing_deps"]
    
    - id: "setup_environment"
      type: "executor"
      tools: ["create_env_file", "install_dependencies"]
      next: ["run_migrations", "rollback_on_error"]
    
    - id: "run_migrations"
      type: "executor"
      checkpoint: "checkpoint_1"
      tools: ["database_migrate"]
      next: ["verify_schema", "rollback_on_error"]
    
    - id: "verify_schema"
      type: "verifier"
      validation: "schema_matches_expected"
      next: ["complete", "rollback_on_error"]
    
    - id: "rollback_on_error"
      type: "error_handler"
      action: "restore_checkpoint"
      next: ["abort"]
    
    - id: "complete"
      type: "terminal"
      state: "success"
    
    - id: "abort"
      type: "terminal"
      state: "failure"
  
  edges:
    - from: "validate_prerequisites"
      to: "setup_environment"
      condition: "all_prerequisites_met"
    
    - from: "validate_prerequisites"
      to: "abort_missing_deps"
      condition: "any_prerequisite_missing"
  
  conditional_edges:
    - source: "setup_environment"
      router: "check_exit_code"
      destinations:
        success: "run_migrations"
        failure: "rollback_on_error"
```

## Tool Schemas

```json
{
  "tools": [
    {
      "name": "create_env_file",
      "schema": {
        "type": "object",
        "properties": {
          "template_path": { "type": "string" },
          "output_path": { "type": "string" },
          "variables": {
            "type": "object",
            "additionalProperties": { "type": "string" }
          }
        },
        "required": ["template_path", "output_path"]
      },
      "implementation": "bash",
      "command_template": "cp {template_path} {output_path} && envsubst < {template_path} > {output_path}",
      "idempotent": true,
      "timeout_seconds": 30
    },
    {
      "name": "database_migrate",
      "schema": {
        "type": "object",
        "properties": {
          "direction": { "enum": ["up", "down"] },
          "target_version": { "type": "string", "pattern": "^[0-9]+$" }
        },
        "required": ["direction"]
      },
      "implementation": "pnpm",
      "command_template": "pnpm --filter @dashboard-link/database migrate:{direction}",
      "idempotent": false,
      "checkpoint_before": true,
      "timeout_seconds": 300
    }
  ]
}
```

## ReAct Decision Tree

```yaml
react_phases:
  - phase: "PLAN"
    agent_role: "planner"
    thought_prompt: |
      Given the goal: [GOAL]
      Current state: [STATE]
      Available tools: [TOOLS]
      
      Decide:
      1. What is the next logical step?
      2. Which tool(s) are needed?
      3. What are the success criteria?
      4. What could go wrong?
    
    output_format:
      type: "structured"
      schema:
        next_action: "string"
        tool_call: "object"
        expected_outcome: "string"
        failure_modes: "array[string]"
  
  - phase: "EXECUTE"
    agent_role: "executor"
    action_pattern: |
      Execute tool: [TOOL_NAME]
      With params: [PARAMS]
      Capture: stdout, stderr, exit_code, duration
    
    error_handling:
      - condition: "exit_code != 0"
        action: "invoke_error_handler"
        context: "preserve_stderr_for_debugging"
      
      - condition: "timeout_exceeded"
        action: "cancel_and_rollback"
        context: "mark_checkpoint_dirty"
  
  - phase: "OBSERVE"
    agent_role: "observer"
    observation_prompt: |
      Tool execution complete.
      Exit code: [EXIT_CODE]
      Output: [STDOUT]
      Errors: [STDERR]
      Duration: [DURATION]
      
      Does this match expected outcome: [EXPECTED_OUTCOME]?
      
      - YES → transition to VERIFY
      - NO → transition to ERROR_RECOVERY
      - PARTIAL → log anomaly, continue with caution
  
  - phase: "VERIFY"
    agent_role: "verifier"
    verification_tests:
      - type: "assertion"
        command: "test -f {output_path}"
        expect: "exit_code == 0"
      
      - type: "schema_validation"
        command: "pnpm run validate:config"
        expect: "stdout contains 'PASS'"
      
      - type: "integration"
        command: "curl -f http://localhost:3000/health"
        expect: "status_code == 200"
    
    on_failure:
      transition_to: "ERROR_RECOVERY"
      preserve_state: true
```

## Inline Test Commands

```bash
# Validate Prerequisites
test -n "$SUPABASE_URL" || (echo "Missing SUPABASE_URL" && exit 1)
test -n "$SUPABASE_KEY" || (echo "Missing SUPABASE_KEY" && exit 1)

# Verify Environment Setup
test -f .env && grep -q "SUPABASE_URL" .env || exit 1

# Check Migration Success
pnpm --filter @dashboard-link/database db:status | grep -q "up to date" || exit 1

# Validate Schema
psql $DATABASE_URL -c "\dt" | grep -q "users" || exit 1

# End-to-End Smoke Test
curl -f http://localhost:3000/api/health && echo "✓ API responding"
```

## Code Stubs

```typescript
// packages/playbook-executor/src/nodes/validate-prerequisites.ts

import { StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

interface PlaybookState {
  prerequisites: Record<string, boolean>;
  errors: string[];
  checkpoint_id?: string;
}

export async function validatePrerequisites(
  state: PlaybookState
): Promise<PlaybookState> {
  const required = ["SUPABASE_URL", "SUPABASE_KEY"];
  const missing: string[] = [];
  
  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
      state.prerequisites[envVar] = false;
    } else {
      state.prerequisites[envVar] = true;
    }
  }
  
  if (missing.length > 0) {
    state.errors.push(`Missing required environment variables: ${missing.join(", ")}`);
  }
  
  return state;
}

export function shouldAbort(state: PlaybookState): boolean {
  return state.errors.length > 0;
}

// LangGraph orchestration
const workflow = new StateGraph<PlaybookState>({
  channels: {
    prerequisites: { value: () => ({}) },
    errors: { value: () => [] },
    checkpoint_id: { value: (x, y) => y ?? x },
  }
});

workflow.addNode("validate", validatePrerequisites);
workflow.addNode("execute", executePlaybook);
workflow.addNode("abort", abortWithCleanup);

workflow.addEdge("__start__", "validate");
workflow.addConditionalEdges(
  "validate",
  shouldAbort,
  {
    true: "abort",
    false: "execute",
  }
);

export const graph = workflow.compile({
  checkpointer: new SqliteSaver(/* connection */),
});
```
```

### Key Output Components

1. **Meta Block**: Version, domain, duration, prerequisites
2. **State Machine**: Nodes, edges, conditional routing
3. **Tool Schemas**: JSON schemas with implementation details
4. **ReAct Tree**: Planner → Executor → Observer → Verifier cycle
5. **Test Commands**: Inline bash/shell validation
6. **Code Stubs**: TypeScript/Python scaffolds for execution

---

## Decision Trees

### Pattern Selection Logic

Use this decision tree to choose the right orchestration pattern:

```yaml
decision_tree:
  root:
    question: "Is this a linear sequence with no branching?"
    yes: "simple_pipeline"
    no: "check_complexity"
  
  check_complexity:
    question: "Are there conditional branches or loops?"
    yes: "check_error_handling"
    no: "simple_pipeline"
  
  check_error_handling:
    question: "Does it require rollback or compensation?"
    yes: "use_stategraph_with_checkpoints"
    no: "use_basic_stategraph"
  
  use_stategraph_with_checkpoints:
    pattern: "langgraph_stategraph_checkpointed"
    components:
      - "StateGraph with SqliteSaver"
      - "Checkpoint nodes before risky operations"
      - "Rollback nodes for error paths"
      - "Conditional edges with error routing"
  
  use_basic_stategraph:
    pattern: "langgraph_stategraph_basic"
    components:
      - "StateGraph with in-memory state"
      - "Conditional edges for branching"
      - "No explicit rollback (retry only)"
  
  simple_pipeline:
    pattern: "linear_executor"
    components:
      - "Sequential tool execution"
      - "Exit on first error"
      - "No state persistence"
```

### Tool Implementation Decision

```yaml
tool_implementation:
  bash_script:
    when:
      - "File system operations"
      - "Simple command execution"
      - "No complex error handling needed"
    template: |
      {
        "implementation": "bash",
        "command_template": "...",
        "idempotent": true/false
      }
  
  typescript_function:
    when:
      - "Complex business logic"
      - "API calls with retries"
      - "Structured data transformation"
    template: |
      {
        "implementation": "typescript",
        "function_path": "path/to/function.ts",
        "export_name": "functionName"
      }
  
  pnpm_script:
    when:
      - "Package-specific commands"
      - "Build/test/deploy tasks"
      - "Workspace operations"
    template: |
      {
        "implementation": "pnpm",
        "command_template": "pnpm --filter @scope/package script-name"
      }
```

### Error Handling Strategy

```yaml
error_strategy:
  retry_with_backoff:
    when: "Transient failures (network, rate limits)"
    pattern: "exponential_backoff"
    config:
      max_attempts: 3
      initial_delay_ms: 1000
      backoff_multiplier: 2
  
  rollback_to_checkpoint:
    when: "State corruption or partial failure"
    pattern: "restore_checkpoint"
    config:
      checkpoint_strategy: "before_each_mutation"
      cleanup_on_rollback: true
  
  compensating_transaction:
    when: "Distributed operations (can't rollback)"
    pattern: "saga_compensation"
    config:
      track_operations: true
      compensation_order: "reverse"
  
  fail_fast:
    when: "Invalid preconditions or config errors"
    pattern: "abort_immediately"
    config:
      preserve_logs: true
      notify_operator: true
```

---

## Pattern Library

### Pattern 1: Linear Pipeline

**Use Case:** Simple sequential tasks with no branching

```yaml
pattern: linear_pipeline
structure:
  nodes:
    - validate_input
    - execute_task
    - verify_output
  edges:
    - validate_input -> execute_task
    - execute_task -> verify_output
```

**Code Template:**

```typescript
async function executePipeline(input: PipelineInput): Promise<PipelineOutput> {
  // Step 1: Validate
  const validated = await validateInput(input);
  if (!validated.success) {
    throw new Error(validated.error);
  }
  
  // Step 2: Execute
  const result = await executeTask(validated.data);
  
  // Step 3: Verify
  const verified = await verifyOutput(result);
  if (!verified.success) {
    throw new Error("Output validation failed");
  }
  
  return verified.data;
}
```

### Pattern 2: Conditional Branching

**Use Case:** Different paths based on runtime conditions

```yaml
pattern: conditional_branch
structure:
  nodes:
    - check_condition
    - path_a
    - path_b
    - merge_results
  conditional_edges:
    - from: check_condition
      router: evaluate_condition
      destinations:
        true: path_a
        false: path_b
```

**Code Template:**

```typescript
const workflow = new StateGraph<BranchState>({
  channels: {
    condition_met: { value: (x, y) => y ?? x },
    result: { value: (x, y) => y ?? x },
  }
});

workflow.addNode("check", async (state) => {
  const conditionMet = await evaluateCondition(state);
  return { ...state, condition_met: conditionMet };
});

workflow.addNode("path_a", async (state) => {
  return { ...state, result: await executePathA(state) };
});

workflow.addNode("path_b", async (state) => {
  return { ...state, result: await executePathB(state) };
});

workflow.addConditionalEdges(
  "check",
  (state) => state.condition_met,
  {
    true: "path_a",
    false: "path_b",
  }
);
```

### Pattern 3: Retry with Exponential Backoff

**Use Case:** External API calls, transient failures

```yaml
pattern: retry_with_backoff
config:
  max_attempts: 3
  initial_delay_ms: 1000
  multiplier: 2
  max_delay_ms: 10000
```

**Code Template:**

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let attempt = 0;
  let delay = config.initial_delay_ms;
  
  while (attempt < config.max_attempts) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      
      if (attempt >= config.max_attempts) {
        throw error;
      }
      
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
      
      delay = Math.min(delay * config.multiplier, config.max_delay_ms);
    }
  }
  
  throw new Error("Max retries exceeded");
}
```

### Pattern 4: Checkpointed Workflow

**Use Case:** Long-running processes that need rollback capability

```yaml
pattern: checkpointed_workflow
structure:
  nodes:
    - checkpoint_1_setup
    - risky_operation
    - checkpoint_2_verify
    - finalize
  error_nodes:
    - rollback_to_checkpoint_1
    - rollback_to_checkpoint_2
```

**Code Template:**

```typescript
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";

const checkpointer = new SqliteSaver("checkpoints.db");

const workflow = new StateGraph<WorkflowState>({
  channels: {
    checkpoint_id: { value: (x, y) => y ?? x },
    data: { value: (x, y) => y ?? x },
  }
});

workflow.addNode("setup", async (state) => {
  const data = await setupResources();
  return {
    ...state,
    checkpoint_id: "checkpoint_1",
    data,
  };
});

workflow.addNode("risky", async (state) => {
  try {
    const result = await riskyOperation(state.data);
    return { ...state, data: result };
  } catch (error) {
    // Rollback will restore to checkpoint_1
    throw error;
  }
});

const graph = workflow.compile({ checkpointer });

// Execution with checkpoint recovery
const threadId = "workflow-123";
try {
  await graph.invoke(initialState, { configurable: { thread_id: threadId } });
} catch (error) {
  // Restore from last checkpoint
  const state = await checkpointer.get({ configurable: { thread_id: threadId } });
  console.log("Restored from checkpoint:", state.checkpoint_id);
}
```

### Pattern 5: Orchestrator-Worker

**Use Case:** Parallel task execution with central coordination

```yaml
pattern: orchestrator_worker
structure:
  nodes:
    - orchestrator
    - worker_pool
    - aggregator
  parallel_execution:
    workers: 4
    task_distribution: "round_robin"
```

**Code Template:**

```typescript
async function orchestrateWork(tasks: Task[]): Promise<Result[]> {
  const workers = Array.from({ length: 4 }, () => createWorker());
  const taskQueue = [...tasks];
  const results: Result[] = [];
  
  // Distribute tasks to workers
  const promises = workers.map(async (worker) => {
    while (taskQueue.length > 0) {
      const task = taskQueue.shift();
      if (!task) break;
      
      try {
        const result = await worker.execute(task);
        results.push(result);
      } catch (error) {
        console.error(`Task ${task.id} failed:`, error);
        // Re-queue or handle error
      }
    }
  });
  
  await Promise.all(promises);
  return results;
}
```

### Pattern 6: ReAct Loop

**Use Case:** Agent decision-making with iterative refinement

```yaml
pattern: react_loop
phases:
  - thought
  - action
  - observation
  - reflection
max_iterations: 10
```

**Code Template:**

```typescript
interface ReActState {
  goal: string;
  thought: string;
  action: ToolCall | null;
  observation: string;
  iteration: number;
  completed: boolean;
}

async function reactLoop(goal: string, tools: Tool[]): Promise<string> {
  let state: ReActState = {
    goal,
    thought: "",
    action: null,
    observation: "",
    iteration: 0,
    completed: false,
  };
  
  while (!state.completed && state.iteration < 10) {
    // THOUGHT: Plan next action
    state.thought = await llm.generate(
      `Goal: ${state.goal}\nPrevious observation: ${state.observation}\nWhat should I do next?`
    );
    
    // ACTION: Execute tool
    state.action = parseToolCall(state.thought);
    if (!state.action) {
      state.completed = true;
      break;
    }
    
    const tool = tools.find(t => t.name === state.action!.name);
    const result = await tool!.execute(state.action!.params);
    
    // OBSERVATION: Record outcome
    state.observation = JSON.stringify(result);
    
    // REFLECTION: Check if goal is met
    const reflection = await llm.generate(
      `Goal: ${state.goal}\nAction taken: ${state.action.name}\nResult: ${state.observation}\nIs the goal achieved?`
    );
    
    state.completed = reflection.includes("YES") || reflection.includes("COMPLETE");
    state.iteration++;
  }
  
  return state.observation;
}
```

---

## Validation Criteria

### Checklist for Enhanced Playbooks

Every generated playbook MUST satisfy these criteria:

#### 1. Structural Completeness

- [ ] Meta block with version, domain, duration, prerequisites
- [ ] State machine with explicit nodes and edges
- [ ] At least one conditional edge (or justification for linear flow)
- [ ] Terminal nodes for success and failure states

#### 2. Tool Specifications

- [ ] Every tool has a strict JSON schema
- [ ] Implementation type specified (bash/typescript/pnpm)
- [ ] Idempotency flag set correctly
- [ ] Timeout values defined

#### 3. Error Handling

- [ ] Error paths defined for each risky operation
- [ ] Rollback nodes or compensation logic present
- [ ] Retry configuration for transient failures
- [ ] Failure mode documentation

#### 4. Testability

- [ ] Inline test commands for validation
- [ ] Assertions for success criteria
- [ ] Smoke tests for end-to-end verification
- [ ] Observable outputs (logs, metrics, status codes)

#### 5. Code Stubs

- [ ] TypeScript/Python scaffolds provided
- [ ] Function signatures match tool schemas
- [ ] LangGraph integration code included
- [ ] Example usage provided

#### 6. Determinism

- [ ] No ambiguous steps ("manually check", "verify somehow")
- [ ] All inputs and outputs explicitly typed
- [ ] Conditional logic has exhaustive branches
- [ ] No hidden state or side effects

### Automated Validation Script

```bash
#!/bin/bash
# validate-playbook.sh

PLAYBOOK_FILE=$1

echo "Validating playbook: $PLAYBOOK_FILE"

# Check for required sections
grep -q "## Meta" "$PLAYBOOK_FILE" || { echo "❌ Missing Meta block"; exit 1; }
grep -q "## State Machine" "$PLAYBOOK_FILE" || { echo "❌ Missing State Machine"; exit 1; }
grep -q "## Tool Schemas" "$PLAYBOOK_FILE" || { echo "❌ Missing Tool Schemas"; exit 1; }
grep -q "## ReAct Decision Tree" "$PLAYBOOK_FILE" || { echo "❌ Missing ReAct Decision Tree"; exit 1; }

# Validate YAML syntax
yq eval '.orchestration' "$PLAYBOOK_FILE" > /dev/null 2>&1 || {
  echo "❌ Invalid YAML in State Machine"
  exit 1
}

# Validate JSON schemas
# Extract JSON blocks and validate each
echo "✓ All required sections present"

# Check for terminal nodes
grep -q 'state: "success"' "$PLAYBOOK_FILE" || {
  echo "❌ Missing success terminal node"
  exit 1
}

grep -q 'state: "failure"' "$PLAYBOOK_FILE" || {
  echo "❌ Missing failure terminal node"
  exit 1
}

echo "✓ Terminal nodes defined"

# Verify code stubs have proper syntax
# ... additional checks ...

echo "✅ Playbook validation passed"
```

---

## Example Transformations

### Example 1: Simple → Enhanced (Database Migration)

#### BEFORE (Raw Plan)

```markdown
# Database Migration Playbook

1. Backup the database
2. Run migrations
3. Verify schema
4. Restart services
```

#### AFTER (Enhanced Playbook)

```markdown
# Database Migration Playbook

## Meta

```yaml
version: "1.0.0"
domain: "DataPipeline"
estimated_duration: "15m"
prerequisites:
  - service: "postgresql"
    status: "running"
  - env_vars: ["DATABASE_URL", "BACKUP_PATH"]
checkpoints:
  - id: "pre_migration"
    rollback_command: "pg_restore -d $DATABASE_URL $BACKUP_PATH/backup.dump"
```

## State Machine

```yaml
orchestration:
  type: "langgraph_stategraph"
  nodes:
    - id: "backup_database"
      type: "executor"
      checkpoint: "pre_migration"
      tools: ["pg_dump"]
      next: ["run_migrations"]
    
    - id: "run_migrations"
      type: "executor"
      tools: ["pnpm_migrate"]
      next: ["verify_schema", "rollback_on_error"]
    
    - id: "verify_schema"
      type: "verifier"
      tools: ["schema_validation"]
      next: ["restart_services", "rollback_on_error"]
    
    - id: "restart_services"
      type: "executor"
      tools: ["systemctl_restart"]
      next: ["complete"]
    
    - id: "rollback_on_error"
      type: "error_handler"
      action: "restore_checkpoint"
      next: ["abort"]
    
    - id: "complete"
      type: "terminal"
      state: "success"
    
    - id: "abort"
      type: "terminal"
      state: "failure"
```

## Tool Schemas

```json
{
  "tools": [
    {
      "name": "pg_dump",
      "schema": {
        "type": "object",
        "properties": {
          "database_url": { "type": "string" },
          "output_path": { "type": "string" }
        },
        "required": ["database_url", "output_path"]
      },
      "implementation": "bash",
      "command_template": "pg_dump {database_url} > {output_path}/backup-$(date +%Y%m%d-%H%M%S).dump",
      "idempotent": true,
      "timeout_seconds": 300
    },
    {
      "name": "pnpm_migrate",
      "schema": {
        "type": "object",
        "properties": {
          "direction": { "enum": ["up"] }
        }
      },
      "implementation": "pnpm",
      "command_template": "pnpm --filter @dashboard-link/database migrate:up",
      "idempotent": false,
      "timeout_seconds": 600
    },
    {
      "name": "schema_validation",
      "schema": {},
      "implementation": "bash",
      "command_template": "psql $DATABASE_URL -c '\\dt' | grep -E 'users|organizations|workers'",
      "idempotent": true,
      "timeout_seconds": 30
    }
  ]
}
```

## Inline Test Commands

```bash
# Verify backup exists
test -f $BACKUP_PATH/backup-*.dump || (echo "Backup failed" && exit 1)

# Check migration status
pnpm --filter @dashboard-link/database db:status | grep -q "up to date" || exit 1

# Validate critical tables
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users" > /dev/null || exit 1
psql $DATABASE_URL -c "SELECT COUNT(*) FROM organizations" > /dev/null || exit 1
```

## Code Stub

```typescript
import { StateGraph } from "@langchain/langgraph";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface MigrationState {
  backup_path?: string;
  migration_success?: boolean;
  schema_valid?: boolean;
}

async function backupDatabase(state: MigrationState): Promise<MigrationState> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `${process.env.BACKUP_PATH}/backup-${timestamp}.dump`;
  
  await execAsync(`pg_dump ${process.env.DATABASE_URL} > ${backupPath}`);
  
  return { ...state, backup_path: backupPath };
}

async function runMigrations(state: MigrationState): Promise<MigrationState> {
  const { stdout } = await execAsync("pnpm --filter @dashboard-link/database migrate:up");
  const success = !stdout.includes("ERROR");
  
  return { ...state, migration_success: success };
}

async function verifySchema(state: MigrationState): Promise<MigrationState> {
  const { stdout } = await execAsync(`psql ${process.env.DATABASE_URL} -c "\\dt"`);
  const valid = ["users", "organizations", "workers"].every(table => 
    stdout.includes(table)
  );
  
  return { ...state, schema_valid: valid };
}

const workflow = new StateGraph<MigrationState>({
  channels: {
    backup_path: { value: (x, y) => y ?? x },
    migration_success: { value: (x, y) => y ?? x },
    schema_valid: { value: (x, y) => y ?? x },
  }
});

workflow.addNode("backup", backupDatabase);
workflow.addNode("migrate", runMigrations);
workflow.addNode("verify", verifySchema);

workflow.addEdge("__start__", "backup");
workflow.addEdge("backup", "migrate");
workflow.addConditionalEdges(
  "migrate",
  (state) => state.migration_success ?? false,
  {
    true: "verify",
    false: "__end__",
  }
);
workflow.addEdge("verify", "__end__");

export const migrationGraph = workflow.compile({
  checkpointer: new SqliteSaver("migration-checkpoints.db"),
});
```
```

---

### Example 2: Complex → Enhanced (Async Data Pipeline)

#### BEFORE (Rough Description)

```
We need to sync worker data from Connecteam API to our database hourly.
If shift assignments change, send SMS to affected workers.
Handle rate limits and retry failures.
```

#### AFTER (Enhanced Playbook)

```markdown
# Connecteam Worker Sync Pipeline

## Meta

```yaml
version: "1.1.0"
domain: "DataPipeline"
estimated_duration: "10m"
schedule: "0 * * * *"  # Hourly
prerequisites:
  - service: "redis"
    status: "running"
  - service: "postgresql"
    status: "running"
  - env_vars: ["CONNECTEAM_API_KEY", "DATABASE_URL", "REDIS_URL", "SMS_PROVIDER_KEY"]
checkpoints:
  - id: "pre_sync"
    rollback_command: "redis-cli DEL sync:lock:*"
```

## State Machine

```yaml
orchestration:
  type: "langgraph_stategraph"
  nodes:
    - id: "acquire_lock"
      type: "validator"
      tools: ["redis_lock"]
      next: ["fetch_workers", "abort_locked"]
    
    - id: "fetch_workers"
      type: "executor"
      tools: ["connecteam_api_with_retry"]
      next: ["compare_shifts", "handle_api_error"]
    
    - id: "compare_shifts"
      type: "executor"
      tools: ["diff_calculator"]
      next: ["update_database", "skip_no_changes"]
    
    - id: "update_database"
      type: "executor"
      checkpoint: "pre_update"
      tools: ["upsert_workers"]
      next: ["identify_notifications"]
    
    - id: "identify_notifications"
      type: "executor"
      tools: ["filter_changed_shifts"]
      next: ["queue_sms", "complete_no_notifications"]
    
    - id: "queue_sms"
      type: "executor"
      tools: ["bullmq_enqueue"]
      next: ["release_lock"]
    
    - id: "release_lock"
      type: "executor"
      tools: ["redis_unlock"]
      next: ["complete"]
    
    - id: "handle_api_error"
      type: "error_handler"
      retry_config:
        max_attempts: 3
        backoff_ms: [1000, 2000, 5000]
      next: ["fetch_workers", "abort_after_retries"]
    
    - id: "complete"
      type: "terminal"
      state: "success"
    
    - id: "abort_locked"
      type: "terminal"
      state: "skipped"
      reason: "sync_already_running"
    
    - id: "abort_after_retries"
      type: "terminal"
      state: "failure"
      reason: "api_unavailable"
```

## Tool Schemas

```json
{
  "tools": [
    {
      "name": "redis_lock",
      "schema": {
        "type": "object",
        "properties": {
          "key": { "type": "string" },
          "ttl_seconds": { "type": "number" }
        },
        "required": ["key", "ttl_seconds"]
      },
      "implementation": "typescript",
      "function_path": "packages/shared/src/redis/lock.ts",
      "export_name": "acquireLock",
      "idempotent": false,
      "timeout_seconds": 5
    },
    {
      "name": "connecteam_api_with_retry",
      "schema": {
        "type": "object",
        "properties": {
          "endpoint": { "type": "string" },
          "api_key": { "type": "string" }
        },
        "required": ["endpoint", "api_key"]
      },
      "implementation": "typescript",
      "function_path": "packages/plugins/src/connecteam/api-client.ts",
      "export_name": "fetchWorkersWithRetry",
      "retry_config": {
        "max_attempts": 3,
        "backoff_multiplier": 2,
        "initial_delay_ms": 1000
      },
      "idempotent": true,
      "timeout_seconds": 30
    },
    {
      "name": "diff_calculator",
      "schema": {
        "type": "object",
        "properties": {
          "current": { "type": "array" },
          "incoming": { "type": "array" }
        },
        "required": ["current", "incoming"]
      },
      "implementation": "typescript",
      "function_path": "packages/shared/src/diff/calculate.ts",
      "export_name": "calculateShiftDiff",
      "idempotent": true,
      "timeout_seconds": 10
    },
    {
      "name": "bullmq_enqueue",
      "schema": {
        "type": "object",
        "properties": {
          "queue": { "type": "string" },
          "jobs": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": { "type": "string" },
                "data": { "type": "object" }
              }
            }
          }
        },
        "required": ["queue", "jobs"]
      },
      "implementation": "typescript",
      "function_path": "packages/shared/src/queue/enqueue.ts",
      "export_name": "bulkEnqueue",
      "idempotent": true,
      "timeout_seconds": 20
    }
  ]
}
```

## ReAct Decision Tree

```yaml
react_phases:
  - phase: "PLAN"
    thought_prompt: |
      Goal: Sync Connecteam worker data
      Current state: [WORKERS_FETCHED]
      
      Decisions:
      1. Are there shift changes? → YES: update DB, NO: skip
      2. Rate limit hit? → RETRY with backoff
      3. API down? → ABORT after 3 attempts
  
  - phase: "EXECUTE"
    actions:
      - acquire_distributed_lock
      - fetch_with_exponential_backoff
      - calculate_diff
      - upsert_batch
      - enqueue_notifications
  
  - phase: "OBSERVE"
    metrics:
      - workers_fetched: "count"
      - shifts_changed: "count"
      - sms_queued: "count"
      - api_latency_ms: "p95"
  
  - phase: "VERIFY"
    assertions:
      - "database_count == workers_fetched"
      - "sms_queue_length >= shifts_changed"
      - "no_duplicate_notifications"
```

## Inline Test Commands

```bash
# Verify Redis lock acquired
redis-cli GET "sync:lock:connecteam" | grep -q "locked" || exit 1

# Check worker count
WORKER_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM workers WHERE source='connecteam'")
test "$WORKER_COUNT" -gt 0 || (echo "No workers synced" && exit 1)

# Validate SMS queue
QUEUE_SIZE=$(redis-cli LLEN "bull:sms:wait")
echo "SMS queue size: $QUEUE_SIZE"

# End-to-end smoke test
pnpm --filter @dashboard-link/api test:integration -- --grep "connecteam sync"
```

## Code Stub

```typescript
import { StateGraph } from "@langchain/langgraph";
import { Queue } from "bullmq";
import Redis from "ioredis";
import { ConnecteamAPI } from "@dashboard-link/plugins/connecteam";
import { WorkerRepository } from "@dashboard-link/database";

interface SyncState {
  lock_acquired: boolean;
  workers: Array<{ id: string; shifts: any[] }>;
  diff: {
    added: any[];
    updated: any[];
    removed: any[];
  };
  notifications: Array<{ workerId: string; message: string }>;
}

const redis = new Redis(process.env.REDIS_URL);
const smsQueue = new Queue("sms", { connection: redis });

async function acquireLock(state: SyncState): Promise<SyncState> {
  const acquired = await redis.set(
    "sync:lock:connecteam",
    "locked",
    "EX", 600, // 10 min TTL
    "NX" // Only if not exists
  );
  
  return { ...state, lock_acquired: acquired === "OK" };
}

async function fetchWorkers(state: SyncState): Promise<SyncState> {
  const api = new ConnecteamAPI({ apiKey: process.env.CONNECTEAM_API_KEY });
  const workers = await api.getWorkers({ retry: true, maxAttempts: 3 });
  
  return { ...state, workers };
}

async function compareShifts(state: SyncState): Promise<SyncState> {
  const repo = new WorkerRepository();
  const current = await repo.findAll({ source: "connecteam" });
  
  const diff = {
    added: state.workers.filter(w => !current.some(c => c.id === w.id)),
    updated: state.workers.filter(w => {
      const existing = current.find(c => c.id === w.id);
      return existing && JSON.stringify(existing.shifts) !== JSON.stringify(w.shifts);
    }),
    removed: current.filter(c => !state.workers.some(w => w.id === c.id)),
  };
  
  return { ...state, diff };
}

async function queueNotifications(state: SyncState): Promise<SyncState> {
  const jobs = state.notifications.map(n => ({
    name: "send-sms",
    data: {
      to: n.workerId,
      message: n.message,
    },
    opts: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    },
  }));
  
  await smsQueue.addBulk(jobs);
  
  return state;
}

const workflow = new StateGraph<SyncState>({
  channels: {
    lock_acquired: { value: (x, y) => y ?? x },
    workers: { value: (x, y) => y ?? x ?? [] },
    diff: { value: (x, y) => y ?? x },
    notifications: { value: (x, y) => y ?? x ?? [] },
  }
});

workflow.addNode("lock", acquireLock);
workflow.addNode("fetch", fetchWorkers);
workflow.addNode("compare", compareShifts);
workflow.addNode("notify", queueNotifications);

workflow.addConditionalEdges(
  "lock",
  (state) => state.lock_acquired,
  {
    true: "fetch",
    false: "__end__",
  }
);

workflow.addEdge("fetch", "compare");
workflow.addConditionalEdges(
  "compare",
  (state) => state.diff.updated.length > 0 || state.diff.added.length > 0,
  {
    true: "notify",
    false: "__end__",
  }
);

export const syncGraph = workflow.compile();
```
```

---

## Usage Instructions

### For AI Agents

When generating an enhanced playbook:

1. **Read the input** (existing playbook, plan, or description)
2. **Classify the domain** (DevOps, DataPipeline, UserFlow, BackendService)
3. **Apply the decision tree** to choose orchestration pattern
4. **Generate the meta block** with prerequisites and checkpoints
5. **Create the state machine** with nodes, edges, and error paths
6. **Define tool schemas** with strict types and implementation details
7. **Build the ReAct tree** for planner → executor → verifier flow
8. **Add inline tests** for validation at each step
9. **Provide code stubs** in TypeScript/Python with LangGraph integration
10. **Validate output** against the checklist in the Validation Criteria section

### For Human Developers

When reviewing AI-generated playbooks:

1. Verify that all nodes in the state machine are reachable
2. Ensure error paths exist for every risky operation
3. Check that tool schemas match actual function signatures
4. Run the validation script (`validate-playbook.sh`)
5. Test inline commands in a sandbox environment
6. Confirm that code stubs compile and pass type checking

### Iteration Loop

```
User Request → AI Generates Playbook → Validation → [PASS] → Execute
                     ↑                                     ↓
                     └─────────── [FAIL] ← Refine ←───────┘
```

---

## Versioning and Updates

### Playbook Versioning

Every playbook tracks its version:

```yaml
version: "1.2.0"  # MAJOR.MINOR.PATCH
changelog:
  - version: "1.2.0"
    date: "2026-01-12"
    changes:
      - "Added retry logic for API calls"
      - "Increased timeout from 30s to 60s"
  
  - version: "1.1.0"
    date: "2026-01-05"
    changes:
      - "Added checkpoint before database update"
      - "Improved error messages"
```

### When to Bump Versions

- **MAJOR**: Breaking changes to state machine structure or tool signatures
- **MINOR**: New nodes, tools, or optional features
- **PATCH**: Bug fixes, timeout adjustments, documentation updates

---

## Anti-Patterns to Avoid

### ❌ Don't Do This

1. **Ambiguous Steps**
   ```yaml
   - id: "verify"
     description: "Make sure everything looks good"
   ```

2. **Missing Error Paths**
   ```yaml
   nodes:
     - execute_task
     - complete  # What if execute_task fails?
   ```

3. **Untestable Assertions**
   ```bash
   # Too vague
   echo "Check if the system is healthy"
   ```

4. **Hard-Coded Values**
   ```json
   {
     "database_url": "postgresql://localhost:5432/mydb"
   }
   ```

5. **No Rollback Strategy**
   ```yaml
   - id: "delete_production_data"
     # No checkpoint, no undo!
   ```

### ✅ Do This Instead

1. **Explicit Success Criteria**
   ```yaml
   - id: "verify"
     type: "verifier"
     validation: "status_code == 200 AND response.healthy == true"
   ```

2. **Error Routing**
   ```yaml
   - id: "execute_task"
     next: ["complete", "rollback_on_error"]
   ```

3. **Testable Commands**
   ```bash
   curl -f http://localhost:3000/health | jq -e '.status == "ok"'
   ```

4. **Environment Variables**
   ```json
   {
     "database_url": "${DATABASE_URL}"
   }
   ```

5. **Checkpointed Mutations**
   ```yaml
   - id: "delete_production_data"
     checkpoint: "pre_delete"
     rollback_command: "restore_from_backup"
   ```

---

## Future Extensions

Planned enhancements to this skill:

1. **Multi-Agent Coordination**: Patterns for agent-to-agent communication
2. **Cost Optimization**: Token budgeting and checkpoint pruning strategies
3. **A/B Testing**: Playbook variant testing frameworks
4. **Observability**: OpenTelemetry integration for tracing
5. **Natural Language Debugging**: Explain playbook failures in plain English

---

## References

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [ReAct Paper](https://arxiv.org/abs/2210.03629)
- [Autonomous Agents Survey](https://arxiv.org/abs/2308.11432)
- CleanConnect Architecture Blueprint: [ARCHITECTURE_BLUEPRINT.md](docs/ARCHITECTURE_BLUEPRINT.md)
- Plan Execution Order: [PLAN_INDEX.md](plan/PLAN_INDEX.md)

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-12  
**Maintained By:** CleanConnect Platform Team
