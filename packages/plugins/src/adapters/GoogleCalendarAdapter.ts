import {
    PluginConfig,
    PluginConfigSchema,
    PluginValidationResult,
    StandardScheduleItem,
    StandardTaskItem
} from '@dashboard-link/shared';
import { BasePluginAdapter } from '../base/BasePluginAdapter';

// Google Calendar API response types
interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  status?: string;
  htmlLink?: string;
}

interface GoogleCalendarResponse {
  items: GoogleCalendarEvent[];
  nextPageToken?: string;
}

interface GoogleCalendarTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status?: string;
}

// Google Calendar adapter implementation
export class GoogleCalendarAdapter extends BasePluginAdapter {
  readonly id = 'google-calendar';
  readonly name = 'Google Calendar';
  readonly version = '1.0.0';
  readonly description = 'Fetches schedule and tasks from Google Calendar API';

  private apiKey: string;
  private calendarId: string;

  constructor() {
    super();
    this.apiKey = '';
    this.calendarId = 'primary';
  }

  // Required abstract method implementations
  protected async fetchExternalSchedule(workerId: string, config: PluginConfig): Promise<unknown[]> {
    const apiKey = config.settings.apiKey as string;
    const calendarId = config.settings.calendarId as string || 'primary';
    
    if (!apiKey) {
      throw new Error('Google Calendar API key is required');
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
      `timeMin=${startOfDay.toISOString()}&` +
      `timeMax=${endOfDay.toISOString()}&` +
      `singleEvents=true&` +
      `orderBy=startTime&` +
      `key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.statusText}`);
    }

