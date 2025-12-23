import { keepPreviousData, useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface TokensParams {
  page?: number;
  limit?: number;
  workerId?: string;
  status?: 'active' | 'used' | 'expired' | 'revoked';
}

export interface WorkerToken {
  id: string;
  worker_id: string;
  token: string;
  expires_at: string;
  created_at: string;
  used_at?: string;
  revoked: boolean;
  workers?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
}

export interface TokenStats {
  total: number;
  active: number;
  used: number;
  expired: number;
  revoked: number;
}

export function useTokens(params: TokensParams = {}): UseQueryResult<TokensResponse> {
  const {
    page = 1,
    limit = 20,
    workerId,
    status,
  } = params;

  return useQuery({
    queryKey: ['tokens', page, limit, workerId, status],
    queryFn: async (): Promise<TokensResponse> => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const searchParams = new URLSearchParams();
      searchParams.set('page', page.toString());
      searchParams.set('limit', limit.toString());
      
      if (workerId) searchParams.set('workerId', workerId);
      if (status) searchParams.set('status', status);

      const response = await fetch(`${API_BASE}/tokens?${searchParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch tokens');
      }

      return response.json();
    },
    placeholderData: keepPreviousData,
  });
}

export function useTokenStats(): UseQueryResult<{ success: boolean; data: TokenStats }> {
  return useQuery({
    queryKey: ['token-stats'],
    queryFn: async (): Promise<{ success: boolean; data: TokenStats }> => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE}/tokens/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch token stats');
      }

      return response.json();
    },
  });
}

export function useRevokeToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tokenId: string) => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE}/tokens/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tokenId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to revoke token');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      queryClient.invalidateQueries({ queryKey: ['token-stats'] });
    },
  });
}

export function useRegenerateToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workerId, expiryHours = 24 }: { workerId: string; expiryHours?: number }) => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE}/tokens/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workerId, expiryHours }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to regenerate token');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      queryClient.invalidateQueries({ queryKey: ['token-stats'] });
    },
  });
}

export function useBulkRevokeExpired() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE}/tokens/bulk-revoke-expired`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to bulk revoke expired tokens');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      queryClient.invalidateQueries({ queryKey: ['token-stats'] });
    },
  });
}

interface TokensResponse {
  success: boolean;
  data: WorkerToken[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
