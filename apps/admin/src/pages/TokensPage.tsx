import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { TokenTable } from '../components/TokenTable';
import { useBulkRevokeExpired, useRegenerateToken, useRevokeToken, useTokenStats, useTokens } from '../hooks/useTokens';

export function TokensPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    workerId: '',
    status: '' as 'active' | 'used' | 'expired' | 'revoked' | '',
  });
  const [timeNow, setTimeNow] = useState(new Date());

  // Update time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const { data, isLoading, error, refetch } = useTokens({
    page: currentPage,
    limit: 20,
    ...filters,
  });

  const { data: stats } = useTokenStats();
  const revokeToken = useRevokeToken();
  const regenerateToken = useRegenerateToken();
  const bulkRevokeExpired = useBulkRevokeExpired();

  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      workerId: '',
      status: '',
    });
    setCurrentPage(1);
  };

  const handleRevoke = async (tokenId: string) => {
    revokeToken.mutate(tokenId, {
      onSuccess: () => {
        refetch();
      },
      onError: (error: Error) => {
        console.error('Failed to revoke token:', error);
      },
    });
  };

  const handleRegenerate = async (workerId: string) => {
    regenerateToken.mutate(
      { workerId, expiryHours: 24 },
      {
        onSuccess: (response) => {
          refetch();
          // Copy new token to clipboard
          if (response.data?.token?.token) {
            navigator.clipboard.writeText(response.data.token.token);
            alert('New token generated and copied to clipboard!');
          }
        },
        onError: (error: Error) => {
          console.error('Failed to regenerate token:', error);
        },
      }
    );
  };

  const handleBulkRevokeExpired = async () => {
    setBulkError(null);
    setBulkSuccess(null);
    
    if (window.confirm('Are you sure you want to revoke all expired tokens?')) {
      bulkRevokeExpired.mutate(undefined, {
        onSuccess: (response) => {
          setBulkSuccess(response.data?.message || 'Bulk revoke completed');
          refetch();
        },
        onError: (error: Error) => {
          setBulkError(error.message);
        },
      });
    }
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading tokens
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error.message}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Tokens</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and monitor dashboard access tokens
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={handleBulkRevokeExpired}
            disabled={bulkRevokeExpired.isPending || !stats?.data?.expired}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkRevokeExpired.isPending ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            Clean Up Expired
            {stats?.data?.expired && ` (${stats.data.expired})`}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats?.data && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">T</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.data.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">A</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                    <dd className="text-lg font-medium text-green-600">{stats.data.active}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">U</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Used</dt>
                    <dd className="text-lg font-medium text-blue-600">{stats.data.used}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-400 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">E</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Expired</dt>
                    <dd className="text-lg font-medium text-gray-600">{stats.data.expired}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">R</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Revoked</dt>
                    <dd className="text-lg font-medium text-red-600">{stats.data.revoked}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Messages */}
      {bulkSuccess && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>{bulkSuccess}</p>
              </div>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setBulkSuccess(null)}
                  className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {bulkError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{bulkError}</p>
              </div>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setBulkError(null)}
                  className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="workerId" className="block text-sm font-medium text-gray-700 mb-1">
              Worker ID
            </label>
            <input
              type="text"
              id="workerId"
              placeholder="Enter worker ID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={filters.workerId}
              onChange={(e) => handleFilterChange('workerId', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="used">Used</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {data?.data.length || 0} of {data?.pagination.total || 0} tokens
        </p>
      </div>

      {/* Tokens Table */}
      <TokenTable
        tokens={data?.data || []}
        isLoading={isLoading}
        onRevoke={handleRevoke}
        onRegenerate={handleRegenerate}
      />

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(data.pagination.page - 1)}
              disabled={data.pagination.page <= 1}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-sm border rounded-md ${
                  page === data.pagination.page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(data.pagination.page + 1)}
              disabled={data.pagination.page >= data.pagination.totalPages}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
