/**
 * Authentication Middleware
 * 
 * Express/Node.js middleware for authentication and authorization
 * Provides token validation, role-based access control, and session management
 */

import type {
    AuthErrorCode,
    AuthMiddleware,
    AuthNext,
    AuthRequest,
    AuthResponse,
    AuthService,
    AuthUser,
    UserRole
} from '@dashboard-link/shared';

export class AuthMiddlewareImpl implements AuthMiddleware {
  private authService: AuthService;
  private config: {
    tokenHeader?: string;
    cookieName?: string;
    skipPaths?: string[];
    enableSessionTracking?: boolean;
  };

  constructor(authService: AuthService, config: Record<string, unknown> = {}) {
    this.authService = authService;
    this.config = {
      tokenHeader: 'Authorization',
      cookieName: 'auth-token',
      skipPaths: ['/health', '/auth/login', '/auth/register', '/auth/reset-password'],
      enableSessionTracking: true,
      ...config
    };
  }

  async authenticate(req: AuthRequest, res: AuthResponse, next: AuthNext): Promise<void> {
    try {
      // Skip authentication for certain paths
      if (this.shouldSkipAuth(req)) {
        return next();
      }

      // Extract token from header or cookie
      const token = this.extractToken(req);
      if (!token) {
        return this.sendAuthError(res, 'MISSING_TOKEN', 'Authentication token required');
      }

      // Validate token
      let user: AuthUser;
      try {
        user = await this.authService.validateToken(token);
      } catch (error) {
        return this.sendAuthError(res, 'INVALID_TOKEN', 'Invalid or expired token');
      }

      // Attach user and session to request
      req.user = user;
      
      // Track session if enabled
      if (this.config.enableSessionTracking) {
        req.session = await this.trackSession(user.id, token);
      }

      // Set security headers
      this.setSecurityHeaders(res);

      next();

    } catch (error) {
      this.sendAuthError(res, 'PROVIDER_ERROR', 'Authentication service unavailable');
    }
  }

  authorize(roles: UserRole[]): (req: AuthRequest, res: AuthResponse, next: AuthNext) => Promise<void> {
    return async (req: AuthRequest, res: AuthResponse, next: AuthNext): Promise<void> => {
      try {
        if (!req.user) {
          return this.sendAuthError(res, 'UNAUTHORIZED', 'Authentication required');
        }

        // Check if user has required role
        if (!this.hasRole(req.user.role, roles)) {
          return this.sendAuthError(res, 'FORBIDDEN', 'Insufficient permissions');
        }

        next();

      } catch (error) {
        this.sendAuthError(res, 'PROVIDER_ERROR', 'Authorization check failed');
      }
    };
  }

  authorizeOrganization(organizationId: string): (req: AuthRequest, res: AuthResponse, next: AuthNext) => Promise<void> {
    return async (req: AuthRequest, res: AuthResponse, next: AuthNext): Promise<void> => {
      try {
        if (!req.user) {
          return this.sendAuthError(res, 'UNAUTHORIZED', 'Authentication required');
        }

        // Check if user belongs to the specified organization
        if (req.user.organizationId !== organizationId && req.user.role !== 'admin') {
          return this.sendAuthError(res, 'FORBIDDEN', 'Access to organization denied');
        }

        next();

      } catch (error) {
        this.sendAuthError(res, 'PROVIDER_ERROR', 'Organization authorization check failed');
      }
    };
  }

  // Utility methods
  private shouldSkipAuth(req: AuthRequest): boolean {
    const path = this.getPath(req);
    return this.config.skipPaths?.includes(path) || false;
  }

  private extractToken(req: AuthRequest): string | null {
    // Try Authorization header first
    const authHeader = req.headers[this.config.tokenHeader || 'Authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try cookie
    const cookieHeader = req.headers.cookie;
    if (cookieHeader && this.config.cookieName) {
      const cookies = this.parseCookies(cookieHeader);
      return cookies[this.config.cookieName] || null;
    }

    return null;
  }

  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = value;
      }
    });

    return cookies;
  }

  private async trackSession(userId: string, token: string): Promise<any> {
    try {
      const sessions = await this.authService.getUserSessions(userId);
      const currentSession = sessions.find(s => s.token === token);
      
      if (currentSession) {
        // Update last access time
        currentSession.lastAccessAt = new Date().toISOString();
        return currentSession;
      }

      return null;

    } catch (error) {
      return null;
    }
  }

  private hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    // Admin has access to everything
    if (userRole === 'admin') {
      return true;
    }

    // Check role hierarchy
    const roleHierarchy: Record<UserRole, number> = {
      admin: 4,
      manager: 3,
      worker: 2,
      guest: 1
    };

    const userLevel = roleHierarchy[userRole];
    return requiredRoles.some(role => roleHierarchy[role] <= userLevel);
  }

  private setSecurityHeaders(res: AuthResponse): void {
    // Set security headers
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  }

  private sendAuthError(res: AuthResponse, code: AuthErrorCode, message: string): void {
    res.status(401).json({
      success: false,
      error: message,
      errorCode: code,
      timestamp: new Date().toISOString()
    });
  }

  private getPath(req: AuthRequest): string {
    // Extract path from request (implementation depends on framework)
    const reqObj = req as unknown as Record<string, unknown>;
    return (reqObj.path as string) || (reqObj.url as string) || '/';
  }
}

