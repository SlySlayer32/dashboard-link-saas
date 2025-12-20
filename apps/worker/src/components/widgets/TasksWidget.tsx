import type { TaskItem } from '@dashboard-link/shared';

interface TasksWidgetProps {
  tasks: TaskItem[];
}

function TasksWidget({ tasks }: TasksWidgetProps) {
  if (tasks.length === 0) {
    return null;
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {tasks.map((task) => (
          <div key={task.id} className="px-6 py-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 mt-0.5"
                defaultChecked={task.status === 'completed'}
              />
              <div className="ml-4 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-medium text-gray-900">{task.title}</h3>
                  {task.priority && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                )}
                {task.due_date && (
                  <p className="text-xs text-gray-500 mt-2">
                    Due: {new Date(task.due_date).toLocaleString('en-AU', {
                      timeStyle: 'short',
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TasksWidget;
