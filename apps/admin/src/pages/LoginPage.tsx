import { MagicLinkAuth } from '@dashboard-link/ui';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth, useAuthError, useAuthIsAuthenticated, useAuthIsLoading, useAuthStore } from '../store/auth';

export function LoginPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, clearError } = useAuth();
  const isAuthenticated = useAuthIsAuthenticated();
  const isLoading = useAuthIsLoading();
  const error = useAuthError();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const intendedDestination = sessionStorage.getItem('intendedDestination') || '/';
      sessionStorage.removeItem('intendedDestination');
      navigate(intendedDestination, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Auto-open modal on page load
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      setIsModalOpen(true);
    }
  }, [isAuthenticated, isLoading]);

  const handleLogin = async (data: { email: string; password: string }) => {
    setIsSubmitting(true);
    clearError();
    
    try {
      await login({ email: data.email, password: data.password });
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicLink = async (data: { email: string }) => {
    setIsSubmitting(true);
    clearError();
    
    try {
      // TODO: Implement magic link API call
      console.log('Magic link requested for:', data.email);
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (data: { organization: string; email: string; password: string; confirmPassword: string }) => {
    setIsSubmitting(true);
    clearError();
    
    try {
      // TODO: Implement signup API call
      console.log('Signup requested for:', data);
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDevBypass = () => {
    // Set mock user for development
    const mockUser = {
      id: 'dev-user-123',
      email: 'dev@example.com',
      name: 'Development User',
      role: 'admin' as const,
      organization_id: 'dev-org-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Directly set auth state for development
    const authStore = useAuthStore.getState();
    authStore.setLoading(false);
    authStore.clearError();
    authStore.user = mockUser;
    authStore.token = 'dev-token-123';
    authStore.refreshToken = 'dev-refresh-token-123';
    authStore.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now
    authStore.isAuthenticated = true;
    
    // Navigate to dashboard
    navigate('/', { replace: true });
  };

  // Show loading while checking initial auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-50"></div>
      
      {/* Main content */}
      <div className="relative min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Link</h1>
            <p className="mt-2 text-sm text-gray-600">Enterprise workflow automation platform</p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Portal Access</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Passwordless login with magic links</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Secure token-based worker access</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Enterprise-grade security</span>
              </div>
            </div>
          </div>
        </div>

        {/* Magic Link Auth Modal */}
        <MagicLinkAuth
          isOpen={isModalOpen}
          onClose={() => navigate('/')}
          onLogin={handleLogin}
          onMagicLink={handleMagicLink}
          onSignup={handleSignup}
          isLoading={isSubmitting}
          error={error || undefined}
        />

        {/* Development bypass */}
        {import.meta.env.DEV && (
          <div className="fixed bottom-4 right-4">
            <button
              onClick={handleDevBypass}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              🚀 Dev Bypass
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