    const data: GoogleCalendarResponse = await response.json();
    return data.items || [];
  }

  protected async fetchExternalTasks(workerId: string, config: PluginConfig): Promise<unknown[]> {
    // Google Calendar doesn't have native tasks, but we can treat events with specific patterns as tasks
    // For this example, we'll look for events that start with "Task:" or have specific properties
    const events = await this.fetchExternalSchedule(workerId, config) as GoogleCalendarEvent[];
    
    return events.filter(event => 
      event.summary?.startsWith('Task:') || 
      event.summary?.startsWith('TODO:') ||
      event.description?.toLowerCase().includes('task')
    );
  }

  protected transformScheduleItem(item: unknown): StandardScheduleItem {
    const event = item as GoogleCalendarEvent;
    
    return {
      id: event.id,
      title: event.summary || 'Untitled Event',
      startTime: event.start.dateTime || event.start.date || '',
      endTime: event.end.dateTime || event.end.date || '',
      location: event.location,
      description: event.description,
      metadata: {
        googleEventId: event.id,
        htmlLink: event.htmlLink,
        status: event.status,
        source: 'google-calendar'
      },
      priority: this.determinePriority(event),
      status: this.determineStatus(event)
    };
  }

  protected transformTaskItem(item: unknown): StandardTaskItem {
    const event = item as GoogleCalendarEvent;
    
    // Extract task title from event summary
    let title = event.summary || 'Untitled Task';
    if (title.startsWith('Task:') || title.startsWith('TODO:')) {
      title = title.replace(/^(Task:|TODO:)\s*/i, '').trim();
    }

    return {
      id: event.id,
      title,
      description: event.description,
      dueDate: event.start.dateTime || event.start.date,
      priority: this.determinePriority(event),
      status: this.determineTaskStatus(event),
      assignee: undefined, // Google Calendar doesn't have assignee
      metadata: {
        googleEventId: event.id,
        htmlLink: event.htmlLink,
        originalSummary: event.summary,
        source: 'google-calendar'
      },
      tags: this.extractTags(event),
      estimatedTime: this.estimateTime(event)
    };
  }

  // Configuration schema
  getConfigSchema(): PluginConfigSchema {
    return {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          title: 'API Key',
          description: 'Google Calendar API key',
          required: true
        },
        calendarId: {
          type: 'string',
          title: 'Calendar ID',
          description: 'Google Calendar ID (defaults to primary)',
          required: false
        },
        timezone: {
          type: 'string',
          title: 'Timezone',
          description: 'Timezone for date parsing',
          required: false
        }
      },
      required: ['apiKey']
    };
  }

  // Custom validation
  async validateConfig(config: PluginConfig): Promise<PluginValidationResult> {
    const baseValidation = await super.validateConfig(config);
    
    if (!baseValidation.valid) {
      return baseValidation;
    }

    const apiKey = config.settings.apiKey as string;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate API key format
    if (apiKey && !apiKey.startsWith('AIza')) {
      errors.push('Invalid Google Calendar API key format');
    }

    // Test API connection
    try {
      const testUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=1&key=${apiKey}`;
      const response = await fetch(testUrl);
      
      if (response.status === 403) {
        errors.push('API key does not have calendar access permissions');
      } else if (!response.ok) {
        warnings.push('API key validation failed, but configuration might work');
      }
    } catch (error) {
      warnings.push('Could not validate API key due to network issues');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  // Custom health check
  async healthCheck(config: PluginConfig): Promise<import('@dashboard-link/shared').PluginHealthResult> {
    const startTime = Date.now();
    
    try {
      // Try to fetch a single event to test connectivity
      const apiKey = config.settings.apiKey as string;
      const calendarId = config.settings.calendarId as string || 'primary';
      
      if (!apiKey) {
        return {
          healthy: false,
          status: 'unhealthy',
          message: 'API key not configured',
          lastChecked: new Date().toISOString(),
          responseTime: Date.now() - startTime
        };
      }

      const testUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?maxResults=1&key=${apiKey}`;
      const response = await fetch(testUrl);
      
      if (response.ok) {
        return {
          healthy: true,
          status: 'healthy',
          message: 'Google Calendar API is accessible',
          lastChecked: new Date().toISOString(),
          responseTime: Date.now() - startTime
        };
      } else if (response.status === 403) {
        return {
          healthy: false,
          status: 'unhealthy',
          message: 'API key lacks calendar permissions',
          lastChecked: new Date().toISOString(),
          responseTime: Date.now() - startTime
        };
      } else {
        return {
          healthy: false,
          status: 'degraded',
          message: `API returned status ${response.status}`,
          lastChecked: new Date().toISOString(),
          responseTime: Date.now() - startTime
        };
      }
    } catch (error) {
      return {
        healthy: false,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown health check error',
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
    }
  }

  // Helper methods
  private determinePriority(event: GoogleCalendarEvent): 'low' | 'medium' | 'high' {
    const summary = event.summary?.toLowerCase() || '';
    const description = event.description?.toLowerCase() || '';
    
    if (summary.includes('urgent') || summary.includes('important') || 
        description.includes('urgent') || description.includes('important')) {
      return 'high';
    }
    
    if (summary.includes('meeting') || summary.includes('call')) {
      return 'medium';
    }
    
    return 'low';
  }

  private determineStatus(event: GoogleCalendarEvent): 'scheduled' | 'cancelled' | 'completed' {
    if (event.status === 'cancelled') {
      return 'cancelled';
    }
    
    const now = new Date();
    const endTime = new Date(event.end.dateTime || event.end.date || '');
    
    if (endTime < now) {
      return 'completed';
    }
    
    return 'scheduled';
  }

  private determineTaskStatus(event: GoogleCalendarEvent): 'pending' | 'in_progress' | 'completed' | 'cancelled' {
    if (event.status === 'cancelled') {
      return 'cancelled';
    }
    
    const now = new Date();
    const endTime = new Date(event.end.dateTime || event.end.date || '');
    
    if (endTime < now) {
      return 'completed';
    }
    
    const summary = event.summary?.toLowerCase() || '';
    if (summary.includes('in progress') || summary.includes('working on')) {
      return 'in_progress';
    }
    
    return 'pending';
  }

  private extractTags(event: GoogleCalendarEvent): string[] {
    const tags: string[] = [];
    const summary = event.summary || '';
    const description = event.description || '';
    
    // Extract hashtags
    const hashtagRegex = /#(\w+)/g;
    const matches = [...(summary.match(hashtagRegex) || []), ...(description.match(hashtagRegex) || [])];
    tags.push(...matches.map(tag => tag.substring(1)));
    
    // Extract common labels
    if (summary.toLowerCase().includes('work')) tags.push('work');
    if (summary.toLowerCase().includes('personal')) tags.push('personal');
    if (summary.toLowerCase().includes('meeting')) tags.push('meeting');
    
    return [...new Set(tags)]; // Remove duplicates
  }

  private estimateTime(event: GoogleCalendarEvent): number | undefined {
    if (!event.start.dateTime || !event.end.dateTime) {
      return undefined;
    }
    
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // in minutes
  }
}
