'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { useTerminology } from '@/lib/workspace/workspace-context'
import { demoTasks } from '@/lib/data/demo-data'
import { AlertCircle, Circle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export function TasksWidget() {
  const { organization } = useAuth()
  const { t } = useTerminology()
  
  // Filter tasks that aren't done
  const pendingTasks = demoTasks.filter(task => task.status !== 'done')

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-3.5 w-3.5 text-destructive" />
      case 'medium':
        return <Circle className="h-3.5 w-3.5 text-warning" />
      default:
        return <Circle className="h-3.5 w-3.5 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">
            In Progress
          </span>
        )
      case 'todo':
        return (
          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            To Do
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Pending {t('tasks', true)}</h3>
        <Link 
          href="/tasks" 
          className="text-xs text-primary hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {pendingTasks.slice(0, 6).map((task) => (
          <div 
            key={task.id} 
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div className="mt-0.5">
              {getPriorityIcon(task.priority)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{task.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground truncate">
                  {task.assignedToName}
                </span>
                {getStatusBadge(task.status)}
              </div>
            </div>
          </div>
        ))}
        {pendingTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-success mb-2" />
            <p className="text-sm text-muted-foreground">
              All {t('tasks')} completed!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
