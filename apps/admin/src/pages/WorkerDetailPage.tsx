import { ArrowLeft, Eye, MessageSquare, User } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AccessLogHistory } from '../components/AccessLogHistory'
import { SmsHistory } from '../components/SmsHistory'
import { WorkerActions } from '../components/WorkerActions'
import { WorkerProfile } from '../components/WorkerProfile'
import { useWorkerDetail } from '../hooks/useWorkerDetail'

type TabType = 'overview' | 'sms' | 'access'

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
    { id: 'access' as TabType, label: 'Access History', icon: <Eye className='h-4 w-4' /> },
  ]

  const fallbackWorker = {
    id: '',
    name: '',
    phone: '',
    email: '',
    active: false,
    createdAt: '',
    updatedAt: '',
    metadata: {},
    organizationId: '',
  }

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
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

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-2'>
          {activeTab === 'overview' && (
            <div className='space-y-8'>
              <WorkerProfile
                worker={data?.worker || fallbackWorker}
                stats={
                  data?.stats || {
                    totalSms: 0,
                    sentSms: 0,
                    failedSms: 0,
                    smsToday: 0,
                    smsThisWeek: 0,
                  }
                }
                access={data?.access}
                isLoading={isLoading}
              />
              <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-3'>MVP Delivery Check</h3>
                <div className='space-y-3 text-sm text-gray-600'>
                  <p>Use Scheduling to prepare the worker dashboard for the next shift.</p>
                  <p>
                    Send the dashboard link from the action panel once the worker data is ready.
                  </p>
                  <p>Confirm delivery and dashboard opens from the SMS and Access History tabs.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sms' && <SmsHistory workerId={id || ''} isLoading={isLoading} />}
          {activeTab === 'access' && <AccessLogHistory workerId={id || ''} />}
        </div>

        <div className='space-y-8'>
          <WorkerActions worker={data?.worker || fallbackWorker} />
        </div>
      </div>
    </div>
  )
}

export default WorkerDetailPage
