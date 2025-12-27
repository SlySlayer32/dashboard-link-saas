import { Worker } from '@dashboard-link/shared'
import React, { useState } from 'react'
import {
  useCreateWorker,
  useDeleteWorker,
  useUpdateWorker,
  useWorkers,
} from '../../hooks/template/useWorkers'
import { ErrorBoundary } from '../common/ErrorBoundary'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { EmptyState } from '../ui/EmptyState'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Pagination } from '../ui/Pagination'
import { SearchInput } from '../ui/SearchInput'
import { WorkerCard } from './WorkerCard'
import { WorkerModal } from './WorkerModal'

// Temporary local type definition to fix import issues
interface WorkerQuerySchema {
  page: number
  limit: number
  search?: string
  active?: boolean
  organization_id?: string
}

interface WorkerListProps {
  className?: string
  initialQuery?: Partial<WorkerQuerySchema>
}

export const WorkerList: React.FC<WorkerListProps> = ({ className, initialQuery = {} }) => {
  const [query, setQuery] = useState<WorkerQuerySchema>({
    page: 1,
    limit: 10,
    ...initialQuery,
  })

  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Fetch workers
  const { data, isLoading, error: _error, refetch } = useWorkers(query)

  // Mutations
  const createWorkerMutation = useCreateWorker()
  const updateWorkerMutation = useUpdateWorker()
  const deleteWorkerMutation = useDeleteWorker()

  // Handle search
  const handleSearch = (search: string) => {
    setQuery((prev) => ({ ...prev, search, page: 1 }))
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setQuery((prev) => ({ ...prev, page }))
  }

  // Handle create
  const handleCreate = async (data: Worker) => {
    try {
      await createWorkerMutation.mutateAsync(data)
      setIsCreateModalOpen(false)
    } catch {
      // Error is handled in the hook
    }
  }

  // Handle update
  const handleUpdate = async (data: Partial<Worker>) => {
    if (!selectedWorker) return

    try {
      await updateWorkerMutation.mutateAsync({
        id: selectedWorker.id,
        data,
      })
      setSelectedWorker(null)
    } catch {
      // Error is handled in the hook
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteWorkerMutation.mutateAsync(id)
      setDeleteConfirmId(null)
    } catch {
      // Error is handled in the hook
    }
  }

  // Loading state
  if (isLoading && !data) {
    return (
      <div className='flex justify-center items-center h-64'>
        <LoadingSpinner size='lg' />
      </div>
    )
  }

  // Error state
  if (_error && !data) {
    return (
      <div className='p-6'>
        <div className='bg-red-50 border border-red-200 rounded-md p-4'>
          <h3 className='text-sm font-medium text-red-800'>Failed to load workers</h3>
          <p className='mt-2 text-sm text-red-700'>
            {(_error as Error).message || 'An unexpected error occurred'}
          </p>
          <Button onClick={() => refetch()} variant='outline' size='sm' className='mt-3'>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Empty state
  if (!data?.data?.length && !isLoading) {
    return (
      <div className={className}>
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-2xl font-semibold text-gray-900'>Workers</h2>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={createWorkerMutation.isPending}
          >
            Add Worker
          </Button>
        </div>

        <EmptyState
          title='No workers found'
          description='Get started by adding your first worker.'
          action={
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={createWorkerMutation.isPending}
            >
              Add Worker
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <ErrorBoundary
      fallback={
        <div className='p-6'>
          <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4'>
            <h3 className='text-sm font-medium text-yellow-800'>Something went wrong</h3>
            <p className='mt-2 text-sm text-yellow-700'>Please refresh the page and try again.</p>
            <Button
              onClick={() => window.location.reload()}
              variant='outline'
              size='sm'
              className='mt-3'
            >
              Refresh Page
            </Button>
          </div>
        </div>
      }
    >
      <div className={className}>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6'>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4 sm:mb-0'>
            Workers
            {data?.pagination && (
              <span className='ml-2 text-sm font-normal text-gray-500'>
                ({data.pagination.total} total)
              </span>
            )}
          </h2>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={createWorkerMutation.isPending}
          >
            Add Worker
          </Button>
        </div>

        {/* Filters */}
        <div className='mb-6 flex flex-col sm:flex-row gap-4'>
          <SearchInput
            placeholder='Search workers...'
            value={query.search || ''}
            onChange={handleSearch}
            className='w-full sm:w-96'
          />

          <select
            value={query.active === undefined ? '' : query.active.toString()}
            onChange={(e) => {
              const value = e.target.value
              setQuery((prev) => ({
                ...prev,
                active: value === '' ? undefined : value === 'true',
                page: 1,
              }))
            }}
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value=''>All Status</option>
            <option value='true'>Active</option>
            <option value='false'>Inactive</option>
          </select>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className='absolute inset-0 bg-white bg-opacity-50 flex justify-center items-center z-10'>
            <LoadingSpinner />
          </div>
        )}

        {/* Worker list */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {data?.data?.map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              onEdit={() => setSelectedWorker(worker)}
              onDelete={() => setDeleteConfirmId(worker.id)}
              disabled={updateWorkerMutation.isPending || deleteWorkerMutation.isPending}
            />
          ))}
        </div>

        {/* Pagination */}
        {data?.pagination && (
          <div className='mt-6'>
            <Pagination
              currentPage={query.page}
              totalPages={Math.ceil(data.pagination.total / query.limit)}
              onPageChange={handlePageChange}
              totalItems={data.pagination.total}
              itemsPerPage={query.limit}
            />
          </div>
        )}

        {/* Create Modal */}
        <WorkerModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreate}
          isLoading={createWorkerMutation.isPending}
          title='Add New Worker'
        />

        {/* Edit Modal */}
        {selectedWorker && (
          <WorkerModal
            isOpen={!!selectedWorker}
            onClose={() => setSelectedWorker(null)}
            onSubmit={handleUpdate}
            isLoading={updateWorkerMutation.isPending}
            title='Edit Worker'
            initialData={selectedWorker}
          />
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
          title='Delete Worker'
          message='Are you sure you want to delete this worker? This action cannot be undone.'
          confirmText='Delete'
          cancelText='Cancel'
          variant='danger'
          isLoading={deleteWorkerMutation.isPending}
        />
      </div>
    </ErrorBoundary>
  )
}
