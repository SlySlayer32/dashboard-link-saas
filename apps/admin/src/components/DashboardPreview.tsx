import type { ScheduleItem, TaskItem } from '@dashboard-link/shared'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { AlertCircle, Calendar as CalendarIcon, Clock, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../../packages/ui/components/ui/alert'
import { Skeleton } from '../../packages/ui/components/ui/skeleton'
import { api } from '../lib/api'

interface DashboardData {
  worker: {
    id: string
    name: string
    phone: string
  }
  schedule: ScheduleItem[]
  tasks: TaskItem[]
  metadata: {
    previewDate: string
    isPreview: boolean
  }
}

interface DashboardPreviewProps {
  workerId: string
  viewMode: 'mobile' | 'desktop'
  embedded?: boolean
  date?: Date
}

function DashboardPreview({
  workerId,
  viewMode,
  embedded = false,
  date = new Date(),
}: DashboardPreviewProps) {
  const { data, isLoading, error } = useQuery<DashboardData, Error>({
    queryKey: ['dashboardPreview', workerId, date.toISOString().split('T')[0]],
    queryFn: async () => {
      const response = await api.get(
        `/admin/dashboards/preview/${workerId}?date=${date.toISOString().split('T')[0]}`
      )
      return response.data.data
    },
    enabled: !!workerId,
  })

  const containerClasses =
    viewMode === 'mobile'
      ? 'max-w-md mx-auto bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200'
      : 'bg-white rounded-lg shadow-sm border border-gray-200'

  const contentClasses = viewMode === 'mobile' ? 'p-4 max-h-[600px] overflow-y-auto' : 'p-6'

  if (isLoading) {
    return (
      <div className={containerClasses}>
        <div className='p-4'>
          <Skeleton className='h-6 w-1/2 mb-4' />
          <div className='space-y-4'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='border rounded-lg p-4'>
                <Skeleton className='h-4 w-3/4 mb-2' />
                <Skeleton className='h-4 w-1/2' />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={containerClasses}>
        <div className='p-4'>
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error.message || 'Failed to load dashboard preview'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mma').toLowerCase()
  }

  return (
    <div className={containerClasses}>
      {!embedded && (
        <div className='p-4 border-b border-gray-200'>
          <div className='flex justify-between items-center'>
            <h2 className='text-lg font-semibold text-gray-900'>
              {data?.worker.name || 'Worker'}'s Dashboard
            </h2>
            <div className='flex items-center space-x-2'>
              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                <Info className='h-3 w-3 mr-1' />
                Preview Mode
              </span>
              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                <CalendarIcon className='h-3 w-3 mr-1' />
                {new Date(data?.metadata?.previewDate || date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      )}
      <div className={contentClasses}>
        {/* Schedule Section */}
        <div className='bg-white rounded-lg shadow overflow-hidden'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h2 className='text-lg font-semibold text-gray-900'>Today's Schedule</h2>
          </div>

          {data?.schedule.length > 0 ? (
            <div className='divide-y divide-gray-200'>
              {data?.schedule.map((item) => (
                <div key={item.id} className='px-6 py-4 hover:bg-gray-50'>
                  <div className='flex items-start'>
                    <div className='flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-600 font-medium'>
                      {formatTime(item.startTime).replace(':', '')}
                    </div>
                    <div className='ml-4 flex-1 min-w-0'>
                      <div className='flex justify-between items-start'>
                        <h3 className='text-base font-medium text-gray-900'>{item.title}</h3>
                        {item.metadata?.source && (
                          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                            {item.metadata.source}
                          </span>
                        )}
                      </div>
                      <p className='mt-1 text-sm text-gray-600'>
                        {formatTime(item.startTime)} - {formatTime(item.endTime)}
                        {item.location && ` • ${item.location}`}
                      </p>
                      {item.description && (
                        <p className='mt-1 text-sm text-gray-600'>{item.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='px-6 py-8 text-center'>
              <p className='text-gray-500'>No schedule items for this day</p>
            </div>
          )}
        </div>

        {/* Tasks Section */}
        <div className='bg-white rounded-lg shadow overflow-hidden'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h2 className='text-lg font-semibold text-gray-900'>Tasks</h2>
          </div>

          {data?.tasks && data.tasks.length > 0 ? (
            <div className='divide-y divide-gray-200'>
              {data.tasks.map((task) => (
                <div key={task.id} className='px-6 py-4 hover:bg-gray-50'>
                  <div className='flex items-start'>
                    <div className='flex items-center h-5 mt-0.5'>
                      <input
                        type='checkbox'
                        checked={task.status === 'completed'}
                        readOnly
                        className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                      />
                    </div>
                    <div className='ml-3 flex-1 min-w-0'>
                      <div className='flex justify-between items-start'>
                        <h3 className='text-base font-medium text-gray-900'>{task.title}</h3>
                        <div className='flex items-center space-x-2'>
                          {task.priority && (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
                            >
                              {task.priority}
                            </span>
                          )}
                          {task.metadata?.source && (
                            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                              {task.metadata.source}
                            </span>
                          )}
                        </div>
                      </div>

                      {task.description && (
                        <p className='mt-1 text-sm text-gray-600'>{task.description}</p>
                      )}

                      {task.dueDate && (
                        <div className='mt-2 flex items-center text-sm text-gray-500'>
                          <Clock className='h-4 w-4 mr-1' />
                          Due: {format(new Date(task.dueDate), 'MMM d, yyyy h:mma')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='px-6 py-8 text-center'>
              <p className='text-gray-500'>No tasks for this day</p>
            </div>
          )}
        </div>

        {/* Empty State */}
        {(!data?.schedule || data.schedule.length === 0) &&
          (!data?.tasks || data.tasks.length === 0) && (
            <div className='text-center py-12'>
              <div className='mx-auto h-12 w-12 text-gray-400'>
                <svg
                  className='h-full w-full'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1}
                    d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                  />
                </svg>
              </div>
              <h3 className='mt-2 text-sm font-medium text-gray-900'>No data available</h3>
              <p className='mt-1 text-sm text-gray-500'>
                There are no schedule items or tasks for this day.
              </p>
            </div>
          )}
      </div>
    </div>
  )
}

// Export as default to match the import in WorkerDetailPage
export default DashboardPreview
