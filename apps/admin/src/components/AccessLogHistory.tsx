import { AlertCircle, Eye } from 'lucide-react'
import { useWorkerAccessLogs } from '../hooks/useWorkerAccessLogs'

interface AccessLogHistoryProps {
  workerId: string
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString()
}

function formatValidationStatus(status: string) {
  return status.replace(/_/g, ' ')
}

export function AccessLogHistory({ workerId }: AccessLogHistoryProps) {
  const { data, isLoading, error, refetch } = useWorkerAccessLogs(workerId)

  if (isLoading) {
    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='animate-pulse space-y-4'>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className='h-16 rounded-lg bg-gray-200'></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4'>
          <AlertCircle className='mt-0.5 h-5 w-5 text-red-600' />
          <div>
            <p className='font-medium text-red-900'>Could not load access history</p>
            <p className='mt-1 text-sm text-red-700'>
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <button
              type='button'
              onClick={() => {
                void refetch()
              }}
              className='mt-3 text-sm font-medium text-red-700 hover:text-red-900'
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center'>
        <Eye className='mx-auto mb-3 h-12 w-12 text-gray-400' />
        <p className='text-gray-500'>No dashboard opens recorded yet</p>
        <p className='mt-1 text-sm text-gray-400'>
          Access history will appear here after the worker opens their dashboard link.
        </p>
      </div>
    )
  }

  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
      <div className='border-b border-gray-200 px-6 py-4'>
        <h3 className='text-lg font-semibold text-gray-900'>Access History</h3>
        <p className='mt-1 text-sm text-gray-500'>
          Latest dashboard opens captured for this worker.
        </p>
      </div>
      <div className='divide-y divide-gray-200'>
        {data.map((log) => (
          <div key={log.id} className='px-6 py-4'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-900'>{formatTimestamp(log.accessedAt)}</p>
                <p className='mt-1 text-xs uppercase tracking-wide text-gray-500'>
                  {formatValidationStatus(log.validationStatus)}
                </p>
              </div>
              <div className='text-sm text-gray-600'>
                {log.ipAddress && <p>IP: {log.ipAddress}</p>}
                {log.userAgent && <p className='mt-1 break-all'>{log.userAgent}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
