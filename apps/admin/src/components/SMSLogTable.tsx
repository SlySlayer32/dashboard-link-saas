import type { SMSLog } from '@dashboard-link/shared'
import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { SMSStatusBadge } from './SMSStatusBadge'

interface SMSLogTableProps {
  logs: SMSLog[]
  isLoading?: boolean
  onResend?: (log: SMSLog) => void
}

export function SMSLogTable({ logs, isLoading, onResend }: SMSLogTableProps) {
  if (isLoading) {
    return (
      <div className='bg-white shadow rounded-lg'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='animate-pulse space-y-4'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='h-12 bg-gray-200 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className='bg-white shadow rounded-lg'>
        <div className='px-4 py-5 sm:p-6 text-center'>
          <p className='text-gray-500'>No SMS logs found</p>
        </div>
      </div>
    )
  }

  const handleExportCSV = () => {
    const headers = ['Date', 'Worker', 'Phone', 'Status', 'Message']
    const csvContent = [
      headers.join(','),
      ...logs.map((log) => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.worker_id || 'N/A',
        log.phone,
        log.status,
        `"${log.message.replace(/"/g, '""')}"`,
      ]),
    ]
      .map((row) => (Array.isArray(row) ? row.join(',') : row))
      .join('\n')

    const blob = new globalThis.Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sms-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className='bg-white shadow rounded-lg overflow-hidden'>
      <div className='px-4 py-5 sm:p-6 sm:flex sm:items-center sm:justify-between'>
        <h3 className='text-lg leading-6 font-medium text-gray-900'>SMS Logs</h3>
        <div className='mt-3 sm:mt-0 sm:ml-4'>
          <button
            type='button'
            onClick={handleExportCSV}
            className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            <ArrowDownTrayIcon className='mr-2 -ml-0.5 h-4 w-4' />
            Export CSV
          </button>
        </div>
      </div>

      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Date
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Worker
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Phone
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Status
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Message
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {logs.map((log) => (
              <tr key={log.id} className='hover:bg-gray-50'>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {log.worker_id || 'N/A'}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{log.phone}</td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <SMSStatusBadge status={log.status} />
                </td>
                <td className='px-6 py-4 text-sm text-gray-900 max-w-xs truncate'>
                  <span title={log.message}>{log.message}</span>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                  {log.status === 'failed' && onResend && (
                    <button
                      type='button'
                      onClick={() => onResend(log)}
                      className='text-blue-600 hover:text-blue-900 inline-flex items-center'
                    >
                      <ArrowPathIcon className='h-4 w-4 mr-1' />
                      Resend
                    </button>
                  )}
                  {log.status === 'failed' && log.provider_response && (
                    <button
                      type='button'
                      className='ml-4 text-gray-600 hover:text-gray-900'
                      title={
                        typeof log.provider_response === 'string'
                          ? log.provider_response
                          : typeof log.provider_response === 'object'
                            ? JSON.stringify(log.provider_response)
                            : 'Error details available'
                      }
                    >
                      View Error
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
