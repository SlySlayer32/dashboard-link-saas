# Authentication System Setup Guide

## Overview
The auth system uses Supabase for authentication with a custom API layer. The system includes:
- JWT-based authentication with refresh tokens
- Automatic token refresh
- Persistent sessions using localStorage
- Protected routes with loading states

## Environment Variables

### Admin App (.env)
```env
VITE_API_URL=http://localhost:3000  # Your API server URL
```

### API App (.env)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Auth Flow

### 1. Login
1. User submits email/password to `/auth/login`
2. API validates with Supabase and returns:
   ```json
   {
     "user": { ... },
     "token": "access_token",
     "refresh_token": "refresh_token",
     "expires_at": "2024-01-01T00:00:00Z"
   }
   ```
3. Store saves to localStorage and sets `isAuthenticated: true`

### 2. Token Refresh
- Automatic refresh 5 minutes before expiry
- Manual refresh via `refreshToken()` method
- Failed refresh triggers automatic logout

### 3. Protected Routes
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
- Check Supabase credentials in API .env
- Verify CORS settings in Supabase
- Check network requests in browser dev tools

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
