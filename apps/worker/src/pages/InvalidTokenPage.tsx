import { useEffect } from 'react';
import ErrorLayout from '../components/ErrorLayout';
import { errorTracking } from '../lib/errorTracking';

export default function InvalidTokenPage() {
  useEffect(() => {
    errorTracking.trackError({
      type: 'invalid_token',
      message: 'User accessed invalid token page',
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      errorCode: 'WORKER_401',
    });
  }, []);
  return (
    <ErrorLayout
      title="Invalid Link"
      description="This dashboard link is not valid or has been cancelled."
      errorCode="WORKER_401"
    >
      <div className="space-y-4">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        
        <div className="text-sm text-gray-600">
          <p className="mb-2">
            The link you clicked may be:
          </p>
          <ul className="list-disc list-inside space-y-1 text-left">
            <li>Incorrect or incomplete</li>
            <li>Already used</li>
            <li>Cancelled by your administrator</li>
            <li>From a different organization</li>
          </ul>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            <strong>Next steps:</strong> Please contact your administrator to receive a new dashboard link.
          </p>
        </div>
      </div>
    </ErrorLayout>
  );
}
