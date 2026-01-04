---
name: architecture-guide
description: Comprehensive guide for following the Zapier-style architecture patterns in Dashboard Link SaaS. Use when implementing new features, adding integrations, refactoring code, or when user says "follow the architecture", "use proper patterns", "implement like Zapier", "add a new plugin", or any architecture-related requests.
---

# Architecture Guide

## Overview

Dashboard Link SaaS follows a **Zapier-inspired architecture** with clear separation between Service Layer, Contract Layer, and Adapter Layer. This skill guides proper implementation of this pattern.

## Core Architecture Principle

**YOUR APP NEVER TOUCHES EXTERNAL APIS DIRECTLY**

Everything flows through standard contracts:
1. **Service Layer** (Your Core) - Business logic, no external dependencies
2. **Contract Layer** (Interfaces) - Define what adapters must implement
3. **Adapter Layer** (Swappable) - Implement contracts, talk to external services
4. **External Services** (Their Problem) - Third-party APIs

## When Adding New Features

### 1. Identify the Layers

Ask yourself:
- What business logic is needed? → Service Layer
- What external services are involved? → Adapter Layer
- What contract do they follow? → Contract Layer

### 2. Define YOUR Standard Data Format FIRST

```typescript
// Define YOUR format (external APIs adapt to THIS)
interface StandardScheduleItem {
  id: string;
  title: string;
  startTime: string; // ISO 8601
  endTime: string;
  location?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  metadata: Record<string, any>; // Provider-specific data
}

// Standard response envelope (all adapters use THIS)
interface PluginResponse<T> {
  success: boolean;
  data: T[];
  errors?: PluginError[];
  metadata: {
    provider: string;
    fetchedAt: string;
    [key: string]: any;
  };
}
```

### 3. Create the Contract (Interface)

```typescript
// packages/plugins/src/contracts/PluginAdapter.ts
export interface PluginAdapter {
  id: string;
  name: string;
  version: string;
  
  // Transform external data → YOUR standard format
  getSchedule(
    workerId: string,
    config: PluginConfig
  ): Promise<PluginResponse<StandardScheduleItem>>;
  
  getTasks(
    workerId: string,
    config: PluginConfig
  ): Promise<PluginResponse<StandardTaskItem>>;
  
  // Validate configuration
  validateConfig(config: PluginConfig): Promise<ValidationResult>;
  
  // Optional: health check
  healthCheck?(): Promise<HealthStatus>;
}
```

### 4. Implement the Adapter

```typescript
// packages/plugins/src/adapters/GoogleCalendarAdapter.ts
export class GoogleCalendarAdapter implements PluginAdapter {
  id = 'google-calendar';
  name = 'Google Calendar';
  version = '1.0.0';
  
  async getSchedule(
    workerId: string,
    config: PluginConfig
  ): Promise<PluginResponse<StandardScheduleItem>> {
    try {
      // 1. Fetch from Google (their format)
      const googleEvents = await this.fetchGoogleEvents(workerId, config);
      
      // 2. Transform to YOUR format
      const standardItems = googleEvents.map(event => ({
        id: event.id,
        title: event.summary,
        startTime: event.start.dateTime,
        endTime: event.end.dateTime,
        location: event.location,
        description: event.description,
        metadata: {
          googleEventId: event.id,
          htmlLink: event.htmlLink
        }
      }));
      
      // 3. Return YOUR envelope
      return {
        success: true,
        data: standardItems,
        metadata: {
          provider: 'google-calendar',
          fetchedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      // 4. Handle errors (don't leak Google internals)
      return {
        success: false,
        data: [],
        errors: [{
          code: 'GOOGLE_FETCH_ERROR',
          message: 'Failed to fetch calendar',
          provider: 'google-calendar'
        }],
        metadata: {
          provider: 'google-calendar',
          fetchedAt: new Date().toISOString()
        }
      };
    }
  }
  
  private async fetchGoogleEvents(workerId: string, config: PluginConfig) {
    // External API call logic here
  }
}
```

### 5. Use in Service Layer

