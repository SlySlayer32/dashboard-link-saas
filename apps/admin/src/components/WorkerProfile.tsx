import { BarChart3, Calendar, CheckCircle, Mail, MessageSquare, Phone, XCircle } from 'lucide-react';
import React from 'react';

interface WorkerData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

interface WorkerStats {
  totalSms: number;
  sentSms: number;
  failedSms: number;
  smsToday: number;
  smsThisWeek: number;
}

interface WorkerProfileProps {
  worker: WorkerData;
  stats: WorkerStats;
  isLoading?: boolean;
}

function StatCard({ title, value, icon, color }: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function WorkerProfile({ worker, stats, isLoading }: WorkerProfileProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{worker.name}</h2>
            <div className="mt-2 flex items-center space-x-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                worker.active 
                  ? 'text-green-700 bg-green-100' 
                  : 'text-red-700 bg-red-100'
              }`}>
                {worker.active ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    Inactive
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-900">{worker.phone}</span>
              </div>
              {worker.email && (
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-gray-900">{worker.email}</span>
                </div>
              )}
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-500">
                  Added {new Date(worker.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SMS Statistics</h3>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                title="Total Sent"
                value={stats.totalSms}
                icon={<MessageSquare className="h-4 w-4 text-blue-600" />}
                color="bg-blue-100"
              />
              <StatCard
                title="Successful"
                value={stats.sentSms}
                icon={<CheckCircle className="h-4 w-4 text-green-600" />}
                color="bg-green-100"
              />
              <StatCard
                title="Failed"
                value={stats.failedSms}
                icon={<XCircle className="h-4 w-4 text-red-600" />}
                color="bg-red-100"
              />
              <StatCard
                title="This Week"
                value={stats.smsThisWeek}
                icon={<BarChart3 className="h-4 w-4 text-purple-600" />}
                color="bg-purple-100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
