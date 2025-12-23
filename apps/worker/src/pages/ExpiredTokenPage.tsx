import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ErrorLayout from '../components/ErrorLayout';
import { errorTracking } from '../lib/errorTracking';

export default function ExpiredTokenPage() {
  const [searchParams] = useSearchParams();
  const expiredAt = searchParams.get('expiredAt');
  
  useEffect(() => {
    errorTracking.trackError({
      type: 'expired_token',
      message: 'User accessed expired token page',
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      errorCode: 'WORKER_403',
    });
  }, []);
  
  const formatExpiryDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  };

  return (
    <ErrorLayout
      title="Link Expired"
      description="This dashboard link has expired and is no longer accessible."
      errorCode="WORKER_403"
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        
        <div className="text-sm text-gray-600">
          <p className="mb-2">
            Dashboard links are only valid for a limited time for security reasons.
          </p>
          {expiredAt && formatExpiryDate(expiredAt) && (
            <p className="mb-2">
              This link expired on: <br />
              <span className="font-medium">{formatExpiryDate(expiredAt)}</span>
            </p>
          )}
          <p>
            After expiration, you'll need a new link to access your dashboard.
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-sm text-yellow-800">
            <strong>To get a new link:</strong> Contact your administrator or wait for the daily SMS notification.
          </p>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <p className="text-xs text-gray-600">
            <strong>Tip:</strong> Dashboard links are typically sent daily at the time configured by your organization.
          </p>
        </div>
      </div>
    </ErrorLayout>
  );
}
