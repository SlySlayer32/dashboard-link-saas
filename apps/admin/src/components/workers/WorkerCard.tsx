import type { Worker } from '@dashboard-link/shared'
import { formatPhoneDisplay } from '@dashboard-link/shared'
import { Edit, Trash2 } from 'lucide-react'

interface WorkerCardProps {
  worker: Worker
  isDeleting?: boolean
  onEdit: (worker: Worker) => void
  onDelete: (worker: Worker) => void
}

export function WorkerCard({ worker, isDeleting = false, onEdit, onDelete }: WorkerCardProps) {
  const isInactive = worker.deletedAt !== null || !worker.active

  return (
    <div className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='flex items-center gap-2'>
            <h3 className='truncate text-base font-semibold text-gray-900'>{worker.name}</h3>
            {isInactive && (
              <span className='inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700'>
                Inactive
              </span>
            )}
          </div>
          <p className='mt-1 text-sm text-gray-600'>{formatPhoneDisplay(worker.phone)}</p>
          {worker.email ? <p className='mt-1 text-sm text-gray-500'>{worker.email}</p> : null}
        </div>

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => onEdit(worker)}
            className='inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
          >
            <Edit className='h-4 w-4' />
            Edit
          </button>
          <button
            type='button'
            onClick={() => onDelete(worker)}
            disabled={isDeleting}
            className='inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60'
          >
            <Trash2 className='h-4 w-4' />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
