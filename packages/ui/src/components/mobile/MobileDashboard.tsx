import { Badge } from '../Badge'
import { Button } from '../Button'
import { Card, CardContent } from '../Card'

// Mobile-optimized schedule item for worker dashboard
interface MobileScheduleItemProps {
  title: string
  startTime: string
  endTime: string
  location?: string
  status: 'upcoming' | 'in-progress' | 'completed'
  onPress?: () => void
}

export function MobileScheduleItem({
  title,
  startTime,
  endTime,
  location,
  status,
  onPress
}: MobileScheduleItemProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'in-progress': return 'warning'
      case 'completed': return 'success'
      case 'upcoming': return 'info'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-progress': return 'In Progress'
      case 'completed': return 'Completed'
      case 'upcoming': return 'Upcoming'
      default: return status
    }
  }

  return (
    <Card 
      variant="default" 
      className="mb-4 cursor-pointer active:scale-[0.98] transition-transform"
      onClick={onPress}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg text-gray-900 flex-1">{title}</h3>
          <Badge variant={getStatusVariant(status)} size="sm">
            {getStatusText(status)}
          </Badge>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <span className="font-medium">Time:</span>
            <span className="ml-2">{startTime} - {endTime}</span>
          </div>
          
          {location && (
            <div className="flex items-center">
              <span className="font-medium">Location:</span>
              <span className="ml-2">{location}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Mobile-optimized task item for worker dashboard
interface MobileTaskItemProps {
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed'
  dueDate?: string
  onPress?: () => void
}

export function MobileTaskItem({
  title,
  description,
  priority,
  status,
  dueDate,
  onPress
}: MobileTaskItemProps) {
  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'in_progress': return 'warning'
      case 'pending': return 'info'
      default: return 'default'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'High'
      case 'medium': return 'Medium'
      case 'low': return 'Low'
      default: return priority
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Done'
      case 'in_progress': return 'In Progress'
      case 'pending': return 'To Do'
      default: return status
    }
  }

  return (
    <Card 
      variant="muted" 
      className="mb-3 cursor-pointer active:scale-[0.98] transition-transform"
      onClick={onPress}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-gray-900 flex-1">{title}</h4>
          <div className="flex gap-2">
            <Badge variant={getPriorityVariant(priority)} size="sm">
              {getPriorityText(priority)}
            </Badge>
            <Badge variant={getStatusVariant(status)} size="sm">
              {getStatusText(status)}
            </Badge>
          </div>
        </div>
        
        {description && (
          <p className="text-sm text-gray-600 mb-2">{description}</p>
        )}
        
        {dueDate && (
          <div className="text-xs text-gray-500">
            Due: {dueDate}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Mobile dashboard header with worker info
interface MobileDashboardHeaderProps {
  workerName: string
  organizationName: string
  currentDate: string
  onRefresh?: () => void
  isLoading?: boolean
}

export function MobileDashboardHeader({
  workerName,
  organizationName,
  currentDate,
  onRefresh,
  isLoading = false
}: MobileDashboardHeaderProps) {
  return (
    <Card variant="elevated" className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{workerName}</h1>
            <p className="text-sm text-gray-600">{organizationName}</p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2"
          >
            <svg 
              className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </Button>
        </div>
        
        <div className="text-center py-2">
          <p className="text-lg font-medium text-gray-900">{currentDate}</p>
          <p className="text-sm text-gray-600">Today's Dashboard</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Mobile dashboard section header
interface MobileSectionHeaderProps {
  title: string
  count?: number
  showAll?: boolean
  onShowAll?: () => void
}

export function MobileSectionHeader({
  title,
  count,
  showAll = false,
  onShowAll
}: MobileSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {count !== undefined && (
          <Badge variant="default" size="sm">
            {count}
          </Badge>
        )}
      </div>
      
      {showAll && onShowAll && (
        <Button variant="ghost" size="sm" onClick={onShowAll}>
          Show All
        </Button>
      )}
    </div>
  )
}

// Mobile dashboard container
interface MobileDashboardProps {
  workerName: string
  organizationName: string
  currentDate: string
  scheduleItems: MobileScheduleItemProps[]
  taskItems: MobileTaskItemProps[]
  isLoading?: boolean
  onRefresh?: () => void
  onScheduleItemPress?: (item: MobileScheduleItemProps) => void
  onTaskItemPress?: (item: MobileTaskItemProps) => void
}

export function MobileDashboard({
  workerName,
  organizationName,
  currentDate,
  scheduleItems,
  taskItems,
  isLoading = false,
  onRefresh,
  onScheduleItemPress,
  onTaskItemPress
}: MobileDashboardProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <MobileDashboardHeader
        workerName={workerName}
        organizationName={organizationName}
        currentDate={currentDate}
        onRefresh={onRefresh}
        isLoading={isLoading}
      />
      
      <MobileSectionHeader
        title="Schedule"
        count={scheduleItems.length}
      />
      
      {scheduleItems.length > 0 ? (
        scheduleItems.map((item, index) => (
          <MobileScheduleItem
            key={index}
            {...item}
            onPress={() => onScheduleItemPress?.(item)}
          />
        ))
      ) : (
        <Card variant="muted" className="mb-6">
          <CardContent className="p-4 text-center">
            <p className="text-gray-500">No schedule items for today</p>
          </CardContent>
        </Card>
      )}
      
      <MobileSectionHeader
        title="Tasks"
        count={taskItems.length}
        showAll={taskItems.length > 3}
        onShowAll={() => console.log('Show all tasks')}
      />
      
      {taskItems.length > 0 ? (
        taskItems.slice(0, 3).map((item, index) => (
          <MobileTaskItem
            key={index}
            {...item}
            onPress={() => onTaskItemPress?.(item)}
          />
        ))
      ) : (
        <Card variant="muted" className="mb-6">
          <CardContent className="p-4 text-center">
            <p className="text-gray-500">No tasks for today</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
