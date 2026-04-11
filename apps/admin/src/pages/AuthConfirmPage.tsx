import { type EmailOtpType } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function sanitizeNextPath(next: string | null): string {
  if (!next) {
    return '/reset-password'
  }

  if (next.startsWith('/')) {
    return next
  }

  try {
    const url = new URL(next)
    if (url.origin === globalThis.location.origin) {
      return `${url.pathname}${url.search}${url.hash}`
    }
  } catch {
    // Ignore invalid redirect targets and fall back to a safe local route.
  }

  return '/reset-password'
}

export default function AuthConfirmPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const confirmRecovery = async () => {
      const params = new URLSearchParams(globalThis.location.search)
      const tokenHash = params.get('token_hash')
      const type = params.get('type') as EmailOtpType | null
      const next = sanitizeNextPath(params.get('next'))

      if (!tokenHash || !type) {
        if (isMounted) {
          setError('This password reset link is invalid or incomplete.')
        }
        return
      }

      const { error: verificationError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      })

      if (verificationError) {
        if (isMounted) {
          setError(verificationError.message)
        }
        return
      }

      navigate(next, { replace: true })
    }

    void confirmRecovery()

    return () => {
      isMounted = false
    }
  }, [navigate])

  if (!error) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <h1 className='text-xl font-semibold text-gray-900'>Verifying reset link</h1>
          <p className='mt-2 text-sm text-gray-600'>
            We&apos;re confirming your password reset request.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
      <div className='w-full max-w-md rounded-lg bg-white p-6 shadow-sm'>
        <h1 className='text-xl font-semibold text-gray-900'>Reset link unavailable</h1>
        <p className='mt-2 text-sm text-gray-600'>{error}</p>
        <Link
          to='/login'
          className='mt-6 inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white'
        >
          Return to login
        </Link>
      </div>
    </div>
  )
}
