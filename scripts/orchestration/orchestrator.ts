#!/usr/bin/env node
/**
 * Agent Orchestrator - Determines which workers to activate based on GitHub events
 * 
 * This script analyzes GitHub events (issues, PRs, comments) and generates a worker plan
 * that specifies which skills should be executed to handle the event.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { GitHubEvent, WorkerPlan, Worker } from './types.js';

class AgentOrchestrator {
  private event: GitHubEvent;
  private eventType: string;
  private eventAction: string;
  private repository: string;

  constructor(eventPath: string) {
    // Load GitHub event from file
    const eventData = fs.readFileSync(eventPath, 'utf-8');
    this.event = JSON.parse(eventData);
    
    this.eventType = process.env.GITHUB_EVENT_NAME || '';
    this.eventAction = this.event.action || '';
    this.repository = this.event.repository?.full_name || '';
  }

  /**
   * Parse event and generate worker plan
   */
  parseEvent(): WorkerPlan {
    const workers: Worker[] = [];

    // Analyze based on event type
    if (this.eventType === 'pull_request' || this.eventType === 'pull_request_target') {
      workers.push(...this.analyzePR());
    } else if (this.eventType === 'issues') {
      workers.push(...this.analyzeIssue());
    } else if (this.eventType === 'issue_comment' || this.eventType === 'pull_request_review_comment') {
      workers.push(...this.analyzeComment());
    }

    // Remove duplicates and sort by priority
    const uniqueWorkers = this.deduplicateWorkers(workers);
    const sortedWorkers = uniqueWorkers.sort((a, b) => a.priority - b.priority);

    return {
      workers: sortedWorkers,
      parallel: true,
      metadata: {
        eventType: this.eventType,
        eventAction: this.eventAction,
        timestamp: new Date().toISOString(),
        source: 'agent-orchestrator',
        repository: this.repository,
      },
    };
  }

  /**
   * Analyze pull request event
   */
  private analyzePR(): Worker[] {
    const workers: Worker[] = [];
    const pr = this.event.pull_request;

    if (!pr) return workers;

    const title = pr.title.toLowerCase();
    const body = (pr.body || '').toLowerCase();
    const labels = pr.labels.map(l => l.name.toLowerCase());

    // Check for code changes
    if (pr.changed_files && pr.changed_files > 0) {
      workers.push({
        name: 'code-quality-review',
        skill: 'code-quality-reviewer',
        reason: 'PR contains code changes',
        priority: 10,
        enabled: true,
        timeout: 300,
      });
    }

    // Check for architecture-related keywords
    if (this.hasKeywords(title, body, ['plugin', 'adapter', 'architecture', 'zapier', 'integration'])) {
      workers.push({
        name: 'architecture-review',
        skill: 'architecture-guide',
        reason: 'PR involves architectural changes',
        priority: 20,
        enabled: true,
        timeout: 300,
      });
    }

    // Check for error/bug fixes
    if (this.hasKeywords(title, body, ['error', 'fix', 'bug', 'issue', 'broken']) || labels.includes('bug')) {
      workers.push({
        name: 'error-analysis',
        skill: 'error-fixer',
        reason: 'PR addresses errors or bugs',
        priority: 15,
        enabled: true,
        timeout: 300,
      });
    }

    // Check for refactoring/naming changes
    if (this.hasKeywords(title, body, ['refactor', 'rename', 'naming', 'convention'])) {
      workers.push({
        name: 'naming-review',
        skill: 'naming-conventions',
        reason: 'PR involves refactoring or naming changes',
        priority: 30,
        enabled: true,
        timeout: 180,
      });
    }

    // Always suggest next steps for PRs
    workers.push({
      name: 'next-steps-planning',
      skill: 'next-steps-planner',
      reason: 'Plan next steps after PR merge',
      priority: 100,
      enabled: true,
      timeout: 180,
    });

    return workers;
  }

  /**
   * Analyze issue event
   */
  private analyzeIssue(): Worker[] {
    const workers: Worker[] = [];
    const issue = this.event.issue;

    if (!issue) return workers;

    const title = issue.title.toLowerCase();
    const body = (issue.body || '').toLowerCase();
    const labels = issue.labels.map(l => l.name.toLowerCase());

    // Check labels first (highest confidence)
    if (labels.includes('bug')) {
      workers.push(
        {
          name: 'code-quality-review',
          skill: 'code-quality-reviewer',
          reason: 'Issue labeled as bug',
          priority: 10,
          enabled: true,
          timeout: 300,
        },
        {
          name: 'error-analysis',
          skill: 'error-fixer',
          reason: 'Issue labeled as bug',
          priority: 15,
          enabled: true,
          timeout: 300,
        }
      );
    }

    if (labels.includes('enhancement') || labels.includes('feature')) {
      workers.push(
        {
          name: 'architecture-review',
          skill: 'architecture-guide',
          reason: 'Issue proposes new feature/enhancement',
          priority: 20,
          enabled: true,
          timeout: 300,
        },
        {
          name: 'next-steps-planning',
          skill: 'next-steps-planner',
          reason: 'Issue needs planning',
          priority: 25,
          enabled: true,
          timeout: 180,
        }
      );
    }

    if (labels.includes('question') || labels.includes('help wanted')) {
      workers.push({
        name: 'next-steps-planning',
        skill: 'next-steps-planner',
        reason: 'Issue asks for guidance',
        priority: 20,
        enabled: true,
        timeout: 180,
      });
    }

    // Check content for keywords
    if (this.hasKeywords(title, body, ['missing logic', 'code quality', 'review', 'quality'])) {
      workers.push({
        name: 'code-quality-review',
        skill: 'code-quality-reviewer',
        reason: 'Issue requests code quality review',
        priority: 10,
        enabled: true,
        timeout: 300,
      });
    }

    if (this.hasKeywords(title, body, ['naming', 'convention', 'name'])) {
      workers.push({
        name: 'naming-review',
        skill: 'naming-conventions',
        reason: 'Issue concerns naming conventions',
        priority: 30,
        enabled: true,
        timeout: 180,
      });
    }

    if (this.hasKeywords(title, body, ['architecture', 'pattern', 'plugin', 'adapter'])) {
      workers.push({
        name: 'architecture-review',
        skill: 'architecture-guide',
        reason: 'Issue concerns architecture',
        priority: 20,
        enabled: true,
        timeout: 300,
      });
    }

    return workers;
  }

  /**
   * Analyze comment event (bot mentions)
   */
  private analyzeComment(): Worker[] {
    const workers: Worker[] = [];
    const comment = this.event.comment;

    if (!comment) return workers;

    const body = comment.body.toLowerCase();

    // Check if bot is mentioned (assume @copilot or @github-actions[bot])
    const isBotMentioned = body.includes('@copilot') || 
                           body.includes('@github-actions') ||
                           body.includes('@bot');

    if (!isBotMentioned) {
      return workers; // Don't respond if not mentioned
    }

    // Parse explicit commands
    if (this.hasKeywords('', body, ['review', 'quality', 'check'])) {
      workers.push({
        name: 'code-quality-review',
        skill: 'code-quality-reviewer',
        reason: 'Requested via comment',
        priority: 10,
        enabled: true,
        timeout: 300,
      });
    }

    if (this.hasKeywords('', body, ['architecture', 'pattern', 'zapier'])) {
      workers.push({
        name: 'architecture-review',
        skill: 'architecture-guide',
        reason: 'Requested via comment',
        priority: 20,
        enabled: true,
        timeout: 300,
      });
    }

    if (this.hasKeywords('', body, ['fix', 'error', 'bug', 'broken'])) {
      workers.push({
        name: 'error-analysis',
        skill: 'error-fixer',
        reason: 'Requested via comment',
        priority: 15,
        enabled: true,
        timeout: 300,
      });
    }

    if (this.hasKeywords('', body, ['next', 'what should', 'what to do', 'guidance'])) {
      workers.push({
        name: 'next-steps-planning',
        skill: 'next-steps-planner',
        reason: 'Requested via comment',
        priority: 25,
        enabled: true,
        timeout: 180,
      });
    }

    if (this.hasKeywords('', body, ['naming', 'convention', 'name'])) {
      workers.push({
        name: 'naming-review',
        skill: 'naming-conventions',
        reason: 'Requested via comment',
        priority: 30,
        enabled: true,
        timeout: 180,
      });
    }

    return workers;
  }

  /**
   * Check if keywords exist in title or body
   */
  private hasKeywords(title: string, body: string, keywords: string[]): boolean {
    const combined = `${title} ${body}`.toLowerCase();
    return keywords.some(kw => combined.includes(kw));
  }

  /**
   * Remove duplicate workers (keep highest priority)
   */
  private deduplicateWorkers(workers: Worker[]): Worker[] {
    const seen = new Map<string, Worker>();

    for (const worker of workers) {
      const existing = seen.get(worker.name);
      if (!existing || worker.priority < existing.priority) {
        seen.set(worker.name, worker);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Validate the worker plan
   */
  validatePlan(plan: WorkerPlan): boolean {
    if (!plan.workers || !Array.isArray(plan.workers)) {
      console.error('Invalid plan: workers must be an array');
      return false;
    }

    for (const worker of plan.workers) {
      if (!worker.name || !worker.skill || !worker.reason) {
        console.error(`Invalid worker: ${JSON.stringify(worker)}`);
        return false;
      }

      if (typeof worker.priority !== 'number' || worker.priority < 0) {
        console.error(`Invalid priority for worker ${worker.name}: ${worker.priority}`);
        return false;
      }

      if (typeof worker.enabled !== 'boolean') {
        console.error(`Invalid enabled flag for worker ${worker.name}`);
        return false;
      }
    }

    return true;
  }
}

/**
 * Main execution
 */
function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.error('Usage: orchestrator.ts <command>');
    console.error('Commands: parse-event');
    process.exit(1);
  }

  const eventPath = process.env.GITHUB_EVENT_PATH || '';
  
  if (!eventPath || !fs.existsSync(eventPath)) {
    console.error('GITHUB_EVENT_PATH not set or file does not exist');
    process.exit(1);
  }

  if (command === 'parse-event') {
    const orchestrator = new AgentOrchestrator(eventPath);
    const plan = orchestrator.parseEvent();

    // Validate plan
    if (!orchestrator.validatePlan(plan)) {
      console.error('Generated plan is invalid');
      process.exit(1);
    }

    // Create outputs directory if it doesn't exist
    const outputsDir = path.join(process.cwd(), 'outputs');
    if (!fs.existsSync(outputsDir)) {
      fs.mkdirSync(outputsDir, { recursive: true });
    }

    // Save plan to file
    const planPath = path.join(outputsDir, 'plan.json');
    fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));

    // Output for GitHub Actions (using GITHUB_OUTPUT)
    const githubOutput = process.env.GITHUB_OUTPUT;
    if (githubOutput) {
      const workerNames = plan.workers.map(w => w.name).join(',');
      const enabledWorkers = plan.workers.filter(w => w.enabled).map(w => w.name);
      
      fs.appendFileSync(githubOutput, `worker-matrix=${JSON.stringify({ worker: enabledWorkers })}\n`);
      fs.appendFileSync(githubOutput, `worker-count=${plan.workers.length}\n`);
      fs.appendFileSync(githubOutput, `workers=${workerNames}\n`);
      fs.appendFileSync(githubOutput, `parallel=${plan.parallel}\n`);
    }

    console.log('✅ Worker plan generated successfully');
    console.log(`   Workers: ${plan.workers.map(w => w.name).join(', ')}`);
    console.log(`   Parallel execution: ${plan.parallel}`);
    console.log(`   Output: ${planPath}`);
  } else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }
}

main();
