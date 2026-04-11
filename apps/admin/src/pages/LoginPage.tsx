import { logger } from '@dashboard-link/shared'
import { AuthModal, ForgotPassword } from '@dashboard-link/ui'
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
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetPasswordError, setResetPasswordError] = useState<string>()
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false)

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

  const handleLogin = async (email: string, password: string) => {
    setIsSubmitting(true)
    clearError()

    try {
      const result = await login({ email, password })
      if (result.success) {
        setIsModalOpen(false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotPassword = async (email: string) => {
    setIsSubmitting(true)
    setResetPasswordError(undefined)
    setResetPasswordSuccess(false)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${globalThis.location.origin}/reset-password`,
      })

      if (error) {
        logger.error('Password reset request failed', undefined, {
          email,
          detail: error.message,
        })
        setResetPasswordError(error.message)
        toast.error(error.message)
        return
      }

      logger.info('Password reset email sent', { email })
      setResetPasswordSuccess(true)
      toast.success('Password reset email sent. Check your inbox.')
    } catch (err) {
      const caughtError =
        err instanceof Error ? err : new Error('Failed to send password reset email')
      logger.error('Password reset request error', caughtError, { email })
      setResetPasswordError(caughtError.message)
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
                <span className='text-sm text-gray-600'>
                  Secure admin login with email and password
                </span>
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

        <AuthModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          onLogin={handleLogin}
          onSignup={(data) =>
            handleSignup({
              organization: data.organizationName,
              email: data.adminEmail,
              password: data.adminPassword,
              confirmPassword: data.confirmPassword,
            })
          }
          onForgotPassword={() => {
            setResetPasswordError(undefined)
            setResetPasswordSuccess(false)
            setIsModalOpen(false)
            setIsForgotPasswordOpen(true)
          }}
          isLoading={isSubmitting}
          error={error || undefined}
        />

        <ForgotPassword
          isOpen={isForgotPasswordOpen}
          onClose={() => {
            setIsForgotPasswordOpen(false)
            setResetPasswordError(undefined)
            setResetPasswordSuccess(false)
            setIsModalOpen(true)
          }}
          onSubmit={handleForgotPassword}
          isLoading={isSubmitting}
          error={resetPasswordError}
          success={resetPasswordSuccess}
        />
      </div>
    </div>
  )
}