// Factory functions for common middleware patterns
export function createAuthMiddleware(authService: AuthService, config?: Record<string, unknown>): AuthMiddleware {
  return new AuthMiddlewareImpl(authService, config);
}

export function requireAuth(authService: AuthService, config?: Record<string, unknown>) {
  const middleware = createAuthMiddleware(authService, config);
  return middleware.authenticate.bind(middleware);
}

export function requireRole(roles: UserRole[], authService: AuthService, config?: Record<string, unknown>) {
  const middleware = createAuthMiddleware(authService, config);
  return middleware.authorize(roles).bind(middleware);
}

export function requireOrganization(organizationId: string, authService: AuthService, config?: Record<string, unknown>) {
  const middleware = createAuthMiddleware(authService, config);
  return middleware.authorizeOrganization(organizationId).bind(middleware);
}

// Express.js specific implementation
export class ExpressAuthMiddleware extends AuthMiddlewareImpl {
  constructor(authService: AuthService, config?: Record<string, unknown>) {
    super(authService, config);
  }

  // Express-specific middleware
  expressAuthenticate() {
    return async (req: any, res: any, next: any): Promise<void> => {
      const authReq: AuthRequest = {
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params,
        path: req.path,
        url: req.url
      };

      const authRes: AuthResponse = {
        status: (code: number) => {
          res.status(code);
          return authRes;
        },
        json: (data: unknown) => {
          res.json(data);
        },
        send: (data: string) => {
          res.send(data);
        },
        cookie: (name: string, value: string, options?: any) => {
          res.cookie(name, value, options);
        },
        clearCookie: (name: string, options?: any) => {
          res.clearCookie(name, options);
        },
        header: (name: string, value: string) => {
          res.set(name, value);
        }
      };

      await this.authenticate(authReq, authRes, next);
    };
  }

  expressAuthorize(roles: UserRole[]) {
    return async (req: any, res: any, next: any): Promise<void> => {
      const authReq: AuthRequest = {
        user: req.user,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params
      };

      const authRes: AuthResponse = {
        status: (code: number) => {
          res.status(code);
          return authRes;
        },
        json: (data: unknown) => {
          res.json(data);
        },
        send: (data: string) => {
          res.send(data);
        },
        cookie: (name: string, value: string, options?: any) => {
          res.cookie(name, value, options);
        },
        clearCookie: (name: string, options?: any) => {
          res.clearCookie(name, options);
        },
        header: (name: string, value: string) => {
          res.set(name, value);
        }
      };

      await this.authorize(roles)(authReq, authRes, next);
    };
  }

  expressAuthorizeOrganization(organizationId: string) {
    return async (req: any, res: any, next: any): Promise<void> => {
      const authReq: AuthRequest = {
        user: req.user,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params
      };

      const authRes: AuthResponse = {
        status: (code: number) => {
          res.status(code);
          return authRes;
        },
        json: (data: unknown) => {
          res.json(data);
        },
        send: (data: string) => {
          res.send(data);
        },
        cookie: (name: string, value: string, options?: any) => {
          res.cookie(name, value, options);
        },
        clearCookie: (name: string, options?: any) => {
          res.clearCookie(name, options);
        },
        header: (name: string, value: string) => {
          res.set(name, value);
        }
      };

      await this.authorizeOrganization(organizationId)(authReq, authRes, next);
    };
  }
}

// Utility functions for Express.js
export function createExpressAuthMiddleware(authService: AuthService, config?: any): ExpressAuthMiddleware {
  return new ExpressAuthMiddleware(authService, config);
}

export function expressRequireAuth(authService: AuthService, config?: any) {
  const middleware = createExpressAuthMiddleware(authService, config);
  return middleware.expressAuthenticate();
}

export function expressRequireRole(roles: UserRole[], authService: AuthService, config?: any) {
  const middleware = createExpressAuthMiddleware(authService, config);
  return middleware.expressAuthorize(roles);
}

export function expressRequireOrganization(organizationId: string, authService: AuthService, config?: any) {
  const middleware = createExpressAuthMiddleware(authService, config);
  return middleware.expressAuthorizeOrganization(organizationId);
}
