import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import ExpiredTokenPage from './pages/ExpiredTokenPage';
import InvalidTokenPage from './pages/InvalidTokenPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Routes>
      <Route path="/dashboard/:token" element={<DashboardPage />} />
      <Route path="/error/invalid-token" element={<InvalidTokenPage />} />
      <Route path="/error/expired-token" element={<ExpiredTokenPage />} />
      <Route path="/error/not-found" element={<NotFoundPage />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/error/not-found" replace />} />
    </Routes>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Dashboard Link</h1>
        <p className="text-gray-600">
          Please use the link sent to your phone to access your dashboard.
        </p>
      </div>
    </div>
  );
}

export default App;
