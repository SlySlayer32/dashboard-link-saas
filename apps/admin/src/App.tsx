import { Route, Routes } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ManualDataPage } from './pages/ManualDataPage';
import { PluginsPage } from './pages/PluginsPage';
import { SMSLogsPage } from './pages/SMSLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { WorkerDetailPage } from './pages/WorkerDetailPage';
import { WorkersPage } from './pages/WorkersPage';
import { useAuthStore } from './store/auth';

function App() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {!user ? (
        // Login page - full screen without navigation
        <div className="flex-1">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<LoginPage />} />
          </Routes>
        </div>
      ) : (
        <>
          {/* Navigation sidebar */}
          <Navigation />
          
          {/* Main content */}
          <div className="flex-1 flex flex-col lg:pl-0">
            {/* Mobile spacer */}
            <div className="lg:hidden h-14"></div>
            
            {/* Page content */}
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/workers" element={
                  <ProtectedRoute>
                    <WorkersPage />
                  </ProtectedRoute>
                } />
                <Route path="/workers/:id" element={
                  <ProtectedRoute>
                    <WorkerDetailPage />
                  </ProtectedRoute>
                } />
                <Route path="/tokens" element={
                  <ProtectedRoute>
                    <TokensPage />
                  </ProtectedRoute>
                } />
                <Route path="/manual-data" element={
                  <ProtectedRoute>
                    <ManualDataPage />
                  </ProtectedRoute>
                } />
                <Route path="/sms-logs" element={
                  <ProtectedRoute>
                    <SMSLogsPage />
                  </ProtectedRoute>
                } />
                <Route path="/plugins" element={
                  <ProtectedRoute>
                    <PluginsPage />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
