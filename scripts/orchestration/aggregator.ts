#!/usr/bin/env node
/**
 * Results Aggregator - Combines outputs from parallel workers
 * 
 * This script collects all worker results, aggregates them into a single
 * summary, and prepares a markdown comment for posting to GitHub.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { SkillResult, AggregatedResults } from './types.js';

class ResultsAggregator {
  private outputsDir: string;

  constructor(outputsDir: string = 'outputs') {
    this.outputsDir = path.resolve(process.cwd(), outputsDir);
  }

  /**
   * Aggregate all worker results
   */
  aggregate(): AggregatedResults {
    const results = this.loadResults();
    
    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = results.filter(r => r.status === 'failure').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);

    const summary = this.createSummary(results, successCount, failureCount, skippedCount);
    const recommendations = this.extractRecommendations(results);

    return {
      summary,
      workers: results,
      successCount,
      failureCount,
      skippedCount,
      totalDuration,
      recommendations,
      metadata: {
        eventType: results[0]?.timestamp ? 'aggregated' : 'unknown',
        repository: process.env.GITHUB_REPOSITORY || 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Load all worker result files
   */
  private loadResults(): SkillResult[] {
    const results: SkillResult[] = [];

    if (!fs.existsSync(this.outputsDir)) {
      console.warn(`Outputs directory does not exist: ${this.outputsDir}`);
      return results;
    }

    // Find all worker result files (excluding plan.json and aggregated.json)
    const files = this.findResultFiles(this.outputsDir);

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const result = JSON.parse(content);
        
        // Validate result structure
        if (this.isValidResult(result)) {
          results.push(result);
        } else {
          console.warn(`Invalid result file: ${file}`);
        }
      } catch (error) {
        console.error(`Error reading result file ${file}:`, error);
      }
    }

    return results;
  }

  /**
   * Recursively find all JSON result files
   */
  private findResultFiles(dir: string): string[] {
    const files: string[] = [];

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        files.push(...this.findResultFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        // Skip plan.json and aggregated.json
        if (entry.name !== 'plan.json' && entry.name !== 'aggregated.json' && entry.name !== 'context.json') {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  /**
   * Validate result structure
   */
  private isValidResult(result: any): result is SkillResult {
    return (
      result &&
      typeof result === 'object' &&
      typeof result.skill === 'string' &&
      typeof result.worker === 'string' &&
      typeof result.status === 'string' &&
      ['success', 'failure', 'skipped'].includes(result.status)
    );
  }

  /**
   * Create executive summary
   */
  private createSummary(
    results: SkillResult[],
    successCount: number,
    failureCount: number,
    skippedCount: number
  ): string {
    const lines: string[] = [];

    lines.push('# 🤖 Agent Orchestration Results');
    lines.push('');
    
    if (results.length === 0) {
      lines.push('⚠️ No workers were executed.');
      return lines.join('\n');
    }

    lines.push(`Executed **${results.length}** specialized worker${results.length === 1 ? '' : 's'}:`);
    lines.push('');

    // Summary statistics
    lines.push('## Summary');
    lines.push('');
    lines.push(`- ✅ **Success**: ${successCount}`);
    lines.push(`- ❌ **Failure**: ${failureCount}`);
    lines.push(`- ⏭️ **Skipped**: ${skippedCount}`);
    lines.push('');

    // Individual worker results
    lines.push('## Worker Results');
    lines.push('');

    for (const result of results) {
      const icon = result.status === 'success' ? '✅' : result.status === 'failure' ? '❌' : '⏭️';
      const duration = result.duration ? ` (${(result.duration / 1000).toFixed(2)}s)` : '';
      
      lines.push(`### ${icon} ${result.worker}${duration}`);
      lines.push('');
      lines.push(`**Skill**: ${result.skill}`);
      lines.push(`**Status**: ${result.status}`);
      
      if (result.error) {
        lines.push('');
        lines.push('**Error**:');
        lines.push('```');
        lines.push(result.error);
        lines.push('```');
      }

      if (result.output) {
        lines.push('');
        lines.push('<details>');
        lines.push('<summary>View Details</summary>');
        lines.push('');
        lines.push(result.output);
        lines.push('');
        lines.push('</details>');
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Extract recommendations from worker outputs
   */
  private extractRecommendations(results: SkillResult[]): string[] {
    const recommendations: string[] = [];

    for (const result of results) {
      if (result.status === 'success' && result.output) {
        // Look for recommendation patterns in output
        const recMatch = result.output.match(/## Recommendations?\n([\s\S]*?)(?=\n## |$)/i);
        if (recMatch) {
          const recSection = recMatch[1].trim();
          const items = recSection.split('\n').filter(line => line.trim().startsWith('-'));
          recommendations.push(...items.map(item => item.trim()));
        }
      }
    }

    return recommendations;
  }

  /**
   * Generate markdown comment for GitHub
   */
  generateMarkdownComment(aggregated: AggregatedResults): string {
    const lines: string[] = [];

    lines.push(aggregated.summary);

    if (aggregated.recommendations.length > 0) {
      lines.push('');
      lines.push('## 💡 Recommendations');
      lines.push('');
      for (const rec of aggregated.recommendations) {
        lines.push(rec);
      }
    }

    lines.push('');
    lines.push('---');
    lines.push(`*Generated by Agent Orchestrator at ${aggregated.metadata.timestamp}*`);

    return lines.join('\n');
  }
}

/**
 * Main execution
 */
function main(): void {
  const args = process.argv.slice(2);
  
  let outputsDir = 'outputs';
  let aggregatedFile = 'outputs/aggregated.json';
  let markdownFile = 'outputs/comment.md';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--outputs-dir' && i + 1 < args.length) {
      outputsDir = args[i + 1];
      i++;
    } else if (args[i] === '--aggregated' && i + 1 < args.length) {
      aggregatedFile = args[i + 1];
      i++;
    } else if (args[i] === '--markdown' && i + 1 < args.length) {
      markdownFile = args[i + 1];
      i++;
    }
  }

  const aggregator = new ResultsAggregator(outputsDir);
  const aggregated = aggregator.aggregate();

  // Save aggregated results
  const aggregatedDir = path.dirname(aggregatedFile);
  if (!fs.existsSync(aggregatedDir)) {
    fs.mkdirSync(aggregatedDir, { recursive: true });
  }
  fs.writeFileSync(aggregatedFile, JSON.stringify(aggregated, null, 2));

  // Generate and save markdown comment
  const markdown = aggregator.generateMarkdownComment(aggregated);
  fs.writeFileSync(markdownFile, markdown);

  console.log('✅ Results aggregated successfully');
  console.log(`   Total workers: ${aggregated.workers.length}`);
  console.log(`   Success: ${aggregated.successCount}`);
  console.log(`   Failure: ${aggregated.failureCount}`);
  console.log(`   Skipped: ${aggregated.skippedCount}`);
  console.log(`   Output: ${aggregatedFile}`);
  console.log(`   Comment: ${markdownFile}`);
}

main();
