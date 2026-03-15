import type { Worker } from '@dashboard-link/shared'
import { SkeletonTable } from '@dashboard-link/ui'
import { useState } from 'react'
import { DeleteWorkerDialog } from './DeleteWorkerDialog'
import { WorkerCard } from './workers/WorkerCard'

interface WorkerListProps {
  workers: Worker[]
  isLoading: boolean
  isDeleting?: boolean
  onEdit: (worker: Worker) => void
  onDelete: (worker: Worker) => Promise<void>
}

export function WorkerList({
  workers,
  isLoading,
  isDeleting = false,
  onEdit,
  onDelete,
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
