import { CheckCircle, ChevronLeft, ChevronRight, Clock, MessageSquare, Search, XCircle } from 'lucide-react';
import React, { useState } from 'react';

interface SmsLog {
  id: string;
  phone: string;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  created_at: string;
  worker_id: string;
  error_message?: string;
}

interface SmsHistoryProps {
  workerId: string;
  isLoading?: boolean;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'sent':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-yellow-500" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'sent':
      return 'text-green-700 bg-green-50';
    case 'failed':
      return 'text-red-700 bg-red-50';
    default:
      return 'text-yellow-700 bg-yellow-50';
  }
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

function formatMessage(message: string, maxLength: number = 100) {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
}

export function SmsHistory({ workerId: _workerId, isLoading }: SmsHistoryProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Mock data for now - will be replaced with actual API call
  const mockSmsLogs: SmsLog[] = [];
  const totalPages = 1;
  const isLoadingData = isLoading || false;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SMS History</h3>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </form>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden">
        {isLoadingData ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-start space-x-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : mockSmsLogs.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No SMS history found</p>
            <p className="text-sm text-gray-400 mt-1">Send your first SMS to this worker to see activity here</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {mockSmsLogs.map((log) => (
                <div key={log.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(log.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(log.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mb-1">
                          {formatMessage(log.message)}
                        </p>
                        {log.error_message && (
                          <p className="text-xs text-red-600 mt-1">
                            Error: {log.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {page} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    {page}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
