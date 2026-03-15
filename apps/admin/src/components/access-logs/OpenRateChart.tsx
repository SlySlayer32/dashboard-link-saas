/**
 * OpenRateChart Component
 *
 * Displays analytics visualization for dashboard open rates
 * Shows overall stats and per-worker breakdown
 */

import { BarChart3, Users, CheckCircle, XCircle } from 'lucide-react'

interface AccessStats {
  totalAccesses: number
  successfulAccesses: number
  failedAccesses: number
  uniqueWorkers: number
  openRate: number
}

interface WorkerStats {
  workerId: string
  workerName: string
  lastAccessedAt: string | null
  totalAccesses: number
  successfulAccesses: number
}

interface OpenRateChartProps {
  stats: AccessStats
  workerStats?: WorkerStats[]
  loading?: boolean
}

export function OpenRateChart({ stats, workerStats = [], loading = false }: OpenRateChartProps) {
  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  const openRatePercentage = Math.round(stats.openRate * 100)

  return (
    <div className='space-y-6'>
      {/* Overall Statistics */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='bg-white p-6 rounded-lg border border-gray-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Total Accesses</p>
              <p className='text-2xl font-bold text-gray-900'>{stats.totalAccesses}</p>
            </div>
            <BarChart3 className='w-8 h-8 text-blue-600' />
          </div>
        </div>

        <div className='bg-white p-6 rounded-lg border border-gray-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Successful</p>
              <p className='text-2xl font-bold text-green-600'>{stats.successfulAccesses}</p>
            </div>
            <CheckCircle className='w-8 h-8 text-green-600' />
          </div>
        </div>

        <div className='bg-white p-6 rounded-lg border border-gray-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Failed</p>
              <p className='text-2xl font-bold text-red-600'>{stats.failedAccesses}</p>
            </div>
            <XCircle className='w-8 h-8 text-red-600' />
          </div>
        </div>

        <div className='bg-white p-6 rounded-lg border border-gray-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Open Rate</p>
              <p className='text-2xl font-bold text-blue-600'>{openRatePercentage}%</p>
            </div>
            <Users className='w-8 h-8 text-blue-600' />
          </div>
          <p className='text-xs text-gray-500 mt-1'>{stats.uniqueWorkers} workers opened</p>
        </div>
      </div>

      {/* Per-Worker Statistics */}
      {workerStats.length > 0 && (
        <div className='bg-white p-6 rounded-lg border border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Worker Access Stats</h3>
          <div className='space-y-3'>
            {workerStats.slice(0, 10).map((worker) => {
              const successRate =
                worker.totalAccesses > 0
                  ? Math.round((worker.successfulAccesses / worker.totalAccesses) * 100)
                  : 0

              return (
                <div key={worker.workerId} className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-gray-900'>{worker.workerName}</p>
                    <p className='text-xs text-gray-500'>
                      {worker.totalAccesses} access{worker.totalAccesses !== 1 ? 'es' : ''}
                    </p>
                  </div>
                  <div className='flex items-center gap-4'>
                    <div className='w-32 bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-green-600 h-2 rounded-full transition-all'
                        style={{ width: `${successRate}%` }}
                      />
                    </div>
                    <span className='text-sm font-medium text-gray-700 w-12 text-right'>
                      {successRate}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          {workerStats.length > 10 && (
            <p className='text-sm text-gray-500 mt-4 text-center'>
              Showing top 10 of {workerStats.length} workers
            </p>
          )}
        </div>
      )}
    </div>
  )
}
