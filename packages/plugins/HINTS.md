# Plugin Architecture Hints

> **Purpose**: Extensible system for pulling data from external sources into worker dashboards

## 🏗️ Plugin System Design

### Core Philosophy
- **Pull-based**: Plugins fetch data from external APIs
- **Push-ready**: Architecture supports webhook ingestion
- **Unified Interface**: All plugins return same data shape
- **Tenant Isolated**: Each org configures plugins independently

### Plugin Types
1. **Manual** - Admin enters data directly
2. **Google Calendar** - Fetch calendar events
3. **Airtable** - Pull from custom bases
4. **Notion** - Sync database pages

## 🔌 Plugin Architecture

### Base Adapter Interface
```typescript
abstract class PluginAdapter {
  abstract name: string;
  abstract version: string;
  
  // Configuration schema for UI
  abstract getSchema(): PluginSchema;
  
  // Validate configuration before saving
  abstract validate(config: PluginConfig): ValidationResult;
  
  // Fetch data for specific worker
  abstract fetch(config: PluginConfig, worker: Worker, date: Date): Promise<PluginData>;
  
  // Optional: Handle webhook updates
  async handleWebhook?(payload: any): Promise<void>;
}
```

### Data Transformation
All plugins must transform data to standard types:
```typescript
interface ScheduleItem {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  description?: string;
  type: 'shift' | 'appointment' | 'delivery';
}

interface TaskItem {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  assignee: string;
}

interface PluginData {
  schedule?: ScheduleItem[];
  tasks?: TaskItem[];
  notes?: Note[];
  metadata?: Record<string, any>;
}
```

## 📦 Package Structure
```
src/
├── base/
│   ├── adapter.ts      # Base plugin interface
│   ├── types.ts        # Common types
│   └── utils.ts        # Helper functions
├── manual/
│   ├── index.ts        # Manual entry plugin
│   └── api.ts          # Database queries
├── google-calendar/
│   ├── index.ts        # Google Calendar plugin
│   ├── oauth.ts        # OAuth2 flow
│   └── api.ts          # Google API client
├── airtable/
│   ├── index.ts        # Airtable plugin
│   ├── api.ts          # Airtable client
│   └── mapping.ts      # Field mapping logic
└── notion/
    ├── index.ts        # Notion plugin
    ├── api.ts          # Notion client
    └── query.ts        # Query builder
```

## 🔐 Authentication Patterns

### OAuth2 (Google Calendar)
```typescript
class GoogleCalendarAdapter extends PluginAdapter {
  async fetch(config: PluginConfig, worker: Worker, date: Date) {
    // Use stored refresh token
    const tokens = await this.refreshTokens(config.refreshToken);
    
    // Query calendar with worker's email
    const events = await calendar.events.list({
      calendarId: worker.email,
      timeMin: startOfDay(date),
      timeMax: endOfDay(date)
    });
    
    return this.transformEvents(events);
  }
}
```

### API Key (Airtable)
```typescript
class AirtableAdapter extends PluginAdapter {
  async fetch(config: PluginConfig, worker: Worker, date: Date) {
    const base = new Airtable({ apiKey: config.apiKey }).base(config.baseId);
    
    const records = await base(config.tableId)
      .select({
        filterByFormula: `AND({Worker Email} = '${worker.email}', {Date} = '${format(date)}')`
      })
      .all();
    
    return this.transformRecords(records, config.fieldMapping);
  }
}
```

### Integration Secret (Notion)
```typescript
class NotionAdapter extends PluginAdapter {
  async fetch(config: PluginConfig, worker: Worker, date: Date) {
    const notion = new Client({ auth: config.integrationSecret });
    
    const response = await notion.databases.query({
      database_id: config.databaseId,
      filter: {
        and: [
          { property: 'Worker', rich_text: { equals: worker.name } },
          { property: 'Date', date: { equals: format(date) } }
        ]
      }
    });
    
    return this.transformPages(response.results);
  }
}
```

## 🎯 Plugin Manager

### Orchestration Logic
```typescript
class PluginManager {
  async aggregateData(organizationId: string, worker: Worker, date: Date): Promise<DashboardData> {
    // Get configured plugins for organization
    const plugins = await this.getPlugins(organizationId);
    
    // Fetch data from all plugins in parallel
    const results = await Promise.allSettled(
      plugins.map(plugin => plugin.fetch(plugin.config, worker, date))
    );
    
    // Merge and deduplicate data
    return this.mergeResults(results);
  }
}
```

