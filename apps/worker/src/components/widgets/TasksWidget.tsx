import type { TaskItem } from '@dashboard-link/shared';

interface TasksWidgetProps {
  tasks: TaskItem[];
}

function TasksWidget({ tasks }: TasksWidgetProps) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
        </div>
        <div className="px-6 py-8 text-center">
          <p className="text-gray-600">No tasks for today</p>
        </div>
      </div>
    );
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

  const getPriorityOrder = (priority?: string) => {
    switch (priority) {
      case 'high': return 0;
      case 'medium': return 1;
      case 'low': return 2;
      default: return 3;
    }
  };

  // Group tasks by priority and sort within each group
  const groupedTasks = tasks.reduce((acc, task) => {
    const priority = task.priority || 'no-priority';
    if (!acc[priority]) {
      acc[priority] = [];
    }
    acc[priority].push(task);
    return acc;
  }, {} as Record<string, TaskItem[]>);

  // Sort tasks within each priority group by dueDate
  Object.keys(groupedTasks).forEach(priority => {
    groupedTasks[priority].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  });

  // Sort priority groups
  const sortedPriorities = Object.keys(groupedTasks).sort((a, b) => 
    getPriorityOrder(a) - getPriorityOrder(b)
  );

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {sortedPriorities.map(priority => (
          <div key={priority}>
            {priority !== 'no-priority' && (
              <div className="px-6 py-2 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                  {priority} Priority
                </h3>
              </div>
            )}
            {groupedTasks[priority].map((task) => (
              <div key={task.id} className="px-6 py-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 mt-0.5"
                    defaultChecked={task.status === 'completed'}
                    readOnly
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
                    {task.dueDate && (
                      <p className="text-xs text-gray-500 mt-2">
                        Due: {new Date(task.dueDate).toLocaleString('en-AU', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TasksWidget;
