import { CheckCircle, Clock, Eye, MessageCircle, XCircle } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'sms' | 'dashboard_open'
  message: string
  status: string
  createdAt: string
  workerId?: string
  workerName: string
  workerPhone?: string
}

interface RecentActivityProps {
  activities: ActivityItem[]
  isLoading?: boolean
}

function getStatusIcon(activity: ActivityItem) {
  if (activity.type === 'dashboard_open') {
    return <Eye className='h-4 w-4 text-cyan-500' />
  }

  switch (activity.status) {
    case 'sent':
    case 'delivered':
      return <CheckCircle className='h-4 w-4 text-green-500' />
    case 'failed':
      return <XCircle className='h-4 w-4 text-red-500' />
    default:
      return <Clock className='h-4 w-4 text-yellow-500' />
  }
}

function getStatusColor(activity: ActivityItem) {
  if (activity.type === 'dashboard_open') {
    return 'text-cyan-700 bg-cyan-50'
  }

  switch (activity.status) {
    case 'sent':
    case 'delivered':
      return 'text-green-700 bg-green-50'
    case 'failed':
      return 'text-red-700 bg-red-50'
    default:
      return 'text-yellow-700 bg-yellow-50'
  }
}

function formatMessage(message: string, maxLength: number = 60) {
  if (message.length <= maxLength) return message
  return `${message.substring(0, maxLength)}...`
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <div className='cc-panel rounded-[28px] p-6'>
        <h3 className='mb-4 text-lg font-semibold text-[hsl(var(--cc-text))]'>Recent Activity</h3>
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
    )
  }

  if (activities.length === 0) {
    return (
      <div className='cc-panel rounded-[28px] p-6'>
        <h3 className='mb-4 text-lg font-semibold text-[hsl(var(--cc-text))]'>Recent Activity</h3>
        <div className='text-center py-8'>
          <MessageCircle className='h-12 w-12 text-gray-400 mx-auto mb-3' />
          <p className='cc-text-muted'>No recent worker activity</p>
          <p className='cc-text-muted mt-1 text-sm'>
            Sent messages and dashboard opens will appear here
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='cc-panel rounded-[28px] p-6'>
      <div className='flex items-center justify-between gap-3'>
        <h3 className='text-lg font-semibold text-[hsl(var(--cc-text))]'>Recent Activity</h3>
        <span className='cc-badge'>{activities.length} latest events</span>
      </div>
      <div className='space-y-4'>
        {activities.map((activity) => (
          <div
            key={activity.id}
            className='mt-4 flex items-start space-x-3 rounded-[22px] border border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface-muted))] px-4 py-4'
          >
            <div className='mt-1 flex-shrink-0'>{getStatusIcon(activity)}</div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center space-x-2 mb-1'>
                <p className='truncate text-sm font-medium text-[hsl(var(--cc-text))]'>
                  {activity.workerName}
                </p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity)}`}
                >
                  {activity.type === 'dashboard_open' ? 'opened' : activity.status}
                </span>
              </div>
              <p className='mb-1 text-sm text-[hsl(var(--cc-text-muted))]'>
                {formatMessage(activity.message)}
              </p>
              {activity.workerPhone && (
                <p className='mb-1 text-xs text-[hsl(var(--cc-text-muted))]'>
                  {activity.workerPhone}
                </p>
              )}
              <p className='flex items-center text-xs text-[hsl(var(--cc-text-muted))]'>
                <Clock className='h-3 w-3 mr-1' />
                {formatTime(activity.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
