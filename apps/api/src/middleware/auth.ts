import { createAuthService, type AuthService } from '@dashboard-link/auth';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { logger } from '../utils/logger.js';

// Type definitions for context variables
type Variables = {
  userId: string;
  userRole: string;
  organizationId: string;
  requestId?: string;
  authService: AuthService;
};

export type AuthContext = {
  Variables: Variables;
};

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

/**
 * Authentication middleware
 * Validates JWT token using auth abstraction layer
 */
export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Validate token using auth service
    const validation = await authService.validateToken(token);

    if (!validation.valid || !validation.user) {
      throw new HTTPException(401, { message: 'Invalid or expired token' });
    }

    // Set user context
    c.set('userId', validation.user.id);
    c.set('userRole', validation.user.role || 'user');
    c.set('organizationId', validation.user.organizationId || '');
    c.set('authService', authService);

    logger.info('User authenticated', {
      userId: validation.user.id,
      organizationId: validation.user.organizationId,
      requestId: c.get('requestId')
    });

    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    logger.error('Authentication error', error as Error);
    throw new HTTPException(401, { message: 'Authentication failed' });
  }
});

/**
 * Role-based authorization middleware
 */
export const requireRole = (roles: string[]) => {
  return createMiddleware(async (c, next) => {
    const userRole = c.get('userRole');

    if (!roles.includes(userRole)) {
      throw new HTTPException(403, { 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    await next();
  });
};

/**
 * Organization-based authorization middleware
 */
export const requireOrganization = (organizationId: string) => {
  return createMiddleware(async (c, next) => {
    const userOrganizationId = c.get('organizationId');

    if (userOrganizationId !== organizationId) {
      throw new HTTPException(403, { 
        message: 'Access denied. Organization access required' 
      });
    }

    await next();
  });
};

/**
 * Admin authorization middleware
 */
export const requireAdmin = requireRole(['admin', 'super_admin']);

/**
 * Super admin authorization middleware
 */
export const requireSuperAdmin = requireRole(['super_admin']);
