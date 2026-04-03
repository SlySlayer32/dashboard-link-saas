import { logger } from '@dashboard-link/shared'
import { MagicLinkAuth } from '@dashboard-link/ui'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  useAuthActions,
  useAuthError,
  useAuthIsAuthenticated,
  useAuthIsLoading,
  useAuthStore,
} from '../store/auth'

export function LoginPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login, clearError } = useAuthActions()
  const isAuthenticated = useAuthIsAuthenticated()
  const isLoading = useAuthIsLoading()
  const error = useAuthError()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      const intendedDestination = sessionStorage.getItem('intendedDestination') || '/'
      sessionStorage.removeItem('intendedDestination')
      navigate(intendedDestination, { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      setIsModalOpen(true)
    }
  }, [isAuthenticated, isLoading])

  const handleLogin = async (data: { email: string; password: string }) => {
    setIsSubmitting(true)
    clearError()

    try {
      await login({ email: data.email, password: data.password })
      setIsModalOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMagicLink = async (data: { email: string }) => {
    setIsSubmitting(true)
    clearError()

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${globalThis.location.origin}/`,
        },
      })

      if (error) {
        logger.error('Magic link request failed', undefined, {
          email: data.email,
          detail: error.message,
        })
        toast.error(error.message)
        return
      }

      logger.info('Magic link sent', { email: data.email })
      toast.success('Magic link sent! Check your email inbox.')
    } catch (err) {
      const caughtError = err instanceof Error ? err : new Error('Failed to send magic link')
      logger.error('Magic link request error', caughtError, { email: data.email })
      toast.error(caughtError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignup = async (data: {
    organization: string
    email: string
    password: string
    confirmPassword: string
  }) => {
    setIsSubmitting(true)
    clearError()

    try {
      const authStore = useAuthStore.getState()
      const result = await authStore.register({
        email: data.email,
        password: data.password,
        name: data.email.split('@')[0],
        organizationName: data.organization,
      })

      if (result.success) {
        setIsModalOpen(false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDevBypass = () => {
    const mockUser = {
      id: 'dev-user-123',
      email: 'dev@example.com',
      name: 'Development User',
      role: 'admin' as const,
      organization_id: 'dev-org-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const authStore = useAuthStore.getState()
    authStore.setLoading(false)
    authStore.clearError()
    authStore.user = mockUser
    authStore.token = 'dev-token-123'
    authStore.refreshToken = 'dev-refresh-token-123'
    authStore.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    authStore.isAuthenticated = true

    navigate('/', { replace: true })
  }

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to='/' replace />
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-50'></div>

      <div className='relative min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8'>
        <div className='sm:mx-auto sm:w-full sm:max-w-md'>
          <div className='text-center mb-8'>
            <div className='w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4'>
              <svg
                className='w-10 h-10 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 10V3L4 14h7v7l9-11h-7z'
                />
              </svg>
            </div>
            <h1 className='text-3xl font-bold text-gray-900'>Dashboard Link</h1>
            <p className='mt-2 text-sm text-gray-600'>Daily dashboard delivery for field teams</p>
          </div>
        </div>

        <div className='sm:mx-auto sm:w-full sm:max-w-md mb-8'>
          <div className='bg-white rounded-lg shadow-sm p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>Admin Portal Access</h2>
            <div className='space-y-3'>
              <div className='flex items-center'>
                <div className='w-2 h-2 bg-green-500 rounded-full mr-3'></div>
                <span className='text-sm text-gray-600'>Passwordless admin login with magic links</span>
              </div>
              <div className='flex items-center'>
                <div className='w-2 h-2 bg-green-500 rounded-full mr-3'></div>
                <span className='text-sm text-gray-600'>
                  Secure worker access through SMS dashboard links
                </span>
              </div>
              <div className='flex items-center'>
                <div className='w-2 h-2 bg-green-500 rounded-full mr-3'></div>
                <span className='text-sm text-gray-600'>
                  Dashboard open tracking for delivery confirmation
                </span>
              </div>
            </div>
          </div>
        </div>

        <MagicLinkAuth
          isOpen={isModalOpen}
          onClose={() => navigate('/')}
          onLogin={handleLogin}
          onMagicLink={handleMagicLink}
          onSignup={handleSignup}
          isLoading={isSubmitting}
          error={error || undefined}
        />

        {import.meta.env.DEV && (
          <div className='fixed bottom-4 right-4'>
            <button
              onClick={handleDevBypass}
              className='px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors'
            >
              Dev Bypass
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
