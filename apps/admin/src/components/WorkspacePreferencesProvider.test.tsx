import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authState = vi.hoisted(() => ({
  setWorkspacePreferences: vi.fn(),
  user: {
    email: 'admin@example.com',
    id: 'admin-1',
    name: 'Admin User',
  } as {
    email: string
    id: string
    name: string
    workspace_preferences?: Record<string, unknown>
  },
}))

const updateUser = vi.hoisted(() => vi.fn())
const isPreviewMode = vi.hoisted(() => vi.fn(() => false))

vi.mock('../store/auth', () => ({
  useAuthStore: (selector: (state: typeof authState) => unknown) => selector(authState),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser,
    },
  },
}))

vi.mock('../lib/preview', () => ({
  isPreviewMode,
}))

import {
  WorkspacePreferencesProvider,
  useWorkspacePreferences,
} from './WorkspacePreferencesProvider'

function Probe() {
  const { isOnboardingOpen, isOnboardingRequired, preferences, skipOnboarding, updatePreferences } =
    useWorkspacePreferences()

  return (
    <div>
      <div>required:{String(isOnboardingRequired)}</div>
      <div>open:{String(isOnboardingOpen)}</div>
      <div>accent:{preferences.theme.accent}</div>
      <button onClick={() => skipOnboarding()}>Skip</button>
      <button
        onClick={() =>
          updatePreferences({
            theme: {
              ...preferences.theme,
              accent: 'emerald',
            },
          })
        }
      >
        Accent
      </button>
    </div>
  )
}

describe('WorkspacePreferencesProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isPreviewMode.mockReturnValue(false)
    authState.user = {
      email: 'admin@example.com',
      id: 'admin-1',
      name: 'Admin User',
    }
    authState.setWorkspacePreferences.mockImplementation(
      (preferences?: Record<string, unknown>) => {
        authState.user = {
          ...authState.user,
          workspace_preferences: preferences,
        }
      }
    )

    updateUser.mockImplementation(
      async ({ data }: { data: { workspace_preferences: unknown } }) => ({
        data: {
          user: {
            user_metadata: {
              workspace_preferences: data.workspace_preferences,
            },
          },
        },
        error: null,
      })
    )
  })

  it('opens onboarding for admins without completed preferences and lets them skip it', async () => {
    render(
      <WorkspacePreferencesProvider>
        <Probe />
      </WorkspacePreferencesProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('required:true')).toBeInTheDocument()
      expect(screen.getByText('open:true')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))

    await waitFor(() => {
      expect(updateUser).toHaveBeenCalled()
      expect(authState.setWorkspacePreferences).toHaveBeenCalled()
      expect(screen.getByText('required:false')).toBeInTheDocument()
      expect(screen.getByText('open:false')).toBeInTheDocument()
    })
  })

  it('updates preferences immediately after saving', async () => {
    authState.user = {
      email: 'admin@example.com',
      id: 'admin-1',
      name: 'Admin User',
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
    }

    render(
      <WorkspacePreferencesProvider>
        <Probe />
      </WorkspacePreferencesProvider>
    )

    expect(screen.getByText('accent:blue')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Accent' }))

    await waitFor(() => {
      expect(screen.getByText('accent:emerald')).toBeInTheDocument()
      expect(authState.setWorkspacePreferences).toHaveBeenCalled()
    })
  })

  it('saves onboarding locally in preview mode without requiring a Supabase session', async () => {
    isPreviewMode.mockReturnValue(true)

    render(
      <WorkspacePreferencesProvider>
        <Probe />
      </WorkspacePreferencesProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('required:true')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))

    await waitFor(() => {
      expect(updateUser).not.toHaveBeenCalled()
      expect(authState.setWorkspacePreferences).toHaveBeenCalled()
      expect(screen.getByText('required:false')).toBeInTheDocument()
      expect(screen.getByText('open:false')).toBeInTheDocument()
    })
  })
})
