import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { DevLoginButton } from './components/DevLoginButton'
import { Navigation } from './components/Navigation'
import { PageSkeleton } from './components/PageSkeleton'
import { ProtectedRoute } from './components/ProtectedRoute'
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

function App() {
  const { user } = useAuthStore()

  // Enable auto-refresh for authenticated users
  useAutoRefresh()

  return (
    <div className='min-h-screen bg-gray-50 flex'>
      <DevLoginButton />
      {!user ? (
        // Login page - full screen without navigation
        <div className='flex-1'>
          <Routes>
            <Route path='/login' element={<LoginPage />} />
            <Route path='*' element={<LoginPage />} />
          </Routes>
        </div>
      ) : (
        <>
          {/* Navigation sidebar */}
          <Navigation />

          {/* Main content */}
          <div className='flex-1 flex flex-col lg:pl-0'>
            {/* Mobile spacer */}
            <div className='lg:hidden h-14'></div>

            {/* Page content */}
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
      )}
    </div>
  )
}

export default App
