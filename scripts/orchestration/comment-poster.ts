#!/usr/bin/env node
/**
 * Comment Poster - Posts aggregated results to GitHub issues/PRs
 * 
 * This script uses the GitHub API to post comments with worker results.
 */

import * as fs from 'fs';
import * as https from 'https';

interface GitHubComment {
  body: string;
}

class CommentPoster {
  private token: string;
  private repository: string;
  private issueNumber: number | null = null;

  constructor(token: string, repository: string) {
    this.token = token;
    this.repository = repository;
  }

  /**
   * Determine issue/PR number from GitHub context
   */
  determineIssueNumber(): number {
    // Try to get from event file
    const eventPath = process.env.GITHUB_EVENT_PATH;
    
    if (eventPath && fs.existsSync(eventPath)) {
      const event = JSON.parse(fs.readFileSync(eventPath, 'utf-8'));
      
      if (event.issue) {
        this.issueNumber = event.issue.number;
      } else if (event.pull_request) {
        this.issueNumber = event.pull_request.number;
      }
    }

    // Fallback to environment variable
    if (!this.issueNumber) {
      const prNumber = process.env.PR_NUMBER || process.env.ISSUE_NUMBER;
      if (prNumber) {
        this.issueNumber = parseInt(prNumber, 10);
      }
    }

    if (!this.issueNumber) {
      throw new Error('Could not determine issue/PR number');
    }

    return this.issueNumber;
  }

  /**
   * Post comment to GitHub
   */
  async postComment(body: string): Promise<void> {
    const issueNumber = this.determineIssueNumber();
    
    const [owner, repo] = this.repository.split('/');
    const apiPath = `/repos/${owner}/${repo}/issues/${issueNumber}/comments`;

    const comment: GitHubComment = { body };

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        port: 443,
        path: apiPath,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Dashboard-Link-Agent-Orchestrator',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Comment posted successfully');
            resolve();
          } else {
            console.error('❌ Failed to post comment');
            console.error(`   Status: ${res.statusCode}`);
            console.error(`   Response: ${data}`);
            reject(new Error(`GitHub API error: ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Request error:', error);
        reject(error);
      });

      req.write(JSON.stringify(comment));
      req.end();
    });
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  let markdownFile = 'outputs/comment.md';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--markdown' && i + 1 < args.length) {
      markdownFile = args[i + 1];
      i++;
    }
  }

  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;

  if (!token) {
    console.error('❌ GITHUB_TOKEN environment variable not set');
    process.exit(1);
  }

  if (!repository) {
    console.error('❌ GITHUB_REPOSITORY environment variable not set');
    process.exit(1);
  }

  if (!fs.existsSync(markdownFile)) {
    console.error(`❌ Markdown file not found: ${markdownFile}`);
    process.exit(1);
  }

  const markdown = fs.readFileSync(markdownFile, 'utf-8');

  const poster = new CommentPoster(token, repository);
  
  try {
    await poster.postComment(markdown);
  } catch (error) {
    console.error('❌ Failed to post comment:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
