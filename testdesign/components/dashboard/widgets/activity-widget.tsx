'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { useTerminology } from '@/lib/workspace/workspace-context'
import { getRecentActivity } from '@/lib/data/demo-data'
import { MessageSquare, Calendar, CheckSquare, UserPlus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function ActivityWidget() {
  const { organization } = useAuth()
  const { t } = useTerminology()
  const activities = getRecentActivity(organization?.id || '')

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return MessageSquare
      case 'shift':
        return Calendar
      case 'task':
        return CheckSquare
      case 'worker':
        return UserPlus
      default:
        return MessageSquare
    }
  }

  const formatActivityText = (activity: { type: string; description: string }) => {
    let text = activity.description
    text = text.replace(/worker/gi, t('worker'))
    text = text.replace(/workers/gi, t('workers'))
    text = text.replace(/shift/gi, t('shift'))
    text = text.replace(/shifts/gi, t('shifts'))
    text = text.replace(/task/gi, t('task'))
    text = text.replace(/tasks/gi, t('tasks'))
    return text
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Recent Activity</h3>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {activities.slice(0, 8).map((activity, index) => {
          const Icon = getIcon(activity.type)
          return (
            <div key={index} className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{formatActivityText(activity)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          )
        })}
        {activities.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        )}
      </div>
    </div>
  )
}
