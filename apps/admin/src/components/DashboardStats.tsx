import type {
  AdminDashboardStats as DashboardStatsData,
  DashboardVisualizationIntensity,
} from '@dashboard-link/shared'
import { Activity, AlertTriangle, CheckCircle2, Eye, Send, Users } from 'lucide-react'
import React from 'react'

interface DashboardStatsProps {
  stats: DashboardStatsData
  isLoading?: boolean
  showSecondaryMetrics?: boolean
  visualizationIntensity?: DashboardVisualizationIntensity
}

interface StatCardProps {
  title: string
  value: string
  icon: React.ReactNode
  tone: 'primary' | 'warning' | 'success' | 'neutral'
  subtitle?: string
  emphasis?: 'feature' | 'standard'
}

function getCardToneClasses(tone: StatCardProps['tone'], emphasis: StatCardProps['emphasis']) {
  const base = emphasis === 'feature' ? 'text-white' : 'text-[hsl(var(--cc-text))]'

  switch (tone) {
    case 'primary':
      return emphasis === 'feature'
        ? `bg-[hsl(var(--cc-primary))] ${base}`
        : 'border-[hsl(var(--cc-primary))] bg-[hsl(var(--cc-primary-soft))] text-[hsl(var(--cc-text))]'
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-950'
    case 'success':
      return 'border-emerald-200 bg-emerald-50 text-emerald-950'
    default:
      return 'border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))] text-[hsl(var(--cc-text))]'
  }
}

function StatCard({ title, value, icon, tone, subtitle, emphasis = 'standard' }: StatCardProps) {
  return (
    <div
      className={`rounded-[28px] border p-6 shadow-sm ${getCardToneClasses(tone, emphasis)} ${
        emphasis === 'feature' ? 'lg:col-span-2' : ''
      }`}
    >
      <div className='flex items-start justify-between gap-6'>
        <div>
          <p
            className={`text-sm font-semibold uppercase tracking-[0.16em] ${emphasis === 'feature' ? 'text-white/70' : 'text-[hsl(var(--cc-text-muted))]'}`}
          >
            {title}
          </p>
          <p className={`mt-3 font-semibold ${emphasis === 'feature' ? 'text-5xl' : 'text-3xl'}`}>
            {value}
          </p>
          {subtitle && (
            <p
              className={`mt-2 text-sm ${emphasis === 'feature' ? 'text-white/80' : 'text-[hsl(var(--cc-text-muted))]'}`}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`rounded-2xl p-3 ${
            emphasis === 'feature' ? 'bg-white/15 text-white' : 'bg-white/70 text-current'
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

export function DashboardStats({
  stats,
  isLoading,
  showSecondaryMetrics = true,
  visualizationIntensity = 'balanced',
}: DashboardStatsProps) {
  if (isLoading) {
    return (
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='cc-panel rounded-[28px] p-6'>
            <div className='animate-pulse'>
              <div className='flex items-center justify-between gap-6'>
                <div className='flex-1'>
                  <div className='h-4 bg-gray-200 rounded w-24 mb-2'></div>
                  <div className='h-10 bg-gray-200 rounded w-24'></div>
                </div>
                <div className='h-12 w-12 bg-gray-200 rounded-2xl'></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const secondaryMetrics =
    showSecondaryMetrics && visualizationIntensity !== 'minimal'
      ? {
          deliveryRate: `${stats.smsDeliveredToday} delivered, ${stats.smsFailedToday} failed`,
          followUp: `${stats.nonOpenersToday.length} workers still need a follow-up`,
          delivered: `${stats.smsToday} total SMS today`,
          opens: `${stats.dashboardOpensToday} opens across ${stats.uniqueWorkersOpenedToday} workers`,
        }
      : undefined

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
      <StatCard
        title='Delivery Rate Today'
        value={`${stats.deliveryRateToday}%`}
        icon={<Activity className='h-6 w-6' />}
        tone='primary'
        emphasis='feature'
        subtitle={secondaryMetrics?.deliveryRate}
      />
      <StatCard
        title='Follow-up Needed'
        value={String(stats.nonOpenersToday.length)}
        icon={<AlertTriangle className='h-6 w-6' />}
        tone='warning'
        subtitle={secondaryMetrics?.followUp}
      />
      <StatCard
        title='Delivered Today'
        value={String(stats.smsDeliveredToday)}
        icon={<CheckCircle2 className='h-6 w-6' />}
        tone='success'
        subtitle={secondaryMetrics?.delivered}
      />
      <StatCard
        title='Workers Opened'
        value={String(stats.uniqueWorkersOpenedToday)}
        icon={<Eye className='h-6 w-6' />}
        tone='neutral'
        subtitle={secondaryMetrics?.opens}
      />
      <StatCard
        title='Active Workers'
        value={String(stats.activeWorkers)}
        icon={<Users className='h-6 w-6' />}
        tone='neutral'
        subtitle={
          showSecondaryMetrics
            ? `${stats.totalWorkers} total roster, ${stats.inactiveWorkers} inactive`
            : undefined
        }
      />
      <StatCard
        title='SMS This Week'
        value={String(stats.smsThisWeek)}
        icon={<Send className='h-6 w-6' />}
        tone='neutral'
        subtitle={showSecondaryMetrics ? `${stats.smsToday} sent today` : undefined}
      />
    </div>
  )
}
