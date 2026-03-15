import type { Worker } from '@dashboard-link/shared'
import { SkeletonTable } from '@dashboard-link/ui'
import { useState } from 'react'
import { DeleteWorkerDialog } from '../DeleteWorkerDialog'
import { WorkerCard } from './WorkerCard'

interface WorkerListProps {
  workers: Worker[]
  isLoading: boolean
  error?: Error | null
  isDeleting?: boolean
  onEdit: (worker: Worker) => void
  onDelete: (worker: Worker) => Promise<void>
  onRetry?: () => void
}

export function WorkerList({
  workers,
  isLoading,
  error,
  isDeleting = false,
  onEdit,
  onDelete,
  onRetry,
}: WorkerListProps) {
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null)

  const handleDeleteClick = (worker: Worker) => {
    setWorkerToDelete(worker)
  }

  const handleDeleteConfirm = async () => {
    if (workerToDelete) {
      await onDelete(workerToDelete)
      setWorkerToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setWorkerToDelete(null)
  }

  if (isLoading) {
    return <SkeletonTable rows={10} columns={6} className='bg-white shadow rounded-lg' />
  }

  if (error) {
    return (
      <div className='rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h3 className='text-sm font-medium text-red-800'>Error loading workers</h3>
            <p className='mt-1 text-sm text-red-700'>{error.message}</p>
          </div>
          {onRetry ? (
            <button
              type='button'
              onClick={onRetry}
              className='inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100'
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <>
      {workers.length === 0 ? (
        <div className='rounded-lg bg-white px-6 py-12 text-center text-sm text-gray-500 shadow'>
          No workers yet. Add your first worker to get started.
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4'>
          {workers.map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              isDeleting={isDeleting}
              onEdit={onEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <DeleteWorkerDialog
        worker={workerToDelete}
        isOpen={workerToDelete !== null}
        isLoading={isDeleting}
        onClose={handleDeleteCancel}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </>
  )
}
