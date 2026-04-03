import { CheckCircle, Clock, MessageSquare, XCircle } from 'lucide-react'
import { useSMSLogs } from '../hooks/useSMSLogs'

interface SmsHistoryProps {
  workerId: string
  isLoading?: boolean
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'sent':
    case 'delivered':
      return <CheckCircle className='h-4 w-4 text-green-500' />
    case 'failed':
      return <XCircle className='h-4 w-4 text-red-500' />
    default:
      return <Clock className='h-4 w-4 text-yellow-500' />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'sent':
    case 'delivered':
      return 'text-green-700 bg-green-50'
    case 'failed':
      return 'text-red-700 bg-red-50'
    default:
      return 'text-yellow-700 bg-yellow-50'
  }
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleString()
}

function formatMessage(message: string, maxLength: number = 100) {
  if (message.length <= maxLength) return message
  return `${message.substring(0, maxLength)}...`
}

export function SmsHistory({ workerId, isLoading }: SmsHistoryProps) {
  const { data, isLoading: isLoadingLogs } = useSMSLogs({ workerId, limit: 10 })
  const logs = data?.data ?? []
  const isLoadingData = isLoading || isLoadingLogs

  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
      <div className='p-6 border-b border-gray-200'>
        <h3 className='text-lg font-semibold text-gray-900 mb-1'>SMS History</h3>
        <p className='text-sm text-gray-500'>Latest delivery attempts for this worker.</p>
      </div>

      <div className='overflow-hidden'>
        {isLoadingData ? (
          <div className='p-6'>
            <div className='space-y-4'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='animate-pulse'>
                  <div className='flex items-start space-x-3'>
                    <div className='h-10 w-10 bg-gray-200 rounded-full'></div>
                    <div className='flex-1'>
                      <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                      <div className='h-3 bg-gray-200 rounded w-1/2'></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className='p-12 text-center'>
            <MessageSquare className='h-12 w-12 text-gray-400 mx-auto mb-3' />
            <p className='text-gray-500'>No SMS history found</p>
            <p className='text-sm text-gray-400 mt-1'>
              Send the first dashboard link to see delivery activity here
            </p>
          </div>
        ) : (
          <div className='divide-y divide-gray-200'>
            {logs.map((log) => (
              <div key={log.id} className='p-6 hover:bg-gray-50'>
                <div className='flex items-start justify-between'>
                  <div className='flex items-start space-x-3 flex-1'>
                    <div className='flex-shrink-0 mt-1'>{getStatusIcon(log.status)}</div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center space-x-2 mb-1'>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}
                        >
                          {log.status}
                        </span>
                        <span className='text-xs text-gray-500'>{formatTime(log.createdAt)}</span>
                      </div>
                      <p className='text-sm text-gray-900 mb-1'>{formatMessage(log.body)}</p>
                      <p className='text-xs text-gray-500'>Sent to {log.to}</p>
                      {log.errorReason && (
                        <p className='text-xs text-red-600 mt-1'>Error: {log.errorReason}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
