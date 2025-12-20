import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { API_URL } from '../lib/config';
import ScheduleWidget from '../components/widgets/ScheduleWidget';
import TasksWidget from '../components/widgets/TasksWidget';
import type { ScheduleItem, TaskItem, Worker } from '@dashboard-link/shared';

interface DashboardData {
  worker: Worker;
  schedule: ScheduleItem[];
  tasks: TaskItem[];
}

function DashboardPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard', token],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/dashboards/${token}`);
      if (!response.ok) {
        throw new Error('Failed to load dashboard');
      }
      return response.json();
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">
            This link may have expired or is invalid.
          </p>
          <p className="text-sm text-gray-500">
            Please request a new link from your administrator.
          </p>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {data.worker.name}!
          </h1>
          <p className="text-sm text-gray-600 mt-1">{today}</p>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Schedule Widget */}
        <ScheduleWidget schedule={data.schedule} />

        {/* Tasks Widget */}
        <TasksWidget tasks={data.tasks} />

        {/* Empty State */}
        {data.schedule.length === 0 && data.tasks.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">
              No schedule or tasks for today. Enjoy your day!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;
