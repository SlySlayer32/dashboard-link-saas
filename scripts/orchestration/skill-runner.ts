#!/usr/bin/env node
/**
 * Skill Runner - Executes skills and produces results
 * 
 * This script loads a skill definition, processes it with the GitHub event context,
 * and produces a structured output that can be aggregated.
 */

import * as fs from 'fs';
import * as path from 'path';

interface SkillMetadata {
  name: string;
  description: string;
  [key: string]: any;
}

interface SkillDefinition {
  metadata: SkillMetadata;
  body: string;
  references: Record<string, string>;
}

interface SkillExecutionResult {
  skill: string;
  worker: string;
  status: 'success' | 'failure' | 'skipped';
  output: string;
  error?: string;
  duration: number;
  timestamp: string;
  metadata: {
    eventType: string;
    repository: string;
  };
}

class SkillRunner {
  private skillName: string;
  private skillsPath: string;
  private skillDefinition: SkillDefinition | null = null;

  constructor(skillName: string, skillsPath: string = '.github/skills') {
    this.skillName = skillName;
    this.skillsPath = path.resolve(process.cwd(), skillsPath);
  }

  /**
   * Load skill definition from SKILL.md file
   */
  loadSkill(): SkillDefinition {
    const skillPath = path.join(this.skillsPath, this.skillName);
    const skillFile = path.join(skillPath, 'SKILL.md');

    if (!fs.existsSync(skillFile)) {
      throw new Error(`Skill file not found: ${skillFile}`);
    }

    const content = fs.readFileSync(skillFile, 'utf-8');

    // Parse frontmatter (YAML between --- markers)
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      throw new Error(`Invalid skill format: ${skillFile}`);
    }

    const frontmatterText = match[1];
    const bodyText = match[2];

    // Simple YAML parser for frontmatter
    const metadata: SkillMetadata = { name: '', description: '' };
    frontmatterText.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        metadata[key] = value;
      }
    });

    // Load references if they exist
    const references: Record<string, string> = {};
    const referencesPath = path.join(skillPath, 'references');
    
    if (fs.existsSync(referencesPath) && fs.statSync(referencesPath).isDirectory()) {
      const refFiles = fs.readdirSync(referencesPath);
      for (const refFile of refFiles) {
        const refPath = path.join(referencesPath, refFile);
        if (fs.statSync(refPath).isFile()) {
          references[refFile] = fs.readFileSync(refPath, 'utf-8');
        }
      }
    }

    this.skillDefinition = {
      metadata,
      body: bodyText.trim(),
      references,
    };

    return this.skillDefinition;
  }

  /**
   * Execute the skill with given context
   */
  async execute(context: any, workerName: string): Promise<SkillExecutionResult> {
    const startTime = Date.now();

    try {
      if (!this.skillDefinition) {
        this.loadSkill();
      }

      if (!this.skillDefinition) {
        throw new Error('Skill definition not loaded');
      }

      // Generate output based on skill
      const output = this.generateOutput(context);

      const duration = Date.now() - startTime;

      return {
        skill: this.skillName,
        worker: workerName,
        status: 'success',
        output,
        duration,
        timestamp: new Date().toISOString(),
        metadata: {
          eventType: context.eventType || 'unknown',
          repository: context.repository || 'unknown',
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        skill: this.skillName,
        worker: workerName,
        status: 'failure',
        output: '',
        error: error instanceof Error ? error.message : String(error),
        duration,
        timestamp: new Date().toISOString(),
        metadata: {
          eventType: context.eventType || 'unknown',
          repository: context.repository || 'unknown',
        },
      };
    }
  }

  /**
   * Generate output for the skill
   * Uses the skill definition content dynamically instead of hard-coded logic
   */
  private generateOutput(context: any): string {
    const output: string[] = [];

    output.push(`# ${this.skillDefinition!.metadata.name}`);
    output.push('');
    output.push(`**Skill**: ${this.skillName}`);
    output.push(`**Description**: ${this.skillDefinition!.metadata.description}`);
    output.push('');
    output.push('## Analysis');
    output.push('');
    
    // Generic output based on skill definition body
    output.push('This skill provides the following guidance:');
    output.push('');
    
    // Extract key points from skill body (first few headings or bullet points)
    const bodyLines = this.skillDefinition!.body.split('\n');
    const keyPoints: string[] = [];
    
    for (const line of bodyLines) {
      // Look for headings (##, ###) or bullet points (-, *)
      if (line.match(/^#{2,3}\s+(.+)$/)) {
        const heading = line.replace(/^#{2,3}\s+/, '');
        keyPoints.push(`- **${heading}**`);
        if (keyPoints.length >= 5) break;
      } else if (line.match(/^[-*]\s+(.+)$/) && keyPoints.length < 8) {
        keyPoints.push(line);
      }
    }
    
    if (keyPoints.length > 0) {
      output.push(...keyPoints);
    } else {
      output.push('- Review and apply skill guidelines');
      output.push('- Follow best practices documented in skill');
    }
    
    output.push('');
    output.push('**Note**: This is a placeholder output. Full analysis requires AI integration or automated tooling.');
    output.push('');
    output.push('## Skill Content Preview');
    output.push('');
    output.push('<details>');
    output.push('<summary>View Skill Definition</summary>');
    output.push('');
    output.push(this.skillDefinition!.body.substring(0, 500) + '...');
    output.push('');
    output.push('</details>');

    output.push('');
    output.push('## Context');
    output.push('```json');
    output.push(JSON.stringify(context, null, 2));
    output.push('```');

    return output.join('\n');
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Parse arguments
  let skillName = '';
  let workerName = '';
  let contextFile = 'outputs/context.json';
  let outputFile = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--skill' && i + 1 < args.length) {
      skillName = args[i + 1];
      i++;
    } else if (args[i] === '--worker' && i + 1 < args.length) {
      workerName = args[i + 1];
      i++;
    } else if (args[i] === '--context' && i + 1 < args.length) {
      contextFile = args[i + 1];
      i++;
    } else if (args[i] === '--output' && i + 1 < args.length) {
      outputFile = args[i + 1];
      i++;
    }
  }

  if (!skillName || !workerName || !outputFile) {
    console.error('Usage: skill-runner.ts --skill <name> --worker <name> --output <file> [--context <file>]');
    process.exit(1);
  }

  // Load context
  let context: any = {};
  if (fs.existsSync(contextFile)) {
    const contextData = fs.readFileSync(contextFile, 'utf-8');
    context = JSON.parse(contextData);
  } else {
    // Use environment variables as fallback
    context = {
      eventType: process.env.GITHUB_EVENT_NAME || 'unknown',
      repository: process.env.GITHUB_REPOSITORY || 'unknown',
      eventPath: process.env.GITHUB_EVENT_PATH || '',
    };
  }

  // Execute skill
  const runner = new SkillRunner(skillName);
  const result = await runner.execute(context, workerName);

  // Ensure output directory exists
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save result
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));

  if (result.status === 'success') {
    console.log(`✅ Skill executed successfully: ${skillName}`);
  } else {
    console.error(`❌ Skill execution failed: ${skillName}`);
    console.error(`   Error: ${result.error}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
