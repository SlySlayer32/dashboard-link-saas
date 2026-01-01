import { Card, CardContent } from '../Card'

// Mobile-optimized bottom navigation for worker dashboard
interface MobileBottomNavProps {
  activeTab: 'dashboard' | 'schedule' | 'tasks' | 'profile'
  onTabChange: (tab: 'dashboard' | 'schedule' | 'tasks' | 'profile') => void
  notificationCount?: number
}

export function MobileBottomNav({
  activeTab,
  onTabChange,
  notificationCount = 0
}: MobileBottomNavProps) {
  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: '🏠' },
    { id: 'schedule' as const, label: 'Schedule', icon: '📅' },
    { id: 'tasks' as const, label: 'Tasks', icon: '✅' },
    { id: 'profile' as const, label: 'Profile', icon: '👤' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="text-xl mb-1 relative">
              {tab.icon}
              {tab.id === 'tasks' && notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Mobile-optimized action sheet for task actions
interface MobileActionSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  actions: {
    label: string
    icon?: string
    variant?: 'default' | 'destructive'
    onPress: () => void
  }[]
}

export function MobileActionSheet({
  isOpen,
  onClose,
  title,
  actions
}: MobileActionSheetProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Action Sheet */}
      <div className="relative bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Title */}
        <div className="px-4 pb-2">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        {/* Actions */}
        <div className="px-4 pb-4">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onPress()
                onClose()
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                action.variant === 'destructive'
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-900 hover:bg-gray-50'
              }`}
            >
              {action.icon && <span className="text-xl">{action.icon}</span>}
              <span className="font-medium">{action.label}</span>
            </button>
          ))}
          
          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="w-full mt-2 p-3 rounded-lg text-center font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// Mobile-optimized pull-to-refresh indicator
interface MobilePullToRefreshProps {
  isRefreshing: boolean
  pullDistance: number
  maxPullDistance: number
}

export function MobilePullToRefresh({
  isRefreshing,
  pullDistance,
  maxPullDistance
}: MobilePullToRefreshProps) {
  const progress = Math.min(pullDistance / maxPullDistance, 1)
  const opacity = progress

  if (progress === 0 && !isRefreshing) return null

  return (
    <div 
      className="absolute top-0 left-0 right-0 flex justify-center items-center pt-4 transition-opacity"
      style={{ opacity }}
    >
      <div className="flex items-center gap-2 text-blue-600">
        {isRefreshing ? (
          <div className="animate-spin">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
        <span className="text-sm font-medium">
          {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
        </span>
      </div>
    </div>
  )
}

// Mobile-optimized floating action button
interface MobileFabProps {
  icon: string
  label: string
  onPress: () => void
  position?: 'bottom-right' | 'bottom-left'
}

export function MobileFab({
  icon,
  label,
  onPress,
  position = 'bottom-right'
}: MobileFabProps) {
  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4'
  }

  return (
    <button
      onClick={onPress}
      className={`fixed ${positionClasses[position]} z-40 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 active:scale-95 transition-transform`}
      aria-label={label}
    >
      <span className="text-xl">{icon}</span>
    </button>
  )
}

// Mobile-optimized status card for quick overview
interface MobileStatusCardProps {
  title: string
  value: string | number
  subtitle?: string
  variant?: 'default' | 'success' | 'warning' | 'error'
  onPress?: () => void
}

export function MobileStatusCard({
  title,
  value,
  subtitle,
  variant = 'default',
  onPress
}: MobileStatusCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900'
    }
  }

  return (
    <Card
      variant="default"
      className={`${getVariantClasses()} cursor-pointer active:scale-[0.98] transition-transform`}
      onClick={onPress}
    >
      <CardContent className="p-4">
        <div className="text-center">
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold my-1">{value}</p>
          {subtitle && (
            <p className="text-xs opacity-70">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
