import React from 'react'
import { useAuthIsAuthenticated, useDevLogin } from '../store/auth'

export const DevLoginButton: React.FC = () => {
  const isAuthenticated = useAuthIsAuthenticated()
  const devLogin = useDevLogin()

  // Only show in development mode
  if (import.meta.env.MODE !== 'development') {
    return null
  }

  if (isAuthenticated) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-3 py-1 rounded-md text-sm">
        Dev Mode: Authenticated
      </div>
    )
  }

  return (
    <button
      onClick={devLogin}
      className="fixed top-4 right-4 z-50 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
    >
      Dev Login
    </button>
  )
}
