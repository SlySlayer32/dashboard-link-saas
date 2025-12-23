import type { PluginTestResult, PluginWithConfig } from '@dashboard-link/shared';
import { useState } from 'react';
import { Button } from './ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/Card';

interface PluginCardProps {
  plugin: PluginWithConfig;
  onToggle: (pluginId: string, enabled: boolean) => Promise<void>;
  onConfigure: (plugin: PluginWithConfig) => void;
  onTest: (pluginId: string) => Promise<PluginTestResult>;
  onDelete: (pluginId: string) => Promise<void>;
}

export function PluginCard({ 
  plugin, 
  onToggle, 
  onConfigure, 
  onTest, 
  onDelete 
}: PluginCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<PluginTestResult | null>(null);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggle(plugin.id, !plugin.enabled);
    } finally {
      setIsToggling(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await onTest(plugin.id);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this plugin configuration?')) {
      await onDelete(plugin.id);
    }
  };

  const getStatusColor = () => {
    if (!plugin.enabled) return 'bg-gray-100 text-gray-800';
    if (plugin.status?.connected) return 'bg-green-100 text-green-800';
    if (plugin.status?.error) return 'bg-red-100 text-red-800';
    if (plugin.configured) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = () => {
    if (!plugin.enabled) return 'Disabled';
    if (plugin.status?.connected) return 'Connected';
    if (plugin.status?.error) return 'Error';
    if (plugin.configured) return 'Configured';
    return 'Not configured';
  };

  const getCategoryIcon = () => {
    switch (plugin.category) {
      case 'calendar':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'task':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
    }
  };

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
              {getCategoryIcon()}
            </div>
            <div>
              <CardTitle className="text-lg">{plugin.name}</CardTitle>
              <CardDescription className="mt-1">
                {plugin.description}
              </CardDescription>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Version</span>
            <span className="font-medium">{plugin.version}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Category</span>
            <span className="font-medium capitalize">{plugin.category}</span>
          </div>

          {plugin.webhookSupported && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Webhooks</span>
              <span className="font-medium text-green-600">Supported</span>
            </div>
          )}

          {plugin.status?.lastTested && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Last tested</span>
              <span className="font-medium">
                {new Date(plugin.status.lastTested).toLocaleDateString()}
              </span>
            </div>
          )}

          {testResult && (
            <div className={`p-3 rounded-md text-sm ${
              testResult.success 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              {testResult.message}
            </div>
          )}

          {plugin.status?.error && !testResult && (
            <div className="p-3 rounded-md text-sm bg-red-50 text-red-800">
              {plugin.status.error}
            </div>
          )}

          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900">Features:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {plugin.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>

      <CardFooter className="space-y-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <Button
              variant={plugin.enabled ? "default" : "outline"}
              size="sm"
              onClick={handleToggle}
              disabled={isToggling}
              loading={isToggling}
            >
              {plugin.enabled ? 'Enabled' : 'Enable'}
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {plugin.configured && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={isTesting || !plugin.enabled}
                loading={isTesting}
              >
                {isTesting ? 'Testing...' : 'Test'}
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConfigure(plugin)}
            >
              {plugin.configured ? 'Edit' : 'Configure'}
            </Button>

            {plugin.configured && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            )}
          </div>
        </div>

        {plugin.documentationUrl && (
          <div className="w-full">
            <a
              href={plugin.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View documentation
            </a>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
