import { format } from 'date-fns';
import { Calendar, Clock, Edit, Flag, MapPin, Trash2 } from 'lucide-react';
import type { ScheduleItem } from '../hooks/useScheduleItems';
import type { TaskItem } from '../hooks/useTaskItems';

interface ManualDataListProps {
  type: 'schedule' | 'tasks';
  items: ScheduleItem[] | TaskItem[];
  isLoading?: boolean;
  onEdit: (item: ScheduleItem | TaskItem) => void;
  onDelete: (item: ScheduleItem | TaskItem) => void;
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high':
      return 'text-red-700 bg-red-100';
    case 'medium':
      return 'text-yellow-700 bg-yellow-100';
    case 'low':
      return 'text-gray-700 bg-gray-100';
    default:
      return 'text-gray-700 bg-gray-100';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'text-green-700 bg-green-100';
    case 'in_progress':
      return 'text-blue-700 bg-blue-100';
    case 'pending':
      return 'text-gray-700 bg-gray-100';
    default:
      return 'text-gray-700 bg-gray-100';
  }
}

function formatDateTime(dateString: string) {
  try {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy h:mm a');
  } catch {
    return dateString;
  }
}

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

export function ManualDataList({
  type,
  items,
  isLoading = false,
  onEdit,
  onDelete,
}: ManualDataListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          {type === 'schedule' ? (
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          ) : (
            <Flag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          )}
          <p className="text-gray-500">
            No {type === 'schedule' ? 'schedule items' : 'tasks'} found
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Create your first {type === 'schedule' ? 'schedule item' : 'task'} to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="divide-y divide-gray-200">
        {items.map((item) => (
          <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-base font-medium text-gray-900">
                    {(item as ScheduleItem | TaskItem).title}
                  </h3>
                  {type === 'tasks' && (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                        (item as TaskItem).priority
                      )}`}
                    >
                      {(item as TaskItem).priority}
                    </span>
                  )}
                  {type === 'tasks' && (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        (item as TaskItem).status
                      )}`}
                    >
                      {(item as TaskItem).status}
                    </span>
                  )}
                </div>

                {type === 'schedule' ? (
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {formatDateTime((item as ScheduleItem).start_time)} -{' '}
                      {formatDateTime((item as ScheduleItem).end_time)}
                    </div>
                    {(item as ScheduleItem).location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {(item as ScheduleItem).location}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {(item as TaskItem).due_date && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Due: {formatDate((item as TaskItem).due_date)}
                      </div>
                    )}
                  </div>
                )}

                {(item as ScheduleItem | TaskItem).description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {(item as ScheduleItem | TaskItem).description}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onEdit(item)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(item)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
