import { Calendar, MessageSquare, UserCheck, UserX, Users } from 'lucide-react';
import React from 'react';

interface DashboardStatsData {
  totalWorkers: number;
  activeWorkers: number;
  inactiveWorkers: number;
  smsToday: number;
  smsThisWeek: number;
}

interface DashboardStatsProps {
  stats: DashboardStatsData;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="Total Workers"
        value={stats.totalWorkers}
        icon={<Users className="h-6 w-6 text-blue-600" />}
        color="bg-blue-100"
      />
      <StatCard
        title="Active Workers"
        value={stats.activeWorkers}
        icon={<UserCheck className="h-6 w-6 text-green-600" />}
        color="bg-green-100"
        subtitle={stats.totalWorkers > 0 ? `${Math.round((stats.activeWorkers / stats.totalWorkers) * 100)}% of total` : '0% of total'}
      />
      <StatCard
        title="Inactive Workers"
        value={stats.inactiveWorkers}
        icon={<UserX className="h-6 w-6 text-red-600" />}
        color="bg-red-100"
        subtitle={stats.totalWorkers > 0 ? `${Math.round((stats.inactiveWorkers / stats.totalWorkers) * 100)}% of total` : '0% of total'}
      />
      <StatCard
        title="SMS Sent Today"
        value={stats.smsToday}
        icon={<MessageSquare className="h-6 w-6 text-purple-600" />}
        color="bg-purple-100"
      />
      <StatCard
        title="SMS Sent This Week"
        value={stats.smsThisWeek}
        icon={<Calendar className="h-6 w-6 text-indigo-600" />}
        color="bg-indigo-100"
      />
    </div>
  );
}
