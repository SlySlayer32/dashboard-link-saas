'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { useTerminology } from '@/lib/workspace/workspace-context'
import { getTodayShifts } from '@/lib/data/demo-data'
import { Clock, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export function ShiftsWidget() {
  const { organization } = useAuth()
  const { t } = useTerminology()
  const shifts = getTodayShifts(organization?.id || '')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-success/20 text-success border-success/30'
      case 'confirmed':
        return 'bg-primary/20 text-primary border-primary/30'
      case 'scheduled':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'Active'
      case 'confirmed':
        return 'Confirmed'
      case 'scheduled':
        return 'Scheduled'
      default:
        return status
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Today&apos;s {t('shifts', true)}</h3>
        <Link 
          href="/shifts" 
          className="text-xs text-primary hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {shifts.slice(0, 5).map((shift) => (
          <div 
            key={shift.id} 
            className="p-3 rounded-lg bg-muted/30 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{shift.workerName}</span>
              <Badge 
                variant="outline" 
                className={`text-xs ${getStatusColor(shift.status)}`}
              >
                {formatStatus(shift.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {shift.startTime} - {shift.endTime}
              </div>
              {shift.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {shift.location}
                </div>
              )}
            </div>
          </div>
        ))}
        {shifts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No {t('shifts')} scheduled for today
          </p>
        )}
      </div>
    </div>
  )
}
