import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthIsAuthenticated, useAuthIsLoading } from '../store/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthIsAuthenticated();
  const isLoading = useAuthIsLoading();
  const location = useLocation();

  // Store the intended location for redirect after login
  if (!isAuthenticated && !isLoading) {
    sessionStorage.setItem('intendedDestination', location.pathname);
  }

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
