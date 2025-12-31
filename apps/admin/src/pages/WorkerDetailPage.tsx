import { ArrowLeft, ExternalLink, MessageSquare, Settings, Smartphone, User } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DashboardPreview from '../components/DashboardPreview'
import { SmsHistory } from '../components/SmsHistory'
import { WorkerActions } from '../components/WorkerActions'
import { WorkerProfile } from '../components/WorkerProfile'
import { useWorkerDetail } from '../hooks/useWorkerDetail'

type TabType = 'overview' | 'sms' | 'settings'

export function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const { data, isLoading, error } = useWorkerDetail(id || '')

  if (error) {
    return (
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <h2 className='text-red-800 font-semibold'>Error loading worker</h2>
          <p className='text-red-600 mt-1'>
            {error instanceof Error ? error.message : 'Failed to load worker data'}
          </p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: <User className='h-4 w-4' /> },
    { id: 'sms' as TabType, label: 'SMS History', icon: <MessageSquare className='h-4 w-4' /> },
    { id: 'settings' as TabType, label: 'Settings', icon: <Settings className='h-4 w-4' /> },
  ]

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* Breadcrumb */}
      <nav className='flex mb-8' aria-label='Breadcrumb'>
        <ol className='inline-flex items-center space-x-1 md:space-x-3'>
          <li>
            <Link
              to='/workers'
              className='text-gray-700 hover:text-gray-900 inline-flex items-center'
            >
              Workers
            </Link>
          </li>
          <li>
            <div className='flex items-center'>
              <svg className='w-4 h-4 text-gray-400' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                  clipRule='evenodd'
                />
              </svg>
              <span className='ml-2 text-gray-500 md:ml-2'>
                {data?.worker.name || 'Loading...'}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className='mb-8'>
        <Link
          to='/workers'
          className='inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4'
        >
          <ArrowLeft className='h-4 w-4 mr-1' />
          Back to Workers
        </Link>
        <h1 className='text-3xl font-bold text-gray-900'>
          {data?.worker.name || 'Worker Details'}
        </h1>
      </div>

      {/* Tabs */}
      <div className='border-b border-gray-200 mb-8'>
        <nav className='-mb-px flex space-x-8'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span className='ml-2'>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-2'>
          {activeTab === 'overview' && (
            <div className='space-y-8'>
              <WorkerProfile
                worker={
                  data?.worker || {
                    id: '',
                    name: '',
                    phone: '',
                    email: '',
                    active: false,
                    created_at: '',
                    updated_at: '',
                    metadata: {},
                    organization_id: '',
                  }
                }
                stats={
                  data?.stats || {
                    totalSms: 0,
                    sentSms: 0,
                    failedSms: 0,
                    smsToday: 0,
                    smsThisWeek: 0,
                  }
                }
                isLoading={isLoading}
              />
              <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
                <div className='px-6 py-4 border-b border-gray-200 flex justify-between items-center'>
                  <h3 className='text-lg font-semibold text-gray-900'>Dashboard Preview</h3>
                  <a
                    href={`/dashboard-preview/${id}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center text-sm text-blue-600 hover:text-blue-800'
                  >
                    <ExternalLink className='h-4 w-4 mr-1' />
                    Open in new tab
                  </a>
                </div>
                <div className='p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center'>
                  <div className='text-sm text-gray-600'>
                    Viewing as: <span className='font-medium'>{data?.worker.name || 'Worker'}</span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                      <Smartphone className='h-3 w-3 mr-1' />
                      Mobile View
                    </span>
                  </div>
                </div>
                <div className='p-4 max-h-[600px] overflow-y-auto'>
                  <DashboardPreview workerId={id || ''} viewMode='mobile' embedded={true} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sms' && <SmsHistory workerId={id || ''} isLoading={isLoading} />}

          {activeTab === 'settings' && (
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>Worker Settings</h3>
              <div className='text-center py-8'>
                <Settings className='h-12 w-12 text-gray-400 mx-auto mb-3' />
                <p className='text-gray-500'>Settings management coming soon</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className='space-y-8'>
          <WorkerActions
            worker={
              data?.worker || {
                id: '',
                name: '',
                phone: '',
                email: '',
                active: false,
                created_at: '',
                updated_at: '',
                metadata: {},
                organization_id: '',
              }
            }
          />

          {/* WorkerActivity component will be added in future iteration */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>Recent Activity</h3>
            <div className='text-center py-8'>
              <MessageSquare className='h-12 w-12 text-gray-400 mx-auto mb-3' />
              <p className='text-gray-500'>No recent activity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkerDetailPage
