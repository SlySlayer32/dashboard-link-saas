import { QueryClient } from '@tanstack/react-query'

export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error: unknown) => {
          // Don't retry on 4xx errors (except 408 Request Timeout and 429 Too Many Requests)
          const err = error as { response?: { status?: number } }
          if (
            err?.response?.status !== undefined &&
            err.response.status >= 400 &&
            err.response.status < 500 &&
            err.response.status !== 408 &&
            err.response.status !== 429
          ) {
            return false
          }
          // Retry up to 3 times
          return failureCount < 3
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Note: onError cannot be used here directly with useApiError
        // as it would create a hook outside of React context
        // Error handling should be done in individual mutation hooks
      },
    },
  })
}
