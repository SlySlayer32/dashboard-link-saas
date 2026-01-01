import React from 'react'
import { LoadingSpinner } from './LoadingSpinner'

// Define basic query result interfaces to avoid external dependency
interface BaseQueryResult<TData, TError> {
  data: TData | undefined
  error: TError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  isFetching?: boolean
  refetch?: () => void
}

interface BaseMutationResult<TData, TError> {
  data: TData | undefined
  error: TError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  isPending?: boolean
  reset: () => void
}

interface QueryBoundaryProps<TData, TError> {
  query: BaseQueryResult<TData, TError>
  children: (data: TData) => React.ReactNode
  loadingFallback?: React.ReactNode
  errorFallback?: React.ReactNode
  emptyFallback?: React.ReactNode
  isEmpty?: (data: TData) => boolean
}

interface MutationBoundaryProps<TData, TError> {
  mutation: BaseMutationResult<TData, TError>
  children: React.ReactNode
  loadingFallback?: React.ReactNode
  errorFallback?: React.ReactNode
  successMessage?: string
}

/**
 * Default error component for query failures
 */
const DefaultError: React.FC<{ error: unknown; retry?: () => void }> = ({ error, retry }) => {
  return (
    <div className='flex flex-col items-center justify-center p-8 text-center'>
      <div className='text-red-500 text-sm font-medium mb-2'>Something went wrong</div>
      <div className='text-gray-500 text-xs mb-4'>
        {error instanceof Error ? error.message : 'Unknown error'}
      </div>
      {retry && (
        <button onClick={retry} className='text-blue-600 text-sm hover:text-blue-700 underline'>
          Try again
        </button>
      )}
    </div>
  )
}

/**
 * QueryBoundary component for handling TanStack Query states
 */
export const QueryBoundary = <TData, TError>({
  query,
  children,
  loadingFallback,
  errorFallback,
  emptyFallback,
  isEmpty,
}: QueryBoundaryProps<TData, TError>) => {
  // Loading state
  if (query.isLoading) {
    return <>{loadingFallback || <LoadingSpinner />}</>
  }

  // Error state
  if (query.isError) {
    if (errorFallback) {
      return <>{errorFallback}</>
    }
    return <DefaultError error={query.error} retry={query.refetch ? () => query.refetch() : undefined} />
  }

  // Success state
  if (query.isSuccess) {
    const data = 'data' in query ? query.data : undefined

    // Empty state check
    if (isEmpty && data && isEmpty(data)) {
      return <>{emptyFallback || <div className='p-8 text-center text-gray-500'>No data</div>}</>
    }

    return <>{children(data as TData)}</>
  }

  // Fetching more (for infinite queries)
  if (query.isFetching && !query.isLoading) {
    return <>{children(('data' in query ? query.data : undefined) as TData)}</>
  }

  return null
}

/**
 * MutationBoundary component for handling mutation states
 */
export const MutationBoundary = <TData, TError>({
  mutation,
  children,
  loadingFallback,
  errorFallback,
  successMessage,
}: MutationBoundaryProps<TData, TError>) => {
  // Loading state
  if (mutation.isPending || mutation.isLoading) {
    return <>{loadingFallback || <LoadingSpinner />}</>
  }

  // Error state
  if (mutation.isError) {
    if (errorFallback) {
      return <>{errorFallback}</>
    }
    return <DefaultError error={mutation.error} />
  }

  // Success state
  if (mutation.isSuccess && successMessage) {
    return <div className='p-4 text-center text-green-600 text-sm'>{successMessage}</div>
  }

  return <>{children}</>
}
