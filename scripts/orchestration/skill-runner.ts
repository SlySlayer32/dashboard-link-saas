#!/usr/bin/env node
/**
 * Skill Runner - Executes skills and produces results
 * 
 * This script loads a skill definition, processes it with the GitHub event context,
 * and produces a structured output that can be aggregated.
 */

import * as fs from 'fs';
import * as path from 'path';
import yaml from 'js-yaml';

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
  output?: string;
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

    // Parse YAML frontmatter using js-yaml
    const metadata = yaml.load(frontmatterText) as SkillMetadata;

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
   * In a real implementation, this would call an AI API or run automated checks
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
    
    // Basic analysis based on skill type
    if (this.skillName === 'code-quality-reviewer') {
      output.push('### Code Quality Review');
      output.push('');
      output.push('This skill would perform:');
      output.push('- TypeScript type checking');
      output.push('- ESLint analysis');
      output.push('- React patterns validation');
      output.push('- Error handling verification');
      output.push('- Security vulnerability scanning');
      output.push('');
      output.push('**Note**: Full analysis requires AI integration or running actual linters.');
    } else if (this.skillName === 'architecture-guide') {
      output.push('### Architecture Review');
      output.push('');
      output.push('This skill would validate:');
      output.push('- Zapier-style adapter pattern compliance');
      output.push('- Service/Contract/Adapter layer separation');
      output.push('- Row-Level Security (RLS) implementation');
      output.push('- Plugin adapter contracts');
      output.push('');
      output.push('**Note**: Full analysis requires codebase inspection and AI guidance.');
    } else if (this.skillName === 'error-fixer') {
      output.push('### Error Analysis');
      output.push('');
      output.push('This skill would identify:');
      output.push('- TypeScript compilation errors');
      output.push('- Build failures');
      output.push('- Test failures');
      output.push('- Runtime errors');
      output.push('');
      output.push('**Note**: Full analysis requires running builds and tests.');
    } else if (this.skillName === 'naming-conventions') {
      output.push('### Naming Conventions Review');
      output.push('');
      output.push('This skill would check:');
      output.push('- File naming patterns (PascalCase for components, camelCase for hooks)');
      output.push('- Variable and function naming');
      output.push('- TypeScript interface/type naming');
      output.push('- Database naming conventions');
    } else if (this.skillName === 'next-steps-planner') {
      output.push('### Next Steps Planning');
      output.push('');
      output.push('This skill would suggest:');
      output.push('- Post-completion tasks');
      output.push('- Testing requirements');
      output.push('- Documentation updates');
      output.push('- Deployment checklist');
    }

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
