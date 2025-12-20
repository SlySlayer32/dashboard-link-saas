import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Link - Admin Portal
          </h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/workers" element={<WorkersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
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
        </div>
      </div>
    </div>
  );
}

function WorkersPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <h2 className="text-2xl font-semibold mb-4">Workers</h2>
      <p className="text-gray-600">Worker management interface coming soon...</p>
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
