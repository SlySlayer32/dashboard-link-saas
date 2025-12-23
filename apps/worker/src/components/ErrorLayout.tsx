import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ErrorLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  errorCode?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

export default function ErrorLayout({
  children,
  title,
  description,
  errorCode,
  showRetry = false,
  onRetry,
}: ErrorLayoutProps) {
  const copyErrorToClipboard = () => {
    const errorInfo = {
      error: title,
      code: errorCode,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };
    
    navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* Logo/Branding */}
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-10 w-10 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          
          <h1 className="mt-6 text-3xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-2 text-sm text-gray-600">{description}</p>
          )}
          
          {errorCode && (
            <div className="mt-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Error Code: {errorCode}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            {/* Error-specific content */}
            <div className="text-center text-gray-600">
              {children}
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              {showRetry && onRetry && (
                <button
                  onClick={onRetry}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Try Again
                </button>
              )}
              
              <Link
                to="/"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Return to Home
              </Link>
            </div>
          </div>

          {/* Support information */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Need help? Contact your administrator
              </p>
              <button
                onClick={copyErrorToClipboard}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Copy error details for support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
