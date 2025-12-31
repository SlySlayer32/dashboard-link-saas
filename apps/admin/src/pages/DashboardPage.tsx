import { BarChart3, MessageSquare, Plus, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DashboardStats } from '../components/DashboardStats'
import { OnboardingFlow } from '../components/OnboardingFlow'
import { RecentActivity } from '../components/RecentActivity'
import { useDashboard } from '../hooks/useDashboard'
import { useOnboardingStore } from '../store/onboarding'

function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useDashboard()
  const { isCompleted } = useOnboardingStore()

  // Show onboarding flow if not completed
  if (!isCompleted) {
    return <OnboardingFlow />
  }

  const handleAddWorker = () => {
    navigate('/workers/new')
  }

  const handleSendSMS = () => {
    navigate('/sms/send')
  }

  const handleViewWorkers = () => {
    navigate('/workers')
  }

  const handleViewReports = () => {
    navigate('/reports')
  }

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
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
        <p className='mt-2 text-gray-600'>
          Welcome back! Here's an overview of your dashboard activity.
        </p>
      </div>

      {/* Quick Actions */}
      <div className='mb-8'>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>Quick Actions</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <button
            onClick={handleAddWorker}
            className='flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            <Plus className='h-5 w-5 mr-2' />
            Add Worker
          </button>
          <button
            onClick={handleSendSMS}
            className='flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
          >
            <MessageSquare className='h-5 w-5 mr-2' />
            Send SMS
          </button>
          <button
            onClick={handleViewWorkers}
            className='flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'
          >
            <Users className='h-5 w-5 mr-2' />
            View Workers
          </button>
          <button
            onClick={handleViewReports}
            className='flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors'
          >
            <BarChart3 className='h-5 w-5 mr-2' />
            Reports
          </button>
        </div>
      </div>

      {/* Stats Grid */}
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
            }
          }
          isLoading={isLoading}
        />
      </div>

      {/* Recent Activity */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <div>
          <RecentActivity activities={data?.recentActivity || []} isLoading={isLoading} />
        </div>

        {/* Placeholder for future charts */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>SMS Trends</h3>
          <div className='text-center py-8'>
            <BarChart3 className='h-12 w-12 text-gray-400 mx-auto mb-3' />
            <p className='text-gray-500'>Charts coming soon</p>
            <p className='text-sm text-gray-400 mt-1'>Visualize your SMS activity over time</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
