import { useState } from 'react';
import { Button } from './ui/Button';
import { FormField } from './ui/Form';

interface AirtableConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function AirtableConfig({ config, onChange }: AirtableConfigProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const updateConfig = (key: string, value: unknown) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  const testConnection = async () => {
    const apiKey = config.apiKey as string;
    const baseId = config.baseId as string;
    
    if (!apiKey || !baseId) {
      setTestResult({
        success: false,
        message: 'Please enter API Key and Base ID first',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Test the connection by fetching bases
      const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Invalid API Key or Base ID');
      }

      const data = await response.json();
      setTestResult({
        success: true,
        message: `Successfully connected to "${data.name}"`,
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
          label="API Key"
          name="apiKey"
          type="password"
          placeholder="Enter Airtable API Key"
          value={(config.apiKey as string) || ''}
          registration={() => ({})}
          onChange={(e) => updateConfig('apiKey', e.target.value)}
          helperText="Found in Airtable Account settings > Developer hub > Personal access tokens"
        />

        <FormField
          label="Base ID"
          name="baseId"
          placeholder="Enter Airtable Base ID"
          value={(config.baseId as string) || ''}
          registration={() => ({})}
          onChange={(e) => updateConfig('baseId', e.target.value)}
          helperText="Found in the API documentation page of your base"
        />

        <FormField
          label="Table Name (Optional)"
          name="tableName"
          placeholder="Enter table name"
          value={(config.tableName as string) || ''}
          registration={() => ({})}
          onChange={(e) => updateConfig('tableName', e.target.value)}
          helperText="Leave empty to sync all tables in the base"
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
          disabled={isTesting || !config.apiKey || !config.baseId}
          loading={isTesting}
          className="w-full"
        >
          {isTesting ? 'Testing...' : 'Test Connection'}
        </Button>
      </div>

      {/* Help Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">
          How to get your Airtable credentials
        </h4>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li>Go to Airtable Account settings</li>
          <li>Navigate to the Developer hub</li>
          <li>Create a new Personal Access Token with scopes: data.records:read and schema.bases:read</li>
          <li>Copy the token as your API Key</li>
          <li>Open your base and go to Help > API documentation</li>
          <li>Copy the Base ID from the authentication section</li>
        </ol>
      </div>
    </div>
  );
}
