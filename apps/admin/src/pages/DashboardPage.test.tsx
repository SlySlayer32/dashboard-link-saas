import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authState = vi.hoisted(() => ({
  setWorkspacePreferences: vi.fn(),
  user: {
    email: 'admin@example.com',
    id: 'admin-1',
    name: 'Admin User',
    workspace_preferences: {
      completedAt: '2026-04-12T10:00:00.000Z',
      dashboardSections: ['recent-activity', 'workflow-guide'],
      defaultRoute: '/',
      density: 'comfortable',
      theme: {
        accent: 'blue',
        mode: 'light',
      },
      version: 1,
      visibleNavItems: ['dashboard', 'workers'],
    },
  },
}))

const openOnboarding = vi.hoisted(() => vi.fn())

vi.mock('../store/auth', () => ({
  useAuthStore: (selector?: (state: typeof authState) => unknown) =>
    selector ? selector(authState) : authState,
}))

vi.mock('../components/WorkspacePreferencesProvider', async () => {
  const actual = await vi.importActual<typeof import('../components/WorkspacePreferencesProvider')>(
    '../components/WorkspacePreferencesProvider'
  )

  return {
    ...actual,
    useWorkspacePreferences: () => ({
      preferences: authState.user.workspace_preferences,
      openOnboarding,
    }),
  }
})

vi.mock('../hooks/useDashboard', () => ({
  useDashboard: () => ({
    data: {
      recentActivity: [],
      stats: {
        totalWorkers: 10,
        activeWorkers: 8,
        inactiveWorkers: 2,
        smsToday: 4,
        smsThisWeek: 12,
        dashboardOpensToday: 3,
        uniqueWorkersOpenedToday: 2,
        deliveryRateToday: 75,
        smsDeliveredToday: 3,
        smsFailedToday: 1,
        nonOpenersToday: [],
      },
    },
    error: null,
    isLoading: false,
  }),
}))

vi.mock('../hooks/useOrganization', () => ({
  useOrganization: () => ({
    data: {
      default_token_expiry_hours: 6,
    },
  }),
}))

vi.mock('../hooks/useSMS', () => ({
  useSendDashboardLink: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

import DashboardPage from './DashboardPage'

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders only the selected dashboard sections', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    expect(screen.queryByText('Shortcuts')).not.toBeInTheDocument()
    expect(screen.queryByText('Delivery Rate Today')).not.toBeInTheDocument()
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    expect(screen.getByText('Operational Rhythm')).toBeInTheDocument()
  })
})