```typescript
// packages/dashboard/src/DashboardService.ts
export class DashboardService {
  constructor(
    private pluginService: PluginService,
    private workerService: WorkerService
  ) {}
  
  async getWorkerDashboard(
    workerId: string,
    organizationId: string
  ): Promise<Dashboard> {
    // Get configured plugins (generic interface)
    const plugins = await this.pluginService.getActivePlugins(organizationId);
    
    // Fetch from ALL plugins (all return YOUR standard format)
    const schedulePromises = plugins.map(plugin =>
      plugin.adapter.getSchedule(workerId, plugin.config)
    );
    
    const results = await Promise.allSettled(schedulePromises);
    
    // Aggregate (all in YOUR format)
    const allItems = results
      .filter(r => r.status === 'fulfilled' && r.value.success)
      .flatMap(r => r.value.data);
    
    return {
      schedule: this.sortByStartTime(allItems),
      metadata: {
        providers: plugins.map(p => p.adapter.name),
        fetchedAt: new Date().toISOString()
      }
    };
  }
}
```

## Adding a New Plugin Adapter

### Step-by-Step Process

1. **Create adapter file**: `packages/plugins/src/adapters/NewServiceAdapter.ts`
2. **Implement PluginAdapter interface**
3. **Transform external data → standard format**
4. **Handle errors gracefully**
5. **Add tests**
6. **Register in plugin registry**
7. **Update documentation**

### Template for New Adapter

See `references/adapter-template.ts` for a complete template.

## Adding a New SMS Provider

1. **Define contract** (if not exists): `packages/sms/src/contracts/SMSProvider.ts`
2. **Implement adapter**: `packages/sms/src/adapters/TwilioAdapter.ts`
3. **Use in service**: Service only knows about `SMSProvider` interface

## Key Principles

### DO:
✅ Define standard data formats first
✅ Use interfaces/contracts for external services
✅ Make adapters swappable
✅ Keep business logic in services
✅ Transform external formats → your formats
✅ Handle errors in adapters
✅ Store provider-specific data in metadata

### DON'T:
❌ Call external APIs directly from services
❌ Let external API shapes leak into your core
❌ Put business logic in adapters
❌ Skip error handling
❌ Hardcode provider names in services
❌ Assume external APIs won't change

## Organization Isolation (Multi-tenancy)

**Every query MUST filter by organization_id:**

```typescript
// ❌ Bad - Cross-org data leak
const workers = await db.from('workers').select();

// ✅ Good - Organization isolated
const organizationId = c.get('organizationId'); // From auth middleware
const workers = await db
  .from('workers')
  .select()
  .eq('organization_id', organizationId);
```

## File Organization

```
packages/
├── plugins/
│   ├── src/
│   │   ├── contracts/
│   │   │   └── PluginAdapter.ts
│   │   ├── adapters/
│   │   │   ├── GoogleCalendarAdapter.ts
│   │   │   ├── AirtableAdapter.ts
│   │   │   └── NotionAdapter.ts
│   │   ├── types/
│   │   │   └── pluginTypes.ts
│   │   └── index.ts
├── sms/
│   ├── src/
│   │   ├── contracts/
│   │   │   └── SMSProvider.ts
│   │   ├── adapters/
│   │   │   ├── MobileMessageAdapter.ts
│   │   │   └── TwilioAdapter.ts
│   │   └── index.ts
└── dashboard/
    ├── src/
    │   ├── services/
    │   │   └── DashboardService.ts
    │   └── types/
    │       └── dashboardTypes.ts
```

## Common Scenarios

### "Add support for Airtable"
1. Create `AirtableAdapter` implementing `PluginAdapter`
2. Transform Airtable API response → `StandardScheduleItem`
3. Register adapter in plugin system
4. Service code unchanged (uses PluginAdapter interface)

### "Switch from MobileMessage to Twilio"
1. Create `TwilioAdapter` implementing `SMSProvider`
2. Update config to use `TwilioAdapter` instead of `MobileMessageAdapter`
3. Service code unchanged (uses SMSProvider interface)

### "Add new data type (e.g., Tasks)"
1. Define `StandardTaskItem` format
2. Add `getTasks()` to `PluginAdapter` interface
3. Implement in all existing adapters
4. Use in services via interface

## Resources

- **References**: See `references/` for:
  - `adapter-template.ts` - Template for new adapters
  - `zapier-patterns.md` - Detailed architecture patterns
  - `multi-tenancy.md` - Organization isolation guide

## Common Pitfalls

- Forgetting to transform external data to standard format
- Putting business logic in adapters
- Not handling adapter errors
- Skipping organization_id filters
- Leaking external API errors to users

## Best Practices

- Always define YOUR format first
- Keep adapters thin (just transformation)
- Use metadata for provider-specific data
- Test adapter error handling
- Document standard formats clearly
- Version your contracts/interfaces
