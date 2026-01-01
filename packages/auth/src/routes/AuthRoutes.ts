/**
 * Authentication Routes
 * 
 * Express.js routes for authentication endpoints
 * Provides login, logout, refresh, and user management endpoints
 */

import type { AuthCredentials, AuthService } from '@dashboard-link/shared';
import { Router } from 'express';
import { createExpressAuthMiddleware } from '../middleware/AuthMiddleware';

export function createAuthRoutes(authService: AuthService): Router {
  const router = Router();
  const authMiddleware = createExpressAuthMiddleware(authService);

  // POST /auth/login
  router.post('/login', async (req, res, next) => {
    try {
      const credentials: AuthCredentials = req.body;

      // Validate required fields
      if (!credentials.email || !credentials.password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required',
          errorCode: 'VALIDATION_ERROR'
        });
      }

      const result = await authService.login(credentials);

      if (result.success) {
        // Set secure HTTP-only cookie with refresh token
        if (result.refreshToken) {
          res.cookie('refresh-token', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: '/'
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            user: result.user,
            token: result.token,
            expiresAt: result.expiresAt
          }
        });
      } else {
        return res.status(401).json({
          success: false,
          error: result.error,
          errorCode: result.errorCode
        });
      }

    } catch (error) {
      next(error);
    }
  });

  // POST /auth/logout
  router.post('/logout', authMiddleware.expressAuthenticate(), async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const refreshToken = req.cookies['refresh-token'];

      if (userId) {
        await authService.logout(userId, req.session?.id);
      }

      // Clear refresh token cookie
      res.clearCookie('refresh-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      next(error);
    }
  });

  // POST /auth/refresh
  router.post('/refresh', async (req, res, next) => {
    try {
      // Get refresh token from cookie or body
      const refreshToken = req.cookies['refresh-token'] || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token required',
          errorCode: 'MISSING_TOKEN'
        });
      }

      const result = await authService.refreshToken(refreshToken);

      if (result.success) {
        // Update refresh token cookie
        if (result.refreshToken) {
          res.cookie('refresh-token', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: '/'
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            user: result.user,
            token: result.token,
            expiresAt: result.expiresAt
          }
        });
      } else {
        // Clear invalid refresh token cookie
        res.clearCookie('refresh-token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/'
        });

        return res.status(401).json({
          success: false,
          error: result.error,
          errorCode: result.errorCode
        });
      }

    } catch (error) {
      next(error);
    }
  });

  // POST /auth/reset-password-request
  router.post('/reset-password-request', async (req, res, next) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required',
          errorCode: 'VALIDATION_ERROR'
        });
      }

      const success = await authService.sendPasswordReset(email);

      // Always return success to prevent email enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });

    } catch (error) {
      next(error);
    }
  });

  // POST /auth/reset-password
  router.post('/reset-password', async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Token and new password are required',
          errorCode: 'VALIDATION_ERROR'
        });
      }

      const result = await authService.resetPassword(token, newPassword);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'Password reset successfully'
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.error,
          errorCode: result.errorCode
        });
      }

    } catch (error) {
      next(error);
    }
  });

  // GET /auth/me
  router.get('/me', authMiddleware.expressAuthenticate(), async (req, res, next) => {
    try {
      return res.status(200).json({
        success: true,
        data: {
          user: req.user
        }
      });

    } catch (error) {
      next(error);
    }
  });

  // PUT /auth/profile
  router.put('/profile', authMiddleware.expressAuthenticate(), async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const updates = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          errorCode: 'UNAUTHORIZED'
        });
      }

      const result = await authService.updateProfile(userId, updates);

      if (result.success) {
        return res.status(200).json({
          success: true,
          data: {
            user: result.user
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.error,
          errorCode: result.errorCode
        });
      }

    } catch (error) {
      next(error);
    }
  });

  // PUT /auth/change-password
  router.put('/change-password', authMiddleware.expressAuthenticate(), async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          errorCode: 'UNAUTHORIZED'
        });
      }

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password and new password are required',
          errorCode: 'VALIDATION_ERROR'
        });
      }

      const result = await authService.changePassword(userId, currentPassword, newPassword);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'Password changed successfully'
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.error,
          errorCode: result.errorCode
        });
      }

    } catch (error) {
      next(error);
    }
  });

  // GET /auth/sessions
  router.get('/sessions', authMiddleware.expressAuthenticate(), async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          errorCode: 'UNAUTHORIZED'
        });
      }

      const sessions = await authService.getUserSessions(userId);

      return res.status(200).json({
        success: true,
        data: {
          sessions: sessions.map(session => ({
            id: session.id,
            createdAt: session.createdAt,
            lastAccessAt: session.lastAccessAt,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            isCurrent: session.id === req.session?.id
          }))
        }
      });

    } catch (error) {
      next(error);
    }
  });

  // DELETE /auth/sessions/:sessionId
  router.delete('/sessions/:sessionId', authMiddleware.expressAuthenticate(), async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const { sessionId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          errorCode: 'UNAUTHORIZED'
        });
      }

      await authService.revokeSession(userId, sessionId);

      return res.status(200).json({
        success: true,
        message: 'Session revoked successfully'
      });

    } catch (error) {
      next(error);
    }
  });

  // DELETE /auth/sessions
  router.delete('/sessions', authMiddleware.expressAuthenticate(), async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          errorCode: 'UNAUTHORIZED'
        });
      }

      await authService.revokeAllSessions(userId);

      return res.status(200).json({
        success: true,
        message: 'All sessions revoked successfully'
      });

    } catch (error) {
      next(error);
    }
  });

  // GET /auth/health
  router.get('/health', async (req, res, next) => {
    try {
      const isHealthy = await authService.healthCheck();

      return res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        service: 'authentication',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  });

  return router;
}

// Admin routes (require admin role)
export function createAdminAuthRoutes(authService: AuthService): Router {
  const router = Router();
  const authMiddleware = createExpressAuthMiddleware(authService);

  // All admin routes require admin role
  router.use(authMiddleware.expressAuthorize(['admin']));

  // POST /admin/auth/users
  router.post('/users', async (req, res, next) => {
    try {
      const userData = req.body;

      // Note: This would need to be implemented in the AuthService
      return res.status(501).json({
        success: false,
        error: 'User creation not implemented',
        errorCode: 'NOT_IMPLEMENTED'
      });

    } catch (error) {
      next(error);
    }
  });

  // GET /admin/auth/users/:userId
  router.get('/users/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params;

      // Note: This would need to be implemented in the AuthService
      return res.status(501).json({
        success: false,
        error: 'User retrieval not implemented',
        errorCode: 'NOT_IMPLEMENTED'
      });

    } catch (error) {
      next(error);
    }
  });

  // PUT /admin/auth/users/:userId/disable
  router.put('/users/:userId/disable', async (req, res, next) => {
    try {
      const { userId } = req.params;

      // Note: This would need to be implemented in the AuthService
      return res.status(501).json({
        success: false,
        error: 'User disable not implemented',
        errorCode: 'NOT_IMPLEMENTED'
      });

    } catch (error) {
      next(error);
    }
  });

  return router;
}
