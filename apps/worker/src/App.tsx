import { Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <Routes>
      <Route path="/dashboard/:token" element={<DashboardPage />} />
      <Route path="/" element={<LandingPage />} />
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
