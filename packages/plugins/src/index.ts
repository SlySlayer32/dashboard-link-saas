import { PluginAdapter } from '@dashboard-link/shared';
import { GoogleCalendarAdapter } from './google-calendar';
import { AirtableAdapter } from './airtable';
import { NotionAdapter } from './notion';
import { ManualAdapter } from './manual';

export * from './base/adapter';
export * from './google-calendar';
export * from './airtable';
export * from './notion';
export * from './manual';

/**
 * Plugin Registry
 * Centralized registry of all available plugins
 */
export class PluginRegistry {
  private static plugins: Map<string, PluginAdapter> = new Map();

  static {
    // Register all built-in plugins
    this.register(new GoogleCalendarAdapter());
    this.register(new AirtableAdapter());
    this.register(new NotionAdapter());
    this.register(new ManualAdapter());
  }

  /**
   * Register a new plugin
   */
  static register(plugin: PluginAdapter): void {
    this.plugins.set(plugin.id, plugin);
  }

  /**
   * Get a plugin by ID
   */
  static get(id: string): PluginAdapter | undefined {
    return this.plugins.get(id);
  }

  /**
   * Get all registered plugins
   */
  static getAll(): PluginAdapter[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Check if a plugin exists
   */
  static has(id: string): boolean {
    return this.plugins.has(id);
  }
}
