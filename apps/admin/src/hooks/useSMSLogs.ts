import type { SMSLog } from '@dashboard-link/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface SMSLogsParams {
  page?: number;
  limit?: number;
  workerId?: string;
  // Note: status, dateFrom, dateTo, and search filters are not yet supported by the API
  // They are included for future implementation
  status?: SMSLog['status'];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export function useSMSLogs(params: SMSLogsParams = {}): UseQueryResult<SMSLogsResponse> {
  const {
    page = 1,
    limit = 20,
    workerId,
    // The following filters are not yet supported by the API
    status,
    dateFrom,
    dateTo,
    search,
  } = params;

  return useQuery({
    queryKey: ['sms-logs', page, limit, workerId, status, dateFrom, dateTo, search],
    queryFn: async (): Promise<SMSLogsResponse> => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const searchParams = new URLSearchParams();
      searchParams.set('page', page.toString());
      searchParams.set('limit', limit.toString());
      
      // Only send workerId filter as it's the only one supported by the API
      if (workerId) searchParams.set('workerId', workerId);
      // TODO: Add support for these filters in the API
      // if (status) searchParams.set('status', status);
      // if (dateFrom) searchParams.set('dateFrom', dateFrom);
      // if (dateTo) searchParams.set('dateTo', dateTo);
      // if (search) searchParams.set('search', search);

      const response = await fetch(`${API_BASE}/sms/logs?${searchParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch SMS logs');
      }

      return response.json();
    },
    placeholderData: keepPreviousData,
  });
}

interface SMSLogsResponse {
  success: boolean;
  data: SMSLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
