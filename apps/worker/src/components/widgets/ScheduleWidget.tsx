import type { StandardScheduleItem } from '@dashboard-link/shared'
import { formatTime } from '@dashboard-link/shared'

interface ScheduleWidgetProps {
  schedule: StandardScheduleItem[]
}

function ScheduleWidget({ schedule }: ScheduleWidgetProps) {
  if (schedule.length === 0) {
    return (
      <div className='bg-white rounded-lg shadow'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900'>Today&apos;s Schedule</h2>
        </div>
        <div className='px-6 py-8 text-center'>
          <p className='text-gray-600'>No scheduled items for today</p>
        </div>
      </div>
    )
  }

  const sortedSchedule = [...schedule].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  return (
    <div className='bg-white rounded-lg shadow'>
      <div className='px-6 py-4 border-b border-gray-200'>
        <h2 className='text-lg font-semibold text-gray-900'>Today&apos;s Schedule</h2>
      </div>
      <div className='divide-y divide-gray-200'>
        {sortedSchedule.map((item) => (
          <div key={item.id} className='px-6 py-4'>
            <div className='flex items-start'>
              <div className='flex-shrink-0'>
                <div className='flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-600 font-semibold'>
                  {formatTime(item.startTime).split(':')[0]}
                </div>
              </div>
              <div className='ml-4 flex-1'>
                <h3 className='text-base font-medium text-gray-900'>{item.title}</h3>
                <p className='text-sm text-gray-600 mt-1'>
                  {formatTime(item.startTime)} - {formatTime(item.endTime)}
                </p>
                {item.location && (
                  <p className='text-sm text-gray-600 mt-1'>Location: {item.location}</p>
                )}
                {item.description && (
                  <div className='mt-2 rounded-md bg-gray-50 px-3 py-2'>
                    <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
                      Instructions
                    </p>
                    <p className='mt-1 text-sm text-gray-700'>{item.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ScheduleWidget
