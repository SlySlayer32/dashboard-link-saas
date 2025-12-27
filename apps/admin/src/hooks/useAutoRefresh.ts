import { useEffect } from 'react'
import { useAuthStore } from '../store/auth'

export const useAutoRefresh = () => {
  const { isAuthenticated, expiresAt, refreshAuthToken } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || !expiresAt) return

    // Calculate time until token expires (refresh 5 minutes before expiry)
    const expiresAtDate = new Date(expiresAt)
    const refreshTime = expiresAtDate.getTime() - Date.now() - 5 * 60 * 1000

    if (refreshTime <= 0) {
      // Token expires in less than 5 minutes, refresh now
      refreshAuthToken().catch(() => {
        // Refresh failed, user will be logged out automatically
      })
      return
    }

    // Set up refresh timer
    const timer = setTimeout(() => {
      refreshAuthToken().catch(() => {
        // Refresh failed, user will be logged out automatically
      })
    }, refreshTime)

    return () => clearTimeout(timer)
  }, [isAuthenticated, expiresAt, refreshAuthToken])
}
