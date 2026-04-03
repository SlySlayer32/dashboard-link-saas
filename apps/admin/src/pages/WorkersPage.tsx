import type { Worker } from '@dashboard-link/shared'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { WorkerForm } from '../components/workers/WorkerForm'
import { WorkerList } from '../components/workers/WorkerList'
import { useDebouncedSearch, useWorkerMutations, useWorkers } from '../hooks/useWorkers'

export function WorkersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingWorker, setEditingWorker] = useState<Worker | undefined>()
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const location = useLocation()
  const navigate = useNavigate()

  const { searchValue, setSearchValue } = useDebouncedSearch(300)
  const { deleteWorker } = useWorkerMutations()
  const { workers, total, isLoading, error, refetch } = useWorkers()
  const routeState = location.state as { openCreateWorker?: boolean } | null

  useEffect(() => {
    if (routeState?.openCreateWorker) {
      setEditingWorker(undefined)
      setIsFormOpen(true)
      navigate(location.pathname, { replace: true })
    }
  }, [location.pathname, navigate, routeState])

  const filteredWorkers = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return workers.filter((worker) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && worker.deletedAt === null) ||
        (statusFilter === 'inactive' && worker.deletedAt !== null)

      if (!matchesStatus) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return (
        worker.name.toLowerCase().includes(normalizedSearch) ||
        worker.phone.toLowerCase().includes(normalizedSearch) ||
        (worker.email?.toLowerCase().includes(normalizedSearch) ?? false)
      )
    })
  }, [workers, searchValue, statusFilter])

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker)
    setIsFormOpen(true)
  }

  const handleDelete = (worker: Worker) => {
    return deleteWorker.mutateAsync(worker.id).then(() => {
      void refetch()
    })
  }

  const handleAddWorker = () => {
    setEditingWorker(undefined)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingWorker(undefined)
  }

  const handleFormSuccess = async () => {
    setIsFormOpen(false)
    setEditingWorker(undefined)
    await refetch()
  }

  const handleStatusFilterChange = (newStatus: 'all' | 'active' | 'inactive') => {
    setStatusFilter(newStatus)
  }

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
      <div className='sm:flex sm:items-center sm:justify-between mb-8'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Workers</h1>
          <p className='mt-1 text-sm text-gray-500'>
            Manage your organization&apos;s workers and their access to dashboards
          </p>
        </div>
        <div className='mt-4 sm:mt-0'>
          <button
            onClick={handleAddWorker}
            className='inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            <svg
              className='mr-2 -ml-1 h-5 w-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M12 4v16m8-8H4'
              />
            </svg>
            Add Worker
          </button>
        </div>
      </div>

      <div className='bg-white shadow rounded-lg mb-6 p-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label htmlFor='search' className='block text-sm font-medium text-gray-700 mb-1'>
              Search Workers
            </label>
            <input
              type='text'
              id='search'
              placeholder='Search by name, phone, or email...'
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor='status' className='block text-sm font-medium text-gray-700 mb-1'>
              Status Filter
            </label>
            <select
              id='status'
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              value={statusFilter}
              onChange={(e) =>
                handleStatusFilterChange(e.target.value as 'all' | 'active' | 'inactive')
              }
            >
              <option value='all'>All Workers</option>
              <option value='active'>Active Only</option>
              <option value='inactive'>Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className='mb-4'>
        <p className='text-sm text-gray-600'>
          Showing {filteredWorkers.length} of {total} workers
        </p>
      </div>

      <WorkerList
        workers={filteredWorkers}
        isLoading={isLoading}
        error={error instanceof Error ? error : null}
        isDeleting={deleteWorker.isPending}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onRetry={() => {
          void refetch()
        }}
      />

      {isFormOpen && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
          <div className='relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-medium text-gray-900'>
                {editingWorker ? 'Edit Worker' : 'Add New Worker'}
              </h3>
              <button onClick={handleFormClose} className='text-gray-400 hover:text-gray-500'>
                <svg className='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
            <WorkerForm
              worker={editingWorker}
              onSuccess={handleFormSuccess}
              onCancel={handleFormClose}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkersPage
