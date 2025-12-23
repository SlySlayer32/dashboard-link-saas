import { useEffect } from 'react';
import ErrorLayout from '../components/ErrorLayout';
import { errorTracking } from '../lib/errorTracking';

export default function NotFoundPage() {
  useEffect(() => {
    errorTracking.trackError({
      type: 'not_found',
      message: 'User accessed 404 page',
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      errorCode: 'WORKER_404',
    });
  }, []);
  return (
    <ErrorLayout
      title="Page Not Found"
      description="The page you're looking for doesn't exist."
      errorCode="WORKER_404"
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
            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33"
          />
          <circle cx="12" cy="12" r="10" />
        </svg>
        
        <div className="text-sm text-gray-600">
          <p className="mb-2">
            This might have happened because:
          </p>
          <ul className="list-disc list-inside space-y-1 text-left">
            <li>You typed the URL incorrectly</li>
            <li>The link you followed is outdated</li>
            <li>The page has been moved or deleted</li>
            <li>You're trying to access a restricted area</li>
          </ul>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            <strong>Quick tip:</strong> Make sure you're using the complete dashboard link sent to your phone.
          </p>
        </div>
        
        <div className="text-xs text-gray-500">
          <p>If you believe this is an error, please contact your administrator.</p>
        </div>
      </div>
    </ErrorLayout>
  );
}
