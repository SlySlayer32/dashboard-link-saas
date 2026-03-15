/**
 * AccessLogsList Component
 *
 * Displays full history table of dashboard access logs
 * Shows timestamp, IP address, user agent, and validation status
 */

import { format } from 'date-fns'
import { CheckCircle, XCircle, AlertCircle, Ban } from 'lucide-react'

interface AccessLog {
  id: string
  workerId: string
  accessedAt: string
  ipAddress: string | null
  userAgent: string | null
  validationStatus: 'success' | 'expired' | 'invalid' | 'revoked'
}

interface AccessLogsListProps {
  logs: AccessLog[]
  loading?: boolean
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'success':
      return <CheckCircle className='w-4 h-4 text-green-600' />
    case 'expired':
      return <AlertCircle className='w-4 h-4 text-yellow-600' />
    case 'revoked':
      return <Ban className='w-4 h-4 text-red-600' />
    case 'invalid':
      return <XCircle className='w-4 h-4 text-red-600' />
    default:
      return null
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'success':
      return 'Success'
    case 'expired':
      return 'Expired'
    case 'revoked':
      return 'Revoked'
    case 'invalid':
      return 'Invalid'
    default:
      return status
  }
}

function truncateUserAgent(userAgent: string | null, maxLength = 50): string {
  if (!userAgent) return 'Unknown'
  if (userAgent.length <= maxLength) return userAgent
  return `${userAgent.substring(0, maxLength)}...`
}

export function AccessLogsList({ logs, loading = false }: AccessLogsListProps) {
  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (logs.length === 0) {
    return <div className='text-center py-12 text-gray-500'>No access logs found</div>
  }

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead className='bg-gray-50'>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Timestamp
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Status
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              IP Address
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              User Agent
            </th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {logs.map((log) => (
            <tr key={log.id} className='hover:bg-gray-50'>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                {format(new Date(log.accessedAt), 'MMM d, yyyy h:mm a')}
              </td>
              <td className='px-6 py-4 whitespace-nowrap'>
                <div className='flex items-center gap-2'>
                  {getStatusIcon(log.validationStatus)}
                  <span className='text-sm text-gray-900'>
                    {getStatusLabel(log.validationStatus)}
                  </span>
                </div>
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                {log.ipAddress || 'Unknown'}
              </td>
              <td className='px-6 py-4 text-sm text-gray-500'>
                <span title={log.userAgent || 'Unknown'}>{truncateUserAgent(log.userAgent)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
