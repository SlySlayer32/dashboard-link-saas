import type { ScheduleItem } from '@dashboard-link/shared';
import { formatTime } from '@dashboard-link/shared';

interface ScheduleWidgetProps {
  schedule: ScheduleItem[];
}

function ScheduleWidget({ schedule }: ScheduleWidgetProps) {
  if (schedule.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
        </div>
        <div className="px-6 py-8 text-center">
          <p className="text-gray-600">No scheduled items for today</p>
        </div>
      </div>
    );
  }

  // Sort schedule items chronologically by start_time
  const sortedSchedule = [...schedule].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {sortedSchedule.map((item) => (
          <div key={item.id} className="px-6 py-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-600 font-semibold">
                  {formatTime(item.start_time).split(':')[0]}
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-base font-medium text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {formatTime(item.start_time)} - {formatTime(item.end_time)}
                </p>
                {item.location && (
                  <p className="text-sm text-gray-600 mt-1">
                    📍 {item.location}
                  </p>
                )}
                {item.description && (
                  <p className="text-sm text-gray-700 mt-2">{item.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScheduleWidget;
