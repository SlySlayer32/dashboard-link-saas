/**
 * Type definitions for the agent orchestration system
 */

export interface WorkerPlan {
  workers: Worker[];
  parallel: boolean;
  metadata: PlanMetadata;
}

export interface Worker {
  name: string;
  skill: string;
  reason: string;
  priority: number;
  enabled: boolean;
  timeout?: number;
}

export interface PlanMetadata {
  eventType: string;
  eventAction?: string;
  timestamp: string;
  source: string;
  repository: string;
}

export interface GitHubEvent {
  action?: string;
  issue?: Issue;
  pull_request?: PullRequest;
  comment?: Comment;
  repository?: Repository;
  sender?: User;
  label?: Label;
  changes?: any;
}

export interface Issue {
  number: number;
  title: string;
  body: string | null;
  labels: Label[];
  state: string;
  user: User;
  created_at: string;
  updated_at: string;
}

export interface PullRequest {
  number: number;
  title: string;
  body: string | null;
  labels: Label[];
  state: string;
  user: User;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  changed_files?: number;
  additions?: number;
  deletions?: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  body: string;
  user: User;
  created_at: string;
  updated_at: string;
}

export interface Label {
  name: string;
  color?: string;
  description?: string;
}

export interface User {
  login: string;
  type: string;
}

export interface Repository {
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
}

export interface SkillResult {
  skill: string;
  worker: string;
  status: 'success' | 'failure' | 'skipped';
  output?: string;
  error?: string;
  duration?: number;
  timestamp: string;
}

export interface AggregatedResults {
  summary: string;
  workers: SkillResult[];
  successCount: number;
  failureCount: number;
  skippedCount: number;
  totalDuration: number;
  recommendations: string[];
  metadata: {
    eventType: string;
    repository: string;
    timestamp: string;
  };
}
