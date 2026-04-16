import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authState = vi.hoisted(() => ({
  logout: vi.fn(),
  setWorkspacePreferences: vi.fn(),
  user: {
    email: 'admin@example.com',
    id: 'admin-1',
    name: 'Admin User',
    organization_id: 'org-1',
    workspace_preferences: {
      completedAt: '2026-04-12T10:00:00.000Z',
      dashboardSections: ['quick-actions', 'statistics'],
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

vi.mock('../store/auth', () => ({
  useAuthStore: (selector?: (state: typeof authState) => unknown) =>
    selector ? selector(authState) : authState,
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn(),
    },
  },
}))

import { Navigation } from './Navigation'
import { WorkspacePreferencesProvider } from './WorkspacePreferencesProvider'

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows only selected modules and always keeps settings visible', () => {
    render(
      <MemoryRouter>
        <WorkspacePreferencesProvider>
          <Navigation />
        </WorkspacePreferencesProvider>
      </MemoryRouter>
    )

    expect(screen.queryByText('Manual Data')).not.toBeInTheDocument()
    expect(screen.queryByText('SMS Logs')).not.toBeInTheDocument()
    expect(screen.queryByText('Plugins')).not.toBeInTheDocument()
    expect(screen.getAllByText('Settings').length).toBeGreaterThan(0)
  })
})
