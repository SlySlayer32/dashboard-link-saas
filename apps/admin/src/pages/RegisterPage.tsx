import { logger } from '@dashboard-link/shared'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth, useAuthError, useAuthIsAuthenticated, useAuthIsLoading } from '../store/auth'

export function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    fullName: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const { register, clearError } = useAuth()
  const isAuthenticated = useAuthIsAuthenticated()
  const isLoading = useAuthIsLoading()
  const error = useAuthError()
  const navigate = useNavigate()

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to='/' replace />
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.email) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.organizationName) {
      errors.organizationName = 'Organization name is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    clearError()

    try {
      await register({
        email: formData.email,
        password: formData.password,
        organizationName: formData.organizationName,
        fullName: formData.fullName || undefined,
      })

      // On success, navigate to dashboard
      navigate('/', { replace: true })
    } catch (err) {
      // Error will be set in auth store
      logger.error('Registration failed', err instanceof Error ? err : new Error(String(err)))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Background pattern */}
      <div className='absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-50'></div>

      {/* Main content */}
      <div className='relative min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8'>
        <div className='sm:mx-auto sm:w-full sm:max-w-md'>
          {/* Logo/Brand */}
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
            <p className='mt-2 text-sm text-gray-600'>Create your organization account</p>
          </div>
        </div>

        {/* Registration Form */}
        <div className='sm:mx-auto sm:w-full sm:max-w-md'>
          <div className='bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10'>
            <div className='space-y-6'>
              {/* Organization Name */}
              <div>
                <label
                  htmlFor='organizationName'
                  className='block text-sm font-medium text-gray-700'
                >
                  Organization Name <span className='text-red-500'>*</span>
                </label>
                <div className='mt-1'>
                  <input
                    id='organizationName'
                    name='organizationName'
                    type='text'
                    required
                    value={formData.organizationName}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      validationErrors.organizationName ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder='Acme Cleaning Co'
                  />
                  {validationErrors.organizationName && (
                    <p className='mt-1 text-sm text-red-600'>{validationErrors.organizationName}</p>
                  )}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor='fullName' className='block text-sm font-medium text-gray-700'>
                  Full Name
                </label>
                <div className='mt-1'>
                  <input
                    id='fullName'
                    name='fullName'
                    type='text'
                    value={formData.fullName}
                    onChange={handleChange}
                    className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                    placeholder='John Smith'
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
                  Email Address <span className='text-red-500'>*</span>
                </label>
                <div className='mt-1'>
                  <input
                    id='email'
                    name='email'
                    type='email'
                    autoComplete='email'
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      validationErrors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder='admin@acme.com'
                  />
                  {validationErrors.email && (
                    <p className='mt-1 text-sm text-red-600'>{validationErrors.email}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
                  Password <span className='text-red-500'>*</span>
                </label>
                <div className='mt-1'>
                  <input
                    id='password'
                    name='password'
                    type='password'
                    autoComplete='new-password'
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      validationErrors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder='••••••••'
                  />
                  {validationErrors.password && (
                    <p className='mt-1 text-sm text-red-600'>{validationErrors.password}</p>
                  )}
                  <p className='mt-1 text-xs text-gray-500'>Minimum 8 characters</p>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor='confirmPassword'
                  className='block text-sm font-medium text-gray-700'
                >
                  Confirm Password <span className='text-red-500'>*</span>
                </label>
                <div className='mt-1'>
                  <input
                    id='confirmPassword'
                    name='confirmPassword'
                    type='password'
                    autoComplete='new-password'
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder='••••••••'
                  />
                  {validationErrors.confirmPassword && (
                    <p className='mt-1 text-sm text-red-600'>{validationErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className='rounded-md bg-red-50 p-4'>
                  <div className='flex'>
                    <div className='flex-shrink-0'>
                      <svg className='h-5 w-5 text-red-400' viewBox='0 0 20 20' fill='currentColor'>
                        <path
                          fillRule='evenodd'
                          d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                    <div className='ml-3'>
                      <p className='text-sm text-red-800'>{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type='button'
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        ></circle>
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        ></path>
                      </svg>
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>

              {/* Login Link */}
              <div className='text-center'>
                <p className='text-sm text-gray-600'>
                  Already have an account?{' '}
                  <Link to='/login' className='font-medium text-blue-600 hover:text-blue-500'>
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
