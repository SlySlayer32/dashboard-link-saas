import { createAuthService } from '@dashboard-link/auth';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

// Initialize auth service
const authService = createAuthService('supabase', {
  providerConfig: {
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_SERVICE_KEY || ''
  },
  jwtSecret: process.env.JWT_SECRET || 'default-secret',
  tokenExpiry: 3600,
  refreshTokenExpiry: 2592000,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90
  },
  sessionConfig: {
    maxSessions: 5,
    idleTimeout: 30,
    absoluteTimeout: 480,
    secureCookies: true,
    sameSite: 'strict'
  }
});

const auth = new Hono();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  organizationName: z.string().min(1, 'Organization name is required')
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

/**
 * POST /auth/login
 * Authenticate user and return tokens
 */
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json');

    const result = await authService.login({ email, password });

    if (!result.success || !result.user || !result.tokens) {
      return c.json({
        success: false,
        error: result.error || 'Login failed'
      }, 401);
    }

    logger.info('User logged in', {
      userId: result.user.id,
      organizationId: result.user.organizationId
    });

    return c.json({
      success: true,
      user: result.user,
      token: result.tokens.accessToken,
      refresh_token: result.tokens.refreshToken,
      expires_at: result.tokens.expiresAt
    });
  } catch (error) {
    logger.error('Login error', error as Error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

/**
 * POST /auth/register
 * Register new user and organization
 */
auth.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const { email, password, name, organizationName } = c.req.valid('json');

    const result = await authService.register({
      email,
      password,
      name,
      organizationName
    });

    if (!result.success || !result.user) {
      return c.json({
        success: false,
        error: result.error || 'Registration failed'
      }, 400);
    }

    logger.info('User registered', {
      userId: result.user.id,
      organizationId: result.user.organizationId
    });

    return c.json({
      success: true,
      user: result.user,
      message: 'Registration successful'
    });
  } catch (error) {
    logger.error('Registration error', error as Error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

/**
 * POST /auth/logout
 * Logout user and invalidate tokens
 */
auth.post('/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        error: 'Missing authorization header'
      }, 401);
    }

    const token = authHeader.substring(7);
    const result = await authService.logout(token);

    logger.info('User logged out', { token: token.substring(0, 10) + '...' });

    return c.json({
      success: result.success,
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout error', error as Error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
auth.post('/refresh', async (c) => {
  try {
    const { refresh_token } = await c.req.json();

    if (!refresh_token) {
      return c.json({
        success: false,
        error: 'Refresh token is required'
      }, 400);
    }

    const result = await authService.refreshToken(refresh_token);

    if (!result.success || !result.tokens) {
      return c.json({
        success: false,
        error: result.error || 'Token refresh failed'
      }, 401);
    }

    return c.json({
      success: true,
      token: result.tokens.accessToken,
      refresh_token: result.tokens.refreshToken,
      expires_at: result.tokens.expiresAt
    });
  } catch (error) {
    logger.error('Token refresh error', error as Error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

/**
 * POST /auth/reset-password
 * Send password reset email
 */
auth.post('/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
  try {
    const { email } = c.req.valid('json');

    const result = await authService.resetPassword(email);

    return c.json({
      success: result.success,
      message: result.success 
        ? 'Password reset email sent' 
        : 'If the email exists, a reset link has been sent'
    });
  } catch (error) {
    logger.error('Password reset error', error as Error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

/**
 * POST /auth/change-password
 * Change user password (requires authentication)
 */
auth.post('/change-password', zValidator('json', changePasswordSchema), async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        error: 'Missing authorization header'
      }, 401);
    }

    const token = authHeader.substring(7);
    const { currentPassword, newPassword } = c.req.valid('json');

    // Validate current token
    const validation = await authService.validateToken(token);
    if (!validation.valid || !validation.user) {
      return c.json({
        success: false,
        error: 'Invalid or expired token'
      }, 401);
    }

    const result = await authService.changePassword(
      validation.user.id,
      currentPassword,
      newPassword
    );

    if (!result.success) {
      return c.json({
        success: false,
        error: result.error || 'Password change failed'
      }, 400);
    }

    logger.info('Password changed', {
      userId: validation.user.id,
      organizationId: validation.user.organizationId
    });

    return c.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Password change error', error as Error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

/**
 * GET /auth/me
 * Get current user profile (requires authentication)
 */
auth.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        error: 'Missing authorization header'
      }, 401);
    }

    const token = authHeader.substring(7);
    const validation = await authService.validateToken(token);

    if (!validation.valid || !validation.user) {
      return c.json({
        success: false,
        error: 'Invalid or expired token'
      }, 401);
    }

    return c.json({
      success: true,
      user: validation.user
    });
  } catch (error) {
    logger.error('Get profile error', error as Error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

export default auth;
