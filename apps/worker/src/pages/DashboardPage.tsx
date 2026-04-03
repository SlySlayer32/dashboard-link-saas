import { LoadingSpinner, WorkerAccess } from '@dashboard-link/ui'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ScheduleWidget from '../components/widgets/ScheduleWidget'
import TasksWidget from '../components/widgets/TasksWidget'
import { useDashboardData } from '../hooks/useDashboardData'

function DashboardPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { data, isLoading, error, refetch, isFetching } = useDashboardData(token)
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    if (!error) return

    if (error.code === 'expired-token') {
      const expiredAt = new Date().toISOString()
      navigate(`/error/expired-token?expiredAt=${expiredAt}`, { replace: true })
      return
    }

    if (error.code === 'invalid-token' || error.code === 'missing-token') {
      navigate('/error/invalid-token', { replace: true })
    }
  }, [error, navigate])

  const handleValidateToken = useCallback(
    async (_tokenToValidate: string) => {
      setIsValidating(true)
      try {
        await refetch()
      } finally {
        setIsValidating(false)
      }
    },
    [refetch]
  )

  const handleManualRefresh = useCallback(async () => {
    await refetch()
  }, [refetch])

  const startY = useRef<number | null>(null)
  const currentY = useRef<number | null>(null)
  const isPulling = useRef(false)

  const handleTouchStart = useCallback((e: globalThis.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY
      isPulling.current = true
    }
  }, [])

  const handleTouchMove = useCallback((e: globalThis.TouchEvent) => {
    if (!isPulling.current || startY.current === null) return

    currentY.current = e.touches[0].clientY
    const pullDistance = (currentY.current - startY.current) / 2

    if (pullDistance > 0 && pullDistance < 150) {
      document.body.style.transform = `translateY(${pullDistance}px)`
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!isPulling.current || startY.current === null || currentY.current === null) return

    const pullDistance = (currentY.current - startY.current) / 2

    if (pullDistance > 100) {
      void refetch()
    }

    document.body.style.transform = ''
    startY.current = null
    currentY.current = null
    isPulling.current = false
  }, [refetch])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('touchstart', handleTouchStart, { passive: true })
      window.addEventListener('touchmove', handleTouchMove, { passive: true })
      window.addEventListener('touchend', handleTouchEnd, { passive: true })

      return () => {
        window.removeEventListener('touchstart', handleTouchStart)
        window.removeEventListener('touchmove', handleTouchMove)
        window.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  if (!data && !error && !isLoading) {
    return (
      <WorkerAccess
        token={token || ''}
        onValidateToken={handleValidateToken}
        isLoading={isValidating}
      />
    )
  }

  if (isLoading || isValidating) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <LoadingSpinner size='xl' className='mb-4' />
          <p className='text-gray-600'>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <WorkerAccess
        token={token || ''}
        onValidateToken={handleValidateToken}
        isLoading={isValidating}
        error={error?.message}
      />
    )
  }

  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className='min-h-screen bg-gray-50 pb-12'>
      <header className='bg-white shadow-sm'>
        <div className='max-w-4xl mx-auto px-4 py-6'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>Welcome, {data.worker.name}!</h1>
              <p className='text-sm text-gray-600 mt-1'>{today}</p>
              <p className='text-sm text-gray-500 mt-2'>
                Your schedule, tasks, and key details for today are all in one place.
              </p>
            </div>
            <button
              type='button'
              onClick={() => {
                void handleManualRefresh()
              }}
              className='inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60'
              disabled={isFetching}
            >
              <svg
                className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M4 4v5h5M20 20v-5h-5M5.64 18.36A9 9 0 1020 12'
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className='max-w-4xl mx-auto px-4 py-8 space-y-6'>
        <div className='rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800'>
          Pull down or tap refresh if your manager updates your schedule during the day.
        </div>

        <ScheduleWidget schedule={data.schedule} />
        <TasksWidget tasks={data.tasks} />

        {data.schedule.length === 0 && data.tasks.length === 0 && (
          <div className='bg-white rounded-lg shadow p-8 text-center'>
            <p className='text-gray-600'>No schedule or tasks for today yet.</p>
            <p className='mt-2 text-sm text-gray-500'>
              Check back shortly or refresh after your manager adds updates.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default DashboardPage
