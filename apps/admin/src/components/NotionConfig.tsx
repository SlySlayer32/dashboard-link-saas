import { useState } from 'react';
import { Button } from './ui/Button';
import { FormField } from './ui/Form';

interface NotionConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function NotionConfig({ config, onChange }: NotionConfigProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const updateConfig = (key: string, value: unknown) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  const testConnection = async () => {
    const integrationSecret = config.integrationSecret as string;
    const databaseId = config.databaseId as string;
    
    if (!integrationSecret || !databaseId) {
      setTestResult({
        success: false,
        message: 'Please enter Integration Secret and Database ID first',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Test the connection by fetching the database
      const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
        headers: {
          Authorization: `Bearer ${integrationSecret}`,
          'Notion-Version': '2022-06-28',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Invalid credentials');
      }

      const data = await response.json();
      setTestResult({
        success: true,
        message: `Successfully connected to database "${data.title[0]?.plain_text || 'Unknown'}"`,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <FormField
          label="Integration Secret"
          name="integrationSecret"
          type="password"
          placeholder="Enter Notion Integration Secret"
          value={(config.integrationSecret as string) || ''}
          registration={() => ({})}
          onChange={(e) => updateConfig('integrationSecret', e.target.value)}
          helperText="Found in Notion under Settings > My connections > Develop your own integrations"
        />

        <FormField
          label="Database ID"
          name="databaseId"
          placeholder="Enter Notion Database ID"
          value={(config.databaseId as string) || ''}
          registration={() => ({})}
          onChange={(e) => updateConfig('databaseId', e.target.value)}
          helperText="Found in the URL of your Notion database (the long string after /?v= and before &)"
        />
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`p-3 rounded-md text-sm ${
          testResult.success 
            ? 'bg-green-50 text-green-800' 
            : 'bg-red-50 text-red-800'
        }`}>
          {testResult.message}
        </div>
      )}

      {/* Test Connection Button */}
      <div className="pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={testConnection}
          disabled={isTesting || !config.integrationSecret || !config.databaseId}
          loading={isTesting}
          className="w-full"
        >
          {isTesting ? 'Testing...' : 'Test Connection'}
        </Button>
      </div>

      {/* Help Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">
          How to get your Notion credentials
        </h4>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li>Go to Notion and create a new integration at notion.so/my-integrations</li>
          <li>Give your integration a name and an icon</li>
          <li>Under "Capabilities", enable "Read content" and "Update content"</li>
          <li>Under "User Capabilities", enable "Read user information" if needed</li>
          <li>Copy the "Internal Integration Secret"</li>
          <li>Share your integration with the database you want to sync</li>
          <li>Click "Share" on your database, invite your integration, and grant access</li>
          <li>Copy the Database ID from the URL</li>
        </ol>
      </div>

      {/* Database Requirements */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">
          Database Requirements
        </h4>
        <p className="text-sm text-yellow-700 mb-2">
          Your Notion database should include the following properties:
        </p>
        <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
          <li><strong>Title/Name</strong> - Text property for task/schedule name</li>
          <li><strong>Due Date</strong> - Date property (required for scheduling)</li>
          <li><strong>Worker</strong> - Select or Relation property to assign to workers</li>
          <li><strong>Status</strong> - Select property (optional)</li>
          <li><strong>Description</strong> - Text or Rich Text property (optional)</li>
        </ul>
      </div>
    </div>
  );
}
