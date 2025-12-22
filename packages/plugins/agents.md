# Plugins Package Guidelines

When working with files in this directory:

## Purpose
Extensible plugin adapter system for fetching data from various sources like calendars, task managers, and manual entries.

## 🚨 Critical Lint Rules (MUST FOLLOW)

### ESLint Errors vs Warnings
- **ERRORS block commits**: `no-undef`, `no-unused-vars`, parsing errors
- **WARNINGS don't block commits**: `@typescript-eslint/no-explicit-any`, `no-console`
- Always run `pnpm run lint` before committing - don't rely on lint-staged alone

### TypeScript Type Practices
1. **Use `Record<string, unknown>` instead of `any`** for better type safety
2. **Never introduce custom shared types** without rebuilding packages first
3. **Interface Implementation**: When implementing methods from interfaces:
   ```typescript
   // ✅ Correct - keep parameter names, prefix unused with _
   async getTodaySchedule(
     workerId: string,
     _config: Record<string, unknown>  // Use _ to indicate unused
   ): Promise<ScheduleItem[]> {
   
   // ❌ Wrong - removes parameter documentation
   async getTodaySchedule(workerId: string): Promise<ScheduleItem[]>
   ```

### Variable Naming Conventions
- **Unused parameters**: Prefix with underscore (`_`)
- **Never delete parameters** from interface implementations
- **Keep original parameter names** for documentation purposes

### Common Pitfalls to Avoid
1. **Orphaned try/catch blocks**: Remove entire try block if catch is unused
2. **Regex escape characters**: Don't escape special chars in character classes
3. **Import statements**: Remove unused imports to avoid `no-unused-vars`

### Pre-commit Checklist
- [ ] All unused parameters prefixed with `_`
- [ ] No `any` types (use `unknown` instead)
- [ ] All imports are used
- [ ] Run `pnpm run lint` - should show 0 errors
- [ ] Console statements only for debugging (acceptable as warnings)

## Architecture
```
src/
├── base/            # Base adapter and interfaces
│   ├── BaseAdapter.ts
│   └── types.ts
├── adapters/        # Specific plugin implementations
│   ├── manual/
│   ├── google-calendar/
│   ├── airtable/
│   └── notion/
├── registry/        # Plugin registry management
│   └── PluginRegistry.ts
├── types/           # Plugin-specific types
│   └── index.ts
└── index.ts         # Main exports
```

## Plugin Interface
```typescript
export interface PluginAdapter {
  id: string;
  name: string;
  description: string;
  version: string;
  
  getTodaySchedule(workerId: string, config: PluginConfig): Promise<ScheduleItem[]>;
  getTodayTasks(workerId: string, config: PluginConfig): Promise<TaskItem[]>;
  validateConfig(config: PluginConfig): Promise<boolean>;
  handleWebhook?(payload: unknown, config: PluginConfig): Promise<void>;
}
```

## File Naming Conventions
- Adapters: PascalCase with "Adapter" suffix (e.g., `GoogleCalendarAdapter.ts`)
- Types: camelCase (e.g., `pluginTypes.ts`)
- Registry: PascalCase (e.g., `PluginRegistry.ts`)
- Config: camelCase (e.g., `pluginConfig.ts`)

## Code Patterns

### Base Adapter Implementation
```typescript
export abstract class BaseAdapter implements PluginAdapter {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract version: string;
  
  abstract getTodaySchedule(
    workerId: string, 
    config: PluginConfig
  ): Promise<ScheduleItem[]>;
  
  abstract getTodayTasks(
    workerId: string, 
    config: PluginConfig
  ): Promise<TaskItem[]>;
  
  abstract validateConfig(config: PluginConfig): Promise<boolean>;
  
  // Common utility methods
  protected filterToday(items: Array<{ date: Date }>): Array<{ date: Date }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return items.filter(item => 
      item.date >= today && item.date < tomorrow
    );
  }
}
```

### Concrete Adapter Example
```typescript
export class ManualAdapter extends BaseAdapter {
  id = 'manual';
  name = 'Manual Entry';
  description = 'Manually entered schedule and tasks';
  version = '1.0.0';
  
  async getTodaySchedule(
    workerId: string, 
    config: PluginConfig
  ): Promise<ScheduleItem[]> {
    const { start, end } = getTodayRange();
    
    const items = await db.query(
      `SELECT * FROM manual_schedule_items 
       WHERE worker_id = $1 
       AND start_time >= $2 
       AND start_time < $3`,
      [workerId, start.toISOString(), end.toISOString()]
    );
    
    return items.map(this.transformToScheduleItem);
  }
  
  // ... other methods
}
```

## Plugin Registry
```typescript
export class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins: Map<string, PluginAdapter> = new Map();
  
  static getInstance(): PluginRegistry {
    if (!this.instance) {
      this.instance = new PluginRegistry();
    }
    return this.instance;
  }
  
  register(plugin: PluginAdapter): void {
    this.plugins.set(plugin.id, plugin);
  }
  
  get(id: string): PluginAdapter | undefined {
    return this.plugins.get(id);
  }
  
  getAll(): PluginAdapter[] {
    return Array.from(this.plugins.values());
  }
}
```

## Available Adapters

### Manual Adapter
- Database-stored entries
- No external dependencies
- Used for fallback/manual entry

### Google Calendar Adapter
- OAuth2 authentication
- Google Calendar API integration
- Real-time sync capability

### Airtable Adapter
- API key authentication
- Custom base/table configuration
- Webhook support for updates

### Notion Adapter
- Integration API authentication
- Database queries
- Page content extraction

## Guidelines

### Plugin Development
- Extend BaseAdapter for consistency
- Implement all required methods
- Handle errors gracefully
- Return empty arrays on failure
- Always filter by organization_id

### Configuration
- Use PluginConfig interface
- Validate all config fields
- Store encrypted sensitive data
- Provide default values

### Error Handling
- Never throw from plugin methods
- Log errors for debugging
- Return empty results on failure
- Implement retry logic where appropriate

### Performance
- Cache results when possible
- Use pagination for large datasets
- Implement rate limiting
- Run plugins in parallel

### Security
- Never store credentials in code
- Use secure storage for API keys
- Validate all inputs
- Implement proper auth flows

## Testing
- Unit tests for each adapter
- Mock external APIs
- Test error scenarios
- Integration tests with registry
- Performance tests for large datasets

## Deployment
- Plugins are lazy-loaded
- Can be updated independently
- Version compatibility checks
- Graceful degradation on errors

## Adding New Plugins
1. Create adapter folder under `/adapters`
2. Implement PluginAdapter interface
3. Add to registry in index.ts
4. Write comprehensive tests
5. Update documentation
