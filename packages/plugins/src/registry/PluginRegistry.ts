import { PluginAdapter, PluginRegistry } from '@dashboard-link/shared';

// Plugin registry implementation - singleton pattern
export class PluginRegistryImpl implements PluginRegistry {
  private static instance: PluginRegistryImpl;
  private plugins: Map<string, PluginAdapter> = new Map();

  private constructor() {}

  static getInstance(): PluginRegistryImpl {
    if (!PluginRegistryImpl.instance) {
      PluginRegistryImpl.instance = new PluginRegistryImpl();
    }
    return PluginRegistryImpl.instance;
  }

  register(plugin: PluginAdapter): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin with id '${plugin.id}' is already registered. Overwriting.`);
    }
    
    this.plugins.set(plugin.id, plugin);
    console.log(`Plugin registered: ${plugin.name} (${plugin.id}) v${plugin.version}`);
  }

  unregister(pluginId: string): void {
    if (this.plugins.delete(pluginId)) {
      console.log(`Plugin unregistered: ${pluginId}`);
    } else {
      console.warn(`Plugin with id '${pluginId}' was not found for unregistration.`);
    }
  }

  get(pluginId: string): PluginAdapter | undefined {
    return this.plugins.get(pluginId);
  }

  getAll(): PluginAdapter[] {
    return Array.from(this.plugins.values());
  }

  getEnabled(): PluginAdapter[] {
    // For now, return all plugins. In a real implementation, 
    // this would check against a configuration store
    return this.getAll();
  }

  // Additional utility methods
  has(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  clear(): void {
    this.plugins.clear();
    console.log('All plugins unregistered');
  }

  getPluginIds(): string[] {
    return Array.from(this.plugins.keys());
  }

  // Plugin discovery
  findByVersion(version: string): PluginAdapter[] {
    return this.getAll().filter(plugin => plugin.version === version);
  }

  searchByName(query: string): PluginAdapter[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(plugin => 
      plugin.name.toLowerCase().includes(lowerQuery) ||
      plugin.description.toLowerCase().includes(lowerQuery)
    );
  }
}

// Export singleton instance
export const pluginRegistry = PluginRegistryImpl.getInstance();
