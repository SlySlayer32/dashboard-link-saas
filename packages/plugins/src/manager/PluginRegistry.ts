import {
    PluginRegistry as IPluginRegistry,
    PluginAdapter
} from '@dashboard-link/shared';

// Simple in-memory plugin registry implementation
export class PluginRegistryImpl implements IPluginRegistry {
    private plugins = new Map<string, PluginAdapter>();

    register(plugin: PluginAdapter): void {
        this.plugins.set(plugin.id, plugin);
    }

    unregister(pluginId: string): void {
        this.plugins.delete(pluginId);
    }

    get(pluginId: string): PluginAdapter | undefined {
        return this.plugins.get(pluginId);
    }

    getAll(): PluginAdapter[] {
        return Array.from(this.plugins.values());
    }

    getEnabled(): PluginAdapter[] {
        // For now, return all plugins. In a real implementation,
        // you would check plugin.enabled status
        return this.getAll();
    }
}

// Export singleton instance
export const pluginRegistry = new PluginRegistryImpl();
