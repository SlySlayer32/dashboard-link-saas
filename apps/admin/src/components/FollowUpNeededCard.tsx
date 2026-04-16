import type { NonOpenerItem } from '@dashboard-link/shared'
import { AlertCircle, ArrowRight, Eye, MessageSquare, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'

interface FollowUpNeededCardProps {
  items: NonOpenerItem[]
  isLoading?: boolean
  onResend: (item: NonOpenerItem) => Promise<void>
  onViewWorker: (workerId: string) => void
  onViewAll: () => void
}

function formatMinutesSince(minutesSinceSent: number) {
  if (minutesSinceSent < 60) {
    return `${minutesSinceSent}m ago`
  }

  const hours = Math.floor(minutesSinceSent / 60)
  const remainder = minutesSinceSent % 60
  return remainder > 0 ? `${hours}h ${remainder}m ago` : `${hours}h ago`
}

export function FollowUpNeededCard({
  items,
  isLoading,
  onResend,
  onViewWorker,
  onViewAll,
}: FollowUpNeededCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [resendingWorkerId, setResendingWorkerId] = useState<string | null>(null)

  const visibleItems = useMemo(() => {
    const limit = isExpanded ? items.length : 5
    return items.slice(0, limit)
  }, [isExpanded, items])

  if (isLoading) {
    return (
      <section className='cc-panel rounded-[28px] p-6'>
        <div className='animate-pulse'>
          <div className='h-4 w-32 rounded bg-gray-200'></div>
          <div className='mt-4 h-10 w-20 rounded bg-gray-200'></div>
          <div className='mt-6 space-y-3'>
            {[...Array(3)].map((_, index) => (
              <div key={index} className='h-16 rounded-2xl bg-gray-200'></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className='cc-panel rounded-[28px] p-6'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <p className='cc-kicker'>Follow-up Needed</p>
          <div className='mt-3 flex items-end gap-3'>
            <p className='text-4xl font-semibold text-[hsl(var(--cc-text))]'>{items.length}</p>
            <p className='pb-1 text-sm text-[hsl(var(--cc-text-muted))]'>
              workers still have not opened today&apos;s link
            </p>
          </div>
        </div>
        <button type='button' onClick={onViewAll} className='cc-secondary-button px-4 py-2 text-sm'>
          View all in SMS logs
        </button>
      </div>

      {items.length === 0 ? (
        <div className='mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-6 text-emerald-900'>
          <div className='flex items-start gap-3'>
            <div className='rounded-full bg-emerald-100 p-2'>
              <Eye className='h-5 w-5' />
            </div>
            <div>
              <p className='text-base font-semibold'>No follow-up needed right now</p>
              <p className='mt-1 text-sm text-emerald-800'>
                Everyone who received a qualifying dashboard link today has already opened it.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className='mt-6 space-y-3'>
            {visibleItems.map((item) => (
              <div
                key={item.smsLogId}
                className='rounded-[24px] border border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface-muted))] px-4 py-4'
              >
                <div className='flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between'>
                  <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <p className='text-base font-semibold text-[hsl(var(--cc-text))]'>
                        {item.workerName}
                      </p>
                      <span className='rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800'>
                        {item.smsStatus}
                      </span>
                    </div>
                    <p className='mt-1 text-sm text-[hsl(var(--cc-text-muted))]'>
                      {item.workerPhone}
                    </p>
                    <div className='mt-3 flex flex-wrap items-center gap-3 text-xs text-[hsl(var(--cc-text-muted))]'>
                      <span className='inline-flex items-center gap-1'>
                        <AlertCircle className='h-3.5 w-3.5' />
                        Sent {formatMinutesSince(item.minutesSinceSent)}
                      </span>
                    </div>
                  </div>

                  <div className='flex flex-wrap gap-2'>
                    <button
                      type='button'
                      onClick={() => onViewWorker(item.workerId)}
                      className='cc-secondary-button px-3 py-2 text-sm'
                    >
                      <span className='inline-flex items-center gap-2'>
                        <ArrowRight className='h-4 w-4' />
                        View worker
                      </span>
                    </button>
                    <button
                      type='button'
                      onClick={async () => {
                        setResendingWorkerId(item.workerId)
                        try {
                          await onResend(item)
                        } finally {
                          setResendingWorkerId(null)
                        }
                      }}
                      disabled={resendingWorkerId === item.workerId}
                      className='cc-primary-button px-3 py-2 text-sm disabled:opacity-50'
                    >
                      <span className='inline-flex items-center gap-2'>
                        {resendingWorkerId === item.workerId ? (
                          <RefreshCw className='h-4 w-4 animate-spin' />
                        ) : (
                          <MessageSquare className='h-4 w-4' />
                        )}
                        Resend link
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {items.length > 5 && (
            <button
              type='button'
              onClick={() => setIsExpanded((current) => !current)}
              className='cc-secondary-button mt-5 px-4 py-2 text-sm'
            >
              {isExpanded ? 'Show fewer' : `Show ${items.length - 5} more`}
            </button>
          )}
        </>
      )}
    </section>
  )
}
