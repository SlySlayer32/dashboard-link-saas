import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import type { AdminSMSLog } from '../hooks/useSMSLogs'
import { SMSStatusBadge } from './SMSStatusBadge'

interface SMSLogTableProps {
  logs: AdminSMSLog[]
  isLoading?: boolean
  onResend?: (log: AdminSMSLog) => void
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
        format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        log.workerId || 'N/A',
        log.to,
        log.status,
        `"${log.body.replace(/"/g, '""')}"`,
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
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Date
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Worker
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Phone
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Status
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Message
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {logs.map((log) => (
              <tr key={log.id} className='hover:bg-gray-50'>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {log.workerId || 'N/A'}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{log.to}</td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <SMSStatusBadge status={log.status} />
                </td>
                <td className='px-6 py-4 text-sm text-gray-900 max-w-xs truncate'>
                  <div>
                    <span title={log.body}>{log.body}</span>
                    {log.errorReason && <p className='mt-1 text-xs text-red-600'>{log.errorReason}</p>}
                  </div>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
