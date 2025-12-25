import type { Worker } from '@dashboard-link/shared'
import { SkeletonTable } from '@dashboard-link/ui'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPhoneForDisplay } from '../utils/phoneUtils'
import { SendSMSButton } from './SendSMSButton'
import { StatusBadge, Table } from './ui/Table'

interface WorkerListProps {
  workers: Worker[]
  isLoading: boolean
  onEdit: (worker: Worker) => void
  onDelete: (worker: Worker) => void
}

export function WorkerList({ workers, isLoading, onEdit, onDelete }: WorkerListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleDeleteClick = (worker: Worker) => {
    setDeleteConfirm(worker.id)
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      const worker = workers.find((w) => w.id === deleteConfirm)
      if (worker) {
        onDelete(worker)
        setDeleteConfirm(null)
      }
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirm(null)
  }

  const columns = [
    {
      key: 'name' as keyof Worker,
      title: 'Name',
      render: (value: string, record: Worker) => (
        <Link
          to={`/workers/${record.id}`}
          className='font-medium text-blue-600 hover:text-blue-900'
        >
          {value}
        </Link>
      ),
    },
    {
      key: 'phone' as keyof Worker,
      title: 'Phone',
      render: (value: string) => (
        <div className='text-gray-600'>{formatPhoneForDisplay(value)}</div>
      ),
    },
    {
      key: 'email' as keyof Worker,
      title: 'Email',
      render: (value: string) => <div className='text-gray-600'>{value || '-'}</div>,
    },
    {
      key: 'active' as keyof Worker,
      title: 'Status',
      render: (value: boolean) => <StatusBadge active={value} />,
    },
    {
      key: 'created_at' as keyof Worker,
      title: 'Created',
      render: (value: string) => (
        <div className='text-gray-600'>{new Date(value).toLocaleDateString()}</div>
      ),
    },
    {
      key: 'id' as keyof Worker,
      title: 'Actions',
      render: (record: Worker) => (
        <div className='flex space-x-2'>
          <SendSMSButton
            worker={record}
            variant='ghost'
            size='sm'
            className='text-green-600 hover:text-green-900'
          />
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(record)
            }}
            className='text-blue-600 hover:text-blue-900 text-sm font-medium'
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteClick(record)
            }}
            className='text-red-600 hover:text-red-900 text-sm font-medium'
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return <SkeletonTable rows={10} columns={6} className='bg-white shadow rounded-lg' />
  }

  return (
    <>
      <Table
        columns={columns}
        data={workers}
        emptyMessage='No workers found. Create your first worker to get started.'
        onRowClick={(worker) => onEdit(worker)}
        className='bg-white shadow rounded-lg'
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
          <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
            <div className='mt-3 text-center'>
              <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100'>
                <svg
                  className='h-6 w-6 text-red-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </div>
              <h3 className='text-lg leading-6 font-medium text-gray-900 mt-4'>Delete Worker</h3>
              <div className='mt-2 px-7 py-3'>
                <p className='text-sm text-gray-500'>
                  Are you sure you want to delete this worker? This action cannot be undone.
                </p>
              </div>
              <div className='items-center px-4 py-3'>
                <button
                  onClick={handleDeleteConfirm}
                  className='px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
                >
                  Delete
                </button>
                <button
                  onClick={handleDeleteCancel}
                  className='px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-24 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
