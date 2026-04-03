import { CalendarDays, ClipboardList, MessageSquare, Plus, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DashboardStats } from '../components/DashboardStats'
import { RecentActivity } from '../components/RecentActivity'
import { useDashboard } from '../hooks/useDashboard'

function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useDashboard()

  if (error) {
    return (
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <h2 className='text-red-800 font-semibold'>Error loading dashboard</h2>
          <p className='text-red-600 mt-1'>
            {error instanceof Error ? error.message : 'Failed to load dashboard data'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
        <p className='mt-2 text-gray-600'>
          Track worker setup, send daily links, and confirm when dashboards have been opened.
        </p>
      </div>

      <div className='mb-8'>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>Quick Actions</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <button
            onClick={() => navigate('/workers', { state: { openCreateWorker: true } })}
            className='flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            <Plus className='h-5 w-5 mr-2' />
            Add Worker
          </button>
          <button
            onClick={() => navigate('/manual-data')}
            className='flex items-center justify-center px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors'
          >
            <CalendarDays className='h-5 w-5 mr-2' />
            Manual Data
          </button>
          <button
            onClick={() => navigate('/workers')}
            className='flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'
          >
            <Users className='h-5 w-5 mr-2' />
            View Workers
          </button>
          <button
            onClick={() => navigate('/sms-logs')}
            className='flex items-center justify-center px-4 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors'
          >
            <MessageSquare className='h-5 w-5 mr-2' />
            SMS Logs
          </button>
        </div>
      </div>

      <div className='mb-8'>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>Statistics</h2>
        <DashboardStats
          stats={
            data?.stats || {
              totalWorkers: 0,
              activeWorkers: 0,
              inactiveWorkers: 0,
              smsToday: 0,
              smsThisWeek: 0,
              dashboardOpensToday: 0,
              uniqueWorkersOpenedToday: 0,
            }
          }
          isLoading={isLoading}
        />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <div>
          <RecentActivity activities={data?.recentActivity || []} isLoading={isLoading} />
        </div>

        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>MVP Workflow</h3>
          <div className='space-y-4 text-sm text-gray-600'>
            <div className='flex items-start'>
              <Plus className='h-4 w-4 mr-3 mt-0.5 text-blue-600' />
              <div>
                <p className='font-medium text-gray-900'>1. Add or update workers</p>
                <p>Keep the roster current before sending any dashboard links.</p>
              </div>
            </div>
            <div className='flex items-start'>
              <CalendarDays className='h-4 w-4 mr-3 mt-0.5 text-emerald-600' />
              <div>
                <p className='font-medium text-gray-900'>2. Enter schedule and task data</p>
                <p>Manual entry is the launch path for delivering daily dashboard content.</p>
              </div>
            </div>
            <div className='flex items-start'>
              <ClipboardList className='h-4 w-4 mr-3 mt-0.5 text-slate-700' />
              <div>
                <p className='font-medium text-gray-900'>3. Send links and confirm opens</p>
                <p>Use worker detail pages and recent activity to verify each dashboard was opened.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
