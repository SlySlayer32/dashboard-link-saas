import { Context } from 'hono';

// Hono Environment Types
export interface HonoEnv {
  Variables: {
    userId: string;
    userRole: 'admin' | 'worker';
    organizationId: string;
  };
  Bindings: {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_KEY: string;
    DATABASE_URL: string;
    SMS_API_KEY: string;
    JWT_SECRET: string;
  };
}

// Typed Context for use in routes and middleware
export type TypedContext = Context<HonoEnv>;

// Auth middleware context
export interface AuthContext {
  userId: string;
  userRole: 'admin' | 'worker';
  organizationId: string;
}

// Request context for logging
export interface RequestContext {
  requestId: string;
  method: string;
  url: string;
  userId?: string;
  organizationId?: string;
  userAgent?: string;
  ip?: string;
}

// Error context for structured error handling
export interface ErrorContext {
  requestId: string;
  userId?: string;
  organizationId?: string;
  action?: string;
  resource?: string;
}
