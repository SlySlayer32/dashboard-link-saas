import { format } from 'date-fns';
import type { WorkerToken } from '../hooks/useTokens';
import { TokenActions } from './TokenActions';

interface TokenTableProps {
  tokens: WorkerToken[];
  isLoading?: boolean;
  onRevoke?: (tokenId: string) => void;
  onRegenerate?: (workerId: string) => void;
}

export function TokenTable({ tokens, isLoading, onRevoke, onRegenerate }: TokenTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-4 animate-pulse">
              <div className="flex space-x-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4a9.971 9.971 0 01.712-3.714M28 16a4 4 0 11-8 0 4 4 0 018 0zM20 28a4 4 0 11-8 0 4 4 0 018 0zM36 28a4 4 0 11-8 0 4 4 0 018 0z"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tokens</h3>
          <p className="mt-1 text-sm text-gray-500">No tokens found matching your criteria.</p>
        </div>
      </div>
    );
  }

  const getTokenStatus = (token: WorkerToken): { status: string; color: string } => {
    if (token.revoked) return { status: 'Revoked', color: 'text-red-600 bg-red-100' };
    if (new Date(token.expires_at) < new Date()) return { status: 'Expired', color: 'text-gray-600 bg-gray-100' };
    if (token.used_at) return { status: 'Used', color: 'text-blue-600 bg-blue-100' };
    return { status: 'Active', color: 'text-green-600 bg-green-100' };
  };

  const getTimeUntilExpiry = (expiresAt: string): string => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }

    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Worker
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Token
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expires In
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Used At
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tokens.map((token) => {
              const statusInfo = getTokenStatus(token);
              return (
                <tr key={token.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {token.workers?.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {token.workers?.name || 'Unknown Worker'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {token.workers?.phone || 'No phone'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">
                      {token.token.substring(0, 8)}...
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(token.token)}
                      className="text-xs text-gray-500 hover:text-gray-700 mt-1"
                    >
                      Copy full token
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                      {statusInfo.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(token.created_at), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{getTimeUntilExpiry(token.expires_at)}</div>
                    <div className="text-xs text-gray-400">
                      {format(new Date(token.expires_at), 'MMM d, HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {token.used_at ? format(new Date(token.used_at), 'MMM d, HH:mm') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <TokenActions
                      token={token}
                      onRevoke={() => onRevoke?.(token.id)}
                      onRegenerate={() => onRegenerate?.(token.worker_id)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
