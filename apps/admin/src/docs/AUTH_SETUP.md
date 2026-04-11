# Authentication System Setup Guide

## Overview
The auth system uses Supabase Auth for email and password authentication. The system includes:
- JWT-based authentication with refresh tokens
- Automatic token refresh
- Persistent sessions using localStorage
- Password reset via Supabase recovery emails
- Protected routes with loading states

## Environment Variables

### Admin App (.env)
```env
VITE_API_URL=http://localhost:3001  # Your API server URL
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### API App (.env)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## Auth Flow

### 1. Login
1. User submits email/password in the admin app
2. The app authenticates directly with Supabase using `supabase.auth.signInWithPassword()`
3. Supabase returns:
   ```json
   {
     "user": { ... },
     "token": "access_token",
     "refresh_token": "refresh_token",
     "expires_at": "2024-01-01T00:00:00Z"
   }
   ```
4. The auth store saves the session to localStorage and sets `isAuthenticated: true`

### 2. Token Refresh
- Automatic refresh 5 minutes before expiry
- Manual refresh via `refreshToken()` method
- Failed refresh triggers automatic logout

### 3. Password Reset
- The login modal sends reset emails with `supabase.auth.resetPasswordForEmail()`
- Recovery links return the user to `/reset-password`
- The app verifies the recovery session and completes the password update with `supabase.auth.updateUser()`

### 4. Protected Routes
- Checks `isAuthenticated` state
- Shows loading spinner during auth check
- Redirects to `/login` if not authenticated

## Usage Examples

### Using the Auth Store
```typescript
import { useAuthStore } from '../store/auth'

function MyComponent() {
  const { user, login, logout, isLoading } = useAuthStore()

  const handleLogin = async () => {
    try {
      await login({ email: 'user@example.com', password: 'password' })
      // Success!
    } catch (error) {
      // Handle error
    }
  }

  return (
    <div>
      {isLoading ? 'Loading...' : user ? `Welcome ${user.email}` : 'Not logged in'}
    </div>
  )
}
```

### Making Authenticated API Calls
```typescript
import { apiClient } from '../services/api'

// Automatic token handling
const response = await apiClient.get('/protected-route')
const data = await response.json()

// POST request
const createResponse = await apiClient.post('/items', { name: 'New Item' })
```

## Security Features

1. **Token Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
2. **Auto-Refresh**: Tokens refresh before expiry
3. **Logout on Refresh Failure**: Failed refresh automatically logs out user
4. **Protected Routes**: Server-side validation required for sensitive operations

## Database Schema

The auth system expects these tables in Supabase:
- `auth.users` (Supabase managed)
- `organizations` - Company/organization data
- `admins` - Admin profiles linked to auth users

## Troubleshooting

### Login Fails
- Check Supabase credentials in the admin app environment
- Verify CORS settings in Supabase
- Check network requests in browser dev tools

### Password Reset Link Fails
- Verify `supabase/config.toml` uses the admin app URL (`http://localhost:5173`) for `site_url`
- Confirm `/reset-password` is included in `additional_redirect_urls`
- Check the browser URL for expired or incomplete recovery parameters

### Token Not Saving
- Check browser localStorage for 'auth-storage'
- Verify persist middleware in auth store
- Check for private browsing mode

### Protected Routes Always Redirecting
- Verify `isAuthenticated` is true after login
- Check token expiry in localStorage
- Ensure `useAutoRefresh` hook is active

## Production Considerations

1. **Security**:
   - Use httpOnly cookies for token storage
   - Implement CSRF protection
   - Add rate limiting to auth endpoints

2. **Performance**:
   - Consider server-side session validation
   - Implement token blacklisting for logout
   - Add caching for user permissions

3. **Monitoring**:
   - Log failed login attempts
   - Monitor token refresh patterns
   - Track authentication errors
