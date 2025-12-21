import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navigation } from './components/Navigation';
import { LoginPage } from './pages/LoginPage';
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
                    <HomePage />
                  </ProtectedRoute>
                } />
                <Route path="/workers" element={
                  <ProtectedRoute>
                    <WorkersPage />
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

function HomePage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-12">
        <h2 className="text-2xl font-semibold mb-4">Welcome to Dashboard Link</h2>
        <p className="text-gray-600 mb-4">
          Manage your workers and their daily dashboards from here.
        </p>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">✅ Admin portal scaffolding complete</p>
          <p className="text-sm text-gray-500">✅ Vite + React 18 configured</p>
          <p className="text-sm text-gray-500">✅ Tailwind CSS configured</p>
          <p className="text-sm text-gray-500">✅ TanStack Query ready</p>
          <p className="text-sm text-gray-500">✅ React Router configured</p>
          <p className="text-sm text-gray-500">✅ Navigation sidebar implemented</p>
          <p className="text-sm text-gray-500">✅ Worker management complete</p>
        </div>
      </div>
    </div>
  );
}

function PluginsPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <h2 className="text-2xl font-semibold mb-4">Plugins</h2>
      <p className="text-gray-600">Plugin configuration and management coming soon...</p>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <h2 className="text-2xl font-semibold mb-4">Settings</h2>
      <p className="text-gray-600">Organization settings coming soon...</p>
    </div>
  );
}

export default App;
