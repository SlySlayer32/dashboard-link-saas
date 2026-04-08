'use client'

import { useState, useCallback } from 'react'
import { Responsive, WidthProvider, type Layout } from 'react-grid-layout'
import { useDashboardLayout, useWorkspace } from '@/lib/workspace/workspace-context'
import type { DashboardWidget } from '@/lib/data/types'
import { StatsWidget } from './widgets/stats-widget'
import { ActivityWidget } from './widgets/activity-widget'
import { ShiftsWidget } from './widgets/shifts-widget'
import { TasksWidget } from './widgets/tasks-widget'
import { MessagesWidget } from './widgets/messages-widget'
import { QuickActionsWidget } from './widgets/quick-actions-widget'
import { Button } from '@/components/ui/button'
import { Lock, Unlock, RotateCcw } from 'lucide-react'
import { defaultDashboardLayout } from '@/lib/workspace/defaults'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface GridDashboardProps {
  className?: string
}

export function GridDashboard({ className }: GridDashboardProps) {
  const { layout, updateDashboardLayout } = useDashboardLayout()
  const { settings } = useWorkspace()
  const [isEditing, setIsEditing] = useState(false)

  // Convert widgets to react-grid-layout format
  const layouts = {
    lg: layout.widgets.map(widget => ({
      i: widget.id,
      x: widget.position.x,
      y: widget.position.y,
      w: widget.position.w,
      h: widget.position.h,
      minW: getMinWidth(widget.type),
      minH: getMinHeight(widget.type),
    })),
  }

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    if (!isEditing) return
    
    const updatedWidgets: DashboardWidget[] = layout.widgets.map(widget => {
      const layoutItem = newLayout.find(l => l.i === widget.id)
      if (layoutItem) {
        return {
          ...widget,
          position: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          },
        }
      }
      return widget
    })

    updateDashboardLayout({
      ...layout,
      widgets: updatedWidgets,
    })
  }, [isEditing, layout, updateDashboardLayout])

  const handleResetLayout = () => {
    updateDashboardLayout({
      ...defaultDashboardLayout,
      widgets: defaultDashboardLayout.widgets.map(w => ({
        ...w,
        position: { ...w.position }
      }))
    })
  }

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'stats':
        return <StatsWidget />
      case 'activity':
        return <ActivityWidget />
      case 'shifts-today':
        return <ShiftsWidget />
      case 'tasks':
        return <TasksWidget />
      case 'messages':
        return <MessagesWidget />
      case 'quick-actions':
        return <QuickActionsWidget />
      default:
        return <div className="p-4 text-muted-foreground">Unknown widget</div>
    }
  }

  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-end gap-2">
        <Button
          variant={isEditing ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="gap-2"
        >
          {isEditing ? (
            <>
              <Lock className="h-4 w-4" />
              Lock Layout
            </>
          ) : (
            <>
              <Unlock className="h-4 w-4" />
              Customize Layout
            </>
          )}
        </Button>
        {isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetLayout}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={80}
        onLayoutChange={(layout) => handleLayoutChange(layout)}
        isDraggable={isEditing}
        isResizable={isEditing}
        draggableHandle=".widget-drag-handle"
        useCSSTransforms
      >
        {layout.widgets.map(widget => (
          <div
            key={widget.id}
            className={`
              rounded-lg border bg-card overflow-hidden
              ${isEditing ? 'ring-2 ring-primary/20 cursor-move' : ''}
            `}
          >
            {isEditing && (
              <div className="widget-drag-handle h-6 bg-muted/50 flex items-center justify-center cursor-grab active:cursor-grabbing border-b">
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                </div>
              </div>
            )}
            <div className={`h-full ${isEditing ? 'pointer-events-none opacity-80' : ''}`}>
              {renderWidget(widget)}
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  )
}

function getMinWidth(type: DashboardWidget['type']): number {
  switch (type) {
    case 'stats':
      return 6
    default:
      return 3
  }
}

function getMinHeight(type: DashboardWidget['type']): number {
  switch (type) {
    case 'stats':
      return 2
    default:
      return 3
  }
}
