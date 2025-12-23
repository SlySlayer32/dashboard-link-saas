import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';

interface Organization {
  id: string;
  name: string;
  sms_sender_id?: string;
  default_token_expiry_hours: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface UpdateOrganizationRequest {
  name?: string;
  sms_sender_id?: string;
  default_token_expiry_hours?: number;
  metadata?: Record<string, unknown>;
}

async function fetchOrganization(token: string): Promise<Organization> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/organizations`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch organization');
  }

  const data = await response.json();
  return data.data;
}

async function updateOrganization(
  token: string,
  data: UpdateOrganizationRequest
): Promise<Organization> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/organizations`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update organization');
  }

  const result = await response.json();
  return result.data;
}

async function deleteOrganization(token: string): Promise<void> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/organizations`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete organization');
  }
}

export function useOrganization() {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ['organization'],
    queryFn: () => fetchOrganization(token || ''),
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateOrganization() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateOrganizationRequest) =>
      updateOrganization(token || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organization'],
      });
    },
  });
}

export function useDeleteOrganization() {
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: () => deleteOrganization(token || ''),
  });
}

export type { Organization, UpdateOrganizationRequest };
