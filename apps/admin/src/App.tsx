import { Suspense, lazy, useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { DevLoginButton } from './components/DevLoginButton'
import { Navigation } from './components/Navigation'
import { OnboardingFlow } from './components/OnboardingFlow'
import { PageSkeleton } from './components/PageSkeleton'
import { ProtectedRoute } from './components/ProtectedRoute'
import {
  WorkspacePreferencesProvider,
  useWorkspacePreferences,
} from './components/WorkspacePreferencesProvider'
import { useAutoRefresh } from './hooks/useAutoRefresh'
import { LoginPage } from './pages/LoginPage'
import { useAuthStore } from './store/auth'
// Lazy load pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const WorkersPage = lazy(() => import('./pages/WorkersPage'))
const WorkerDetailPage = lazy(() => import('./pages/WorkerDetailPage'))
const TokensPage = lazy(() => import('./pages/TokensPage'))
const ManualDataPage = lazy(() => import('./pages/ManualDataPage'))
const SMSLogsPage = lazy(() => import('./pages/SMSLogsPage'))
const PluginsPage = lazy(() => import('./pages/PluginsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const AuthConfirmPage = lazy(() => import('./pages/AuthConfirmPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))

function AuthenticatedShell() {
  const { isOnboardingOpen } = useWorkspacePreferences()

  return (
    <>
      {isOnboardingOpen && <OnboardingFlow />}

      <Navigation />

      <div className='flex-1 flex flex-col lg:pl-0'>
        <div className='lg:hidden h-14'></div>

        <main className='flex-1 overflow-auto'>
          <Routes>
            <Route path='/login' element={<LoginPage />} />
            <Route
              path='/'
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageSkeleton />}>
                    <DashboardPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path='/workers'
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageSkeleton />}>
                    <WorkersPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path='/workers/:id'
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageSkeleton />}>
                    <WorkerDetailPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path='/tokens'
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageSkeleton />}>
                    <TokensPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path='/manual-data'
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageSkeleton />}>
                    <ManualDataPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path='/sms-logs'
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageSkeleton />}>
                    <SMSLogsPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path='/plugins'
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageSkeleton />}>
                    <PluginsPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path='/settings'
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageSkeleton />}>
                    <SettingsPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </>
  )
}

function App() {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const [isAuthReady, setIsAuthReady] = useState(false)
  const isPublicAuthRoute = ['/login', '/reset-password', '/auth/confirm'].includes(
    location.pathname
  )

  // Enable auto-refresh for authenticated users
  useAutoRefresh()

  useEffect(() => {
    let isMounted = true

    useAuthStore
      .getState()
      .checkAuth()
      .finally(() => {
        if (isMounted) {
          setIsAuthReady(true)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (!isAuthReady) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <Toaster position='top-right' />
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (!user || isPublicAuthRoute) {
    return (
      <div className='min-h-screen bg-gray-50 flex'>
        <Toaster position='top-right' />
        <DevLoginButton />
        <div className='flex-1'>
          <Routes>
            <Route path='/login' element={<LoginPage />} />
            <Route
              path='/reset-password'
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <ResetPasswordPage />
                </Suspense>
              }
            />
            <Route
              path='/auth/confirm'
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <AuthConfirmPage />
                </Suspense>
              }
            />
            <Route path='*' element={user ? <Navigate to='/' replace /> : <LoginPage />} />
          </Routes>
        </div>
      </div>
    )
  }

  return (
    <div className='cc-shell flex min-h-screen'>
      <Toaster position='top-right' />
      <DevLoginButton />
      <WorkspacePreferencesProvider>
        <AuthenticatedShell />
      </WorkspacePreferencesProvider>
    </div>
  )
}

export default App
