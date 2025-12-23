import { CheckCircle, Clock, MessageCircle, XCircle } from 'lucide-react';

interface ActivityItem {
  id: string;
  message: string;
  status: string;
  created_at: string;
  worker_id: string;
  workers: {
    name: string;
    phone: string;
  };
}

interface RecentActivityProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'sent':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-yellow-500" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'sent':
      return 'text-green-700 bg-green-50';
    case 'failed':
      return 'text-red-700 bg-red-50';
    default:
      return 'text-yellow-700 bg-yellow-50';
  }
}

function formatMessage(message: string, maxLength: number = 60) {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No recent SMS activity</p>
          <p className="text-sm text-gray-400 mt-1">Send your first SMS to see activity here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getStatusIcon(activity.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.workers.name}
                </p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                  {activity.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                {formatMessage(activity.message)}
              </p>
              <p className="text-xs text-gray-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(activity.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all activity →
          </button>
        </div>
      )}
    </div>
  );
}
