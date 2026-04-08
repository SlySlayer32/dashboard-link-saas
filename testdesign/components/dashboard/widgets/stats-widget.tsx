'use client'

import { useTerminology } from '@/lib/workspace/workspace-context'
import { useAuth } from '@/lib/auth/auth-context'
import { getOverviewStats } from '@/lib/data/demo-data'
import { Users, MessageSquare, Calendar, CheckSquare } from 'lucide-react'

export function StatsWidget() {
  const { organization } = useAuth()
  const { t } = useTerminology()
  const stats = getOverviewStats(organization?.id || '')

  const statItems = [
    {
      label: `Total ${t('workers')}`,
      value: stats.totalWorkers,
      icon: Users,
      change: '+2 this week',
      changeType: 'positive' as const,
    },
    {
      label: `${t('messages', true)} Today`,
      value: stats.messagesToday,
      icon: MessageSquare,
      change: `${stats.responseRate}% response rate`,
      changeType: 'neutral' as const,
    },
    {
      label: `${t('shifts', true)} Today`,
      value: stats.shiftsToday,
      icon: Calendar,
      change: `${stats.activeWorkers} active`,
      changeType: 'neutral' as const,
    },
    {
      label: `Pending ${t('tasks')}`,
      value: stats.pendingTasks,
      icon: CheckSquare,
      change: stats.pendingTasks > 0 ? 'Needs attention' : 'All clear',
      changeType: stats.pendingTasks > 3 ? 'negative' as const : 'neutral' as const,
    },
  ]

  return (
    <div className="h-full p-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-full">
        {statItems.map((stat, index) => (
          <div
            key={index}
            className="flex flex-col justify-center p-3 rounded-lg bg-muted/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className={`text-xs mt-1 ${
              stat.changeType === 'positive' ? 'text-success' :
              stat.changeType === 'negative' ? 'text-destructive' :
              'text-muted-foreground'
            }`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
