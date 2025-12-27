import { useAuthStore } from '../store/auth'

// Create an axios-like fetch wrapper that handles token refresh
export class AuthInterceptor {
  private static instance: AuthInterceptor

  static getInstance() {
    if (!AuthInterceptor.instance) {
      AuthInterceptor.instance = new AuthInterceptor()
    }
    return AuthInterceptor.instance
  }

  async fetch(url: string, options: Record<string, unknown> = {}): Promise<Response> {
    const authStore = useAuthStore.getState()
    let token = authStore.token

    // Add auth header if token exists
    if (token) {
      const existingHeaders = (options.headers as Record<string, string>) || {}
      options.headers = {
        ...existingHeaders,
        Authorization: `Bearer ${token}`,
      }
    }

    // Make the initial request
    let response = await fetch(url, options)

    // If 401, try to refresh token
    if (response.status === 401 && authStore.refreshToken) {
      try {
        await authStore.refreshAuthToken()
        token = authStore.token

        // Retry with new token
        if (token) {
          const existingHeaders = (options.headers as Record<string, string>) || {}
          options.headers = {
            ...existingHeaders,
            Authorization: `Bearer ${token}`,
          }
        }
        response = await fetch(url, options)
      } catch {
        // Refresh failed, logout and redirect to login
        authStore.logout()
        window.location.href = '/login'
      }
    }

    return response
  }
}

// Export a singleton instance
export const authFetch = AuthInterceptor.getInstance().fetch.bind(AuthInterceptor.getInstance())
