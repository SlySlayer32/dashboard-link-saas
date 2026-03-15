import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWorkerMutations } from './useWorkers'

const updateWorkerMock = vi.fn()
const toastErrorMock = vi.fn()
const toastSuccessMock = vi.fn()

vi.mock('../lib/api/workers', () => ({
  createWorker: vi.fn(),
  deleteWorker: vi.fn(),
  getWorker: vi.fn(),
  getWorkers: vi.fn(),
  updateWorker: (...args: unknown[]) => updateWorkerMock(...args),
}))

vi.mock('react-hot-toast', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}))

describe('useWorkerMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the concurrent edit message when update returns a CONCURRENT_EDIT error', async () => {
    const error = new Error('Worker was updated by another user') as Error & { code?: string }
    error.code = 'CONCURRENT_EDIT'
    updateWorkerMock.mockRejectedValueOnce(error)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useWorkerMutations(), { wrapper })

    await expect(
      result.current.updateWorker.mutateAsync({
        id: 'worker-1',
        data: {
          name: 'Updated Name',
          updatedAt: '2026-03-11T10:00:00.000Z',
        },
      })
    ).rejects.toThrow('Worker was updated by another user')

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Worker was updated by another user. Please refresh and try again.'
      )
    })
  })
})
