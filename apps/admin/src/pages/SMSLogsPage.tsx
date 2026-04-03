import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { useState } from 'react'
import { SMSLogTable } from '../components/SMSLogTable'
import { useSendSMS } from '../hooks/useSMS'
import { type AdminSMSLog, useSMSLogs } from '../hooks/useSMSLogs'

export function SMSLogsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<{
    workerId: string
    status: AdminSMSLog['status'] | undefined
    dateFrom: string
    dateTo: string
    search: string
  }>({
    workerId: '',
    status: undefined,
    dateFrom: '',
    dateTo: '',
    search: '',
  })

  const { data, isLoading, error, refetch } = useSMSLogs({
    page: currentPage,
    limit: 20,
    ...filters,
  })

  const sendSMS = useSendSMS()
  const [resendError, setResendError] = useState<string | null>(null)

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'status') {
      setFilters((prev) => ({
        ...prev,
        status: value === '' ? undefined : (value as AdminSMSLog['status']),
      }))
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }))
    }
    setCurrentPage(1)
  }

  const handleResend = async (log: AdminSMSLog) => {
    setResendError(null)

    if (!log.workerId && !log.to) {
      setResendError('Cannot resend message: destination is missing')
      return
    }

    if (window.confirm('Are you sure you want to resend this message?')) {
      sendSMS.mutate(
        { workerId: log.workerId, to: log.to, message: log.body },
        {
          onSuccess: () => {
            void refetch()
          },
          onError: (mutationError: Error) => {
            setResendError(mutationError.message)
          },
        }
      )
    }
  }

  const handleClearFilters = () => {
    setFilters({
      workerId: '',
      status: undefined,
      dateFrom: '',
      dateTo: '',
      search: '',
    })
    setCurrentPage(1)
  }

  if (error) {
    return (
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='bg-red-50 border border-red-200 rounded-md p-4'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <ExclamationTriangleIcon
                className='h-5 w-5 text-red-400'
                viewBox='0 0 20 20'
                fill='currentColor'
              />
            </div>
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-red-800'>Error loading SMS logs</h3>
              <div className='mt-2 text-sm text-red-700'>
                <p>{error.message}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
      <div className='sm:flex sm:items-center sm:justify-between mb-8'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>SMS Logs</h1>
          <p className='mt-1 text-sm text-gray-500'>View and track SMS delivery status</p>
        </div>
      </div>

      <div className='bg-white shadow rounded-lg mb-6 p-4'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>Filters</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          <div>
            <label htmlFor='search' className='block text-sm font-medium text-gray-700 mb-1'>
              Search
            </label>
            <input
              type='text'
              id='search'
              placeholder='Search by phone or message...'
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor='workerId' className='block text-sm font-medium text-gray-700 mb-1'>
              Worker ID
            </label>
            <input
              type='text'
              id='workerId'
              placeholder='Enter worker ID...'
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              value={filters.workerId}
              onChange={(e) => handleFilterChange('workerId', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor='status' className='block text-sm font-medium text-gray-700 mb-1'>
              Status
            </label>
            <select
              id='status'
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              value={filters.status ?? ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value=''>All Statuses</option>
              <option value='sent'>Sent</option>
              <option value='delivered'>Delivered</option>
              <option value='failed'>Failed</option>
              <option value='pending'>Pending</option>
            </select>
          </div>
          <div>
            <label htmlFor='dateFrom' className='block text-sm font-medium text-gray-700 mb-1'>
              From Date
            </label>
            <input
              type='date'
              id='dateFrom'
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              value={filters.dateFrom}
              max={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor='dateTo' className='block text-sm font-medium text-gray-700 mb-1'>
              To Date
            </label>
            <input
              type='date'
              id='dateTo'
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              value={filters.dateTo}
              max={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
          <div className='flex items-end'>
            <button
              type='button'
              onClick={handleClearFilters}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {resendError && (
        <div className='mb-4 bg-red-50 border border-red-200 rounded-md p-4'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <ExclamationTriangleIcon className='h-5 w-5 text-red-400' />
            </div>
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-red-800'>Error</h3>
              <div className='mt-2 text-sm text-red-700'>
                <p>{resendError}</p>
              </div>
            </div>
            <div className='ml-auto pl-3'>
              <div className='-mx-1.5 -my-1.5'>
                <button
                  type='button'
                  onClick={() => setResendError(null)}
                  className='inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600'
                >
                  <span className='sr-only'>Dismiss</span>
                  <XMarkIcon className='h-5 w-5' />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='mb-4'>
        <p className='text-sm text-gray-600'>
          Showing {data?.data.length || 0} of {data?.pagination.total || 0} logs
        </p>
      </div>

      <SMSLogTable logs={data?.data || []} isLoading={isLoading} onResend={handleResend} />

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className='mt-6 flex items-center justify-between'>
          <div className='text-sm text-gray-700'>
            Page {data.pagination.page} of {data.pagination.totalPages}
          </div>
          <div className='flex space-x-2'>
            <button
              onClick={() => setCurrentPage(data.pagination.page - 1)}
              disabled={data.pagination.page <= 1}
              className='px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
            >
              Previous
            </button>
            {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-sm border rounded-md ${
                  page === data.pagination.page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(data.pagination.page + 1)}
              disabled={data.pagination.page >= data.pagination.totalPages}
              className='px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SMSLogsPage