### Error Handling
- Failed plugins don't break other plugins
- Log errors with context
- Return partial data when possible
- Retry with exponential backoff

## 🔧 Configuration Management

### Plugin Configuration Schema
```typescript
interface PluginSchema {
  type: 'object';
  required: string[];
  properties: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      title: string;
      description?: string;
      enum?: string[];
      format?: 'email' | 'uri' | 'date-time';
      secret?: boolean; // For API keys/tokens
    };
  };
}
```

### Example: Google Calendar Schema
```typescript
const googleCalendarSchema: PluginSchema = {
  type: 'object',
  required: ['clientId', 'clientSecret', 'refreshToken'],
  properties: {
    clientId: {
      type: 'string',
      title: 'OAuth Client ID',
      description: 'From Google Cloud Console'
    },
    clientSecret: {
      type: 'string',
      title: 'OAuth Client Secret',
      secret: true
    },
    refreshToken: {
      type: 'string',
      title: 'Refresh Token',
      secret: true
    },
    calendarId: {
      type: 'string',
      title: 'Calendar ID',
      description: 'Leave blank for primary calendar',
      default: 'primary'
    }
  }
};
```

## 📊 Data Caching

### Caching Strategy
- Cache plugin results for 5 minutes
- Use worker + date as cache key
- Invalidate on webhook updates
- Background refresh for active users

### Implementation
```typescript
class PluginCache {
  async get(pluginId: string, workerId: string, date: string): Promise<PluginData | null> {
    const key = `plugin:${pluginId}:worker:${workerId}:date:${date}`;
    return await this.redis.get(key);
  }
  
  async set(key: string, data: PluginData, ttl: number = 300): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(data));
  }
}
```

## 🔄 Webhook Support

### Webhook Handler Pattern
```typescript
class WebhookHandler {
  async handle(pluginType: string, payload: any, signature: string): Promise<void> {
    // Verify webhook signature
    const plugin = this.getPlugin(pluginType);
    if (!plugin.verifySignature(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }
    
    // Process webhook
    await plugin.handleWebhook(payload);
    
    // Invalidate relevant cache
    await this.cache.invalidateForWorkers(payload.affectedWorkers);
  }
}
```

### Webhook Types
- **Google Calendar**: Push notifications for changes
- **Airtable**: Webhook on record updates
- **Notion**: Database change notifications

## 🧪 Testing Plugins

### Unit Testing
```typescript
describe('GoogleCalendarAdapter', () => {
  it('should fetch events for worker', async () => {
    const adapter = new GoogleCalendarAdapter();
    const mockWorker = { email: 'test@example.com' };
    const mockDate = new Date('2024-01-01');
    
    const data = await adapter.fetch(mockConfig, mockWorker, mockDate);
    
    expect(data.schedule).toHaveLength(3);
    expect(data.schedule[0].title).toBe('Morning Shift');
  });
});
```

### Integration Testing
- Test with real APIs (use test accounts)
- Verify OAuth flows
- Test rate limiting
- Check error handling

## 🚀 Performance Considerations

### API Rate Limits
- Respect all provider limits
- Implement exponential backoff
- Use bulk operations when possible
- Cache aggressively

### Batch Processing
- Fetch multiple workers in parallel
- Batch API calls by provider
- Use GraphQL when available
- Implement request coalescing

## 💡 Best Practices

1. **Secure Credentials**: Never log API keys or tokens
2. **Graceful Degradation**: Show partial data when plugins fail
3. **Clear Errors**: Explain configuration issues to admins
4. **Monitoring**: Track plugin success rates and latency
5. **Documentation**: Provide setup guides for each plugin

## 🔮 Future Plugin Ideas

- **Microsoft 365** - Calendar and To-Do integration
- **Trello** - Task board synchronization
- **Asana** - Project management data
- **HubSpot** - CRM task integration
- **Custom API** - Generic REST API plugin

---

**Remember**: Plugins are the core value proposition of CleanConnect. Make them reliable, secure, and easy to configure. Each plugin should feel like a native integration, not a brittle connection.
