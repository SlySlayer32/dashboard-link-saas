import { logger } from '@dashboard-link/shared'
import { type EmailOtpType } from '@supabase/supabase-js'
import { ResetPassword } from '@dashboard-link/ui'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type ResetState = {
  error?: string
  isReady: boolean
  isSubmitting: boolean
  isValidRecovery: boolean
}

function clearRecoveryParams() {
  globalThis.history.replaceState({}, document.title, globalThis.location.pathname)
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [state, setState] = useState<ResetState>({
    isReady: false,
    isSubmitting: false,
    isValidRecovery: false,
  })

  useEffect(() => {
    let isMounted = true

    const initializeRecovery = async () => {
      try {
        const searchParams = new URLSearchParams(globalThis.location.search)
        const tokenHash = searchParams.get('token_hash')
        const type = searchParams.get('type')

        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType,
          })

          if (error) {
            throw error
          }

          clearRecoveryParams()
        } else {
          const hashParams = new URLSearchParams(globalThis.location.hash.replace(/^#/, ''))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (error) {
              throw error
            }

            clearRecoveryParams()
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!isMounted) {
          return
        }

        setState({
          isReady: true,
          isSubmitting: false,
          isValidRecovery: Boolean(session),
        })
      } catch (error) {
        logger.error('Password recovery initialization failed', error as Error)

        if (!isMounted) {
          return
        }

        setState({
          error: error instanceof Error ? error.message : 'Unable to validate reset link',
          isReady: true,
          isSubmitting: false,
          isValidRecovery: false,
        })
      }
    }

    void initializeRecovery()

    return () => {
      isMounted = false
    }
  }, [])

  const handleClose = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const handleSubmit = async (_token: string, password: string) => {
    setState((current) => ({ ...current, error: undefined, isSubmitting: true }))

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      logger.error('Password reset failed', undefined, { detail: error.message })
      setState((current) => ({
        ...current,
        error: error.message,
        isSubmitting: false,
      }))
      throw error
    }

    toast.success('Password updated. Sign in with your new password.')
    setState((current) => ({ ...current, isSubmitting: false }))
  }

  if (!state.isReady) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
      </div>
    )
  }

  return (
    <ResetPassword
      token='recovery-session'
      isOpen={true}
      onClose={() => {
        void handleClose()
      }}
      onSubmit={handleSubmit}
      isLoading={state.isSubmitting}
      error={state.error}
      isValidToken={state.isValidRecovery}
    />
  )
}
