import { useEffect, useState } from 'react';
import { Button } from './ui/Button';
import { FormField } from './ui/Form';

interface GoogleCalendarConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function GoogleCalendarConfig({ config, onChange }: GoogleCalendarConfigProps) {
  const [isOAuthFlow, setIsOAuthFlow] = useState(false);
  const [oauthError, setOAuthError] = useState<string | null>(null);

  const updateConfig = (key: string, value: unknown) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  const handleOAuthConnect = () => {
    // Check if we have the required OAuth configuration
    const clientId = config.clientId as string;
    const clientSecret = config.clientSecret as string;
    
    if (!clientId || !clientSecret) {
      setOAuthError('Please enter Client ID and Client Secret first');
      return;
    }

    // Build OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', `${window.location.origin}/auth/google/callback`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar.readonly');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', JSON.stringify({ pluginId: 'google-calendar' }));

    // Open popup for OAuth flow
    const popup = window.open(
      authUrl.toString(),
      'google-oauth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    setIsOAuthFlow(true);
    setOAuthError(null);

    // Listen for messages from the popup
    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'OAUTH_SUCCESS') {
        const { accessToken, refreshToken } = event.data;
        updateConfig('accessToken', accessToken);
        updateConfig('refreshToken', refreshToken);
        popup?.close();
        setIsOAuthFlow(false);
      } else if (event.data.type === 'OAUTH_ERROR') {
        setOAuthError(event.data.error || 'OAuth failed');
        popup?.close();
        setIsOAuthFlow(false);
      }
    };

    window.addEventListener('message', messageHandler);

    // Cleanup
    return () => {
      window.removeEventListener('message', messageHandler);
      if (popup && !popup.closed) {
        popup.close();
      }
    };
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (isOAuthFlow) {
        setIsOAuthFlow(false);
      }
    };
  }, [isOAuthFlow]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <FormField
          label="Client ID"
          name="clientId"
          placeholder="Enter Google OAuth Client ID"
          value={(config.clientId as string) || ''}
          registration={() => ({})}
          onChange={(e) => updateConfig('clientId', e.target.value)}
          helperText="Found in Google Cloud Console under APIs & Services > Credentials"
        />

        <FormField
          label="Client Secret"
          name="clientSecret"
          type="password"
          placeholder="Enter Google OAuth Client Secret"
          value={(config.clientSecret as string) || ''}
          registration={() => ({})}
          onChange={(e) => updateConfig('clientSecret', e.target.value)}
          helperText="Keep this secret and never expose it in client-side code"
        />

        <FormField
          label="Calendar ID (Optional)"
          name="calendarId"
          placeholder="primary"
          value={(config.calendarId as string) || 'primary'}
          registration={() => ({})}
          onChange={(e) => updateConfig('calendarId', e.target.value || 'primary')}
          helperText="Use 'primary' for the main calendar or enter a specific calendar ID"
        />
      </div>

      {/* OAuth Status */}
      {(config.accessToken || config.refreshToken) && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Google Calendar Connected
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your Google Calendar account is successfully connected.</p>
                <p className="mt-1">
                  Access token: {config.accessToken ? 'Present' : 'Missing'}
                </p>
                <p>
                  Refresh token: {config.refreshToken ? 'Present' : 'Missing'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OAuth Error */}
      {oauthError && (
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
                Authentication Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{oauthError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OAuth Connect Button */}
      <div className="pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleOAuthConnect}
          disabled={isOAuthFlow || !config.clientId || !config.clientSecret}
          loading={isOAuthFlow}
          className="w-full"
        >
          {isOAuthFlow ? 'Connecting...' : 'Connect with Google Calendar'}
        </Button>
        <p className="mt-2 text-xs text-gray-500">
          This will open a popup window to authenticate with Google
        </p>
      </div>

      {/* Redirect URI Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          OAuth Redirect URI
        </h4>
        <p className="text-sm text-gray-600 mb-2">
          Add this URL to your Google OAuth app's authorized redirect URIs:
        </p>
        <code className="block p-2 bg-white border border-gray-300 rounded text-xs break-all">
          {`${window.location.origin}/auth/google/callback`}
        </code>
      </div>
    </div>
  );
}
