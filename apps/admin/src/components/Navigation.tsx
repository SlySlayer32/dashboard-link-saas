import { Button } from '@dashboard-link/ui'
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon as MenuIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CogIcon,
  DocumentTextIcon,
  HomeIcon,
  KeyIcon,
  PuzzlePieceIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { getVisibleWorkspaceModules } from '../lib/workspace'
import { useAuthStore } from '../store/auth'
import { useWorkspacePreferences } from './WorkspacePreferencesProvider'

interface NavigationProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

const iconMap = {
  dashboard: HomeIcon,
  workers: UserGroupIcon,
  'manual-data': DocumentTextIcon,
  tokens: KeyIcon,
  'sms-logs': ChatBubbleLeftRightIcon,
  plugins: PuzzlePieceIcon,
}

export function Navigation({ isCollapsed: propIsCollapsed, onToggle }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { preferences } = useWorkspacePreferences()

  const navigation = [
    ...getVisibleWorkspaceModules(preferences).map((item) => ({
      name: item.label,
      href: item.route,
      icon: iconMap[item.id],
    })),
    { name: 'Settings', href: '/settings', icon: CogIcon },
  ]

  const currentIsCollapsed =
    propIsCollapsed !== undefined
      ? propIsCollapsed
      : (() => {
          const saved = localStorage.getItem('sidebar-collapsed')
          return saved ? JSON.parse(saved) : false
        })()

  const handleToggle = () => {
    const newState = !currentIsCollapsed
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
    onToggle?.()
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    setIsMobileMenuOpen(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMobileMenuOpen(false)
    }, 0)

    return () => clearTimeout(timer)
  }, [location.pathname])

  return (
    <>
      <div className='fixed top-0 left-0 right-0 z-40 border-b border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))] px-4 py-3 lg:hidden'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center'>
            <button
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className='rounded-md p-2 text-[hsl(var(--cc-text-muted))] hover:bg-[hsl(var(--cc-surface-muted))] hover:text-[hsl(var(--cc-text))]'
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className='h-6 w-6' />
              ) : (
                <MenuIcon className='h-6 w-6' />
              )}
            </button>
            <h1 className='ml-3 text-lg font-semibold text-[hsl(var(--cc-text))]'>
              Dashboard Link
            </h1>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleLogout}
            className='text-[hsl(var(--cc-text-muted))]'
          >
            <ArrowRightOnRectangleIcon className='h-5 w-5' />
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className='fixed inset-0 z-50 flex lg:hidden'>
          <div className='fixed inset-0 bg-black/25' onClick={() => setIsMobileMenuOpen(false)} />
          <div className='relative flex w-full max-w-xs flex-1 flex-col bg-[hsl(var(--cc-surface))]'>
            <div className='flex-1 overflow-y-auto pt-5 pb-4'>
              <div className='px-4'>
                <h1 className='text-xl font-bold text-[hsl(var(--cc-text))]'>Dashboard Link</h1>
              </div>
              <nav className='mt-8 space-y-1 px-2'>
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                        isActive ? 'cc-nav-item-active' : 'cc-nav-item'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={`mr-3 h-5 w-5 flex-shrink-0 ${
                            isActive
                              ? 'text-[hsl(var(--cc-primary))]'
                              : 'text-[hsl(var(--cc-text-muted))]'
                          }`}
                        />
                        {item.name}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className='border-t border-[hsl(var(--cc-border))] p-4'>
              <p className='text-sm font-medium text-[hsl(var(--cc-text))]'>{user?.email}</p>
              <p className='mt-1 text-xs font-medium text-[hsl(var(--cc-text-muted))]'>
                {user?.organization_id || 'Demo Organization'}
              </p>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleLogout}
                className='mt-3 w-full justify-start text-[hsl(var(--cc-text-muted))]'
              >
                <ArrowRightOnRectangleIcon className='mr-2 h-5 w-5' />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className='hidden lg:flex lg:flex-shrink-0'>
        <div className='flex w-64 flex-col'>
          <div className='flex flex-grow flex-col overflow-y-auto border-r border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))] pt-5 pb-4'>
            <div className='flex flex-shrink-0 items-center justify-between px-4'>
              <h1
                className={`text-xl font-bold text-[hsl(var(--cc-text))] transition-all duration-200 ${
                  currentIsCollapsed ? 'hidden' : 'block'
                }`}
              >
                Dashboard Link
              </h1>
              <button
                onClick={handleToggle}
                className='rounded-lg p-1.5 transition-colors hover:bg-[hsl(var(--cc-surface-muted))]'
              >
                {currentIsCollapsed ? (
                  <ChevronRightIcon className='h-5 w-5 text-[hsl(var(--cc-text-muted))]' />
                ) : (
                  <ChevronLeftIcon className='h-5 w-5 text-[hsl(var(--cc-text-muted))]' />
                )}
              </button>
            </div>
            <nav className='mt-8 flex-1 space-y-1 px-2'>
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'cc-nav-item-active' : 'cc-nav-item'
                    }`
                  }
                  title={currentIsCollapsed ? item.name : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={`h-5 w-5 flex-shrink-0 ${
                          isActive
                            ? 'text-[hsl(var(--cc-primary))]'
                            : 'text-[hsl(var(--cc-text-muted))]'
                        }`}
                      />
                      {!currentIsCollapsed && <span className='ml-3'>{item.name}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className='border-t border-[hsl(var(--cc-border))] p-4'>
              <div className='flex items-center'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--cc-primary))]'>
                  <span className='text-sm font-medium text-white'>
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                {!currentIsCollapsed && (
                  <div className='ml-3'>
                    <p className='truncate text-sm font-medium text-[hsl(var(--cc-text))]'>
                      {user?.email}
                    </p>
                    <p className='text-xs font-medium text-[hsl(var(--cc-text-muted))]'>
                      {user?.organization_id || 'Demo Organization'}
                    </p>
                  </div>
                )}
              </div>
              {!currentIsCollapsed && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleLogout}
                  className='mt-3 w-full justify-start text-[hsl(var(--cc-text-muted))]'
                >
                  <ArrowRightOnRectangleIcon className='mr-2 h-5 w-5' />
                  Sign out
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
