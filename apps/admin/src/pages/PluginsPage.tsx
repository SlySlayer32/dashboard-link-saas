import {
    PluginInfo,
    PluginTestResult
} from '@dashboard-link/shared';
import { useEffect, useState } from 'react';
import { PluginCard } from '../components/PluginCard';
import { PluginConfigForm } from '../components/PluginConfigForm';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface PluginWithConfig extends PluginInfo {
  enabled: boolean;
  configured: boolean;
  config: Record<string, unknown>;
  status?: {
    id: string;
    enabled: boolean;
    configured: boolean;
    connected: boolean;
    lastTested?: string;
    error?: string;
  };
}

export function PluginsPage() {
  const [plugins, setPlugins] = useState<PluginWithConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginWithConfig | null>(null);
  const [isConfigFormOpen, setIsConfigFormOpen] = useState(false);

  const fetchPlugins = async () => {
    try {
      const response = await fetch('/api/plugins', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch plugins');
      }

      const data = await response.json();
      if (data.success) {
        setPlugins(data.data);
      } else {
        setError(data.error?.message || 'Failed to load plugins');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, []);

  const handleTogglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      const plugin = plugins.find(p => p.id === pluginId);
      if (!plugin) return;

      const response = await fetch(`/api/plugins/${pluginId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          enabled,
          config: plugin.config,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update plugin');
      }

      const data = await response.json();
      if (data.success) {
        setPlugins(prev => 
          prev.map(p => 
            p.id === pluginId 
              ? { ...p, enabled, status: data.data.status }
              : p
          )
        );
      } else {
        setError(data.error?.message || 'Failed to update plugin');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleConfigurePlugin = (plugin: PluginWithConfig) => {
    setSelectedPlugin(plugin);
    setIsConfigFormOpen(true);
  };

  const handleConfigSave = async (pluginId: string, config: Record<string, unknown>) => {
    try {
      const plugin = plugins.find(p => p.id === pluginId);
      if (!plugin) return;

      const response = await fetch(`/api/plugins/${pluginId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          enabled: plugin.enabled,
          config,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      const data = await response.json();
      if (data.success) {
        setPlugins(prev => 
          prev.map(p => 
            p.id === pluginId 
              ? { 
                  ...p, 
                  config: data.data.config, 
                  configured: true,
                  status: data.data.status 
                }
              : p
          )
        );
        setIsConfigFormOpen(false);
        setSelectedPlugin(null);
      } else {
        setError(data.error?.message || 'Failed to save configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleTestPlugin = async (pluginId: string): Promise<PluginTestResult> => {
    try {
      const plugin = plugins.find(p => p.id === pluginId);
      if (!plugin) {
        throw new Error('Plugin not found');
      }

      const response = await fetch(`/api/plugins/${pluginId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          config: plugin.config,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to test plugin');
      }

      const data = await response.json();
      if (data.success) {
        setPlugins(prev => 
          prev.map(p => 
            p.id === pluginId 
              ? { 
                  ...p, 
                  status: {
                    ...p.status,
                    connected: data.data.success,
                    lastTested: data.data.timestamp,
                    error: data.data.success ? undefined : 'Connection test failed',
                  }
                }
              : p
          )
        );
        return data.data;
      } else {
        throw new Error(data.error?.message || 'Test failed');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Test failed';
      setPlugins(prev => 
        prev.map(p => 
          p.id === pluginId 
            ? { 
                ...p, 
                status: {
                  ...p.status,
                  connected: false,
                  error,
                }
              }
            : p
        )
      );
      throw err;
    }
  };

  const handleDeleteConfig = async (pluginId: string) => {
    try {
      const response = await fetch(`/api/plugins/${pluginId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete configuration');
      }

      const data = await response.json();
      if (data.success) {
        setPlugins(prev => 
          prev.map(p => 
            p.id === pluginId 
              ? { 
                  ...p, 
                  enabled: false, 
                  config: {}, 
                  configured: false,
                  status: undefined
                }
              : p
          )
        );
      } else {
        setError(data.error?.message || 'Failed to delete configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading plugins
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    fetchPlugins();
                  }}
                >
                  Try again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plugins</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage external integrations to sync data with worker dashboards
          </p>
        </div>
      </div>

      {/* Plugin Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plugins.map((plugin) => (
          <PluginCard
            key={plugin.id}
            plugin={plugin}
            onToggle={handleTogglePlugin}
            onConfigure={handleConfigurePlugin}
            onTest={handleTestPlugin}
            onDelete={handleDeleteConfig}
          />
        ))}
      </div>

      {/* Configuration Form Modal */}
      {isConfigFormOpen && selectedPlugin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Configure {selectedPlugin.name}
              </h3>
              <button
                onClick={() => {
                  setIsConfigFormOpen(false);
                  setSelectedPlugin(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <PluginConfigForm
              plugin={selectedPlugin}
              config={selectedPlugin.config}
              onSave={handleConfigSave}
              onCancel={() => {
                setIsConfigFormOpen(false);
                setSelectedPlugin(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
